export const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export interface VoterCooldownFields {
  lastVoteTimestamp?: number | null;
  lastVotedMap?: Record<string, number> | null;
}

export interface GlobalVoteCooldownStatus {
  canVote: boolean;
  lastVoteAt: number;
  remainingMs: number;
  nextAvailableAt: number | null;
}

export function getLastVoteTimestamp(voter?: VoterCooldownFields | null): number {
  if (!voter) return 0;
  let latest = typeof voter.lastVoteTimestamp === 'number' && Number.isFinite(voter.lastVoteTimestamp)
    ? voter.lastVoteTimestamp
    : 0;

  if (voter.lastVotedMap && typeof voter.lastVotedMap === 'object') {
    for (const val of Object.values(voter.lastVotedMap)) {
      if (typeof val === 'number' && Number.isFinite(val) && val > latest) {
        latest = val;
      }
    }
  }

  return latest > 0 ? latest : 0;
}

export function getGlobalVoteCooldown(
  voter?: VoterCooldownFields | null,
  nowMs: number = Date.now()
): GlobalVoteCooldownStatus {
  const lastVoteAt = getLastVoteTimestamp(voter);
  if (lastVoteAt <= 0) {
    return {
      canVote: true,
      lastVoteAt: 0,
      remainingMs: 0,
      nextAvailableAt: null,
    };
  }

  const elapsed = nowMs - lastVoteAt;
  if (elapsed >= TWO_HOURS_MS) {
    return {
      canVote: true,
      lastVoteAt,
      remainingMs: 0,
      nextAvailableAt: null,
    };
  }

  const remainingMs = Math.max(0, TWO_HOURS_MS - elapsed);
  return {
    canVote: false,
    lastVoteAt,
    remainingMs,
    nextAvailableAt: lastVoteAt + TWO_HOURS_MS,
  };
}

export function formatCooldownDuration(ms: number): string {
  const clamped = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}
