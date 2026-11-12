import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Sparkles, Radio, ArrowRight, ShieldCheck, Edit3, Check, X, Save } from 'lucide-react';
import {
  EventCountdownConfig,
  subscribeEventCountdownConfig,
  setEventCountdownConfigInFirestore,
} from '../../services/firestoreStorage';

interface UpcomingEventCountdownProps {
  onActionClick?: () => void;
}

export const UpcomingEventCountdown: React.FC<UpcomingEventCountdownProps> = ({ onActionClick }) => {
  const [config, setConfig] = useState<EventCountdownConfig | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isLive: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false });

  // Custom Target Date & Time picker state
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
  const overlayDarkness = typeof config.overlayDarkness === 'number' ? config.overlayDarkness : 65;

  return (
    <section className="relative w-full rounded-3xl overflow-hidden border border-red-950/60 shadow-[0_0_80px_rgba(0,0,0,0.85)] my-12 group select-none">
      {/* Background Image with configurable blur */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
        style={{
          backgroundImage: `url("${bgImage}")`,
          filter: `blur(${blurAmount}px)`,
        }}
      />

      {/* Dark overlay with configurable opacity & deep burgundy/blood red gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-red-950/50"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${overlayDarkness / 100})`,
        }}
      />

      {/* Ambient Lighting Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-16 sm:py-20 flex flex-col items-center text-center space-y-8">
        {/* Status Badge & Quick Target Date/Time Setting Button */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-mono font-bold tracking-widest uppercase shadow-lg backdrop-blur-md">
            {timeLeft.isLive ? (
              <>
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="text-red-400">EVENT BROADCASTING LIVE NOW</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-red-400 animate-spin-slow" />
                <span>OFFICIAL MJJ RECORDS WORLD EVENT COUNTDOWN</span>
              </>
            )}
          </div>

          <button
            onClick={() => setShowPickerModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105"
            title="Set custom countdown target date and time"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Set Target Date &amp; Time</span>
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-3 max-w-3xl">
          <h2 className="font-serif font-black tracking-tight text-3xl sm:text-5xl md:text-6xl text-white uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            {config.eventTitle}
          </h2>
          <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed max-w-2xl mx-auto">
            {config.eventDescription}
          </p>
        </div>

        {/* Live Countdown Display */}
        {timeLeft.isLive ? (
          <div className="p-6 bg-red-950/80 border border-red-500/60 rounded-2xl max-w-xl text-center space-y-2 backdrop-blur-md shadow-2xl animate-pulse">
            <h3 className="font-serif font-bold text-xl text-white">
              {config.eventLiveMessage || 'THE SHOW HAS BEGUN'}
            </h3>
            <p className="text-xs text-red-200 font-mono">
              Tune into the official live stream on the Streaming tab.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 sm:gap-6 w-full max-w-2xl">
            {[
              { label: 'DAYS', value: timeLeft.days },
              { label: 'HOURS', value: timeLeft.hours },
              { label: 'MINUTES', value: timeLeft.minutes },
              { label: 'SECONDS', value: timeLeft.seconds },
            ].map((unit) => (
              <div
                key={unit.label}
                className="bg-[#0e0709]/85 backdrop-blur-xl border border-red-500/30 rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative overflow-hidden group/tile hover:border-red-500/70 transition-all"
              >
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-60" />
                <span className="font-mono font-black text-2xl sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-100 to-red-400 tabular-nums drop-shadow-md">
                  {String(unit.value).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-mono tracking-widest text-neutral-400 mt-1 uppercase font-semibold">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Date Time info */}
        <div className="pt-2 flex justify-center text-xs font-mono">
          <div className="flex items-center gap-2 text-neutral-300 bg-neutral-950/70 border border-neutral-800 px-5 py-2.5 rounded-xl backdrop-blur-md shadow-lg">
            <Calendar className="w-4 h-4 text-red-400" />
            <span>
              WORLDWIDE EVENT DATE: {config.eventDate || 'TBA'} • {config.eventTime || '20:00'} EST
            </span>
          </div>
        </div>
      </div>

      {/* Target Date & Time Picker Modal */}
      {showPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#120a0d] border border-red-600/50 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-left">
            <button
              onClick={() => setShowPickerModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-lg p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-serif font-black text-white uppercase tracking-wider">
                  Set Target Date &amp; Time
                </h3>
              </div>
              <p className="text-xs text-neutral-400">
                Choose the target countdown date and time for the featured homepage event.
              </p>
            </div>

            <form onSubmit={handleSaveTargetDateTime} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Target Date &amp; Time (Local/EST) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={pickerDateTime}
                  onChange={(e) => setPickerDateTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-red-900/80 text-amber-300 font-mono text-sm focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Event Headline / Title
                </label>
                <input
                  type="text"
                  value={pickerTitle}
                  onChange={(e) => setPickerTitle(e.target.value)}
                  placeholder="e.g. THRILLER 45TH ANNIVERSARY • GLOBAL PRESS PREMIERE"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-amber-400"
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
                  placeholder="e.g. Worldwide holographic showcase and master release."
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save & Update Live'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
