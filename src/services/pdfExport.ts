import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { NewspaperProject } from '../types/newspaper.ts';
import { sanitizeCssModernColors, hasModernCssColors } from '../utils/cssSanitize.ts';

/**
 * Resolves any modern CSS color expression (oklch, oklab, color-mix, etc.)
 * into standard hex/rgb using a 1x1 2D canvas context so html2canvas never throws.
 */
function resolveColorToRgb(
  ctx: CanvasRenderingContext2D | null,
  value: string,
  fallback: string
): string {
  if (!value || !hasModernCssColors(value)) return value;
  if (!ctx) return fallback;
  try {
    ctx.fillStyle = fallback;
    ctx.fillStyle = value;
    const resolved = ctx.fillStyle;
    if (typeof resolved === 'string' && !hasModernCssColors(resolved)) {
      return resolved;
    }
  } catch {
    // fallback below
  }
  return fallback;
}

/**
 * Collects all same-origin stylesheets (both <style> and Vite production <link rel="stylesheet">)
 * and sanitizes any Tailwind v4 oklch/oklab/color-mix rules so html2canvas can parse them cleanly.
 */
async function collectSanitizedStylesheets(): Promise<string> {
  const cssParts: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    const href = sheet.href;
    let isSameOrigin = true;
    if (href) {
      try {
        isSameOrigin = new URL(href, window.location.href).origin === window.location.origin;
      } catch {
        isSameOrigin = false;
      }
    }

    if (!isSameOrigin) {
      continue;
    }

    try {
      const rules = sheet.cssRules;
      if (rules && rules.length > 0) {
        const text = Array.from(rules)
          .map((r) => r.cssText)
          .join('\n');
        cssParts.push(sanitizeCssModernColors(text, '#2b2926'));
        continue;
      }
    } catch {
      // SecurityError or empty; try fetching same-origin CSS file below
    }

    if (href) {
      try {
        const resp = await fetch(href);
        if (resp.ok) {
          const raw = await resp.text();
          cssParts.push(sanitizeCssModernColors(raw, '#2b2926'));
        }
      } catch {
        // ignore unreachable sheet
      }
    }
  }

  return cssParts.join('\n');
}

/**
 * Normalizes all modern CSS colors (like oklch / oklab / color-mix in Tailwind v4)
 * to standard RGB/Hex on cloned DOM nodes.
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
      if (typeof val === 'string' && hasModernCssColors(val)) {
        const fallback = prop.toLowerCase().includes('background') ? '#faf7f0' : '#1a1918';
        (el.style as any)[prop] = resolveColorToRgb(ctx, val, fallback);
      }
    }

    if (typeof computed.boxShadow === 'string' && hasModernCssColors(computed.boxShadow)) {
      el.style.boxShadow = 'none';
    }
    if (typeof computed.backgroundImage === 'string' && hasModernCssColors(computed.backgroundImage)) {
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
  }, 30000);
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

    const searchRoot = containerElement || targetPages[0].parentElement || document.body;
    await waitForImagesAndFonts(searchRoot);
    const sanitizedCss = await collectSanitizedStylesheets();

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
          scrollX: 0,
          scrollY: 0,
          backgroundColor: '#faf7f0',
          onclone: (clonedDoc, clonedTarget) => {
            // Remove same-origin <link rel="stylesheet"> in clone so Tailwind v4 oklch/oklab/color-mix
            // in built CSS bundles never hits html2canvas's color parser, and inject our sanitized CSS.
            clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((lnk) => {
              const href = lnk.getAttribute('href') || '';
              if (!href) return;
              try {
                const url = new URL(href, window.location.href);
                if (url.origin === window.location.origin) {
                  lnk.remove();
                }
              } catch {
                lnk.remove();
              }
            });

            // Sanitize existing inline <style> tags using balanced-parenthesis color replacement
            clonedDoc.querySelectorAll('style').forEach((s) => {
              if (s.textContent && (hasModernCssColors(s.textContent) || s.textContent.includes('@property'))) {
                s.textContent = sanitizeCssModernColors(s.textContent, '#2b2926');
              }
            });

            if (sanitizedCss) {
              const injectedStyle = clonedDoc.createElement('style');
              injectedStyle.setAttribute('data-pdf-sanitized', 'true');
              injectedStyle.textContent = sanitizedCss;
              clonedDoc.head.appendChild(injectedStyle);
            }

            // Reposition any offscreen wrapper cleanly inside the cloned document
            let anc: HTMLElement | null = clonedTarget;
            while (anc && anc !== clonedDoc.body) {
              anc.style.opacity = '1';
              anc.style.visibility = 'visible';
              anc.style.transform = 'none';
              if (anc.style.left && anc.style.left.startsWith('-')) {
                anc.style.position = 'static';
                anc.style.left = '0px';
                anc.style.top = '0px';
              }
              if (anc.classList.contains('fixed') && anc.className.includes('-12000px')) {
                anc.style.position = 'static';
                anc.style.left = '0px';
                anc.style.top = '0px';
              }
              anc = anc.parentElement;
            }

            // Guard against any broken images in clone aborting capture
            if (clonedTarget) {
              clonedTarget.querySelectorAll<HTMLImageElement>('img').forEach((imgEl) => {
                if (!imgEl.complete || imgEl.naturalWidth === 0) {
                  imgEl.style.display = 'none';
                }
              });
              sanitizeNodeColors(clonedTarget, colorCtx);
            }
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
