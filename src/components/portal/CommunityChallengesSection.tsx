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
  Maximize2,
  Eye,
  Clock,
  Award,
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

  // Lightbox Zoom Modal
  const [zoomImage, setZoomImage] = useState<{ url: string; caption: string; user: string } | null>(null);

  // Filter & Sorting state
  const [sortMode, setSortMode] = useState<'votes' | 'recent'>('votes');

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

  // Handle local photo/document file upload (max 25MB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_25MB = 25 * 1024 * 1024;
    if (file.size > MAX_25MB) {
      setSubmitStatus({
        type: 'error',
        message: 'File size exceeds 25MB limit. Please select an image under 25MB.',
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

    const cleanDiscord = (
      discordHandle.trim() ||
      currentUser?.discordUser ||
      currentUser?.discordUsername ||
      ''
    ).replace(/^@/, '');

    if (!cleanDiscord) {
      setSubmitStatus({
        type: 'error',
        message: 'Please enter your Discord username so your votes and bounty points can be recorded!',
      });
      return;
    }

    if (!caption.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Please write a caption or headline description for your submission.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const res = await submitChallengeEntryFirestore({
        challengeId: activeChallengeId,
        userId: currentUser?.uid || `guest-${cleanDiscord}`,
        discordUser: cleanDiscord,
        userDisplayName: currentUser?.displayName || cleanDiscord,
        userPhotoURL: currentUser?.photoURL || null,
        caption: caption.trim(),
        imageUrl: imagePreview || '',
      });

      if (res.success) {
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#EF4444', '#F59E0B', '#EAB308', '#FFFFFF'],
          });
        } catch {
          // ignore
        }

        setSubmitStatus({
          type: 'success',
          message: 'Your entry has been submitted live! The community can now vote for you.',
        });
        setCaption('');
        setImagePreview('');
        setTimeout(() => {
          setShowSubmitModal(false);
          setSubmitStatus({ type: null, message: '' });
        }, 1800);
      } else {
        setSubmitStatus({
          type: 'error',
          message: res.error || 'Failed to submit challenge entry. Please try again.',
        });
      }
    } catch (err: any) {
      console.error('Failed to submit entry:', err);
      setSubmitStatus({
        type: 'error',
        message: err?.message || 'Error uploading your submission. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upvote entry
  const handleVote = async (entry: ChallengeEntry) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    try {
      const voterIdentifier = currentUser.uid;
      const res = await voteForChallengeEntry(entry.id, voterIdentifier);

      if (res.success) {
        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#EF4444', '#F43F5E', '#FB7185', '#FFFFFF'],
          });
        } catch {
          // ignore
        }
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      console.error('Vote failed:', err);
      alert('Unable to process your vote right now. Please try again.');
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    if (sortMode === 'votes') {
      return (b.votes || 0) - (a.votes || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalVotesAcrossChallenge = entries.reduce((acc, curr) => acc + (curr.votes || 0), 0);

  return (
    <div className="space-y-10 select-none text-neutral-100 font-sans relative">
      {/* Contest Selector Bar */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
        <span className="text-xs font-mono uppercase text-neutral-400 font-bold tracking-wider shrink-0">
          Contest:
        </span>
        {challenges.map((ch) => {
          const isSelected = ch.id === activeChallengeId;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChallengeId(ch.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-red-600 via-red-500 to-amber-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.35)] scale-105'
                  : 'bg-[#12080c] hover:bg-[#1a0e14] text-neutral-300 border border-red-950/80 hover:border-red-500/40'
              }`}
            >
              <span>{ch.title}</span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                  ch.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {ch.status === 'active' ? 'LIVE' : 'CLOSED'}
              </span>
            </button>
          );
        })}
      </div>

      {activeChallenge ? (
        <div className="space-y-8">
          {/* Active Challenge Spotlight Stage */}
          <div className="relative rounded-3xl overflow-hidden border border-red-950/80 bg-gradient-to-b from-[#14080c] via-[#0d0407] to-[#080204] p-6 sm:p-10 shadow-2xl">
            {/* Dynamic Stage Light Beams */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Challenge Overview & Bounties (8 Cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border ${
                      activeChallenge.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    {activeChallenge.status === 'active' ? '🟢 CONTEST ACTIVE' : '🏁 CONTEST COMPLETED'}
                  </span>

                  <span className="text-[10px] font-mono font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-full flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    <span>BOUNTY: +{activeChallenge.pointsReward.toLocaleString()} PTS</span>
                  </span>

                  <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900/80 px-2.5 py-1 rounded-full border border-neutral-800">
                    +{pointsPerVote.toLocaleString()} PTS / Vote
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-serif font-black text-white tracking-tight">
                  {activeChallenge.title}
                </h2>

                <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl">
                  {activeChallenge.description}
                </p>

                {/* Submit Entry Button */}
                {activeChallenge.status === 'active' && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (!currentUser) onRequireAuth();
                        else setShowSubmitModal(true);
                      }}
                      className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-red-950/60 transition-all flex items-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>SUBMIT YOUR PHOTO / ENTRY (MAX 25MB)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Winner Showcase or Contest Stats (4 Cols) */}
              <div className="lg:col-span-4 flex justify-center">
                {activeChallenge.winnerDiscord ? (
                  <div className="w-full bg-[#160b10] border-2 border-amber-400/80 rounded-2xl p-6 space-y-3 shadow-2xl relative text-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-black flex items-center justify-center mx-auto text-2xl shadow-lg animate-bounce">
                      👑
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                        OFFICIAL CONTEST CHAMPION
                      </span>
                      <h4 className="text-xl font-serif font-black text-white mt-1">
                        @{activeChallenge.winnerDiscord}
                      </h4>
                      <p className="text-xs text-neutral-300 italic mt-1.5 line-clamp-2">
                        "{activeChallenge.winnerCaption || 'Winning entry'}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-red-950">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 inline-block">
                        +{activeChallenge.winnerPointsAwarded?.toLocaleString()} PTS WON
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-[#12080c] border border-red-950/80 rounded-2xl p-6 space-y-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
                      <Flame className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-base text-white">
                        Live Community Vote Battle
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Votes can be cast once every 5 hours. Every vote awards you points and propels your favorite entry toward victory!
                      </p>
                    </div>

                    <div className="pt-3 border-t border-red-950/80 flex items-center justify-around text-center font-mono">
                      <div>
                        <span className="text-lg font-black text-amber-400">{entries.length}</span>
                        <span className="text-[10px] text-neutral-500 uppercase block">Entries</span>
                      </div>
                      <div className="h-6 w-px bg-red-950" />
                      <div>
                        <span className="text-lg font-black text-red-400">
                          {totalVotesAcrossChallenge}
                        </span>
                        <span className="text-[10px] text-neutral-500 uppercase block">Total Votes</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submissions Gallery & Live Podium */}
          <div className="space-y-6">
            {/* Gallery Toolbar & Sorting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-950/80 pb-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-red-500" />
                <h3 className="text-lg sm:text-xl font-serif font-black text-white uppercase tracking-wider">
                  Community Submissions ({entries.length})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">Sort by:</span>
                <button
                  onClick={() => setSortMode('votes')}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    sortMode === 'votes'
                      ? 'bg-red-600/30 text-red-300 border border-red-500/50'
                      : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                  }`}
                >
                  🔥 Most Votes
                </button>
                <button
                  onClick={() => setSortMode('recent')}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    sortMode === 'recent'
                      ? 'bg-red-600/30 text-red-300 border border-red-500/50'
                      : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                  }`}
                >
                  ⏱️ Latest
                </button>
              </div>
            </div>

            {isLoadingEntries ? (
              <div className="p-16 text-center text-xs text-neutral-500 font-mono animate-pulse">
                Loading live submissions &amp; voting tallies...
              </div>
            ) : sortedEntries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEntries.map((entry, index) => {
                  const isWinner = activeChallenge.winnerEntryId === entry.id;
                  const voterKey = currentUser?.uid?.toLowerCase() || '';
                  const hasVoted = voterKey && (entry.votedUserIds || []).includes(voterKey);

                  // Podium rankings for top voted
                  const isFirst = sortMode === 'votes' && index === 0;
                  const isSecond = sortMode === 'votes' && index === 1;
                  const isThird = sortMode === 'votes' && index === 2;

                  return (
                    <div
                      key={entry.id}
                      className={`relative rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 group bg-[#11090d] border ${
                        isWinner
                          ? 'border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                          : isFirst
                          ? 'border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                          : 'border-red-950/80 hover:border-red-500/50 hover:shadow-xl'
                      }`}
                    >
                      {/* Photo Thumbnail with Interactive Lightbox Zoom */}
                      {entry.imageUrl ? (
                        <div
                          onClick={() =>
                            setZoomImage({
                              url: entry.imageUrl!,
                              caption: entry.caption,
                              user: entry.discordUser,
                            })
                          }
                          className="aspect-[4/3] w-full bg-black relative overflow-hidden cursor-zoom-in group"
                        >
                          <img
                            src={entry.imageUrl}
                            alt={entry.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />

                          {/* Hover Zoom Indicator */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1.5 rounded-full bg-black/80 border border-white/20 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-xl">
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>View Full Size</span>
                            </span>
                          </div>

                          {/* Podium Rank Badges */}
                          {isFirst && (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1 font-mono">
                              <Crown className="w-3.5 h-3.5 stroke-[3]" />
                              <span>#1 LEADER</span>
                            </div>
                          )}
                          {isSecond && (
                            <div className="absolute top-3 left-3 bg-neutral-300 text-black font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1 font-mono">
                              <span>#2 SILVER</span>
                            </div>
                          )}
                          {isThird && (
                            <div className="absolute top-3 left-3 bg-amber-700 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1 font-mono">
                              <span>#3 BRONZE</span>
                            </div>
                          )}

                          {isWinner && (
                            <div className="absolute top-3 right-3 bg-amber-400 text-black font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg font-mono">
                              CHAMPION
                            </div>
                          )}

                          {/* Live Votes Counter Badge */}
                          <div className="absolute bottom-3 right-3 bg-black/85 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-amber-300 font-bold border border-amber-500/40 shadow-lg">
                            ❤️ {entry.votes || 0} Votes
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[4/3] w-full bg-[#1a0e13] flex items-center justify-center text-neutral-600">
                          <Camera className="w-12 h-12 opacity-30" />
                        </div>
                      )}

                      {/* Info, Caption & Interactive Upvote Action */}
                      <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
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
                        <div className="pt-3 border-t border-red-950/80 flex items-center justify-between">
                          <div className="text-xs font-mono text-neutral-400">
                            <span className="font-bold text-white">{entry.votes || 0}</span> votes
                          </div>

                          <button
                            onClick={() => handleVote(entry)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                              hasVoted
                                ? 'bg-red-600/20 text-red-400 border border-red-500/40 cursor-default'
                                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white transform hover:scale-105 active:scale-95'
                            }`}
                            title={hasVoted ? 'You already voted for this entry' : 'Cast vote (1 vote per 5 hours)'}
                          >
                            <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-red-400' : 'fill-white'}`} />
                            <span>{hasVoted ? 'Voted' : 'Vote +PTS'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#12080c] border border-dashed border-red-950 rounded-3xl p-14 text-center space-y-4">
                <Camera className="w-12 h-12 text-red-500/40 mx-auto" />
                <h4 className="text-lg font-serif font-bold text-neutral-200">
                  Be the First to Enter This Challenge!
                </h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Upload your vintage Michael Jackson photo, memorabilia, or custom edit to start collecting community votes and compete for the bounty!
                </p>
                {activeChallenge.status === 'active' && (
                  <button
                    onClick={() => {
                      if (!currentUser) onRequireAuth();
                      else setShowSubmitModal(true);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer"
                  >
                    Submit Entry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#12080c] border border-red-950 rounded-3xl p-12 text-center text-xs text-neutral-500 font-mono">
          No challenges active. Staff can launch new photo and journalism competitions from the Authorisation Centre.
        </div>
      )}

      {/* FULLSCREEN PHOTO LIGHTBOX MODAL */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center gap-4 bg-[#14080c] border border-red-950 rounded-3xl p-4 sm:p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-900 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full flex items-center justify-between border-b border-red-950 pb-3 pr-12">
              <span className="font-mono text-sm font-bold text-amber-400">
                @{zoomImage.user}
              </span>
              <span className="text-xs text-neutral-400 font-mono">High Resolution Viewer</span>
            </div>

            <div className="w-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <img
                src={zoomImage.url}
                alt=""
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>

            <p className="text-xs text-neutral-300 font-sans text-center max-w-xl">
              "{zoomImage.caption}"
            </p>
          </div>
        </div>
      )}

      {/* SUBMISSION UPLOAD MODAL (UP TO 25MB SUPPORT) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#12080c] border border-red-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-xl p-1 cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-inner">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-serif font-black text-white">Submit Challenge Entry</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Upload your high-res vintage photo or written piece (max 25MB) to compete for the +{activeChallenge?.pointsReward.toLocaleString()} PTS bounty!
              </p>
            </div>

            <form onSubmit={handleSubmitEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-300 mb-1.5 uppercase">
                  Your Discord Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={discordHandle}
                  onChange={(e) => setDiscordHandle(e.target.value)}
                  placeholder="e.g. moonwalker_88"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-red-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-300 mb-1.5 uppercase">
                  Caption / Story Headline <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe your submission, era, concert tour, or historical context..."
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500 text-xs font-sans leading-relaxed"
                  required
                />
              </div>

              {/* File Upload Drop Zone (Up to 25MB) */}
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-300 mb-1.5 uppercase">
                  Upload Photo / Memorabilia (Max 25MB)
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-red-500/50 aspect-video bg-black group">
                    <img
                      src={imagePreview}
                      alt="Upload Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-white hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-700 hover:border-red-500/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-neutral-950/60 group"
                  >
                    <Upload className="w-8 h-8 text-neutral-500 group-hover:text-red-400 mx-auto transition-colors" />
                    <p className="text-xs text-neutral-300 font-semibold mt-2">
                      Click to browse or drop image file here
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono mt-1">
                      PNG, JPG, WEBP, GIF up to 25MB
                    </p>
                  </div>
                )}
              </div>

              {submitStatus.message && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
                    submitStatus.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {submitStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <span>{submitStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-red-950/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Uploading to Contest...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publish Submission to Community</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
