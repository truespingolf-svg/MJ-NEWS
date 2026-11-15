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
  Bell,
  Play,
  Disc,
  LogIn,
  Volume2,
  VolumeX,
  Download,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PublicMarqueeBanner } from '../common/PublicMarqueeBanner';
import { FlipbookReader } from '../canvas/FlipbookReader';
import { NewspaperPageRenderer } from '../canvas/NewspaperPageRenderer.tsx';
import { NewspaperProject } from '../../types/newspaper.ts';
import { getLocalMedia } from '../../services/localMediaRegistry.ts';
import { downloadProjectPdf } from '../../services/pdfExport.ts';
import { ensurePageEditableSlots } from '../../utils/newspaperLogic.ts';
import { getUserPermissions } from '../../utils/permissions.ts';
import heroStageImg from '../../assets/images/hero_mj_cinematic_stage_1794407118726.jpg';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, logoutUser } from '../../firebase.ts';
import {
  subscribePublishedNewspaper,
  subscribeAnnouncements,
  subscribePromoCodes,
  subscribeAllPublishedNewspapers,
  redeemCodeFirestore,
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

import { ThrillerCinematicIntro } from '../common/ThrillerCinematicIntro.tsx';
import { UpcomingEventCountdown } from '../home/UpcomingEventCountdown.tsx';
import { NewsPlatformSection } from '../news/NewsPlatformSection.tsx';
import { StreamingPlatformSection } from '../streaming/StreamingPlatformSection.tsx';
import { AtmosphericMovingBackground } from '../common/AtmosphericMovingBackground.tsx';

interface Announcement {
  id: string;
  text: string;
  active: boolean;
}

interface MjjRecordsPortalProps {
  onOpenStaffPortal: () => void;
  onOpenNewspaperStudio?: () => void;
  textureEnabled: boolean;
  onToggleTexture: () => void;
}

export type PortalNavTab = 'HOME' | 'NEWS' | 'CHALLENGES' | 'STREAMING' | 'NEWSPAPER';
export type HomeSubTab = 'stage' | 'challenges' | 'leaderboard' | 'news';

export const MjjRecordsPortal: React.FC<MjjRecordsPortalProps> = ({
  onOpenStaffPortal,
  onOpenNewspaperStudio,
  textureEnabled,
  onToggleTexture,
}) => {
  const [activeNavTab, setActiveNavTab] = useState<PortalNavTab>('HOME');
  const [homeSubTab, setHomeSubTab] = useState<HomeSubTab>('stage');

  // Thriller Cinematic Loading Sequence (Always preserved intact)
  const [showCinematicIntro, setShowCinematicIntro] = useState<boolean>(true);

  // Site Entrance Background Music Player state (Always preserved intact)
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

  // Authenticated Community User & Leaderboard state
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [allCommunityUsers, setAllCommunityUsers] = useState<UserProfile[]>([]);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'notifications'>('profile');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Active reading modal & portal direct PDF export
  const [activeReadingDoc, setActiveReadingDoc] = useState<NewspaperProject | null>(null);
  const [pdfExportTarget, setPdfExportTarget] = useState<NewspaperProject | null>(null);
  const [isExportingPortalPdf, setIsExportingPortalPdf] = useState<boolean>(false);
  const [portalPdfStatus, setPortalPdfStatus] = useState<string>('');
  const portalPdfContainerRef = useRef<HTMLDivElement | null>(null);

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

  const [promoCodes, setPromoCodes] = useState<any[]>([]);

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
      if (pub && pub.isActive && !isChronicleDoc(pub)) {
        setPublishedDoc(pub);
        setExpiresAt(pub?.expiresAt || null);
      } else {
        setPublishedDoc(null);
        setExpiresAt(null);
      }
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

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const target = new Date(expiresAt).getTime();
      const now = Date.now();
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
        message: 'Please enter your Discord username or sign in first.',
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
          message: `Reward Claimed! You received +${(pointsRes.pointsAwarded || 0).toLocaleString()} community points.`,
        });
        setRedeemCode('');
        return;
      }

      if (
        pointsRes.error &&
        !pointsRes.error.toLowerCase().includes('not found') &&
        !pointsRes.error.toLowerCase().includes('invalid')
      ) {
        setRedeemStatus({ type: 'error', message: pointsRes.error });
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
            colors: ['#EAB308', '#D97706', '#F59E0B', '#FFFFFF'],
          });
        } catch {
          // ignore
        }

        setRedeemStatus({
          type: 'success',
          message: secretRes.message || 'Secret broadsheet code redeemed! Your reward has been recorded.',
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

  const extractLeadHeadline = (doc: any, fallback: string): string => {
    const firstPage = doc?.pages?.[0];
    if (firstPage?.texts) {
      const t = firstPage.texts;
      const candidate =
        t.mainHeadline?.content ||
        t.leadHeadline?.content ||
        t.leadArticleHeadline?.content ||
        t.masthead?.content;
      if (candidate && String(candidate).trim()) {
        return String(candidate).trim();
      }
    }
    if (firstPage?.articles?.[0]?.title) {
      return String(firstPage.articles[0].title);
    }
    return fallback;
  };

  const handleDownloadPortalPdf = async (rawDoc: any) => {
    if (!rawDoc || isExportingPortalPdf) return;
    const formatted = formatAsNewspaperProject(rawDoc);
    const normalized: NewspaperProject = {
      ...formatted,
      pages: (formatted.pages || []).map((p, idx) =>
        ensurePageEditableSlots({ ...p, pageNumber: p.pageNumber || idx + 1 }, p.layoutId)
      ),
    };
    setPdfExportTarget(normalized);
    setIsExportingPortalPdf(true);
    setPortalPdfStatus('Preparing PDF pages...');
    setTimeout(async () => {
      try {
        const ok = await downloadProjectPdf(
          normalized,
          portalPdfContainerRef.current,
          (status) => setPortalPdfStatus(status)
        );
        if (!ok) {
          setPortalPdfStatus('Could not generate PDF. Try opening the 3D Flipbook Reader.');
        }
      } finally {
        setIsExportingPortalPdf(false);
        setTimeout(() => setPortalPdfStatus(''), 4000);
      }
    }, 320);
  };

  const userPerms = getUserPermissions(currentUserProfile?.role);
  const featuredTrack = streamingTracks[0];

  return (
    <div
      ref={mainContainerRef}
      className="flex-1 w-full overflow-y-auto bg-[#07070a] text-neutral-100 font-sans selection:bg-red-600 selection:text-white relative"
    >
      <AtmosphericMovingBackground />

      {/* Preserved Thriller Loading Screen */}
      {showCinematicIntro && (
        <ThrillerCinematicIntro onComplete={handleDismissIntro} sharedAudioRef={bgAudioRef} />
      )}

      {/* Clean Top Wire Banner */}
      <PublicMarqueeBanner announcements={announcements} />

      {/* Preserved Entrance Music Player */}
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
        onEnded={() => setIsBgAudioPlaying(false)}
      />

      {/* Responsive Top Navigation Header */}
      <header className="border-b border-neutral-800/80 bg-[#09090c]/95 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Main Top Bar */}
          <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
            {/* Zone 1: Clean Brand Wordmark */}
            <button
              type="button"
              onClick={() => setActiveNavTab('HOME')}
              className="text-left cursor-pointer group shrink-0"
            >
              <span className="text-base sm:text-xl font-serif tracking-[0.2em] font-black text-white group-hover:text-red-400 transition-colors uppercase whitespace-nowrap">
                MJJ <span className="text-red-500">RECORDS</span>
              </span>
            </button>

            {/* Zone 2 (Desktop xl+ inline nav): 5 Navigation Tabs */}
            <nav className="hidden xl:flex items-center gap-2">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer relative shrink-0 whitespace-nowrap ${
                      isActive
                        ? 'text-white bg-neutral-900 border border-red-500/40 shadow-sm shadow-red-950/40'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 border border-transparent'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-red-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Entrance Music Toggle */}
              <button
                onClick={toggleBgAudio}
                className={`px-2 sm:px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer tabular-nums ${
                  isBgAudioPlaying
                    ? 'bg-red-950/60 border-red-500/50 text-red-200'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={isBgAudioPlaying ? 'Pause Entrance Music' : 'Play Entrance Music'}
              >
                {isBgAudioPlaying ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="hidden md:inline text-[11px]">
                      {formatAudioTime(bgAudioTime.current)} / {formatAudioTime(bgAudioTime.duration)}
                    </span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="hidden md:inline text-[11px]">Music</span>
                  </>
                )}
              </button>

              {/* Redeem */}
              <button
                onClick={() => {
                  setShowRedeemModal(true);
                  setRedeemStatus({ type: null, message: '' });
                }}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-all flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Redeem</span>
              </button>

              {/* User Profile or Sign In */}
              {currentUserProfile ? (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <button
                    onClick={() => {
                      setProfileModalTab('notifications');
                      setShowProfileModal(true);
                    }}
                    className="p-1.5 sm:p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 relative transition-colors cursor-pointer"
                    title="Notifications & Inbox"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {currentUserProfile.notifications && currentUserProfile.notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                        {currentUserProfile.notifications.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setProfileModalTab('profile');
                      setShowProfileModal(true);
                    }}
                    className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {currentUserProfile.photoURL ? (
                      <img
                        src={currentUserProfile.photoURL}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-[10px]">
                        {currentUserProfile.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-neutral-200 max-w-[80px] truncate hidden md:inline">
                      {currentUserProfile.discordUser || currentUserProfile.discordUsername
                        ? `@${currentUserProfile.discordUser || currentUserProfile.discordUsername}`
                        : currentUserProfile.displayName || 'Player'}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-500 text-black px-1.5 py-0.5 rounded tabular-nums">
                      {(currentUserProfile.points || 0).toLocaleString()}
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {userPerms.canAccessNewspaperStudio && onOpenNewspaperStudio && (
                <button
                  type="button"
                  onClick={onOpenNewspaperStudio}
                  className="px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  title="Open Newspaper Studio"
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Studio</span>
                </button>
              )}

              <button
                onClick={onOpenStaffPortal}
                className="px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                title="Unlock Staff Administration Studio"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Staff</span>
              </button>
            </div>
          </div>

          {/* Sub Row for Mobile/Tablet (< xl): Dedicated Navigation Tabs Row */}
          <div className="xl:hidden border-t border-neutral-800/70 py-2 -mx-3 px-3 sm:-mx-6 sm:px-6">
            <nav className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer relative shrink-0 whitespace-nowrap ${
                      isActive
                        ? 'text-white bg-neutral-900 border border-red-500/40 shadow-sm shadow-red-950/40'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50 border border-transparent'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-red-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* TAB 1: COMPACT INTERACTIVE HOME WITH SUB-TABS */}
      {activeNavTab === 'HOME' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 relative z-10">
          {/* Compact Interactive Hero Banner */}
          <section className="relative rounded-2xl overflow-hidden border border-red-900/50 bg-[#0b0709] group">
            <div className="absolute inset-0">
              <img
                src={heroStageImg}
                alt="Michael Jackson Stage Concert"
                className="w-full h-full object-cover object-center brightness-[0.38] contrast-[1.15] transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#07070a]/95 via-[#07070a]/75 to-transparent" />
              <div className="absolute -inset-12 bg-red-600/10 blur-3xl animate-spotlight-drift pointer-events-none" />
            </div>

            <div className="relative z-10 px-6 sm:px-10 py-8 sm:py-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4 max-w-2xl">
                <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-red-400 font-bold">
                  Official Entertainment &amp; Press Label
                </div>

                <div className="select-none">
                  <h1
                    className="text-5xl sm:text-7xl font-black font-serif tracking-wide text-red-600 uppercase leading-none"
                    style={{
                      textShadow: '0 0 24px rgba(220,38,38,0.55), 3px 4px 0px #280305',
                    }}
                  >
                    MJJ <span className="text-red-500">RECORDS</span>
                  </h1>
                  {/* Subtle Dripping Blood Accent Bar */}
                  <div className="flex gap-5 pt-1.5 pl-1 pointer-events-none">
                    {[16, 24, 14, 28, 18, 22].map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 rounded-full bg-gradient-to-b from-red-600 to-red-950 animate-blood-drip"
                        style={{ height: `${h}px`, animationDelay: `${i * 0.28}s` }}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 max-w-lg leading-relaxed">
                  Explore restored concert streams, weekly community challenges, broadsheet press editions, and live leaderboard standings.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => setActiveNavTab('STREAMING')}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Streaming Vault</span>
                  </button>

                  <button
                    onClick={() => setActiveNavTab('NEWSPAPER')}
                    className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read Broadsheet</span>
                  </button>
                </div>
              </div>

              {/* Quick Live Snapshot Card */}
              <div className="lg:w-80 shrink-0 bg-[#0e0e13]/90 backdrop-blur-md border border-neutral-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span className="text-amber-400 font-bold uppercase tracking-wider">Studio Pulse</span>
                  <span className="tabular-nums">{allCommunityUsers.length} Players</span>
                </div>

                {featuredTrack && (
                  <button
                    type="button"
                    onClick={() => setActiveNavTab('STREAMING')}
                    className="w-full p-2.5 rounded-lg bg-neutral-950/90 border border-neutral-800 hover:border-red-500/40 flex items-center gap-3 text-left transition-colors cursor-pointer group/track"
                  >
                    <div className="w-10 h-10 rounded-lg bg-black border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {featuredTrack.coverImage ? (
                        <img src={featuredTrack.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Disc className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate group-hover/track:text-amber-300 transition-colors">
                        {featuredTrack.title}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 truncate">
                        {featuredTrack.album} · {featuredTrack.era}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover/track:translate-x-0.5 group-hover/track:text-white transition-all shrink-0" />
                  </button>
                )}

                {publishedDoc ? (
                  <button
                    type="button"
                    onClick={() => setActiveNavTab('NEWSPAPER')}
                    className="w-full p-2.5 rounded-lg bg-neutral-950/90 border border-neutral-800 hover:border-amber-500/40 flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                        Live Edition
                      </div>
                      <div className="text-xs font-semibold text-white truncate">
                        {publishedDoc.name || publishedDoc.title}
                      </div>
                    </div>
                    {timeLeft && (
                      <span className="text-[10px] font-mono text-amber-300 tabular-nums shrink-0 ml-2">
                        {timeLeft.hours}h {String(timeLeft.minutes).padStart(2, '0')}m
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveNavTab('NEWSPAPER')}
                    className="w-full p-2.5 rounded-lg bg-neutral-950/90 border border-neutral-800 hover:border-amber-500/40 flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-medium text-neutral-300">
                      Browse Press Archives ({archives.length})
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* HOME SUB-TABS BAR — Responsive, never clipped or cut off */}
          <div className="border-b border-neutral-800/80 pb-3">
            <div className="w-full bg-[#0d0d12] p-1.5 rounded-2xl border border-neutral-800/90">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2">
                {(
                  [
                    { id: 'stage', label: 'Event Stage', icon: Calendar, badge: 'Live' },
                    { id: 'challenges', label: 'Challenges', icon: Trophy, badge: null },
                    { id: 'leaderboard', label: 'Leaderboard', icon: Sparkles, badge: '2h Vote' },
                    { id: 'news', label: 'Latest News', icon: Newspaper, badge: null },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = homeSubTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHomeSubTab(item.id)}
                      className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        active
                          ? 'bg-red-600 text-white shadow-md shadow-red-950/60 ring-1 ring-red-400/50'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900/80'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-sans px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${
                            active
                              ? 'bg-black/40 text-red-200'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ACTIVE HOME SUB-TAB CONTENT */}
          <div key={homeSubTab} className="animate-panel-reveal">
            {homeSubTab === 'stage' && (
              <div className="space-y-5">
                <UpcomingEventCountdown />
              </div>
            )}

            {homeSubTab === 'challenges' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-white">Active Community Challenges</h2>
                    <p className="text-xs text-neutral-400">Enter photo contests and vote on top entries.</p>
                  </div>
                  <button
                    onClick={() => setActiveNavTab('CHALLENGES')}
                    className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-800 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Full Challenges Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <CommunityChallengesSection
                  currentUser={currentUserProfile}
                  onRequireAuth={() => setShowAuthModal(true)}
                />
              </div>
            )}

            {homeSubTab === 'leaderboard' && (
              <CommunityLeaderboardSection
                users={allCommunityUsers}
                currentUser={currentUserProfile}
                onRequireAuth={() => setShowAuthModal(true)}
              />
            )}

            {homeSubTab === 'news' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-white">Latest Press Dispatches</h2>
                    <p className="text-xs text-neutral-400">Official MJJ Records headlines and release notes.</p>
                  </div>
                  <button
                    onClick={() => setActiveNavTab('NEWS')}
                    className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-red-300 border border-neutral-800 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>All News</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {newsArticles.length === 0 ? (
                  <div className="p-10 sm:p-14 text-center rounded-2xl bg-[#0d0d12] border border-dashed border-neutral-800 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                      <Newspaper className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif font-bold text-base text-white">No Press Dispatches Published Yet</h3>
                      <p className="text-xs font-mono text-neutral-400 max-w-md mx-auto leading-relaxed">
                        Official MJJ Records press bulletins and release notes will appear here once published by the News Desk.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {newsArticles.slice(0, 3).map((art) => (
                      <div
                        key={art.id}
                        onClick={() => setActiveNavTab('NEWS')}
                        className="interactive-card bg-[#0d0d11] border border-neutral-800/90 hover:border-red-500/40 rounded-2xl overflow-hidden flex flex-col justify-between group cursor-pointer"
                      >
                        <div className="aspect-[16/10] bg-neutral-900 overflow-hidden">
                          <img
                            src={art.mainImage || heroStageImg}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-2">
                              <span className="text-red-400 font-bold uppercase">{art.category}</span>
                              <span aria-hidden="true">·</span>
                              <span>{new Date(art.publishedDate).toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-serif font-bold text-base text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                              {art.headline}
                            </h4>
                            <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                              {art.shortDescription}
                            </p>
                          </div>

                          <div className="pt-2.5 mt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs font-semibold text-red-400">
                            <span>Read Story</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {/* TAB 2: NEWS HUB */}
      {activeNavTab === 'NEWS' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 animate-panel-reveal relative z-10">
          <NewsPlatformSection />
        </div>
      )}

      {/* TAB 3: CHALLENGES & CONTESTS */}
      {activeNavTab === 'CHALLENGES' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 animate-panel-reveal relative z-10">
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
      {activeNavTab === 'STREAMING' && (
        <div className="animate-panel-reveal relative z-10">
          <StreamingPlatformSection />
        </div>
      )}

      {/* TAB 5: NEWSPAPER / PRESS STUDIO */}
      {activeNavTab === 'NEWSPAPER' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10 animate-panel-reveal relative z-10">
          <div className="border-b border-neutral-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest">
                <Newspaper className="w-4 h-4" />
                <span>MJJ Records Pressroom</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-white uppercase tracking-tight">
                Broadsheet Editions &amp; Archives
              </h2>
              <p className="text-xs text-neutral-400">
                Read official printed press editions in the interactive 3D flipbook or download print-ready PDF copies.
              </p>
            </div>

            <button
              onClick={onToggleTexture}
              className={`px-3.5 py-2 text-xs font-mono font-semibold rounded-xl border transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer ${
                textureEnabled
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Newsprint Texture: {textureEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <section className="space-y-5">
            {publishedDoc ? (
              <div className="bg-[#0d0d11] border border-neutral-800 hover:border-amber-500/40 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-7 transition-colors">
                <div className="w-full md:w-56 aspect-[3/4] bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden flex flex-col justify-between p-4 shrink-0">
                  <div className="text-center border-b border-neutral-800 pb-2">
                    <span className="text-[10px] font-serif font-bold uppercase tracking-widest text-amber-400">
                      THE MJJ DAILY PRESS
                    </span>
                    <div className="text-[9px] text-neutral-500 uppercase font-mono mt-0.5">
                      Edition #{publishedDoc.issueNumber || 1}
                    </div>
                  </div>

                  <div className="my-auto space-y-2 text-center">
                    <h4 className="font-serif font-bold text-sm text-neutral-200 line-clamp-2">
                      {publishedDoc.name || publishedDoc.title}
                    </h4>
                    <p className="text-[10px] text-neutral-400 line-clamp-3 leading-snug font-serif italic">
                      "{extractLeadHeadline(publishedDoc, 'Official MJJ Records broadsheet edition.')}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-800 text-[10px] font-mono text-neutral-400 flex justify-between items-center">
                    <span>{publishedDoc.pages?.length || 1} Pages</span>
                    <span className="text-amber-400 font-bold">3D Reader</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    <span>On Air · Live Published</span>
                    {timeLeft && (
                      <>
                        <span className="text-neutral-600" aria-hidden="true">·</span>
                        <span className="text-amber-300 tabular-nums">
                          {timeLeft.hours}h {String(timeLeft.minutes).padStart(2, '0')}m left
                        </span>
                      </>
                    )}
                  </div>

                  <h4 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                    {publishedDoc.name || publishedDoc.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
                    Published on {publishedDoc.publishedAt ? new Date(publishedDoc.publishedAt).toLocaleDateString() : 'Today'}. Open the flipbook viewer to inspect every page or download a clean PDF edition.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => setActiveReadingDoc(formatAsNewspaperProject(publishedDoc))}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Read 3D Flipbook</span>
                    </button>

                    <button
                      type="button"
                      disabled={isExportingPortalPdf}
                      onClick={() => handleDownloadPortalPdf(publishedDoc)}
                      className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isExportingPortalPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
                    </button>
                  </div>

                  {portalPdfStatus && (
                    <div className="text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg inline-block">
                      {portalPdfStatus}
                    </div>
                  )}

                  <div className="pt-3 border-t border-neutral-800/80">
                    <NewspaperReactionBar
                      newspaperId={publishedDoc.id || 'live-broadsheet'}
                      currentUser={currentUserProfile}
                      onRequireAuth={() => setShowAuthModal(true)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#0d0d11] border border-dashed border-neutral-800 rounded-2xl p-10 text-center space-y-3">
                  <AlertCircle className="w-9 h-9 text-neutral-500 mx-auto" />
                  <h4 className="text-lg font-serif font-bold text-neutral-300">No Newspaper Currently Live</h4>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    Staff members can publish broadsheets from the Staff Studio. Browse past archived editions below.
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

          <section className="space-y-5">
            <div className="border-b border-neutral-800 pb-3 flex justify-between items-end">
              <div>
                <h3 className="text-xl font-serif font-bold text-neutral-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <span>Public Archival Library</span>
                </h3>
                <p className="text-xs text-neutral-400">Past broadsheet releases &amp; historical press editions</p>
              </div>
              <div className="text-xs text-neutral-500 font-mono tabular-nums">
                {archives.length} Editions
              </div>
            </div>

            {archives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {archives.map((archive) => (
                  <div
                    key={archive.id}
                    className="interactive-card bg-[#0d0d11] border border-neutral-800 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-[11px] font-mono text-neutral-400">
                        <span className="text-amber-400 font-bold uppercase">Archived</span>
                        <span>{archive.lastEdited || '2025'}</span>
                      </div>

                      <h4 className="font-serif font-bold text-lg text-neutral-100 group-hover:text-amber-400 transition-colors">
                        {archive.name || archive.title}
                      </h4>

                      <p className="text-xs text-neutral-400 line-clamp-2">
                        {extractLeadHeadline(archive, 'Complete archived edition from the MJJ Records collection.')}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-neutral-500 tabular-nums">
                        {archive.pages?.length || 1} Pages
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isExportingPortalPdf}
                          onClick={() => handleDownloadPortalPdf(archive)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Download Archive PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => setActiveReadingDoc(formatAsNewspaperProject(archive))}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Read</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0d0d11] border border-neutral-800 rounded-2xl p-8 text-center text-xs text-neutral-500">
                No archived broadsheets yet.
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

      {/* Offscreen full-opacity multi-page PDF capture container for public portal downloads */}
      {pdfExportTarget && (
        <div
          ref={portalPdfContainerRef}
          className="fixed left-[-12000px] top-0 w-[800px] opacity-100 pointer-events-none"
          aria-hidden="true"
        >
          {(pdfExportTarget.pages || []).map((p) => (
            <div key={p.id} className="export-page-target newspaper-print-page bg-white">
              <NewspaperPageRenderer
                page={p}
                selectedElementId={null}
                selectedImageSlot={null}
                onSelectText={() => {}}
                onSelectImage={() => {}}
                previewMode={true}
              />
            </div>
          ))}
        </div>
      )}

      {/* Secret Code Redemption Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111116] border border-neutral-800 rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowRedeemModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-xl p-1 cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">Redeem Reward Code</h3>
              <p className="text-xs text-neutral-400">
                Enter your code and Discord username to claim points or VIP passes.
              </p>
            </div>

            <form onSubmit={handleRedeemCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">Code</label>
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="e.g. KOP-8824"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 text-sm"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 text-sm"
                  required
                />
              </div>

              {redeemStatus.type && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
                    redeemStatus.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
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
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingCode ? (
                  <span>Validating Code...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Claim Reward</span>
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
