import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Radio, Edit3, X, Save } from 'lucide-react';
import {
  EventCountdownConfig,
  subscribeEventCountdownConfig,
  setEventCountdownConfigInFirestore,
} from '../../services/firestoreStorage';

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

  const [showPickerModal, setShowPickerModal] = useState<boolean>(false);
  const [pickerDateTime, setPickerDateTime] = useState<string>('');
  const [pickerTitle, setPickerTitle] = useState<string>('');
  const [pickerDesc, setPickerDesc] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeEventCountdownConfig((cfg) => {
      setConfig(cfg);
      if (cfg) {
        setPickerTitle(cfg.eventTitle || 'THRILLER 45TH ANNIVERSARY • GLOBAL PRESS PREMIERE');
        setPickerDesc(cfg.eventDescription || 'Worldwide holographic showcase and multi-track master release.');
        if (cfg.targetTimestamp) {
          const d = new Date(cfg.targetTimestamp);
          const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setPickerDateTime(iso);
        } else {
          const defaultTarget = new Date(Date.now() + 86400000 * 7);
          const iso = new Date(defaultTarget.getTime() - defaultTarget.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setPickerDateTime(iso);
        }
      }
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

  const handleSaveTargetDateTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickerDateTime) return;
    setIsSaving(true);
    try {
      const targetTs = new Date(pickerDateTime).getTime();
      const datePart = pickerDateTime.split('T')[0];
      const timePart = pickerDateTime.split('T')[1] || '20:00';

      await setEventCountdownConfigInFirestore({
        eventTitle: pickerTitle.trim() || 'THRILLER 45TH ANNIVERSARY • GLOBAL PRESS PREMIERE',
        eventDescription: pickerDesc.trim() || 'Worldwide holographic showcase and multi-track master release.',
        targetTimestamp: targetTs,
        eventDate: datePart,
        eventTime: timePart,
        countdownVisible: true,
      });
      setShowPickerModal(false);
    } catch (err) {
      console.error('Error saving countdown target date & time:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!config || config.countdownVisible === false) {
    return null;
  }

  const bgImage = config.backgroundImage || '/src/assets/images/event_countdown_backdrop_1794407119370.jpg';
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

          <span className="text-neutral-700" aria-hidden="true">·</span>

          <button
            onClick={() => setShowPickerModal(true)}
            className="text-amber-300 hover:text-amber-200 underline-offset-4 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            title="Set custom countdown target date and time"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit Target</span>
          </button>
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

      {showPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111116] border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-left">
            <button
              onClick={() => setShowPickerModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-lg font-serif font-bold text-white uppercase tracking-wider">
                  Set Target Date &amp; Time
                </h3>
              </div>
              <p className="text-xs text-neutral-400">
                Choose the countdown target for the homepage event stage.
              </p>
            </div>

            <form onSubmit={handleSaveTargetDateTime} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Target Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={pickerDateTime}
                  onChange={(e) => setPickerDateTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-amber-300 font-mono text-sm focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={pickerTitle}
                  onChange={(e) => setPickerTitle(e.target.value)}
                  placeholder="e.g. THRILLER 45TH ANNIVERSARY"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Event Description
                </label>
                <textarea
                  rows={2}
                  value={pickerDesc}
                  onChange={(e) => setPickerDesc(e.target.value)}
                  placeholder="e.g. Worldwide showcase and master release."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPickerModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
