import React, { useRef, useState } from 'react';
import {
  TicketProject,
  TicketDocumentType,
  TicketStyleTheme,
  TicketOrientation,
} from '../../types/ticket.ts';
import {
  Sparkles,
  QrCode,
  Barcode,
  Layers,
  Palette,
  Type,
  Calendar,
  MapPin,
  Upload,
  RotateCcw,
  RefreshCw,
  FileText,
  Sliders,
} from 'lucide-react';
import { enhanceTextLocally } from '../../utils/textAssistant.ts';

interface TicketInspectorProps {
  ticket: TicketProject;
  onUpdateTicket: (updates: Partial<TicketProject>) => void;
  onApplyBranding: () => void;
}

export const TicketInspector: React.FC<TicketInspectorProps> = ({
  ticket,
  onUpdateTicket,
  onApplyBranding,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'security' | 'back'>('content');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const customQrInputRef = useRef<HTMLInputElement>(null);

  // Generate random ticket serial
  const handleRegenerateNumber = () => {
    const num = `NXP-${Math.floor(100000 + Math.random() * 900000)}`;
    onUpdateTicket({
      ticketNumber: num,
      qrPayload: `${num}|${ticket.guestName}|${ticket.ticketCategory}`,
    });
  };

  // Quick image upload handler
  const handleImageFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: 'logoUrl' | 'backgroundImageUrl' | 'customQrImageUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        onUpdateTicket({ [key]: dataUrl });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Smart text polish
  const handleSmartPolish = (field: 'eventTitle' | 'eventDescription') => {
    setIsEnhancing(true);
    const original = ticket[field] || '';
    const polished = enhanceTextLocally(original, 'make-exclusive');
    onUpdateTicket({ [field]: polished });
    setTimeout(() => setIsEnhancing(false), 300);
  };

  return (
    <aside
      aria-label="Ticket customization panel"
      className="w-84 bg-[#111114] border-l border-[#222228] flex flex-col h-full text-neutral-200 select-none shrink-0"
    >
      {/* Sub-Tabs: Content, Design, Security, Back */}
      <div className="grid grid-cols-4 p-2 bg-[#0c0c0e] border-b border-[#222228] text-[11px] gap-1 font-medium">
        <button
          onClick={() => setActiveTab('content')}
          className={`py-1.5 rounded transition-colors ${
            activeTab === 'content'
              ? 'bg-amber-400 text-black font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('design')}
          className={`py-1.5 rounded transition-colors ${
            activeTab === 'design'
              ? 'bg-amber-400 text-black font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          Design
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-1.5 rounded transition-colors ${
            activeTab === 'security'
              ? 'bg-amber-400 text-black font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          QR &amp; Pass
        </button>
        <button
          onClick={() => setActiveTab('back')}
          className={`py-1.5 rounded transition-colors ${
            activeTab === 'back'
              ? 'bg-amber-400 text-black font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          Reverse
        </button>
      </div>

      {/* Front / Back View Toggle Bar */}
      <div className="px-4 py-2 bg-[#16161c] border-b border-[#222228] flex items-center justify-between text-xs">
        <span className="text-[11px] font-semibold text-neutral-400">Current View:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateTicket({ showBackSide: false })}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              !ticket.showBackSide
                ? 'bg-amber-400 text-black font-bold'
                : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            Front Ticket
          </button>
          <button
            onClick={() => onUpdateTicket({ showBackSide: true })}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              ticket.showBackSide
                ? 'bg-amber-400 text-black font-bold'
                : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            Back Reverse
          </button>
        </div>
      </div>

      {/* Main Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= TAB 1: DETAILS ================= */}
        {activeTab === 'content' && (
          <div className="space-y-3.5">
            {/* Event Title */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
                  Event Title
                </label>
                <button
                  onClick={() => handleSmartPolish('eventTitle')}
                  className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300"
                  title="Make title more exclusive"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Exclusive Polish</span>
                </button>
              </div>
              <input
                type="text"
                value={ticket.eventTitle}
                onChange={(e) => onUpdateTicket({ eventTitle: e.target.value })}
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Subtitle / Edition */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Event Subtitle / Edition
              </label>
              <input
                type="text"
                value={ticket.eventSubtitle || ''}
                onChange={(e) => onUpdateTicket({ eventSubtitle: e.target.value })}
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                placeholder="e.g. World Tour Gala Premiere"
              />
            </div>

            {/* Guest Name */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Guest / Attendee Name
              </label>
              <input
                type="text"
                value={ticket.guestName}
                onChange={(e) => onUpdateTicket({ guestName: e.target.value })}
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-2 text-xs font-semibold text-amber-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
                  Event Description
                </label>
                <button
                  onClick={() => handleSmartPolish('eventDescription')}
                  className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>VIP Tone</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={ticket.eventDescription}
                onChange={(e) => onUpdateTicket({ eventDescription: e.target.value })}
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Date
                </label>
                <input
                  type="text"
                  value={ticket.dateText}
                  onChange={(e) => onUpdateTicket({ dateText: e.target.value })}
                  className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Time
                </label>
                <input
                  type="text"
                  value={ticket.timeText}
                  onChange={(e) => onUpdateTicket({ timeText: e.target.value })}
                  className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Venue & Address */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Venue Name
              </label>
              <input
                type="text"
                value={ticket.venueName}
                onChange={(e) => onUpdateTicket({ venueName: e.target.value })}
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Address / City
              </label>
              <input
                type="text"
                value={ticket.venueAddress}
                onChange={(e) => onUpdateTicket({ venueAddress: e.target.value })}
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-1.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Category & Seat */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={ticket.ticketCategory}
                  onChange={(e) => onUpdateTicket({ ticketCategory: e.target.value })}
                  className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Seat / Table
                </label>
                <input
                  type="text"
                  value={ticket.seatNumber || ''}
                  onChange={(e) => onUpdateTicket({ seatNumber: e.target.value })}
                  className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  placeholder="Row AA • Seat 1"
                />
              </div>
            </div>

            {/* Access Level & Dress Code */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Access Level
                </label>
                <input
                  type="text"
                  value={ticket.accessLevel}
                  onChange={(e) => onUpdateTicket({ accessLevel: e.target.value })}
                  className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Dress Code
                </label>
                <input
                  type="text"
                  value={ticket.dressCode || ''}
                  onChange={(e) => onUpdateTicket({ dressCode: e.target.value })}
                  className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  placeholder="Black Tie Formal"
                />
              </div>
            </div>

            {/* Host Organization */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
                  Host Organization
                </label>
                <button
                  onClick={onApplyBranding}
                  className="text-[10px] text-amber-400 hover:text-amber-300"
                >
                  Apply Branding Kit
                </button>
              </div>
              <input
                type="text"
                value={ticket.hostOrganization}
                onChange={(e) => onUpdateTicket({ hostOrganization: e.target.value })}
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}

        {/* ================= TAB 2: DESIGN & STYLES ================= */}
        {activeTab === 'design' && (
          <div className="space-y-4">
            {/* Visual Style Theme Dropdown */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1.5">
                Design Theme Style (11 Styles)
              </label>
              <select
                value={ticket.theme}
                onChange={(e) =>
                  onUpdateTicket({ theme: e.target.value as TicketStyleTheme })
                }
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-2 text-xs text-amber-400 font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="luxury-gold">Luxury Gold (Black, Gold Foil, Sovereign)</option>
                <option value="modern-minimalist">Modern Minimalist (Clean Ivory &amp; Swiss Grid)</option>
                <option value="hollywood-premiere">Hollywood Premiere (Red Carpet, Dramatic)</option>
                <option value="royal-elegance">Royal Elegance (Imperial Navy &amp; Sapphire)</option>
                <option value="neon-futuristic">Neon &amp; Futuristic (Cyber Cyan &amp; Glow)</option>
                <option value="corporate-professional">Corporate Professional (Polished Slate)</option>
                <option value="concert-music">Concert &amp; Music (High-Decibel Stadium Orange)</option>
                <option value="classic-vintage">Classic Vintage (Letterpress &amp; Sepia)</option>
                <option value="black-tie">Black Tie (Monochrome Tuxedo Elegance)</option>
                <option value="exclusive-vip">Exclusive VIP (Carbon &amp; Holographic Gold)</option>
                <option value="creative-artistic">Creative &amp; Artistic (Avant-Garde Violet)</option>
              </select>
            </div>

            {/* Orientation */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1.5">
                Layout Orientation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateTicket({ orientation: 'landscape' })}
                  className={`py-2 text-xs rounded border transition-colors ${
                    ticket.orientation === 'landscape'
                      ? 'bg-amber-400 text-black font-bold border-amber-400'
                      : 'bg-[#16161a] text-neutral-400 border-[#2d2d34] hover:text-white'
                  }`}
                >
                  Landscape Broadsheet
                </button>
                <button
                  onClick={() => onUpdateTicket({ orientation: 'portrait' })}
                  className={`py-2 text-xs rounded border transition-colors ${
                    ticket.orientation === 'portrait'
                      ? 'bg-amber-400 text-black font-bold border-amber-400'
                      : 'bg-[#16161a] text-neutral-400 border-[#2d2d34] hover:text-white'
                  }`}
                >
                  Portrait Pass
                </button>
              </div>
            </div>

            {/* Typography */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1.5">
                Headline Typography
              </label>
              <select
                value={ticket.fontFamily}
                onChange={(e) =>
                  onUpdateTicket({ fontFamily: e.target.value as any })
                }
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="cinzel">Cinzel (Roman Regal / Sovereign)</option>
                <option value="playfair">Playfair Display (Classic Luxury)</option>
                <option value="bodoni">Bodoni Moda (High Contrast Editorial)</option>
                <option value="oswald">Oswald (Modern Bold Condensed)</option>
                <option value="source-serif">Source Serif (Clean Editorial)</option>
                <option value="courier">Courier Prime (Vintage Press Wire)</option>
                <option value="sans">Plus Jakarta Sans (Contemporary Clean)</option>
              </select>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Event / Organization Logo
              </label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageFile(e, 'logoUrl')}
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs bg-[#1e1e24] hover:bg-[#282832] border border-[#33333f] rounded transition-colors text-white"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload Logo File</span>
                </button>
                {ticket.logoUrl && (
                  <button
                    onClick={() => onUpdateTicket({ logoUrl: '' })}
                    className="p-2 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded"
                    title="Remove Logo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Custom Background Image */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Custom Background Texture / Photo
              </label>
              <input
                ref={bgImageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageFile(e, 'backgroundImageUrl')}
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => bgImageInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs bg-[#1e1e24] hover:bg-[#282832] border border-[#33333f] rounded transition-colors text-white"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload Background</span>
                </button>
                {ticket.backgroundImageUrl && (
                  <button
                    onClick={() => onUpdateTicket({ backgroundImageUrl: '' })}
                    className="p-2 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded"
                    title="Remove Background Image"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: SECURITY & QR ================= */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            {/* Serial Number */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
                  Unique Ticket Number
                </label>
                <button
                  onClick={handleRegenerateNumber}
                  className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate New</span>
                </button>
              </div>
              <input
                type="text"
                value={ticket.ticketNumber}
                onChange={(e) => onUpdateTicket({ ticketNumber: e.target.value })}
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* QR Code Payload */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                QR Code Encoded Payload
              </label>
              <textarea
                rows={2}
                value={ticket.qrPayload || ''}
                onChange={(e) => onUpdateTicket({ qrPayload: e.target.value })}
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-amber-400"
                placeholder="Serial number or validation URL..."
              />
            </div>

            {/* Custom QR Code Image Upload */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Custom QR Code Image (Upload PNG / SVG)
              </label>
              <input
                ref={customQrInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageFile(e, 'customQrImageUrl')}
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => customQrInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs bg-[#1e1e24] hover:bg-[#282832] border border-[#33333f] rounded transition-colors text-white"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload Custom QR</span>
                </button>
                {ticket.customQrImageUrl && (
                  <button
                    onClick={() => onUpdateTicket({ customQrImageUrl: '' })}
                    className="p-2 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded"
                    title="Reset to Auto-Generated QR Code"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {ticket.customQrImageUrl && (
                <p className="text-[10px] text-amber-400 mt-1 font-mono">
                  ✓ Custom QR image uploaded and active
                </p>
              )}
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-[#222228]">
              <label className="flex items-center justify-between p-2 rounded bg-[#16161a] cursor-pointer">
                <span className="text-xs text-neutral-200">Include QR Code</span>
                <input
                  type="checkbox"
                  checked={ticket.hasQrCode}
                  onChange={(e) => onUpdateTicket({ hasQrCode: e.target.checked })}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-[#16161a] cursor-pointer">
                <span className="text-xs text-neutral-200">Include Barcode Strip</span>
                <input
                  type="checkbox"
                  checked={ticket.hasBarcode}
                  onChange={(e) => onUpdateTicket({ hasBarcode: e.target.checked })}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-[#16161a] cursor-pointer">
                <span className="text-xs text-neutral-200">Watermark Security Overlay</span>
                <input
                  type="checkbox"
                  checked={ticket.hasWatermark}
                  onChange={(e) => onUpdateTicket({ hasWatermark: e.target.checked })}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {ticket.hasWatermark && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={ticket.watermarkText || ''}
                  onChange={(e) => onUpdateTicket({ watermarkText: e.target.value })}
                  className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400 uppercase"
                />
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: BACK REVERSE ================= */}
        {activeTab === 'back' && (
          <div className="space-y-3.5">
            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              Editing the reverse side of the ticket pass. Toggle view with "Back Reverse" above.
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Reverse Header Title
              </label>
              <input
                type="text"
                value={ticket.backTitle || ''}
                onChange={(e) => onUpdateTicket({ backTitle: e.target.value })}
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Itinerary &amp; Timeline
              </label>
              <textarea
                rows={3}
                value={ticket.backSchedule || ''}
                onChange={(e) => onUpdateTicket({ backSchedule: e.target.value })}
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Admission Conditions &amp; Rules
              </label>
              <textarea
                rows={3}
                value={ticket.backTerms || ''}
                onChange={(e) => onUpdateTicket({ backTerms: e.target.value })}
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Legal Disclaimer
              </label>
              <textarea
                rows={2}
                value={ticket.backDisclaimer || ''}
                onChange={(e) => onUpdateTicket({ backDisclaimer: e.target.value })}
                className="w-full bg-[#16161a] border border-[#2d2d34] rounded p-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
