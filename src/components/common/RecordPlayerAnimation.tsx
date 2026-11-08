import React, { useState } from 'react';
import { Play, Pause, Disc, Disc3, Radio, Sparkles, Sliders, Volume2, Award } from 'lucide-react';

export const RecordPlayerAnimation: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [rpm, setRpm] = useState<'33' | '45'>('33');
  const [selectedTrack, setSelectedTrack] = useState<string>('Billie Jean (1982 Master Pressing)');

  const tracks = [
    'Billie Jean (1982 Master Pressing)',
    'Thriller (1982 Diamond Edition)',
    'Beat It (Analog Studio Reel)',
    'Smooth Criminal (1987 Bad Sessions)',
    'Black or White (1991 World Tour Orchestral)',
  ];

  return (
    <div className="relative rounded-3xl bg-gradient-to-b from-[#14141a] via-[#0d0d12] to-[#070709] border border-amber-500/20 p-8 shadow-2xl overflow-hidden group select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Disc3 className={`w-7 h-7 ${isPlaying ? 'animate-spin-vinyl' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                MJJ RECORDS
              </span>
              <span className="text-[10px] font-mono text-neutral-400">ANALOG TURNTABLE</span>
            </div>
            <h3 className="font-serif text-lg font-bold text-white tracking-wide mt-0.5">
              {selectedTrack}
            </h3>
          </div>
        </div>

        {/* Speed Controls & Play State */}
        <div className="flex items-center gap-3">
          <div className="flex bg-[#181822] p-1 rounded-xl border border-[#2e2e3e] text-xs font-mono">
            <button
              onClick={() => setRpm('33')}
              className={`px-3 py-1 rounded-lg transition-colors font-bold ${
                rpm === '33' ? 'bg-amber-400 text-black shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              33 ⅓ RPM
            </button>
            <button
              onClick={() => setRpm('45')}
              className={`px-3 py-1 rounded-lg transition-colors font-bold ${
                rpm === '45' ? 'bg-amber-400 text-black shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              45 RPM
            </button>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${
              isPlaying
                ? 'bg-amber-400 text-black hover:bg-amber-300'
                : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE TURNTABLE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>SPIN VINYL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Turntable Deck & Vinyl Disc Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Spinning Vinyl Platter (7 Cols) */}
        <div className="lg:col-span-7 flex justify-center items-center relative py-4">
          {/* Turntable Platter Deck Base */}
          <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-[#111115] border-4 border-[#252530] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex items-center justify-center">
            {/* Spinning Vinyl Disc */}
            <div
              className={`w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-neutral-950 border-2 border-neutral-800 relative flex items-center justify-center shadow-2xl transition-transform ${
                isPlaying ? 'animate-spin-vinyl' : ''
              }`}
              style={{
                animationDuration: rpm === '45' ? '2s' : '3.5s',
                backgroundImage: `
                  radial-gradient(circle at center, transparent 30%, rgba(255,255,255,0.03) 31%, transparent 32%),
                  radial-gradient(circle at center, transparent 40%, rgba(255,255,255,0.03) 41%, transparent 42%),
                  radial-gradient(circle at center, transparent 50%, rgba(255,255,255,0.03) 51%, transparent 52%),
                  radial-gradient(circle at center, transparent 60%, rgba(255,255,255,0.03) 61%, transparent 62%),
                  radial-gradient(circle at center, transparent 70%, rgba(255,255,255,0.03) 71%, transparent 72%)
                `,
              }}
            >
              {/* Record Label Center */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-300 p-1 flex flex-col items-center justify-center text-center shadow-inner relative border-2 border-amber-200">
                <Disc className="w-5 h-5 text-amber-950 mb-0.5" />
                <span className="font-serif font-black text-[9px] text-amber-950 uppercase tracking-tighter leading-none">
                  MJJ RECORDS
                </span>
                <span className="font-mono text-[7px] text-amber-900 mt-0.5 font-bold">
                  STEREO • 1982
                </span>
                {/* Center Spindle Hole */}
                <div className="w-3 h-3 rounded-full bg-neutral-900 border border-neutral-700 mt-1 shadow-inner" />
              </div>
            </div>

            {/* Tonearm & Needle */}
            <div
              className={`absolute top-2 right-4 w-28 h-32 pointer-events-none transition-transform duration-700 origin-top-right ${
                isPlaying ? 'rotate-12' : '-rotate-12'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-amber-400 border border-amber-200 shadow-md ml-auto" />
              <div className="w-1 h-28 bg-gradient-to-b from-amber-400 to-neutral-400 ml-auto mr-1.5 shadow-md" />
              <div className="w-3 h-5 bg-neutral-800 border border-amber-400 rounded-sm ml-auto -mt-1 shadow-lg" />
            </div>
          </div>
        </div>

        {/* Track List & Equalizer Visualizer (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-sans">
              Master Tape Archive
            </span>
            <span className="text-[10px] font-mono text-neutral-400">HI-RES AUDIO</span>
          </div>

          <div className="space-y-1.5">
            {tracks.map((track, idx) => (
              <button
                key={track}
                onClick={() => setSelectedTrack(track)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between border ${
                  selectedTrack === track
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold'
                    : 'bg-[#121218] border-[#222230] text-neutral-400 hover:text-white hover:bg-[#1a1a24]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] text-amber-500/70 font-bold">
                    0{idx + 1}
                  </span>
                  <span className="truncate max-w-[200px]">{track}</span>
                </div>
                {selectedTrack === track && isPlaying && (
                  <div className="flex items-end gap-0.5 h-3 shrink-0">
                    <span className="w-0.5 bg-amber-400 animate-bounce h-2" />
                    <span className="w-0.5 bg-amber-400 animate-bounce h-3 delay-75" />
                    <span className="w-0.5 bg-amber-400 animate-bounce h-1.5 delay-150" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Equalizer Visualizer Bar */}
          <div className="p-3 bg-[#111116] border border-[#22222e] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-neutral-300 font-mono">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>FREQ: 44.1kHz • 24-BIT MASTER</span>
            </div>
            <div className="flex items-end gap-1 h-4">
              {[60, 90, 40, 100, 70, 85, 45, 95, 80, 50].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-t transition-all ${
                    isPlaying ? 'bg-amber-400' : 'bg-neutral-700'
                  }`}
                  style={{
                    height: isPlaying ? `${h}%` : '20%',
                    transitionDuration: '150ms',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
