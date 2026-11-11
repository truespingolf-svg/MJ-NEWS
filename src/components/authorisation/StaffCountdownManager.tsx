import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Calendar,
  MapPin,
  ExternalLink,
  Upload,
} from 'lucide-react';
import {
  EventCountdownConfig,
  subscribeEventCountdownConfig,
  setEventCountdownConfigInFirestore,
  addStaffAuditLogFirestore,
} from '../../services/firestoreStorage.ts';

export const StaffCountdownManager: React.FC = () => {
  const [config, setConfig] = useState<EventCountdownConfig | null>(null);

  // Form fields matching EventCountdownConfig
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [targetDateString, setTargetDateString] = useState('');
  const [actionButtonText, setActionButtonText] = useState('Reserve VIP Pass');
  const [actionButtonLink, setActionButtonLink] = useState('#challenges');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [backdropFileName, setBackdropFileName] = useState('');
  const [overlayDarkness, setOverlayDarkness] = useState<number>(65);
  const [imageBlur, setImageBlur] = useState<number>(2);
  const [countdownStyle, setCountdownStyle] = useState<'cinematic-red' | 'metallic-silver' | 'royal-gold'>('cinematic-red');
  const [countdownVisible, setCountdownVisible] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: '',
  });

  useEffect(() => {
    const unsub = subscribeEventCountdownConfig((c) => {
      if (c) {
        setConfig(c);
        setEventTitle(c.eventTitle || '');
        setEventDescription(c.eventDescription || '');
        setActionButtonText(c.actionButtonText || 'Reserve VIP Pass');
        setActionButtonLink(c.actionButtonLink || '#challenges');
        setBackgroundImage(c.backgroundImage || '/src/assets/images/event_countdown_backdrop_1794407119370.jpg');
        setOverlayDarkness(c.overlayDarkness ?? 65);
        setImageBlur(c.imageBlur ?? 2);
        setCountdownStyle(c.countdownStyle || 'cinematic-red');
        setCountdownVisible(c.countdownVisible !== false);

        if (c.targetTimestamp) {
          const d = new Date(c.targetTimestamp);
          const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setTargetDateString(iso);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg({ type: null, text: '' });

    try {
      const targetTs = targetDateString ? new Date(targetDateString).getTime() : Date.now() + 86400000 * 7;
      const datePart = targetDateString ? targetDateString.split('T')[0] : '2026-11-20';
      const timePart = targetDateString ? targetDateString.split('T')[1] : '20:00';

      await setEventCountdownConfigInFirestore({
        eventTitle: eventTitle.trim() || 'THRILLER 45TH ANNIVERSARY • GLOBAL PRESS PREMIERE',
        eventDescription: eventDescription.trim() || 'Worldwide holographic showcase and multi-track master release across major capitals.',
        eventDate: datePart,
        eventTime: timePart,
        targetTimestamp: targetTs,
        countdownVisible,
        imageBlur: Number(imageBlur) || 0,
        overlayDarkness: Number(overlayDarkness) || 65,
        countdownStyle,
        actionButtonText: actionButtonText.trim() || 'Reserve VIP Pass',
        actionButtonLink: actionButtonLink.trim() || '#challenges',
        backgroundImage: backgroundImage.trim() || '/src/assets/images/event_countdown_backdrop_1794407119370.jpg',
      });

      await addStaffAuditLogFirestore({
        staffName: 'Staff Executive',
        staffRole: 'ADMINISTRATOR',
        actionType: 'UPDATE_COUNTDOWN',
        targetEntityId: 'system/eventCountdown',
        targetEntityLabel: eventTitle.trim() || 'Event Countdown',
        details: `Updated countdown to "${eventTitle}" targeting ${datePart} ${timePart}`,
      });

      setStatusMsg({ type: 'success', text: 'Upcoming Event Countdown & Landscape Backdrop updated live!' });
    } catch (err: any) {
      console.error('Failed to update countdown:', err);
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to update countdown.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-neutral-100 font-sans p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <Clock className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-serif font-black text-white uppercase tracking-wider">
              Upcoming Event Countdown &amp; Landscape Backdrop
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Configure the large featured event section on the home page. Staff can upload custom landscape banners, set countdown timestamps, and tweak overlay effects.
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

      {/* Editor Form */}
      <div className="bg-[#12121a] border border-[#232332] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">
                Event Headline / Title <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g. THRILLER 45TH ANNIVERSARY • GLOBAL PRESS PREMIERE"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400 font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">
                Target Date &amp; Time (Countdown Timer) <span className="text-amber-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={targetDateString}
                onChange={(e) => setTargetDateString(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-amber-300 text-xs focus:outline-none focus:border-amber-400 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-300 mb-1">
              Event Description / Teaser
            </label>
            <input
              type="text"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="e.g. Worldwide holographic showcase and multi-track master release across major capitals."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">Action Button Text</label>
              <input
                type="text"
                value={actionButtonText}
                onChange={(e) => setActionButtonText(e.target.value)}
                placeholder="Reserve VIP Pass"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">Action Button Link</label>
              <input
                type="text"
                value={actionButtonLink}
                onChange={(e) => setActionButtonLink(e.target.value)}
                placeholder="#challenges or URL"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">Timer Aesthetic</label>
              <select
                value={countdownStyle}
                onChange={(e) => setCountdownStyle(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-amber-300 text-xs focus:outline-none focus:border-amber-400 font-mono"
              >
                <option value="cinematic-red">🩸 Cinematic Red &amp; Burgundy</option>
                <option value="metallic-silver">🪙 Metallic Silver</option>
                <option value="royal-gold">👑 Royal Gold</option>
              </select>
            </div>
          </div>

          {/* Background Image & Visual Controls */}
          <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
            <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Landscape Background Image &amp; Overlay Settings</span>
            </h4>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-neutral-300">
                Landscape Backdrop Image <span className="text-amber-400 font-sans">(Upload local image from device)</span>
              </label>

              <div className="p-4 rounded-xl bg-neutral-900 border border-dashed border-neutral-700 hover:border-amber-400 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {backgroundImage ? (
                      <div className="w-14 h-10 rounded-lg overflow-hidden border border-neutral-700 shrink-0 bg-black">
                        <img src={backgroundImage} alt="Backdrop Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-10 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 text-neutral-500">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-bold text-white">
                        {backdropFileName ? backdropFileName : backgroundImage.startsWith('data:') ? 'Local Landscape Image Loaded' : 'Select Local Backdrop Image'}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Select high-res landscape image (JPG, PNG, WEBP) directly from your computer/device.
                      </p>
                    </div>
                  </div>

                  <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Upload Device Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBackdropFileName(file.name);
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setBackgroundImage(ev.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <input
                  type="text"
                  value={backgroundImage}
                  onChange={(e) => setBackgroundImage(e.target.value)}
                  placeholder="Local image data or backdrop URL..."
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <div className="flex justify-between items-center text-xs font-mono text-neutral-300 mb-1">
                  <span>Dark Overlay Darkness:</span>
                  <span className="text-amber-400 font-bold">{overlayDarkness}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  step="5"
                  value={overlayDarkness}
                  onChange={(e) => setOverlayDarkness(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-mono text-neutral-300 mb-1">
                  <span>Backdrop Blur Amount:</span>
                  <span className="text-amber-400 font-bold">{imageBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={imageBlur}
                  onChange={(e) => setImageBlur(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Backdrop Preview */}
            {backgroundImage && (
              <div className="relative aspect-[21/9] w-full rounded-xl overflow-hidden border border-neutral-800 mt-2">
                <img
                  src={backgroundImage}
                  alt="Backdrop Preview"
                  className="w-full h-full object-cover"
                  style={{ filter: `blur(${imageBlur}px)` }}
                />
                <div
                  className="absolute inset-0 bg-black"
                  style={{ opacity: overlayDarkness / 100 }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                    LIVE PREVIEW OVERLAY
                  </span>
                  <h5 className="text-lg font-serif font-bold text-white mt-1">
                    {eventTitle || 'Event Headline'}
                  </h5>
                  <p className="text-xs text-neutral-300 max-w-md">{eventDescription}</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Updating Event...' : 'Publish Event Live to Home Screen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
