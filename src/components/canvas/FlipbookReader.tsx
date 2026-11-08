import React, { useState, useEffect } from 'react';
import { NewspaperProject } from '../../types/newspaper.ts';
import { NewspaperPageRenderer } from './NewspaperPageRenderer.tsx';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Volume2,
  Gift,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PromoCodeItem {
  id: string;
  code: string;
  projectId?: string;
  projectTitle?: string;
  pageIndex?: number | string;
  probability?: number;
  customMessage?: string;
}

interface FlipbookReaderProps {
  project: NewspaperProject;
  onClose: () => void;
  activePromoCodes?: PromoCodeItem[];
  onNavigateToRedeem?: (code: string) => void;
}

export const FlipbookReader: React.FC<FlipbookReaderProps> = ({
  project,
  onClose,
  activePromoCodes = [],
  onNavigateToRedeem,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(0.75);
  const [discoveredCode, setDiscoveredCode] = useState<string | null>(null);
  const [discoveredMessage, setDiscoveredMessage] = useState<string>('');
  const [pageFlipping, setPageFlipping] = useState<boolean>(false);
  const [fetchedCodes, setFetchedCodes] = useState<PromoCodeItem[]>([]);
  const [copiedToast, setCopiedToast] = useState<string>('');

  const [dismissedCodes, setDismissedCodes] = useState<Set<string>>(new Set());

  const totalPages = project.pages?.length || 1;
  const currentPage = project.pages?.[currentPageIndex] || project.pages?.[0];

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch {
      // ignore
    }
  };

  // Auto-fit zoom calculation for tablets (iPads) and desktops so broadsheet is never cut off
  const calculateAutoFitZoom = () => {
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth <= 1024;
    const availWidth = window.innerWidth - (isMobile ? 24 : isTablet ? 60 : 160);
    const availHeight = window.innerHeight - (isMobile ? 120 : 130);
    const scaleW = availWidth / 820;
    const scaleH = availHeight / 1060;
    const ideal = Math.min(scaleW, scaleH);
    return Math.max(0.45, Math.min(1.15, Number(ideal.toFixed(2))));
  };

  useEffect(() => {
    setZoom(calculateAutoFitZoom());
    const handleResize = () => setZoom(calculateAutoFitZoom());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch latest promo codes from database fallback (Real-time sync)
  const fetchCodesFromApi = async () => {
    try {
      const res = await fetch('/api/public/data');
      if (res.ok) {
        const data = await res.json();
        if (data.promoCodes && Array.isArray(data.promoCodes)) {
          setFetchedCodes(data.promoCodes);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCodesFromApi();
    const interval = setInterval(fetchCodesFromApi, 2500);
    return () => clearInterval(interval);
  }, []);

  // Check if a hidden code triggers immediately when landing on this page
  useEffect(() => {
    setDiscoveredCode(null);
    setDiscoveredMessage('');

    const sourceCodes = activePromoCodes.length > 0 ? activePromoCodes : fetchedCodes;
    if (!sourceCodes || sourceCodes.length === 0) return;

    const currentDocId = project.id || (project as any).projectId || '';
    const currentDocTitle = (project.title || '').toLowerCase().trim();

    // Find codes for this project (or 'all') and this page index
    const matchingCodes = sourceCodes.filter((c) => {
      const cProj = (c.projectId || 'all').toLowerCase();
      const projMatch =
        cProj === 'all' ||
        cProj === currentDocId.toLowerCase() ||
        (c.projectTitle && currentDocTitle.includes(c.projectTitle.toLowerCase())) ||
        (currentDocTitle && cProj.includes(currentDocTitle));

      const pageNum = Number(c.pageIndex);
      const targetPage = currentPageIndex + 1; // 1-indexed page
      const pageMatch =
        c.pageIndex === undefined ||
        c.pageIndex === null ||
        c.pageIndex === 'all' ||
        pageNum === 0 ||
        pageNum === targetPage;

      return projMatch && pageMatch;
    });

    if (matchingCodes.length > 0) {
      const selected = matchingCodes[0];
      // If user already copied or dismissed this code, do not re-show
      if (dismissedCodes.has(selected.code)) return;

      setDiscoveredCode(selected.code);
      if (selected.customMessage) {
        setDiscoveredMessage(selected.customMessage);
      }
      // Confetti effect when secret code discovered!
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
        });
      } catch {
        // confetti fallback
      }
    }
  }, [currentPageIndex, project.id, (project as any).projectId, project.title, activePromoCodes, fetchedCodes, dismissedCodes]);

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setPageFlipping(true);
      setTimeout(() => {
        setCurrentPageIndex((prev) => prev - 1);
        setPageFlipping(false);
      }, 180);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setPageFlipping(true);
      setTimeout(() => {
        setCurrentPageIndex((prev) => prev + 1);
        setPageFlipping(false);
      }, 180);
    }
  };

  const handleDismissCode = (codeStr: string) => {
    setDismissedCodes((prev) => new Set(prev).add(codeStr));
    setDiscoveredCode(null);
  };

  const handleCopyCode = (codeStr: string) => {
    setDismissedCodes((prev) => new Set(prev).add(codeStr));
    setDiscoveredCode(null); // Goes away immediately as requested!

    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(codeStr).catch(() => {
          fallbackCopyText(codeStr);
        });
      } else {
        fallbackCopyText(codeStr);
      }
    } catch {
      fallbackCopyText(codeStr);
    }

    setCopiedToast(`Secret Code "${codeStr}" Copied to Clipboard!`);
    setTimeout(() => setCopiedToast(''), 3500);
  };

  const handleClaimDirectly = (codeStr: string) => {
    setDismissedCodes((prev) => new Set(prev).add(codeStr));
    setDiscoveredCode(null);
    onClose(); // Close flipbook so user is right on the Redeem Modal!
    if (onNavigateToRedeem) {
      onNavigateToRedeem(codeStr);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070709]/95 backdrop-blur-md text-neutral-100 flex flex-col select-none overflow-hidden font-sans">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-black px-5 py-2.5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 shadow-emerald-500/20">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* DISCOVERED SECRET CODE OVERLAY POPUP */}
      {discoveredCode && (
        <div className="fixed top-16 right-3 sm:right-6 z-50 bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 text-black p-5 sm:p-6 rounded-3xl shadow-[0_0_50px_rgba(251,191,36,0.9)] border-4 border-amber-200 max-w-sm w-[92vw] sm:w-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-950 stroke-[2.5]" />
              <span className="font-serif font-black text-xs uppercase tracking-wider text-amber-950">
                SECRET REWARD CODE DISCOVERED!
              </span>
            </div>
            <button
              onClick={() => handleDismissCode(discoveredCode)}
              className="text-amber-950 hover:text-black font-bold p-1 text-base leading-none cursor-pointer"
              title="Dismiss"
              aria-label="Dismiss code alert"
            >
              ✕
            </button>
          </div>

          <p className="text-[12px] font-sans font-semibold text-amber-950 mb-3 leading-snug">
            {discoveredMessage || 'You unlocked a secret reward code while reading this newspaper! Click copy code below to claim it on Discord.'}
          </p>

          <div className="bg-amber-950 text-amber-300 p-3 rounded-2xl font-mono text-base font-bold tracking-widest text-center mb-3 flex items-center justify-between shadow-inner">
            <span className="select-all px-1">{discoveredCode}</span>
            <button
              onClick={() => handleCopyCode(discoveredCode)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy code to clipboard and dismiss popup"
            >
              <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>COPY CODE</span>
            </button>
          </div>

          {onNavigateToRedeem && (
            <button
              onClick={() => handleClaimDirectly(discoveredCode)}
              className="w-full py-2 bg-black/90 hover:bg-black text-amber-300 hover:text-amber-200 rounded-xl text-xs font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Claim Code Now In Rewards Modal →</span>
            </button>
          )}
        </div>
      )}

      {/* Top Reader Header Chrome */}
      <div className="min-h-14 h-auto py-2 bg-[#111116] border-b border-[#22222c] px-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 z-30 shrink-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xs sm:text-base text-white tracking-wide truncate max-w-[170px] sm:max-w-xs">
              {project.title}
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-neutral-400 font-mono">
              <span className="text-amber-400 font-semibold">3D FLIPBOOK</span>
              <span>•</span>
              <span className="text-neutral-300">
                Page {currentPageIndex + 1} of {totalPages}
              </span>
            </div>
          </div>
        </div>

        {/* Center Page Stepper - Large Touch Targets for iPads */}
        <div className="flex items-center gap-1 sm:gap-2 bg-[#181820] border border-[#2e2e3e] rounded-xl px-2 sm:px-3 py-1 shrink-0">
          <button
            onClick={handlePrevPage}
            disabled={currentPageIndex === 0}
            className="p-1.5 hover:text-amber-400 disabled:opacity-25 disabled:hover:text-white transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
            title="Previous Page (Arrow Left)"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-mono font-semibold px-1.5 min-w-[50px] text-center text-neutral-200">
            {currentPageIndex + 1} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPageIndex === totalPages - 1}
            className="p-1.5 hover:text-amber-400 disabled:opacity-25 disabled:hover:text-white transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
            title="Next Page (Arrow Right)"
            aria-label="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Controls: Zoom, Auto-Fit, Fullscreen, Close */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-[#181820] border border-[#2e2e3e] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.08).toFixed(2))))}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              -
            </button>
            <span className="px-1 text-[10px] font-mono text-neutral-300 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.08).toFixed(2))))}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              title="Zoom In"
              aria-label="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => setZoom(calculateAutoFitZoom())}
              className="px-2 py-1 text-[10px] font-bold text-amber-400 hover:text-black hover:bg-amber-400 rounded transition-all font-mono"
              title="Auto-Fit Page to Screen"
            >
              Fit
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-neutral-400 hover:text-white bg-[#181820] border border-[#2e2e3e] rounded-lg hidden md:block transition-colors"
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center font-bold text-xs"
            title="Close Flipbook"
            aria-label="Close Flipbook"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Flipbook Canvas Stage */}
      <div className="flex-1 overflow-auto bg-[#08080b] p-2 sm:p-6 flex flex-col items-center justify-start relative">
        {/* Background Grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(212,175,55,0.4) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Left Arrow Button - iPad Touch Target */}
        <button
          onClick={handlePrevPage}
          disabled={currentPageIndex === 0}
          className="fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 z-40 p-3 sm:p-4 rounded-2xl bg-[#14141c]/90 hover:bg-amber-400 hover:text-black text-white border border-[#2e2e3e] shadow-2xl transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
        </button>

        {/* Right Arrow Button - iPad Touch Target */}
        <button
          onClick={handleNextPage}
          disabled={currentPageIndex === totalPages - 1}
          className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-40 p-3 sm:p-4 rounded-2xl bg-[#14141c]/90 hover:bg-amber-400 hover:text-black text-white border border-[#2e2e3e] shadow-2xl transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
        </button>

        {/* 3D Paper Flip Container - Centered and Non-clipping */}
        <div
          className={`transition-all duration-300 ease-in-out origin-top relative shadow-[0_0_60px_rgba(0,0,0,0.85)] my-2 sm:my-4 ${
            pageFlipping ? '-rotate-y-30 scale-95 opacity-60' : 'rotate-y-0 scale-100 opacity-100'
          }`}
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Authentic Paper Page Shadow & Edge Spine */}
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/25 to-transparent z-20 pointer-events-none" />

          {/* Render Active Broadsheet Page */}
          {currentPage && (
            <div className="relative">
              <NewspaperPageRenderer
                page={currentPage}
                selectedElementId={null}
                selectedImageSlot={null}
                onSelectText={() => {}}
                onSelectImage={() => {}}
                previewMode={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Reader Footer Controls */}
      <div className="min-h-11 h-auto py-1.5 bg-[#111116] border-t border-[#22222c] px-4 sm:px-6 flex flex-wrap items-center justify-between text-xs text-neutral-400 font-mono shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span className="text-[11px]">REALISTIC BROADSHEET PHYSICS ACTIVE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-300 font-bold">PAGE {currentPageIndex + 1} OF {totalPages}</span>
        </div>
      </div>
    </div>
  );
};
