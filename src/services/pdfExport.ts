import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { NewspaperProject } from '../types/newspaper.ts';

const MODERN_COLOR_RE = /(oklch|oklab|lch|lab|color-mix|color\()/i;

/**
 * Resolves any modern CSS color expression (oklch, oklab, color-mix, etc.)
 * into standard hex/rgb using a 1x1 2D canvas context so html2canvas never throws.
 */
function resolveColorToRgb(
  ctx: CanvasRenderingContext2D | null,
  value: string,
  fallback: string
): string {
  if (!value || !MODERN_COLOR_RE.test(value)) return value;
  if (!ctx) return fallback;
  try {
    ctx.fillStyle = fallback;
    ctx.fillStyle = value;
    const resolved = ctx.fillStyle;
    if (typeof resolved === 'string' && !MODERN_COLOR_RE.test(resolved)) {
      return resolved;
    }
  } catch {
    // fallback below
  }
  return fallback;
}

/**
 * Normalizes all modern CSS colors (like oklch / oklab / color-mix in Tailwind v4)
 * to standard RGB/Hex on cloned DOM nodes and strips CSS color functions from <style> tags.
 */
function sanitizeNodeColors(root: HTMLElement, ctx: CanvasRenderingContext2D | null) {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];

  for (const el of elements) {
    const computed = window.getComputedStyle(el);
    const props = [
      'color',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderBottomColor',
      'borderLeftColor',
      'borderRightColor',
      'outlineColor',
      'textDecorationColor',
    ];

    for (const prop of props) {
      const val = (computed as any)[prop];
      if (typeof val === 'string' && MODERN_COLOR_RE.test(val)) {
        const fallback = prop.toLowerCase().includes('background') ? '#faf7f0' : '#1a1918';
        (el.style as any)[prop] = resolveColorToRgb(ctx, val, fallback);
      }
    }

    if (typeof computed.boxShadow === 'string' && MODERN_COLOR_RE.test(computed.boxShadow)) {
      el.style.boxShadow = 'none';
    }
    if (typeof computed.backgroundImage === 'string' && MODERN_COLOR_RE.test(computed.backgroundImage)) {
      el.style.backgroundImage = 'none';
    }
  }
}

async function waitForImagesAndFonts(container: HTMLElement): Promise<void> {
  try {
    if (document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    }
  } catch {
    // ignore
  }

  const imgs = Array.from(container.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const timer = setTimeout(resolve, 3500);
          img.addEventListener(
            'load',
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true }
          );
          img.addEventListener(
            'error',
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true }
          );
        })
    )
  );
}

function triggerSinglePdfDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, 8000);
}

/**
 * Exports a newspaper project straight to a multi-page PDF and triggers a clean download
 * across desktop browsers, mobile browsers, PWAs, and iframe sandboxes.
 */
export async function downloadProjectPdf(
  project: NewspaperProject,
  containerElement: HTMLElement | null,
  onProgress?: (status: string) => void
): Promise<boolean> {
  try {
    onProgress?.('Preparing broadsheet pages...');

    let targetPages: HTMLElement[] = [];
    if (containerElement) {
      targetPages = Array.from(
        containerElement.querySelectorAll<HTMLElement>('.export-page-target')
      );
      if (!targetPages.length) {
        targetPages = Array.from(
          containerElement.querySelectorAll<HTMLElement>('.newsprint-paper')
        );
      }
    }

    if (!targetPages.length) {
      targetPages = Array.from(
        document.querySelectorAll<HTMLElement>('.export-page-target, .newsprint-paper')
      );
    }

    if (!targetPages.length) {
      throw new Error('No printable pages found.');
    }

    if (containerElement) {
      await waitForImagesAndFonts(containerElement);
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const safeScale = Math.min(1.6, Math.max(1.25, window.devicePixelRatio || 1.35));

    const dummyCanvas = document.createElement('canvas');
    dummyCanvas.width = 1;
    dummyCanvas.height = 1;
    const colorCtx = dummyCanvas.getContext('2d');

    let renderedPagesCount = 0;

    for (let i = 0; i < targetPages.length; i++) {
      onProgress?.(`Rendering broadsheet page ${i + 1} of ${targetPages.length}...`);
      const pageEl = targetPages[i];

      try {
        const canvas = await html2canvas(pageEl, {
          scale: safeScale,
          useCORS: true,
          allowTaint: false,
          imageTimeout: 10000,
          logging: false,
          backgroundColor: '#faf7f0',
          onclone: (clonedDoc, clonedTarget) => {
            // Strip Tailwind v4 modern CSS color functions from cloned style sheets
            clonedDoc.querySelectorAll('style').forEach((s) => {
              if (s.textContent && MODERN_COLOR_RE.test(s.textContent)) {
                s.textContent = s.textContent
                  .replace(/oklch\([^)]+\)/gi, '#2b2926')
                  .replace(/oklab\([^)]+\)/gi, '#2b2926')
                  .replace(/color-mix\([^)]+\)/gi, '#2b2926')
                  .replace(/lch\([^)]+\)/gi, '#2b2926')
                  .replace(/lab\([^)]+\)/gi, '#2b2926');
              }
            });

            // Force ancestor containers to full opacity and visible layout so capture is never blank
            let anc: HTMLElement | null = clonedTarget;
            while (anc && anc !== clonedDoc.body) {
              anc.style.opacity = '1';
              anc.style.visibility = 'visible';
              anc = anc.parentElement;
            }

            if (clonedTarget) {
              sanitizeNodeColors(clonedTarget, colorCtx);
            }
            const extraTargets = clonedDoc.querySelectorAll<HTMLElement>(
              '.export-page-target, .newsprint-paper'
            );
            extraTargets.forEach((t) => {
              t.style.opacity = '1';
              sanitizeNodeColors(t, colorCtx);
            });
          },
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        if (renderedPagesCount > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        renderedPagesCount++;
      } catch (pageErr) {
        console.error(`Page ${i + 1} PDF render warning:`, pageErr);
      }
    }

    if (renderedPagesCount === 0) {
      throw new Error('Could not render any broadsheet pages into PDF.');
    }

    onProgress?.('Finalizing PDF download...');
    const safeTitle = (project?.title || 'mjj_broadsheet')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const fileName = `${safeTitle || 'mjj_broadsheet'}_broadsheet.pdf`;

    const pdfBlob = pdf.output('blob');
    triggerSinglePdfDownload(pdfBlob, fileName);

    onProgress?.('PDF saved successfully!');
    return true;
  } catch (err) {
    console.error('PDF export failure:', err);
    onProgress?.('PDF export failed. Please try again.');
    return false;
  }
}
