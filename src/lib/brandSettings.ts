export interface BrandSettings {
  brandName: string;
  logoUrl: string;
  instagram: string;
  whatsapp: string;
  showSocials: boolean;
}

const BRAND_STORAGE_KEY = 'mahligai_default_brand';

export const WEDDING_COVER_PRESETS = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=80',
];

export function getStoredBrandSettings(): BrandSettings {
  try {
    const raw = localStorage.getItem(BRAND_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const settings: BrandSettings = {
        brandName:
          typeof parsed.brandName === 'string'
            ? parsed.brandName.replace(/\b(?:POILA|POLA)\s+PRAME\b/gi, 'POLA FRAME') || 'POLA FRAME PHOTOBOOT WEDDING'
            : 'POLA FRAME PHOTOBOOT WEDDING',
        logoUrl: parsed.logoUrl || '',
        instagram:
          typeof parsed.instagram === 'string'
            ? parsed.instagram.replace(/\b(?:poila|pola)prame\b/gi, 'polaframe') || '@polaframe'
            : '@polaframe',
        whatsapp: parsed.whatsapp || '081234567890',
        showSocials: parsed.showSocials !== undefined ? Boolean(parsed.showSocials) : true,
      };

      if (settings.brandName !== parsed.brandName || settings.instagram !== parsed.instagram) {
        try {
          localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify({ ...parsed, ...settings }));
        } catch {
          // Keep the normalized values for this session if storage is unavailable.
        }
      }

      return settings;
    }
  } catch {
    // ignore
  }
  return {
    brandName: 'POLA FRAME PHOTOBOOT WEDDING',
    logoUrl: '',
    instagram: '@polaframe',
    whatsapp: '081234567890',
    showSocials: true,
  };
}

export function saveStoredBrandSettings(settings: BrandSettings): void {
  localStorage.setItem(
    BRAND_STORAGE_KEY,
    JSON.stringify({
      brandName: settings.brandName.trim(),
      logoUrl: settings.logoUrl.trim(),
      instagram: (settings.instagram || '').trim(),
      whatsapp: (settings.whatsapp || '').trim(),
      showSocials: Boolean(settings.showSocials),
    })
  );
}
