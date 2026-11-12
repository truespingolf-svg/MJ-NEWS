import React, { useState, useEffect, useRef } from 'react';
import {
  Newspaper,
  Sparkles,
  Trophy,
  Clock,
  BookOpen,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Send,
  Users,
  Award,
  Globe,
  Star,
  Bell,
  Play,
  Pause,
  Disc,
  Radio,
  Music,
  Flame,
  Film,
  LogIn,
  LogOut,
  User as UserIcon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PublicMarqueeBanner } from '../common/PublicMarqueeBanner';
import { FlipbookReader } from '../canvas/FlipbookReader';
import { NewspaperProject } from '../../types/newspaper.ts';
import { getLocalMedia } from '../../services/localMediaRegistry.ts';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser } from '../../firebase.ts';
import {
  subscribePublishedNewspaper,
  subscribeAnnouncements,
  subscribePromoCodes,
  subscribeAllPublishedNewspapers,
  redeemCodeFirestore,
  submitApplicationFirestore,
  UserProfile,
  subscribeCurrentUser,
  subscribeUsers,
  syncUserProfile,
  redeemGeneralPointsCode,
  NewsArticle,
  subscribeNewsArticles,
  StreamingTrack,
  subscribeStreamingContent,
  SiteAudioSettings,
  subscribeSiteAudioSettings,
} from '../../services/firestoreStorage.ts';
import { CommunityLeaderboardSection } from './CommunityLeaderboardSection.tsx';
import { UserProfileModal } from './UserProfileModal.tsx';
import { NewspaperReactionBar } from './NewspaperReactionBar.tsx';
import { CommunityChallengesSection } from './CommunityChallengesSection.tsx';
import { AuthSignInModal } from './AuthSignInModal.tsx';

// New Cinematic Redesign Modules
import { ThrillerCinematicIntro } from '../common/ThrillerCinematicIntro.tsx';
import { UpcomingEventCountdown } from '../home/UpcomingEventCountdown.tsx';
import { NewsPlatformSection } from '../news/NewsPlatformSection.tsx';
import { StreamingPlatformSection } from '../streaming/StreamingPlatformSection.tsx';
import { AtmosphericMovingBackground } from '../common/AtmosphericMovingBackground.tsx';
import { CommunityLiveChat } from '../home/CommunityLiveChat.tsx';

interface Announcement {
  id: string;
  text: string;
  active: boolean;
}

interface MjjRecordsPortalProps {
  onOpenStaffPortal: () => void;
  textureEnabled: boolean;
  onToggleTexture: () => void;
}

export type PortalNavTab = 'HOME' | 'NEWS' | 'CHALLENGES' | 'STREAMING' | 'NEWSPAPER';

