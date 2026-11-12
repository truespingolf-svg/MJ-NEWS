import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, ArrowRight, ShieldCheck, Radio, Cpu } from 'lucide-react';
import { subscribePasscodeSettings } from '../../services/firestoreStorage.ts';

interface StaffPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock?: (isTrial?: boolean) => void;
  onSuccess?: (isTrial?: boolean) => void;
}

export const StaffPasscodeModal: React.FC<StaffPasscodeModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
  onSuccess,
}) => {
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [fullCode, setFullCode] = useState('2526');
  const [trialCode, setTrialCode] = useState('2520');

  useEffect(() => {
    const unsub = subscribePasscodeSettings((settings) => {
      if (settings) {
        setFullCode(settings.fullPasscode || '2526');
        setTrialCode(settings.trialPasscode || '2520');
      }
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const triggerSuccess = (isTrial: boolean) => {
    if (onSuccess) onSuccess(isTrial);
    if (onUnlock) onUnlock(isTrial);
  };

  const validateCode = (codeToTest: string) => {
    const clean = codeToTest.trim();
    if (clean === fullCode && clean !== '') {
      setErrorMsg('');
      triggerSuccess(false);
      setPasscode('');
    } else {
      setErrorMsg('Access Denied. Invalid Passcode.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPasscode('');
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passcode) return;
    validateCode(passcode);
  };

  const handleKeypadPress = (digit: string) => {
    if (passcode.length < 6) {
      const next = passcode + digit;
      setPasscode(next);
      if (next.length === 4) {
        validateCode(next);
      }
    }
  };

  const handleClear = () => {
    setPasscode('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 select-none font-sans animate-fade-in">
      {/* Glow Backdrop */}
      <div className="absolute w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />

      <div
        className={`w-full max-w-md bg-[#0d0d14]/95 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-8 sm:p-9 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_25px_rgba(245,158,11,0.2)] relative overflow-hidden transition-transform duration-200 ${
          shake ? 'translate-x-3 text-red-400 border-red-500/60' : ''
        }`}
      >
        {/* Animated Laser Scanline */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-40 animate-scanline pointer-events-none" />

        {/* Top Metallic Header */}
        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-600/30 rounded-3xl blur-md animate-pulse-glow" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1b1b26] to-[#101018] border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-xl relative">
              <Lock className="w-8 h-8 stroke-[2.2] drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center text-[10px] font-bold shadow-md">
                <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
              </div>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold tracking-widest uppercase mb-2">
              <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>STAFF STUDIO VAULT</span>
            </div>
            <h2 className="font-serif font-black text-2xl sm:text-3xl text-white tracking-tight">
              Staff Studio Access
            </h2>
            <p className="text-xs text-neutral-400 font-sans mt-1.5 max-w-xs mx-auto leading-relaxed">
              Enter your 4-digit staff passcode to unlock executive editing privileges or trial inspection mode.
            </p>
          </div>
        </div>

        {/* Passcode Entry Form */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-6 relative z-10">
          <div className="flex justify-center items-center gap-3 py-2 bg-[#14141f]/70 rounded-2xl border border-[#272736] max-w-[200px] mx-auto">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = passcode.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    isFilled
                      ? 'bg-amber-400 border border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-125'
                      : 'border-2 border-neutral-700 bg-neutral-900/80'
                  }`}
                />
              );
            })}
          </div>

          <input
            type="password"
            maxLength={8}
            value={passcode}
            onChange={(e) => {
              const val = e.target.value.slice(0, 8);
              setPasscode(val);
              if (val.length === 4) {
                validateCode(val);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e);
              }
            }}
            placeholder="Enter 4-digit passcode"
            className="w-full text-center bg-[#151520] border border-[#2a2a3c] rounded-xl py-3 px-4 text-base font-mono tracking-[0.3em] text-amber-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 shadow-inner placeholder:tracking-normal placeholder:text-neutral-600 placeholder:text-xs"
            autoFocus
          />

          {errorMsg && (
            <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className="py-3.5 bg-gradient-to-b from-[#1c1c28] to-[#14141e] hover:from-[#252536] hover:to-[#1a1a28] active:scale-95 rounded-2xl font-mono text-lg font-bold text-neutral-100 border border-[#2d2d40] shadow-md hover:border-amber-500/40 hover:text-amber-300 transition-all"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-2xl text-xs font-semibold uppercase tracking-wider border border-neutral-800 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-3.5 bg-gradient-to-b from-[#1c1c28] to-[#14141e] hover:from-[#252536] hover:to-[#1a1a28] active:scale-95 rounded-2xl font-mono text-lg font-bold text-neutral-100 border border-[#2d2d40] shadow-md hover:border-amber-500/40 hover:text-amber-300 transition-all"
            >
              0
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-2xl text-xs font-bold transition-colors border border-neutral-800"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-7 pt-4 border-t border-[#1f1f2e] flex items-center justify-between text-[10px] text-neutral-500 font-mono">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-amber-500/70" />
            <span>256-BIT ENCRYPTED</span>
          </span>
          <span>STAFF ACCESS</span>
        </div>
      </div>
    </div>
  );
};

