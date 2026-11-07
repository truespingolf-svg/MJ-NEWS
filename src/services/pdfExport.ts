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
        document.querySelectorAll<HTMLElement>('.newsprint-paper')
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

    for (let i = 0; i < targetPages.length; i++) {
      onProgress?.(`Rendering page ${i + 1} of ${targetPages.length}...`);
      const pageEl = targetPages[i];

      const canvas = await html2canvas(pageEl, {
        scale: 2, // 2x retina sharpness
        useCORS: true,
        allowTaint: true,
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

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    onProgress?.('Downloading PDF file...');
    const filename = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_broadsheet.pdf`;
    pdf.save(filename);

    onProgress?.('Downloaded successfully!');
    return true;
  } catch (err) {
    console.error('Direct PDF export error:', err);
    onProgress?.('Failed to download PDF. Opening print engine...');
    // Seamless fallback to browser print if client canvas fails
    setTimeout(() => {
      window.print();
    }, 400);
    return false;
  }
}
