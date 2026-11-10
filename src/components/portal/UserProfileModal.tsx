import React, { useState, useEffect } from 'react';
import { UserProfile, updateUserDiscord, subscribeVotingConfig } from '../../services/firestoreStorage.ts';
import {
  User,
  Ticket,
  KeyRound,
  Award,
  ThumbsUp,
  X,
  LogOut,
  Edit2,
  Check,
  Sparkles,
  QrCode,
  Calendar,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onLogout,
}) => {
  const [isEditingDiscord, setIsEditingDiscord] = useState(false);
  const [discordInput, setDiscordInput] = useState(profile?.discordUser || '');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [pointsPerVote, setPointsPerVote] = useState<number>(1000);

  useEffect(() => {
    const unsub = subscribeVotingConfig((config) => {
      setPointsPerVote(config.pointsPerVote);
    });
    return () => unsub();
  }, []);

  if (!isOpen || !profile) return null;

  const handleSaveDiscord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const clean = discordInput.replace(/^@/, '').trim();
    if (!clean) return;

    try {
      await updateUserDiscord(profile.uid, clean);
      setIsEditingDiscord(false);
      setStatusMsg('Discord username updated successfully!');
      setTimeout(() => setStatusMsg(''), 3000);
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    } catch (e) {
      console.error('Failed to update discord:', e);
    }
  };

  const handleCopyCode = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedCode(codeStr);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none animate-fade-in">
      <div className="bg-[#0f0f17] border border-amber-500/40 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="p-6 border-b border-[#222232] bg-gradient-to-r from-neutral-950 via-[#151522] to-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName || 'User'}
                className="w-12 h-12 rounded-full border-2 border-amber-400 shadow-md object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-neutral-800 border-2 border-amber-400 flex items-center justify-center text-amber-400 font-bold text-lg">
                {(profile.displayName || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-bold text-base text-white">{profile.displayName}</h3>
              <p className="text-xs text-neutral-400 font-mono">{profile.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Discord Handle Section */}
          <div className="p-4 bg-[#151522] border border-[#2b2b3e] rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                COMMUNITY DISPLAY HANDLE
              </span>
              {!isEditingDiscord && (
                <button
                  onClick={() => {
                    setDiscordInput(profile.discordUser || '');
                    setIsEditingDiscord(true);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{profile.discordUser ? 'Change Handle' : 'Set Discord Handle'}</span>
                </button>
              )}
            </div>

            {isEditingDiscord ? (
              <form onSubmit={handleSaveDiscord} className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neutral-500 text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    value={discordInput}
                    onChange={(e) => setDiscordInput(e.target.value)}
                    placeholder="moonwalker_99"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-7 pr-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-400 text-black font-bold text-xs rounded-xl hover:bg-amber-300 flex items-center gap-1 shrink-0"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingDiscord(false)}
                  className="px-2.5 py-1.5 bg-neutral-800 text-neutral-300 text-xs rounded-xl hover:bg-neutral-700"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="font-mono text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <span>{profile.discordUser ? `@${profile.discordUser}` : 'No Discord username set yet'}</span>
              </div>
            )}

            {statusMsg && (
              <p className="text-[11px] text-emerald-400 font-medium">{statusMsg}</p>
            )}
          </div>

          {/* Points & Votes Summary Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#151522] border border-[#2b2b3e] rounded-2xl">
              <div className="text-[10px] font-mono uppercase text-neutral-400 mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Points Balance</span>
              </div>
              <div className="font-mono text-2xl font-black text-amber-300">
                {(profile.points || 0).toLocaleString()} <span className="text-xs font-normal text-neutral-500">PTS</span>
              </div>
            </div>

            <div className="p-4 bg-[#151522] border border-[#2b2b3e] rounded-2xl">
              <div className="text-[10px] font-mono uppercase text-neutral-400 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Community Votes</span>
                </span>
                <span className="text-[9px] text-amber-400 font-mono">+{pointsPerVote.toLocaleString()} PTS/vote</span>
              </div>
              <div className="font-mono text-2xl font-black text-emerald-300">
                {profile.votes || 0} <span className="text-xs font-normal text-neutral-500">VOTES</span>
              </div>
            </div>
          </div>

          {/* My Tickets & VIP Passes Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-400" />
                <span>My Issued VIP Passes ({profile.tickets?.length || 0})</span>
              </h4>
              <span className="text-[10px] font-mono text-neutral-500">STAFF AUTHORISATION GRANTS</span>
            </div>

            {(!profile.tickets || profile.tickets.length === 0) ? (
              <div className="p-4 bg-neutral-950/70 border border-dashed border-neutral-800 rounded-2xl text-center text-xs text-neutral-500 font-mono">
                No VIP concert passes issued yet. Staff can issue official passes from the Authorisation Centre!
              </div>
            ) : (
              <div className="space-y-3">
                {profile.tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-gradient-to-r from-[#171722] to-[#12121a] border border-amber-500/40 rounded-2xl space-y-2 relative overflow-hidden shadow-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          {t.ticketNumber}
                        </span>
                        <h5 className="font-serif font-black text-sm text-white mt-1">
                          {t.eventTitle}
                        </h5>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        {t.seatTier}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-300 italic">
                      "{t.staffNote}"
                    </p>

                    <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-500 font-mono flex justify-between">
                      <span>Issued: {new Date(t.issuedAt).toLocaleDateString()}</span>
                      <span className="text-amber-400 font-bold">VERIFIED VIP PASS</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Granted Reward Codes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>My Granted Reward Codes ({profile.assignedCodes?.length || 0})</span>
              </h4>
            </div>

            {(!profile.assignedCodes || profile.assignedCodes.length === 0) ? (
              <div className="p-4 bg-neutral-950/70 border border-dashed border-neutral-800 rounded-2xl text-center text-xs text-neutral-500 font-mono">
                No direct reward codes granted yet. Staff can issue exclusive bonus codes to your account.
              </div>
            ) : (
              <div className="space-y-2">
                {profile.assignedCodes.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-[#171722] border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-300">{c.code}</span>
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          +{c.points} PTS
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{c.customMessage}</p>
                    </div>

                    <button
                      onClick={() => handleCopyCode(c.code)}
                      className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                      title="Copy Code"
                    >
                      {copiedCode === c.code ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-[#222232] bg-[#111118] flex items-center justify-between">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 rounded-xl hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
