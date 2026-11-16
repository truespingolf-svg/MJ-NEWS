export type ImageFitMode = 'cover' | 'contain' | 'fill' | string;

export interface RectSize {
  width: number;
  height: number;
}

export interface PdfPageDimensions {
  widthMm: number;
  heightMm: number;
  orientation: 'portrait' | 'landscape';
}

/**
 * Computes explicit CSS pixel width/height for an <img> inside a centered
 * overflow-hidden box so html2canvas renders object-fit: cover / contain
 * identically without stretching photos.
 */
export function computeObjectFitRect(
  naturalWidth: number,
  naturalHeight: number,
  boxWidth: number,
  boxHeight: number,
  fit: ImageFitMode = 'cover'
): RectSize {
  if (
    !Number.isFinite(naturalWidth) ||
    !Number.isFinite(naturalHeight) ||
    !Number.isFinite(boxWidth) ||
    !Number.isFinite(boxHeight) ||
    naturalWidth <= 0 ||
    naturalHeight <= 0 ||
    boxWidth <= 0 ||
    boxHeight <= 0
  ) {
    return {
      width: Math.max(0, boxWidth || 0),
      height: Math.max(0, boxHeight || 0),
    };
  }

  if (fit === 'fill') {
    return { width: boxWidth, height: boxHeight };
  }

  const imgRatio = naturalWidth / naturalHeight;
  const boxRatio = boxWidth / boxHeight;

  if (fit === 'contain') {
    if (imgRatio > boxRatio) {
      return {
        width: boxWidth,
        height: Number((boxWidth / imgRatio).toFixed(2)),
      };
    }
    return {
      width: Number((boxHeight * imgRatio).toFixed(2)),
      height: boxHeight,
    };
  }

  // Default: 'cover'
  if (imgRatio > boxRatio) {
    return {
      width: Number((boxHeight * imgRatio).toFixed(2)),
      height: boxHeight,
    };
  }
  return {
    width: boxWidth,
    height: Number((boxWidth / imgRatio).toFixed(2)),
  };
}

/**
 * Computes PDF page dimensions in millimeters preserving the exact pixel aspect
 * ratio of the captured broadsheet canvas so exported pages never stretch.
 */
export function computePdfPageSizeMm(
  canvasWidth: number,
  canvasHeight: number,
  targetWidthMm: number = 210
): PdfPageDimensions {
  const safeTargetWidth = Number.isFinite(targetWidthMm) && targetWidthMm > 20 ? targetWidthMm : 210;
  if (!Number.isFinite(canvasWidth) || !Number.isFinite(canvasHeight) || canvasWidth <= 0 || canvasHeight <= 0) {
    return {
      widthMm: safeTargetWidth,
      heightMm: 297,
      orientation: 'portrait',
    };
  }

  const heightMm = Number(((safeTargetWidth * canvasHeight) / canvasWidth).toFixed(2));
  return {
    widthMm: safeTargetWidth,
    heightMm,
    orientation: heightMm >= safeTargetWidth ? 'portrait' : 'landscape',
  };
}
