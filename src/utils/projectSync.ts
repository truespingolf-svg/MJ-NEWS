import { NewspaperProject } from '../types/newspaper.ts';

export interface PendingSaveEntry {
  project: NewspaperProject;
  updatedMs: number;
  inFlight: boolean;
}

export interface PendingDeleteEntry {
  timestamp: number;
  inFlight: boolean;
}

export interface ProjectSyncState {
  pendingSaves: Map<string, PendingSaveEntry>;
  localOnlyIds: Set<string>;
  pendingDeletes: Map<string, PendingDeleteEntry>;
  deletedAllAt: number | null;
}

export function createProjectSyncState(): ProjectSyncState {
  return {
    pendingSaves: new Map(),
    localOnlyIds: new Set(),
    pendingDeletes: new Map(),
    deletedAllAt: null,
  };
}

export function parseIsoMs(iso?: string): number {
  if (!iso) return 0;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function markLocalSaveStarted(
  state: ProjectSyncState,
  project: NewspaperProject,
  nowMs: number = Date.now()
): NewspaperProject {
  const updatedIso = new Date(Math.max(nowMs, parseIsoMs(project.updatedAt))).toISOString();
  const updatedProject: NewspaperProject = {
    ...project,
    updatedAt: updatedIso,
  };
  const updatedMs = parseIsoMs(updatedIso);

  state.pendingDeletes.delete(project.id);
  state.pendingSaves.set(project.id, {
    project: updatedProject,
    updatedMs,
    inFlight: true,
  });

  return updatedProject;
}

export function markLocalSaveSettled(
  state: ProjectSyncState,
  projectId: string,
  writeUpdatedMs: number,
  succeeded: boolean
): void {
  const entry = state.pendingSaves.get(projectId);
  if (!entry) return;

  // Ignore stale completion if a newer local save started after this one
  if (entry.updatedMs > writeUpdatedMs) return;

  entry.inFlight = false;
  if (!succeeded) {
    state.localOnlyIds.add(projectId);
  }
}

export function markLocalDeleteStarted(
  state: ProjectSyncState,
  projectId: string,
  nowMs: number = Date.now()
): void {
  state.pendingSaves.delete(projectId);
  state.localOnlyIds.delete(projectId);
  state.pendingDeletes.set(projectId, {
    timestamp: nowMs,
    inFlight: true,
  });
}

export function markLocalDeleteSettled(
  state: ProjectSyncState,
  projectId: string,
  succeeded: boolean
): void {
  const entry = state.pendingDeletes.get(projectId);
  if (!entry) return;
  entry.inFlight = false;
  if (!succeeded) {
    // Keep tombstone for a longer grace period so failed/offline delete isn't immediately undone
    entry.timestamp = Date.now();
  }
}

export function markDeleteAllStarted(
  state: ProjectSyncState,
  knownIds: string[],
  nowMs: number = Date.now()
): void {
  state.pendingSaves.clear();
  state.localOnlyIds.clear();
  state.deletedAllAt = nowMs;
  for (const id of knownIds) {
    if (id) {
      state.pendingDeletes.set(id, {
        timestamp: nowMs,
        inFlight: true,
      });
    }
  }
}

export function markDeleteAllSettled(
  state: ProjectSyncState,
  deletedIds: string[],
  succeeded: boolean
): void {
  for (const id of deletedIds) {
    const entry = state.pendingDeletes.get(id);
    if (entry) {
      entry.inFlight = false;
      if (!succeeded) {
        entry.timestamp = Date.now();
      }
    }
  }
}

/**
 * Returns true if an async Firestore write should abort because the project
 * was deleted or superseded locally before the write completed.
 */
export function shouldAbortPendingWrite(
  state: ProjectSyncState,
  projectId: string,
  writeUpdatedMs: number
): boolean {
  if (state.pendingDeletes.has(projectId)) {
    return true;
  }
  if (state.deletedAllAt !== null && writeUpdatedMs <= state.deletedAllAt) {
    return true;
  }
  const latestPending = state.pendingSaves.get(projectId);
  if (latestPending && latestPending.updatedMs > writeUpdatedMs) {
    return true;
  }
  return false;
}

const DELETE_TOMBSTONE_TTL_MS = 30_000;

/**
 * Reconciles a remote Firestore snapshot against in-flight local saves,
 * local-only oversized/offline projects, and delete tombstones so that
 * snapshots never wipe newly created/saved papers or resurrect deleted ones.
 */
export function reconcileProjectsSnapshot(
  remoteProjects: NewspaperProject[],
  state: ProjectSyncState,
  nowMs: number = Date.now()
): NewspaperProject[] {
  const remoteIds = new Set(remoteProjects.map((p) => p.id));

  // Settle delete tombstones once remote snapshot confirms the doc is gone (and delete isn't in flight)
  for (const [id, del] of Array.from(state.pendingDeletes.entries())) {
    if (!del.inFlight && (!remoteIds.has(id) || nowMs - del.timestamp > DELETE_TOMBSTONE_TTL_MS)) {
      state.pendingDeletes.delete(id);
    }
  }

  // Clear deletedAllAt once remote confirms empty or older than TTL
  if (state.deletedAllAt !== null) {
    const hasAnyPreDeleteDoc = remoteProjects.some(
      (p) => parseIsoMs(p.updatedAt) <= (state.deletedAllAt as number)
    );
    if (!hasAnyPreDeleteDoc || nowMs - state.deletedAllAt > DELETE_TOMBSTONE_TTL_MS) {
      state.deletedAllAt = null;
    }
  }

  const mergedById = new Map<string, NewspaperProject>();

  for (const remoteProj of remoteProjects) {
    if (!remoteProj || !remoteProj.id) continue;

    // Never resurrect projects with active delete tombstones
    if (state.pendingDeletes.has(remoteProj.id)) {
      continue;
    }

    const remoteMs = parseIsoMs(remoteProj.updatedAt);

    // Never resurrect older docs caught mid-Delete-All
    if (state.deletedAllAt !== null && remoteMs > 0 && remoteMs <= state.deletedAllAt) {
      continue;
    }

    const pending = state.pendingSaves.get(remoteProj.id);
    if (pending) {
      if (!pending.inFlight && remoteMs >= pending.updatedMs) {
        // Remote has caught up to our local save
        state.pendingSaves.delete(remoteProj.id);
        state.localOnlyIds.delete(remoteProj.id);
        mergedById.set(remoteProj.id, remoteProj);
      } else {
        // Local pending save is newer or still in-flight; keep local copy
        mergedById.set(remoteProj.id, pending.project);
      }
      continue;
    }

    mergedById.set(remoteProj.id, remoteProj);
  }

  // Re-attach any pending saves or local-only saves not yet present in remote snapshot
  for (const [id, pending] of state.pendingSaves.entries()) {
    if (state.pendingDeletes.has(id)) continue;
    if (!mergedById.has(id)) {
      mergedById.set(id, pending.project);
    }
  }

  return Array.from(mergedById.values()).sort(
    (a, b) => parseIsoMs(b.updatedAt) - parseIsoMs(a.updatedAt)
  );
}
