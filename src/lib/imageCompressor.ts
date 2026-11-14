/**
 * Client-side image compression utility.
 * Compresses images (JPEG, PNG, WebP) to lightweight sizes (KB) before upload,
 * reducing network bandwidth, storage usage, and preventing localStorage quota limits.
 */

export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  originalSizeFormatted: string;
  compressedSizeFormatted: string;
  savedPercentage: number;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

export async function compressImage(
  file: File,
  folder: 'covers' | 'logos' = 'covers'
): Promise<CompressionResult> {
  const isLogo = folder === 'logos';
  
  // Dimensions targets: 1920px max for wedding covers, 600px for logos
  const maxWidth = isLogo ? 600 : 1920;
  const maxHeight = isLogo ? 600 : 1920;
  
  // Quality: 0.82 for covers (visually lossless for web), 0.85 for logos
  const initialQuality = isLogo ? 0.85 : 0.82;

  return new Promise((resolve, reject) => {
    // If not an image type, reject
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File yang dipilih bukan gambar'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar untuk dikompres'));

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Proportional scale down if dimensions exceed bounds
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context fails
          return resolve({
            file,
            dataUrl: e.target?.result as string,
            originalSize: file.size,
            compressedSize: file.size,
            originalSizeFormatted: formatFileSize(file.size),
            compressedSizeFormatted: formatFileSize(file.size),
            savedPercentage: 0,
          });
        }

        // Draw onto canvas with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output MIME type
        // Use JPEG for general wedding photos for maximum compression and compatibility
        // Use WebP/PNG for logos if original is PNG (to keep transparency)
        let outputMime = 'image/jpeg';
        if (isLogo && file.type === 'image/png') {
          outputMime = 'image/webp'; // WebP supports transparency with much smaller file size than PNG
        }

        let dataUrl: string;
        try {
          dataUrl = canvas.toDataURL(outputMime, initialQuality);
          // If browser doesn't support WebP export and gave PNG back for non-PNG:
          if (outputMime === 'image/webp' && dataUrl.startsWith('data:image/png') && file.type !== 'image/png') {
            outputMime = 'image/jpeg';
            dataUrl = canvas.toDataURL(outputMime, initialQuality);
          }
        } catch {
          outputMime = 'image/jpeg';
          dataUrl = canvas.toDataURL(outputMime, initialQuality);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({
                file,
                dataUrl: e.target?.result as string,
                originalSize: file.size,
                compressedSize: file.size,
                originalSizeFormatted: formatFileSize(file.size),
                compressedSizeFormatted: formatFileSize(file.size),
                savedPercentage: 0,
              });
            }

            const ext = outputMime === 'image/webp' ? 'webp' : outputMime === 'image/png' ? 'png' : 'jpg';
            const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'photo';
            const compressedFile = new File([blob], `${baseName}-compressed.${ext}`, {
              type: outputMime,
              lastModified: Date.now(),
            });

            const originalSize = file.size;
            const compressedSize = compressedFile.size;
            const savedPercentage =
              originalSize > compressedSize
                ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
                : 0;

            resolve({
              file: compressedFile,
              dataUrl,
              originalSize,
              compressedSize,
              originalSizeFormatted: formatFileSize(originalSize),
              compressedSizeFormatted: formatFileSize(compressedSize),
              savedPercentage,
            });
          },
          outputMime,
          initialQuality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
