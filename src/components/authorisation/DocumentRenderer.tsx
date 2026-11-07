import React from 'react';
import { AuthorisationDocument, DocumentLayoutTheme } from '../../types/authorisation.ts';
import { ShieldCheck, Award, FileText, CheckCircle, Stamp } from 'lucide-react';

interface DocumentRendererProps {
  doc: AuthorisationDocument;
  className?: string;
  isPrintMode?: boolean;
}

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({
  doc,
  className = '',
  isPrintMode = false,
}) => {
  // Theme color mapping
  const getThemeStyling = (theme: DocumentLayoutTheme) => {
    // Special light red theme for employment termination letters
    if (doc.docType === 'employment-termination' && theme !== 'luxury-black-gold') {
      return {
        paperBg: 'bg-[#fff7f7]',
        paperBorder: 'border-2 border-red-300 shadow-xl',
        textPrimary: 'text-[#881337]',
        textBody: 'text-[#4c0519]',
        textMuted: 'text-[#9f1239]',
        headerBorder: 'border-b-2 border-red-400',
        refBox: 'bg-[#ffe4e6] border border-red-300 text-[#881337]',
        sealColor: 'border-red-600 text-red-600',
        accentText: 'text-red-700',
      };
    }

    switch (theme) {
      case 'luxury-black-gold':
        return {
          paperBg: 'bg-[#0f0f13]',
          paperBorder: 'border-2 border-[#d4af37]',
          textPrimary: 'text-[#fef08a]',
          textBody: 'text-[#e4e4e7]',
          textMuted: 'text-[#a1a1aa]',
          headerBorder: 'border-b-2 border-[#d4af37]',
          refBox: doc.docType === 'employment-termination' ? 'bg-[#2a0f12] border border-red-500/50 text-red-300' : 'bg-[#181820] border border-[#d4af37]/40 text-[#fef08a]',
          sealColor: doc.docType === 'employment-termination' ? 'border-red-500 text-red-500' : 'border-[#d4af37] text-[#d4af37]',
          accentText: doc.docType === 'employment-termination' ? 'text-red-400' : 'text-[#d4af37]',
        };
      case 'modern-minimalist':
        return {
          paperBg: 'bg-white',
          paperBorder: 'border border-neutral-300',
          textPrimary: 'text-neutral-900',
          textBody: 'text-neutral-800',
          textMuted: 'text-neutral-500',
          headerBorder: 'border-b border-neutral-900',
          refBox: 'bg-neutral-50 border border-neutral-200 text-neutral-800',
          sealColor: 'border-neutral-900 text-neutral-900',
          accentText: 'text-neutral-900',
        };
      case 'traditional-formal':
        return {
          paperBg: 'bg-[#faf8f5]',
          paperBorder: 'border border-[#d6cfc7]',
          textPrimary: 'text-[#1c1917]',
          textBody: 'text-[#292524]',
          textMuted: 'text-[#78716c]',
          headerBorder: 'border-b-2 border-[#292524]',
          refBox: 'bg-[#f5f0e8] border border-[#d6cfc7] text-[#1c1917]',
          sealColor: 'border-[#78350f] text-[#78350f]',
          accentText: 'text-[#78350f]',
        };
      case 'government-inspired':
        return {
          paperBg: 'bg-white',
          paperBorder: 'border-2 border-[#0f172a]',
          textPrimary: 'text-[#0f172a]',
          textBody: 'text-[#1e293b]',
          textMuted: 'text-[#64748b]',
          headerBorder: 'border-b-4 border-[#0f172a]',
          refBox: 'bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a]',
          sealColor: 'border-[#0f172a] text-[#0f172a]',
          accentText: 'text-[#0f172a]',
        };
      case 'professional-hr':
        return {
          paperBg: 'bg-white',
          paperBorder: 'border border-neutral-300 shadow-lg',
          textPrimary: 'text-[#0f172a]',
          textBody: 'text-[#334155]',
          textMuted: 'text-[#64748b]',
          headerBorder: 'border-b-2 border-[#2563eb]',
          refBox: 'bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af]',
          sealColor: 'border-[#2563eb] text-[#2563eb]',
          accentText: 'text-[#2563eb]',
        };
      case 'elegant-blue-silver':
        return {
          paperBg: 'bg-[#f8fafc]',
          paperBorder: 'border border-[#cbd5e1]',
          textPrimary: 'text-[#0f172a]',
          textBody: 'text-[#1e293b]',
          textMuted: 'text-[#64748b]',
          headerBorder: 'border-b-2 border-[#0284c7]',
          refBox: 'bg-[#f0f9ff] border border-[#bae6fd] text-[#0369a1]',
          sealColor: 'border-[#0284c7] text-[#0284c7]',
          accentText: 'text-[#0284c7]',
        };
      case 'official-letterhead':
        return {
          paperBg: 'bg-white',
          paperBorder: 'border border-neutral-200',
          textPrimary: 'text-neutral-900',
          textBody: 'text-neutral-800',
          textMuted: 'text-neutral-500',
          headerBorder: 'border-b-2 border-neutral-800',
          refBox: 'bg-neutral-50 border border-neutral-300 text-neutral-800',
          sealColor: 'border-neutral-800 text-neutral-800',
          accentText: 'text-neutral-800',
        };
      case 'executive-corporate':
      default:
        return {
          paperBg: 'bg-white',
          paperBorder: 'border border-neutral-300 shadow-xl',
          textPrimary: 'text-[#0f172a]',
          textBody: 'text-[#1e293b]',
          textMuted: 'text-[#64748b]',
          headerBorder: 'border-b-2 border-[#0f172a]',
          refBox: 'bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a]',
          sealColor: 'border-[#0f172a] text-[#0f172a]',
          accentText: 'text-[#0f172a]',
        };
    }
  };

  const style = getThemeStyling(doc.theme);

  return (
    <div
      className={`document-print-target w-[820px] min-h-[1080px] p-12 flex flex-col justify-between mx-auto relative select-none font-serif ${style.paperBg} ${style.paperBorder} ${className}`}
      style={{
        boxShadow: isPrintMode ? 'none' : '0 12px 40px rgba(0,0,0,0.15)',
      }}
    >
      {/* Watermark Overlay */}
      {doc.hasWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.04]">
          <span className="font-serif font-black text-7xl tracking-widest uppercase -rotate-45 whitespace-nowrap">
            {doc.watermarkText || 'OFFICIAL RECORD'}
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-10 space-y-6">
        {/* Letterhead Header */}
        <header className={`pb-4 flex justify-between items-start ${style.headerBorder}`}>
          <div className="flex items-center gap-4">
            {doc.logoUrl ? (
              <img
                src={doc.logoUrl}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="w-16 h-16 object-contain rounded"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-lg font-serif">
                {doc.organizationName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className={`font-serif font-black text-xl uppercase tracking-wider ${style.textPrimary}`}>
                {doc.organizationName}
              </h1>
              <p className={`text-xs font-sans mt-0.5 ${style.textMuted}`}>
                {doc.department} • {doc.organizationAddress}
              </p>
              <p className={`text-[10px] font-sans mt-0.5 ${style.textMuted}`}>
                {doc.organizationContact}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-amber-500 block">
              OFFICIAL INSTRUMENT
            </span>
            <span className={`text-xs font-sans font-semibold block mt-0.5 ${style.textMuted}`}>
              Date: {doc.issueDate}
            </span>
          </div>
        </header>

        {/* Reference Number Strip */}
        <div className={`p-2.5 rounded text-xs font-sans font-semibold flex justify-between items-center ${style.refBox}`}>
          <div>
            <span className="font-mono text-amber-500 mr-2">REF NO:</span>
            <span className="font-mono font-bold tracking-wider">{doc.referenceNumber}</span>
          </div>
          <div className="text-[11px] uppercase tracking-wider text-neutral-500">
            RECORD TYPE: {doc.docType.replace(/-/g, ' ').toUpperCase()}
          </div>
        </div>

        {/* Recipient Information Block */}
        <div className="text-xs font-sans leading-relaxed pt-1">
          <span className="font-bold uppercase tracking-wider block text-neutral-400 text-[10px] mb-0.5">
            TO THE ATTENTION OF:
          </span>
          <div className={`font-serif font-bold text-sm ${style.textPrimary}`}>
            {doc.recipientName}
          </div>
          {doc.recipientTitle && <div className={style.textBody}>{doc.recipientTitle}</div>}
          {doc.recipientEmployeeId && (
            <div className={`font-mono text-[11px] ${style.textMuted}`}>
              Employee ID: {doc.recipientEmployeeId}
            </div>
          )}
          {doc.recipientAddress && <div className={style.textMuted}>{doc.recipientAddress}</div>}
        </div>

        {/* Formal Subject Line */}
        <div className={`border-l-4 pl-3 py-1 font-serif font-bold text-base tracking-wide border-amber-500 ${style.textPrimary}`}>
          SUBJECT: {doc.subjectLine.toUpperCase()}
        </div>

        {/* Salutation */}
        <div className={`text-sm font-semibold pt-1 ${style.textPrimary}`}>
          {doc.openingSalutation},
        </div>

        {/* Primary Body Paragraphs */}
        <div className={`space-y-4 text-xs leading-relaxed text-justify ${style.textBody}`}>
          <p>{doc.mainBodyParagraph1}</p>
          <p>{doc.mainBodyParagraph2}</p>
          {doc.mainBodyParagraph3 && <p>{doc.mainBodyParagraph3}</p>}
        </div>

        {/* Terms & Conditions / Provisions Box if applicable */}
        {doc.termsAndConditionsList && doc.termsAndConditionsList.length > 0 && (
          <div className="p-4 rounded border bg-black/[0.02]" style={{ borderColor: 'rgba(150,150,150,0.2)' }}>
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-amber-500 block mb-2">
              Specific Provisions &amp; Covenants:
            </span>
            <ul className={`space-y-1.5 text-xs font-sans ${style.textBody}`}>
              {doc.termsAndConditionsList.map((term, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Closing Salutation */}
        <div className={`text-xs pt-1 ${style.textPrimary}`}>
          {doc.closingText}
        </div>

        {/* Signature Section & Official Seal */}
        <div className="pt-6 grid grid-cols-12 gap-6 items-end">
          {/* Primary Authorized Signatory (6 cols) */}
          <div className="col-span-6 space-y-3">
            <span className={`text-[10px] font-sans font-semibold uppercase tracking-wider block ${style.textMuted}`}>
              Authorized by and on behalf of {doc.organizationName}:
            </span>
            <div className="h-10 flex items-center">
              {doc.signatureImageUrl ? (
                <img src={doc.signatureImageUrl} alt="Signature" className="h-10 object-contain" />
              ) : (
                <span className="font-serif italic text-lg font-bold text-neutral-800">
                  {doc.authorizedSignatoryName}
                </span>
              )}
            </div>
            <div className="border-t border-neutral-400 pt-1">
              <span className={`font-serif font-bold text-xs block ${style.textPrimary}`}>
                {doc.authorizedSignatoryName}
              </span>
              <span className={`text-[11px] font-sans block ${style.textMuted}`}>
                {doc.authorizedSignatoryTitle}
              </span>
              <span className={`text-[10px] font-mono block mt-0.5 ${style.textMuted}`}>
                Date: {doc.signatureDate}
              </span>
            </div>
          </div>

          {/* Secondary Signatory or Official Seal (6 cols) */}
          <div className="col-span-6 flex justify-end">
            {doc.requiresCounterSignature ? (
              <div className="w-full pl-4 space-y-3 text-right">
                <span className={`text-[10px] font-sans font-semibold uppercase tracking-wider block ${style.textMuted}`}>
                  Acknowledged &amp; Agreed:
                </span>
                <div className="h-10 flex items-center justify-end">
                  <span className="font-serif italic text-lg text-neutral-700">
                    {doc.counterSignatoryName || doc.recipientName}
                  </span>
                </div>
                <div className="border-t border-neutral-400 pt-1 text-right">
                  <span className={`font-serif font-bold text-xs block ${style.textPrimary}`}>
                    {doc.counterSignatoryName || doc.recipientName}
                  </span>
                  <span className={`text-[11px] font-sans block ${style.textMuted}`}>
                    {doc.counterSignatoryTitle || 'Designated Recipient'}
                  </span>
                  <span className={`text-[10px] font-mono block mt-0.5 ${style.textMuted}`}>
                    Date: {doc.counterSignatureDate || doc.issueDate}
                  </span>
                </div>
              </div>
            ) : doc.hasOfficialSeal ? (
              <div
                className={`w-28 h-28 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-2 text-center select-none ${style.sealColor}`}
              >
                <ShieldCheck className="w-5 h-5 mb-1" />
                <span className="font-sans text-[8px] font-black uppercase tracking-widest leading-tight">
                  {doc.sealText || 'OFFICIAL CORPORATE SEAL'}
                </span>
                <span className="font-mono text-[7px] mt-1">VERIFIED</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mandatory Legal & Governance Disclaimer Footer */}
      <footer className="relative z-10 mt-8 pt-3 border-t border-neutral-300 text-[9px] font-sans text-neutral-500 leading-snug flex justify-between items-end">
        <div className="max-w-xl">
          <strong>Notice:</strong> This instrument has been generated through NexPaper Studio for organizational record-keeping. The issuing entity affirms that this document has been prepared in accordance with applicable governance standards and internal operating mandates.
        </div>
        <div className="font-mono text-[8px] text-neutral-400 text-right shrink-0 ml-4">
          PAGE 1 OF 1 • NEXPAPER REGISTRY
        </div>
      </footer>
    </div>
  );
};
