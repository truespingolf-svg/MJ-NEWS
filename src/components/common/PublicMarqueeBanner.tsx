import React from 'react';
import { Radio } from 'lucide-react';

interface Announcement {
  id: string;
  text: string;
  active: boolean;
}

interface PublicMarqueeBannerProps {
  announcements: Announcement[];
}

export const PublicMarqueeBanner: React.FC<PublicMarqueeBannerProps> = ({ announcements }) => {
  if (!announcements || announcements.length === 0) return null;

  const combinedText = announcements.map((a) => a.text).join('   •   ');

  return (
    <div className="bg-neutral-950/95 border-b border-neutral-800/90 text-amber-200/90 py-2 px-4 flex items-center gap-3 overflow-hidden select-none z-30">
      <div className="flex items-center gap-1.5 shrink-0 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest">
        <Radio className="w-3 h-3 text-red-500" />
        <span>MJJ WIRE</span>
      </div>

      <span className="text-neutral-700 shrink-0" aria-hidden="true">|</span>

      <div className="flex-1 overflow-hidden relative">
        <div className="whitespace-nowrap inline-block animate-marquee font-mono text-xs tracking-wide text-neutral-300">
          <span className="mx-6">{combinedText}</span>
          <span className="mx-6">{combinedText}</span>
          <span className="mx-6">{combinedText}</span>
        </div>
      </div>
    </div>
  );
};
