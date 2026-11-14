import React, { useState, useEffect } from 'react';
import { UserProfile, voteForUser, subscribeVotingConfig } from '../../services/firestoreStorage.ts';
import { getGlobalVoteCooldown, formatCooldownDuration } from '../../utils/votingCooldown.ts';
import {
  Trophy,
  ThumbsUp,
  Clock,
  Crown,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CommunityLeaderboardSectionProps {
  users: UserProfile[];
  currentUser: UserProfile | null;
  onRequireAuth: () => void;
}

export const CommunityLeaderboardSection: React.FC<CommunityLeaderboardSectionProps> = ({
  users,
  currentUser,
  onRequireAuth,
}) => {
  const [votingTargetId, setVotingTargetId] = useState<string | null>(null);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);
  const [pointsPerVote, setPointsPerVote] = useState<number>(1000);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const unsub = subscribeVotingConfig((config) => {
      setPointsPerVote(config.pointsPerVote);
    });
    return () => unsub();
  }, []);

  const cooldown = getGlobalVoteCooldown(currentUser, nowMs);

  // Tick every second while voter is inside their 2-hour cooldown window
  useEffect(() => {
    if (cooldown.canVote) return;
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown.canVote]);

  const handleVote = async (targetUser: UserProfile) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (currentUser.uid === targetUser.uid) {
      setVoteFeedback("You can't vote for yourself. Support another community member instead.");
      setTimeout(() => setVoteFeedback(null), 3500);
      return;
    }

    const latestCooldown = getGlobalVoteCooldown(currentUser, Date.now());
    if (!latestCooldown.canVote) {
      setVoteFeedback(
        `You can only vote for 1 person every 2 hours. Next vote ready in ${formatCooldownDuration(latestCooldown.remainingMs)}.`
      );
      setTimeout(() => setVoteFeedback(null), 4000);
      return;
    }

    setVotingTargetId(targetUser.uid);
    try {
      const res = await voteForUser(currentUser.uid, targetUser.uid);
      setNowMs(Date.now());
      if (res.success) {
        try {
          confetti({
            particleCount: 90,
            spread: 65,
            origin: { y: 0.6 },
            colors: ['#EAB308', '#EF4444', '#10B981', '#FFFFFF'],
          });
        } catch {
          // ignore
        }
      }
      setVoteFeedback(res.message);
      setTimeout(() => setVoteFeedback(null), 4500);
    } catch (e) {
      console.error('Vote error:', e);
    } finally {
      setVotingTargetId(null);
    }
  };

  return (
    <section className="bg-[#0d0d11] border border-neutral-800/90 rounded-2xl p-5 sm:p-7 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
            <Trophy className="w-3.5 h-3.5" />
            <span>Community Leaderboard</span>
            <span className="text-neutral-600" aria-hidden="true">·</span>
            <span className="text-neutral-400">1 Vote Every 2 Hours</span>
          </div>
          <h3 className="text-2xl font-serif font-black text-white tracking-tight">
            Official Community Standings
          </h3>
          <p className="text-xs text-neutral-400">
            Support one member every 2 hours. Each vote awards{' '}
            <span className="text-amber-300 font-mono font-semibold tabular-nums">
              +{pointsPerVote.toLocaleString()} PTS
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
          {currentUser && !cooldown.canVote ? (
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2 tabular-nums">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Next vote in {formatCooldownDuration(cooldown.remainingMs)}</span>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Registered Players</div>
              <div className="text-sm font-bold text-white tabular-nums">{users.length} Members</div>
            </div>
          )}
        </div>
      </div>

      {voteFeedback && (
        <div className="px-4 py-3 bg-neutral-900 border border-amber-500/40 text-amber-200 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-panel-reveal">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{voteFeedback}</span>
        </div>
      )}

      {/* Leaderboard List */}
      {users.length === 0 ? (
        <div className="p-10 text-center text-xs text-neutral-500 font-mono border border-dashed border-neutral-800 rounded-xl">
          No registered players yet. Sign in to enter the standings and cast your 2-hour vote.
        </div>
      ) : (
        <div className="space-y-2.5">
          {users.map((player, idx) => {
            const rank = idx + 1;
            const isTop1 = rank === 1;
            const isSelf = currentUser?.uid === player.uid;
            const isLockedOut = Boolean(currentUser && !cooldown.canVote);

            return (
              <div
                key={player.uid}
                className={`interactive-card p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isTop1
                    ? 'bg-[#14110b] border-amber-500/40'
                    : 'bg-neutral-950/70 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                {/* Left: Rank & Player Identity */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 tabular-nums">
                    {isTop1 ? (
                      <div className="w-9 h-9 rounded-lg bg-amber-500 text-black flex items-center justify-center">
                        <Crown className="w-4 h-4" />
                      </div>
                    ) : (
                      <span className="text-neutral-400">#{rank}</span>
                    )}
                  </div>

                  {player.photoURL ? (
                    <img
                      src={player.photoURL}
                      alt={player.displayName || 'Player'}
                      className="w-10 h-10 rounded-full border border-neutral-700 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-300 font-bold text-sm shrink-0">
                      {(player.displayName || 'U')[0].toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-sm text-white truncate">
                        {player.displayName || 'Community Member'}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                          · You
                        </span>
                      )}
                      {isTop1 && (
                        <span className="text-[10px] font-mono text-amber-300 uppercase tracking-wider">
                          · #1 Leader
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-mono text-neutral-400 truncate mt-0.5">
                      <span>{player.discordUser ? `@${player.discordUser}` : 'No Discord linked'}</span>
                      {player.tickets?.length > 0 && (
                        <span className="text-neutral-500">
                          {' '}· {player.tickets.length} VIP {player.tickets.length === 1 ? 'Pass' : 'Passes'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Stats & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/80 shrink-0">
                  <div className="text-left sm:text-right tabular-nums">
                    <div className="text-sm font-mono font-bold text-amber-300">
                      {(player.points || 0).toLocaleString()} <span className="text-[10px] text-neutral-500">PTS</span>
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1 sm:justify-end">
                      <ThumbsUp className="w-3 h-3 text-emerald-400" />
                      <span>{player.votes || 0} votes</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVote(player)}
                    disabled={isSelf || isLockedOut || votingTargetId === player.uid}
                    title={
                      isSelf
                        ? 'You cannot vote for yourself'
                        : isLockedOut
                        ? `1 vote allowed every 2 hours (${formatCooldownDuration(cooldown.remainingMs)} left)`
                        : `Cast vote (+${pointsPerVote.toLocaleString()} PTS)`
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0 tabular-nums ${
                      isSelf
                        ? 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                        : isLockedOut
                        ? 'bg-neutral-900 text-neutral-400 border border-neutral-800 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95 cursor-pointer'
                    }`}
                  >
                    {isLockedOut && !isSelf ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{formatCooldownDuration(cooldown.remainingMs)}</span>
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>
                          {votingTargetId === player.uid
                            ? 'Voting...'
                            : isSelf
                            ? 'Your Profile'
                            : 'Vote +1'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
