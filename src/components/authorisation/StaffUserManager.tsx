import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  subscribeUsers,
  sendTicketToUser,
  sendCodeToUser,
  adjustUserPoints,
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const StaffUserManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Modal actions
  const [activeModal, setActiveModal] = useState<'ticket' | 'code' | 'points' | null>(null);

  // Ticket Form state
  const [ticketEvent, setTicketEvent] = useState('MJJ Records Commemorative Press Showcase');
  const [ticketSeat, setTicketSeat] = useState('VIP Golden Circle • Press Row');
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
    return () => unsub();
  }, [selectedUser?.uid]);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      (u.displayName || '').toLowerCase().includes(term) ||
      (u.discordUser || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    );
  });

  // Handle Send Ticket
  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      const ok = await sendTicketToUser(selectedUser.uid, {
        eventTitle: ticketEvent,
        seatTier: ticketSeat,
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
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setActiveModal('ticket');
                  }}
                  className="flex-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Ticket className="w-3 h-3" />
                  <span>Send Ticket</span>
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
                  className="py-1.5 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold"
                  title="Adjust Points"
                >
                  ± Pts
                </button>
              </div>
            </div>
          ))}
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
                  min={100}
                  step={500}
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

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleAdjustPoints(1000)}
                disabled={isSubmitting}
                className="py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold"
              >
                +1,000 Points
              </button>
              <button
                onClick={() => handleAdjustPoints(5000)}
                disabled={isSubmitting}
                className="py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold"
              >
                +5,000 Points
              </button>
              <button
                onClick={() => handleAdjustPoints(-500)}
                disabled={isSubmitting}
                className="py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold"
              >
                -500 Points
              </button>
              <button
                onClick={() => handleAdjustPoints(-1000)}
                disabled={isSubmitting}
                className="py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold"
              >
                -1,000 Points
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
