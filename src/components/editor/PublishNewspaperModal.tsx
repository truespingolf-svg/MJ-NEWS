import React, { useState, useEffect } from 'react';
import { NewspaperProject } from '../../types/newspaper.ts';
import { Radio, Clock, CheckCircle2, AlertCircle, Sparkles, Send, Trash2, Calendar, ShieldCheck, BookOpen, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  subscribePublishedNewspaper,
  submitModerationFirestore,
  publishDirectFirestore,
  unpublishFirestore,
} from '../../services/firestoreStorage.ts';

interface PublishNewspaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: NewspaperProject;
  onOpenFlipbookPreview: () => void;
}

export const PublishNewspaperModal: React.FC<PublishNewspaperModalProps> = ({
  isOpen,
  onClose,
  project,
  onOpenFlipbookPreview,
}) => {
  const [durationHours, setDurationHours] = useState<number>(24);
  const [customHours, setCustomHours] = useState<string>('24');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [currentPublished, setCurrentPublished] = useState<any | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setStatusMsg({ type: null, text: '' });
    if (!customHours || customHours.trim() === '') {
      setCustomHours('24');
      setDurationHours(24);
    }

    // Subscribe to live Firestore state directly
    const unsubscribe = subscribePublishedNewspaper((pub) => {
      setCurrentPublished(pub);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const isCurrentProjectPublished =
    currentPublished &&
    currentPublished.isActive &&
    (currentPublished.projectId === project.id || currentPublished.id === project.id);

  // Calculate parsed hours and projected expiry
  const parsedHours = parseFloat(customHours);
  const effectiveHours = !isNaN(parsedHours) && parsedHours > 0 ? parsedHours : durationHours || 24;
  const effectiveMinutes = Math.max(1, Math.round(effectiveHours * 60));
  const projectedExpiry = new Date(Date.now() + effectiveMinutes * 60 * 1000);

  // 1. Submit for Moderation
  const handleSendToModeration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsPublishing(true);
    setStatusMsg({ type: null, text: '' });

    try {
      const ok = await submitModerationFirestore(project, effectiveMinutes);
      // Also notify server endpoint as background helper if reachable
      fetch('/api/staff/submit-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, durationMinutes: effectiveMinutes }),
      }).catch(() => {});

      if (ok) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#EAB308', '#F59E0B', '#10B981', '#FFFFFF'],
          });
        } catch {
          // ignore
        }

        setStatusMsg({
          type: 'success',
          text: `"${project.title}" was submitted to Moderation! Authorisation Centre can review and publish it live instantly.`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: 'Failed to submit broadsheet to Firestore. Please check connection.',
        });
      }
    } catch (err) {
      console.error('Moderation submit error:', err);
      setStatusMsg({
        type: 'error',
        text: 'Error submitting broadsheet. Please check connection.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // 2. Direct Instant Publish (Staff override)
  const handleDirectPublish = async () => {
    setIsPublishing(true);
    setStatusMsg({ type: null, text: '' });

    try {
      const ok = await publishDirectFirestore(project, effectiveMinutes);
      // Also notify server endpoint if reachable
      fetch('/api/staff/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, durationMinutes: effectiveMinutes }),
      }).catch(() => {});

      if (ok) {
        try {
          confetti({
            particleCount: 110,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#EAB308', '#F59E0B', '#10B981', '#FFFFFF'],
          });
        } catch {
          // ignore
        }

        setStatusMsg({
          type: 'success',
          text: `"${project.title}" is now LIVE on air for ${effectiveHours} hours across all devices!`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: 'Failed to publish broadsheet. Please check connection.',
        });
      }
    } catch (err) {
      console.error('Direct publish error:', err);
      setStatusMsg({
        type: 'error',
        text: 'Error publishing broadsheet.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsPublishing(true);
    try {
      await unpublishFirestore();
      fetch('/api/staff/unpublish', { method: 'POST' }).catch(() => {});
      setStatusMsg({
        type: 'success',
        text: 'Broadsheet unpublished and moved to the archival library.',
      });
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to unpublish newspaper.' });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none animate-fade-in">
      <div className="bg-[#111118] border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white text-xl p-1 cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-13 h-13 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Radio className="w-7 h-7 stroke-[2.2] animate-pulse" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold tracking-widest uppercase mb-1">
              <span>FIREBASE REAL-TIME PUBLISHING</span>
            </div>
            <h3 className="text-2xl font-serif font-black text-white tracking-tight">
              Publish as Current Paper
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Broadcast "{project.title}" live with flipbook physics, or send to the moderation queue in Authorisation Centre.
            </p>
          </div>
        </div>

        {/* Live Status Banner */}
        {currentPublished && currentPublished.isActive && (
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Current Live Publication:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE ON AIR
              </span>
            </div>
            <div className="font-serif font-bold text-sm text-amber-300 truncate">
              {currentPublished.name || currentPublished.projectTitle}
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center justify-between font-mono">
              <span>
                Expires: {new Date(currentPublished.expiresAt).toLocaleTimeString()} ({new Date(currentPublished.expiresAt).toLocaleDateString()})
              </span>
              {isCurrentProjectPublished && (
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={isPublishing}
                  className="text-rose-400 hover:text-rose-300 underline font-semibold cursor-pointer"
                >
                  Unpublish
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form Controls */}
        <form onSubmit={handleSendToModeration} noValidate className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Broadcast Duration
              </label>
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                {effectiveHours} {effectiveHours === 1 ? 'Hour' : 'Hours'}
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[1, 6, 24, 48].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setDurationHours(h);
                    setCustomHours(String(h));
                  }}
                  className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${
                    String(effectiveHours) === String(h)
                      ? 'bg-amber-400 text-black border-amber-400 shadow-md'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                  }`}
                >
                  {h} {h === 1 ? 'Hour' : 'Hours'}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={customHours}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                  setCustomHours(cleaned);
                }}
                placeholder="24"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-500">
                HOURS
              </span>
            </div>

            <p className="text-[11px] text-neutral-400 mt-2 font-mono flex items-center justify-between">
              <span>Will remain live until:</span>
              <span className="text-amber-300 font-semibold">
                {projectedExpiry.toLocaleTimeString()} ({projectedExpiry.toLocaleDateString()})
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            {/* Primary Action 1: Send to Moderation */}
            <button
              type="submit"
              disabled={isPublishing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isPublishing ? (
                <span>Submitting to Moderation Queue...</span>
              ) : (
                <>
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>SEND TO MODERATION FOR APPROVAL</span>
                </>
              )}
            </button>

            {/* Primary Action 2: Direct Publish (Instant Live) */}
            <button
              type="button"
              onClick={handleDirectPublish}
              disabled={isPublishing}
              className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>PUBLISH DIRECTLY NOW (INSTANT LIVE)</span>
            </button>

            {/* 3D Flipbook Preview Link */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFlipbookPreview();
              }}
              className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-800 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>PREVIEW IN 3D FLIPBOOK MODE</span>
            </button>
          </div>

          {/* Status Message */}
          {statusMsg.text && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </form>

        <div className="text-center text-[10px] text-neutral-500 font-mono">
          <span>Synced globally via Firebase Firestore across all phones, tablets &amp; computers.</span>
        </div>
      </div>
    </div>
  );
};