export const MjjRecordsPortal: React.FC<MjjRecordsPortalProps> = ({
  onOpenStaffPortal,
  textureEnabled,
  onToggleTexture,
}) => {
  // Navigation active tab
  const [activeNavTab, setActiveNavTab] = useState<PortalNavTab>('HOME');

  // Thriller Cinematic Loading Sequence (Always play on fresh load)
  const [showCinematicIntro, setShowCinematicIntro] = useState<boolean>(true);

  // Site Entrance Background Music Player state
  const [siteAudioSettings, setSiteAudioSettings] = useState<SiteAudioSettings>({
    entrySongUrl: '/assets/aistudio/13.Billie_Jean_a1324698.mp3',
    entrySongTitle: 'Billie Jean (Official Master)',
    autoplayEnabled: true,
  });
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string>('/assets/aistudio/13.Billie_Jean_a1324698.mp3');
  const [isBgAudioPlaying, setIsBgAudioPlaying] = useState<boolean>(false);
  const [isBgAudioMuted, setIsBgAudioMuted] = useState<boolean>(false);
  const [bgAudioTime, setBgAudioTime] = useState<{ current: number; duration: number }>({ current: 0, duration: 294 });
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const mainContainerRef = useRef<HTMLDivElement | null>(null);

  // Force scroll to top whenever changing tabs or dismissing intro
  useEffect(() => {
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeNavTab, showCinematicIntro]);

  const formatAudioTime = (sec: number) => {
    if (!sec || isNaN(sec) || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    if (siteAudioSettings.entrySongUrl) {
      getLocalMedia(siteAudioSettings.entrySongUrl).then((url) => {
        setResolvedAudioUrl(url || siteAudioSettings.entrySongUrl);
      });
    }
  }, [siteAudioSettings.entrySongUrl]);

  const [publishedDoc, setPublishedDoc] = useState<any | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [streamingTracks, setStreamingTracks] = useState<StreamingTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Authenticated Community User & Leaderboard state
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [allCommunityUsers, setAllCommunityUsers] = useState<UserProfile[]>([]);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'notifications'>('profile');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Active reading modal
  const [activeReadingDoc, setActiveReadingDoc] = useState<NewspaperProject | null>(null);

  // Home Featured Music Audio Player state
  const [isPlayingFeatured, setIsPlayingFeatured] = useState<boolean>(false);

  // Countdown timer state for published newspaper
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  // Code redemption modal state
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [redeemCode, setRedeemCode] = useState<string>('');
  const [discordUser, setDiscordUser] = useState<string>('');
  const [redeemStatus, setRedeemStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [isSubmittingCode, setIsSubmittingCode] = useState<boolean>(false);

  // Staff Contractor Application modal state
  const [showAppModal, setShowAppModal] = useState<boolean>(false);
  const [appFullName, setAppFullName] = useState<string>('');
  const [appDiscord, setAppDiscord] = useState<string>('');
  const [appRole, setAppRole] = useState<string>('App Moderator');
  const [appReason, setAppReason] = useState<string>('');
  const [appStatus, setAppStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [isSubmittingApp, setIsSubmittingApp] = useState<boolean>(false);

  // Promo codes from real-time database
  const [promoCodes, setPromoCodes] = useState<any[]>([]);

  // Helper to format any doc into NewspaperProject preserving correct ID
  const formatAsNewspaperProject = (raw: any): NewspaperProject => {
    if (!raw) return null as any;
    return {
      id: raw.id || raw.projectId || raw.projectData?.id || 'project-1',
      title: raw.title || raw.name || raw.projectTitle || 'MJJ Records Broadsheet',
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
      pages: raw.pages || [],
    };
  };

  const isChronicleDoc = (doc: any) => {
    if (!doc) return false;
    const str = String(doc.name || doc.title || doc.projectTitle || '');
    return str.toLowerCase().includes('king of pop chronicle');
  };

  // Real-time Firestore sync subscriptions
  useEffect(() => {
    const unsubPub = subscribePublishedNewspaper((pub) => {
      if (pub && isChronicleDoc(pub)) {
        setPublishedDoc(null);
        setExpiresAt(null);
      } else {
        setPublishedDoc(pub);
        setExpiresAt(pub?.expiresAt || null);
      }
      setLoading(false);
    });

    const unsubAnn = subscribeAnnouncements((anns) => {
      setAnnouncements(anns.filter((a) => a.active !== false));
    });

    const unsubCodes = subscribePromoCodes((codes) => {
      setPromoCodes(codes.filter((c) => c.active !== false));
    });

    const unsubProj = subscribeAllPublishedNewspapers((pubs) => {
      const cleanPubs = (pubs || []).filter((p) => !isChronicleDoc(p));
      setArchives(cleanPubs);
    });

    const unsubUsers = subscribeUsers((users) => {
      setAllCommunityUsers(users);
    });

    const unsubNews = subscribeNewsArticles((articles) => {
      setNewsArticles(articles);
    });

    const unsubTracks = subscribeStreamingContent((tracks) => {
      setStreamingTracks(tracks);
    });

    let unsubUserDoc: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (user) {
        try {
          const profile = await syncUserProfile(user);
          setCurrentUserProfile(profile);
          const discordName = profile?.discordUser || profile?.discordUsername;
          if (discordName) {
            setDiscordUser(discordName);
          }
        } catch (e) {
          console.error('Failed to sync user profile:', e);
        }

        localStorage.setItem('mjj_active_player_uid', user.uid);
        unsubUserDoc = subscribeCurrentUser(user.uid, (p) => {
          if (p) {
            setCurrentUserProfile(p);
            const discordName = p.discordUser || p.discordUsername;
            if (discordName) {
              setDiscordUser(discordName);
            }
          }
        });
      } else {
        // Check if player previously signed in with username/password on this device
        const savedPlayerUid = localStorage.getItem('mjj_active_player_uid');
        if (savedPlayerUid) {
          unsubUserDoc = subscribeCurrentUser(savedPlayerUid, (p) => {
            if (p) {
              setCurrentUserProfile(p);
              const discordName = p.discordUser || p.discordUsername;
              if (discordName) {
                setDiscordUser(discordName);
              }
            } else {
              localStorage.removeItem('mjj_active_player_uid');
              setCurrentUserProfile(null);
            }
          });
        } else {
          setCurrentUserProfile(null);
        }
      }
    });

    const unsubAudio = subscribeSiteAudioSettings((settings) => {
      setSiteAudioSettings(settings);
    });

    return () => {
      unsubPub();
      unsubAnn();
      unsubCodes();
      unsubProj();
      unsubUsers();
      unsubNews();
      unsubTracks();
      unsubAudio();
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  // Timer countdown hook for live newspaper
  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const target = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [expiresAt]);

  // Manage site entrance background music player
  useEffect(() => {
    if (!showCinematicIntro && siteAudioSettings.autoplayEnabled && bgAudioRef.current) {
      bgAudioRef.current
        .play()
        .then(() => setIsBgAudioPlaying(true))
        .catch(() => {
          // Autoplay may need user gesture
          setIsBgAudioPlaying(false);
        });
    }
  }, [showCinematicIntro, siteAudioSettings.autoplayEnabled, siteAudioSettings.entrySongUrl]);

  const toggleBgAudio = () => {
    if (!bgAudioRef.current) return;
    if (isBgAudioPlaying) {
      bgAudioRef.current.pause();
      setIsBgAudioPlaying(false);
    } else {
      window.dispatchEvent(new CustomEvent('mjj_stop_vault_audio'));
      bgAudioRef.current
        .play()
        .then(() => setIsBgAudioPlaying(true))
        .catch(() => setIsBgAudioPlaying(false));
    }
  };

  // Cross-audio synchronization: stop background music when vault audio plays
  useEffect(() => {
    const handleStopBg = () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        setIsBgAudioPlaying(false);
      }
    };
    window.addEventListener('mjj_stop_bg_audio', handleStopBg);
    return () => window.removeEventListener('mjj_stop_bg_audio', handleStopBg);
  }, []);

  const toggleBgAudioMute = () => {
    if (!bgAudioRef.current) return;
    const nextMuted = !isBgAudioMuted;
    bgAudioRef.current.muted = nextMuted;
    setIsBgAudioMuted(nextMuted);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('mjj_active_player_uid');
      await logoutUser();
      setCurrentUserProfile(null);
      setShowProfileModal(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleDismissIntro = () => {
    setShowCinematicIntro(false);
    try {
      sessionStorage.setItem('mjj_intro_seen', 'true');
    } catch {
      // ignore
    }
    // Do NOT reset currentTime — keep audio playing continuously without restarting!
    if (bgAudioRef.current && siteAudioSettings.autoplayEnabled) {
      if (bgAudioRef.current.paused) {
        bgAudioRef.current
          .play()
          .then(() => setIsBgAudioPlaying(true))
          .catch(() => {});
      } else {
        setIsBgAudioPlaying(true);
      }
    }
  };

  // Unified Code redemption submit
  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = redeemCode.trim();
    const cleanDiscord = (
      discordUser.trim() ||
      currentUserProfile?.discordUser ||
      currentUserProfile?.discordUsername ||
      ''
    ).trim();

    if (!cleanCode) {
      setRedeemStatus({ type: 'error', message: 'Please enter a reward or promo code.' });
      return;
    }

    if (!cleanDiscord && !currentUserProfile) {
      setRedeemStatus({
        type: 'error',
        message: 'Please enter your Discord username or sign in with Google first.',
      });
      return;
    }

    setIsSubmittingCode(true);
    setRedeemStatus({ type: null, message: '' });

    try {
      const pointsRes = await redeemGeneralPointsCode(
        cleanCode,
        currentUserProfile?.uid,
        cleanDiscord || currentUserProfile?.displayName || 'Community Member'
      );

      if (pointsRes.success) {
        try {
          confetti({
            particleCount: 140,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#EAB308', '#F59E0B', '#10B981', '#FFFFFF', '#6366F1'],
          });
        } catch {
          // ignore
        }

        setRedeemStatus({
          type: 'success',
          message: `🎉 Reward Claimed! You received +${(
            pointsRes.pointsAwarded || 0
          ).toLocaleString()} community points!`,
        });
        setRedeemCode('');
        return;
      }

      if (
        pointsRes.error &&
        !pointsRes.error.toLowerCase().includes('not found') &&
        !pointsRes.error.toLowerCase().includes('invalid')
      ) {
        setRedeemStatus({
          type: 'error',
          message: pointsRes.error,
        });
        return;
      }

      const secretRes = await redeemCodeFirestore(cleanCode, cleanDiscord || 'Community Member');

      fetch('/api/public/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, discordUser: cleanDiscord }),
      }).catch(() => {});

      if (secretRes.success) {
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#EAB308', '#D97706', '#F59E0B', '#FFFFFF', '#6366F1'],
          });
        } catch {
          // ignore
        }

        setRedeemStatus({
          type: 'success',
          message:
            secretRes.message ||
            'Secret broadsheet code successfully redeemed! Your reward has been recorded!',
        });
        setRedeemCode('');
      } else {
        setRedeemStatus({
          type: 'error',
          message: secretRes.error || pointsRes.error || 'Invalid or expired code. Please verify and try again.',
        });
      }
    } catch (err: any) {
      console.error('Redemption error:', err);
      setRedeemStatus({
        type: 'error',
        message: err?.message || 'Could not process redemption. Please verify code and try again.',
      });
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appDiscord.trim() || !appReason.trim()) {
      setAppStatus({
        type: 'error',
        message: 'Please enter your Discord username and reason for applying.',
      });
      return;
    }

    setIsSubmittingApp(true);
    setAppStatus({ type: null, message: '' });

    try {
      const combinedReason = `[Requested Role: ${appRole}] ${appReason.trim()}`;
      const ok = await submitApplicationFirestore({
        discordUser: appDiscord.trim(),
        fullName: appFullName.trim() || 'Anonymous Applicant',
        reason: combinedReason,
      });

      fetch('/api/public/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordUser: appDiscord.trim(),
          fullName: appFullName.trim() || 'Anonymous Applicant',
          reason: combinedReason,
        }),
      }).catch(() => {});

      if (ok) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#34D399', '#F59E0B', '#FFFFFF'],
          });
        } catch {
          // ignore
        }

        setAppStatus({
          type: 'success',
          message:
            'Your application has been submitted successfully to the MJJ Records Staff Authorisation Centre!',
        });
        setAppDiscord('');
        setAppFullName('');
        setAppReason('');
      } else {
        setAppStatus({
          type: 'error',
          message: 'Failed to submit application. Please check connection.',
        });
      }
    } catch (err) {
      console.error('Application submit error:', err);
      setAppStatus({
        type: 'error',
        message: 'Error submitting application. Please try again.',
      });
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const featuredTrack = streamingTracks[0];

  return (
    <div ref={mainContainerRef} className="flex-1 w-full overflow-y-auto bg-[#07070a] text-neutral-100 font-sans selection:bg-red-600 selection:text-white relative">
      {/* Global Atmospheric Moving Background (Flying Bats, Eerie Mist, Blood Embers) */}
      <AtmosphericMovingBackground />

      {/* Thriller Cinematic Loading Sequence (Skippable / Replayable) */}
      {showCinematicIntro && (
        <ThrillerCinematicIntro onComplete={handleDismissIntro} sharedAudioRef={bgAudioRef} />
      )}

      {/* Top Scrolling Marquee Announcement Banner */}
      <PublicMarqueeBanner announcements={announcements} />

      {/* Hidden background audio element for site entrance music */}
      <audio
        ref={bgAudioRef}
        src={resolvedAudioUrl || siteAudioSettings.entrySongUrl}
        preload="auto"
        onPlay={() => setIsBgAudioPlaying(true)}
        onPause={() => setIsBgAudioPlaying(false)}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setBgAudioTime({ current: el.currentTime || 0, duration: el.duration || 294 });
        }}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          setBgAudioTime({ current: el.currentTime || 0, duration: el.duration || 294 });
        }}
        onEnded={() => {
          setIsBgAudioPlaying(false);
        }}
      />

      {/* Main Top Navigation Header */}
      <header className="border-b border-[#231215] bg-[#0c080a]/95 backdrop-blur-xl sticky top-0 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Brand Logo & Wordmark (Distinctive typography, NO box icon) */}
          <div
            onClick={() => setActiveNavTab('HOME')}
            className="flex flex-col cursor-pointer group select-none py-1"
          >
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif tracking-[0.2em] font-black text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-400 group-hover:from-red-400 group-hover:via-amber-300 group-hover:to-red-500 transition-all duration-300 uppercase drop-shadow-[0_2px_10px_rgba(239,68,68,0.35)]">
                MJJ RECORDS
              </h1>
              <span className="text-[9px] font-mono font-black bg-red-950/80 text-red-400 border border-red-500/50 px-2 py-0.5 rounded shadow-sm tracking-widest">
                OFFICIAL
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Entertainment &amp; Press Platform</span>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
            {(
              [
                { id: 'HOME', label: 'HOME' },
                { id: 'NEWS', label: 'NEWS' },
                { id: 'CHALLENGES', label: 'CHALLENGES' },
                { id: 'STREAMING', label: 'STREAMING' },
                { id: 'NEWSPAPER', label: 'NEWSPAPER' },
              ] as const
            ).map((tab) => {
              const isActive = activeNavTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveNavTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer relative shrink-0 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-red-950 via-[#360912] to-red-950 border border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 border border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-red-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Auth Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Site Entrance Music Toggle */}
            <button
              onClick={toggleBgAudio}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl border transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isBgAudioPlaying
                  ? 'bg-red-950/80 border-red-500/70 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.35)]'
                  : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
              title={isBgAudioPlaying ? 'Pause Entrance Music' : 'Play Entrance Music'}
            >
              {isBgAudioPlaying ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
                  <div className="flex items-end gap-0.5 h-3 shrink-0">
                    <span className="w-0.5 bg-red-400 animate-[bounce_0.6s_ease-in-out_infinite] h-2" />
                    <span className="w-0.5 bg-red-400 animate-[bounce_0.8s_ease-in-out_infinite] h-3" />
                    <span className="w-0.5 bg-red-400 animate-[bounce_0.5s_ease-in-out_infinite] h-1.5" />
                  </div>
                  <span className="text-[11px] font-mono text-red-200">
                    {formatAudioTime(bgAudioTime.current)} / {formatAudioTime(bgAudioTime.duration)}
                  </span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="text-[11px] font-mono text-neutral-400">
                    Play Music ({formatAudioTime(bgAudioTime.current)})
                  </span>
                </>
              )}
            </button>

            {/* Apply for Staff Contractor (Prominent Call to Action) */}
            <button
              onClick={() => {
                setShowAppModal(true);
                setAppStatus({ type: null, message: '' });
              }}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:shadow-[0_0_24px_rgba(16,185,129,0.5)] border border-emerald-400/50 transition-all flex items-center gap-2 shrink-0 cursor-pointer group"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-300 group-hover:rotate-12 transition-transform" />
              <span>Apply for Staff Contractor</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping hidden sm:inline" />
            </button>

            {/* Redeem Code */}
            <button
              onClick={() => {
                setShowRedeemModal(true);
                setRedeemStatus({ type: null, message: '' });
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Redeem</span>
            </button>

            {/* Authenticated User Profile or Sign-In */}
            {currentUserProfile ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setProfileModalTab('notifications');
                    setShowProfileModal(true);
                  }}
                  className="p-2 rounded-xl bg-[#140b0e] hover:bg-[#1f1116] border border-red-500/40 text-red-300 relative transition-all flex items-center justify-center cursor-pointer shadow-md"
                  title="View your staff notifications, codes, and PDF passes inbox"
                >
                  <Bell className="w-4 h-4" />
                  {currentUserProfile.notifications &&
                    currentUserProfile.notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                        {currentUserProfile.notifications.length}
                      </span>
                    )}
                </button>

                <button
                  onClick={() => {
                    setProfileModalTab('profile');
                    setShowProfileModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#140b0e] hover:bg-[#1f1116] border border-red-500/40 hover:border-red-400 transition-all flex items-center gap-2 shadow-md cursor-pointer group"
                >
                  {currentUserProfile.photoURL ? (
                    <img
                      src={currentUserProfile.photoURL}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover border border-red-400/60"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-[10px]">
                      {currentUserProfile.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-bold text-neutral-200 group-hover:text-white max-w-[90px] truncate">
                    {currentUserProfile.discordUser ||
                    currentUserProfile.discordUsername
                      ? `@${
                          currentUserProfile.discordUser ||
                          currentUserProfile.discordUsername
                        }`
                      : currentUserProfile.displayName || 'Player'}
                  </span>
                  <span className="text-[10px] font-mono font-black bg-amber-500 text-black px-1.5 py-0.5 rounded">
                    {(currentUserProfile.points || 0).toLocaleString()}
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Unlock with Password */}
            <button
              onClick={onOpenStaffPortal}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Unlock Staff Administration Studio"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Unlock with Password</span>
            </button>
          </div>
        </div>
      </header>

      {/* TAB 1: HOME PAGE */}
      {activeNavTab === 'HOME' && (
        <div className="relative overflow-hidden">
          {/* DYNAMIC MOVING BACKGROUND VISUAL EFFECTS */}
          <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
            {/* Drifting Deep Red Atmospheric Nebula / Mist */}
            <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-red-900/15 rounded-full blur-[140px] animate-pulse" />
            <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-amber-900/15 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="absolute bottom-20 left-10 w-[550px] h-[550px] bg-red-950/25 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />

            {/* Moving Concert Laser Spotlight Sweep */}
            <div
              className="absolute -top-[50%] left-[-20%] w-[140%] h-[200%] opacity-15 mix-blend-screen pointer-events-none"
              style={{
                background:
                  'linear-gradient(115deg, transparent 40%, rgba(220, 38, 38, 0.4) 48%, rgba(251, 191, 36, 0.3) 50%, rgba(220, 38, 38, 0.4) 52%, transparent 60%)',
                animation: 'laserSweep 12s linear infinite',
              }}
            />

            {/* Secondary Counter Laser Beam */}
            <div
              className="absolute -top-[50%] right-[-20%] w-[140%] h-[200%] opacity-10 mix-blend-screen pointer-events-none"
              style={{
                background:
                  'linear-gradient(245deg, transparent 42%, rgba(239, 68, 68, 0.35) 49%, rgba(245, 158, 11, 0.25) 50%, rgba(239, 68, 68, 0.35) 51%, transparent 58%)',
                animation: 'laserSweepRev 16s linear infinite',
              }}
            />

            {/* Floating Rising Embers & Sparkles */}
            <div className="absolute inset-0 opacity-25">
              {[
                { left: '10%', top: '20%', size: 'w-2 h-2', delay: '0s', dur: '4s' },
                { left: '25%', top: '65%', size: 'w-1.5 h-1.5', delay: '1.2s', dur: '5s' },
                { left: '45%', top: '30%', size: 'w-2.5 h-2.5', delay: '0.5s', dur: '6s' },
                { left: '60%', top: '80%', size: 'w-1 h-1', delay: '2s', dur: '4.5s' },
                { left: '75%', top: '40%', size: 'w-2 h-2', delay: '1.5s', dur: '5.5s' },
                { left: '88%', top: '15%', size: 'w-1.5 h-1.5', delay: '0.8s', dur: '4s' },
                { left: '35%', top: '90%', size: 'w-2 h-2', delay: '2.5s', dur: '6.5s' },
                { left: '80%', top: '70%', size: 'w-1.5 h-1.5', delay: '1s', dur: '5s' },
              ].map((p, idx) => (
                <div
                  key={idx}
                  className={`absolute ${p.size} rounded-full bg-gradient-to-r from-red-500 to-amber-400 blur-[1px] animate-ping`}
                  style={{
                    left: p.left,
                    top: p.top,
                    animationDuration: p.dur,
                    animationDelay: p.delay,
                  }}
                />
              ))}
            </div>

            {/* Vinyl soundwave horizontal ambient bar */}
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#07070a] to-transparent" />
          </div>

          <style>{`
            @keyframes laserSweep {
              0% { transform: translateY(-30%) rotate(-8deg); }
              50% { transform: translateY(20%) rotate(8deg); }
              100% { transform: translateY(-30%) rotate(-8deg); }
            }
            @keyframes laserSweepRev {
              0% { transform: translateY(20%) rotate(10deg); }
              50% { transform: translateY(-25%) rotate(-6deg); }
              100% { transform: translateY(20%) rotate(10deg); }
            }
          `}</style>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16 relative z-10">
            {/* CINEMATIC HERO SECTION WITH CENTERED REACTIVE DRIPPING BLOOD MJJ RECORDS */}
            <section className="relative rounded-3xl overflow-hidden border-2 border-red-900/80 shadow-[0_0_90px_rgba(220,38,38,0.35)] bg-black">
              {/* Background Image Stage Layer */}
              <div className="absolute inset-0">
                <img
                  src="/src/assets/images/hero_mj_cinematic_stage_1794407118726.jpg"
                  alt="Michael Jackson Stage Concert"
                  className="w-full h-full object-cover object-center brightness-[0.4] contrast-[1.2]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#120609]/80 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#07070a_95%)]" />
              </div>

              <div className="relative z-10 px-6 py-16 sm:py-24 max-w-5xl mx-auto flex flex-col items-center text-center space-y-8">
                {/* Top Glowing Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-mono font-black uppercase tracking-[0.25em] shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                  <Flame className="w-4 h-4 text-red-400 animate-pulse" />
                  <span>THE OFFICIAL KING OF POP ENTERTAINMENT LABEL</span>
                </div>

                {/* CENTERPIECE: MJJ RECORDS WITH REACTIVE DRIPPING BLOOD */}
                <div className="relative group/dripping select-none cursor-pointer py-4">
                  {/* Blood Aura Glow */}
                  <div className="absolute -inset-8 bg-red-600/25 rounded-full blur-3xl pointer-events-none group-hover/dripping:bg-red-600/40 transition-all duration-500" />

                  {/* MJJ Headline */}
                  <h1
                    className="text-6xl sm:text-8xl md:text-9xl lg:text-[130px] font-black font-serif tracking-tight text-red-600 uppercase leading-none drop-shadow-[0_0_30px_rgba(220,38,38,0.95)] transition-transform duration-300 group-hover/dripping:scale-105"
                    style={{
                      textShadow:
                        '0 0 15px #7f1d1d, 0 0 35px #dc2626, 0 0 70px #ef4444, 4px 6px 0px #300305, -2px -2px 0px #000',
                      letterSpacing: '0.08em',
                    }}
                  >
                    MJJ
                  </h1>

                  {/* RECORDS Sub-headline */}
                  <h2
                    className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black font-serif tracking-[0.25em] text-red-500 uppercase leading-none mt-2 drop-shadow-[0_0_25px_rgba(239,68,68,0.85)]"
                    style={{
                      textShadow:
                        '0 0 12px #991b1b, 0 0 35px #dc2626, 3px 5px 0px #300305, -2px -2px 0px #000',
                    }}
                  >
                    RECORDS
                  </h2>

                  {/* Reactive Animated Blood Drips Hanging Under Letters */}
                  <div className="relative w-full h-8 flex justify-center gap-6 sm:gap-12 pointer-events-none overflow-visible mt-2">
                    {[
                      { delay: '0s', height: '22px' },
                      { delay: '0.4s', height: '34px' },
                      { delay: '0.8s', height: '20px' },
                      { delay: '0.2s', height: '38px' },
                      { delay: '0.6s', height: '26px' },
                      { delay: '1.0s', height: '32px' },
                      { delay: '0.5s', height: '24px' },
                      { delay: '0.9s', height: '36px' },
                    ].map((drip, i) => (
                      <div
                        key={i}
                        className="w-2 rounded-full bg-gradient-to-b from-red-600 via-red-700 to-red-950 animate-blood-drip shadow-[0_0_10px_#dc2626]"
                        style={{
                          height: drip.height,
                          animationDelay: drip.delay,
                          animationDuration: '1.8s',
                          animationIterationCount: 'infinite',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                  <button
                    onClick={() => setActiveNavTab('STREAMING')}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-red-950/60 transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Explore Music &amp; Concerts</span>
                  </button>

                  <button
                    onClick={() => setActiveNavTab('CHALLENGES')}
                    className="px-6 py-3.5 rounded-2xl bg-[#1c0c11] hover:bg-[#281219] text-amber-300 border border-amber-500/40 font-bold text-sm transition-all flex items-center gap-2 shadow-lg cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Join Community Challenges</span>
                  </button>

                  <button
                    onClick={() => setActiveNavTab('NEWS')}
                    className="px-5 py-3.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <Newspaper className="w-4 h-4" />
                    <span>Read News</span>
                  </button>
                </div>
              </div>
            </section>

          {/* UPCOMING EVENTS COUNTDOWN SECTION */}
          <UpcomingEventCountdown />

          {/* ACTIVE CHALLENGES & LEADERBOARD SPOTLIGHT */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="text-2xl font-serif font-black text-white uppercase tracking-wider">
                    Community Challenges &amp; Contests
                  </h3>
                </div>
                <p className="text-xs text-neutral-400">
                  Upload your vintage Michael Jackson photos, dance poses, and edits to win massive points and crown the leaderboard.
                </p>
              </div>

              <button
                onClick={() => setActiveNavTab('CHALLENGES')}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>View All Challenges</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <CommunityChallengesSection
              currentUser={currentUserProfile}
              onRequireAuth={() => setShowAuthModal(true)}
            />
          </section>

          {/* LATEST BREAKING NEWS TEASER */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-red-500" />
                  <h3 className="text-2xl font-serif font-black text-white uppercase tracking-wider">
                    Official MJJ Records News &amp; Releases
                  </h3>
                </div>
                <p className="text-xs text-neutral-400">
                  Headlines, master recording restorations, album retrospectives, and global tour celebrations.
                </p>
              </div>

              <button
                onClick={() => setActiveNavTab('NEWS')}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-red-300 border border-red-500/30 text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>Browse News Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {newsArticles.slice(0, 3).map((art) => (
                <div
                  key={art.id}
                  onClick={() => setActiveNavTab('NEWS')}
                  className="bg-[#100a0d] border border-red-950/70 hover:border-red-500/50 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 cursor-pointer shadow-lg hover:-translate-y-1"
                >
                  <div className="aspect-[16/10] bg-neutral-900 overflow-hidden relative">
                    <img
                      src={art.mainImage || '/src/assets/images/hero_mj_cinematic_stage_1794407118726.jpg'}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-[9px] font-mono font-bold text-red-300 uppercase">
                      {art.category}
                    </div>
                  </div>

                  <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono text-neutral-500">
                        {new Date(art.publishedDate).toLocaleDateString()} · {art.readingTimeMinutes || 3} min read
                      </div>
                      <h4 className="font-serif font-bold text-base text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                        {art.headline}
                      </h4>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {art.shortDescription}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-semibold text-red-400">
                      <span>Read Story</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* COMMUNITY LEADERBOARD SECTION */}
          <section className="space-y-6">
            <CommunityLeaderboardSection
              users={allCommunityUsers}
              currentUser={currentUserProfile}
              onRequireAuth={() => setShowAuthModal(true)}
            />
          </section>

          {/* REAL-TIME WORLDWIDE COMMUNITY CHAT SECTION */}
          <section className="space-y-6">
            <CommunityLiveChat
              currentUser={currentUserProfile}
              onRequireAuth={() => setShowAuthModal(true)}
            />
          </section>
        </main>
      </div>
      )}

      {/* TAB 2: NEWS HUB */}
      {activeNavTab === 'NEWS' && <NewsPlatformSection />}

      {/* TAB 3: CHALLENGES & CONTESTS */}
      {activeNavTab === 'CHALLENGES' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          <CommunityChallengesSection
            currentUser={currentUserProfile}
            onRequireAuth={() => setShowAuthModal(true)}
          />
          <CommunityLeaderboardSection
            users={allCommunityUsers}
            currentUser={currentUserProfile}
            onRequireAuth={() => setShowAuthModal(true)}
          />
        </div>
      )}

      {/* TAB 4: STREAMING PLATFORM */}
      {activeNavTab === 'STREAMING' && <StreamingPlatformSection />}

      {/* TAB 5: NEWSPAPER / PRESS STUDIO (Preserved functionality) */}
      {activeNavTab === 'NEWSPAPER' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
          {/* Header */}
          <div className="border-b border-neutral-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Newspaper className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-serif font-black text-white uppercase tracking-wider">
                  MJJ Records Broadsheet &amp; Pressroom
                </h2>
              </div>
              <p className="text-xs text-neutral-400">
                Read official printed press editions, interactive 3D paper flipbooks, and historical archives.
              </p>
            </div>

            <button
              onClick={onToggleTexture}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 self-start sm:self-auto ${
                textureEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Newsprint Texture: {textureEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Currently Published Newspaper Section */}
          <section className="space-y-6">
            {publishedDoc ? (
              <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-[#14141e] border border-neutral-800 hover:border-amber-500/50 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden group transition-all duration-300">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-400 to-amber-600" />
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Newspaper Preview Card */}
                <div className="w-full md:w-64 aspect-[3/4] bg-neutral-950 border border-neutral-700 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col justify-between p-4 group-hover:border-amber-400 transition-all transform group-hover:scale-105 duration-300">
                  <div className="text-center border-b border-neutral-800 pb-2">
                    <span className="text-[10px] font-serif font-bold uppercase tracking-widest text-amber-400">
                      THE MJJ DAILY PRESS
                    </span>
                    <div className="text-[8px] text-neutral-500 uppercase tracking-tighter">
                      EDITION #{publishedDoc.issueNumber || 1} • OFFICIAL PRESS
                    </div>
                  </div>

                  <div className="my-auto space-y-2 text-center">
                    <h4 className="font-serif font-bold text-sm text-neutral-200 line-clamp-2">
                      {publishedDoc.name || publishedDoc.title}
                    </h4>
                    <p className="text-[10px] text-neutral-400 line-clamp-3 leading-snug font-serif italic">
                      "{publishedDoc.pages?.[0]?.articles?.[0]?.title || 'Breakthrough headlines from MJJ Records studio archives.'}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-800 text-[9px] text-neutral-400 flex justify-between items-center">
                    <span>{publishedDoc.pages?.length || 1} Pages</span>
                    <span className="text-amber-400 font-bold">Interactive 3D</span>
                  </div>
                </div>

                {/* Info & CTA */}
                <div className="flex-1 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>ON AIR / LIVE PUBLISHED</span>
                  </div>

                  <h4 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                    {publishedDoc.name || publishedDoc.title}
                  </h4>

                  <p className="text-sm text-neutral-300 leading-relaxed">
                    Published on {publishedDoc.publishedAt ? new Date(publishedDoc.publishedAt).toLocaleDateString() : 'Today'}. Open the flipbook viewer to read the full edition with real page-turning physics and discover secret rewards hidden inside.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button
                      onClick={() => setActiveReadingDoc(formatAsNewspaperProject(publishedDoc))}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>READ NEWSPAPER (3D FLIPBOOK)</span>
                    </button>
                  </div>
                </div>

                {/* Real-Time Broadsheet Emoji Reactions Bar */}
                <div className="w-full pt-4 border-t border-neutral-800/80">
                  <NewspaperReactionBar
                    newspaperId={publishedDoc.id || 'live-broadsheet'}
                    currentUser={currentUserProfile}
                    onRequireAuth={() => setShowAuthModal(true)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-neutral-900/60 border border-dashed border-neutral-800 rounded-3xl p-12 text-center space-y-4">
                  <AlertCircle className="w-10 h-10 text-neutral-500 mx-auto" />
                  <h4 className="text-lg font-serif font-bold text-neutral-300">No Newspaper Currently Live</h4>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    Staff members can publish broadsheets from the Staff Studio with custom countdown timers. Explore our past archives below!
                  </p>
                </div>

                <NewspaperReactionBar
                  newspaperId="mjj-portal-general"
                  currentUser={currentUserProfile}
                  onRequireAuth={() => setShowAuthModal(true)}
                />
              </div>
            )}
          </section>

          {/* Archival Library Section */}
          <section className="space-y-6">
            <div className="border-b border-neutral-800 pb-4 flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-serif font-bold text-neutral-100 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-amber-400" />
                  <span>Public Archival Library</span>
                </h3>
                <p className="text-xs text-neutral-400">Past broadsheet releases &amp; historical press editions</p>
              </div>
              <div className="text-xs text-neutral-500 font-mono">
                Total Archived: {archives.length} Editions
              </div>
            </div>

            {archives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archives.map((archive) => (
                  <div
                    key={archive.id}
                    className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono uppercase bg-neutral-800 text-amber-400 px-2.5 py-1 rounded-full border border-neutral-700">
                          ARCHIVED EDITION
                        </span>
                        <span className="text-xs text-neutral-500 font-mono">
                          {archive.lastEdited || '2025'}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-lg text-neutral-100 group-hover:text-amber-400 transition-colors">
                        {archive.name || archive.title}
                      </h4>

                      <p className="text-xs text-neutral-400 line-clamp-2">
                        {archive.pages?.[0]?.articles?.[0]?.title || 'Complete archived news edition from the MJJ Records collection.'}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between">
                      <span className="text-xs text-neutral-500">{archive.pages?.length || 1} Pages</span>
                      <button
                        onClick={() => setActiveReadingDoc(formatAsNewspaperProject(archive))}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Read Archive</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-8 text-center text-xs text-neutral-500">
                No archived broadsheets yet. Once published newspapers expire on their countdown timer, they will appear here automatically.
              </div>
            )}
          </section>
        </div>
      )}

      {/* 3D Flipbook Newspaper Reader Modal */}
      {activeReadingDoc && (
        <FlipbookReader
          project={activeReadingDoc}
          activePromoCodes={promoCodes}
          onNavigateToRedeem={(codeStr) => {
            setRedeemCode(codeStr);
            setShowRedeemModal(true);
            setRedeemStatus({ type: null, message: '' });
          }}
          onClose={() => setActiveReadingDoc(null)}
        />
      )}

      {/* MARKETING TEAM RECRUITMENT APPLICATION MODAL */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAppModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-xl p-1"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">Apply for Staff Contractor</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Submit your application to become an official MJJ Records Staff Contractor. Your application will be reviewed directly by staff.
              </p>
            </div>

            <form onSubmit={handleApplicationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
                  Full Name / Alias
                </label>
                <input
                  type="text"
                  value={appFullName}
                  onChange={(e) => setAppFullName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
                  Your Discord Username <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  value={appDiscord}
                  onChange={(e) => setAppDiscord(e.target.value)}
                  placeholder="e.g. moonwalker_99"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
                  Desired Staff Role <span className="text-emerald-400">*</span>
                </label>
                <select
                  value={appRole}
                  onChange={(e) => setAppRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-emerald-300 focus:outline-none focus:border-emerald-500 text-sm font-sans"
                >
                  <option value="App Moderator">🛡️ App Moderator (Chat moderation, muting, warnings)</option>
                  <option value="Newspaper Specialist">📰 Newspaper Specialist (Broadsheet publishing &amp; editing)</option>
                  <option value="Challenge Maker">🏆 Challenge Maker (Contest curation &amp; bounties)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
                  Why do you want to join as a {appRole}? <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={appReason}
                  onChange={(e) => setAppReason(e.target.value)}
                  placeholder={`Describe your experience and motivation to serve as a ${appRole}...`}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 text-sm leading-relaxed"
                  required
                />
              </div>

              {appStatus.type && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
                    appStatus.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {appStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <span>{appStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingApp}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmittingApp ? (
                  <span>Submitting Application...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>SUBMIT APPLICATION TO STAFF</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Secret Code Redemption Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowRedeemModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-xl p-1"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">Redeem Secret Code</h3>
              <p className="text-xs text-neutral-400">
                Enter the reward code along with your Discord username to claim points and VIP access.
              </p>
            </div>

            <form onSubmit={handleRedeemCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Code
                </label>
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="e.g. KOP-8824"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Your Discord Username
                </label>
                <input
                  type="text"
                  value={discordUser}
                  onChange={(e) => setDiscordUser(e.target.value)}
                  placeholder="e.g. moonwalker_99"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 text-sm"
                  required
                />
              </div>

              {redeemStatus.type && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
                    redeemStatus.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {redeemStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <span>{redeemStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingCode}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingCode ? (
                  <span>Validating Code...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>CLAIM REWARD</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User Profile, Discord Handle, Points & VIP Passes Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={currentUserProfile}
        onLogout={handleLogout}
        initialTab={profileModalTab}
      />

      {/* Auth / Sign-In Modal */}
      <AuthSignInModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(profile) => {
          setCurrentUserProfile(profile);
          const dName = profile.discordUser || profile.discordUsername;
          if (dName) setDiscordUser(dName);
        }}
      />
    </div>
  );
};
