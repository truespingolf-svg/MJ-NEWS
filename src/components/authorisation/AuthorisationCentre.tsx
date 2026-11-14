import React, { useState, useEffect } from 'react';
import { AuthorisationPasscodeGate } from './AuthorisationPasscodeGate.tsx';
import { StaffCodeManager } from './StaffCodeManager.tsx';
import { StaffPublishingManager } from './StaffPublishingManager.tsx';
import { StaffUserManager } from './StaffUserManager.tsx';
import { StaffChallengeManager } from './StaffChallengeManager.tsx';
import { StaffRosterManager } from './StaffRosterManager.tsx';
import { StaffNewsManager } from './StaffNewsManager.tsx';
import { StaffStreamingManager } from './StaffStreamingManager.tsx';
import { StaffCountdownManager } from './StaffCountdownManager.tsx';
import { StaffAuditLogsView } from './StaffAuditLogsView.tsx';
import { StaffPasscodesManager } from './StaffPasscodesManager.tsx';
import { subscribeSubmissions } from '../../services/firestoreStorage.ts';
import {
  ShieldCheck,
  Lock,
  Radio,
  Trophy,
  Users,
  Newspaper,
  Music,
  Clock,
  KeyRound,
  Shield,
  FileText,
  UserCheck,
} from 'lucide-react';

interface AuthorisationCentreProps {
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  onOpenBrandingKit?: () => void;
  brandingOrganizationName?: string;
}

export type StaffTab =
  | 'publishing'
  | 'challenges'
  | 'users'
  | 'news'
  | 'streaming'
  | 'countdown'
  | 'staff'
  | 'codes'
  | 'passcodes'
  | 'audit';

interface SidebarGroup {
  title: string;
  items: {
    id: StaffTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[];
}

export const AuthorisationCentre: React.FC<AuthorisationCentreProps> = ({
  isUnlocked,
  onUnlock,
  onLock,
}) => {
  const [activeTab, setActiveTab] = useState<StaffTab>('publishing');
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState<number>(0);

  useEffect(() => {
    if (!isUnlocked) return;
    const unsub = subscribeSubmissions((subs) => {
      setPendingSubmissionsCount(Array.isArray(subs) ? subs.length : 0);
    });
    return () => unsub();
  }, [isUnlocked]);

  if (!isUnlocked) {
    return <AuthorisationPasscodeGate onUnlock={onUnlock} />;
  }

  const sidebarGroups: SidebarGroup[] = [
    {
      title: 'Moderation & Press',
      items: [
        {
          id: 'publishing',
          label: 'Newspaper Moderation',
          icon: Radio,
          badge: pendingSubmissionsCount,
        },
        { id: 'news', label: 'News Desk', icon: Newspaper },
        { id: 'streaming', label: 'Streaming Vault', icon: Music },
      ],
    },
    {
      title: 'Community & Events',
      items: [
        { id: 'challenges', label: 'Challenges', icon: Trophy },
        { id: 'users', label: 'Players & Roles', icon: Users },
        { id: 'countdown', label: 'Event Countdown', icon: Clock },
      ],
    },
    {
      title: 'Studio & Security',
      items: [
        { id: 'staff', label: 'Staff Roster', icon: UserCheck },
        { id: 'codes', label: 'Reward Codes', icon: KeyRound },
        { id: 'passcodes', label: 'Passcode Security', icon: Shield },
        { id: 'audit', label: 'Audit Trail', icon: FileText },
      ],
    },
  ];

  const allItems = sidebarGroups.flatMap((g) => g.items);
  const currentTabItem = allItems.find((i) => i.id === activeTab) || allItems[0];

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full bg-[#07070a] text-neutral-100 overflow-hidden font-sans">
      {/* Desktop Grouped Left Rail */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#0b0a0e] border-r border-neutral-800/90 h-full overflow-y-auto">
        <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
              Admin Vault
            </span>
          </div>
          <button
            onClick={onLock}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 border border-neutral-800 transition-colors cursor-pointer"
            title="Lock Admin Access"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>

        <nav className="p-3 space-y-5 flex-1">
          {sidebarGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-2.5 text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-red-600/20 text-white border border-red-500/40 font-semibold'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900/70 border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-red-400' : 'text-neutral-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[10px] font-mono font-bold tabular-nums">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-neutral-800/80">
          <button
            onClick={onLock}
            className="w-full py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-800 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock Vault</span>
          </button>
        </div>
      </aside>

      {/* Mobile / Tablet Compact Horizontal Bar */}
      <div className="lg:hidden bg-[#0b0a0e] border-b border-neutral-800 px-3 py-2.5 space-y-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300">
            <ShieldCheck className="w-4 h-4" />
            <span>{currentTabItem.label}</span>
          </div>
          <button
            onClick={onLock}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Lock</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {allItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="px-1 rounded bg-amber-400 text-black text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#07070a]">
        <div key={activeTab} className="flex-1 overflow-auto animate-panel-reveal">
          {activeTab === 'publishing' && <StaffPublishingManager />}
          {activeTab === 'challenges' && (
            <div className="p-4 sm:p-8">
              <StaffChallengeManager />
            </div>
          )}
          {activeTab === 'users' && <StaffUserManager />}
          {activeTab === 'news' && <StaffNewsManager />}
          {activeTab === 'streaming' && <StaffStreamingManager />}
          {activeTab === 'countdown' && <StaffCountdownManager />}
          {activeTab === 'staff' && <StaffRosterManager />}
          {activeTab === 'codes' && <StaffCodeManager />}
          {activeTab === 'passcodes' && <StaffPasscodesManager />}
          {activeTab === 'audit' && <StaffAuditLogsView />}
        </div>
      </div>
    </div>
  );
};
