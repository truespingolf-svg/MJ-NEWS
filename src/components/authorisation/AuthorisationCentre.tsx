import React, { useState } from 'react';
import { AuthorisationPasscodeGate } from './AuthorisationPasscodeGate.tsx';
import { StaffCodeManager } from './StaffCodeManager.tsx';
import { StaffPublishingManager } from './StaffPublishingManager.tsx';
import { StaffMarketingApplications } from './StaffMarketingApplications.tsx';
import { StaffUserManager } from './StaffUserManager.tsx';
import { StaffChallengeManager } from './StaffChallengeManager.tsx';
import { StaffRosterManager } from './StaffRosterManager.tsx';
import { StaffNewsManager } from './StaffNewsManager.tsx';
import { StaffStreamingManager } from './StaffStreamingManager.tsx';
import { StaffCountdownManager } from './StaffCountdownManager.tsx';
import { StaffAuditLogsView } from './StaffAuditLogsView.tsx';
import {
  ShieldCheck,
  Lock,
  ChevronDown,
} from 'lucide-react';

interface AuthorisationCentreProps {
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  onOpenBrandingKit?: () => void;
  brandingOrganizationName?: string;
}

export type StaffTab =
  | 'challenges'
  | 'staff'
  | 'news'
  | 'streaming'
  | 'applications'
  | 'countdown'
  | 'users'
  | 'publishing'
  | 'codes'
  | 'audit';

export const AuthorisationCentre: React.FC<AuthorisationCentreProps> = ({
  isUnlocked,
  onUnlock,
  onLock,
}) => {
  const [activeTab, setActiveTab] = useState<StaffTab>('challenges');

  if (!isUnlocked) {
    return <AuthorisationPasscodeGate onUnlock={onUnlock} />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#07070a] text-neutral-100 overflow-hidden font-sans">
      {/* Staff Sub-Header Single Dropdown Selector */}
      <div className="bg-gradient-to-r from-[#0f090c] via-[#160c10] to-[#0f090c] border-b border-red-950/60 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-lg select-none min-h-13 h-auto shrink-0 z-30">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest hidden sm:inline">
              Authorisation Panel:
            </span>
          </div>

          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as StaffTab)}
              className="appearance-none bg-[#1a0e13] border border-red-500/50 text-amber-300 text-xs font-bold rounded-xl px-3.5 py-1.5 sm:py-2 pr-9 focus:outline-none focus:border-amber-400 cursor-pointer shadow-md hover:bg-[#25121b] transition-all min-h-[36px]"
            >
              <option value="challenges">🏆 Community Challenges &amp; Contests</option>
              <option value="staff">👥 Staff Team &amp; Roster Management</option>
              <option value="news">📰 Official News &amp; Editorial Management</option>
              <option value="streaming">🎵 Music, Video &amp; Premiere Studio</option>
              <option value="applications">💼 Marketing Recruitment &amp; Role Grants</option>
              <option value="countdown">⏱️ Upcoming Event Countdown &amp; Backdrop</option>
              <option value="users">👤 Community Players, Accounts &amp; Points</option>
              <option value="publishing">📻 Newspaper Broadcast &amp; Ticker</option>
              <option value="codes">🔑 Reward Codes, Points &amp; Redemptions</option>
              <option value="audit">🛡️ Staff Administration Audit Trail</option>
            </select>
            <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>EXECUTIVE VAULT UNLOCKED</span>
          </div>

          <button
            onClick={onLock}
            className="px-3 py-1.5 text-xs text-neutral-300 hover:text-amber-400 flex items-center gap-1.5 rounded-xl bg-[#14080c] border border-red-950/80 hover:border-amber-500/40 transition-all shrink-0 shadow-sm min-h-[36px] cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock Access</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Community Challenges & Contests */}
      {activeTab === 'challenges' && (
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <StaffChallengeManager />
        </div>
      )}

      {/* Tab 2: Dynamic Staff Team & Roster Management */}
      {activeTab === 'staff' && (
        <div className="flex-1 overflow-auto">
          <StaffRosterManager />
        </div>
      )}

      {/* Tab 3: Official News Management */}
      {activeTab === 'news' && (
        <div className="flex-1 overflow-auto">
          <StaffNewsManager />
        </div>
      )}

      {/* Tab 4: Streaming Content, Videos & Live Premieres */}
      {activeTab === 'streaming' && (
        <div className="flex-1 overflow-auto">
          <StaffStreamingManager />
        </div>
      )}

      {/* Tab 5: Marketing Recruitment & Roles */}
      {activeTab === 'applications' && (
        <div className="flex-1 overflow-auto">
          <StaffMarketingApplications />
        </div>
      )}

      {/* Tab 6: Event Countdown & Backdrop */}
      {activeTab === 'countdown' && (
        <div className="flex-1 overflow-auto">
          <StaffCountdownManager />
        </div>
      )}

      {/* Tab 7: Community Players, Accounts & Points */}
      {activeTab === 'users' && (
        <div className="flex-1 overflow-auto">
          <StaffUserManager />
        </div>
      )}

      {/* Tab 8: Newspaper Publishing & Broadcast Ticker */}
      {activeTab === 'publishing' && (
        <div className="flex-1 overflow-auto">
          <StaffPublishingManager />
        </div>
      )}

      {/* Tab 9: Secret Reward Codes */}
      {activeTab === 'codes' && (
        <div className="flex-1 overflow-auto">
          <StaffCodeManager />
        </div>
      )}

      {/* Tab 10: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="flex-1 overflow-auto">
          <StaffAuditLogsView />
        </div>
      )}
    </div>
  );
};
