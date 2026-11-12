import React from 'react';

export const AtmosphericMovingBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Deep Blood Red to Black Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-[#070305] to-[#040102]" />

      {/* Moving Eerie Ambient Fog / Mist Drifts */}
      <div
        className="absolute inset-0 opacity-25 mix-blend-screen bg-repeat animate-mist-drift"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(220, 38, 38, 0.18) 0%, transparent 60%)`,
          backgroundSize: '1200px 800px',
        }}
      />

      {/* Floating Blood Ember Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => {
          const left = `${(i * 19) % 100}%`;
          const size = `${(i % 3) + 2}px`;
          const duration = `${12 + (i % 8)}s`;
          const delay = `${(i * 1.3) % 10}s`;

          return (
            <div
              key={i}
              className="absolute rounded-full bg-red-500/60 shadow-[0_0_8px_#dc2626] animate-float-ember"
              style={{
                left,
                bottom: '-20px',
                width: size,
                height: size,
                animationDuration: duration,
                animationDelay: delay,
              }}
            />
          );
        })}
      </div>

      {/* Bat Silhouettes Flying Across The Screen */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Bat 1: Flies from bottom-left to top-right */}
        <div
          className="absolute w-12 h-8 text-neutral-900/90 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)] animate-bat-flight-1"
          style={{ animationDuration: '22s', animationIterationCount: 'infinite' }}
        >
          <svg viewBox="0 0 100 60" fill="currentColor" className="w-full h-full animate-bat-wings">
            <path d="M50 30 C45 20 25 15 5 25 C15 35 25 38 35 34 C25 45 35 50 50 42 C65 50 75 45 65 34 C75 38 85 35 95 25 C75 15 55 20 50 30 Z" />
            <circle cx="48" cy="27" r="1.5" fill="#ef4444" />
            <circle cx="52" cy="27" r="1.5" fill="#ef4444" />
          </svg>
        </div>

        {/* Bat 2: Flies horizontally higher */}
        <div
          className="absolute w-9 h-6 text-neutral-900/80 drop-shadow-[0_0_6px_rgba(220,38,38,0.4)] animate-bat-flight-2"
          style={{ animationDuration: '18s', animationDelay: '4s', animationIterationCount: 'infinite' }}
        >
          <svg viewBox="0 0 100 60" fill="currentColor" className="w-full h-full animate-bat-wings">
            <path d="M50 30 C45 20 25 15 5 25 C15 35 25 38 35 34 C25 45 35 50 50 42 C65 50 75 45 65 34 C75 38 85 35 95 25 C75 15 55 20 50 30 Z" />
            <circle cx="48" cy="27" r="1.2" fill="#ef4444" />
            <circle cx="52" cy="27" r="1.2" fill="#ef4444" />
          </svg>
        </div>

        {/* Bat 3: Fast swoop from top-right to bottom-left */}
        <div
          className="absolute w-14 h-9 text-neutral-900/85 drop-shadow-[0_0_10px_rgba(220,38,38,0.6)] animate-bat-flight-3"
          style={{ animationDuration: '26s', animationDelay: '9s', animationIterationCount: 'infinite' }}
        >
          <svg viewBox="0 0 100 60" fill="currentColor" className="w-full h-full animate-bat-wings">
            <path d="M50 30 C45 20 25 15 5 25 C15 35 25 38 35 34 C25 45 35 50 50 42 C65 50 75 45 65 34 C75 38 85 35 95 25 C75 15 55 20 50 30 Z" />
            <circle cx="48" cy="27" r="1.5" fill="#ef4444" />
            <circle cx="52" cy="27" r="1.5" fill="#ef4444" />
          </svg>
        </div>

        {/* Bat 4: Background small bat */}
        <div
          className="absolute w-7 h-5 text-neutral-950/70 drop-shadow-[0_0_4px_rgba(220,38,38,0.3)] animate-bat-flight-4"
          style={{ animationDuration: '16s', animationDelay: '14s', animationIterationCount: 'infinite' }}
        >
          <svg viewBox="0 0 100 60" fill="currentColor" className="w-full h-full animate-bat-wings">
            <path d="M50 30 C45 20 25 15 5 25 C15 35 25 38 35 34 C25 45 35 50 50 42 C65 50 75 45 65 34 C75 38 85 35 95 25 C75 15 55 20 50 30 Z" />
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes mistDrift {
          0% {
            background-position: 0px 0px;
          }
          50% {
            background-position: 600px 300px;
          }
          100% {
            background-position: 1200px 0px;
          }
        }

        @keyframes floatEmber {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-110vh) translateX(40px);
            opacity: 0;
          }
        }

        @keyframes batWings {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.4);
          }
        }

        @keyframes batFlight1 {
          0% {
            transform: translate(-10vw, 85vh) scale(0.7) rotate(15deg);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          50% {
            transform: translate(45vw, 40vh) scale(1) rotate(-5deg);
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translate(110vw, -10vh) scale(0.6) rotate(10deg);
            opacity: 0;
          }
        }

        @keyframes batFlight2 {
          0% {
            transform: translate(-15vw, 25vh) scale(0.6) rotate(5deg);
            opacity: 0;
          }
          15% {
            opacity: 0.85;
          }
          55% {
            transform: translate(50vw, 35vh) scale(0.9) rotate(12deg);
          }
          90% {
            opacity: 0.85;
          }
          100% {
            transform: translate(115vw, 15vh) scale(0.6) rotate(-8deg);
            opacity: 0;
          }
        }

        @keyframes batFlight3 {
          0% {
            transform: translate(110vw, 20vh) scale(1) rotate(-25deg);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          50% {
            transform: translate(50vw, 60vh) scale(1.1) rotate(5deg);
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translate(-15vw, 85vh) scale(0.8) rotate(-15deg);
            opacity: 0;
          }
        }

        @keyframes batFlight4 {
          0% {
            transform: translate(30vw, 105vh) scale(0.5) rotate(-15deg);
            opacity: 0;
          }
          15% {
            opacity: 0.7;
          }
          60% {
            transform: translate(65vw, 45vh) scale(0.7) rotate(10deg);
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translate(95vw, -15vh) scale(0.5) rotate(-5deg);
            opacity: 0;
          }
        }

        .animate-mist-drift {
          animation: mistDrift 45s linear infinite;
        }

        .animate-float-ember {
          animation: floatEmber linear infinite;
        }

        .animate-bat-wings {
          animation: batWings 0.22s ease-in-out infinite;
          transform-origin: center;
        }

        .animate-bat-flight-1 {
          animation: batFlight1 22s linear infinite;
        }

        .animate-bat-flight-2 {
          animation: batFlight2 18s linear infinite;
        }

        .animate-bat-flight-3 {
          animation: batFlight3 26s linear infinite;
        }

        .animate-bat-flight-4 {
          animation: batFlight4 16s linear infinite;
        }
      `}</style>
    </div>
  );
};
