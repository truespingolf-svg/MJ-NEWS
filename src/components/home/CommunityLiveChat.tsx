import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  VolumeX,
  Volume2,
  Trash2,
  AlertTriangle,
  Pin,
  Sparkles,
  Users,
  CheckCircle,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../firebase.ts';
import { UserProfile } from '../../services/firestoreStorage.ts';

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role?: string;
  message: string;
  timestamp: string;
  isModNote?: boolean;
}

export interface ChatConfig {
  isLocked: boolean;
  isMuted: boolean;
  modWarning?: string;
  updatedBy?: string;
}

interface CommunityLiveChatProps {
  currentUser: UserProfile | null;
  onRequireAuth: () => void;
}

export const CommunityLiveChat: React.FC<CommunityLiveChatProps> = ({
  currentUser,
  onRequireAuth,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatConfig, setChatConfig] = useState<ChatConfig>({
    isLocked: false,
    isMuted: false,
  });

  // Mod controls state
  const [showModTools, setShowModTools] = useState(false);
  const [warningInput, setWarningInput] = useState('');
  const [isUpdatingMod, setIsUpdatingMod] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if current user is an App Moderator, Newspaper Specialist, or Staff
  const userRole = (currentUser?.role || '').toUpperCase();
  const isAppMod =
    userRole.includes('MOD') ||
    userRole.includes('MODERATOR') ||
    userRole.includes('STAFF') ||
    userRole.includes('ADMIN') ||
    userRole.includes('OWNER');

  const isStaff =
    userRole.includes('STAFF') ||
    userRole.includes('ADMIN') ||
    userRole.includes('OWNER');

  // Real-time chat messages listener
  useEffect(() => {
    const q = query(
      collection(db, 'communityChat'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as ChatMessage);
        });
        setMessages(list);
      },
      (err) => {
        console.error('Chat messages listen error:', err);
      }
    );

    // Listen to chat moderation configuration
    const configUnsub = onSnapshot(
      doc(db, 'system', 'chatConfig'),
      (snap) => {
        if (snap.exists()) {
          const cfg = snap.data() as ChatConfig;
          setChatConfig(cfg);
          if (cfg.modWarning) {
            setWarningInput(cfg.modWarning);
          }
        }
      },
      (err) => {
        console.error('Chat config listen error:', err);
      }
    );

    return () => {
      unsub();
      configUnsub();
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (chatConfig.isLocked && !isAppMod) {
      return;
    }

    setIsSending(true);
    try {
      const displayName =
        currentUser.discordUser ||
        currentUser.discordUsername ||
        currentUser.displayName ||
        'Fan Member';

      await addDoc(collection(db, 'communityChat'), {
        userId: currentUser.uid,
        userName: displayName,
        userAvatar: currentUser.avatarUrl || currentUser.photoURL || '',
        role: currentUser.role || 'MEMBER',
        message: clean,
        timestamp: new Date().toISOString(),
      });

      setInputText('');
    } catch (err) {
      console.error('Failed to post message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!isAppMod) return;
    try {
      await deleteDoc(doc(db, 'communityChat', msgId));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleToggleLock = async () => {
    if (!isAppMod) return;
    setIsUpdatingMod(true);
    try {
      await setDoc(
        doc(db, 'system', 'chatConfig'),
        {
          isLocked: !chatConfig.isLocked,
          updatedBy: currentUser?.displayName || 'Moderator',
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Failed to toggle lock:', err);
    } finally {
      setIsUpdatingMod(false);
    }
  };

  const handleToggleMute = async () => {
    if (!isAppMod) return;
    setIsUpdatingMod(true);
    try {
      await setDoc(
        doc(db, 'system', 'chatConfig'),
        {
          isMuted: !chatConfig.isMuted,
          updatedBy: currentUser?.displayName || 'Moderator',
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    } finally {
      setIsUpdatingMod(false);
    }
  };

  const handlePostWarning = async () => {
    if (!isAppMod) return;
    setIsUpdatingMod(true);
    try {
      await setDoc(
        doc(db, 'system', 'chatConfig'),
        {
          modWarning: warningInput.trim(),
          updatedBy: currentUser?.displayName || 'Moderator',
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Failed to update mod warning:', err);
    } finally {
      setIsUpdatingMod(false);
    }
  };

  const handleClearWarning = async () => {
    if (!isAppMod) return;
    setIsUpdatingMod(true);
    try {
      await setDoc(
        doc(db, 'system', 'chatConfig'),
        {
          modWarning: '',
          updatedBy: currentUser?.displayName || 'Moderator',
        },
        { merge: true }
      );
      setWarningInput('');
    } catch (err) {
      console.error('Failed to clear mod warning:', err);
    } finally {
      setIsUpdatingMod(false);
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getRoleBadge = (role?: string) => {
    const r = (role || '').toUpperCase();
    if (r.includes('OWNER') || r.includes('DIRECTOR')) {
      return (
        <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
          👑 OWNER
        </span>
      );
    }
    if (r.includes('STAFF') || r.includes('ADMIN')) {
      return (
        <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-red-600/30 text-red-300 border border-red-500/50">
          ⭐ STAFF
        </span>
      );
    }
    if (r.includes('MOD') || r.includes('MODERATOR')) {
      return (
        <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
          🛡️ MOD
        </span>
      );
    }
    if (r.includes('NEWSPAPER')) {
      return (
        <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-sky-500/25 text-sky-300 border border-sky-500/40">
          📰 NEWSPAPER
        </span>
      );
    }
    return (
      <span className="text-[9px] font-mono text-neutral-400 uppercase">
        FAN
      </span>
    );
  };

  return (
    <div className="w-full bg-gradient-to-b from-[#120508] via-[#0d0305] to-[#15060a] border border-red-950/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans">
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 border-b border-red-950/80 bg-[#16060a]/90 backdrop-blur flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-950/80 border border-red-600/40 flex items-center justify-center text-red-400 shadow-inner">
            <MessageSquare className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-serif font-black text-sm tracking-wide text-white uppercase flex items-center gap-2">
              MJJ Worldwide Community Chat
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-600/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE SYNC
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400 font-mono">
              Real-time conversation across the globe for signed-in fans &amp; staff
            </p>
          </div>
        </div>

        {/* Right Mod Tools / Status Indicator */}
        <div className="flex items-center gap-2">
          {chatConfig.isLocked && (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-950/60 border border-amber-600/50 px-2 py-1 rounded-lg">
              <Lock className="w-3 h-3" />
              Locked by Mods
            </span>
          )}

          {isAppMod && (
            <button
              onClick={() => setShowModTools(!showModTools)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-[11px] tracking-wide transition-colors cursor-pointer shadow-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Mod Controls</span>
            </button>
          )}
        </div>
      </div>

      {/* Moderator Action Dashboard (Visible to App Mods) */}
      {isAppMod && showModTools && (
        <div className="p-4 bg-[#1e0a10] border-b border-red-900/60 space-y-3 animate-fade-in text-xs font-mono">
          <div className="flex items-center justify-between border-b border-red-950/80 pb-2">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>APP MODERATOR COMMAND CENTER</span>
            </div>
            <span className="text-[10px] text-neutral-400">
              Logged in as Moderator ({currentUser?.displayName || 'Mod'})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleLock}
              disabled={isUpdatingMod}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                chatConfig.isLocked
                  ? 'bg-amber-600 text-white'
                  : 'bg-neutral-900 border border-neutral-700 text-amber-300 hover:bg-amber-950'
              }`}
            >
              {chatConfig.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{chatConfig.isLocked ? 'Unlock Chatroom' : 'Lock Chatroom'}</span>
            </button>

            <button
              onClick={handleToggleMute}
              disabled={isUpdatingMod}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                chatConfig.isMuted
                  ? 'bg-red-600 text-white'
                  : 'bg-neutral-900 border border-neutral-700 text-red-300 hover:bg-red-950'
              }`}
            >
              {chatConfig.isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{chatConfig.isMuted ? 'Unmute Chat' : 'Mute / Slow Mode'}</span>
            </button>
          </div>

          {/* Official Mod Announcement / Warning Pinned Message */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-neutral-300 flex items-center gap-1">
              <Pin className="w-3 h-3 text-red-400" />
              <span>Pinned Moderator Warning / Official Broadcast Notice:</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={warningInput}
                onChange={(e) => setWarningInput(e.target.value)}
                placeholder="e.g. Respect everyone in chat, no spamming or self-promotion..."
                className="flex-1 bg-black/70 border border-red-950 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
              />
              <button
                onClick={handlePostWarning}
                disabled={isUpdatingMod}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
              >
                Pin Warning
              </button>
              {chatConfig.modWarning && (
                <button
                  onClick={handleClearWarning}
                  disabled={isUpdatingMod}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pinned Mod Warning Banner (Visible to all) */}
      {chatConfig.modWarning && (
        <div className="px-5 py-2.5 bg-gradient-to-r from-red-950 via-red-900/40 to-neutral-950 border-b border-red-800/80 flex items-center gap-2.5 text-xs text-red-200">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
          <div className="flex-1">
            <span className="font-bold font-mono text-[10px] uppercase text-red-400 mr-2 tracking-wider">
              [MODERATOR DIRECTIVE]:
            </span>
            <span>{chatConfig.modWarning}</span>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="h-80 sm:h-96 overflow-y-auto p-4 space-y-3 bg-[#0a0204]/90">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500 font-mono text-xs space-y-2">
            <Sparkles className="w-6 h-6 text-red-900 animate-pulse" />
            <p>The worldwide chat is ready. Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = currentUser && msg.userId === currentUser.uid;
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 group transition-all ${
                  isOwn ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* User Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-900 to-black border border-red-600/30 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md overflow-hidden">
                  {msg.userAvatar ? (
                    <img src={msg.userAvatar} alt={msg.userName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{msg.userName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                {/* Message Bubble Container */}
                <div
                  className={`max-w-[78%] rounded-2xl p-3 shadow-md relative ${
                    isOwn
                      ? 'bg-gradient-to-br from-red-700 via-rose-700 to-red-800 text-white rounded-tr-none'
                      : 'bg-[#18060a] border border-red-950/90 text-neutral-100 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold tracking-tight">
                        {msg.userName}
                      </span>
                      {getRoleBadge(msg.role)}
                    </div>
                    <span className="text-[9px] font-mono text-neutral-400 opacity-80">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed break-words whitespace-pre-wrap font-sans">
                    {msg.message}
                  </p>

                  {/* Mod Delete Button */}
                  {isAppMod && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-black/90 border border-red-600/50 text-red-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete inappropriate message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-3.5 border-t border-red-950/80 bg-[#120407]">
        {currentUser ? (
          chatConfig.isLocked && !isAppMod ? (
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/30 text-amber-300 text-xs font-mono text-center flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Chatroom is currently locked by staff &amp; moderators. Check back soon!</span>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Chat as @${currentUser.discordUser || currentUser.displayName}...`}
                maxLength={300}
                className="flex-1 bg-[#1a060a] border border-red-950/90 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/40 shadow-inner"
              />
              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950/80 transition-all cursor-pointer font-mono"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          )
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-xl bg-[#180509] border border-red-950 text-xs font-mono">
            <span className="text-neutral-400">
              Sign in with your community account to join the live worldwide chatroom.
            </span>
            <button
              onClick={onRequireAuth}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wider uppercase transition-colors shrink-0 cursor-pointer"
            >
              Sign In to Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
