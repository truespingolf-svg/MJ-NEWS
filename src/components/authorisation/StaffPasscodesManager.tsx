import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, Save, Lock } from 'lucide-react';
import {
  PasscodeSettings,
  subscribePasscodeSettings,
  setPasscodeSettingsFirestore,
  addStaffAuditLogFirestore,
} from '../../services/firestoreStorage.ts';

export const StaffPasscodesManager: React.FC = () => {
  const [fullPasscode, setFullPasscode] = useState('2526');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: '',
  });

  useEffect(() => {
    const unsub = subscribePasscodeSettings((settings) => {
      if (settings) {
        setFullPasscode(settings.fullPasscode || '2526');
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullPasscode.trim()) {
      setStatusMsg({ type: 'error', text: 'Passcode cannot be empty.' });
      return;
    }

    setIsSaving(true);
    setStatusMsg({ type: null, text: '' });

    try {
      await setPasscodeSettingsFirestore({
        fullPasscode: fullPasscode.trim(),
      });

      await addStaffAuditLogFirestore({
        staffName: 'Staff Executive',
        staffRole: 'ADMINISTRATOR',
        actionType: 'UPDATE_PASSCODES',
        targetEntityId: 'system/passcodeSettings',
        targetEntityLabel: 'Staff Access Passcode',
        details: 'Updated staff executive passcode',
      });

      setStatusMsg({ type: 'success', text: 'Staff access passcode updated successfully across all devices!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to update passcode.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-neutral-100 font-sans p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <KeyRound className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-serif font-black text-white uppercase tracking-wider">
              Passcode Security &amp; Access Codes
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Configure secret passcode for Staff Studio access. Changes update globally in real time.
          </p>
        </div>
      </div>

      {statusMsg.text && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="bg-[#12121a] border border-[#232332] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl max-w-2xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-neutral-300 mb-1.5 uppercase tracking-wider">
              Staff Studio Passcode (Executive Access &amp; Management)
            </label>
            <input
              type="text"
              value={fullPasscode}
              onChange={(e) => setFullPasscode(e.target.value)}
              placeholder="e.g. 2526"
              className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700 text-amber-300 font-mono text-base tracking-widest focus:outline-none focus:border-amber-400"
              required
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Required for staff studio actions, publishing, roster management, and passcode editing.
            </p>
          </div>

          <div className="pt-4 border-t border-neutral-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Updating Passcode...' : 'Save Passcode Setting'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
