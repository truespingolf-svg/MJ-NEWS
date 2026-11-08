import React from 'react';
import { Volume2, Radio } from 'lucide-react';

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

  const combinedText = announcements.map((a) => a.text).join('   •••   ');

  return (
    <div className="bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 border-b border-amber-500/30 text-amber-300 py-2 px-4 flex items-center gap-3 overflow-hidden select-none shadow-md z-30">
      {/* Live Broadcast Badge */}
      <div className="flex items-center gap-1.5 shrink-0 bg-amber-500/20 text-amber-300 text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-500/40 animate-pulse">
        <Radio className="w-3 h-3 text-amber-400" />
        <span>MJJ WIRE</span>
      </div>

      {/* Scrolling Text Container */}
      <div className="flex-1 overflow-hidden relative">
        <div className="whitespace-nowrap inline-block animate-marquee font-mono text-xs tracking-wider text-amber-200 font-medium">
          <span className="mx-4">{combinedText}</span>
          <span className="mx-4">{combinedText}</span>
          <span className="mx-4">{combinedText}</span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-amber-400/70">
        <Volume2 className="w-3 h-3 text-amber-400" />
        <span>LIVE</span>
      </div>
    </div>
  );
};
