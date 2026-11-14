import React, { useState } from 'react';
import {
  Share2,
  Check,
  Copy,
  ArrowUpRight,
  ShieldAlert,
  Instagram,
  MessageCircle,
} from 'lucide-react';
import { ProjectWithGalleries } from '../types';
import { getPublicProjectUrl } from '../lib/urlHelper';
import { getStoredBrandSettings } from '../lib/brandSettings';

interface PublicGalleryPageProps {
  project: ProjectWithGalleries | null;
  isPreview?: boolean;
  onBackToAdmin?: () => void;
}

export const PublicGalleryPage: React.FC<PublicGalleryPageProps> = ({
  project,
  isPreview = false,
  onBackToAdmin,
}) => {
  const [copied, setCopied] = useState(false);

  // If project is not found or not published (and not an admin preview)
  if (!project || (!isPreview && project.status !== 'published')) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mb-4 text-stone-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 mb-2">
          Galeri Belum Tersedia
        </h1>
        <p className="text-stone-500 max-w-sm text-xs sm:text-sm mb-6 leading-relaxed">
          Proyek pernikahan ini belum aktif atau tautan tidak ditemukan.
        </p>
        {onBackToAdmin && (
          <button
            onClick={onBackToAdmin}
            className="px-3.5 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 transition-colors shadow-2xs"
          >
            Kembali ke Portal Admin
          </button>
        )}
      </div>
    );
  }

  const publicUrl = getPublicProjectUrl(project.slug);
  const activeGalleries = project.galleries.filter((g) => g.is_active);

  // Fallback to default brand settings if not set on the project
  const defaultBrand = getStoredBrandSettings();
  const showSocials =
    project.show_socials !== undefined
      ? Boolean(project.show_socials)
      : defaultBrand.showSocials !== false;

  const rawInstagram = (
    project.instagram ||
    defaultBrand.instagram ||
    '@polaframe'
  ).trim();
  const rawWhatsapp = (
    project.whatsapp ||
    defaultBrand.whatsapp ||
    '081234567890'
  ).trim();

  // Helper to extract clean handle for display, e.g. @polaframe
  const getInstagramDisplay = (ig: string): string => {
    let clean = ig;
    if (clean.includes('instagram.com/')) {
      const match = clean.match(/instagram\.com\/([^/?#]+)/i);
      if (match && match[1]) clean = match[1];
    }
    clean = clean.replace(/^@+/, '').trim();
    return clean ? `@${clean}` : ig;
  };

  // Helper to build full Instagram profile URL
  const getInstagramHref = (ig: string): string => {
    let clean = ig.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }
    clean = clean.replace(/^@+/, '');
    return `https://instagram.com/${clean}`;
  };

  // Helper to build WhatsApp contact link
  const getWhatsAppContactHref = (wa: string): string => {
    let digits = wa.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = '62' + digits.slice(1);
    }
    const message = encodeURIComponent(
      `Halo ${project.brand_name || 'Studio'}, saya melihat foto pernikahan ${project.bride_groom_names} di website galeri.`
    );
    return `https://api.whatsapp.com/send?phone=${digits}&text=${message}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Foto pernikahan ${project.bride_groom_names}:\n${publicUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col selection:bg-[#D4AF37]/20">
      {/* Admin preview banner if in preview mode */}
      {isPreview && (
        <div className="bg-stone-900 text-stone-100 text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-medium">Pratinjau Halaman Publik</span>
          </div>
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="text-[10px] sm:text-[11px] font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 px-2 py-0.5 rounded transition-colors"
            >
              Kembali Mengedit
            </button>
          )}
        </div>
      )}

      {/* 1. COVER PROYEK (Foto Bersih tanpa tulisan/tombol menutupi foto) */}
      {project.cover_url ? (
        <section className="w-full bg-stone-900 overflow-hidden flex items-center justify-center">
          <img
            src={project.cover_url}
            alt={project.bride_groom_names}
            className="w-full h-auto max-h-[65vh] sm:max-h-[75vh] object-cover object-center"
          />
        </section>
      ) : null}

      {/* Bar Informasi & Tombol Berbagi (Di bawah cover, bukan di atas cover) */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start">
            {project.brand_name && (
              <div className="flex items-center gap-1.5 mb-0.5">
                {project.logo_url && (
                  <img
                    src={project.logo_url}
                    alt={project.brand_name}
                    className="w-4 h-4 rounded-full object-contain"
                  />
                )}
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                  {project.brand_name}
                </span>
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              {project.bride_groom_names}
            </h1>
          </div>

          {/* Tombol Bagikan WhatsApp & Salin Link */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan WhatsApp</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-all border border-stone-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-600" />}
              <span>{copied ? 'Tersalin' : 'Salin Link'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. DAFTAR KOTAK GALERI (Sleek, image-focused, no redundant text) */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10 flex-1 w-full">
        {activeGalleries.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-6 text-center text-stone-400 text-xs sm:text-sm">
            Belum ada album galeri foto yang ditambahkan.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 items-start">
            {activeGalleries.map((gallery, index) => (
              <a
                key={gallery.id || index}
                href={gallery.drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white rounded-xl sm:rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Gallery Photo Cover (menyesuaikan dengan ukuran asli gambar) */}
                <div className="relative w-full bg-stone-100 overflow-hidden">
                  {gallery.cover_url || project.cover_url ? (
                    <img
                      src={gallery.cover_url || project.cover_url}
                      alt={gallery.name}
                      className="w-full h-auto object-cover group-hover:scale-103 transition-transform duration-500 ease-out block"
                    />
                  ) : (
                    <div className="w-full h-44 flex items-center justify-center text-stone-300 text-xs">
                      Tidak ada foto cover
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 pointer-events-none" />

                  <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-black/40 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border border-white/20">
                    0{index + 1}
                  </div>

                  <div className="absolute bottom-2.5 sm:bottom-3.5 left-3 sm:left-4 right-3 sm:right-4 text-white">
                    <h3 className="font-bold text-base sm:text-lg md:text-xl text-white leading-tight drop-shadow-sm group-hover:text-[#EEDFA8] transition-colors">
                      {gallery.name}
                    </h3>
                  </div>
                </div>

                {/* Card Bottom Bar (Concise button) */}
                <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white flex items-center justify-between text-[11px] sm:text-xs text-stone-700 border-t border-stone-100">
                  <span className="font-medium text-stone-800">
                    Buka Google Drive
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-stone-100 group-hover:bg-stone-900 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* 3. MEDIA SOSIAL & NO WHATSAPP STUDIO (Di Bawah Halaman Publik - Bisa Dimatikan di Pengaturan) */}
      {showSocials && (rawInstagram || rawWhatsapp) && (
        <section className="max-w-4xl mx-auto px-3 sm:px-6 pb-8 w-full">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Media Sosial & Kontak Studio
              </span>
              <p className="text-sm sm:text-base font-bold text-stone-900 mt-0.5">
                {project.brand_name || 'Studio Fotografi'}
              </p>
              <p className="text-[11px] sm:text-xs text-stone-500">
                Hubungi kami untuk info layanan & pemesanan foto pernikahan
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {rawInstagram && (
                <a
                  href={getInstagramHref(rawInstagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-all shadow-2xs group"
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
                  <span>{getInstagramDisplay(rawInstagram)}</span>
                </a>
              )}

              {rawWhatsapp && (
                <a
                  href={getWhatsAppContactHref(rawWhatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all shadow-2xs group"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                  <span>WhatsApp: {rawWhatsapp}</span>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. FOOTER BRAND (Minimal) */}
      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-1.5">
          {project.logo_url && (
            <img
              src={project.logo_url}
              alt={project.brand_name}
              className="w-6 h-6 object-contain rounded-full opacity-70 mb-0.5"
            />
          )}
          <p className="text-[11px] sm:text-xs font-medium text-stone-600">
            {project.brand_name} · {project.bride_groom_names}
          </p>
        </div>
      </footer>
    </div>
  );
};
