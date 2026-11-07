import React, { useState } from 'react';
import { TicketProject } from '../../types/ticket.ts';
import { TicketRenderer } from './TicketRenderer.tsx';
import { X, Printer, Download, Sparkles, Plus, Copy } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface TicketBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseTicket: TicketProject;
}

export const TicketBatchModal: React.FC<TicketBatchModalProps> = ({
  isOpen,
  onClose,
  baseTicket,
}) => {
  const [quantity, setQuantity] = useState<number>(4);
  const [prefix, setPrefix] = useState<string>('NXP-VIP');
  const [startNumber, setStartNumber] = useState<number>(1001);
  const [guestListText, setGuestListText] = useState<string>(
    'Hon. Alexandra Vance\nMarcus Sterling\nDr. Edward Montgomery\nEleanor Kensington\nVictoria Cross\nJulian Vance'
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  if (!isOpen) return null;

  const guestNames = guestListText
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  // Generate batch tickets
  const batchTickets: TicketProject[] = [];
  for (let i = 0; i < quantity; i++) {
    const num = `${prefix}-${startNumber + i}`;
    const name = guestNames[i] || `VIP Guest ${i + 1}`;
    batchTickets.push({
      ...baseTicket,
      id: `batch-${i}-${Date.now()}`,
      ticketNumber: num,
      guestName: name,
      qrPayload: `${num}|${name}|${baseTicket.ticketCategory}|${baseTicket.eventTitle}`,
      seatNumber: `Tier A • Seat ${String(i + 1).padStart(2, '0')}`,
    });
  }

  // Handle direct PDF export of batch sheet
  const handleExportBatchPdf = async () => {
    try {
      setIsExporting(true);
      setStatusMessage('Rendering print sheet...');

      const target = document.getElementById('batch-print-grid');
      if (!target) throw new Error('Grid container not found');

      const canvas = await html2canvas(target, {
        scale: 2,
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
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 287), undefined, 'FAST');

      const filename = `${baseTicket.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_batch_passes.pdf`;
      pdf.save(filename);

      setStatusMessage('Downloaded batch PDF successfully!');
      setTimeout(() => {
        setIsExporting(false);
        setStatusMessage('');
      }, 1500);
    } catch (err) {
      console.error('Batch export failed:', err);
      setStatusMessage('Export error. Using browser print...');
      setTimeout(() => {
        window.print();
        setIsExporting(false);
        setStatusMessage('');
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121216] border border-[#2b2b36] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#2b2b36] flex items-center justify-between bg-[#0e0e12]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Batch Ticket &amp; Multi-Pass Generator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-12 gap-6">
          {/* Controls (4 cols) */}
          <div className="col-span-4 space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Batch Quantity
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[2, 4, 6, 8].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    className={`py-1.5 rounded font-bold transition-colors ${
                      quantity === q
                        ? 'bg-amber-400 text-black'
                        : 'bg-[#1c1c24] text-neutral-300 hover:bg-[#282834]'
                    }`}
                  >
                    {q} Passes
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Serial Prefix
                </label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  className="w-full bg-[#181820] border border-[#2e2e3a] rounded p-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Start Number
                </label>
                <input
                  type="number"
                  value={startNumber}
                  onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-[#181820] border border-[#2e2e3a] rounded p-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Guest Names List (1 per line)
              </label>
              <textarea
                rows={5}
                value={guestListText}
                onChange={(e) => setGuestListText(e.target.value)}
                className="w-full bg-[#181820] border border-[#2e2e3a] rounded p-2 text-neutral-200 font-sans leading-relaxed"
                placeholder="Enter names..."
              />
            </div>

            <div className="pt-2 border-t border-[#222228] space-y-2">
              <button
                onClick={handleExportBatchPdf}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-lg shadow-md transition-all text-xs"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{isExporting ? (statusMessage || 'Generating PDF...') : 'Download Printable Batch PDF'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#1e1e26] hover:bg-[#282834] text-neutral-200 hover:text-white rounded-lg transition-colors text-xs border border-[#333342]"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Multi-Pass Sheet</span>
              </button>
            </div>
          </div>

          {/* Preview Grid (8 cols) */}
          <div className="col-span-8 flex flex-col bg-[#08080a] p-4 rounded-xl border border-[#22222a] overflow-hidden">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">
              Print Sheet Layout ({quantity} passes on A4 sheet)
            </span>
            <div className="flex-1 overflow-y-auto max-h-[500px] p-2 flex justify-center">
              <div
                id="batch-print-grid"
                className="bg-white p-6 rounded shadow flex flex-col gap-6 origin-top"
                style={{ width: '800px', transform: 'scale(0.68)', transformOrigin: 'top center' }}
              >
                {batchTickets.map((t) => (
                  <div key={t.id} className="border border-neutral-300 p-2 rounded">
                    <TicketRenderer ticket={t} className="shadow-none" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
