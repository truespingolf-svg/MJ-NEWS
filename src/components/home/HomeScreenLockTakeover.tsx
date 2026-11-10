import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, KeyRound, Sparkles, AlertCircle, Unlock } from 'lucide-react';
import { HomeLockConfig, subscribeHomeLockConfig } from '../../services/firestoreStorage';

export const HomeScreenLockTakeover: React.FC = () => {
  const [lockConfig, setLockConfig] = useState<HomeLockConfig | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [staffBypassed, setStaffBypassed] = useState<boolean>(false);
  const [showPinInput, setShowPinInput] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  useEffect(() => {
    const unsub = subscribeHomeLockConfig((cfg) => {
      setLockConfig(cfg);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!lockConfig || !lockConfig.isLocked || !lockConfig.endTime) {
      setTimeLeftMs(0);
      return;
    }

    const calcTime = () => {
      const remaining = lockConfig.endTime - Date.now();
      if (remaining <= 0) {
        setTimeLeftMs(0);
      } else {
        setTimeLeftMs(remaining);
      }
    };

    calcTime();
    const timer = setInterval(calcTime, 1000);
    return () => clearInterval(timer);
  }, [lockConfig]);

  if (!lockConfig || !lockConfig.isLocked || timeLeftMs <= 0 || staffBypassed) {
    return null;
  }

  // Format time remaining
  const totalSeconds = Math.max(0, Math.floor(timeLeftMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = hours > 0
    ? `${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;

  const initialDurationMs = (lockConfig.durationMinutes || 5) * 60 * 1000;
  const progressPercent = Math.min(100, Math.max(0, (timeLeftMs / initialDurationMs) * 100));

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '2526') {
      setStaffBypassed(true);
      setShowPinInput(false);
      setPinError('');
    } else {
      setPinError('Invalid Password.');
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#07070d]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Lock Card */}
      <div className="relative max-w-2xl w-full bg-[#111118]/90 border-2 border-amber-500/40 rounded-3xl p-8 sm:p-12 shadow-[0_0_80px_rgba(245,158,11,0.15)] flex flex-col items-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-widest uppercase">
          <ShieldAlert className="w-4 h-4 animate-pulse" />
          <span>MJJ RECORDS • SYSTEM LOCK TAKEOVER</span>
        </div>

        {/* Lock Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
          <Lock className="w-10 h-10 animate-bounce" />
        </div>

        {/* Custom Lock Message */}
        <div className="space-y-2 max-w-lg">
          <h2 className="font-serif font-black text-2xl sm:text-3xl text-white tracking-tight">
            HOME PORTAL TEMPORARILY LOCKED
          </h2>
          <div className="p-4 bg-neutral-950/80 border border-amber-500/20 rounded-2xl">
            <p className="text-amber-200/90 font-mono text-sm leading-relaxed">
              "{lockConfig.message || 'The home portal is currently locked for maintenance and updates.'}"
            </p>
          </div>
        </div>

        {/* Countdown Digital Display */}
        <div className="w-full space-y-3 pt-2">
          <div className="text-xs font-mono uppercase tracking-wider text-neutral-400">
            TIME REMAINING UNTIL UNLOCK
          </div>
          <div className="font-mono font-black text-4xl sm:text-6xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            {formattedTime}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Bottom Note */}
        <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>This overlay automatically unlocks when the timer reaches 00:00.</span>
        </p>

        {/* Staff Bypass Option */}
        <div className="pt-2">
          {!showPinInput ? (
            <button
              onClick={() => setShowPinInput(true)}
              className="text-xs font-mono text-neutral-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unlock with Password</span>
            </button>
          ) : (
            <form onSubmit={handleVerifyPasscode} className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter password"
                  className="w-36 bg-neutral-950 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-center font-mono text-amber-300 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Bypass</span>
                </button>
              </div>
              {pinError && (
                <p className="text-[11px] text-red-400 font-mono flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{pinError}</span>
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
