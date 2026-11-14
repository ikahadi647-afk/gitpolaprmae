import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates high-resolution PNG Data URL for a given public URL
 */
export async function generateQRCodeDataUrl(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions = {
    width: options.width || 600,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#1c1917', // Elegant stone-900
      light: options.color?.light || '#ffffff',
    },
    errorCorrectionLevel: 'H' as const, // High error correction
  };

  return QRCode.toDataURL(text, defaultOptions);
}

/**
 * Downloads the QR Code directly as a PNG file.
 * Filename MUST follow strict PRD specification: "qr-[slug-proyek].png"
 */
export function downloadQRCodePNG(dataUrl: string, slug: string): void {
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const filename = `qr-${cleanSlug}.png`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates an elegant printable wedding display card (suitable for guest tables)
 * combining couple names, brand, and the verified QR code.
 */
export async function generatePrintableCardDataUrl(
  publicUrl: string,
  brideGroomNames: string,
  brandName: string
): Promise<string> {
  const canvas = document.createElement('canvas');
  // 4x6 inches at 300 DPI = 1200 x 1800 pixels
  canvas.width = 1200;
  canvas.height = 1800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - Warm Alabaster
  ctx.fillStyle = '#FAF8F5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative border
  ctx.strokeStyle = '#E7E2DA';
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  // Couple Names - Featured
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1C1917';
  ctx.font = '700 80px "Inter", sans-serif';
  ctx.fillText(brideGroomNames.toUpperCase(), canvas.width / 2, 250);

  // Kicker
  ctx.fillStyle = '#8A7055';
  ctx.font = '500 32px "Inter", sans-serif';
  ctx.fillText('GALERI PERNIKAHAN', canvas.width / 2, 320);

  // QR Code Generation
  const qrDataUrl = await generateQRCodeDataUrl(publicUrl, { width: 700, margin: 2 });
  const qrImage = new Image();
  await new Promise((resolve) => {
    qrImage.onload = resolve;
    qrImage.src = qrDataUrl;
  });

  // Draw QR Image
  const qrSize = 700;
  ctx.drawImage(qrImage, (canvas.width - qrSize) / 2, 500, qrSize, qrSize);

  // Instruction
  ctx.fillStyle = '#292524';
  ctx.font = '700 40px "Inter", sans-serif';
  ctx.fillText('PINDAI UNTUK MEMBUKA GALERI', canvas.width / 2, 1300);

  // Brand attribution
  if (brandName) {
    ctx.fillStyle = '#78716C';
    ctx.font = '400 30px "Inter", sans-serif';
    ctx.fillText('DOKUMENTASI OLEH', canvas.width / 2, 1550);
    ctx.font = '700 36px "Inter", sans-serif';
    ctx.fillText(brandName.toUpperCase(), canvas.width / 2, 1600);
  }

  return canvas.toDataURL('image/png');
}
