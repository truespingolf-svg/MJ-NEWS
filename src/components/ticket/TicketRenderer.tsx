import React, { useEffect, useState } from 'react';
import { TicketProject } from '../../types/ticket.ts';
import { generateQrCodeDataUrl, generateBarcodeSvg } from '../../services/qrBarcodeService.ts';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Shield,
  Star,
  Award,
  Music,
  CheckCircle2,
} from 'lucide-react';

interface TicketRendererProps {
  ticket: TicketProject;
  className?: string;
  isPrintMode?: boolean;
}

export const TicketRenderer: React.FC<TicketRendererProps> = ({
  ticket,
  className = '',
  isPrintMode = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const generateQr = async () => {
      const darkColor =
        ticket.theme === 'modern-minimalist' || ticket.theme === 'classic-vintage'
          ? '#18181b'
          : ticket.theme === 'neon-futuristic'
          ? '#0891b2'
          : '#000000';
      const lightColor = '#ffffff';

      const dataUrl = await generateQrCodeDataUrl(
        ticket.qrPayload || `${ticket.ticketNumber}|${ticket.guestName}|${ticket.eventTitle}`,
        {
          colorDark: darkColor,
          colorLight: lightColor,
          width: 320,
        }
      );
      if (isMounted) {
        setQrDataUrl(dataUrl);
      }
    };
    generateQr();
    return () => {
      isMounted = false;
    };
  }, [ticket.qrPayload, ticket.ticketNumber, ticket.guestName, ticket.eventTitle, ticket.theme]);

  const fontClass =
    ticket.fontFamily === 'cinzel'
      ? 'font-cinzel'
      : ticket.fontFamily === 'bodoni'
      ? 'font-bodoni'
      : ticket.fontFamily === 'oswald'
      ? 'font-oswald'
      : ticket.fontFamily === 'source-serif'
      ? 'font-source-serif'
      : ticket.fontFamily === 'courier'
      ? 'font-courier'
      : ticket.fontFamily === 'sans'
      ? 'font-sans'
      : 'font-playfair';

  // Dimension style
  const isLandscape = ticket.orientation === 'landscape';
  const dimensionsClass = isLandscape
    ? 'w-[780px] h-[340px]'
    : 'w-[420px] h-[660px]';

  // Theme styling configurations
  const getThemeStyles = () => {
    switch (ticket.theme) {
      case 'luxury-gold':
        return {
          bg: 'bg-[#0a0a0c]',
          border: 'border-[#d4af37]',
          textPrimary: 'text-[#fef08a]',
          textSecondary: 'text-[#d4af37]',
          textMuted: 'text-[#a1a1aa]',
          cardSurface: 'bg-[#121216]',
          accentGlow: 'shadow-[0_0_25px_rgba(212,175,55,0.15)]',
          stubBorder: 'border-dashed border-[#d4af37]/40',
          badgeBg: 'bg-[#d4af37]/20 text-[#fef08a] border border-[#d4af37]/60',
        };
      case 'modern-minimalist':
        return {
          bg: 'bg-[#faf8f5]',
          border: 'border-[#18181b]',
          textPrimary: 'text-[#18181b]',
          textSecondary: 'text-[#3f3f46]',
          textMuted: 'text-[#71717a]',
          cardSurface: 'bg-white',
          accentGlow: 'shadow-[0_4px_20px_rgba(0,0,0,0.06)]',
          stubBorder: 'border-dashed border-[#18181b]/30',
          badgeBg: 'bg-[#18181b] text-white',
        };
      case 'hollywood-premiere':
        return {
          bg: 'bg-[#180307]',
          border: 'border-[#dc2626]',
          textPrimary: 'text-[#fee2e2]',
          textSecondary: 'text-[#f87171]',
          textMuted: 'text-[#fca5a5]/70',
          cardSurface: 'bg-[#26050b]',
          accentGlow: 'shadow-[0_0_30px_rgba(220,38,38,0.25)]',
          stubBorder: 'border-dashed border-[#dc2626]/40',
          badgeBg: 'bg-[#b91c1c] text-white font-bold',
        };
      case 'royal-elegance':
        return {
          bg: 'bg-[#070d1e]',
          border: 'border-[#38bdf8]',
          textPrimary: 'text-[#e0f2fe]',
          textSecondary: 'text-[#7dd3fc]',
          textMuted: 'text-[#94a3b8]',
          cardSurface: 'bg-[#0b1530]',
          accentGlow: 'shadow-[0_0_25px_rgba(56,189,248,0.2)]',
          stubBorder: 'border-dashed border-[#38bdf8]/40',
          badgeBg: 'bg-[#0369a1] text-white',
        };
      case 'neon-futuristic':
        return {
          bg: 'bg-[#090b10]',
          border: 'border-[#06b6d4]',
          textPrimary: 'text-[#67e8f9]',
          textSecondary: 'text-[#a855f7]',
          textMuted: 'text-[#64748b]',
          cardSurface: 'bg-[#0f1420]',
          accentGlow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
          stubBorder: 'border-dashed border-[#06b6d4]/50',
          badgeBg: 'bg-[#06b6d4]/20 text-[#67e8f9] border border-[#06b6d4]',
        };
      case 'corporate-professional':
        return {
          bg: 'bg-[#0f172a]',
          border: 'border-[#334155]',
          textPrimary: 'text-white',
          textSecondary: 'text-[#94a3b8]',
          textMuted: 'text-[#64748b]',
          cardSurface: 'bg-[#1e293b]',
          accentGlow: 'shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
          stubBorder: 'border-dashed border-[#475569]',
          badgeBg: 'bg-[#2563eb] text-white font-medium',
        };
      case 'concert-music':
        return {
          bg: 'bg-[#101014]',
          border: 'border-[#f97316]',
          textPrimary: 'text-[#ffedd5]',
          textSecondary: 'text-[#fb923c]',
          textMuted: 'text-[#a8a29e]',
          cardSurface: 'bg-[#18181f]',
          accentGlow: 'shadow-[0_0_25px_rgba(249,115,22,0.25)]',
          stubBorder: 'border-dashed border-[#f97316]/40',
          badgeBg: 'bg-[#ea580c] text-white font-black',
        };
      case 'classic-vintage':
        return {
          bg: 'bg-[#f4ece1]',
          border: 'border-[#451a03]',
          textPrimary: 'text-[#291404]',
          textSecondary: 'text-[#78350f]',
          textMuted: 'text-[#854d0e]',
          cardSurface: 'bg-[#ebdcc8]',
          accentGlow: 'shadow-[0_2px_10px_rgba(0,0,0,0.1)]',
          stubBorder: 'border-dashed border-[#78350f]/40',
          badgeBg: 'bg-[#451a03] text-[#fef3c7]',
        };
      case 'black-tie':
        return {
          bg: 'bg-[#000000]',
          border: 'border-white',
          textPrimary: 'text-white',
          textSecondary: 'text-[#e4e4e7]',
          textMuted: 'text-[#a1a1aa]',
          cardSurface: 'bg-[#09090b]',
          accentGlow: 'shadow-[0_0_20px_rgba(255,255,255,0.15)]',
          stubBorder: 'border-dashed border-white/50',
          badgeBg: 'bg-white text-black font-bold tracking-widest',
        };
      case 'exclusive-vip':
        return {
          bg: 'bg-[#121316]',
          border: 'border-[#eab308]',
          textPrimary: 'text-[#fef9c3]',
          textSecondary: 'text-[#eab308]',
          textMuted: 'text-[#a1a1aa]',
          cardSurface: 'bg-[#1c1d22]',
          accentGlow: 'shadow-[0_0_30px_rgba(234,179,8,0.25)]',
          stubBorder: 'border-dashed border-[#eab308]/50',
          badgeBg: 'bg-[#ca8a04] text-white font-black tracking-widest uppercase',
        };
      case 'creative-artistic':
      default:
        return {
          bg: 'bg-[#13111c]',
          border: 'border-[#a855f7]',
          textPrimary: 'text-[#f3e8ff]',
          textSecondary: 'text-[#c084fc]',
          textMuted: 'text-[#94a3b8]',
          cardSurface: 'bg-[#1e1b2e]',
          accentGlow: 'shadow-[0_0_25px_rgba(168,85,247,0.25)]',
          stubBorder: 'border-dashed border-[#a855f7]/40',
          badgeBg: 'bg-[#9333ea] text-white',
        };
    }
  };

  const themeStyle = getThemeStyles();
  const barcodeSvg = generateBarcodeSvg(
    ticket.ticketNumber || 'NXP-882910',
    ticket.theme === 'modern-minimalist' || ticket.theme === 'classic-vintage'
      ? '#18181b'
      : ticket.theme === 'luxury-gold'
      ? '#d4af37'
      : ticket.theme === 'neon-futuristic'
      ? '#06b6d4'
      : '#ffffff'
  );

  return (
    <div
      className={`relative select-none overflow-hidden rounded-xl border-2 transition-all duration-150 ${dimensionsClass} ${themeStyle.bg} ${themeStyle.border} ${themeStyle.accentGlow} ${className}`}
      style={{
        backgroundImage: ticket.backgroundImageUrl ? `url(${ticket.backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background Dimmer Scrim if custom image used */}
      {ticket.backgroundImageUrl && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] pointer-events-none" />
      )}

      {/* Watermark overlay */}
      {ticket.hasWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.06]">
          <span className="font-serif font-black text-6xl tracking-widest uppercase -rotate-12 whitespace-nowrap">
            {ticket.watermarkText || 'VIP CREDENTIAL'}
          </span>
        </div>
      )}

      {/* ================= BACK SIDE VIEW ================= */}
      {ticket.showBackSide ? (
        <div className="relative z-10 w-full h-full p-6 flex flex-col justify-between">
          <div className="border-b pb-3 flex justify-between items-center" style={{ borderColor: 'rgba(150,150,150,0.2)' }}>
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest block text-amber-400">
                OFFICIAL INSTRUMENT REVERSE
              </span>
              <h3 className={`text-base font-bold ${themeStyle.textPrimary}`}>
                {ticket.backTitle || 'ADMISSION PROTOCOL & SCHEDULE'}
              </h3>
            </div>
            <div className="text-right font-mono text-xs text-neutral-400">
              SERIAL #{ticket.ticketNumber}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 py-3 text-xs">
            <div>
              <h4 className="font-semibold uppercase tracking-wider text-[11px] mb-1 text-amber-400">
                Itinerary &amp; Timeline
              </h4>
              <p className={`leading-relaxed text-[11px] ${themeStyle.textSecondary}`}>
                {ticket.backSchedule || 'Official event schedule and reception times.'}
              </p>

              <h4 className="font-semibold uppercase tracking-wider text-[11px] mt-3 mb-1 text-amber-400">
                Contact &amp; Assistance
              </h4>
              <p className={`leading-relaxed text-[11px] ${themeStyle.textMuted}`}>
                {ticket.backContact || ticket.contactInfo || 'Concierge Desk: support@nexpaperstudio.com'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold uppercase tracking-wider text-[11px] mb-1 text-amber-400">
                Terms of Admittance
              </h4>
              <p className={`leading-relaxed text-[10px] ${themeStyle.textMuted}`}>
                {ticket.backTerms || 'Admission is contingent upon adherence to venue protocols.'}
              </p>
              <p className={`leading-relaxed text-[10px] mt-2 italic ${themeStyle.textMuted}`}>
                {ticket.backDisclaimer || 'Non-transferable pass. Commercial recording strictly regulated.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t flex justify-between items-center text-[10px]" style={{ borderColor: 'rgba(150,150,150,0.2)' }}>
            <span className={themeStyle.textMuted}>
              {ticket.footerText || 'NexPaper Studio Master Pass • All Rights Reserved'}
            </span>
            <span className="font-mono text-amber-400">SCAN AT ACCESS GATES</span>
          </div>
        </div>
      ) : isLandscape ? (
        /* ================= LANDSCAPE FRONT VIEW ================= */
        <div className="relative z-10 w-full h-full flex">
          {/* Main Body (75% width) */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            {/* Header row */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                {ticket.logoUrl && (
                  <img
                    src={ticket.logoUrl}
                    alt="Host Logo"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-contain rounded"
                  />
                )}
                <div>
                  <span className={`text-[10px] font-sans font-bold tracking-widest uppercase block ${themeStyle.textSecondary}`}>
                    {ticket.hostOrganization || 'NEXPAPER STUDIO PRESENTS'}
                  </span>
                  <h2 className={`${fontClass} font-bold text-lg leading-tight uppercase tracking-wide ${themeStyle.textPrimary}`}>
                    {ticket.eventTitle}
                  </h2>
                  {ticket.eventSubtitle && (
                    <p className={`text-[11px] font-sans italic leading-tight mt-0.5 ${themeStyle.textMuted}`}>
                      {ticket.eventSubtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Category Badge */}
              <div className={`px-2.5 py-1 rounded text-[10px] font-sans font-bold tracking-wider uppercase whitespace-nowrap ${themeStyle.badgeBg}`}>
                {ticket.ticketCategory || 'VIP PASS'}
              </div>
            </div>

            {/* Middle Section: Guest Name & Description */}
            <div className="my-2 p-2 rounded bg-black/20 border border-white/5">
              <div className="flex items-baseline justify-between mb-1">
                <span className={`text-[10px] font-sans uppercase tracking-wider ${themeStyle.textMuted}`}>
                  Honored Guest / Attendee
                </span>
                {ticket.dressCode && (
                  <span className={`text-[10px] font-sans font-semibold ${themeStyle.textSecondary}`}>
                    Dress: {ticket.dressCode}
                  </span>
                )}
              </div>
              <div className={`${fontClass} text-base font-bold tracking-wide ${themeStyle.textPrimary}`}>
                {ticket.guestName || 'Distinguished Guest'}
              </div>
              {ticket.eventDescription && (
                <p className={`text-[10px] font-sans line-clamp-2 mt-1 leading-snug ${themeStyle.textMuted}`}>
                  {ticket.eventDescription}
                </p>
              )}
            </div>

            {/* Date, Time, Venue strip */}
            <div className="grid grid-cols-3 gap-2 text-[11px] border-t pt-2" style={{ borderColor: 'rgba(150,150,150,0.15)' }}>
              <div>
                <span className={`text-[9px] uppercase font-bold tracking-wider block ${themeStyle.textSecondary}`}>
                  Date
                </span>
                <span className={`font-semibold ${themeStyle.textPrimary}`}>
                  {ticket.dateText}
                </span>
              </div>
              <div>
                <span className={`text-[9px] uppercase font-bold tracking-wider block ${themeStyle.textSecondary}`}>
                  Schedule
                </span>
                <span className={`font-semibold ${themeStyle.textPrimary}`}>
                  {ticket.timeText}
                </span>
              </div>
              <div>
                <span className={`text-[9px] uppercase font-bold tracking-wider block ${themeStyle.textSecondary}`}>
                  Location
                </span>
                <span className={`font-semibold truncate block ${themeStyle.textPrimary}`}>
                  {ticket.venueName}
                </span>
              </div>
            </div>

            {/* Bottom Footer bar */}
            <div className="flex justify-between items-center text-[9px] pt-1 text-neutral-400">
              <span className="truncate max-w-[320px]">{ticket.venueAddress}</span>
              <span className="font-mono text-amber-400">{ticket.accessLevel}</span>
            </div>
          </div>

          {/* Perforated Stub Tear-Line */}
          <div className={`w-0 h-full border-r ${themeStyle.stubBorder} relative flex items-center justify-center`}>
            {/* Top and bottom notches */}
            <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#121214]" />
            <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-[#121214]" />
          </div>

          {/* Right Stub (25% width) */}
          <div className="w-[190px] p-4 flex flex-col justify-between items-center text-center bg-black/30">
            <div className="w-full">
              <span className={`text-[9px] font-sans font-bold uppercase tracking-widest block ${themeStyle.textSecondary}`}>
                ACCESS PASS
              </span>
              <div className="text-xs font-mono font-bold mt-0.5 text-amber-400">
                {ticket.ticketNumber}
              </div>
              {ticket.seatNumber && (
                <div className={`text-[10px] font-sans font-semibold mt-0.5 ${themeStyle.textPrimary}`}>
                  {ticket.seatNumber}
                </div>
              )}
            </div>

            {/* QR Code */}
            {ticket.hasQrCode && (
              <div className="p-1 rounded bg-white my-1 shadow-sm">
                {ticket.customQrImageUrl ? (
                  <img src={ticket.customQrImageUrl} alt="Custom Uploaded QR Code" className="w-20 h-20 object-contain" />
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="Ticket QR Code" className="w-20 h-20 object-contain" />
                ) : (
                  <div className="w-20 h-20 bg-neutral-200 animate-pulse" />
                )}
              </div>
            )}

            {/* Barcode */}
            {ticket.hasBarcode && (
              <div className="w-full h-8 flex flex-col items-center">
                <div
                  className="w-full h-6"
                  dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                />
                <span className="font-mono text-[8px] tracking-widest mt-0.5 text-neutral-400">
                  {ticket.ticketNumber}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= PORTRAIT FRONT VIEW ================= */
        <div className="relative z-10 w-full h-full p-6 flex flex-col justify-between">
          {/* Header */}
          <div className="text-center">
            {ticket.logoUrl && (
              <img
                src={ticket.logoUrl}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 object-contain mx-auto mb-2 rounded"
              />
            )}
            <span className={`text-[10px] font-sans font-bold uppercase tracking-widest block ${themeStyle.textSecondary}`}>
              {ticket.hostOrganization || 'OFFICIAL INVITATION'}
            </span>
            <h2 className={`${fontClass} font-bold text-xl uppercase mt-1 leading-tight ${themeStyle.textPrimary}`}>
              {ticket.eventTitle}
            </h2>
            {ticket.eventSubtitle && (
              <p className={`text-xs italic mt-1 ${themeStyle.textMuted}`}>
                {ticket.eventSubtitle}
              </p>
            )}
            <div className={`mt-2 inline-block px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${themeStyle.badgeBg}`}>
              {ticket.ticketCategory}
            </div>
          </div>

          {/* Guest Name & Center Highlight */}
          <div className="my-3 text-center p-3 rounded bg-black/20 border border-white/10">
            <span className={`text-[10px] uppercase tracking-wider block ${themeStyle.textMuted}`}>
              Presented to
            </span>
            <div className={`${fontClass} text-lg font-bold mt-0.5 ${themeStyle.textPrimary}`}>
              {ticket.guestName}
            </div>
            {ticket.seatNumber && (
              <div className="text-xs font-mono font-bold text-amber-400 mt-1">
                {ticket.seatNumber}
              </div>
            )}
            {ticket.eventDescription && (
              <p className={`text-[11px] mt-2 leading-relaxed ${themeStyle.textMuted}`}>
                {ticket.eventDescription}
              </p>
            )}
          </div>

          {/* Details Grid */}
          <div className="space-y-2 text-xs border-y py-3" style={{ borderColor: 'rgba(150,150,150,0.2)' }}>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className={`font-semibold ${themeStyle.textPrimary}`}>{ticket.dateText}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className={`font-semibold ${themeStyle.textPrimary}`}>{ticket.timeText}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className={`font-semibold block ${themeStyle.textPrimary}`}>{ticket.venueName}</span>
                <span className={`text-[10px] block ${themeStyle.textMuted}`}>{ticket.venueAddress}</span>
              </div>
            </div>
          </div>

          {/* QR Code & Barcode Footprint */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="font-mono text-[10px] text-amber-400 block">
                PASS #{ticket.ticketNumber}
              </span>
              <span className={`text-[10px] ${themeStyle.textMuted}`}>
                {ticket.accessLevel}
              </span>
            </div>

            {ticket.hasQrCode && (
              <div className="p-1 bg-white rounded shadow">
                {ticket.customQrImageUrl ? (
                  <img src={ticket.customQrImageUrl} alt="Custom QR Code" className="w-16 h-16 object-contain" />
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-16 h-16 object-contain" />
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
