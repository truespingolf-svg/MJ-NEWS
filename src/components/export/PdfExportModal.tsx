import React, { useState, useRef } from 'react';
import { NewspaperProject } from '../../types/newspaper.ts';
import { NewspaperPageRenderer } from '../canvas/NewspaperPageRenderer.tsx';
import { downloadProjectPdf } from '../../services/pdfExport.ts';
import {
  X,
  Printer,
  Download,
  FileCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  Layers,
} from 'lucide-react';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: NewspaperProject;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const printPagesContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Direct native browser print
  const handleNativePrint = () => {
    window.print();
  };

  // Generate multi-page PDF straight via service
  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    setExportSuccess(false);

    const success = await downloadProjectPdf(
      project,
      printPagesContainerRef.current,
      (status) => setProgressText(status)
    );

    setIsGenerating(false);
    if (success) {
      setExportSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-neutral-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-pdf-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 id="export-pdf-title" className="text-lg font-semibold tracking-tight text-white">
                Export Newspaper ({project.pages.length} {project.pages.length === 1 ? 'Page' : 'Pages'})
              </h2>
              <p className="text-xs text-neutral-400">
                Print-ready PDF export in authentic broadsheet format without editing chrome.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Callout Bar */}
        <div className="px-6 py-3 bg-neutral-950/80 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleNativePrint}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg border border-neutral-700 transition-colors"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              Print / Save as PDF (Vector Sharp)
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-black rounded-lg shadow-md transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF File (.pdf)
                </>
              )}
            </button>
          </div>

          {progressText && (
            <span className="text-xs text-amber-300 flex items-center gap-1.5 font-medium animate-pulse">
              {exportSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : null}
              {progressText}
            </span>
          )}
        </div>

        {/* Scrollable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-950/90 flex flex-col items-center gap-8">
          <div className="text-center">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest block">
              Sequential Broadsheet Pages Preview
            </span>
            <p className="text-xs text-neutral-500 mt-0.5">
              Review all {project.pages.length} pages in the exact order they will appear in your publication.
            </p>
          </div>

          {/* Sequential Pages Container */}
          <div ref={printPagesContainerRef} className="space-y-8 flex flex-col items-center">
            {project.pages.map((page, idx) => (
              <div
                key={page.id}
                className="export-page-target newspaper-print-page bg-white shadow-2xl rounded-sm overflow-hidden"
              >
                <NewspaperPageRenderer
                  page={page}
                  selectedElementId={null}
                  selectedImageSlot={null}
                  onSelectText={() => {}}
                  onSelectImage={() => {}}
                  previewMode={true}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Dimensions: Standard Broadsheet / Tabloid (A4 Proportionate)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-neutral-300 hover:text-white rounded bg-neutral-800 hover:bg-neutral-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
