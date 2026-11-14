import React, { useState } from 'react';
import {
  ExternalLink,
  Edit3,
  QrCode,
  Archive,
  Trash2,
  Share2,
  FolderOpen,
  MoreVertical,
  CheckCircle,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { Project } from '../types';
import { getPublicProjectUrl } from '../lib/urlHelper';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onOpenQR: (project: Project) => void;
  onViewPublic: (slug: string) => void;
  onStatusChange: (project: Project, newStatus: 'draft' | 'published' | 'archived') => void;
  onDelete: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onOpenQR,
  onViewPublic,
  onStatusChange,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const publicUrl = getPublicProjectUrl(project.slug);
  const isPublished = project.status === 'published';
  const isDraft = project.status === 'draft';
  const isArchived = project.status === 'archived';

  return (
    <div className="group bg-white rounded-xl border border-stone-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden relative">
      {/* Cover Image Area */}
      <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
        {project.cover_url ? (
          <img
            src={project.cover_url}
            alt={project.bride_groom_names}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">
            Tidak ada foto cover
          </div>
        )}

        {/* Gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Brand Logo if available */}
        {project.logo_url && (
          <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/95 p-0.5 shadow-xs border border-white/80 overflow-hidden backdrop-blur-xs">
            <img src={project.logo_url} alt="Logo" className="w-full h-full object-contain rounded-full" />
          </div>
        )}

        {/* Quick status pill / badge */}
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center gap-1.5">
          <span
            className={`text-[10px] sm:text-[11px] font-semibold tracking-wide px-1.5 sm:px-2 py-0.5 rounded backdrop-blur-md shadow-xs ${
              isPublished
                ? 'bg-emerald-600/90 text-white'
                : isDraft
                ? 'bg-amber-600/90 text-white'
                : 'bg-stone-700/90 text-stone-200'
            }`}
          >
            {isPublished ? 'Terpublikasi' : isDraft ? 'Draft' : 'Arsip'}
          </span>
        </div>

        {/* Couple names on cover */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 text-white">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-stone-200 font-medium truncate">
            {project.brand_name}
          </p>
          <h4 className="text-base sm:text-xl font-bold leading-tight truncate drop-shadow-sm text-white">
            {project.bride_groom_names}
          </h4>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        {/* Metadata unboxed text */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-stone-500 mb-2.5">
          <span className="font-mono text-stone-600 truncate max-w-[120px] sm:max-w-none">/p/{project.slug}</span>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <span className="flex items-center gap-1 shrink-0">
            <FolderOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400" />
            {project.galleries_count || 0} Galeri
          </span>
        </div>

        {/* Actions Bar */}
        <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-1">
          {/* Primary View / QR */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {isPublished ? (
              <>
                <button
                  onClick={() => onViewPublic(project.slug)}
                  title="Buka Halaman Publik"
                  className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-md transition-colors"
                >
                  <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-600" />
                  <span>Lihat</span>
                </button>
                <button
                  onClick={() => onOpenQR(project)}
                  title="Buat & Unduh QR Code PNG"
                  className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-medium text-[#8A7055] hover:text-[#5E4833] bg-[#FCF9EE] hover:bg-[#F7F1D8] border border-[#EEDFA8] rounded-md transition-colors"
                >
                  <QrCode className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>QR Code</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onEdit(project)}
                className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-md transition-colors"
              >
                <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Edit Proyek</span>
              </button>
            )}
          </div>

          {/* Quick Menu / More actions */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 sm:p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
              title="Menu Tindakan"
            >
              <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-lg shadow-xl border border-stone-200 py-1 z-30 text-xs">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(project);
                    }}
                    className="w-full text-left px-3 py-1.5 text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-stone-400" />
                    <span>Ubah Proyek</span>
                  </button>

                  {isPublished && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onStatusChange(project, 'draft');
                      }}
                      className="w-full text-left px-3 py-1.5 text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Kembalikan ke Draft</span>
                    </button>
                  )}

                  {isDraft && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onStatusChange(project, 'published');
                      }}
                      className="w-full text-left px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Publikasikan Sekarang</span>
                    </button>
                  )}

                  {!isArchived ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onStatusChange(project, 'archived');
                      }}
                      className="w-full text-left px-3 py-1.5 text-stone-600 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <Archive className="w-3.5 h-3.5 text-stone-400" />
                      <span>Arsipkan Proyek</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onStatusChange(project, 'draft');
                      }}
                      className="w-full text-left px-3 py-1.5 text-stone-600 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                      <span>Buka dari Arsip</span>
                    </button>
                  )}

                  <div className="border-t border-stone-100 my-1" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(project);
                    }}
                    className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Hapus Proyek</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
