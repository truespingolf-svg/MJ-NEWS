import React from 'react';
import {
  Newspaper,
  ShieldCheck,
  Home,
  Palette,
  Sparkles,
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
  onOpenBrandingKit,
  onReturnToPublicPortal,
  textureEnabled,
  onToggleTexture,
}) => {
  return (
    <header className="min-h-14 py-2 bg-[#0b090c] border-b border-neutral-800 px-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-neutral-100 select-none shrink-0 z-40">
      {/* Zone 1: Exit & Staff Studio Label */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onReturnToPublicPortal}
          className="flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-red-300 border border-neutral-800 hover:border-red-500/40 transition-all active:scale-95 cursor-pointer"
          title="Return to MJJ Records Public Site"
        >
          <Home className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="uppercase tracking-wide">Exit to Site</span>
        </button>

        <span className="font-serif font-bold text-xs tracking-widest text-neutral-300 uppercase hidden md:inline">
          MJJ Staff Workspace
        </span>
      </div>

      {/* Zone 2: Direct Segmented Mode Switcher (No buried dropdown) */}
      <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 shrink-0">
        <button
          type="button"
          onClick={() => onSelectView('newspaper')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeView === 'newspaper'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>Newspaper Studio</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView('authorisation')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeView === 'authorisation'
              ? 'bg-amber-500 text-black shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin &amp; Moderation</span>
        </button>
      </div>

      {/* Zone 3: Quick Studio Preferences */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleTexture}
          className={`px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
            textureEnabled
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
          }`}
          title="Toggle newsprint paper texture overlay"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Texture:</span> {textureEnabled ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={onOpenBrandingKit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          title="Configure Organization Branding"
        >
          <Palette className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline">Branding Kit</span>
        </button>
      </div>
    </header>
  );
};
