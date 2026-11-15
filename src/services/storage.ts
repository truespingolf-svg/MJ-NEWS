import { NewspaperProject } from '../types/newspaper.ts';
import {
  getReconciledProjects,
  readProjectsLocalCache,
  saveProjectFirestore,
  deleteProjectFirestore,
  deleteAllProjectsFirestore,
} from './firestoreStorage.ts';

const ACTIVE_PROJECT_KEY = 'mj_newspaper_studio_active_id_v1';

/**
 * Loads all saved projects from reconciled local/Firestore cache without
 * attaching competing top-level listeners.
 */
export function loadAllProjects(): NewspaperProject[] {
  const reconciled = getReconciledProjects();
  if (reconciled && reconciled.length > 0) {
    return reconciled;
  }
  return readProjectsLocalCache();
}

/**
 * Saves or updates a project immediately to local cache and asynchronously to Firebase Firestore.
 */
export function saveProject(project: NewspaperProject): NewspaperProject {
  const updated: NewspaperProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  saveProjectFirestore(updated).catch((err) =>
    console.error('Firestore save project error:', err)
  );
  return updated;
}

/**
 * Gets a single project by ID.
 */
export function getProjectById(id: string): NewspaperProject | null {
  const all = loadAllProjects();
  return all.find((p) => p.id === id) || null;
}

/**
 * Gets the last active project or the first project available.
 */
export function getActiveProject(): NewspaperProject | null {
  const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
  const all = loadAllProjects();
  if (activeId) {
    const found = all.find((p) => p.id === activeId);
    if (found) return found;
  }
  return all[0] || null;
}

/**
 * Sets the active project ID.
 */
export function setActiveProjectId(id: string) {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } catch {
    // ignore
  }
}

/**
 * Duplicates an entire project on the dashboard and syncs to Firestore.
 */
export function duplicateProject(projectId: string): NewspaperProject | null {
  const original = getProjectById(projectId);
  if (!original) return null;

  const now = new Date().toISOString();
  const newProject: NewspaperProject = {
    ...original,
    id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: `${original.title} (Copy)`,
    createdAt: now,
    updatedAt: now,
    pages: original.pages.map((p, idx) => ({
      ...p,
      id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 5)}-${idx}`,
    })),
  };

  return saveProject(newProject);
}

/**
 * Deletes a project by ID and syncs deletion cleanly to Firestore.
 */
export function deleteProject(projectId: string): NewspaperProject[] {
  const remaining = loadAllProjects().filter((p) => p.id !== projectId);
  deleteProjectFirestore(projectId).catch((err) =>
    console.error('Firestore delete project error:', err)
  );

  if (remaining.length === 0) {
    try {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    } catch {
      // ignore
    }
    return [];
  }

  const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
  if (activeId === projectId && remaining.length > 0) {
    setActiveProjectId(remaining[0].id);
  }
  return remaining;
}

/**
 * Deletes ALL newspaper projects from local cache & Firestore cleanly.
 */
export async function deleteAllProjects(): Promise<NewspaperProject[]> {
  const existingIds = loadAllProjects().map((p) => p.id);
  await deleteAllProjectsFirestore(existingIds).catch((err) =>
    console.error('Firestore delete all projects error:', err)
  );
  return [];
}

/**
 * Exports project as downloadable JSON backup.
 */
export function exportProjectToJson(project: NewspaperProject) {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_newspaper.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
