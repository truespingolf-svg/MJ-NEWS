import React from 'react';
import {
  Newspaper,
  Ticket,
  ShieldCheck,
  FolderOpen,
  Palette,
  Lock,
  Unlock,
} from 'lucide-react';

export type MainAppView = 'newspaper' | 'tickets' | 'authorisation' | 'library';

interface TopNavigationProps {
  activeView: MainAppView;
  onSelectView: (view: MainAppView) => void;
  isAuthorisationUnlocked: boolean;
  onOpenBrandingKit: () => void;
  saveStatus?: 'saved' | 'saving' | 'unsaved';
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeView,
  onSelectView,
  isAuthorisationUnlocked,
  onOpenBrandingKit,
  saveStatus,
}) => {
  return (
    <header className="h-14 bg-[#0a0a0c] border-b border-[#222226] px-6 flex items-center justify-between gap-8 text-[#ececee] select-none shrink-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onSelectView('newspaper')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:border-amber-400 transition-colors">
            <Newspaper className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-serif font-black text-sm tracking-wide text-white uppercase block leading-none">
              NEXPAPER STUDIO
            </span>
            <span className="text-[10px] text-neutral-400 font-sans tracking-wider block mt-0.5">
              Professional Publishing Suite
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation Links (Single-Line, No Pills) */}
      <nav className="hidden md:flex items-center gap-8 text-xs font-medium">
        <button
          onClick={() => onSelectView('newspaper')}
          className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeView === 'newspaper'
              ? 'text-amber-400 border-amber-400 font-semibold'
              : 'text-neutral-400 border-transparent hover:text-white'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>Newspaper Broadsheets</span>
        </button>

        <button
          onClick={() => onSelectView('tickets')}
          className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeView === 'tickets'
              ? 'text-amber-400 border-amber-400 font-semibold'
              : 'text-neutral-400 border-transparent hover:text-white'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Ticket &amp; Invitation Studio</span>
        </button>

        <button
          onClick={() => onSelectView('authorisation')}
          className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeView === 'authorisation'
              ? 'text-amber-400 border-amber-400 font-semibold'
              : 'text-neutral-400 border-transparent hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Authorisation Centre</span>
          {isAuthorisationUnlocked ? (
            <Unlock className="w-3 h-3 text-emerald-400" />
          ) : (
            <Lock className="w-3 h-3 text-amber-500/80" />
          )}
        </button>

        <button
          onClick={() => onSelectView('library')}
          className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeView === 'library'
              ? 'text-amber-400 border-amber-400 font-semibold'
              : 'text-neutral-400 border-transparent hover:text-white'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Document Library</span>
        </button>
      </nav>

      {/* Zone 3: 1 Primary Branding Kit Action + Status */}
      <div className="flex items-center gap-3 shrink-0">
        {saveStatus && (
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-neutral-400">
            {saveStatus === 'saving' ? (
              <span className="text-amber-400">Saving...</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Saved
              </span>
            )}
          </div>
        )}

        <button
          onClick={onOpenBrandingKit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white bg-[#16161a] hover:bg-[#202026] border border-[#2d2d34] rounded-lg transition-colors whitespace-nowrap shrink-0"
          title="Configure Organization Branding (Logo, Colors, Fonts)"
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>Branding Kit</span>
        </button>
      </div>
    </header>
  );
};
