import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, ArrowRight, Play } from 'lucide-react';

interface ThrillerCinematicIntroProps {
  onComplete: () => void;
  sharedAudioRef?: React.RefObject<HTMLAudioElement | null>;
}

export const ThrillerCinematicIntro: React.FC<ThrillerCinematicIntroProps> = ({
  onComplete,
  sharedAudioRef,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isChainSnapped, setIsChainSnapped] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [songTime, setSongTime] = useState<{ current: number; duration: number }>({ current: 0, duration: 294 });

  // Blood drips positions along the sign and typography
  const drips = [
    { left: '10%', delay: '0.1s', height: '26px' },
    { left: '18%', delay: '0.7s', height: '34px' },
    { left: '26%', delay: '1.3s', height: '20px' },
    { left: '34%', delay: '0.3s', height: '38px' },
    { left: '42%', delay: '1.0s', height: '28px' },
    { left: '50%', delay: '0.4s', height: '42px' },
    { left: '58%', delay: '1.6s', height: '24px' },
    { left: '66%', delay: '0.8s', height: '36px' },
    { left: '74%', delay: '1.2s', height: '30px' },
    { left: '82%', delay: '0.5s', height: '40px' },
    { left: '90%', delay: '1.5s', height: '26px' },
  ];

  const formatAudioTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  useEffect(() => {
    let activeAudio = sharedAudioRef?.current;

    const updateTime = () => {
      if (activeAudio) {
        setSongTime({
          current: activeAudio.currentTime || 0,
          duration: activeAudio.duration || 294,
        });
      }
    };

    if (activeAudio) {
      activeAudio.addEventListener('timeupdate', updateTime);
      activeAudio.addEventListener('loadedmetadata', updateTime);
      activeAudio.play().catch(() => {
        const handleFirstInteraction = () => {
          if (activeAudio) {
            activeAudio.play().catch(() => {});
          }
          window.removeEventListener('pointerdown', handleFirstInteraction);
          window.removeEventListener('keydown', handleFirstInteraction);
        };
        window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
        window.addEventListener('keydown', handleFirstInteraction, { once: true });
      });
    }

    // Keyboard shortcut to enter immediately
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Sequence timing (snappy 6-second total display):
    // At 4.2s -> Chain snaps
    const snapTimer = setTimeout(() => {
      setIsChainSnapped(true);
    }, 4200);

    // At 5.2s -> Sign falls down
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 5200);

    // At 5.8s -> Hand over to main site seamlessly
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 5800);

    return () => {
      clearTimeout(snapTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (activeAudio) {
        activeAudio.removeEventListener('timeupdate', updateTime);
        activeAudio.removeEventListener('loadedmetadata', updateTime);
      }
    };
  }, [onComplete, sharedAudioRef]);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const activeAudio = sharedAudioRef?.current;
    if (activeAudio) {
      activeAudio.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      onClick={() => handleDismiss()}
      className={`fixed inset-0 z-50 overflow-hidden bg-black flex items-center justify-center transition-opacity duration-500 select-none cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      title="Click anywhere to enter site immediately"
    >
      {/* Dark misty void & blood-red atmospheric lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/60 via-[#070103] to-black" />

      {/* Atmospheric Fog & Lightning Flashes */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:28px_28px] animate-pulse" />
      <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-pulse" style={{ animationDuration: '3s' }} />

      {/* Live Playing Song Time Badge */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-black/85 border border-red-900/80 text-red-400 font-mono text-xs shadow-2xl backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <span className="font-bold text-white uppercase tracking-wider">Billie Jean</span>
        <span className="text-neutral-500">•</span>
        <span className="text-amber-300 font-bold font-mono">
          {formatAudioTime(songTime.current)} / {formatAudioTime(songTime.duration)}
        </span>
      </div>

      {/* Right Controls: Mute + Prominent ENTER SITE / SKIP INTRO Button */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={handleToggleMute}
          className="p-3 rounded-2xl bg-black/80 hover:bg-neutral-900 border border-red-900 text-red-400 hover:text-white transition-all shadow-2xl cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        <button
          onClick={(e) => handleDismiss(e)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-2xl border border-red-400/50 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
        >
          <span>ENTER SITE NOW</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2 SUSPENSION STRINGS / HEAVY CHAINS HANGING DOWN FROM THE TOP EDGE */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[88vw] max-w-4xl h-full pointer-events-none flex justify-between px-8 sm:px-16">
        {/* Left Chain */}
        <div
          className={`relative w-2.5 h-[28vh] bg-gradient-to-b from-neutral-400 via-neutral-700 to-neutral-900 shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-all duration-300 ${
            isChainSnapped ? 'opacity-0 scale-y-25' : 'opacity-100'
          }`}
        >
          <div className="absolute inset-0 flex flex-col justify-between py-1 opacity-90">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="w-3.5 -left-0.5 relative h-3.5 rounded-sm border border-neutral-400 bg-neutral-800 shadow-sm" />
            ))}
          </div>
          <div className="absolute -bottom-4 -left-1.5 w-6 h-6 rounded-full border-2 border-red-500 bg-neutral-950 shadow-md" />
        </div>

        {/* Right Chain */}
        <div
          className={`relative w-2.5 h-[28vh] bg-gradient-to-b from-neutral-400 via-neutral-700 to-neutral-900 shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-all duration-300 ${
            isChainSnapped ? 'opacity-0 scale-y-25' : 'opacity-100'
          }`}
        >
          <div className="absolute inset-0 flex flex-col justify-between py-1 opacity-90">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="w-3.5 -left-0.5 relative h-3.5 rounded-sm border border-neutral-400 bg-neutral-800 shadow-sm" />
            ))}
          </div>
          <div className="absolute -bottom-4 -left-1.5 w-6 h-6 rounded-full border-2 border-red-500 bg-neutral-950 shadow-md" />
        </div>
      </div>

      {/* THE HANGING SIGN + PERCHED BAT THAT DROPS AT 10 SECONDS */}
      <div
        className={`relative z-20 flex flex-col items-center justify-center text-center mt-[10vh] ${
          isChainSnapped ? 'animate-sign-fall' : 'animate-pendulum-hang'
        }`}
      >
        {/* ANIMATED GOTHIC BAT PERCHED ON TOP OF THE HANGING SIGN */}
        <div
          className={`relative -mb-6 z-30 transition-transform ${
            isChainSnapped ? 'animate-bat-takeoff' : 'animate-bat-breathe'
          }`}
        >
          <svg
            className="w-28 sm:w-36 h-auto text-neutral-950 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]"
            viewBox="0 0 200 120"
            fill="currentColor"
          >
            {/* Bat Body & Claws Gripping Sign Top */}
            <path
              d="M100 40 C95 40 90 48 90 60 C90 75 95 90 100 95 C105 90 110 75 110 60 C110 48 105 40 100 40 Z"
              fill="#060103"
              stroke="#b91c1c"
              strokeWidth="2"
            />
            {/* Bat Ears */}
            <polygon points="92,40 85,20 97,35" fill="#120407" stroke="#dc2626" strokeWidth="1.5" />
            <polygon points="108,40 115,20 103,35" fill="#120407" stroke="#dc2626" strokeWidth="1.5" />
            {/* Glowing Red Eyes */}
            <circle cx="96" cy="46" r="3" fill="#ef4444" className="animate-ping" style={{ animationDuration: '1.8s' }} />
            <circle cx="104" cy="46" r="3" fill="#ef4444" className="animate-ping" style={{ animationDuration: '1.8s' }} />
            {/* Left Wing (Folded & draped over sign) */}
            <path
              d="M90 55 C60 25 35 30 15 50 C25 65 45 75 60 70 C70 80 80 85 90 80 Z"
              fill="#0d0306"
              stroke="#7f1d1d"
              strokeWidth="2.5"
            />
            {/* Right Wing */}
            <path
              d="M110 55 C140 25 165 30 185 50 C175 65 155 75 140 70 C130 80 120 85 110 80 Z"
              fill="#0d0306"
              stroke="#7f1d1d"
              strokeWidth="2.5"
            />
            {/* Claws gripping top plank */}
            <line x1="94" y1="95" x2="94" y2="105" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <line x1="97" y1="95" x2="97" y2="105" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <line x1="103" y1="95" x2="103" y2="105" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <line x1="106" y1="95" x2="106" y2="105" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        {/* Top Suspension Eyelets on the Sign itself */}
        <div className="w-[88vw] max-w-4xl flex justify-between px-8 sm:px-16 mb-1 pointer-events-none">
          <div className="w-6 h-6 rounded-full border-2 border-red-600 bg-black shadow-[0_0_15px_rgba(220,38,38,1)]" />
          <div className="w-6 h-6 rounded-full border-2 border-red-600 bg-black shadow-[0_0_15px_rgba(220,38,38,1)]" />
        </div>

        {/* Sign Plaque Body */}
        <div className="relative px-8 sm:px-16 py-8 sm:py-12 bg-gradient-to-b from-[#1c050a] via-[#0d0205] to-[#140307] border-2 border-red-700 rounded-3xl shadow-[0_0_120px_rgba(220,38,38,0.65)] backdrop-blur-md">
          {/* Subtle metallic grain border */}
          <div className="absolute inset-1.5 rounded-2xl border border-red-600/40 pointer-events-none" />

          {/* Blood Splatter Accent Aura */}
          <div className="absolute -inset-6 bg-red-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />

          {/* LINE 1: "MJJ" in enormous dripping blood horror font */}
          <div className="relative">
            <h1
              className="text-7xl sm:text-9xl md:text-[145px] font-black tracking-tight uppercase leading-none font-serif text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,1)]"
              style={{
                textShadow:
                  '0 0 12px #7f1d1d, 0 0 35px #dc2626, 0 0 70px #ef4444, 4px 6px 0px #300305, -2px -2px 0px #000',
                letterSpacing: '0.08em',
              }}
            >
              MJJ
            </h1>

            {/* Dripping blood droplets hanging directly off the MJJ letters */}
            <div className="absolute top-[80%] left-0 right-0 flex justify-around pointer-events-none">
              <span className="w-2 h-7 bg-red-600 rounded-b-full shadow-[0_0_8px_#dc2626] animate-blood-drip" />
              <span className="w-2.5 h-10 bg-red-600 rounded-b-full shadow-[0_0_8px_#dc2626] animate-blood-drip" style={{ animationDelay: '0.4s' }} />
              <span className="w-2 h-8 bg-red-600 rounded-b-full shadow-[0_0_8px_#dc2626] animate-blood-drip" style={{ animationDelay: '1.2s' }} />
            </div>
          </div>

          {/* LINE 2: "RECORDS" in dripping blood typography */}
          <div className="relative mt-3 sm:mt-5">
            <h2
              className="text-4xl sm:text-6xl md:text-8xl font-black tracking-[0.25em] uppercase leading-none font-serif text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.9)]"
              style={{
                textShadow:
                  '0 0 12px #991b1b, 0 0 35px #dc2626, 3px 5px 0px #300305, -2px -2px 0px #000',
              }}
            >
              RECORDS
            </h2>

            {/* Dripping blood droplets hanging off the RECORDS letters */}
            <div className="absolute top-[85%] left-0 right-0 flex justify-between px-6 pointer-events-none">
              <span className="w-2 h-7 bg-red-600 rounded-b-full shadow-[0_0_8px_#dc2626] animate-blood-drip" style={{ animationDelay: '0.3s' }} />
              <span className="w-2.5 h-9 bg-red-600 rounded-b-full shadow-[0_0_8px_#dc2626] animate-blood-drip" style={{ animationDelay: '0.9s' }} />
              <span className="w-2 h-8 bg-red-600 rounded-b-full shadow-[0_0_8px_#dc2626] animate-blood-drip" style={{ animationDelay: '0.2s' }} />
              <span className="w-2.5 h-10 bg-red-600 rounded-b-full shadow-[0_0_8px_#dc2626] animate-blood-drip" style={{ animationDelay: '1.5s' }} />
            </div>
          </div>

          {/* Tagline under the sign */}
          <div className="mt-5 pt-3.5 border-t border-red-950/90 flex items-center justify-center gap-3">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.3em] uppercase text-red-400">
              THE KING OF POP ENTERTAINMENT • THRILLER ERA
            </span>
          </div>

          {/* DRIPPING BLOOD PARTICLES FALLING FROM THE BOTTOM EDGE OF THE SIGN */}
          <div className="absolute -bottom-8 left-0 right-0 h-14 pointer-events-none overflow-visible">
            {drips.map((drip, idx) => (
              <div
                key={idx}
                className="absolute w-2.5 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-950 animate-blood-drip shadow-[0_0_12px_#dc2626]"
                style={{
                  left: drip.left,
                  height: drip.height,
                  animationDelay: drip.delay,
                  animationDuration: '1.9s',
                  animationIterationCount: 'infinite',
                }}
              />
            ))}
          </div>
        </div>

        {/* Shadow cast on the floor beneath the swinging sign */}
        <div className="w-[60vw] max-w-2xl h-8 rounded-full bg-red-950/50 blur-xl mt-6 animate-pulse" />
      </div>

      <style>{`
        @keyframes pendulumHang {
          0% {
            transform: translateY(-120%) rotate(-10deg);
            opacity: 0;
          }
          15% {
            transform: translateY(0%) rotate(7deg);
            opacity: 1;
          }
          30% {
            transform: translateY(0%) rotate(-5deg);
          }
          45% {
            transform: translateY(0%) rotate(3.5deg);
          }
          60% {
            transform: translateY(0%) rotate(-2deg);
          }
          75% {
            transform: translateY(0%) rotate(1deg);
          }
          90% {
            transform: translateY(0%) rotate(0deg);
          }
          100% {
            transform: translateY(0%) rotate(0deg);
          }
        }

        @keyframes signFall {
          0% {
            transform: translateY(0%) rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: translateY(15%) rotate(14deg);
          }
          100% {
            transform: translateY(140vh) rotate(35deg);
            opacity: 0;
          }
        }

        @keyframes batBreathe {
          0%, 100% {
            transform: scale(1) translateY(0);
          }
          50% {
            transform: scale(1.05) translateY(-3px);
          }
        }

        @keyframes batTakeoff {
          0% {
            transform: scale(1) translateY(0);
          }
          40% {
            transform: scale(1.6) translateY(-40px) rotate(-15deg);
          }
          100% {
            transform: scale(2.4) translateY(-300px) rotate(20deg);
            opacity: 0;
          }
        }

        @keyframes bloodDrip {
          0% {
            transform: scaleY(0.2) translateY(0);
            opacity: 0.95;
          }
          50% {
            transform: scaleY(1.5) translateY(8px);
            opacity: 1;
          }
          100% {
            transform: scaleY(2.4) translateY(36px);
            opacity: 0;
          }
        }

        .animate-pendulum-hang {
          animation: pendulumHang 9.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          transform-origin: top center;
        }

        .animate-sign-fall {
          animation: signFall 1.2s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
          transform-origin: top left;
        }

        .animate-bat-breathe {
          animation: batBreathe 2.5s ease-in-out infinite;
        }

        .animate-bat-takeoff {
          animation: batTakeoff 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .animate-blood-drip {
          animation: bloodDrip 1.9s ease-in infinite;
        }
      `}</style>
    </div>
  );
};
