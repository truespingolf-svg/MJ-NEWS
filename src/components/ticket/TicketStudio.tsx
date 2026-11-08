import React, { useState, useRef } from 'react';
import {
  TicketProject,
  TicketDocumentType,
  TicketStyleTheme,
} from '../../types/ticket.ts';
import {
  loadAllTickets,
  saveTicket,
  createNewTicket,
  duplicateTicket,
  deleteTicket,
} from '../../services/ticketStorage.ts';
import { TicketRenderer } from './TicketRenderer.tsx';
import { TicketInspector } from './TicketInspector.tsx';
import { TicketBatchModal } from './TicketBatchModal.tsx';
import {
  Plus,
  Download,
  Printer,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  FileImage,
  Palette,
  Check,
  Edit2,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface TicketStudioProps {
  onOpenBrandingKit: () => void;
  brandingOrganizationName?: string;
}

export const TicketStudio: React.FC<TicketStudioProps> = ({
  onOpenBrandingKit,
  brandingOrganizationName,
}) => {
  const [tickets, setTickets] = useState<TicketProject[]>(() => loadAllTickets());
  const [currentTicketId, setCurrentTicketId] = useState<string>(() => tickets[0]?.id || '');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [tempTitle, setTempTitle] = useState<string>('');

  const ticketContainerRef = useRef<HTMLDivElement>(null);

  const currentTicket = tickets.find((t) => t.id === currentTicketId) || tickets[0];

  const handleUpdateCurrentTicket = (updates: Partial<TicketProject>) => {
    if (!currentTicket) return;
    const updated: TicketProject = {
      ...currentTicket,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleCreateNew = (type: TicketDocumentType = 'vip-invitation', theme: TicketStyleTheme = 'luxury-gold') => {
    const fresh = createNewTicket(type, theme);
    const all = loadAllTickets();
    setTickets(all);
    setCurrentTicketId(fresh.id);
  };

  const handleDuplicate = (id: string) => {
    const dup = duplicateTicket(id);
    if (dup) {
      setTickets(loadAllTickets());
      setCurrentTicketId(dup.id);
    }
  };

  const handleDelete = (id: string) => {
    if (tickets.length <= 1) return;
    const remaining = deleteTicket(id);
    setTickets(remaining);
    if (currentTicketId === id) {
      setCurrentTicketId(remaining[0]?.id || '');
    }
  };

  const twoPagesExportRef = useRef<HTMLDivElement>(null);

  // Straight 2-Page PDF export of current ticket (Page 1 Front, Page 2 Back)
  const handleDownloadPdf = async () => {
    if (!currentTicket) return;
    try {
      setIsExporting(true);
      setStatusMessage('Rendering Page 1: Front of ticket pass...');

      const frontEl = (twoPagesExportRef.current?.querySelector('.ticket-front-side-export') ||
        ticketContainerRef.current?.querySelector('.ticket-export-target')) as HTMLElement;
      const backEl = (twoPagesExportRef.current?.querySelector('.ticket-back-side-export') ||
        ticketContainerRef.current?.querySelector('.ticket-export-target')) as HTMLElement;

      if (!frontEl || !backEl) throw new Error('Ticket target elements not found');

      // 1. Render Front Side
      const frontCanvas = await html2canvas(frontEl, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
      });
      const frontImg = frontCanvas.toDataURL('image/png', 1.0);

      const isLandscape = currentTicket.orientation === 'landscape';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: isLandscape ? [210, 100] : [120, 190],
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Add Page 1 (Front)
      pdf.addImage(frontImg, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      // 2. Render Page 2 (Back)
      setStatusMessage('Rendering Page 2: Back of ticket pass...');
      pdf.addPage([pdfWidth, pdfHeight], isLandscape ? 'landscape' : 'portrait');

      const backCanvas = await html2canvas(backEl, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
      });
      const backImg = backCanvas.toDataURL('image/png', 1.0);

      // Add Page 2 (Back)
      pdf.addImage(backImg, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      const filename = `${currentTicket.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_front_and_back.pdf`;
      pdf.save(filename);

      setStatusMessage('Downloaded 2-page PDF (Front & Back) successfully!');
      setTimeout(() => {
        setIsExporting(false);
        setStatusMessage('');
      }, 1500);
    } catch (err) {
      console.error('PDF export failed:', err);
      setIsExporting(false);
      setStatusMessage('');
      window.print();
    }
  };

  // Download High-Res PNG
  const handleDownloadPng = async () => {
    if (!ticketContainerRef.current || !currentTicket) return;
    try {
      setIsExporting(true);
      setStatusMessage('Generating high-resolution PNG image...');

      const targetEl = ticketContainerRef.current.querySelector('.ticket-export-target') as HTMLElement;
      if (!targetEl) throw new Error('Target element not found');

      const canvas = await html2canvas(targetEl, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imgData;
      a.download = `${currentTicket.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStatusMessage('PNG downloaded!');
      setTimeout(() => {
        setIsExporting(false);
        setStatusMessage('');
      }, 1200);
    } catch (e) {
      console.error('PNG export failed:', e);
      setIsExporting(false);
      setStatusMessage('');
    }
  };

  if (!currentTicket) {
    return <div className="p-8 text-white">Loading tickets studio...</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0b0e] text-neutral-100 overflow-hidden font-sans">
      {/* Studio Header Bar */}
      <div className="min-h-13 h-auto py-2 bg-[#111114] border-b border-[#222228] px-3 sm:px-5 flex flex-wrap items-center justify-between gap-2.5 select-none shrink-0 z-20">
        {/* Title & Document Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          <select
            value={currentTicketId}
            onChange={(e) => setCurrentTicketId(e.target.value)}
            className="bg-[#181820] border border-[#2e2e3a] text-xs font-semibold text-amber-400 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 max-w-[170px] sm:max-w-[220px] truncate min-h-[34px]"
          >
            {tickets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
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
                    handleUpdateCurrentTicket({ title: tempTitle || currentTicket.title });
                    setIsEditingTitle(false);
                  }
                }}
                className="bg-[#181820] border border-amber-400 rounded px-2 py-1 text-xs text-white focus:outline-none w-36 sm:w-48"
                autoFocus
              />
              <button
                onClick={() => {
                  handleUpdateCurrentTicket({ title: tempTitle || currentTicket.title });
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
                setTempTitle(currentTicket.title);
                setIsEditingTitle(true);
              }}
              className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white max-w-[120px] sm:max-w-[180px] truncate"
            >
              <span className="font-semibold truncate">{currentTicket.title}</span>
              <Edit2 className="w-3 h-3 text-neutral-500 shrink-0" />
            </button>
          )}

          <button
            onClick={() => handleCreateNew()}
            className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 px-2 py-1.5 rounded hover:bg-neutral-800 transition-colors whitespace-nowrap min-h-[34px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Pass</span>
          </button>
        </div>

        {/* Center Template Picker Quick Dropdown */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="text-[11px] text-neutral-400 hidden sm:inline">Theme:</span>
          <select
            value={currentTicket.theme}
            onChange={(e) =>
              handleUpdateCurrentTicket({ theme: e.target.value as TicketStyleTheme })
            }
            className="bg-[#181820] border border-[#2e2e3a] text-xs font-semibold text-white rounded px-2.5 py-1.5 focus:outline-none min-h-[34px]"
          >
            <option value="luxury-gold">Luxury Gold</option>
            <option value="modern-minimalist">Modern Minimalist</option>
            <option value="hollywood-premiere">Hollywood Premiere</option>
            <option value="royal-elegance">Royal Elegance</option>
            <option value="neon-futuristic">Neon &amp; Futuristic</option>
            <option value="corporate-professional">Corporate Professional</option>
            <option value="concert-music">Concert &amp; Music</option>
            <option value="classic-vintage">Classic Vintage</option>
            <option value="black-tie">Black Tie</option>
            <option value="exclusive-vip">Exclusive VIP</option>
            <option value="creative-artistic">Creative &amp; Artistic</option>
          </select>
        </div>

        {/* Actions & Export */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full py-0.5 shrink-0">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-[#181820] border border-[#2e2e3a] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
              className="p-1 hover:text-white text-neutral-400"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1 text-[10px] font-mono text-neutral-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="p-1 hover:text-white text-neutral-400"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              className="px-1.5 py-0.5 text-[10px] text-amber-400 hover:text-white"
            >
              100%
            </button>
          </div>

          {/* Batch Generator */}
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1c1c24] hover:bg-[#282834] text-neutral-200 hover:text-white border border-[#333342] rounded-lg transition-colors whitespace-nowrap min-h-[34px]"
            title="Generate numbered batches of tickets with guest lists"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Batch Pass Generator</span>
            <span className="sm:hidden">Batch</span>
          </button>

          {/* Duplicate & Delete */}
          <button
            onClick={() => handleDuplicate(currentTicket.id)}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded min-h-[34px] min-w-[34px] flex items-center justify-center"
            title="Duplicate Pass"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleDelete(currentTicket.id)}
            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded min-h-[34px] min-w-[34px] flex items-center justify-center"
            title="Delete Pass"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Export PNG */}
          <button
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1c1c24] hover:bg-[#282834] text-neutral-200 hover:text-white border border-[#333342] rounded-lg transition-colors whitespace-nowrap min-h-[34px]"
            title="Download high-resolution image"
          >
            <FileImage className="w-3.5 h-3.5 text-amber-400" />
            <span>PNG</span>
          </button>

          {/* DOWNLOAD PDF STRAIGHT */}
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

      {/* Main Studio Split (Canvas + Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center Live Canvas */}
        <div
          ref={ticketContainerRef}
          className="flex-1 overflow-auto bg-[#08080a] p-8 flex items-center justify-center relative"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Scaled Ticket Container */}
          <div
            className="ticket-export-target transition-transform duration-100 ease-out origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <TicketRenderer ticket={currentTicket} isPrintMode={previewMode} />
          </div>
        </div>

        {/* Right Customization Inspector */}
        <TicketInspector
          ticket={currentTicket}
          onUpdateTicket={handleUpdateCurrentTicket}
          onApplyBranding={() => {
            if (brandingOrganizationName) {
              handleUpdateCurrentTicket({ hostOrganization: brandingOrganizationName });
            } else {
              onOpenBrandingKit();
            }
          }}
        />
      </div>

      {/* Batch Generator Modal */}
      <TicketBatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        baseTicket={currentTicket}
      />

      {/* Offscreen 2-Page Render Targets for pristine Front & Back PDF capture */}
      <div
        ref={twoPagesExportRef}
        className="fixed -left-[9999px] top-0 pointer-events-none opacity-100 z-[-99]"
        aria-hidden="true"
      >
        <div className="ticket-front-side-export">
          <TicketRenderer ticket={{ ...currentTicket, showBackSide: false }} isPrintMode={true} />
        </div>
        <div className="ticket-back-side-export">
          <TicketRenderer ticket={{ ...currentTicket, showBackSide: true }} isPrintMode={true} />
        </div>
      </div>
    </div>
  );
};
