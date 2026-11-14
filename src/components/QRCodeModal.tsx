import React, { useEffect, useState } from 'react';
import { X, Download, Copy, Check, ExternalLink, Share2, Printer, Smartphone } from 'lucide-react';
import { Project } from '../types';
import { getPublicProjectUrl } from '../lib/urlHelper';
import {
  generateQRCodeDataUrl,
  downloadQRCodePNG,
  generatePrintableCardDataUrl,
} from '../lib/qrCode';

interface QRCodeModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onViewPublic: (slug: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  project,
  isOpen,
  onClose,
  onViewPublic,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  useEffect(() => {
    if (project && isOpen) {
      const publicUrl = getPublicProjectUrl(project.slug);
      generateQRCodeDataUrl(publicUrl, { width: 500, margin: 2 }).then(setQrDataUrl);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const publicUrl = getPublicProjectUrl(project.slug);

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    downloadQRCodePNG(qrDataUrl, project.slug);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Halo! Berikut galeri foto pernikahan dari ${project.bride_groom_names}:\n${publicUrl}\n\nDokumentasi oleh ${project.brand_name}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleDownloadPrintableCard = async () => {
    setIsGeneratingCard(true);
    try {
      const cardDataUrl = await generatePrintableCardDataUrl(
        publicUrl,
        project.bride_groom_names,
        project.brand_name
      );
      if (cardDataUrl) {
        const link = document.createElement('a');
        link.href = cardDataUrl;
        link.download = `meja-qr-${project.slug}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setIsGeneratingCard(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 max-w-lg w-full overflow-hidden my-4 sm:my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-100 bg-[#FAF8F5]">
          <div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#9B791B] font-semibold block">
              QR CODE PUBLIK
            </span>
            <h3 className="text-base sm:text-xl font-extrabold text-stone-900 leading-tight tracking-tight">
              {project.bride_groom_names}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex flex-col items-center">
          {/* QR Code Container */}
          <div className="relative p-3 sm:p-4 bg-white border border-stone-200 rounded-xl shadow-inner mb-3 sm:mb-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code Galeri ${project.bride_groom_names}`}
                className="w-44 h-44 sm:w-56 sm:h-56 object-contain"
              />
            ) : (
              <div className="w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center bg-stone-50 text-stone-400 text-xs">
                Membuat QR Code...
              </div>
            )}
          </div>

          <div className="text-center mb-4 sm:mb-5">
            <p className="text-[11px] sm:text-xs text-stone-600 flex items-center justify-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-stone-500" />
              <span>Arahkan kamera HP ke QR Code untuk langsung membuka galeri</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5">
              File unduhan mengikuti format: <code className="text-stone-700 font-mono">qr-{project.slug}.png</code>
            </p>
          </div>

          {/* Public Link Bar */}
          <div className="w-full mb-4 sm:mb-6">
            <label className="block text-[10px] sm:text-[11px] font-medium text-stone-500 uppercase tracking-wider mb-1">
              Link Publik Unik Proyek
            </label>
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg p-1.5 pl-3">
              <span className="text-xs text-stone-800 font-mono truncate flex-1" title={publicUrl}>
                {publicUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 rounded shadow-xs transition-colors shrink-0"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-2 gap-2 sm:gap-2.5 mb-3">
            <button
              onClick={handleDownloadPNG}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-[11px] sm:text-xs font-medium rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D8B744]" />
              <span>Unduh PNG</span>
            </button>

            <button
              onClick={handleDownloadPrintableCard}
              disabled={isGeneratingCard}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#FAF7F2] hover:bg-[#F3EFE8] text-stone-800 border border-stone-300 text-[11px] sm:text-xs font-medium rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600" />
              <span>{isGeneratingCard ? 'Menyiapkan...' : 'Unduh Kartu 4x6 (PNG)'}</span>
            </button>
          </div>

          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-2.5 border-t border-stone-100">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-emerald-700 hover:text-emerald-800 font-medium py-1 px-2 rounded hover:bg-emerald-50 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan ke WhatsApp</span>
            </button>

            <button
              onClick={() => onViewPublic(project.slug)}
              className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-stone-600 hover:text-stone-900 font-medium py-1 px-2 rounded hover:bg-stone-100 transition-colors"
            >
              <span>Uji Halaman Publik</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
