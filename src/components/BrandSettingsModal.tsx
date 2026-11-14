import React, { useState } from 'react';
import { X, Upload, Check, Store, ImageIcon, Instagram, MessageCircle } from 'lucide-react';
import { getStoredBrandSettings, saveStoredBrandSettings } from '../lib/brandSettings';
import { uploadMediaFile } from '../lib/dataService';

interface BrandSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const BrandSettingsModal: React.FC<BrandSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const current = getStoredBrandSettings();
  const [brandName, setBrandName] = useState(current.brandName);
  const [logoUrl, setLogoUrl] = useState(current.logoUrl);
  const [instagram, setInstagram] = useState(current.instagram || '');
  const [whatsapp, setWhatsapp] = useState(current.whatsapp || '');
  const [showSocials, setShowSocials] = useState(current.showSocials !== false);
  const [isUploading, setIsUploading] = useState(false);
  const [compressionNote, setCompressionNote] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setCompressionNote(null);
    const result = await uploadMediaFile(file, 'logos');
    setIsUploading(false);

    if (result.url) {
      setLogoUrl(result.url);
      if (result.compressionInfo && result.compressionInfo.savedPercent > 0) {
        setCompressionNote(
          `Dikompres: ${result.compressionInfo.originalSize} ➔ ${result.compressionInfo.compressedSize} (hemat ${result.compressionInfo.savedPercent}%)`
        );
      }
    } else if (result.error) {
      alert(result.error);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredBrandSettings({
      brandName,
      logoUrl,
      instagram,
      whatsapp,
      showSocials,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onSaved?.();
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full overflow-hidden my-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 bg-[#FAF8F5] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-900 text-[#D8B744] flex items-center justify-center">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-tight">
                Pengaturan Brand & Medsos Studio
              </h3>
              <p className="text-[11px] text-stone-500">
                Disimpan sebagai default profil dan halaman publik
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nama Brand Fotografi
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Contoh: POLA FRAME"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
            />
            <p className="text-[10px] text-stone-400 mt-1">
              Nama ini otomatis terisi pada setiap proyek baru.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Logo Brand Studio
            </label>
            <div className="flex items-center gap-3 p-3 border border-stone-200 rounded-xl bg-stone-50/70">
              <div className="w-14 h-14 rounded-full bg-white border border-stone-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-stone-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 rounded-lg cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-stone-500" />
                  <span>{isUploading ? 'Mengompres & Mengunggah...' : logoUrl ? 'Ganti Logo' : 'Unggah Logo'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
                {compressionNote && (
                  <span className="block text-[10px] text-emerald-600 font-medium mt-1">
                    ✓ {compressionNote}
                  </span>
                )}
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="block text-[10px] text-rose-500 hover:text-rose-700 mt-1"
                  >
                    Hapus Logo Default
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Media Sosial & Kontak Section */}
          <div className="pt-2 border-t border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  Media Sosial & Kontak (Bawah Halaman Publik)
                </h4>
                <p className="text-[10px] text-stone-500">
                  Tombol Instagram & WhatsApp yang muncul di bawah album
                </p>
              </div>

              {/* Toggle switch: Bisa matikan medsos */}
              <button
                type="button"
                onClick={() => setShowSocials(!showSocials)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showSocials ? 'bg-emerald-600' : 'bg-stone-300'
                }`}
                title={showSocials ? 'Medsos Aktif (Klik untuk matikan)' : 'Medsos Mati (Klik untuk aktifkan)'}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    showSocials ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className={`space-y-2.5 transition-opacity ${showSocials ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  <span>Akun Instagram Studio</span>
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Contoh: @polaframe atau link profil"
                  disabled={!showSocials}
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nomor WhatsApp Studio</span>
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  disabled={!showSocials}
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-200/80">
              <span className={`w-2 h-2 rounded-full ${showSocials ? 'bg-emerald-500' : 'bg-stone-400'}`} />
              <span>
                {showSocials
                  ? 'Medsos aktif: IG & WhatsApp akan tampil di bawah galeri publik.'
                  : 'Medsos dimatikan: IG & WhatsApp disembunyikan dari halaman publik.'}
              </span>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan brand & medsos berhasil disimpan!</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors"
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
