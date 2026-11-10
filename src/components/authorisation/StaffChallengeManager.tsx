import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  Sparkles,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Crown,
  Trash2,
  Lock,
  Unlock,
  Users,
  ChevronDown,
  ChevronUp,
  Award,
  ExternalLink,
  Flame,
  Star,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CommunityChallenge,
  ChallengeEntry,
  subscribeChallenges,
  subscribeChallengeEntries,
  createChallengeFirestore,
  setChallengeStatusFirestore,
  declareChallengeWinnerFirestore,
  deleteChallengeFirestore,
  adjustUserPoints,
} from '../../services/firestoreStorage.ts';

const PRESET_CHALLENGES = [
  {
    title: 'Coolest Vintage Michael Jackson Photo',
    description: 'Upload your favorite high-resolution vintage photograph of Michael Jackson from the Thriller or Bad eras. Community votes decide!',
    category: 'photo' as const,
    pointsReward: 5000,
  },
  {
    title: 'Best Moonwalk / Dance Pose Moment',
    description: 'Share the most stunning still capture of Michael Jackson performing the moonwalk, lean, or spin. Highest voted submission wins!',
    category: 'photo' as const,
    pointsReward: 7500,
  },
  {
    title: 'Historic Fan Broadsheet Headline Contest',
    description: 'Write the most creative headline and lead story for an upcoming MJJ Records press release. Entrants with the best journalism win!',
    category: 'headline' as const,
    pointsReward: 10000,
  },
  {
    title: 'Rarest Jackson Tour Memorabilia & Passes',
    description: 'Upload photographs of your rarest Michael Jackson collectibles, vintage vinyls, tour programs, or commemorative ticket stubs.',
    category: 'photo' as const,
    pointsReward: 6000,
  },
];

