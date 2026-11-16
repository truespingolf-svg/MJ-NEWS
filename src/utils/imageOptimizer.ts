import { NewspaperProject } from '../types/newspaper.ts';
import { estimateJsonBytes } from './firestoreSanitize.ts';

export interface CompactionPass {
  maxDimension: number;
  quality: number;
}

export const COMPACTION_PASSES: CompactionPass[] = [
  { maxDimension: 820, quality: 0.72 },
  { maxDimension: 620, quality: 0.58 },
  { maxDimension: 460, quality: 0.45 },
  { maxDimension: 340, quality: 0.35 },
  { maxDimension: 260, quality: 0.28 },
];

function compressImageElementToDataUrl(
  img: HTMLImageElement,
  maxDimension: number,
  targetChars: number,
  initialQuality: number
): string | null {
  let targetW = img.naturalWidth || img.width;
  let targetH = img.naturalHeight || img.height;
  if (!targetW || !targetH) return null;

  if (targetW > maxDimension || targetH > maxDimension) {
    const ratio = Math.min(maxDimension / targetW, maxDimension / targetH);
    targetW = Math.max(1, Math.round(targetW * ratio));
    targetH = Math.max(1, Math.round(targetH * ratio));
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#faf7f0';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  let q = initialQuality;
  let best = canvas.toDataURL('image/jpeg', q);

  // Step down quality progressively until within budget or minimum floor
  while (best.length > targetChars && q > 0.25) {
    q = Number((q - 0.1).toFixed(2));
    best = canvas.toDataURL('image/jpeg', q);
  }

  // Downscale proportionally if a single image still exceeds its per-slot character budget
  if (best.length > targetChars && Math.max(targetW, targetH) > 260) {
    const fallbackDim = Math.max(240, Math.round(maxDimension * 0.65));
    const scale = Math.min(1, fallbackDim / Math.max(targetW, targetH));
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = Math.max(1, Math.round(targetW * scale));
    smallCanvas.height = Math.max(1, Math.round(targetH * scale));
    const sCtx = smallCanvas.getContext('2d');
    if (sCtx) {
      sCtx.fillStyle = '#faf7f0';
      sCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
      sCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
      best = smallCanvas.toDataURL('image/jpeg', Math.max(0.28, q));
    }
  }

  return best;
}

export async function recompressDataUrl(
  dataUrl: string,
  maxDimension: number = 780,
  targetChars: number = 95_000,
  quality: number = 0.72
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/') || typeof document === 'undefined') {
    return dataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const compressed = compressImageElementToDataUrl(img, maxDimension, targetChars, quality);
        resolve(compressed && compressed.length < dataUrl.length ? compressed : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Compresses an uploaded image File into a crisp broadsheet-sized JPEG data URL
 * so multi-page newspaper projects stay well under Firestore's 1MB document cap
 * and render rapidly during PDF export.
 */
export async function optimizeNewspaperImage(
  file: File,
  maxDimension: number = 1000,
  quality: number = 0.78
): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  if (typeof document === 'undefined') {
    return rawDataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const compressed = compressImageElementToDataUrl(img, maxDimension, 135_000, quality);
        if (!compressed) {
          resolve(rawDataUrl);
          return;
        }
        resolve(compressed.length < rawDataUrl.length ? compressed : rawDataUrl);
      } catch {
        resolve(rawDataUrl);
      }
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

/**
 * Iteratively shrinks embedded base64 images if a multi-page newspaper project
 * approaches Firestore's 1MB document limit, guaranteeing headroom for Firestore's
 * field/protobuf serialization overhead without discarding photos or layout data.
 */
export async function compactProjectForFirestore(
  project: NewspaperProject,
  maxBytes: number = 700_000
): Promise<NewspaperProject> {
  if (estimateJsonBytes(project) <= maxBytes || typeof document === 'undefined') {
    return project;
  }

  let current = project;
  const imageCount = current.pages.reduce((sum, p) => {
    return (
      sum +
      (['image1', 'image2', 'image3'] as const).filter((slot) =>
        p.images?.[slot]?.url?.startsWith('data:image/')
      ).length
    );
  }, 0);

  if (imageCount === 0) {
    return current;
  }

  const perImageBudget = Math.max(
    12_000,
    Math.floor((maxBytes - 80_000) / Math.max(1, imageCount))
  );

  for (const pass of COMPACTION_PASSES) {
    if (estimateJsonBytes(current) <= maxBytes) {
      break;
    }

    const clonedPages = await Promise.all(
      current.pages.map(async (page) => {
        const updatedImages = { ...page.images };
        for (const slot of ['image1', 'image2', 'image3'] as const) {
          const img = updatedImages[slot];
          if (img?.url?.startsWith('data:image/')) {
            updatedImages[slot] = {
              ...img,
              url: await recompressDataUrl(
                img.url,
                pass.maxDimension,
                perImageBudget,
                pass.quality
              ),
            };
          }
        }
        return { ...page, images: updatedImages };
      })
    );

    current = {
      ...current,
      pages: clonedPages,
    };
  }

  return current;
}
