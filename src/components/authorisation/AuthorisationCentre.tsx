import React, { useState, useRef } from 'react';
import {
  AuthorisationDocument,
  AuthorisationDocType,
  DocumentLayoutTheme,
} from '../../types/authorisation.ts';
import {
  loadAllAuthorisationDocs,
  saveAuthorisationDoc,
  createNewAuthorisationDoc,
  duplicateAuthorisationDoc,
  deleteAuthorisationDoc,
} from '../../services/authorisationStorage.ts';
import { exportAuthorisationToDocx } from '../../services/docxExportService.ts';
import { DocumentRenderer } from './DocumentRenderer.tsx';
import { DocumentForm } from './DocumentForm.tsx';
import { AuthorisationPasscodeGate } from './AuthorisationPasscodeGate.tsx';
import { StaffCodeManager } from './StaffCodeManager.tsx';
import { StaffPublishingManager } from './StaffPublishingManager.tsx';
import { StaffMarketingApplications } from './StaffMarketingApplications.tsx';
import { StaffUserManager } from './StaffUserManager.tsx';
import {
  ShieldCheck,
  Lock,
  Plus,
  Download,
  FileText,
  Printer,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Check,
  Edit2,
  KeyRound,
  Radio,
  Briefcase,
  ChevronDown,
  Users,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface AuthorisationCentreProps {
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  onOpenBrandingKit: () => void;
  brandingOrganizationName?: string;
}

type StaffTab = 'users' | 'documents' | 'applications' | 'codes' | 'publishing';

export const AuthorisationCentre: React.FC<AuthorisationCentreProps> = ({
  isUnlocked,
  onUnlock,
  onLock,
  onOpenBrandingKit,
  brandingOrganizationName,
}) => {
  const [activeTab, setActiveTab] = useState<StaffTab>('documents');
  const [documents, setDocuments] = useState<AuthorisationDocument[]>(() =>
    loadAllAuthorisationDocs()
  );
  const [currentDocId, setCurrentDocId] = useState<string>(
    () => documents[0]?.id || ''
  );
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [tempTitle, setTempTitle] = useState<string>('');

  const docContainerRef = useRef<HTMLDivElement>(null);

  if (!isUnlocked) {
    return <AuthorisationPasscodeGate onUnlock={onUnlock} />;
  }

  const currentDoc =
    documents.find((d) => d.id === currentDocId) || documents[0];

  const handleUpdateCurrentDoc = (updates: Partial<AuthorisationDocument>) => {
    if (!currentDoc) return;
    const updated: AuthorisationDocument = {
      ...currentDoc,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveAuthorisationDoc(updated);
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleCreateNew = (docType: AuthorisationDocType = 'employment-acceptance') => {
    const fresh = createNewAuthorisationDoc(docType, 'executive-corporate');
    if (brandingOrganizationName) {
      fresh.organizationName = brandingOrganizationName;
      saveAuthorisationDoc(fresh);
    }
    const all = loadAllAuthorisationDocs();
    setDocuments(all);
    setCurrentDocId(fresh.id);
  };

  const handleDuplicate = (id: string) => {
    const dup = duplicateAuthorisationDoc(id);
    if (dup) {
      setDocuments(loadAllAuthorisationDocs());
      setCurrentDocId(dup.id);
    }
  };

  const handleDelete = (id: string) => {
    if (documents.length <= 1) return;
    const remaining = deleteAuthorisationDoc(id);
    setDocuments(remaining);
    if (currentDocId === id) {
      setCurrentDocId(remaining[0]?.id || '');
    }
  };

  // Straight PDF Download
  const handleDownloadPdf = async () => {
    if (!docContainerRef.current || !currentDoc) return;
    try {
      setIsExporting(true);
      setStatusMessage('Rendering print-ready letterhead PDF...');

      const targetEl = docContainerRef.current.querySelector(
        '.document-print-target'
      ) as HTMLElement;
      if (!targetEl) throw new Error('Target element not found');

      const canvas = await html2canvas(targetEl, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 297), undefined, 'FAST');
      const filename = `${currentDoc.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${currentDoc.referenceNumber.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;
      pdf.save(filename);

      setStatusMessage('Downloaded PDF successfully!');
      setTimeout(() => {
        setIsExporting(false);
        setStatusMessage('');
      }, 1500);
    } catch (err) {
      console.error('PDF export error:', err);
      setIsExporting(false);
      setStatusMessage('');
      window.print();
    }
  };

  // Export as Word (.doc/.docx)
  const handleDownloadDocx = () => {
    if (!currentDoc) return;
    exportAuthorisationToDocx(currentDoc);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0d] text-neutral-100 overflow-hidden font-sans">
      {/* Staff Sub-Header Single Dropdown Selector */}
      <div className="bg-gradient-to-r from-[#0f0f16] via-[#13131c] to-[#0f0f16] border-b border-amber-500/20 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 shadow-lg select-none min-h-13 h-auto shrink-0 z-30">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest hidden sm:inline">Authorisation Panel:</span>
          </div>

          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as StaffTab)}
              className="appearance-none bg-[#1a1a26] border border-amber-500/50 text-amber-300 text-xs font-bold rounded-xl px-3.5 py-1.5 sm:py-2 pr-9 focus:outline-none focus:border-amber-400 cursor-pointer shadow-md hover:bg-[#222234] transition-all min-h-[36px]"
            >
              <option value="users">👥 Community Players, Accounts &amp; Ticket Grants</option>
              <option value="codes">🔑 Reward Codes, Points &amp; Redemptions</option>
              <option value="publishing">📻 Newspaper Publishing &amp; Broadcast Ticker</option>
              <option value="applications">💼 Marketing Recruitment Applications</option>
              <option value="documents">📑 Personnel &amp; Official Legal Documents</option>
            </select>
            <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>EXECUTIVE VAULT UNLOCKED</span>
          </div>

          <button
            onClick={onLock}
            className="px-3 py-1.5 text-xs text-neutral-300 hover:text-amber-400 flex items-center gap-1.5 rounded-xl bg-[#181822] border border-[#2e2e3e] hover:border-amber-500/40 transition-all shrink-0 shadow-sm min-h-[36px]"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock Access</span>
          </button>
        </div>
      </div>

      {/* Tab Content 0: Community Players, Ticket Grants & Points */}
      {activeTab === 'users' && (
        <div className="flex-1 overflow-auto">
          <StaffUserManager />
        </div>
      )}

      {/* Tab Content 1: Marketing Recruitment Applications */}
      {activeTab === 'applications' && (
        <div className="flex-1 overflow-auto">
          <StaffMarketingApplications />
        </div>
      )}

      {/* Tab Content 2: Secret Reward Codes */}
      {activeTab === 'codes' && (
        <div className="flex-1 overflow-auto">
          <StaffCodeManager />
        </div>
      )}

      {/* Tab Content 3: Newspaper Publishing & Broadcast Ticker */}
      {activeTab === 'publishing' && (
        <div className="flex-1 overflow-auto">
          <StaffPublishingManager />
        </div>
      )}

      {/* Tab Content 4: Personnel & Official Documents */}
      {activeTab === 'documents' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Control Bar */}
          <div className="min-h-13 h-auto py-2 bg-[#111116] border-b border-[#22222a] px-3 sm:px-5 flex flex-wrap items-center justify-between gap-2.5 select-none shrink-0 z-20">
            {/* Document Selector & Title */}
            <div className="flex items-center gap-2.5 shrink-0">
              <select
                value={currentDocId}
                onChange={(e) => setCurrentDocId(e.target.value)}
                className="bg-[#181822] border border-[#2e2e3e] text-xs font-semibold text-amber-400 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 max-w-[170px] sm:max-w-[240px] truncate min-h-[34px]"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.referenceNumber})
                  </option>
                ))}
              </select>

              {isEditingTitle ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateCurrentDoc({ title: tempTitle || currentDoc.title });
                        setIsEditingTitle(false);
                      }
                    }}
                    className="bg-[#181822] border border-amber-400 rounded px-2 py-1 text-xs text-white focus:outline-none w-36 sm:w-48"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      handleUpdateCurrentDoc({ title: tempTitle || currentDoc.title });
                      setIsEditingTitle(false);
                    }}
                    className="p-1 bg-amber-400 text-black rounded"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTempTitle(currentDoc.title);
                    setIsEditingTitle(true);
                  }}
                  className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white max-w-[120px] sm:max-w-[180px] truncate"
                >
                  <span className="font-semibold truncate">{currentDoc.title}</span>
                  <Edit2 className="w-3 h-3 text-neutral-500 shrink-0" />
                </button>
              )}

              {/* New Document Type Select Dropdown */}
              <div className="relative">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleCreateNew(e.target.value as AuthorisationDocType);
                    }
                  }}
                  className="bg-[#181822] border border-amber-400/50 text-xs font-semibold text-amber-400 hover:bg-[#222230] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer min-h-[34px]"
                >
                  <option value="" disabled>+ New Doc...</option>
                  <option value="employment-acceptance">Employment Acceptance Letter</option>
                  <option value="employment-termination">Employment Termination Letter</option>
                  <option value="appointment-confirmation">Appointment Confirmation</option>
                  <option value="role-acceptance">Role Acceptance Letter</option>
                  <option value="authorisation-certificate">Authorisation Certificate</option>
                  <option value="resignation-acknowledgement">Resignation Acknowledgement</option>
                  <option value="suspension-notice">Suspension Notice</option>
                  <option value="custom-personnel">Custom Personnel Document</option>
                </select>
              </div>
            </div>

            {/* Center Theme Style Dropdown */}
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="text-[11px] text-neutral-400 hidden sm:inline">Theme:</span>
              <select
                value={currentDoc.theme}
                onChange={(e) =>
                  handleUpdateCurrentDoc({ theme: e.target.value as DocumentLayoutTheme })
                }
                className="bg-[#181822] border border-[#2e2e3e] text-xs font-semibold text-white rounded px-2.5 py-1.5 focus:outline-none min-h-[34px]"
              >
                <option value="executive-corporate">Executive Corporate</option>
                <option value="luxury-black-gold">Luxury Black &amp; Gold</option>
                <option value="modern-minimalist">Modern Minimalist</option>
                <option value="traditional-formal">Traditional Formal</option>
                <option value="government-inspired">Government-Inspired</option>
                <option value="professional-hr">Professional HR</option>
                <option value="elegant-blue-silver">Elegant Blue &amp; Silver</option>
                <option value="official-letterhead">Official Letterhead</option>
              </select>
            </div>

            {/* Actions & Export */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full py-0.5 shrink-0">
              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-[#181822] border border-[#2e2e3e] rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.1))}
                  className="p-1 hover:text-white text-neutral-400"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="px-1 text-[10px] font-mono text-neutral-300">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                  className="p-1 hover:text-white text-neutral-400"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setZoomLevel(0.85)}
                  className="px-1.5 py-0.5 text-[10px] text-amber-400 hover:text-white"
                >
                  Fit
                </button>
              </div>

              {/* Duplicate & Delete */}
              <button
                onClick={() => handleDuplicate(currentDoc.id)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded min-h-[34px] min-w-[34px] flex items-center justify-center"
                title="Duplicate Document"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleDelete(currentDoc.id)}
                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded min-h-[34px] min-w-[34px] flex items-center justify-center"
                title="Delete Document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Export as Word / DOCX */}
              <button
                onClick={handleDownloadDocx}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1a1a24] hover:bg-[#252534] text-neutral-200 hover:text-white border border-[#333344] rounded-lg transition-colors whitespace-nowrap min-h-[34px]"
                title="Export as Microsoft Word (.doc/.docx) formatted file"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Word (.docx)</span>
                <span className="sm:hidden">DOCX</span>
              </button>

              {/* Print */}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1a1a24] hover:bg-[#252534] text-neutral-200 hover:text-white border border-[#333344] rounded-lg transition-colors whitespace-nowrap min-h-[34px]"
                title="Print document"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print</span>
              </button>

              {/* DOWNLOAD PDF (STRAIGHT DOWNLOAD) */}
              <button
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-black rounded-lg shadow-md transition-all font-sans whitespace-nowrap min-h-[34px]"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isExporting ? (statusMessage || 'Downloading...') : 'DOWNLOAD PDF'}</span>
              </button>
            </div>
          </div>

          {/* Main Workspace (Live Canvas + Form Editor) */}
          <div className="flex-1 flex overflow-hidden">
            {/* Center Live Document Canvas */}
            <div
              ref={docContainerRef}
              className="flex-1 overflow-auto bg-[#070709] p-8 flex items-center justify-center relative"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            >
              <div
                className="transition-transform duration-100 ease-out origin-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <DocumentRenderer doc={currentDoc} />
              </div>
            </div>

            {/* Right Form Editor */}
            <DocumentForm
              doc={currentDoc}
              onUpdateDoc={handleUpdateCurrentDoc}
              onApplyBranding={() => {
                if (brandingOrganizationName) {
                  handleUpdateCurrentDoc({ organizationName: brandingOrganizationName });
                } else {
                  onOpenBrandingKit();
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
