import React, { useRef, useState } from 'react';
import { AuthorisationDocument, AuthorisationDocType, DocumentLayoutTheme } from '../../types/authorisation.ts';
import { Sparkles, Upload, RefreshCw, RotateCcw, Palette, Layers, FileText } from 'lucide-react';
import { enhanceTextLocally } from '../../utils/textAssistant.ts';

interface DocumentFormProps {
  doc: AuthorisationDocument;
  onUpdateDoc: (updates: Partial<AuthorisationDocument>) => void;
  onApplyBranding: () => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  doc,
  onUpdateDoc,
  onApplyBranding,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'body' | 'signatories' | 'theme'>('details');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleSmartPolish = (field: 'mainBodyParagraph1' | 'mainBodyParagraph2' | 'mainBodyParagraph3' | 'subjectLine') => {
    const original = (doc[field] as string) || '';
    const polished = enhanceTextLocally(original, 'formal-executive');
    onUpdateDoc({ [field]: polished });
  };

  const handleRegenerateReference = () => {
    const nextRef = `NXP-${doc.docType.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    onUpdateDoc({ referenceNumber: nextRef });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_25MB = 25 * 1024 * 1024;
    if (file.size > MAX_25MB) {
      alert('File size exceeds 25MB limit. Please select a file under 25MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        onUpdateDoc({ logoUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <aside
      aria-label="Authorisation document editor"
      className="w-96 bg-[#111116] border-l border-[#222228] flex flex-col h-full text-neutral-200 select-none shrink-0"
    >
      {/* Top Tab Bar */}
      <div className="grid grid-cols-4 p-2 bg-[#0c0c0e] border-b border-[#222228] text-[11px] gap-1 font-medium">
        <button
          onClick={() => setActiveTab('details')}
          className={`py-1.5 rounded transition-colors ${
            activeTab === 'details'
              ? 'bg-amber-400 text-black font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          Recipient
        </button>
        <button
          onClick={() => setActiveTab('body')}
          className={`py-1.5 rounded transition-colors ${
            activeTab === 'body'
              ? 'bg-amber-400 text-black font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          Prose &amp; Terms
        </button>
        <button
          onClick={() => setActiveTab('signatories')}
          className={`py-1.5 rounded transition-colors ${
            activeTab === 'signatories'
              ? 'bg-amber-400 text-black font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          Signatures
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`py-1.5 rounded transition-colors ${
            activeTab === 'theme'
              ? 'bg-amber-400 text-black font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          Letterhead
        </button>
      </div>

      {/* Main Form Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= TAB 1: RECIPIENT & DATES ================= */}
        {activeTab === 'details' && (
          <div className="space-y-3.5">
            {/* Reference Number */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
                  Official Reference Number
                </label>
                <button
                  onClick={handleRegenerateReference}
                  className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate</span>
                </button>
              </div>
              <input
                type="text"
                value={doc.referenceNumber}
                onChange={(e) => onUpdateDoc({ referenceNumber: e.target.value })}
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Recipient Full Name */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Recipient / Employee Full Name
              </label>
              <input
                type="text"
                value={doc.recipientName}
                onChange={(e) => onUpdateDoc({ recipientName: e.target.value })}
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Recipient Position / Role */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Position / Job Title
              </label>
              <input
                type="text"
                value={doc.recipientTitle}
                onChange={(e) => onUpdateDoc({ recipientTitle: e.target.value })}
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Department */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={doc.department}
                  onChange={(e) => onUpdateDoc({ department: e.target.value })}
                  className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={doc.recipientEmployeeId || ''}
                  onChange={(e) => onUpdateDoc({ recipientEmployeeId: e.target.value })}
                  className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  placeholder="EMP-0000"
                />
              </div>
            </div>

            {/* Issue Date & Key Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Document Issue Date
                </label>
                <input
                  type="text"
                  value={doc.issueDate}
                  onChange={(e) => onUpdateDoc({ issueDate: e.target.value })}
                  className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  {doc.docType === 'employment-termination'
                    ? 'Termination Date'
                    : doc.docType === 'resignation-acknowledgement'
                    ? 'Final Working Date'
                    : 'Commencement / Effective'}
                </label>
                <input
                  type="text"
                  value={
                    doc.commencementDate ||
                    doc.terminationDate ||
                    doc.effectiveDate ||
                    doc.lastWorkingDay ||
                    ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (doc.docType === 'employment-termination') {
                      onUpdateDoc({ terminationDate: val, lastWorkingDay: val });
                    } else if (doc.docType === 'resignation-acknowledgement') {
                      onUpdateDoc({ lastWorkingDay: val });
                    } else {
                      onUpdateDoc({ commencementDate: val, effectiveDate: val });
                    }
                  }}
                  className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Conditional Fields based on docType */}
            {doc.docType === 'employment-acceptance' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                    Reporting Manager
                  </label>
                  <input
                    type="text"
                    value={doc.reportingManager || ''}
                    onChange={(e) => onUpdateDoc({ reportingManager: e.target.value })}
                    className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                    Compensation &amp; Benefits Summary
                  </label>
                  <input
                    type="text"
                    value={doc.compensationDetails || ''}
                    onChange={(e) => onUpdateDoc({ compensationDetails: e.target.value })}
                    className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </>
            )}

            {doc.docType === 'employment-termination' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                    Reason for Termination (Optional)
                  </label>
                  <input
                    type="text"
                    value={doc.terminationReason || ''}
                    onChange={(e) => onUpdateDoc({ terminationReason: e.target.value })}
                    className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Organizational Restructuring"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                    Return of Company Property Mandate
                  </label>
                  <input
                    type="text"
                    value={doc.propertyReturnTerms || ''}
                    onChange={(e) => onUpdateDoc({ propertyReturnTerms: e.target.value })}
                    className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </>
            )}

            {doc.docType === 'authorisation-certificate' && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Scope of Delegated Authority
                </label>
                <textarea
                  rows={3}
                  value={doc.scopeOfAuthority || ''}
                  onChange={(e) => onUpdateDoc({ scopeOfAuthority: e.target.value })}
                  className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: PROSE & TERMS ================= */}
        {activeTab === 'body' && (
          <div className="space-y-4">
            {/* Subject Line */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
                  Subject Line
                </label>
                <button
                  onClick={() => handleSmartPolish('subjectLine')}
                  className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Executive Polish</span>
                </button>
              </div>
              <input
                type="text"
                value={doc.subjectLine}
                onChange={(e) => onUpdateDoc({ subjectLine: e.target.value })}
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Opening Salutation */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Opening Salutation
              </label>
              <input
                type="text"
                value={doc.openingSalutation}
                onChange={(e) => onUpdateDoc({ openingSalutation: e.target.value })}
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Body Paragraph 1 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
                  Primary Mandate (Paragraph 1)
                </label>
                <button
                  onClick={() => handleSmartPolish('mainBodyParagraph1')}
                  className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Formalize</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={doc.mainBodyParagraph1}
                onChange={(e) => onUpdateDoc({ mainBodyParagraph1: e.target.value })}
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-2 text-xs text-white font-serif leading-relaxed focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Body Paragraph 2 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
                  Operational Terms (Paragraph 2)
                </label>
                <button
                  onClick={() => handleSmartPolish('mainBodyParagraph2')}
                  className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Formalize</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={doc.mainBodyParagraph2}
                onChange={(e) => onUpdateDoc({ mainBodyParagraph2: e.target.value })}
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-2 text-xs text-white font-serif leading-relaxed focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Body Paragraph 3 (Optional) */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Administrative Directives (Paragraph 3)
              </label>
              <textarea
                rows={3}
                value={doc.mainBodyParagraph3 || ''}
                onChange={(e) => onUpdateDoc({ mainBodyParagraph3: e.target.value })}
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-2 text-xs text-white font-serif leading-relaxed focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}

        {/* ================= TAB 3: SIGNATORIES ================= */}
        {activeTab === 'signatories' && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Authorized Signatory Full Name
              </label>
              <input
                type="text"
                value={doc.authorizedSignatoryName}
                onChange={(e) => onUpdateDoc({ authorizedSignatoryName: e.target.value })}
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Authorized Signatory Executive Title
              </label>
              <input
                type="text"
                value={doc.authorizedSignatoryTitle}
                onChange={(e) => onUpdateDoc({ authorizedSignatoryTitle: e.target.value })}
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-2 border-t border-[#222228] space-y-2">
              <label className="flex items-center justify-between p-2 rounded bg-[#171720] cursor-pointer">
                <span className="text-xs text-neutral-200">Affix Official Corporate Seal</span>
                <input
                  type="checkbox"
                  checked={doc.hasOfficialSeal}
                  onChange={(e) => onUpdateDoc({ hasOfficialSeal: e.target.checked })}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-[#171720] cursor-pointer">
                <span className="text-xs text-neutral-200">Require Recipient Countersignature</span>
                <input
                  type="checkbox"
                  checked={doc.requiresCounterSignature}
                  onChange={(e) => onUpdateDoc({ requiresCounterSignature: e.target.checked })}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-[#171720] cursor-pointer">
                <span className="text-xs text-neutral-200">Include Archival Watermark</span>
                <input
                  type="checkbox"
                  checked={doc.hasWatermark}
                  onChange={(e) => onUpdateDoc({ hasWatermark: e.target.checked })}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* ================= TAB 4: LETTERHEAD & THEME ================= */}
        {activeTab === 'theme' && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1.5">
                Executive Letterhead Layout Style
              </label>
              <select
                value={doc.theme}
                onChange={(e) =>
                  onUpdateDoc({ theme: e.target.value as DocumentLayoutTheme })
                }
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-2 text-xs text-amber-400 font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="executive-corporate">Executive Corporate (Clean Slate &amp; Crest)</option>
                <option value="luxury-black-gold">Luxury Black &amp; Gold (Burnished Gold Foil)</option>
                <option value="modern-minimalist">Modern Minimalist (Swiss Grid)</option>
                <option value="traditional-formal">Traditional Formal (Legal Parchment)</option>
                <option value="government-inspired">Government-Inspired (Solemn Mandate)</option>
                <option value="professional-hr">Professional HR (Blue Accents &amp; Table)</option>
                <option value="elegant-blue-silver">Elegant Blue &amp; Silver (Corporate Sapphire)</option>
                <option value="official-letterhead">Official Letterhead (Classic Business Stationery)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
                  Organization Name
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
                value={doc.organizationName}
                onChange={(e) => onUpdateDoc({ organizationName: e.target.value })}
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Organization Address
              </label>
              <input
                type="text"
                value={doc.organizationAddress}
                onChange={(e) => onUpdateDoc({ organizationAddress: e.target.value })}
                className="w-full bg-[#171720] border border-[#2e2e3e] rounded p-1.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Official Logo
              </label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs bg-[#1e1e26] hover:bg-[#282834] border border-[#333342] rounded text-white"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload Seal / Logo</span>
                </button>
                {doc.logoUrl && (
                  <button
                    onClick={() => onUpdateDoc({ logoUrl: '' })}
                    className="p-2 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded"
                    title="Remove Logo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
