import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Plus,
  FolderHeart,
  AlertTriangle,
} from 'lucide-react';

import { Project, ProjectWithGalleries, AdminUser, ProjectStatus } from './types';
import {
  getCurrentUser,
  signOutAdmin,
  getAdminProjects,
  getProjectById,
  updateProjectStatus,
  deleteProject,
} from './lib/dataService';

import { AdminNav } from './components/AdminNav';
import { ProjectCard } from './components/ProjectCard';
import { ProjectForm } from './components/ProjectForm';
import { PublicGalleryPage } from './components/PublicGalleryPage';
import { StandalonePublicPage } from './components/StandalonePublicPage';
import { QRCodeModal } from './components/QRCodeModal';
import { AuthView } from './components/AuthView';
import { BrandSettingsModal } from './components/BrandSettingsModal';

function QueryParamRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const p = searchParams.get('p');
    if (p) {
      navigate(`/p/${p}`, { replace: true });
      return;
    }

    if (location.hash.startsWith('#/p/')) {
      const slug = location.hash.replace('#/p/', '');
      if (slug) {
        navigate(`/p/${slug}`, { replace: true });
      }
    }
  }, [location, navigate]);

  return null;
}

function AdminApp() {
  const navigate = useNavigate();

  // Navigation / View states inside admin: 'dashboard' | 'editor' | 'preview'
  const [view, setView] = useState<'dashboard' | 'editor' | 'preview'>('dashboard');

  // Auth state
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Projects data
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');

  // Currently selected/editing project
  const [editingProject, setEditingProject] = useState<ProjectWithGalleries | null>(null);
  const [previewProject, setPreviewProject] = useState<ProjectWithGalleries | null>(null);

  // Modals
  const [qrModalProject, setQrModalProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBrandSettingsOpen, setIsBrandSettingsOpen] = useState(false);

  // Initialize Auth
  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setAuthChecking(false);

      if (currentUser) {
        loadProjects();
      }
    }
    init();
  }, []);

  // Load admin projects
  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const list = await getAdminProjects(searchQuery, statusFilter);
      setProjects(list);
    } finally {
      setLoadingProjects(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (user && view === 'dashboard') {
      loadProjects();
    }
  }, [user, view, loadProjects]);

  // Handlers for Views
  const handleNavigateDashboard = () => {
    setView('dashboard');
    setEditingProject(null);
    setPreviewProject(null);
    loadProjects();
  };

  const handleNewProject = () => {
    setEditingProject(null);
    setView('editor');
  };

  const handleEditProject = async (proj: Project) => {
    const fullProj = await getProjectById(proj.id);
    if (fullProj) {
      setEditingProject(fullProj);
      setView('editor');
    }
  };

  const handleViewPublic = (slug: string) => {
    navigate(`/p/${slug}`);
  };

  const handleOpenPreview = (previewData: ProjectWithGalleries) => {
    setPreviewProject(previewData);
    setView('preview');
  };

  const handleStatusChange = async (proj: Project, newStatus: ProjectStatus) => {
    let confirmMsg = '';
    if (newStatus === 'draft') {
      confirmMsg = `Kembalikan proyek "${proj.bride_groom_names}" ke status draft? Halaman publik tidak akan bisa diakses sementara waktu.`;
    } else if (newStatus === 'archived') {
      confirmMsg = `Arsipkan proyek "${proj.bride_groom_names}"? Proyek tidak akan tampil di publik.`;
    } else if (newStatus === 'published') {
      confirmMsg = `Publikasikan proyek "${proj.bride_groom_names}" sekarang?`;
    }

    if (confirmMsg && !window.confirm(confirmMsg)) return;

    const res = await updateProjectStatus(proj.id, newStatus);
    if (res.success) {
      loadProjects();
    } else {
      alert(res.error || 'Gagal mengubah status proyek');
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    const res = await deleteProject(projectToDelete.id);
    setIsDeleting(false);
    setProjectToDelete(null);

    if (res.success) {
      loadProjects();
    } else {
      alert(res.error || 'Gagal menghapus proyek');
    }
  };

  const handleLogout = async () => {
    await signOutAdmin();
    setUser(null);
    setView('dashboard');
  };

  // If loading auth initial state
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-stone-500 font-medium">Memuat Mahligai...</span>
        </div>
      </div>
    );
  }

  // 1. ADMIN PREVIEW VIEW (Inside editor)
  if (view === 'preview') {
    return (
      <PublicGalleryPage
        project={previewProject}
        isPreview={true}
        onBackToAdmin={() => setView('editor')}
      />
    );
  }

  // If user is not logged in, render AuthView
  if (!user) {
    return (
      <AuthView
        onSuccess={(u) => {
          setUser(u);
          loadProjects();
        }}
      />
    );
  }

  // 2. PROJECT EDITOR VIEW (Create or Edit)
  if (view === 'editor') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
        <AdminNav
          user={user}
          onLogout={handleLogout}
          onOpenBrandSettings={() => setIsBrandSettingsOpen(true)}
          onNewProject={handleNewProject}
          activeView="editor"
          onNavigateDashboard={handleNavigateDashboard}
        />
        <main className="flex-1 pb-16">
          <ProjectForm
            initialProject={editingProject}
            onBack={handleNavigateDashboard}
            onOpenBrandSettings={() => setIsBrandSettingsOpen(true)}
            onSaved={(savedProj) => {
              if (savedProj.status === 'published') {
                setQrModalProject(savedProj);
              }
              handleNavigateDashboard();
            }}
            onPreview={handleOpenPreview}
          />
        </main>
        <QRCodeModal
          project={qrModalProject}
          isOpen={Boolean(qrModalProject)}
          onClose={() => setQrModalProject(null)}
          onViewPublic={handleViewPublic}
        />
        <BrandSettingsModal
          isOpen={isBrandSettingsOpen}
          onClose={() => setIsBrandSettingsOpen(false)}
        />
      </div>
    );
  }

  // 3. MAIN ADMIN DASHBOARD
  const publishedCount = projects.filter((p) => p.status === 'published').length;
  const draftCount = projects.filter((p) => p.status === 'draft').length;
  const archivedCount = projects.filter((p) => p.status === 'archived').length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col selection:bg-[#D4AF37]/20">
      <QueryParamRedirect />
      <AdminNav
        user={user}
        onLogout={handleLogout}
        onOpenBrandSettings={() => setIsBrandSettingsOpen(true)}
        onNewProject={handleNewProject}
        activeView="dashboard"
        onNavigateDashboard={handleNavigateDashboard}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 w-full">
        {/* Top Header & Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-stone-500 mb-1">
              <span>{projects.length} Proyek</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-medium">{publishedCount} Terpublikasi</span>
              <span aria-hidden="true">·</span>
              <span>{draftCount} Draft</span>
              {archivedCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{archivedCount} Arsip</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
              Galeri Foto Pengantin
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-stone-500 mt-0.5">
              Kelola link Google Drive, cover pernikahan, brand logo, dan buat QR Code siap cetak.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleNewProject}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D8B744]" />
              <span>Buat Proyek Baru</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-2.5 sm:p-4 shadow-2xs mb-4 sm:mb-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-stone-100 rounded-lg w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-colors shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua ({projects.length})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-colors shrink-0 ${
                statusFilter === 'published'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Terpublikasi
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-colors shrink-0 ${
                statusFilter === 'draft'
                  ? 'bg-white text-amber-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-colors shrink-0 ${
                statusFilter === 'archived'
                  ? 'bg-white text-stone-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Arsip
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pengantin, brand, slug..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white transition-all"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* Projects Grid */}
        {loadingProjects ? (
          <div className="py-20 flex flex-col items-center justify-center text-stone-400">
            <div className="w-6 h-6 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Memuat daftar proyek...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
              <FolderHeart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-1 tracking-tight">
              {searchQuery ? 'Tidak Ada Proyek yang Cocok' : 'Belum Ada Proyek Galeri'}
            </h3>
            <p className="text-xs text-stone-500 mb-5 leading-relaxed">
              {searchQuery
                ? `Tidak ditemukan proyek yang cocok dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                : 'Mulai buat proyek foto pengantin pertama Anda dengan cover menarik dan link Google Drive.'}
            </p>
            <button
              onClick={handleNewProject}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-medium rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 text-[#D8B744]" />
              <span>Buat Proyek Baru</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEditProject}
                onOpenQR={(p) => setQrModalProject(p)}
                onViewPublic={handleViewPublic}
                onStatusChange={handleStatusChange}
                onDelete={(p) => setProjectToDelete(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 leading-tight tracking-tight">
                  Hapus Proyek Galeri?
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Anda akan menghapus proyek <strong>"{projectToDelete.bride_groom_names}"</strong> beserta semua galeri terkait. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Proyek'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        project={qrModalProject}
        isOpen={Boolean(qrModalProject)}
        onClose={() => setQrModalProject(null)}
        onViewPublic={handleViewPublic}
      />

      {/* Brand Studio Settings Modal */}
      <BrandSettingsModal
        isOpen={isBrandSettingsOpen}
        onClose={() => setIsBrandSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Real Independent Public Gallery Route */}
        <Route path="/p/:slug" element={<StandalonePublicPage />} />

        {/* All Other Routes handled by Admin Portal */}
        <Route path="*" element={<AdminApp />} />
      </Routes>
    </HashRouter>
  );
}
