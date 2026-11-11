import React from 'react';
import {
  Newspaper,
  ChevronDown,
  Home,
  Palette,
  Sparkles,
  Flame,
} from 'lucide-react';

export type MainAppView = 'newspaper' | 'authorisation';

interface TopNavigationProps {
  activeView: MainAppView;
  onSelectView: (view: MainAppView) => void;
  isAuthorisationUnlocked: boolean;
  onOpenBrandingKit: () => void;
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
  saveStatus,
  onReturnToPublicPortal,
  textureEnabled,
  onToggleTexture,
}) => {
  return (
    <header className="min-h-14 h-auto py-2 bg-gradient-to-r from-[#0d0204] via-[#1a060b] to-[#0d0204] border-b border-red-950/80 px-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-neutral-100 select-none shrink-0 z-40 shadow-2xl">
      {/* Zone 1: Wordmark & Back to Home Button */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onReturnToPublicPortal}
          className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-red-950 via-[#2e0810] to-red-950 hover:from-red-900 hover:to-[#3e0a16] text-red-200 border border-red-500/50 shadow-[0_0_12px_rgba(220,38,38,0.25)] transition-all active:scale-95 cursor-pointer min-h-[38px]"
          title="Return to MJJ Records Home Screen & Public Portal"
        >
          <Home className="w-4 h-4 text-red-400 shrink-0" />
          <span className="tracking-wide text-[11px] sm:text-xs uppercase font-mono font-bold">← EXIT TO PUBLIC SITE</span>
        </button>

        <div className="h-4 w-[1px] bg-red-950/80 hidden md:block" />

        <div className="hidden md:flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 shadow-md">
            <Flame className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-serif font-black text-xs tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-neutral-100 to-red-500 uppercase block leading-none">
              MJJ STAFF CREATOR STUDIO
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Single Dropdown Selector for Staff Studio Modules */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-xs font-semibold text-neutral-400 hidden lg:inline font-mono uppercase tracking-wider">
          Studio Panel:
        </span>
        <div className="relative">
          <select
            value={activeView}
            onChange={(e) => onSelectView(e.target.value as MainAppView)}
            className="appearance-none bg-[#1c080d] border border-red-500/60 text-red-300 text-xs font-bold rounded-xl px-3.5 py-1.5 pr-8 focus:outline-none focus:border-red-400 cursor-pointer shadow-md hover:bg-[#280c13] transition-all min-h-[38px]"
          >
            <option value="newspaper">📰 Newspaper Broadsheet Studio</option>
            <option value="authorisation">🛡️ Authorisation &amp; Governance Centre</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-red-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Zone 3: Global Texture Toggle + Branding Kit */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleTexture}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 min-h-[38px] ${
            textureEnabled
              ? 'bg-red-950/80 text-red-300 border-red-500/50 shadow-sm'
              : 'bg-[#14080b] text-neutral-400 border-neutral-800 hover:text-neutral-200'
          }`}
          title="Toggle newsprint paper texture overlay"
        >
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden xl:inline">Newsprint Texture:</span> {textureEnabled ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={onOpenBrandingKit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white bg-[#14080b] hover:bg-[#200a10] border border-red-950 rounded-xl transition-colors whitespace-nowrap min-h-[38px]"
          title="Configure Organization Branding"
        >
          <Palette className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline">Branding Kit</span>
        </button>
      </div>
    </header>
  );
};
