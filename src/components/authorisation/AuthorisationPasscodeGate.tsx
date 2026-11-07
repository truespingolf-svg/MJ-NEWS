import React, { useState } from 'react';
import { ShieldAlert, Lock, KeyRound, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthorisationPasscodeGateProps {
  onUnlock: () => void;
}

export const AuthorisationPasscodeGate: React.FC<AuthorisationPasscodeGateProps> = ({
  onUnlock,
}) => {
  const [passcode, setPasscode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passcode.trim() === '2513') {
      setErrorMessage('');
      onUnlock();
    } else {
      setErrorMessage('Access Denied. Invalid Authorization Passcode.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPasscode('');
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (passcode.length < 4) {
      const next = passcode + digit;
      setPasscode(next);
      if (next.length === 4) {
        if (next === '2513') {
          setTimeout(() => onUnlock(), 150);
        } else {
          setTimeout(() => {
            setErrorMessage('Access Denied. Invalid Authorization Passcode.');
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setPasscode('');
          }, 200);
        }
      }
    }
  };

  const handleClear = () => {
    setPasscode('');
    setErrorMessage('');
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#070709] p-6 text-neutral-100 select-none">
      <div
        className={`w-full max-w-md bg-[#111116] border border-[#2b2b36] rounded-2xl p-8 shadow-2xl relative overflow-hidden transition-transform ${
          shake ? 'translate-x-2' : ''
        }`}
      >
        {/* Top Security Banner */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Lock className="w-7 h-7 stroke-[2]" />
          </div>

          <div>
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-amber-400 block mb-1">
              RESTRICTED EXECUTIVE SECTOR
            </span>
            <h2 className="font-serif font-bold text-2xl text-white tracking-tight">
              Authorisation Centre
            </h2>
            <p className="text-xs text-neutral-400 font-sans mt-1 max-w-sm leading-relaxed">
              Personnel documentation, legal governance instruments, and sensitive employment records are restricted under enterprise protocol.
            </p>
          </div>
        </div>

        {/* Passcode Entry Dots */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="flex justify-center items-center gap-3">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = passcode.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    isFilled
                      ? 'bg-amber-400 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] scale-110'
                      : 'border-neutral-700 bg-neutral-900'
                  }`}
                />
              );
            })}
          </div>

          {/* Hidden text input for keyboard users */}
          <input
            type="password"
            maxLength={4}
            value={passcode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPasscode(val);
              if (val.length === 4) {
                if (val === '2513') {
                  setTimeout(() => onUnlock(), 100);
                } else {
                  setTimeout(() => {
                    setErrorMessage('Access Denied. Invalid Authorization Passcode.');
                    setShake(true);
                    setTimeout(() => setShake(false), 500);
                    setPasscode('');
                  }, 200);
                }
              }
            }}
            placeholder="Enter 4-digit code"
            className="w-full text-center bg-[#171720] border border-[#2e2e3e] rounded-lg py-2.5 px-4 text-base font-mono tracking-widest text-white focus:outline-none focus:border-amber-400"
            autoFocus
          />

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Numeric Keypad for fast touch & mouse interaction */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className="py-3 bg-[#191922] hover:bg-[#232330] active:bg-amber-400 active:text-black rounded-xl font-mono text-base font-semibold text-neutral-200 transition-colors border border-[#2b2b38]"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 bg-[#191922] hover:bg-[#232330] rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors border border-[#2b2b38]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-3 bg-[#191922] hover:bg-[#232330] active:bg-amber-400 active:text-black rounded-xl font-mono text-base font-semibold text-neutral-200 transition-colors border border-[#2b2b38]"
            >
              0
            </button>
            <button
              type="submit"
              className="py-3 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-xs font-bold transition-colors flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>

        {/* Footer Security Notice */}
        <div className="mt-6 pt-4 border-t border-[#22222c] text-center text-[10px] text-neutral-500 font-sans">
          <span>Enterprise Security Level IV • Authorized Personnel Only</span>
        </div>
      </div>
    </div>
  );
};
