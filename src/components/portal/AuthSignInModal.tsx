import React, { useState } from 'react';
import {
  LogIn,
  X,
  User as UserIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { loginWithGoogle } from '../../firebase.ts';
import {
  syncUserProfile,
  loginOrCreateCommunityPlayerWithPassword,
  UserProfile,
} from '../../services/firestoreStorage.ts';

interface AuthSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
}

export const AuthSignInModal: React.FC<AuthSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [discordInput, setDiscordInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [isSigningInDiscord, setIsSigningInDiscord] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setIsSigningInGoogle(true);
    setErrorMsg(null);

    try {
      const user = await loginWithGoogle();
      if (user) {
        const profile = await syncUserProfile(user, discordInput.trim() || undefined);
        if (profile) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#EAB308', '#F59E0B', '#10B981', '#FFFFFF'],
          });
          onSuccess(profile);
          onClose();
        }
      }
    } catch (err: any) {
      console.warn('Google sign-in popup notice:', err);
      const code = err?.code || '';
      if (code === 'auth/popup-blocked') {
        setErrorMsg('Pop-up was blocked by your browser. You can allow pop-ups or sign in with your account password below!');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMsg('This web preview domain is not in Firebase Auth whitelist. Please sign in with your account password below!');
      } else {
        setErrorMsg('Google Sign-In was cancelled or unavailable. You can sign in with your password below!');
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDiscord = discordInput.trim().replace(/^@/, '');
    if (!cleanDiscord) {
      setErrorMsg('Please enter your Discord username or handle.');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMsg('Please enter a password for your account.');
      return;
    }

    setIsSigningInDiscord(true);
    setErrorMsg(null);

    try {
      const res = await loginOrCreateCommunityPlayerWithPassword(
        cleanDiscord,
        passwordInput.trim(),
        displayNameInput.trim() || cleanDiscord
      );

      if (res.success && res.profile) {
        localStorage.setItem('mjj_active_player_uid', res.profile.uid);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#EAB308', '#6366F1', '#10B981', '#FFFFFF'],
        });

        onSuccess(res.profile);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to log into account.');
      }
    } catch (err: any) {
      console.error('Player sign in error:', err);
      setErrorMsg(err?.message || 'Failed to access player profile. Please try again.');
    } finally {
      setIsSigningInDiscord(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans select-none text-neutral-100">
      <div className="bg-[#0f0f17] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white text-lg p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <LogIn className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h3 className="text-2xl font-serif font-black text-white">
            Join MJJ Community Portal
          </h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Sign in to react to newspapers, enter photo contests, earn points, and climb the public leaderboard.
          </p>
        </div>

        {/* Option 1: Real Google Sign-In */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleAuth}
            disabled={isSigningInGoogle}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSigningInGoogle ? (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-800" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign In with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-neutral-800" />
          <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-neutral-500">
            Or Direct Account Sign-In with Password
          </span>
          <div className="flex-grow border-t border-neutral-800" />
        </div>

        {/* Option 2: Password-Protected Direct Account Login */}
        <form onSubmit={handlePasswordAuth} className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-300 mb-1">
              Your Discord Username / Handle <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">
                @
              </span>
              <input
                type="text"
                value={discordInput}
                onChange={(e) => setDiscordInput(e.target.value)}
                placeholder="e.g. moonwalker_99"
                className="w-full pl-8 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 text-xs font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-300 mb-1">
              Account Password <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter or create account password"
                className="w-full pl-8 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 text-xs font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-300 mb-1">
              Display Name / Alias (Optional)
            </label>
            <input
              type="text"
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="e.g. Captain EO Fan"
              className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 text-xs"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSigningInDiscord || !discordInput.trim() || !passwordInput.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSigningInDiscord ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In / Create Account (+1,000 PTS)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[10px] text-neutral-500">
          Your account credentials and points persist across sessions in Firestore.
        </div>
      </div>
    </div>
  );
};
