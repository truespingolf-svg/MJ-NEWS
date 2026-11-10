import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PublicMarqueeBanner } from '../common/PublicMarqueeBanner';
import { FlipbookReader } from '../canvas/FlipbookReader';
import { NewspaperProject } from '../../types/newspaper.ts';

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
} from '../../services/firestoreStorage.ts';
import { CommunityLeaderboardSection } from './CommunityLeaderboardSection.tsx';
import { UserProfileModal } from './UserProfileModal.tsx';
import { NewspaperReactionBar } from './NewspaperReactionBar.tsx';
import { CommunityChallengesSection } from './CommunityChallengesSection.tsx';
import { AuthSignInModal } from './AuthSignInModal.tsx';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

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

export const MjjRecordsPortal: React.FC<MjjRecordsPortalProps> = ({
  onOpenStaffPortal,
  textureEnabled,
  onToggleTexture,
}) => {
  const [publishedDoc, setPublishedDoc] = useState<any | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Authenticated Community User & Leaderboard state
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [allCommunityUsers, setAllCommunityUsers] = useState<UserProfile[]>([]);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Active reading modal
  const [activeReadingDoc, setActiveReadingDoc] = useState<NewspaperProject | null>(null);

  // Countdown timer state
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

  // Marketing Application modal state
  const [showAppModal, setShowAppModal] = useState<boolean>(false);
  const [appFullName, setAppFullName] = useState<string>('');
  const [appDiscord, setAppDiscord] = useState<string>('');
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

  // Real-time Firestore sync subscriptions
  useEffect(() => {
    // 1. Subscribe to Live Published Broadsheet
    const unsubPub = subscribePublishedNewspaper((pub) => {
      setPublishedDoc(pub);
      setExpiresAt(pub?.expiresAt || null);
      setLoading(false);
    });

    // 2. Subscribe to Announcements
    const unsubAnn = subscribeAnnouncements((anns) => {
      setAnnouncements(anns.filter((a) => a.active !== false));
    });

    // 3. Subscribe to Secret Reward Codes
    const unsubCodes = subscribePromoCodes((codes) => {
      setPromoCodes(codes.filter((c) => c.active !== false));
    });

    // 4. Subscribe to Published Broadsheets for Public Archival Library
    const unsubProj = subscribeAllPublishedNewspapers((pubs) => {
      setArchives(pubs);
    });

    // 5. Subscribe to Community Users for Public Leaderboard
    const unsubUsers = subscribeUsers((users) => {
      setAllCommunityUsers(users);
    });

    // 6. Subscribe to Firebase Auth State
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
        setCurrentUserProfile(null);
      }
    });

    return () => {
      unsubPub();
      unsubAnn();
      unsubCodes();
      unsubProj();
      unsubUsers();
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  // Timer countdown hook
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

  // Google Authentication handlers
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        const profile = await syncUserProfile(user);
        setCurrentUserProfile(profile);
        const discordName = profile?.discordUser || profile?.discordUsername;
        if (discordName) {
          setDiscordUser(discordName);
        }
      }
    } catch (err) {
      console.error('Google sign in error:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUserProfile(null);
      setShowProfileModal(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Unified Code redemption submit via Firestore (General Points Codes + Secret Broadsheet Codes)
  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = redeemCode.trim();
    const cleanDiscord = (discordUser.trim() || currentUserProfile?.discordUser || currentUserProfile?.discordUsername || '').trim();

    if (!cleanCode) {
      setRedeemStatus({ type: 'error', message: 'Please enter a reward or promo code.' });
      return;
    }

    if (!cleanDiscord && !currentUserProfile) {
      setRedeemStatus({ type: 'error', message: 'Please enter your Discord username or sign in with Google first.' });
      return;
    }

    setIsSubmittingCode(true);
    setRedeemStatus({ type: null, message: '' });

    try {
      // 1. Check if it is a General Points Reward Code first
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
          message: `🎉 Reward Claimed! You received +${(pointsRes.pointsAwarded || 0).toLocaleString()} community points!`,
        });
        setRedeemCode('');
        return;
      }

      // If the code was a points code but already redeemed or revoked:
      if (pointsRes.error && !pointsRes.error.toLowerCase().includes('not found') && !pointsRes.error.toLowerCase().includes('invalid')) {
        setRedeemStatus({
          type: 'error',
          message: pointsRes.error,
        });
        return;
      }

      // 2. Otherwise fallback to Secret Broadsheet Promo Code
      const secretRes = await redeemCodeFirestore(cleanCode, cleanDiscord || 'Community Member');

      // Also background ping server if available
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
          message: secretRes.message || 'Secret broadsheet code successfully redeemed! Your reward has been recorded!',
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

  // Marketing Application submit via Firestore
  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appDiscord.trim() || !appReason.trim()) {
      setAppStatus({ type: 'error', message: 'Please enter your Discord username and reason for applying.' });
      return;
    }

    setIsSubmittingApp(true);
    setAppStatus({ type: null, message: '' });

    try {
      const ok = await submitApplicationFirestore({
        discordUser: appDiscord.trim(),
        fullName: appFullName.trim() || 'Anonymous Applicant',
        reason: appReason.trim(),
      });

      // Also background ping server if available
      fetch('/api/public/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordUser: appDiscord.trim(),
          fullName: appFullName.trim() || 'Anonymous Applicant',
          reason: appReason.trim(),
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
          message: 'Your application has been submitted successfully to the MJJ Records Staff Authorisation Centre!',
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

  return (
    <div className="flex-1 w-full overflow-y-auto bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500 selection:text-black relative">
      {/* Top Scrolling Marquee Announcement Banner */}
      <PublicMarqueeBanner announcements={announcements} />

      {/* Main Header */}
      <header className="border-b border-neutral-800/90 bg-neutral-950/90 backdrop-blur-xl sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse-glow" />
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-600 flex items-center justify-center text-black font-black tracking-tighter text-lg shadow-lg relative">
                MJJ
              </div>
            </div>
            <div>
              <h1 className="text-xl font-serif tracking-wider font-black text-amber-400 uppercase flex items-center gap-2">
                MJJ RECORDS <span className="text-[10px] font-sans font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40 shadow-sm animate-pulse">OFFICIAL PORTAL</span>
              </h1>
              <p className="text-[11px] text-neutral-400">The King of Pop Publishing &amp; Media Studio</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Texture Toggle */}
            <button
              onClick={onToggleTexture}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 ${
                textureEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
              title="Toggle newsprint paper texture overlay"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Newsprint Texture: {textureEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Apply for Marketing Team */}
            <button
              onClick={() => {
                setShowAppModal(true);
                setAppStatus({ type: null, message: '' });
              }}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 transform hover:scale-105 active:scale-95"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Apply for Marketing</span>
            </button>

            {/* Redeem Secret / Points Code Button */}
            <button
              onClick={() => {
                setShowRedeemModal(true);
                setRedeemStatus({ type: null, message: '' });
              }}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 transform hover:scale-105 active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Redeem Code</span>
            </button>

            {/* Google Sign-In or User Profile Badge */}
            {currentUserProfile ? (
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-neutral-900 to-[#181824] hover:from-neutral-850 hover:to-[#202030] border border-amber-500/40 hover:border-amber-400 transition-all flex items-center gap-2 shadow-md cursor-pointer group"
                title="View your player profile, Discord handle, points, and tickets"
              >
                {currentUserProfile.photoURL ? (
                  <img
                    src={currentUserProfile.photoURL}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover border border-amber-400/60"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-[10px]">
                    {currentUserProfile.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                  {(currentUserProfile.discordUser || currentUserProfile.discordUsername) ? `@${currentUserProfile.discordUser || currentUserProfile.discordUsername}` : (currentUserProfile.displayName || 'Player')}
                </span>
                <span className="text-[10px] font-mono font-black bg-amber-500 text-black px-2 py-0.5 rounded-full">
                  {(currentUserProfile.points || 0).toLocaleString()} PTS
                </span>
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 transform hover:scale-105 active:scale-95 cursor-pointer font-sans"
                title="Sign in or enter your Discord username to react, vote, and enter challenges"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Join / Sign In</span>
              </button>
            )}

            {/* Staff Studio Entry */}
            <button
              onClick={onOpenStaffPortal}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition-all flex items-center gap-1.5 shadow-md"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Unlock with Password</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14 relative z-10">

        {/* HERO SECTION WITH MOVING GRAPHICS & SPINNING VINYL */}
        <section className="bg-gradient-to-br from-[#121218] via-[#0b0b0e] to-[#15151f] border border-amber-500/30 p-8 sm:p-12 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          {/* Animated Background Laser Sweep & Ambient Aura */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Column: Text & CTAs (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider shadow-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 animate-spin-vinyl-reverse" />
                <span>THE OFFICIAL MJJ RECORDS MEDIA &amp; PRESS PRESSROOM</span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black text-neutral-100 tracking-tight leading-[1.1]">
                King of Pop Broadsheets &amp; <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500">
                  Official Media Studio Archives
                </span>
              </h2>

              <p className="text-neutral-300 text-base sm:text-lg max-w-xl leading-relaxed">
                Explore live broadsheet newspapers, interactive 3D paper flipbooks, and secret reward codes. Interested in driving public relations and global media campaigns? Join our team today!
              </p>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => {
                    if (publishedDoc) setActiveReadingDoc(formatAsNewspaperProject(publishedDoc));
                    else if (archives.length > 0) setActiveReadingDoc(formatAsNewspaperProject(archives[0]));
                  }}
                  disabled={!publishedDoc && archives.length === 0}
                  className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  <BookOpen className="w-5 h-5 stroke-[2.2]" />
                  <span>Read Latest Newspaper Edition</span>
                </button>

                <button
                  onClick={() => {
                    setShowAppModal(true);
                    setAppStatus({ type: null, message: '' });
                  }}
                  className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Briefcase className="w-5 h-5 stroke-[2.2]" />
                  <span>Apply for Marketing Team</span>
                </button>

                <button
                  onClick={() => setShowRedeemModal(true)}
                  className="px-6 py-3.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 font-semibold text-sm transition-all flex items-center gap-2 shadow-md"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Enter Discord Code</span>
                </button>
              </div>

              {/* Feature Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-6 border-t border-neutral-800/80">
                <div className="p-3 bg-neutral-950/70 border border-neutral-800/90 rounded-2xl flex items-center justify-center text-center shadow-inner hover:border-amber-500/40 transition-colors">
                  <div className="text-xs sm:text-sm font-bold font-mono text-amber-400">3D FLIPBOOK</div>
                </div>
                <div className="p-3 bg-neutral-950/70 border border-neutral-800/90 rounded-2xl flex items-center justify-center text-center shadow-inner hover:border-emerald-500/40 transition-colors">
                  <div className="text-xs sm:text-sm font-bold font-mono text-emerald-400">DISCORD REWARDS</div>
                </div>
                <div className="p-3 bg-neutral-950/70 border border-neutral-800/90 rounded-2xl flex items-center justify-center text-center shadow-inner hover:border-yellow-400/40 transition-colors">
                  <div className="text-xs sm:text-sm font-bold font-mono text-yellow-300">LIVE TIMERS</div>
                </div>
                <div className="p-3 bg-neutral-950/70 border border-neutral-800/90 rounded-2xl flex items-center justify-center text-center shadow-inner hover:border-teal-400/40 transition-colors">
                  <div className="text-xs sm:text-sm font-bold font-mono text-teal-300">MARKETING TEAM</div>
                </div>
              </div>
            </div>

            {/* Right Column: Moving Animated Graphic - Floating 3D Vinyl & Soundwave Badge (5 Cols) */}
            <div className="lg:col-span-5 flex justify-center items-center relative py-6">
              <div className="relative animate-float-slow">
                {/* Gold Glow Ring */}
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-600/30 rounded-full blur-2xl animate-pulse-glow" />

                {/* Outer Turntable Deck Disc Container */}
                <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-neutral-950 border-4 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative flex items-center justify-center">
                  
                  {/* Spinning Vinyl Vinyl Graphic */}
                  <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-[#0a0a0e] border-2 border-neutral-800 relative flex items-center justify-center shadow-2xl animate-spin-vinyl">
                    {/* Vinyl Grooves Texture SVG Overlay */}
                    <div className="absolute inset-0 rounded-full border border-neutral-700/40 opacity-75" />
                    <div className="absolute inset-4 rounded-full border border-neutral-800 opacity-60" />
                    <div className="absolute inset-8 rounded-full border border-neutral-700/30 opacity-80" />
                    <div className="absolute inset-12 rounded-full border border-neutral-800 opacity-50" />
                    <div className="absolute inset-16 rounded-full border border-neutral-700/40 opacity-70" />

                    {/* Record Label Center */}
                    <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 p-1 flex flex-col items-center justify-center text-center shadow-2xl relative border-2 border-amber-200">
                      <div className="w-4 h-4 rounded-full bg-neutral-950 border border-neutral-700 mb-0.5 shadow-inner" />
                      <span className="font-serif font-black text-[9px] text-amber-950 uppercase tracking-tighter leading-none">
                        MJJ RECORDS
                      </span>
                      <span className="font-mono text-[7px] text-amber-900 mt-0.5 font-bold">
                        STEREO PRESS
                      </span>
                    </div>
                  </div>

                  {/* Equalizer Live Bouncing Waves Badge */}
                  <div className="absolute -bottom-2 bg-neutral-900/90 border border-amber-500/40 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">PRESSROOM SOUND</span>
                    <div className="flex items-end gap-1 h-3.5">
                      <span className="w-1 bg-amber-400 animate-bounce h-3" />
                      <span className="w-1 bg-amber-300 animate-bounce h-3.5 delay-100" />
                      <span className="w-1 bg-amber-400 animate-bounce h-2 delay-200" />
                      <span className="w-1 bg-amber-300 animate-bounce h-3.5 delay-75" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Currently Published Newspaper Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <h3 className="text-2xl font-serif font-bold text-neutral-100 flex items-center gap-2">
                <Newspaper className="w-6 h-6 text-amber-400" />
                <span>Current Published Broadsheet</span>
              </h3>
              <p className="text-xs text-neutral-400">Live official publication currently on press &amp; distribution</p>
            </div>

            {/* Live Timer Display with Moving Bouncing Equalizer Bars */}
            {publishedDoc && timeLeft && (
              <div className="flex items-center gap-3 bg-neutral-900/90 border border-amber-500/40 px-4 py-2 rounded-2xl shadow-xl backdrop-blur">
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 flex items-center gap-1.5">
                    <span>Live Broadcast Timer</span>
                    <div className="flex items-end gap-0.5 h-2.5">
                      <span className="w-0.5 bg-amber-400 animate-bounce h-2" />
                      <span className="w-0.5 bg-amber-400 animate-bounce h-2.5 delay-75" />
                      <span className="w-0.5 bg-amber-400 animate-bounce h-1.5 delay-150" />
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold text-amber-300">
                    {String(timeLeft.hours).padStart(2, '0')}:
                    {String(timeLeft.minutes).padStart(2, '0')}:
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                </div>
              </div>
            )}
          </div>

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
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>READ NEWSPAPER (3D FLIPBOOK)</span>
                  </button>

                  <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Secret Reward Codes standard discovery chance</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Broadsheet Emoji Reactions Bar (+1,000 Points) */}
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

              {/* General Portal Reaction Bar even when no live edition */}
              <NewspaperReactionBar
                newspaperId="mjj-portal-general"
                currentUser={currentUserProfile}
                onRequireAuth={() => setShowAuthModal(true)}
              />
            </div>
          )}
        </section>

        {/* Community Fan Photo Challenges & Contests Section */}
        <CommunityChallengesSection
          currentUser={currentUserProfile}
          onRequireAuth={() => setShowAuthModal(true)}
        />

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
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/20 transition-all flex items-center gap-1.5"
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

        {/* Public Community Leaderboard Section */}
        <section className="space-y-6">
          <CommunityLeaderboardSection
            users={allCommunityUsers}
            currentUser={currentUserProfile}
            onRequireAuth={() => setShowAuthModal(true)}
          />
        </section>

      </main>

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

      {/* MARKETING TEAM RECRUITMENT APPLICATION MODAL (No preferred role field) */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
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
              <h3 className="text-2xl font-serif font-bold text-white">Join MJJ Records Marketing Team</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Submit your application to work in marketing. Your application will be sent directly to the Staff Authorisation Centre.
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
                  Reason for Wanting to Work in Marketing <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={appReason}
                  onChange={(e) => setAppReason(e.target.value)}
                  placeholder="Describe your motivation, experience, and why you want to work in marketing with MJJ Records..."
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

            <div className="text-center text-[10px] text-neutral-500">
              Applications are reviewed directly by staff members inside the Authorisation Centre.
            </div>
          </div>
        </div>
      )}

      {/* Secret Code Redemption Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
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
                Enter the secret reward code found in newspaper broadsheet pages along with your Discord handle.
              </p>
            </div>

            <form onSubmit={handleRedeemCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Secret Code
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

            <div className="text-center text-[10px] text-neutral-500">
              Redemptions are verified instantly and recorded in the Staff Authorisation log.
            </div>
          </div>
        </div>
      )}

      {/* User Profile, Discord Handle, Points & VIP Passes Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={currentUserProfile}
        onLogout={handleLogout}
      />

      {/* Foolproof Auth / Sign-In Modal */}
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
