import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  subscribeUsers,
  sendTicketToUser,
  sendCodeToUser,
  sendMessageToUser,
  adjustUserPoints,
  subscribeVotingConfig,
  setPointsPerVoteInFirestore,
  HomeLockConfig,
  subscribeHomeLockConfig,
  setHomeLockConfigInFirestore,
  clearHomeLockConfigInFirestore,
  deleteUserAccountInFirestore,
} from '../../services/firestoreStorage.ts';
import {
  Users,
  Search,
  Ticket,
  KeyRound,
  Award,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Send,
  X,
  RefreshCw,
  Trophy,
  ThumbsUp,
  Settings,
  Check,
  Lock,
  Clock,
  ShieldAlert,
  Play,
  Square,
  Unlock,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const StaffUserManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Voting Config state
  const [pointsPerVote, setPointsPerVote] = useState<number>(1000);
  const [tempPointsPerVote, setTempPointsPerVote] = useState<number>(1000);
  const [isEditingVotePoints, setIsEditingVotePoints] = useState<boolean>(false);

  // Home Screen Takeover Lock state
  const [currentHomeLock, setCurrentHomeLock] = useState<HomeLockConfig | null>(null);
  const [lockMsg, setLockMsg] = useState<string>('M.J. RECORD STUDIO LOCK — Maintenance & Synchronisation in Progress');
  const [lockDurationMin, setLockDurationMin] = useState<number>(15);
  const [lockRemainingSec, setLockRemainingSec] = useState<number>(0);

  // Modal actions
  const [activeModal, setActiveModal] = useState<'ticket' | 'message' | 'code' | 'points' | null>(null);

  // Direct Message Form state
  const [directMsgSubject, setDirectMsgSubject] = useState('Important Staff Notice');
  const [directMsgBody, setDirectMsgBody] = useState('');
  const [directMsgSender, setDirectMsgSender] = useState('MJJ Records Staff');

  // Ticket Form state
  const [ticketEvent, setTicketEvent] = useState('MJJ Records Commemorative Press Showcase');
  const [ticketSeat, setTicketSeat] = useState('VIP Golden Circle • Press Row');
  const [ticketNumInput, setTicketNumInput] = useState('');
  const [ticketAccessLevel, setTicketAccessLevel] = useState('All Access & VIP Lounge');
  const [ticketDressCode, setTicketDressCode] = useState('Black Tie / Smart Casual');
  const [ticketNote, setTicketNote] = useState('Granted by the MJJ Records Authorisation Centre.');

  // Code Form state
  const [grantCode, setGrantCode] = useState('');
  const [grantPoints, setGrantPoints] = useState(2500);
  const [grantMsg, setGrantMsg] = useState('Special Executive Recognition Reward from Staff');

  // Points adjustment state
  const [pointDelta, setPointDelta] = useState(1000);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeUsers((userList) => {
      setUsers(userList);
      if (selectedUser) {
        const updated = userList.find((u) => u.uid === selectedUser.uid);
        if (updated) setSelectedUser(updated);
      }
    });

    const unsubConfig = subscribeVotingConfig((config) => {
      setPointsPerVote(config.pointsPerVote);
      setTempPointsPerVote(config.pointsPerVote);
    });

    const unsubHomeLock = subscribeHomeLockConfig((cfg) => {
      setCurrentHomeLock(cfg);
      if (cfg && cfg.message) {
        setLockMsg(cfg.message);
      }
    });

    return () => {
      unsub();
      unsubConfig();
      unsubHomeLock();
    };
  }, [selectedUser?.uid]);

  // Countdown timer calculation for staff preview
  useEffect(() => {
    if (!currentHomeLock || !currentHomeLock.isLocked || !currentHomeLock.endTime) {
      setLockRemainingSec(0);
      return;
    }
    const updateSec = () => {
      const diff = Math.max(0, Math.floor((currentHomeLock.endTime - Date.now()) / 1000));
      setLockRemainingSec(diff);
    };
    updateSec();
    const interval = setInterval(updateSec, 1000);
    return () => clearInterval(interval);
  }, [currentHomeLock]);

  const handlePushHomeLock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const mins = Math.max(1, Number(lockDurationMin) || 5);
    const endTime = Date.now() + mins * 60 * 1000;
    try {
      const ok = await setHomeLockConfigInFirestore({
        isLocked: true,
        message: lockMsg.trim() || 'Home Screen is locked by the Authorisation Centre.',
        durationMinutes: mins,
        endTime,
        createdAt: new Date().toISOString(),
        createdBy: 'Authorisation Centre',
      });
      if (ok) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setStatusMsg({
          type: 'success',
          text: `🔒 Full Screen Takeover Lock pushed live to Home Screen for ${mins} minutes!`,
        });
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to push takeover lock to Firestore.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Error pushing takeover lock.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearHomeLock = async () => {
    setIsSubmitting(true);
    try {
      const ok = await clearHomeLockConfigInFirestore();
      if (ok) {
        setStatusMsg({
          type: 'success',
          text: '🔓 Home Screen Takeover Lock cleared! Normal operations & portal access restored.',
        });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to clear takeover lock.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveVotingConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const ok = await setPointsPerVoteInFirestore(tempPointsPerVote);
      if (ok) {
        setIsEditingVotePoints(false);
        setStatusMsg({
          type: 'success',
          text: `Updated Voting System: Each vote now awards +${tempPointsPerVote.toLocaleString()} PTS to the target player!`,
        });
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to update voting points configuration.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      (u.displayName || '').toLowerCase().includes(term) ||
      (u.discordUser || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    );
  });

  // Handle Send Direct Message
  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !directMsgBody.trim()) return;
    setIsSubmitting(true);

    try {
      const ok = await sendMessageToUser(selectedUser.uid, {
        subject: directMsgSubject.trim() || 'Direct Staff Notice',
        message: directMsgBody.trim(),
        senderName: directMsgSender.trim() || 'MJJ Records Staff',
      });

      if (ok) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        setStatusMsg({
          type: 'success',
          text: `Direct message successfully dispatched to @${selectedUser.discordUser || selectedUser.displayName}! It will appear as an instant alert on their home screen.`,
        });
        setDirectMsgSubject('Important Staff Notice');
        setDirectMsgBody('');
        setActiveModal(null);
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to send message.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Error sending direct message.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Send Ticket
  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      const ok = await sendTicketToUser(selectedUser.uid, {
        eventTitle: ticketEvent,
        seatTier: ticketSeat,
        ticketNumber: ticketNumInput.trim() || undefined,
        accessLevel: ticketAccessLevel.trim() || undefined,
        dressCode: ticketDressCode.trim() || undefined,
        staffNote: ticketNote,
      });

      if (ok) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        setStatusMsg({
          type: 'success',
          text: `VIP Ticket successfully issued to @${selectedUser.discordUser || selectedUser.displayName}!`,
        });
        setActiveModal(null);
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to issue ticket.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error issuing ticket.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Send Direct Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);

    const codeToUse = grantCode.trim().toUpperCase() || `VIP-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const ok = await sendCodeToUser(selectedUser.uid, {
        code: codeToUse,
        points: Number(grantPoints) || 1000,
        customMessage: grantMsg,
      });

      if (ok) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        setStatusMsg({
          type: 'success',
          text: `Reward code "${codeToUse}" (+${grantPoints} pts) sent to @${selectedUser.discordUser || selectedUser.displayName}!`,
        });
        setGrantCode('');
        setActiveModal(null);
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to grant code.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error granting code.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Adjust Points
  const handleAdjustPoints = async (delta: number) => {
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      const ok = await adjustUserPoints(selectedUser.uid, delta);
      if (ok) {
        setStatusMsg({
          type: 'success',
          text: `Updated @${selectedUser.discordUser || selectedUser.displayName}'s points by ${delta > 0 ? '+' : ''}${delta}!`,
        });
        setActiveModal(null);
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to adjust points.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (targetUid: string, name: string) => {
    setIsSubmitting(true);
    try {
      const ok = await deleteUserAccountInFirestore(targetUid);
      if (ok) {
        setStatusMsg({
          type: 'success',
          text: `Account "${name}" was successfully wiped from the database.`,
        });
        if (selectedUser?.uid === targetUid) {
          setSelectedUser(null);
          setActiveModal(null);
        }
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to delete account from database.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Error deleting account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-neutral-100 p-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-neutral-900 to-amber-950/60 border border-amber-500/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>COMMUNITY GOVERNANCE &amp; REWARDS REGISTRY</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
            Registered Players &amp; Accounts ({users.length})
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl mt-1 leading-relaxed">
            Select signed-up users to send concert passes, grant exclusive reward codes, or manage community points.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-xl text-amber-300">
            Total Points Circulating: {users.reduce((acc, u) => acc + (u.points || 0), 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Voting System Points Configuration Card */}
      <div className="bg-[#13131c] border border-amber-500/40 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <ThumbsUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">Community Voting &amp; Points System</h3>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                REAL-TIME FIRESTORE CONFIG
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Each vote cast by community members awards{' '}
              <strong className="text-amber-300 font-mono">+{pointsPerVote.toLocaleString()} PTS</strong> to the receiving player.
            </p>
          </div>
        </div>

        <div>
          {isEditingVotePoints ? (
            <form onSubmit={handleSaveVotingConfig} className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-mono">
                  +
                </span>
                <input
                  type="number"
                  value={tempPointsPerVote}
                  onChange={(e) => setTempPointsPerVote(Number(e.target.value))}
                  min={1}
                  step="any"
                  className="w-32 bg-neutral-950 border border-amber-400 rounded-xl pl-7 pr-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                  autoFocus
                />
              </div>
              <span className="text-xs text-neutral-400 font-mono">PTS/vote</span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-amber-400 text-black font-bold text-xs rounded-xl hover:bg-amber-300 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingVotePoints(false)}
                className="px-2.5 py-1.5 bg-neutral-800 text-neutral-300 text-xs rounded-xl hover:bg-neutral-700"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setTempPointsPerVote(pointsPerVote);
                setIsEditingVotePoints(true);
              }}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Change Points Per Vote (Current: +{pointsPerVote.toLocaleString()} PTS)</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Home Screen Timer Lock (Takeover Mode) Card */}
      <div className="bg-[#12121c] border border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#252535]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Global Home Screen Takeover Lock Screen</h3>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  REAL-TIME SYNCED
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Push a full-screen countdown lock overlay across the home screen with a custom message and timer.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            {currentHomeLock?.isLocked && lockRemainingSec > 0 ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5 animate-pulse">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>
                    ACTIVE LOCK: {Math.floor(lockRemainingSec / 60)}m {lockRemainingSec % 60}s
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleClearHomeLock}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>CLEAR TAKEOVER LOCK</span>
                </button>
              </div>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>UNLOCKED (Normal Operations)</span>
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handlePushHomeLock} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-2 space-y-1.5">
            <label className="block font-semibold text-neutral-300">
              Lock Screen Broadcast Message (Shown to Visitors)
            </label>
            <input
              type="text"
              value={lockMsg}
              onChange={(e) => setLockMsg(e.target.value)}
              placeholder="e.g. Home screen is locked for maintenance & special broadcast preparation."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-neutral-300">
              Timer Duration (Minutes)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={lockDurationMin}
                onChange={(e) => setLockDurationMin(Number(e.target.value))}
                min={1}
                max={1440}
                className="w-24 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono text-center focus:outline-none focus:border-amber-400"
                required
              />
              <div className="flex items-center gap-1">
                {[5, 15, 30, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setLockDurationMin(m)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono border ${
                      lockDurationMin === m
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-3 pt-1 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>PUSH FULL SCREEN TAKEOVER LOCK TO HOME PORTAL</span>
            </button>
          </div>
        </form>
      </div>

      {statusMsg.text && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg({ type: null, text: '' })}>✕</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-[#121218] border border-[#2b2b38] rounded-xl p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-neutral-500 ml-2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Discord handle (@name), Google display name, or email..."
          className="bg-transparent border-none text-xs text-white placeholder:text-neutral-500 focus:outline-none flex-1"
        />
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="bg-[#121218] border border-dashed border-[#2b2b38] rounded-2xl p-12 text-center text-xs text-neutral-500 font-mono">
          No signed-up players found matching your search. When users sign in with Google on the portal, their accounts appear here in real time.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user, idx) => (
            <div
              key={user.uid}
              className={`bg-[#121218] border rounded-2xl p-5 space-y-4 shadow-xl transition-all ${
                selectedUser?.uid === user.uid
                  ? 'border-amber-400 shadow-amber-500/10'
                  : 'border-[#2b2b38] hover:border-amber-500/40'
              }`}
            >
              {/* User Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-10 h-10 rounded-full border border-amber-400/40 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 font-bold text-sm">
                      {(user.displayName || 'U')[0].toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{user.displayName || 'Anonymous Member'}</span>
                    </h4>
                    <div className="text-xs font-mono text-amber-400">
                      {user.discordUser ? `@${user.discordUser}` : '(No Discord handle yet)'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-amber-300">
                    {(user.points || 0).toLocaleString()} PTS
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    {user.votes || 0} Votes
                  </div>
                </div>
              </div>

              {/* Badges / Inventory Count */}
              <div className="pt-2 border-t border-[#222232] flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                <span className="flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 text-amber-400" />
                  <span>{user.tickets?.length || 0} Passes</span>
                </span>
                <span className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{user.assignedCodes?.length || 0} Direct Codes</span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setActiveModal('message');
                  }}
                  className="flex-1 py-1.5 px-2 bg-[#1b0c10] hover:bg-[#281218] text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Send className="w-3 h-3 text-red-400" />
                  <span>Send Notice</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setActiveModal('ticket');
                  }}
                  className="flex-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Ticket className="w-3 h-3" />
                  <span>VIP Pass</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setActiveModal('code');
                  }}
                  className="flex-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Send Code</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setActiveModal('points');
                  }}
                  className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold"
                  title="Adjust Points"
                >
                  ± Pts
                </button>

                <button
                  onClick={() => handleDeleteAccount(user.uid, user.discordUser || user.displayName || user.email || 'User')}
                  className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg transition-colors cursor-pointer"
                  title="Delete Account & Wipe from Database"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Send Direct Notice Message */}
      {activeModal === 'message' && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#14080b] border border-red-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Send Direct Staff Message</h3>
                <p className="text-xs text-neutral-400">
                  Recipient: @{selectedUser.discordUser || selectedUser.displayName}
                </p>
              </div>
            </div>

            <form onSubmit={handleSendDirectMessage} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Notice Subject / Header
                </label>
                <input
                  type="text"
                  value={directMsgSubject}
                  onChange={(e) => setDirectMsgSubject(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Message Content (Will pop as notification on home screen)
                </label>
                <textarea
                  rows={4}
                  value={directMsgBody}
                  onChange={(e) => setDirectMsgBody(e.target.value)}
                  placeholder="Type your official direct message or alert here..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-400 leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Sender Signature
                </label>
                <input
                  type="text"
                  value={directMsgSender}
                  onChange={(e) => setDirectMsgSender(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !directMsgBody.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-lg shadow-red-950/80"
              >
                <Send className="w-4 h-4" />
                <span>DISPATCH MESSAGE TO USER INBOX</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Send Ticket / Pass */}
      {activeModal === 'ticket' && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Issue Concert Ticket / VIP Pass</h3>
                <p className="text-xs text-neutral-400">
                  Recipient: @{selectedUser.discordUser || selectedUser.displayName}
                </p>
              </div>
            </div>

            <form onSubmit={handleSendTicket} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Event / Tour Title
                </label>
                <input
                  type="text"
                  value={ticketEvent}
                  onChange={(e) => setTicketEvent(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Seat / VIP Access Tier
                  </label>
                  <input
                    type="text"
                    value={ticketSeat}
                    onChange={(e) => setTicketSeat(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Ticket Pass Serial / Number
                  </label>
                  <input
                    type="text"
                    value={ticketNumInput}
                    onChange={(e) => setTicketNumInput(e.target.value)}
                    placeholder="e.g. NXP-VIP-9901 (Auto if blank)"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Access Level
                  </label>
                  <input
                    type="text"
                    value={ticketAccessLevel}
                    onChange={(e) => setTicketAccessLevel(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Dress Code
                  </label>
                  <input
                    type="text"
                    value={ticketDressCode}
                    onChange={(e) => setTicketDressCode(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Staff Notes / Compliments
                </label>
                <textarea
                  rows={2}
                  value={ticketNote}
                  onChange={(e) => setTicketNote(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-bold text-xs uppercase flex items-center justify-center gap-2 mt-2"
              >
                <Send className="w-4 h-4" />
                <span>ISSUE TICKET TO PLAYER ACCOUNT</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Send Direct Reward Code */}
      {activeModal === 'code' && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Grant Direct Reward Code</h3>
                <p className="text-xs text-neutral-400">
                  Recipient: @{selectedUser.discordUser || selectedUser.displayName}
                </p>
              </div>
            </div>

            <form onSubmit={handleSendCode} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Reward Code String
                </label>
                <input
                  type="text"
                  value={grantCode}
                  onChange={(e) => setGrantCode(e.target.value)}
                  placeholder="e.g. VIP-EXCLUSIVE-882 (Leave blank for random)"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Points Value
                </label>
                <input
                  type="number"
                  value={grantPoints}
                  onChange={(e) => setGrantPoints(Number(e.target.value))}
                  min={1}
                  step="any"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Custom Recognition Message
                </label>
                <textarea
                  rows={2}
                  value={grantMsg}
                  onChange={(e) => setGrantMsg(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-black font-bold text-xs uppercase flex items-center justify-center gap-2 mt-2"
              >
                <Send className="w-4 h-4" />
                <span>GRANT REWARD CODE TO USER</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Points Adjustment */}
      {activeModal === 'points' && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-amber-500/40 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-center">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-white text-base">Adjust Player Points</h3>
              <p className="text-xs text-neutral-400">
                @{selectedUser.discordUser || selectedUser.displayName} (Current: {selectedUser.points} pts)
              </p>
            </div>

            {/* Custom Typed Points Input */}
            <div className="space-y-2 pt-1 text-left">
              <label className="block text-[11px] font-mono text-neutral-300">
                Custom Points Adjustment (Type positive to add, negative to remove):
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={pointDelta}
                  onChange={(e) => setPointDelta(Number(e.target.value))}
                  placeholder="e.g. 2500 or -1500"
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => handleAdjustPoints(pointDelta)}
                  disabled={isSubmitting || !pointDelta}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  Apply Delta
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800">
              <span className="block text-[10px] font-mono text-neutral-500 mb-2">Quick Presets:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAdjustPoints(1000)}
                  disabled={isSubmitting}
                  className="py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold"
                >
                  +1,000 PTS
                </button>
                <button
                  onClick={() => handleAdjustPoints(5000)}
                  disabled={isSubmitting}
                  className="py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold"
                >
                  +5,000 PTS
                </button>
                <button
                  onClick={() => handleAdjustPoints(-500)}
                  disabled={isSubmitting}
                  className="py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold"
                >
                  -500 PTS
                </button>
                <button
                  onClick={() => handleAdjustPoints(-1000)}
                  disabled={isSubmitting}
                  className="py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold"
                >
                  -1,000 PTS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
