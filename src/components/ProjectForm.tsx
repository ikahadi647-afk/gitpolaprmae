import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  AlertCircle,
  ExternalLink,
  Eye,
  Link as LinkIcon,
  Sparkles,
  HelpCircle,
  Image as ImageIcon,
  Store,
  Instagram,
  MessageCircle,
} from 'lucide-react';
import { ProjectWithGalleries, ProjectStatus } from '../types';
import { generateSlug, isValidGoogleDriveUrl, getPublicProjectUrl } from '../lib/urlHelper';
import {
  saveProject,
  checkSlugAvailable,
  uploadMediaFile,
} from '../lib/dataService';
import { getStoredBrandSettings, WEDDING_COVER_PRESETS } from '../lib/brandSettings';

interface ProjectFormProps {
  initialProject?: ProjectWithGalleries | null;
  onBack: () => void;
  onSaved: (project: ProjectWithGalleries) => void;
  onPreview: (previewData: ProjectWithGalleries) => void;
  onOpenBrandSettings?: () => void;
}

interface GalleryInput {
  id?: string;
  name: string;
  drive_url: string;
  cover_url?: string;
  sort_order: number;
  is_active: boolean;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialProject,
  onBack,
  onSaved,
  onPreview,
  onOpenBrandSettings,
}) => {
  const isEditing = Boolean(initialProject);
  const defaultBrand = getStoredBrandSettings();

  // Form states - prefilled with default studio brand if not editing
  const [brandName, setBrandName] = useState(initialProject?.brand_name || defaultBrand.brandName || '');
  const [brideGroomNames, setBrideGroomNames] = useState(initialProject?.bride_groom_names || '');
  const [slug, setSlug] = useState(initialProject?.slug || '');
  const [isSlugCustomized, setIsSlugCustomized] = useState(Boolean(initialProject?.slug));
  const [coverUrl, setCoverUrl] = useState(initialProject?.cover_url || '');
  const [logoUrl, setLogoUrl] = useState(initialProject?.logo_url ?? defaultBrand.logoUrl ?? '');

  // Social & WhatsApp settings
  const [instagram, setInstagram] = useState(
    initialProject?.instagram ?? defaultBrand.instagram ?? ''
  );
  const [whatsapp, setWhatsapp] = useState(
    initialProject?.whatsapp ?? defaultBrand.whatsapp ?? ''
  );
  const [showSocials, setShowSocials] = useState(
    initialProject?.show_socials !== undefined
      ? Boolean(initialProject.show_socials)
      : defaultBrand.showSocials !== false
  );

  // Galleries list
  const [galleries, setGalleries] = useState<GalleryInput[]>(
    initialProject?.galleries?.length
      ? initialProject.galleries.map((g) => ({
          id: g.id,
          name: g.name,
          drive_url: g.drive_url,
          cover_url: g.cover_url || '',
          sort_order: g.sort_order,
          is_active: g.is_active,
        }))
      : [
          {
            name: '',
            drive_url: '',
            cover_url: '',
            sort_order: 1,
            is_active: true,
          },
        ]
  );

  // UI status
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [coverCompressionInfo, setCoverCompressionInfo] = useState<string | null>(null);
  const [logoCompressionInfo, setLogoCompressionInfo] = useState<string | null>(null);
  const [galleryCompressionNotes, setGalleryCompressionNotes] = useState<{ [index: number]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Auto-generate slug when brideGroomNames changes (unless manually customized)
  useEffect(() => {
    if (!isSlugCustomized && brideGroomNames.trim()) {
      const generated = generateSlug(brideGroomNames);
      setSlug(generated);
    }
  }, [brideGroomNames, isSlugCustomized]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!slug.trim()) {
      setSlugStatus('idle');
      return;
    }
    const timer = setTimeout(async () => {
      setSlugStatus('checking');
      const isAvailable = await checkSlugAvailable(slug, initialProject?.id);
      setSlugStatus(isAvailable ? 'available' : 'taken');
    }, 400);

    return () => clearTimeout(timer);
  }, [slug, initialProject?.id]);

  // Gallery handlers
  const handleAddGallery = () => {
    setGalleries([
      ...galleries,
      {
        name: '',
        drive_url: '',
        sort_order: galleries.length + 1,
        is_active: true,
      },
    ]);
  };

  const handleUpdateGallery = (index: number, fields: Partial<GalleryInput>) => {
    const updated = [...galleries];
    updated[index] = { ...updated[index], ...fields };
    setGalleries(updated);
  };

  const handleRemoveGallery = (index: number) => {
    if (galleries.length === 1) {
      alert('Proyek minimal harus memiliki 1 galeri.');
      return;
    }
    const filtered = galleries.filter((_, idx) => idx !== index);
    const reordered = filtered.map((g, idx) => ({ ...g, sort_order: idx + 1 }));
    setGalleries(reordered);
  };

  const handleMoveGallery = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === galleries.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...galleries];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setGalleries(reordered.map((g, idx) => ({ ...g, sort_order: idx + 1 })));
  };

  // Upload handlers
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setErrorMessage(null);
    setCoverCompressionInfo(null);
    const result = await uploadMediaFile(file, 'covers');
    setIsUploadingCover(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else if (result.url) {
      setCoverUrl(result.url);
      if (result.compressionInfo && result.compressionInfo.savedPercent > 0) {
        setCoverCompressionInfo(
          `Dikompres otomatis: ${result.compressionInfo.originalSize} ➔ ${result.compressionInfo.compressedSize} (hemat ${result.compressionInfo.savedPercent}%)`
        );
      } else if (result.compressionInfo) {
        setCoverCompressionInfo(`Ukuran foto: ${result.compressionInfo.compressedSize}`);
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setErrorMessage(null);
    setLogoCompressionInfo(null);
    const result = await uploadMediaFile(file, 'logos');
    setIsUploadingLogo(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else if (result.url) {
      setLogoUrl(result.url);
      if (result.compressionInfo && result.compressionInfo.savedPercent > 0) {
        setLogoCompressionInfo(
          `Dikompres: ${result.compressionInfo.originalSize} ➔ ${result.compressionInfo.compressedSize} (hemat ${result.compressionInfo.savedPercent}%)`
        );
      }
    }
  };

  // Validation
  const validateForm = (targetStatus: ProjectStatus): boolean => {
    if (!brandName.trim()) {
      setErrorMessage('Nama brand wajib diisi.');
      return false;
    }
    if (!brideGroomNames.trim()) {
      setErrorMessage('Nama pengantin wajib diisi.');
      return false;
    }
    if (!slug.trim()) {
      setErrorMessage('Slug URL publik wajib diisi.');
      return false;
    }
    if (slugStatus === 'taken') {
      setErrorMessage(`Slug "${slug}" sudah digunakan oleh proyek lain. Harap pilih slug berbeda.`);
      return false;
    }
    if (!coverUrl.trim()) {
      setErrorMessage('Foto cover proyek wajib diisi atau diunggah.');
      return false;
    }

    if (targetStatus === 'published') {
      if (galleries.length === 0) {
        setErrorMessage('Untuk mempublikasikan, tambahkan minimal satu kotak galeri foto.');
        return false;
      }
      for (let i = 0; i < galleries.length; i++) {
        const g = galleries[i];
        if (!g.name.trim()) {
          setErrorMessage(`Nama galeri ke-${i + 1} tidak boleh kosong.`);
          return false;
        }
        if (!g.drive_url.trim()) {
          setErrorMessage(`Link Google Drive untuk "${g.name || `Galeri ${i + 1}`}" tidak boleh kosong.`);
          return false;
        }
        if (!isValidGoogleDriveUrl(g.drive_url)) {
          setErrorMessage(
            `Link "${g.name}" harus berupa URL Google Drive yang valid (contoh: https://drive.google.com/drive/folders/...).`
          );
          return false;
        }
      }
    }

    setErrorMessage(null);
    return true;
  };

  // Submit action (draft or published)
  const handleSubmit = async (targetStatus: ProjectStatus) => {
    if (!validateForm(targetStatus)) return;

    // Warn if slug is changed on an already published project
    if (
      isEditing &&
      initialProject?.status === 'published' &&
      initialProject.slug !== slug.trim().toLowerCase()
    ) {
      const confirmChange = window.confirm(
        'PERINGATAN: Mengubah slug URL publik pada proyek yang sudah terpublikasi akan membuat QR Code dan link lama tidak dapat diakses lagi. Lanjutkan perubahan?'
      );
      if (!confirmChange) return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      brand_name: brandName,
      bride_groom_names: brideGroomNames,
      slug: slug.trim().toLowerCase(),
      cover_url: coverUrl,
      logo_url: logoUrl,
      status: targetStatus,
      instagram: instagram.trim(),
      whatsapp: whatsapp.trim(),
      show_socials: showSocials,
      galleries: galleries.map((g, idx) => ({
        id: g.id,
        name: g.name,
        drive_url: g.drive_url,
        cover_url: g.cover_url || coverUrl,
        sort_order: idx + 1,
        is_active: g.is_active,
      })),
    };

    const res = await saveProject(payload, initialProject?.id);
    setIsSubmitting(false);

    if (res.success && res.project) {
      onSaved(res.project);
    } else {
      setErrorMessage(res.error || 'Gagal menyimpan proyek.');
    }
  };

  // Live preview
  const handleOpenPreview = () => {
    const previewData: ProjectWithGalleries = {
      id: initialProject?.id || 'preview-id',
      user_id: initialProject?.user_id || 'preview-user',
      brand_name: brandName || 'Nama Brand Studio',
      bride_groom_names: brideGroomNames || 'Pengantin Pria & Wanita',
      slug: slug || 'preview-slug',
      cover_url: coverUrl || '',
      logo_url: logoUrl,
      status: 'published', // Show how it looks when live
      instagram: instagram.trim(),
      whatsapp: whatsapp.trim(),
      show_socials: showSocials,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      galleries: galleries.map((g, idx) => ({
        id: g.id || `preview-gal-${idx}`,
        project_id: 'preview-id',
        name: g.name || `Galeri Foto ${idx + 1}`,
        drive_url: g.drive_url || '#',
        cover_url: g.cover_url || coverUrl || '',
        sort_order: idx + 1,
        is_active: g.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    };
    onPreview(previewData);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Top back & actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 pb-3 sm:pb-4 border-b border-stone-200">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleOpenPreview}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-500" />
            <span>Pratinjau</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('draft')}
            className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-medium text-stone-700 bg-stone-100 border border-stone-300 rounded-md hover:bg-stone-200 transition-colors disabled:opacity-50"
          >
            Draft
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('published')}
            className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-medium text-white bg-stone-900 rounded-md hover:bg-stone-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D8B744]" />
            <span>Publikasikan</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <span className="font-semibold">Perhatian:</span> {errorMessage}
          </div>
        </div>
      )}

      {/* Main form */}
      <div className="space-y-8">
        {/* Section 1: Identitas Proyek & Brand */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                1. Identitas Brand & Pengantin
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500">
                Informasi ini akan menjadi judul utama pada halaman galeri publik dan QR Code.
              </p>
            </div>
            {onOpenBrandSettings && (
              <button
                type="button"
                onClick={onOpenBrandSettings}
                className="self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                title="Atur Nama Brand & Logo Default agar tidak perlu diisi ulang setiap proyek"
              >
                <Store className="w-3.5 h-3.5 text-stone-500" />
                <span>Pengaturan Brand Studio</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-stone-700">
                  Nama Brand Fotografi <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const stored = getStoredBrandSettings();
                    if (stored.brandName) setBrandName(stored.brandName);
                    if (stored.logoUrl) setLogoUrl(stored.logoUrl);
                  }}
                  className="text-[10px] text-stone-500 hover:text-stone-900 underline"
                  title="Gunakan nama brand dan logo dari pengaturan default studio"
                >
                  Pakai Default Studio
                </button>
              </div>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Contoh: Lentera Stories"
                className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Nama Pengantin <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={brideGroomNames}
                onChange={(e) => setBrideGroomNames(e.target.value)}
                placeholder="Contoh: Dimas & Sarah"
                className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
                required
              />
            </div>
          </div>

          {/* Slug input & validation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-stone-700">
                Slug URL Publik Unik <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-stone-400">
                Format: hanya huruf kecil, angka, dan tanda strip (-)
              </span>
            </div>

            <div className="flex items-center">
              <span className="px-3 py-2 bg-stone-100 border border-r-0 border-stone-300 text-stone-500 text-xs font-mono rounded-l-md select-none">
                /p/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setIsSlugCustomized(true);
                  setSlug(generateSlug(e.target.value));
                }}
                placeholder="dimas-sarah"
                className="w-full px-3.5 py-2 text-sm font-mono border border-stone-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
                required
              />
            </div>

            <div className="mt-1 flex items-center justify-between text-xs">
              <p className="text-[11px] text-stone-500">
                Tautan publik: <span className="font-mono text-stone-700">{getPublicProjectUrl(slug || 'slug-proyek')}</span>
              </p>
              {slugStatus === 'checking' && (
                <span className="text-stone-400 text-[11px]">Memeriksa ketersediaan...</span>
              )}
              {slugStatus === 'available' && (
                <span className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Slug tersedia
                </span>
              )}
              {slugStatus === 'taken' && (
                <span className="text-rose-600 text-[11px] font-medium">
                  Slug sudah digunakan, pilih yang lain!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Visual & Media (Cover & Logo) */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
              2. Cover & Logo Brand
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500">
              Upload foto cover pernikahan dan logo studio. Foto berukuran besar (MB) otomatis dikompres menjadi ringan (KB) agar cepat dibuka pengunjung.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cover Area (2 columns) */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-stone-700">
                  Gambar Cover Proyek <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                  Auto-kompres aktif
                </span>
              </div>

              {/* Cover Preview Container */}
              <div className="relative min-h-[160px] max-h-[360px] rounded-lg border border-stone-200 bg-stone-100 overflow-hidden shadow-inner group flex items-center justify-center">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="Cover Preview"
                    className="w-full h-auto max-h-[360px] object-cover"
                  />
                ) : (
                  <div className="w-full h-40 flex flex-col items-center justify-center text-stone-400 text-xs">
                    <ImageIcon className="w-8 h-8 mb-1 text-stone-300" />
                    <span>Belum ada foto cover dipilih</span>
                  </div>
                )}

                {/* Upload overlay */}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs cursor-pointer">
                  <Upload className="w-6 h-6 mb-1 text-stone-100" />
                  <span>{isUploadingCover ? 'Mengompres & Mengunggah...' : 'Klik untuk ganti foto cover'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverUpload}
                    disabled={isUploadingCover}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Compression feedback badge */}
              {coverCompressionInfo && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{coverCompressionInfo}</span>
                </div>
              )}

              {/* Presets pilihan profesional */}
              <div className="pt-1">
                <p className="text-[11px] text-stone-500 mb-1.5">
                  Atau pilih salah satu foto pernikahan profesional berikut:
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {WEDDING_COVER_PRESETS.map((sample, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCoverUrl(sample)}
                      className={`relative w-16 h-12 rounded-md border shrink-0 overflow-hidden transition-all ${
                        coverUrl === sample ? 'ring-2 ring-stone-900 border-white shadow-xs' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={sample} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Logo Area (1 column) */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-stone-700">
                Logo Brand (Opsional)
              </label>

              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-stone-300 rounded-lg bg-stone-50/50 text-center relative group">
                <div className="w-20 h-20 rounded-full bg-white border border-stone-200 overflow-hidden flex items-center justify-center shadow-xs mb-2">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-stone-300" />
                  )}
                </div>

                <label className="text-xs text-stone-700 font-medium cursor-pointer hover:text-stone-900 underline underline-offset-2">
                  {isUploadingLogo ? 'Mengompres & Mengunggah...' : logoUrl ? 'Ganti Logo' : 'Unggah Logo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-stone-400 mt-1">Otomatis dikompres agar ringan</span>

                {logoCompressionInfo && (
                  <div className="mt-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 flex items-center gap-1 text-left">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{logoCompressionInfo}</span>
                  </div>
                )}

                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-[10px] text-rose-500 hover:text-rose-700 mt-1"
                  >
                    Hapus Logo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Pengelolaan Kotak Galeri & Link Google Drive */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                3. Daftar Galeri, Foto Cover & Tautan Google Drive
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500">
                Setiap galeri memiliki foto cover dan link folder Google Drive masing-masing (misal: Akad, Resepsi, Siraman).
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddGallery}
              className="self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-[#FAF7F2] hover:bg-[#F3EFE8] text-stone-800 border border-stone-300 rounded-md text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#9B791B]" />
              <span>Tambah Galeri</span>
            </button>
          </div>

          <div className="space-y-4">
            {galleries.map((gallery, index) => {
              const isDriveValid = isValidGoogleDriveUrl(gallery.drive_url);

              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition-all ${
                    gallery.is_active ? 'bg-stone-50/70 border-stone-200' : 'bg-stone-100/40 border-stone-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-stone-800">
                        {gallery.name || `Galeri Baru #${index + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Active Toggle */}
                      <label className="flex items-center gap-1.5 text-xs text-stone-600 mr-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gallery.is_active}
                          onChange={(e) => handleUpdateGallery(index, { is_active: e.target.checked })}
                          className="rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                        />
                        <span>Aktif</span>
                      </label>

                      {/* Move Up/Down */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveGallery(index, 'up')}
                        className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 rounded"
                        title="Geser ke Atas"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === galleries.length - 1}
                        onClick={() => handleMoveGallery(index, 'down')}
                        className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 rounded"
                        title="Geser ke Bawah"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveGallery(index)}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded ml-1"
                        title="Hapus Galeri"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    {/* Gallery Photo Cover Upload & Preview */}
                    <div className="md:col-span-4 bg-white p-2.5 rounded-lg border border-stone-200/80">
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1.5">
                        Foto Cover Galeri
                      </label>
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-18 h-14 rounded-md bg-stone-100 overflow-hidden shrink-0 border border-stone-200 shadow-2xs flex items-center justify-center">
                          {gallery.cover_url || coverUrl ? (
                            <img
                              src={gallery.cover_url || coverUrl}
                              alt={gallery.name || 'Cover Galeri'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-stone-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded cursor-pointer transition-colors">
                            <Upload className="w-3 h-3 text-stone-600" />
                            <span>Unggah Foto</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const res = await uploadMediaFile(file, 'covers');
                                if (res.url) {
                                  handleUpdateGallery(index, { cover_url: res.url });
                                  if (res.compressionInfo && res.compressionInfo.savedPercent > 0) {
                                    setGalleryCompressionNotes((prev) => ({
                                      ...prev,
                                      [index]: `Dikompres: ${res.compressionInfo!.originalSize} ➔ ${res.compressionInfo!.compressedSize}`,
                                    }));
                                  }
                                } else if (res.error) {
                                  alert(res.error);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          {galleryCompressionNotes[index] && (
                            <span className="block text-[10px] text-emerald-600 font-medium">
                              ✓ {galleryCompressionNotes[index]}
                            </span>
                          )}
                          {gallery.cover_url && (
                            <button
                              type="button"
                              onClick={() => handleUpdateGallery(index, { cover_url: '' })}
                              className="block text-[10px] text-stone-400 hover:text-rose-600"
                            >
                              Hapus Foto Khusus
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Gallery Name */}
                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        Nama Galeri <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={gallery.name}
                        onChange={(e) => handleUpdateGallery(index, { name: e.target.value })}
                        placeholder="Contoh: Akad Nikah & Sungkeman"
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-400 bg-white"
                      />
                    </div>

                    {/* Google Drive Link */}
                    <div className="md:col-span-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-medium text-stone-700">
                          Tautan Google Drive <span className="text-rose-500">*</span>
                        </label>
                        {gallery.drive_url && !isDriveValid && (
                          <span className="text-[10px] text-amber-600 truncate max-w-[130px]">
                            Bukan link standar
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="url"
                          value={gallery.drive_url}
                          onChange={(e) => handleUpdateGallery(index, { drive_url: e.target.value })}
                          placeholder="https://drive.google.com/..."
                          className={`w-full pl-7 pr-3 py-2 text-xs font-mono border rounded focus:outline-none focus:ring-1 bg-white ${
                            gallery.drive_url && !isDriveValid
                              ? 'border-amber-400 focus:ring-amber-400'
                              : 'border-stone-300 focus:ring-stone-400'
                          }`}
                        />
                        <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-lg flex items-start gap-2 text-xs text-stone-500">
            <HelpCircle className="w-4 h-4 shrink-0 text-stone-400 mt-0.5" />
            <p>
              Pastikan folder Google Drive Anda telah disetel izin aksesnya menjadi{' '}
              <strong className="text-stone-700">"Anyone with the link can view"</strong> (Siapa saja yang memiliki tautan dapat melihat) agar tamu atau pengantin dapat langsung mengakses foto tanpa meminta izin.
            </p>
          </div>
        </div>

        {/* Section 4: Media Sosial & Kontak (Instagram & WhatsApp) */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                4. Media Sosial & Kontak Studio (Di Bawah Halaman Publik)
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500">
                Tombol Instagram dan WhatsApp yang tampil di bagian bawah halaman galeri publik.
              </p>
            </div>

            {/* Toggle switch: Bisa matikan medsos */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-600">
                {showSocials ? 'Medsos Aktif' : 'Medsos Dimatikan'}
              </span>
              <button
                type="button"
                onClick={() => setShowSocials(!showSocials)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showSocials ? 'bg-emerald-600' : 'bg-stone-300'
                }`}
                title={showSocials ? 'Klik untuk matikan medsos' : 'Klik untuk aktifkan medsos'}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    showSocials ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className={`space-y-4 transition-opacity ${showSocials ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-stone-700 flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    <span>Akun Instagram Studio</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const stored = getStoredBrandSettings();
                      if (stored.instagram) setInstagram(stored.instagram);
                    }}
                    className="text-[10px] text-stone-500 hover:text-stone-900 underline"
                  >
                    Pakai Default Studio
                  </button>
                </div>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Contoh: @polaframe atau link profil"
                  disabled={!showSocials}
                  className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-stone-700 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nomor WhatsApp Studio</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const stored = getStoredBrandSettings();
                      if (stored.whatsapp) setWhatsapp(stored.whatsapp);
                    }}
                    className="text-[10px] text-stone-500 hover:text-stone-900 underline"
                  >
                    Pakai Default Studio
                  </button>
                </div>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  disabled={!showSocials}
                  className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
              <span className={`w-2 h-2 rounded-full ${showSocials ? 'bg-emerald-500' : 'bg-stone-400'}`} />
              <span>
                {showSocials
                  ? 'Aktif: Tombol Instagram dan WhatsApp akan tampil di bawah daftar galeri pada halaman publik.'
                  : 'Dimatikan: Media sosial & nomor WhatsApp disembunyikan dari halaman publik.'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Submission Bar */}
        <div className="pt-4 flex items-center justify-between border-t border-stone-200">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-stone-500 hover:text-stone-800"
          >
            Batal
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('draft')}
              className="px-4 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 transition-colors"
            >
              Simpan Sebagai Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('published')}
              className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-stone-900 rounded-md hover:bg-stone-800 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D8B744]" />
              <span>Publikasikan & Siapkan QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