export const StaffChallengeManager: React.FC = () => {
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // New challenge form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'photo' | 'headline' | 'trivia' | 'general'>('photo');
  const [pointsReward, setPointsReward] = useState<number>(5000);
  const [isCreating, setIsCreating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: '',
  });

  // Real-time challenges subscription
  useEffect(() => {
    const unsub = subscribeChallenges((list) => {
      setChallenges(list);
      if (list.length > 0 && !selectedChallengeId) {
        setSelectedChallengeId(list[0].id);
      }
    });
    return () => unsub();
  }, [selectedChallengeId]);

  // Real-time entries subscription for selected challenge
  useEffect(() => {
    if (!selectedChallengeId) {
      setEntries([]);
      return;
    }
    setIsLoadingEntries(true);
    const unsub = subscribeChallengeEntries(selectedChallengeId, (list) => {
      setEntries(list);
      setIsLoadingEntries(false);
    });
    return () => unsub();
  }, [selectedChallengeId]);

  const handleSelectPreset = (preset: typeof PRESET_CHALLENGES[0]) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    setPointsReward(preset.pointsReward);
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setStatusMsg({ type: 'error', text: 'Please fill in both the title and instructions.' });
      return;
    }

    setIsCreating(true);
    setStatusMsg({ type: null, text: '' });

    try {
      const newId = await createChallengeFirestore({
        title: title.trim(),
        description: description.trim(),
        category,
        pointsReward: Number(pointsReward) || 5000,
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#EAB308', '#F59E0B', '#10B981'],
      });

      setStatusMsg({ type: 'success', text: 'New Challenge created and published live!' });
      setTitle('');
      setDescription('');
      setSelectedChallengeId(newId);
    } catch (err: any) {
      console.error('Failed to create challenge:', err);
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to create challenge.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (challenge: CommunityChallenge) => {
    const newStatus = challenge.status === 'active' ? 'closed' : 'active';
    await setChallengeStatusFirestore(challenge.id, newStatus);
  };

  const handleDelete = async (challengeId: string) => {
    if (confirm('Are you sure you want to delete this challenge and all its entries?')) {
      await deleteChallengeFirestore(challengeId);
      if (selectedChallengeId === challengeId) {
        setSelectedChallengeId(null);
      }
    }
  };

  const handleDeclareWinner = async (challenge: CommunityChallenge, entry: ChallengeEntry) => {
    if (
      !confirm(
        `Declare @${entry.discordUser} as the official winner of "${challenge.title}" and award them +${challenge.pointsReward.toLocaleString()} PTS?`
      )
    ) {
      return;
    }

    try {
      const res = await declareChallengeWinnerFirestore(challenge.id, entry, challenge.pointsReward);
      if (res.success) {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#EAB308', '#F59E0B', '#10B981', '#FFFFFF'],
        });
        setStatusMsg({ type: 'success', text: res.message });
      } else {
        setStatusMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Error declaring winner.' });
    }
  };

  const handleAwardBonusPoints = async (entry: ChallengeEntry, amount: number) => {
    if (entry.userId) {
      await adjustUserPoints(entry.userId, amount);
      setStatusMsg({
        type: 'success',
        text: `Awarded +${amount} bonus points to @${entry.discordUser}!`,
      });
      setTimeout(() => setStatusMsg({ type: null, text: '' }), 4000);
    }
  };

  const activeChallenge = challenges.find((c) => c.id === selectedChallengeId);

  return (
    <div className="space-y-8 select-none text-neutral-100 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <Trophy className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-serif font-black text-white uppercase tracking-wider">
              Community Challenges &amp; Contests
            </h2>
          </div>
          <p className="text-xs text-neutral-400 max-w-xl">
            Post photo, article, and media challenges for players to submit entries. Community members vote, and staff declare official winners to award points bounties.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400">
            Total Challenges: {challenges.length}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
            Active Contests: {challenges.filter((c) => c.status === 'active').length}
          </span>
        </div>
      </div>

      {/* Main Grid: Challenge Creator (Left) & Active Contests & Submissions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Challenge Creator & Preset Templates (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preset Challenge Templates */}
          <div className="bg-[#12121a] border border-[#232332] rounded-2xl p-4 sm:p-5 space-y-3">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fast Template Presets:</span>
            </span>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_CHALLENGES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  className="text-left p-3 rounded-xl bg-neutral-950/70 hover:bg-neutral-900 border border-neutral-800/80 hover:border-amber-500/40 transition-all group flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-neutral-200 group-hover:text-amber-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>{preset.title}</span>
                    </h4>
                    <p className="text-[10px] text-neutral-500 line-clamp-1">{preset.description}</p>
                  </div>
                  <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                    +{preset.pointsReward.toLocaleString()} PTS
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Create Challenge Form */}
          <form
            onSubmit={handleCreateChallenge}
            className="bg-[#12121a] border border-amber-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-serif font-black text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Create New Community Challenge</span>
            </h3>

            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-300 mb-1">
                Challenge Title <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Coolest Vintage Michael Jackson Photo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 text-xs font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-300 mb-1">
                Instructions / What Entrants Must Post <span className="text-amber-400">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe rules, what photo or content to upload, and how the community will vote..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 text-xs leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-amber-300 text-xs font-mono focus:outline-none focus:border-amber-400"
                >
                  <option value="photo">📸 Photo Upload</option>
                  <option value="headline">📰 Fan Headline</option>
                  <option value="trivia">👑 Memorabilia / Art</option>
                  <option value="general">⭐ General Challenge</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-300 mb-1">
                  Winner Bounty (PTS)
                </label>
                <input
                  type="number"
                  step="500"
                  min="500"
                  value={pointsReward}
                  onChange={(e) => setPointsReward(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {statusMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isCreating ? (
                <span>Publishing Challenge...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Launch Challenge Live to Portal</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Active Challenges & Submissions Review (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Challenge Selector Tabs */}
          <div className="bg-[#12121a] border border-[#232332] rounded-2xl p-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-mono text-neutral-400 shrink-0 pl-1">Contests:</span>
            {challenges.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedChallengeId(ch.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                  selectedChallengeId === ch.id
                    ? 'bg-amber-500 text-black font-bold shadow-md'
                    : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                <span>{ch.title}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                    ch.status === 'active'
                      ? 'bg-emerald-500/30 text-emerald-950 font-bold'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {ch.status === 'active' ? 'LIVE' : 'CLOSED'}
                </span>
              </button>
            ))}
          </div>

          {activeChallenge ? (
            <div className="bg-[#12121a] border border-[#232332] rounded-2xl p-6 space-y-6 shadow-xl">
              {/* Challenge Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-800/80 pb-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        activeChallenge.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}
                    >
                      {activeChallenge.status === 'active' ? '🟢 LIVE CONTEST' : '🏁 CONTEST CLOSED'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      🏆 BOUNTY: +{activeChallenge.pointsReward.toLocaleString()} PTS
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {entries.length} Submissions
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-black text-white">
                    {activeChallenge.title}
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed max-w-xl">
                    {activeChallenge.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleStatus(activeChallenge)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title={activeChallenge.status === 'active' ? 'Close Contest' : 'Reopen Contest'}
                  >
                    {activeChallenge.status === 'active' ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Close</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Reopen</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(activeChallenge.id)}
                    className="p-1.5 rounded-xl bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors"
                    title="Delete Challenge"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Declared Winner Banner (If closed) */}
              {activeChallenge.winnerDiscord && (
                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-neutral-950 border border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black text-xl shadow-lg">
                      👑
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                        OFFICIAL CONTEST WINNER
                      </span>
                      <h4 className="text-lg font-serif font-bold text-white">
                        @{activeChallenge.winnerDiscord}
                      </h4>
                      <p className="text-xs text-neutral-300 italic">
                        "{activeChallenge.winnerCaption || 'Winning entry'}"
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full block">
                      +{activeChallenge.winnerPointsAwarded?.toLocaleString()} PTS AWARDED
                    </span>
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      Closed on {activeChallenge.closedAt ? new Date(activeChallenge.closedAt).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
              )}

              {/* Entries Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                    Community Entries &amp; Submissions ({entries.length})
                  </h4>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Sorted by votes
                  </span>
                </div>

                {isLoadingEntries ? (
                  <div className="p-8 text-center text-xs text-neutral-500 font-mono">
                    Loading entries in real time...
                  </div>
                ) : entries.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {entries.map((entry) => {
                      const isWinner = activeChallenge.winnerEntryId === entry.id;

                      return (
                        <div
                          key={entry.id}
                          className={`bg-neutral-950 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all ${
                            isWinner
                              ? 'border-amber-400 shadow-xl shadow-amber-500/20 ring-1 ring-amber-400'
                              : 'border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          {/* Image preview (if photo) */}
                          {entry.imageUrl ? (
                            <div className="aspect-video w-full bg-neutral-900 relative overflow-hidden group">
                              <img
                                src={entry.imageUrl}
                                alt={entry.caption}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-2 right-2 bg-black/75 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-mono text-amber-300 font-bold border border-amber-500/40">
                                ❤️ {entry.votes || 0} Votes
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video w-full bg-neutral-900/60 flex items-center justify-center text-neutral-600 border-b border-neutral-800">
                              <ImageIcon className="w-8 h-8 opacity-40" />
                            </div>
                          )}

                          {/* Content & Entrant Info */}
                          <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-300">
                                  @{entry.discordUser}
                                </span>
                                <span className="text-[10px] text-neutral-500 font-mono">
                                  {new Date(entry.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-200 line-clamp-3 leading-relaxed">
                                {entry.caption}
                              </p>
                            </div>

                            {/* Staff Action Buttons */}
                            <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2">
                              {isWinner ? (
                                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                                  <Crown className="w-3.5 h-3.5" />
                                  <span>Declared Winner</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleDeclareWinner(activeChallenge, entry)}
                                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                  title="Declare Winner and Award Contest Bounty"
                                >
                                  <Crown className="w-3.5 h-3.5" />
                                  <span>Declare Winner</span>
                                </button>
                              )}

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleAwardBonusPoints(entry, 500)}
                                  className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-[10px] font-mono text-emerald-400 border border-neutral-800 hover:border-emerald-500/40"
                                  title="Give +500 Bonus Points"
                                >
                                  +500 PTS
                                </button>
                                <button
                                  onClick={() => handleAwardBonusPoints(entry, 1000)}
                                  className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-[10px] font-mono text-emerald-400 border border-neutral-800 hover:border-emerald-500/40"
                                  title="Give +1,000 Bonus Points"
                                >
                                  +1,000 PTS
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-neutral-950/60 border border-dashed border-neutral-800 rounded-2xl p-8 text-center space-y-2">
                    <Camera className="w-8 h-8 text-neutral-600 mx-auto" />
                    <h5 className="text-sm font-semibold text-neutral-300">No Submissions Yet</h5>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Community players can submit their photo and responses directly from the Portal Home Screen.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#12121a] border border-neutral-800 rounded-2xl p-12 text-center text-xs text-neutral-500 font-mono">
              No challenge selected. Choose an existing contest above or create a new one using the presets on the left.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
