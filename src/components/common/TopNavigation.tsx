import React from 'react';
import {
  Newspaper,
  Ticket,
  ShieldCheck,
  FolderOpen,
  Palette,
  Lock,
  Unlock,
  Disc,
  Sparkles,
  ChevronDown,
  Home,
} from 'lucide-react';

export type MainAppView = 'newspaper' | 'tickets' | 'authorisation' | 'library';

interface TopNavigationProps {
  activeView: MainAppView;
  onSelectView: (view: MainAppView) => void;
  isAuthorisationUnlocked: boolean;
  onOpenBrandingKit: () => void;
  onOpenAiModal?: () => void;
  saveStatus?: 'saved' | 'saving' | 'unsaved';
  onReturnToPublicPortal: () => void;
  textureEnabled: boolean;
  onToggleTexture: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeView,
  onSelectView,
  isAuthorisationUnlocked,
  onOpenBrandingKit,
  onOpenAiModal,
  saveStatus,
  onReturnToPublicPortal,
  textureEnabled,
  onToggleTexture,
}) => {
  return (
    <header className="min-h-14 h-auto py-2 bg-[#0a0a0c] border-b border-[#222226] px-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-[#ececee] select-none shrink-0 z-40">
      {/* Zone 1: Wordmark & Back to Home Button */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onReturnToPublicPortal}
          className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-500/40 shadow-sm transition-all active:scale-95 cursor-pointer min-h-[38px]"
          title="Return to MJJ Records Home Screen & Public Portal"
        >
          <Home className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="tracking-wide text-[11px] sm:text-xs">← HOME SCREEN</span>
        </button>

        <div className="h-4 w-[1px] bg-neutral-800 hidden md:block" />

        <div className="hidden md:flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400">
            <Newspaper className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-serif font-black text-xs tracking-wide text-white uppercase block leading-none">
              STAFF CREATOR STUDIO
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Single Dropdown Selector for Staff Studio Modules + AI Copilot */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-xs font-semibold text-neutral-400 hidden lg:inline">
          Studio View:
        </span>
        <div className="relative">
          <select
            value={activeView}
            onChange={(e) => onSelectView(e.target.value as MainAppView)}
            className="appearance-none bg-[#16161f] border border-amber-500/40 text-amber-400 text-xs font-bold rounded-xl px-3 py-1.5 pr-8 focus:outline-none focus:border-amber-400 cursor-pointer shadow-md hover:bg-[#1e1e2b] transition-all min-h-[38px]"
          >
            <option value="newspaper">📰 Newspaper Broadsheet Studio</option>
            <option value="tickets">🎟️ Ticket &amp; Invitation Studio</option>
            <option value="authorisation">🛡️ Authorisation &amp; Governance Centre</option>
            <option value="library">📁 Central Document Library</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* AI Broadsheet Assistant Trigger */}
        {onOpenAiModal && (
          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black shadow-lg shadow-amber-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer min-h-[38px]"
            title="Ask AI to research facts with Google Search and generate a custom broadsheet project"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span className="tracking-wide">AI Broadsheet Copilot</span>
          </button>
        )}
      </div>

      {/* Zone 3: Global Texture Toggle + Branding Kit */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleTexture}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 min-h-[38px] ${
            textureEnabled
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-[#16161a] text-neutral-400 border-[#2d2d34] hover:text-neutral-200'
          }`}
          title="Toggle newsprint paper texture overlay"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xl:inline">Newsprint Texture:</span> {textureEnabled ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={onOpenBrandingKit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white bg-[#16161a] hover:bg-[#202026] border border-[#2d2d34] rounded-lg transition-colors whitespace-nowrap min-h-[38px]"
          title="Configure Organization Branding"
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Branding Kit</span>
        </button>
      </div>
    </header>
  );
};
