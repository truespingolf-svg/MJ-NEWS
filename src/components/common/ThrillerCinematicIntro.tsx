import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';

interface ThrillerCinematicIntroProps {
  onComplete: () => void;
  sharedAudioRef?: React.RefObject<HTMLAudioElement | null>;
}

export const ThrillerCinematicIntro: React.FC<ThrillerCinematicIntroProps> = ({
  onComplete,
  sharedAudioRef,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsUserTap, setNeedsUserTap] = useState(false);
  const [isChainSnapped, setIsChainSnapped] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  // Blood drips positions along the sign and typography
  const drips = [
    { left: '12%', delay: '0.1s', height: '22px' },
    { left: '20%', delay: '0.8s', height: '28px' },
    { left: '28%', delay: '1.4s', height: '18px' },
    { left: '36%', delay: '0.3s', height: '32px' },
    { left: '44%', delay: '1.1s', height: '24px' },
    { left: '50%', delay: '0.5s', height: '36px' },
    { left: '56%', delay: '1.7s', height: '20px' },
    { left: '64%', delay: '0.9s', height: '30px' },
    { left: '72%', delay: '1.3s', height: '26px' },
    { left: '80%', delay: '0.4s', height: '34px' },
    { left: '88%', delay: '1.6s', height: '22px' },
  ];

  useEffect(() => {
    // Play shared audio element or create fallback
    let activeAudio = sharedAudioRef?.current;
    if (!activeAudio) {
      const fallback = new Audio('/assets/aistudio/THRILLER_AUDIO_IDEA_533b2f46.mp3');
      fallback.preload = 'auto';
      fallback.volume = 0.9;
      localAudioRef.current = fallback;
      activeAudio = fallback;
    }

    const tryPlay = () => {
      if (activeAudio) {
        activeAudio
          .play()
          .then(() => {
            setIsPlaying(true);
            setNeedsUserTap(false);
          })
          .catch(() => {
            // Autoplay blocked by browser policy without user gesture
            setNeedsUserTap(true);
          });
      }
    };

    tryPlay();

    // Hang sign for 10 seconds:
    // At 9.2s -> Bat takes flight & chain snaps
    const snapTimer = setTimeout(() => {
      setIsChainSnapped(true);
    }, 9200);

    // At 10.0s -> Sign falls and site reveals
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 10000);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 10800);

    return () => {
      clearTimeout(snapTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      // DO NOT pause or reset sharedAudioRef so the song carries on seamlessly!
      if (localAudioRef.current) {
        localAudioRef.current.pause();
        localAudioRef.current.currentTime = 0;
      }
    };
  }, [onComplete, sharedAudioRef]);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const activeAudio = sharedAudioRef?.current || localAudioRef.current;
    if (activeAudio) {
      activeAudio.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleUserTapPlay = () => {
    const activeAudio = sharedAudioRef?.current || localAudioRef.current;
    if (activeAudio) {
      activeAudio
        .play()
        .then(() => {
          setIsPlaying(true);
          setNeedsUserTap(false);
        })
        .catch(() => {});
    }
  };

  return (
    <div
      onClick={needsUserTap ? handleUserTapPlay : undefined}
      className={`fixed inset-0 z-50 overflow-hidden bg-black flex items-center justify-center transition-opacity duration-1000 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Dark misty void & blood-red atmospheric lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/50 via-black to-black" />

      {/* Atmospheric Fog & Lightning Flashes */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none bg-[radial-gradient(#991b1b_1px,transparent_1px)] [background-size:28px_28px] animate-pulse" />
      <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-pulse" style={{ animationDuration: '3s' }} />

      {/* Top Sound Control (NO SKIP INTRO BUTTON as requested) */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        {needsUserTap && (
          <div className="px-3.5 py-1.5 rounded-full bg-red-600/90 text-white font-mono text-xs font-bold animate-bounce flex items-center gap-1.5 shadow-lg shadow-red-950/80 cursor-pointer">
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>CLICK FOR THRILLER AUDIO</span>
          </div>
        )}

        <button
          onClick={handleToggleMute}
          className="p-2.5 rounded-full bg-black/80 hover:bg-neutral-900 border border-red-950 text-red-400 hover:text-white transition-all shadow-xl cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* 2 SUSPENSION STRINGS / CHAINS HANGING DOWN FROM THE TOP EDGE */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85vw] max-w-4xl h-full pointer-events-none flex justify-between px-10 sm:px-20">
        {/* Left Chain */}
        <div
          className={`relative w-2 h-[28vh] bg-gradient-to-b from-neutral-500 via-neutral-700 to-neutral-900 shadow-[0_0_10px_rgba(255,255,255,0.25)] transition-all duration-300 ${
            isChainSnapped ? 'opacity-0 scale-y-50' : 'opacity-100'
          }`}
        >
          <div className="absolute inset-0 flex flex-col justify-between py-1 opacity-80">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-3 -left-0.5 relative h-3 rounded-sm border border-neutral-400 bg-neutral-800" />
            ))}
          </div>
          <div className="absolute -bottom-3.5 -left-1.5 w-5 h-5 rounded-full border-2 border-red-500 bg-neutral-950 shadow-md" />
        </div>

        {/* Right Chain */}
        <div
          className={`relative w-2 h-[28vh] bg-gradient-to-b from-neutral-500 via-neutral-700 to-neutral-900 shadow-[0_0_10px_rgba(255,255,255,0.25)] transition-all duration-300 ${
            isChainSnapped ? 'opacity-0 scale-y-50' : 'opacity-100'
          }`}
        >
          <div className="absolute inset-0 flex flex-col justify-between py-1 opacity-80">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-3 -left-0.5 relative h-3 rounded-sm border border-neutral-400 bg-neutral-800" />
            ))}
          </div>
          <div className="absolute -bottom-3.5 -left-1.5 w-5 h-5 rounded-full border-2 border-red-500 bg-neutral-950 shadow-md" />
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
            className="w-24 sm:w-32 h-auto text-neutral-900 drop-shadow-[0_0_15px_rgba(220,38,38,0.7)]"
            viewBox="0 0 200 120"
            fill="currentColor"
          >
            {/* Bat Body & Claws Gripping Sign Top */}
            <path
              d="M100 40 C95 40 90 48 90 60 C90 75 95 90 100 95 C105 90 110 75 110 60 C110 48 105 40 100 40 Z"
              fill="#080204"
              stroke="#991b1b"
              strokeWidth="1.5"
            />
            {/* Bat Ears */}
            <polygon points="92,40 86,22 97,35" fill="#120407" stroke="#dc2626" strokeWidth="1" />
            <polygon points="108,40 114,22 103,35" fill="#120407" stroke="#dc2626" strokeWidth="1" />
            {/* Glowing Red Eyes */}
            <circle cx="96" cy="46" r="2.5" fill="#ef4444" className="animate-ping" style={{ animationDuration: '2s' }} />
            <circle cx="104" cy="46" r="2.5" fill="#ef4444" className="animate-ping" style={{ animationDuration: '2s' }} />
            {/* Left Wing (Folded & draped over sign) */}
            <path
              d="M90 55 C60 25 35 30 15 50 C25 65 45 75 60 70 C70 80 80 85 90 80 Z"
              fill="#0d0407"
              stroke="#7f1d1d"
              strokeWidth="2"
            />
            {/* Right Wing */}
            <path
              d="M110 55 C140 25 165 30 185 50 C175 65 155 75 140 70 C130 80 120 85 110 80 Z"
              fill="#0d0407"
              stroke="#7f1d1d"
              strokeWidth="2"
            />
            {/* Claws gripping top plank */}
            <line x1="94" y1="95" x2="94" y2="105" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="97" y1="95" x2="97" y2="105" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="103" y1="95" x2="103" y2="105" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="106" y1="95" x2="106" y2="105" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Top Suspension Eyelets on the Sign itself */}
        <div className="w-[85vw] max-w-4xl flex justify-between px-10 sm:px-20 mb-1 pointer-events-none">
          <div className="w-5 h-5 rounded-full border-2 border-red-700 bg-black shadow-[0_0_12px_rgba(220,38,38,0.9)]" />
          <div className="w-5 h-5 rounded-full border-2 border-red-700 bg-black shadow-[0_0_12px_rgba(220,38,38,0.9)]" />
        </div>

        {/* Sign Plaque Body */}
        <div className="relative px-8 sm:px-16 py-8 sm:py-12 bg-gradient-to-b from-[#180508] via-[#0b0204] to-[#120306] border-2 border-red-800 rounded-3xl shadow-[0_0_100px_rgba(220,38,38,0.55)] backdrop-blur-md">
          {/* Subtle wooden/metal grain border */}
          <div className="absolute inset-1.5 rounded-2xl border border-red-700/40 pointer-events-none" />

          {/* Blood Splatter Accent Aura */}
          <div className="absolute -inset-6 bg-red-600/25 rounded-full blur-3xl pointer-events-none animate-pulse" />

          {/* LINE 1: "MJJ" in enormous dripping blood horror font */}
          <div className="relative">
            <h1
              className="text-7xl sm:text-9xl md:text-[145px] font-black tracking-tight uppercase leading-none font-serif text-red-600 drop-shadow-[0_0_25px_rgba(220,38,38,0.9)]"
              style={{
                textShadow:
                  '0 0 10px #7f1d1d, 0 0 30px #dc2626, 0 0 60px #ef4444, 4px 6px 0px #300305, -2px -2px 0px #000',
                letterSpacing: '0.08em',
              }}
            >
              MJJ
            </h1>

            {/* Dripping blood droplets hanging directly off the MJJ letters */}
            <div className="absolute top-[80%] left-0 right-0 flex justify-around pointer-events-none">
              <span className="w-1.5 h-6 bg-red-600 rounded-b-full shadow-[0_0_6px_#dc2626] animate-blood-drip" />
              <span className="w-2 h-9 bg-red-600 rounded-b-full shadow-[0_0_6px_#dc2626] animate-blood-drip" style={{ animationDelay: '0.4s' }} />
              <span className="w-1.5 h-7 bg-red-600 rounded-b-full shadow-[0_0_6px_#dc2626] animate-blood-drip" style={{ animationDelay: '1.2s' }} />
            </div>
          </div>

          {/* LINE 2: "RECORDS" in dripping blood typography */}
          <div className="relative mt-3 sm:mt-5">
            <h2
              className="text-4xl sm:text-6xl md:text-8xl font-black tracking-[0.25em] uppercase leading-none font-serif text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]"
              style={{
                textShadow:
                  '0 0 10px #991b1b, 0 0 30px #dc2626, 3px 5px 0px #300305, -2px -2px 0px #000',
              }}
            >
              RECORDS
            </h2>

            {/* Dripping blood droplets hanging off the RECORDS letters */}
            <div className="absolute top-[85%] left-0 right-0 flex justify-between px-6 pointer-events-none">
              <span className="w-1.5 h-6 bg-red-600 rounded-b-full shadow-[0_0_6px_#dc2626] animate-blood-drip" style={{ animationDelay: '0.3s' }} />
              <span className="w-2 h-8 bg-red-600 rounded-b-full shadow-[0_0_6px_#dc2626] animate-blood-drip" style={{ animationDelay: '0.9s' }} />
              <span className="w-1.5 h-7 bg-red-600 rounded-b-full shadow-[0_0_6px_#dc2626] animate-blood-drip" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-9 bg-red-600 rounded-b-full shadow-[0_0_6px_#dc2626] animate-blood-drip" style={{ animationDelay: '1.5s' }} />
            </div>
          </div>

          {/* Tagline under the sign */}
          <div className="mt-5 pt-3.5 border-t border-red-950/80 flex items-center justify-center gap-3">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.3em] uppercase text-red-400">
              THE KING OF POP ENTERTAINMENT • THRILLER ERA
            </span>
          </div>

          {/* DRIPPING BLOOD PARTICLES FALLING FROM THE BOTTOM EDGE OF THE SIGN */}
          <div className="absolute -bottom-7 left-0 right-0 h-12 pointer-events-none overflow-visible">
            {drips.map((drip, idx) => (
              <div
                key={idx}
                className="absolute w-2 rounded-full bg-gradient-to-b from-red-600 via-red-700 to-red-950 animate-blood-drip shadow-[0_0_10px_#dc2626]"
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
        <div className="w-[60vw] max-w-2xl h-8 rounded-full bg-red-950/40 blur-xl mt-6 animate-pulse" />
      </div>

      {/* Custom Styles for 10-Second Pendulum Hang, Bat Takeoff, and Dramatic Sign Fall */}
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
          30% {
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
            transform: scaleY(2.4) translateY(32px);
            opacity: 0;
          }
        }

        .animate-pendulum-hang {
          animation: pendulumHang 9.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
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
