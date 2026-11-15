import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Radio } from 'lucide-react';
import {
  EventCountdownConfig,
  subscribeEventCountdownConfig,
} from '../../services/firestoreStorage';
import defaultCountdownBackdrop from '../../assets/images/event_countdown_backdrop_1794407119370.jpg';

interface UpcomingEventCountdownProps {
  onActionClick?: () => void;
}

export const UpcomingEventCountdown: React.FC<UpcomingEventCountdownProps> = () => {
  const [config, setConfig] = useState<EventCountdownConfig | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isLive: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false });

  useEffect(() => {
    const unsub = subscribeEventCountdownConfig((cfg) => {
      setConfig(cfg);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!config) return;

    const calculateTime = () => {
      let targetMs = config.targetTimestamp;
      if (!targetMs && config.eventDate) {
        const timePart = config.eventTime || '20:00';
        const parsed = new Date(`${config.eventDate}T${timePart}:00`).getTime();
        targetMs = isNaN(parsed) ? Date.now() + 86400000 : parsed;
      }

      const diff = (targetMs || Date.now() + 86400000) - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isLive: false });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [config]);

  if (!config || config.countdownVisible === false) {
    return null;
  }

  const rawBg = config.backgroundImage || '';
  const bgImage =
    !rawBg || rawBg.startsWith('indexeddb://')
      ? defaultCountdownBackdrop
      : rawBg;
  const blurAmount = typeof config.imageBlur === 'number' ? config.imageBlur : 2;
  const overlayDarkness = typeof config.overlayDarkness === 'number' ? config.overlayDarkness : 72;

  return (
    <section className="relative w-full rounded-2xl overflow-hidden border border-neutral-800 group select-none">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
        style={{
          backgroundImage: `url("${bgImage}")`,
          filter: `blur(${blurAmount}px)`,
        }}
      />

      <div
        className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-black/75 to-red-950/40"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${overlayDarkness / 100})`,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-12 flex flex-col items-center text-center space-y-6">
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
          <div className="inline-flex items-center gap-2 text-red-400 font-bold tracking-widest uppercase">
            {timeLeft.isLive ? (
              <>
                <Radio className="w-3.5 h-3.5 text-red-500" />
                <span>Event Broadcasting Live</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-red-400" />
                <span>World Event Countdown</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2 max-w-2xl">
          <h2 className="font-serif font-black tracking-tight text-2xl sm:text-4xl text-white uppercase">
            {config.eventTitle}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed">
            {config.eventDescription}
          </p>
        </div>

        {timeLeft.isLive ? (
          <div className="px-6 py-4 bg-red-950/70 border border-red-500/40 rounded-xl max-w-lg text-center space-y-1">
            <h3 className="font-serif font-bold text-lg text-white">
              {config.eventLiveMessage || 'THE SHOW HAS BEGUN'}
            </h3>
            <p className="text-xs text-red-200 font-mono">
              Tune into the broadcast on the Streaming tab.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-xl">
            {[
              { label: 'DAYS', value: timeLeft.days },
              { label: 'HOURS', value: timeLeft.hours },
              { label: 'MINUTES', value: timeLeft.minutes },
              { label: 'SECONDS', value: timeLeft.seconds },
            ].map((unit) => (
              <div
                key={unit.label}
                className="interactive-card bg-[#0b0b0f]/90 backdrop-blur-md border border-neutral-800 hover:border-red-500/50 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center"
              >
                <span className="font-mono font-black text-2xl sm:text-4xl text-white tabular-nums">
                  {String(unit.value).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-mono tracking-widest text-neutral-500 mt-1 uppercase font-semibold">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <Calendar className="w-3.5 h-3.5 text-red-400" />
          <span className="tabular-nums">
            {config.eventDate || 'TBA'} · {config.eventTime || '20:00'} EST
          </span>
        </div>
      </div>
    </section>
  );
};
