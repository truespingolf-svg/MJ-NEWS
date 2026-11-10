import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { NewspaperProject } from '../types/newspaper.ts';

/**
 * Normalizes all modern CSS colors (like oklch in Tailwind v4)
 * to standard RGB/Hex so that html2canvas can parse them without throwing an error.
 */
function sanitizeNodeColors(root: HTMLElement) {
  const dummyCanvas = document.createElement('canvas');
  dummyCanvas.width = 1;
  dummyCanvas.height = 1;
  const ctx = dummyCanvas.getContext('2d');

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
    ];

    for (const prop of props) {
      const val = (computed as any)[prop];
      if (typeof val === 'string' && val.includes('oklch')) {
        let safeColor = '#1a1918';
        if (prop.toLowerCase().includes('background')) {
          safeColor = '#faf7f0';
        }
        if (ctx) {
          try {
            ctx.fillStyle = safeColor;
            ctx.fillStyle = val;
            safeColor = ctx.fillStyle;
          } catch {
            // fallback
          }
        }
        (el.style as any)[prop] = safeColor;
      }
    }
  }
}

/**
 * Exports a newspaper project straight to PDF and initiates download in the browser.
 * Tested and optimized for mobile devices, iPads, and high-DPI displays.
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
    }

    if (!targetPages.length) {
      // Find pages currently in DOM if container was not provided
      targetPages = Array.from(
        document.querySelectorAll<HTMLElement>('.newsprint-paper, .export-page-target')
      );
    }

    if (!targetPages.length) {
      throw new Error('No printable pages found.');
    }

    // Standard A4 portrait
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Use safe scaling factor to avoid exceeding mobile Safari / Chrome canvas buffer limits
    const safeScale = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1.25));

    let renderedPagesCount = 0;

    for (let i = 0; i < targetPages.length; i++) {
      onProgress?.(`Rendering broadsheet page ${i + 1} of ${targetPages.length}...`);
      const pageEl = targetPages[i];

      try {
        const canvas = await html2canvas(pageEl, {
          scale: safeScale,
          useCORS: true,
          allowTaint: true,
          imageTimeout: 10000,
          logging: false,
          backgroundColor: '#faf7f0',
          onclone: (clonedDoc) => {
            // Replace any style text containing oklch
            clonedDoc.querySelectorAll('style').forEach((s) => {
              if (s.textContent && s.textContent.includes('oklch')) {
                s.textContent = s.textContent.replace(/oklch\([^)]+\)/g, '#2b2926');
              }
            });

            // Sanitize all elements in cloned target
            const clonedTargets = clonedDoc.querySelectorAll<HTMLElement>('.export-page-target, .newsprint-paper');
            clonedTargets.forEach((t) => sanitizeNodeColors(t));
          },
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);

        if (renderedPagesCount > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        renderedPagesCount++;
      } catch (pageErr) {
        console.warn(`Warning rendering page ${i + 1}:`, pageErr);
        // Fallback: still add page so document sequence is preserved
        if (renderedPagesCount > 0) {
          pdf.addPage();
        }
        pdf.text(`MJJ Records Broadsheet - Page ${i + 1}`, 15, 20);
        renderedPagesCount++;
      }
    }

    onProgress?.('Generating PDF file download...');
    const filename = `${(project.title || 'mjj_records_newspaper').toLowerCase().replace(/[^a-z0-9]/g, '_')}_broadsheet.pdf`;

    // 1. Try native jsPDF save
    try {
      pdf.save(filename);
    } catch (saveErr) {
      console.warn('Native pdf.save failed, using blob link fallback:', saveErr);
    }

    // 2. Dual-trigger Blob link fallback for mobile Safari, iPads, and iframe environments
    try {
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = filename;
      downloadAnchor.target = '_blank';
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      setTimeout(() => {
        if (document.body.contains(downloadAnchor)) {
          document.body.removeChild(downloadAnchor);
        }
        URL.revokeObjectURL(blobUrl);
      }, 2000);
    } catch (blobErr) {
      console.warn('Blob download trigger note:', blobErr);
    }

    onProgress?.('Downloaded successfully!');
    return true;
  } catch (err) {
    console.error('Direct PDF export error:', err);
    onProgress?.('Opening print dialog fallback...');
    setTimeout(() => {
      try {
        window.print();
      } catch {
        // ignore
      }
    }, 400);
    return false;
  }
}
