import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Camera,
  Upload,
  Heart,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Crown,
  ChevronRight,
  Flame,
  Star,
  Plus,
  Send,
  X,
  ImageIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CommunityChallenge,
  ChallengeEntry,
  subscribeChallenges,
  subscribeChallengeEntries,
  submitChallengeEntryFirestore,
  voteForChallengeEntry,
  subscribeVotingConfig,
  UserProfile,
} from '../../services/firestoreStorage.ts';

interface CommunityChallengesSectionProps {
  currentUser: UserProfile | null;
  onRequireAuth: () => void;
}

export const CommunityChallengesSection: React.FC<CommunityChallengesSectionProps> = ({
  currentUser,
  onRequireAuth,
}) => {
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // Submit entry modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [discordHandle, setDiscordHandle] = useState('');
  const [caption, setCaption] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time voting config state
  const [pointsPerVote, setPointsPerVote] = useState<number>(1000);

  useEffect(() => {
    const unsubConfig = subscribeVotingConfig((config) => {
      setPointsPerVote(config.pointsPerVote);
    });
    return () => unsubConfig();
  }, []);

  // Real-time challenges subscription
  useEffect(() => {
    const unsub = subscribeChallenges((list) => {
      setChallenges(list);
      if (list.length > 0 && !activeChallengeId) {
        // Prefer first active challenge
        const activeOne = list.find((c) => c.status === 'active') || list[0];
        setActiveChallengeId(activeOne.id);
      }
    });
    return () => unsub();
  }, [activeChallengeId]);

  // Real-time entries subscription
  useEffect(() => {
    if (!activeChallengeId) {
      setEntries([]);
      return;
    }
    setIsLoadingEntries(true);
    const unsub = subscribeChallengeEntries(activeChallengeId, (list) => {
      setEntries(list);
      setIsLoadingEntries(false);
    });
    return () => unsub();
  }, [activeChallengeId]);

  // Sync discord handle from current user
  useEffect(() => {
    if (currentUser) {
      setDiscordHandle(currentUser.discordUser || currentUser.discordUsername || '');
    }
  }, [currentUser]);

  const activeChallenge = challenges.find((c) => c.id === activeChallengeId);

  // Handle local photo/document file upload & convert to base64 with max 25MB limit
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_25MB = 25 * 1024 * 1024;
    if (file.size > MAX_25MB) {
      setSubmitStatus({
        type: 'error',
        message: 'File size exceeds 25MB limit. Please select a file under 25MB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChallengeId) return;

    const cleanDiscord = (discordHandle.trim() || currentUser?.discordUser || currentUser?.discordUsername || '').replace(/^@/, '');
    if (!cleanDiscord) {
      setSubmitStatus({ type: 'error', message: 'Please enter your Discord display name.' });
      return;
    }

    if (!caption.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please write a caption or story for your submission.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const res = await submitChallengeEntryFirestore({
        challengeId: activeChallengeId,
        userId: currentUser?.uid || `player_${cleanDiscord.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        discordUser: cleanDiscord,
        userDisplayName: currentUser?.displayName || cleanDiscord,
        userPhotoURL: currentUser?.photoURL || null,
        caption: caption.trim(),
        imageUrl: imagePreview,
      });

      if (res.success) {
        confetti({
          particleCount: 130,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#EAB308', '#F59E0B', '#10B981', '#FFFFFF'],
        });

        setSubmitStatus({
          type: 'success',
          message: 'Entry submitted successfully! The community can now view and vote for you.',
        });
        setCaption('');
        setImagePreview('');
        setTimeout(() => {
          setShowSubmitModal(false);
          setSubmitStatus({ type: null, message: '' });
        }, 2000);
      } else {
        setSubmitStatus({ type: 'error', message: res.error || 'Failed to submit entry.' });
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setSubmitStatus({ type: 'error', message: err?.message || 'Error uploading entry.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (entry: ChallengeEntry) => {
    const voterId = currentUser?.uid || `guest_${currentUser?.discordUser || 'voter'}`;
    const voterDiscord = currentUser?.discordUser || currentUser?.discordUsername;

    const res = await voteForChallengeEntry(entry.id, voterId, voterDiscord);
    if (res.success) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#EF4444', '#F59E0B', '#FFFFFF'],
      });
    } else if (res.error) {
      alert(res.error);
    }
  };

  if (challenges.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 select-none font-sans">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-2xl font-serif font-black text-neutral-100 flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400 animate-pulse-glow" />
            <span>MJJ Fan Challenges &amp; Contests</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Upload your coolest Michael Jackson photos &amp; broadsheet headlines, vote on submissions, and win points bounties!
          </p>
        </div>

        {/* Tab switcher for challenges */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {challenges.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChallengeId(ch.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                activeChallengeId === ch.id
                  ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              <span>{ch.title}</span>
              {ch.status === 'active' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              ) : (
                <span className="text-[9px] font-mono font-bold bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-400">
                  WINNER
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeChallenge && (
        <div className="space-y-6">
          {/* Active Challenge Hero Spotlight Card */}
          <div className="bg-gradient-to-br from-[#151522] via-[#0d0d14] to-[#1a1a28] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
              <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border ${
                      activeChallenge.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    {activeChallenge.status === 'active' ? '🟢 LIVE COMMUNITY CONTEST' : '🏁 CONTEST CONCLUDED'}
                  </span>

                  <span className="text-[10px] font-mono font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>WINNER BOUNTY: +{activeChallenge.pointsReward.toLocaleString()} PTS</span>
                  </span>

                  <span className="text-xs font-mono text-neutral-400">
                    {entries.length} Submissions
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight">
                  {activeChallenge.title}
                </h2>

                <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl">
                  {activeChallenge.description}
                </p>

                {activeChallenge.status === 'active' && (
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        setShowSubmitModal(true);
                        setSubmitStatus({ type: null, message: '' });
                      }}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 stroke-[2.5]" />
                      <span>Upload &amp; Submit Entry</span>
                    </button>

                    <div className="text-xs text-neutral-400 flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Your Discord handle will display on your entry</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contest Rules or Winner Showcase Highlight */}
              <div className="lg:col-span-4 flex justify-center">
                {activeChallenge.winnerDiscord ? (
                  <div className="w-full bg-[#111119] border-2 border-amber-400/80 rounded-2xl p-5 space-y-3 shadow-2xl relative text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center mx-auto text-xl shadow-lg">
                      👑
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                        OFFICIAL CONTEST WINNER
                      </span>
                      <h4 className="text-lg font-serif font-black text-white">
                        @{activeChallenge.winnerDiscord}
                      </h4>
                      <p className="text-xs text-neutral-300 italic mt-1 line-clamp-2">
                        "{activeChallenge.winnerCaption || 'Grand Champion Submission'}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-800">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 inline-block">
                        +{activeChallenge.winnerPointsAwarded?.toLocaleString()} PTS WON
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 space-y-3 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                      <Star className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif font-bold text-sm text-neutral-200">
                      Community Vote Driven
                    </h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Every like adds +1 vote and earns you +50 points. Staff reviews all top voted submissions to declare the official bounty winner!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submissions Gallery Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>Fan Submissions ({entries.length})</span>
              </h4>
              <span className="text-xs text-neutral-400 font-mono">
                Click ❤️ to vote for your favorite
              </span>
            </div>

            {isLoadingEntries ? (
              <div className="p-12 text-center text-xs text-neutral-500 font-mono">
                Loading community submissions...
              </div>
            ) : entries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {entries.map((entry) => {
                  const isWinner = activeChallenge.winnerEntryId === entry.id;
                  const voterKey = currentUser?.uid?.toLowerCase() || '';
                  const hasVoted = voterKey && (entry.votedUserIds || []).includes(voterKey);

                  return (
                    <div
                      key={entry.id}
                      className={`bg-neutral-900/90 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all group ${
                        isWinner
                          ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-2xl shadow-amber-500/20'
                          : 'border-neutral-800 hover:border-amber-500/40 hover:shadow-xl'
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      {entry.imageUrl ? (
                        <div className="aspect-[4/3] w-full bg-neutral-950 relative overflow-hidden">
                          <img
                            src={entry.imageUrl}
                            alt={entry.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {isWinner && (
                            <div className="absolute top-2 left-2 bg-amber-500 text-black font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1 font-mono">
                              <Crown className="w-3 h-3 stroke-[3]" />
                              <span>WINNER</span>
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-mono text-amber-300 font-bold border border-amber-500/40 shadow">
                            ❤️ {entry.votes || 0} Votes
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[4/3] w-full bg-neutral-950 flex items-center justify-center text-neutral-600">
                          <Camera className="w-10 h-10 opacity-30" />
                        </div>
                      )}

                      {/* Info & Caption */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
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

                        {/* Interactive Upvote Button */}
                        <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                          <span className="text-[11px] font-mono text-neutral-400">
                            {entry.votes || 0} {entry.votes === 1 ? 'Vote' : 'Votes'}
                          </span>

                          <button
                            onClick={() => handleVote(entry)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                              hasVoted
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 cursor-default'
                                : 'bg-neutral-800 hover:bg-rose-500 hover:text-white text-neutral-300 border border-neutral-700 active:scale-95 cursor-pointer'
                            }`}
                            title={hasVoted ? 'You already voted for this entry' : 'Vote for this submission'}
                          >
                            <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-rose-400 text-rose-400' : ''}`} />
                            <span>{hasVoted ? 'Voted' : 'Vote'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-neutral-900/40 border border-dashed border-neutral-800 rounded-3xl p-12 text-center space-y-3">
                <Camera className="w-10 h-10 text-neutral-500 mx-auto" />
                <h4 className="text-base font-serif font-bold text-neutral-300">
                  Be the First to Enter This Challenge!
                </h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Upload your photo or write your submission to start collecting community votes and compete for the bounty!
                </p>
                {activeChallenge.status === 'active' && (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 mt-2 shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Your Entry Now</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {showSubmitModal && activeChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-xl p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-inner">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-black text-white">
                Submit Challenge Entry
              </h3>
              <p className="text-xs text-neutral-400">
                Contest: <span className="text-amber-300 font-bold">{activeChallenge.title}</span>
              </p>
            </div>

            <form onSubmit={handleSubmitEntry} className="space-y-4">
              {/* Discord Handle (Always Shown) */}
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-300 mb-1">
                  Your Discord Display Name <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    value={discordHandle}
                    onChange={(e) => setDiscordHandle(e.target.value)}
                    placeholder="e.g. moonwalker_99"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 text-sm font-bold"
                    required
                  />
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  This Discord username will display prominently on your entry card so players know who to vote for.
                </p>
              </div>

              {/* Photo Upload or Image URL */}
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-300 mb-1">
                  Upload Photo (Optional / Recommended)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-xs font-semibold flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Choose Photo from Device</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.svg,.pdf,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => setImagePreview('')}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {imagePreview && (
                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-amber-500/40 relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Caption / Story */}
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-300 mb-1">
                  Caption / Description <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tell the community about this photo, concert date, or your custom headline..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 text-xs leading-relaxed"
                  required
                />
              </div>

              {submitStatus.message && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2 ${
                    submitStatus.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {submitStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{submitStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Uploading to Contest...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Post Submission to Challenge</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
