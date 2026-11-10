import React, { useState } from 'react';
import { UserProfile, voteForUser, subscribeVotingConfig } from '../../services/firestoreStorage.ts';
import {
  Trophy,
  Award,
  ThumbsUp,
  Star,
  Users,
  CheckCircle2,
  Sparkles,
  Crown,
  Medal,
  ExternalLink,
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

  React.useEffect(() => {
    const unsub = subscribeVotingConfig((config) => {
      setPointsPerVote(config.pointsPerVote);
    });
    return () => unsub();
  }, []);

  const handleVote = async (targetUser: UserProfile) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (currentUser.uid === targetUser.uid) {
      setVoteFeedback("You can't vote for yourself! Vote for other community members to reward them.");
      setTimeout(() => setVoteFeedback(null), 3000);
      return;
    }

    setVotingTargetId(targetUser.uid);
    try {
      const res = await voteForUser(currentUser.uid, targetUser.uid);
      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#EAB308', '#D97706', '#10B981', '#FFFFFF'],
        });
        setVoteFeedback(res.message);
        setTimeout(() => setVoteFeedback(null), 4000);
      } else {
        setVoteFeedback(res.message);
        setTimeout(() => setVoteFeedback(null), 3500);
      }
    } catch (e) {
      console.error('Vote error:', e);
    } finally {
      setVotingTargetId(null);
    }
  };

  const hasVotedFor = (targetUid: string) => {
    return (currentUser?.votedUserIds || []).includes(targetUid);
  };

  return (
    <section className="bg-gradient-to-br from-[#12121c] via-[#0d0d14] to-[#14141e] border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 -mt-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>COMMUNITY VOTE &amp; REWARD STANDINGS</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif font-black text-white">
            Official Community Leaderboard
          </h3>
          <p className="text-xs text-neutral-400 max-w-xl">
            Ranked by points balance and community votes. Each vote awards{' '}
            <strong className="text-amber-300 font-mono">+{pointsPerVote.toLocaleString()} PTS</strong> to the player!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-2xl text-right">
            <div className="text-[10px] text-neutral-500 font-mono uppercase">Registered Members</div>
            <div className="text-sm font-mono font-bold text-amber-400">{users.length} Players</div>
          </div>
        </div>
      </div>

      {voteFeedback && (
        <div className="p-3.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-2xl text-xs font-medium flex items-center gap-2 animate-fade-in shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{voteFeedback}</span>
        </div>
      )}

      {/* Leaderboard Table / Cards */}
      {users.length === 0 ? (
        <div className="p-12 text-center text-xs text-neutral-500 font-mono border border-dashed border-neutral-800 rounded-2xl">
          No registered players yet. Sign in with Google at the top to enter the leaderboard and earn points!
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((player, idx) => {
            const rank = idx + 1;
            const isTop1 = rank === 1;
            const isTop2 = rank === 2;
            const isTop3 = rank === 3;
            const isSelf = currentUser?.uid === player.uid;
            const votedAlready = hasVotedFor(player.uid);

            return (
              <div
                key={player.uid}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isTop1
                    ? 'bg-gradient-to-r from-amber-950/40 via-neutral-900 to-[#191924] border-amber-500/60 shadow-lg shadow-amber-500/10'
                    : isTop2
                    ? 'bg-neutral-900/90 border-neutral-700 hover:border-amber-500/40'
                    : isTop3
                    ? 'bg-neutral-900/80 border-neutral-800 hover:border-amber-500/30'
                    : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                {/* Left: Rank & User Avatar/Info */}
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-mono font-black text-sm shrink-0">
                    {isTop1 ? (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Crown className="w-5 h-5 fill-black" />
                      </div>
                    ) : isTop2 ? (
                      <div className="w-9 h-9 rounded-xl bg-slate-300 text-black flex items-center justify-center font-bold">
                        #2
                      </div>
                    ) : isTop3 ? (
                      <div className="w-9 h-9 rounded-xl bg-amber-700 text-amber-100 flex items-center justify-center font-bold">
                        #3
                      </div>
                    ) : (
                      <span className="text-neutral-500 font-bold">#{rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  {player.photoURL ? (
                    <img
                      src={player.photoURL}
                      alt={player.displayName || 'Player'}
                      className="w-11 h-11 rounded-full border-2 border-amber-500/30 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 font-bold text-base shrink-0">
                      {(player.displayName || 'U')[0].toUpperCase()}
                    </div>
                  )}

                  {/* Player Name & Discord */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {player.displayName || 'Anonymous Member'}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                          YOU
                        </span>
                      )}
                      {isTop1 && (
                        <span className="text-[10px] font-mono font-bold bg-amber-400 text-black px-2 py-0.5 rounded-full">
                          TOP MOONWALKER
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mt-0.5">
                      <span>{player.discordUser ? `@${player.discordUser}` : '(No Discord linked)'}</span>
                      {player.tickets?.length > 0 && (
                        <span className="text-neutral-500 text-[10px]">
                          • {player.tickets.length} VIP {player.tickets.length === 1 ? 'Pass' : 'Passes'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Points, Votes & Vote Button */}
                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                  {/* Stats */}
                  <div className="text-left sm:text-right">
                    <div className="text-base font-mono font-black text-amber-300">
                      {(player.points || 0).toLocaleString()} <span className="text-xs font-semibold text-neutral-400">PTS</span>
                    </div>
                    <div className="text-xs font-mono text-neutral-400 flex items-center gap-1 sm:justify-end">
                      <ThumbsUp className="w-3 h-3 text-emerald-400" />
                      <span>{player.votes || 0} Votes</span>
                    </div>
                  </div>

                  {/* Vote Button */}
                  <button
                    onClick={() => handleVote(player)}
                    disabled={isSelf || votedAlready || votingTargetId === player.uid}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 shrink-0 ${
                      votedAlready
                        ? 'bg-neutral-900 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : isSelf
                        ? 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-md shadow-emerald-500/20 active:scale-95'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>
                      {votedAlready
                        ? 'Voted ✓'
                        : isSelf
                        ? 'Your Profile'
                        : `+1 Vote (+${pointsPerVote.toLocaleString()} Pts)`}
                    </span>
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
