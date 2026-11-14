/**
 * Generates the clean public URL for a project slug
 */
export function getPublicProjectUrl(slug: string): string {
  const origin = window.location.origin;
  return `${origin}/#/p/${encodeURIComponent(slug.trim().toLowerCase())}`;
}

/**
 * Validates Google Drive URL format
 */
export function isValidGoogleDriveUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return (
      parsed.hostname === 'drive.google.com' ||
      parsed.hostname === 'docs.google.com' ||
      parsed.hostname.endsWith('.google.com') ||
      trimmed.startsWith('https://drive.google.com')
    );
  } catch {
    return false;
  }
}

/**
 * Generates URL-friendly slug from string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove special characters
    .trim()
    .replace(/[-\s]+/g, '-'); // replace spaces/hyphens with single hyphen
}
