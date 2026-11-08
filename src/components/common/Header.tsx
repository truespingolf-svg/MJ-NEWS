import React, { useState } from 'react';
import {
  Newspaper,
  ChevronLeft,
  Printer,
  Download,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Edit2,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  projectTitle: string;
  onUpdateTitle: (newTitle: string) => void;
  onBackToDashboard: () => void;
  zoomLevel: number;
  onSetZoom: (zoom: number) => void;
  previewMode: boolean;
  onTogglePreviewMode: () => void;
  onDownloadPdfStraight: () => void;
  onPrintClick: () => void;
  isExportingPdf?: boolean;
  exportProgressText?: string;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  pageCount: number;
  onOpenPublishModal?: () => void;
  onOpenFlipbookPreview?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectTitle,
  onUpdateTitle,
  onBackToDashboard,
  zoomLevel,
  onSetZoom,
  previewMode,
  onTogglePreviewMode,
  onDownloadPdfStraight,
  onPrintClick,
  isExportingPdf = false,
  exportProgressText = '',
  saveStatus,
  pageCount,
  onOpenPublishModal,
  onOpenFlipbookPreview,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectTitle);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    } else {
      setTempTitle(projectTitle);
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="min-h-14 h-auto py-2 bg-neutral-950 border-b border-neutral-800 px-3 sm:px-5 flex flex-wrap items-center justify-between gap-2.5 text-neutral-100 select-none z-30 shrink-0">
      {/* Zone 1: Brand & Back to Dashboard */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onBackToDashboard}
          aria-label="Back to dashboard"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors min-h-[36px]"
        >
          <ChevronLeft className="w-4 h-4 text-amber-400" />
          <span>Dashboard</span>
        </button>

        <div className="h-4 w-[1px] bg-neutral-800" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Newspaper className="w-4 h-4" />
          </div>
          <span className="font-serif font-bold text-xs sm:text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
            MJ STUDIO
            <span className="text-[10px] font-sans font-medium px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hidden sm:inline">
              Broadsheet
            </span>
          </span>
        </div>
      </div>

      {/* Zone 2: Project Title & Auto-Save status */}
      <div className="flex items-center gap-2 max-w-[180px] sm:max-w-xs md:max-w-md truncate">
        {isEditingTitle ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              onBlur={handleTitleSubmit}
              autoFocus
              className="px-2 py-1 bg-neutral-900 border border-amber-400 rounded text-xs text-white focus:outline-none w-44 sm:w-64"
            />
            <button
              onClick={handleTitleSubmit}
              className="p-1 rounded bg-amber-400 text-black hover:bg-amber-300"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setTempTitle(projectTitle);
              setIsEditingTitle(true);
            }}
            className="group flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-900 text-xs font-medium text-neutral-200 transition-colors"
            title="Click to rename newspaper"
          >
            <span className="truncate max-w-[120px] sm:max-w-[200px]">{projectTitle}</span>
            <Edit2 className="w-3 h-3 text-neutral-500 group-hover:text-amber-400 transition-colors shrink-0" />
          </button>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 shrink-0">
          <span>•</span>
          {saveStatus === 'saving' ? (
            <span className="text-amber-400">Saving...</span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Zone 3: Canvas Controls, Publishing, 3D Flipbook, and Export PDF */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 shrink-0">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs text-neutral-300">
          <button
            onClick={() => onSetZoom(Math.max(0.5, zoomLevel - 0.1))}
            aria-label="Zoom out"
            className="p-1.5 hover:text-white hover:bg-neutral-800 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="px-1.5 font-mono text-[11px] text-neutral-400 min-w-[38px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            onClick={() => onSetZoom(Math.min(1.6, zoomLevel + 0.1))}
            aria-label="Zoom in"
            className="p-1.5 hover:text-white hover:bg-neutral-800 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSetZoom(0.85)}
            aria-label="Fit to screen"
            className="px-1.5 py-1 text-[10px] text-amber-400 hover:text-white hover:bg-neutral-800 rounded font-medium"
            title="Fit to Screen"
          >
            Fit
          </button>
        </div>

        {/* 3D Flipbook Preview Button */}
        {onOpenFlipbookPreview && (
          <button
            onClick={onOpenFlipbookPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-500/40 bg-neutral-900 text-amber-300 hover:bg-neutral-800 transition-colors shadow-sm whitespace-nowrap min-h-[36px]"
            title="Preview Newspaper in 3D Flipbook Mode"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>3D Flipbook Preview</span>
          </button>
        )}

        {/* Publish as Current Paper Button */}
        {onOpenPublishModal && (
          <button
            onClick={onOpenPublishModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-md transition-all font-sans whitespace-nowrap min-h-[36px]"
            title="Publish this broadsheet to the public portal with broadcast timer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Publish Current Paper</span>
          </button>
        )}

        {/* Print Broadsheet Shortcut */}
        <button
          onClick={onPrintClick}
          aria-label="Print Broadsheet"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors whitespace-nowrap min-h-[36px]"
          title="Print / Save as PDF via Browser"
        >
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span>Print</span>
        </button>

        {/* DOWNLOAD PDF BUTTON (DOWNLOADS STRAIGHT) */}
        <button
          onClick={onDownloadPdfStraight}
          disabled={isExportingPdf}
          aria-label="Download PDF"
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 disabled:opacity-75 text-black rounded-lg shadow-md transition-all font-sans whitespace-nowrap min-h-[36px]"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isExportingPdf ? (exportProgressText || 'Downloading PDF...') : 'DOWNLOAD PDF'}</span>
        </button>
      </div>
    </header>
  );
};
