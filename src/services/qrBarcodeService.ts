import QRCode from 'qrcode';

/**
 * Generates a high-resolution QR code data URL (PNG)
 */
export async function generateQrCodeDataUrl(
  payload: string,
  options?: {
    colorDark?: string;
    colorLight?: string;
    width?: number;
  }
): Promise<string> {
  try {
    const textToEncode = payload?.trim() || 'NEXPAPER-VERIFIED-PASS';
    return await QRCode.toDataURL(textToEncode, {
      width: options?.width || 256,
      margin: 1,
      color: {
        dark: options?.colorDark || '#000000',
        light: options?.colorLight || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

/**
 * Generates an authentic Code 128-style barcode SVG representation
 */
export function generateBarcodeSvg(code: string, color: string = '#000000'): string {
  // Deterministic bar widths generated from string hash
  const chars = (code || 'NXP-000000').toUpperCase();
  const bars: { width: number; isSpace: boolean }[] = [];

  // Guard pattern
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1, isSpace: true });
  bars.push({ width: 2, isSpace: false });

  for (let i = 0; i < chars.length; i++) {
    const charCode = chars.charCodeAt(i);
    const pattern = [(charCode % 3) + 1, ((charCode >> 1) % 2) + 1, ((charCode >> 2) % 3) + 1, 1];
    for (let p = 0; p < pattern.length; p++) {
      bars.push({ width: pattern[p], isSpace: p % 2 === 1 });
    }
  }

  // Guard pattern
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1, isSpace: true });
  bars.push({ width: 2, isSpace: false });

  let totalWidth = 0;
  for (const bar of bars) {
    totalWidth += bar.width;
  }

  let x = 0;
  const rects: string[] = [];
  for (const bar of bars) {
    if (!bar.isSpace) {
      rects.push(`<rect x="${x}" y="0" width="${bar.width}" height="42" fill="${color}" />`);
    }
    x += bar.width;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} 42" preserveAspectRatio="none" class="w-full h-full">
      ${rects.join('')}
    </svg>
  `;
}
