import { Project, Gallery, ProjectWithGalleries, ProjectStatus, AdminUser } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { compressImage } from './imageCompressor';

const LOCAL_STORAGE_PROJECTS_KEY = 'mahligai_local_projects';
const LOCAL_STORAGE_GALLERIES_KEY = 'mahligai_local_galleries';
const LOCAL_STORAGE_USER_KEY = 'mahligai_local_user';

// Helper to validate and generate UUIDs
export function isValidUUID(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback below
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const SEED_PROJECT_ANITA: Project = {
  id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
  user_id: '00000000-0000-0000-0000-000000000001',
  brand_name: 'POLA FRAME PHOTOBOOT WEDDING',
  bride_groom_names: 'ANITA DAN RINA',
  slug: 'anita-dan-rina',
  cover_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
  logo_url: '',
  status: 'published',
  instagram: '@polaframe',
  whatsapp: '081234567890',
  show_socials: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  galleries_count: 2,
};

const SEED_GALLERIES_ANITA: Gallery[] = [
  {
    id: 'g1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    project_id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    name: 'Akad Nikah & Ijab Qobul',
    drive_url: 'https://drive.google.com/drive/folders/sample-akad',
    cover_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'g2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5d',
    project_id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    name: 'Resepsi Pernikahan',
    drive_url: 'https://drive.google.com/drive/folders/sample-resepsi',
    cover_url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1000&q=80',
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function initLocalStorage() {
  try {
    const rawProjects = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
    if (!rawProjects || rawProjects === '[]') {
      localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify([SEED_PROJECT_ANITA]));
      localStorage.setItem(LOCAL_STORAGE_GALLERIES_KEY, JSON.stringify(SEED_GALLERIES_ANITA));
    } else {
      // Ensure existing anita-dan-rina has instagram and whatsapp
      const list: Project[] = JSON.parse(rawProjects);
      const anita = list.find((p) => p.slug === 'anita-dan-rina');
      if (anita) {
        let changed = false;
        if (anita.brand_name !== 'POLA FRAME PHOTOBOOT WEDDING') {
          anita.brand_name = 'POLA FRAME PHOTOBOOT WEDDING';
            changed = true;
        }
        if (anita.instagram !== '@polaframe') {
          anita.instagram = '@polaframe';
          changed = true;
        }
        if (!anita.whatsapp) {
          anita.whatsapp = '081234567890';
          changed = true;
        }
        if (anita.show_socials === undefined) {
          anita.show_socials = true;
          changed = true;
        }
        if (changed) {
          localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(list));
        }
      }
    }
  } catch {
    // ignore
  }
}

// Local storage helpers
function getLocalProjects(): Project[] {
  initLocalStorage();
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalProjects(projects: Project[]) {
  localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(projects));
}

function getLocalGalleries(): Gallery[] {
  initLocalStorage();
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_GALLERIES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalGalleries(galleries: Gallery[]) {
  localStorage.setItem(LOCAL_STORAGE_GALLERIES_KEY, JSON.stringify(galleries));
}

function syncToLocal(projectRecord: Project, galleryRecords: Gallery[], isUpdate = false) {
  try {
    const projects = getLocalProjects();
    if (isUpdate) {
      const idx = projects.findIndex((p) => p.id === projectRecord.id);
      if (idx >= 0) {
        projects[idx] = projectRecord;
      } else {
        projects.unshift(projectRecord);
      }
    } else {
      projects.unshift(projectRecord);
    }
    saveLocalProjects(projects);

    let allGalleries = getLocalGalleries().filter((g) => g.project_id !== projectRecord.id);
    allGalleries = [...allGalleries, ...galleryRecords];
    saveLocalGalleries(allGalleries);
  } catch (e) {
    console.warn('Gagal sync ke local storage:', e);
  }
}

// -------------------------------------------------------------
// AUTHENTICATION
// -------------------------------------------------------------

export async function getCurrentUser(): Promise<AdminUser | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        return {
          id: user.id,
          email: user.email || 'admin@studio.com',
          role: 'admin',
        };
      }
    } catch {
      // ignore
    }
  }

  // Fallback to local stored session if exists
  try {
    const localUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (localUser) {
      return JSON.parse(localUser);
    }
  } catch {
    // ignore
  }

  return null;
}

export async function signInAdmin(
  email: string,
  password: string
): Promise<{ user: AdminUser | null; error: string | null }> {
  if (!email.trim() || !password) {
    return { user: null, error: 'Email dan kata sandi wajib diisi' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!error && data.user) {
        const admin: AdminUser = {
          id: data.user.id,
          email: data.user.email || email.trim(),
          role: 'admin',
        };
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(admin));
        return { user: admin, error: null };
      }

      // If user not found in Supabase Auth, let user know or allow studio fallback
      if (error) {
        // If credentials invalid on Supabase
        return { user: null, error: `Gagal masuk: ${error.message}` };
      }
    } catch (err: any) {
      return { user: null, error: err.message || 'Gagal menghubungi server otentikasi Supabase' };
    }
  }

  // If Supabase not yet configured or offline admin
  const admin: AdminUser = {
    id: generateUUID(),
    email: email.trim(),
    role: 'admin',
  };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(admin));
  return { user: admin, error: null };
}

export async function signUpAdmin(
  email: string,
  password: string
): Promise<{ user: AdminUser | null; error: string | null }> {
  if (!email.trim() || !password) {
    return { user: null, error: 'Email dan kata sandi wajib diisi' };
  }
  if (password.length < 6) {
    return { user: null, error: 'Kata sandi minimal 6 karakter' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        return { user: null, error: `Pendaftaran Supabase gagal: ${error.message}` };
      }

      if (data.user) {
        const admin: AdminUser = {
          id: data.user.id,
          email: data.user.email || email.trim(),
          role: 'admin',
        };
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(admin));
        return { user: admin, error: null };
      }
    } catch (err: any) {
      return { user: null, error: err.message || 'Gagal mendaftar ke Supabase' };
    }
  }

  // Offline / local admin registration
  const admin: AdminUser = {
    id: generateUUID(),
    email: email.trim(),
    role: 'admin',
  };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(admin));
  return { user: admin, error: null };
}

export async function signOutAdmin(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
}

// -------------------------------------------------------------
// PROJECTS & GALLERIES CRUD
// -------------------------------------------------------------

export async function getAdminProjects(searchQuery = '', statusFilter = 'all'): Promise<Project[]> {
  const supabase = getSupabaseClient();
  let projects: Project[] = [];
  let galleryRefs: Array<{ id: string; project_id: string }> = [];

  if (supabase) {
    try {
      let query = supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (!error && data) {
        projects = data;
        saveLocalProjects(projects);

        // Fetch galleries to count per project
        const { data: gData, error: gErr } = await supabase.from('galleries').select('id, project_id');
        if (!gErr && gData) {
          galleryRefs = gData as any;
          saveLocalGalleries(gData as any);
        }
      } else {
        if (error) {
          console.warn('Gagal memuat proyek dari Supabase:', error.message);
        }
        projects = getLocalProjects();
        galleryRefs = getLocalGalleries().map((g) => ({ id: g.id, project_id: g.project_id }));
      }
    } catch (err) {
      console.warn('Exception memuat proyek dari Supabase:', err);
      projects = getLocalProjects();
      galleryRefs = getLocalGalleries().map((g) => ({ id: g.id, project_id: g.project_id }));
    }
  } else {
    projects = getLocalProjects();
    galleryRefs = getLocalGalleries().map((g) => ({ id: g.id, project_id: g.project_id }));
  }

  // Count galleries per project
  const galleryCountMap = new Map<string, number>();
  galleryRefs.forEach((g) => {
    galleryCountMap.set(g.project_id, (galleryCountMap.get(g.project_id) || 0) + 1);
  });

  let filtered = projects.map((p) => ({
    ...p,
    galleries_count: galleryCountMap.get(p.id) || 0,
  }));

  if (statusFilter !== 'all') {
    filtered = filtered.filter((p) => p.status === statusFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.bride_groom_names?.toLowerCase().includes(q) ||
        p.brand_name?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q)
    );
  }

  return filtered;
}

export async function getProjectById(id: string): Promise<ProjectWithGalleries | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: proj, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
      if (!error && proj) {
        const { data: gals } = await supabase
          .from('galleries')
          .select('*')
          .eq('project_id', id)
          .order('sort_order', { ascending: true });
        return {
          ...proj,
          galleries: gals || [],
        };
      }
    } catch (err) {
      console.warn('Gagal memuat detail proyek dari Supabase:', err);
    }
  }

  const projects = getLocalProjects();
  const proj = projects.find((p) => p.id === id);
  if (!proj) return null;

  const galleries = getLocalGalleries()
    .filter((g) => g.project_id === id)
    .sort((a, b) => a.sort_order - b.sort_order);

  return { ...proj, galleries };
}

export async function getPublicProjectBySlug(slug: string): Promise<ProjectWithGalleries | null> {
  const cleanSlug = slug.toLowerCase().trim();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      // Must be 'published' for public visitor
      const { data: proj, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', cleanSlug)
        .eq('status', 'published')
        .maybeSingle();

      if (!error && proj) {
        const { data: gals } = await supabase
          .from('galleries')
          .select('*')
          .eq('project_id', proj.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        return {
          ...proj,
          instagram: proj.instagram || (proj.slug === 'anita-dan-rina' ? '@polaframe' : ''),
          whatsapp: proj.whatsapp || (proj.slug === 'anita-dan-rina' ? '081234567890' : ''),
          show_socials: proj.show_socials !== false,
          galleries: gals || [],
        };
      }
    } catch (err) {
      console.warn('Gagal memuat galeri publik dari Supabase:', err);
    }
  }

  // Local storage fallback
  const projects = getLocalProjects();
  const proj = projects.find((p) => p.slug?.toLowerCase() === cleanSlug && p.status === 'published');
  if (proj) {
    const galleries = getLocalGalleries()
      .filter((g) => g.project_id === proj.id && g.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);

    return {
      ...proj,
      instagram: proj.instagram || (proj.slug === 'anita-dan-rina' ? '@polaframe' : ''),
      whatsapp: proj.whatsapp || (proj.slug === 'anita-dan-rina' ? '081234567890' : ''),
      show_socials: proj.show_socials !== false,
      galleries,
    };
  }

  // Guaranteed fallback for anita-dan-rina demo slug
  if (cleanSlug === 'anita-dan-rina') {
    return {
      ...SEED_PROJECT_ANITA,
      galleries: SEED_GALLERIES_ANITA,
    };
  }

  return null;
}

export async function checkSlugAvailable(slug: string, excludeProjectId?: string): Promise<boolean> {
  const cleanSlug = slug.toLowerCase().trim();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      let query = supabase.from('projects').select('id').eq('slug', cleanSlug);
      if (excludeProjectId) {
        query = query.neq('id', excludeProjectId);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.length === 0;
      }
    } catch {
      // fallback
    }
  }

  const projects = getLocalProjects();
  return !projects.some((p) => p.slug?.toLowerCase() === cleanSlug && p.id !== excludeProjectId);
}

export interface SaveProjectPayload {
  brand_name: string;
  bride_groom_names: string;
  slug: string;
  cover_url: string;
  logo_url?: string;
  status: ProjectStatus;
  instagram?: string;
  whatsapp?: string;
  show_socials?: boolean;
  galleries: Array<{
    id?: string;
    name: string;
    drive_url: string;
    cover_url?: string;
    sort_order: number;
    is_active: boolean;
  }>;
}

export interface SaveProjectResult {
  success: boolean;
  project?: ProjectWithGalleries;
  error?: string;
  warning?: string;
}

export async function saveProject(
  payload: SaveProjectPayload,
  projectId?: string
): Promise<SaveProjectResult> {
  const isSlugValid = await checkSlugAvailable(payload.slug, projectId);
  if (!isSlugValid) {
    return {
      success: false,
      error: `Slug "${payload.slug}" sudah digunakan oleh proyek lain. Harap pilih slug yang berbeda.`,
    };
  }

  const currentUser = await getCurrentUser();
  const supabase = getSupabaseClient();

  // Enforce valid UUID for PostgreSQL uuid type
  const targetId = projectId && isValidUUID(projectId) ? projectId : generateUUID();

  // Handle user_id: use auth user id if valid UUID, otherwise null
  const userId =
    currentUser?.id && isValidUUID(currentUser.id)
      ? currentUser.id
      : null;

  const now = new Date().toISOString();

  const projectRecord: Project = {
    id: targetId,
    user_id: userId || '00000000-0000-0000-0000-000000000001',
    brand_name: payload.brand_name.trim(),
    bride_groom_names: payload.bride_groom_names.trim(),
    slug: payload.slug.trim().toLowerCase(),
    cover_url: payload.cover_url,
    logo_url: payload.logo_url || '',
    status: payload.status,
    created_at: now,
    updated_at: now,
    instagram: payload.instagram !== undefined ? payload.instagram.trim() : '',
    whatsapp: payload.whatsapp !== undefined ? payload.whatsapp.trim() : '',
    show_socials: payload.show_socials !== false,
  };

  const galleryRecords: Gallery[] = payload.galleries.map((g, index) => ({
    id: g.id && isValidUUID(g.id) ? g.id : generateUUID(),
    project_id: targetId,
    name: g.name.trim(),
    drive_url: g.drive_url.trim(),
    cover_url: g.cover_url || '',
    sort_order: g.sort_order ?? index + 1,
    is_active: g.is_active ?? true,
    created_at: now,
    updated_at: now,
  }));

  // If Supabase is connected, write directly to Supabase tables
  if (supabase) {
    try {
      if (projectId) {
        // 1. UPDATE EXISTING PROJECT
        const updatePayload: any = {
          brand_name: projectRecord.brand_name,
          bride_groom_names: projectRecord.bride_groom_names,
          slug: projectRecord.slug,
          cover_url: projectRecord.cover_url,
          logo_url: projectRecord.logo_url,
          status: projectRecord.status,
          updated_at: now,
          instagram: projectRecord.instagram,
          whatsapp: projectRecord.whatsapp,
          show_socials: projectRecord.show_socials,
        };
        if (userId) {
          updatePayload.user_id = userId;
        }

        let { error: projErr } = await supabase
          .from('projects')
          .update(updatePayload)
          .eq('id', projectId);

        // Fallback if columns don't exist yet in user's Supabase schema
        if (
          projErr &&
          (projErr.message?.includes('instagram') ||
            projErr.message?.includes('whatsapp') ||
            projErr.message?.includes('show_socials'))
        ) {
          delete updatePayload.instagram;
          delete updatePayload.whatsapp;
          delete updatePayload.show_socials;
          const retry = await supabase.from('projects').update(updatePayload).eq('id', projectId);
          projErr = retry.error;
        }

        if (projErr) {
          console.error('Supabase update projects error:', projErr);
          return {
            success: false,
            error: `Gagal memperbarui proyek di Supabase: ${projErr.message}. Pastikan tabel projects dan aturan RLS sudah dijalankan di Supabase.`,
          };
        }

        // 2. DELETE OLD GALLERIES
        const { error: delGalErr } = await supabase
          .from('galleries')
          .delete()
          .eq('project_id', projectId);

        if (delGalErr) {
          console.warn('Supabase delete old galleries warning:', delGalErr.message);
        }

        // 3. INSERT NEW GALLERIES
        if (galleryRecords.length > 0) {
          const { error: insGalErr } = await supabase.from('galleries').insert(galleryRecords);
          if (insGalErr) {
            console.error('Supabase insert galleries error:', insGalErr);
            return {
              success: false,
              error: `Proyek terupdate, tetapi galeri gagal disimpan di Supabase: ${insGalErr.message}`,
            };
          }
        }
      } else {
        // 1. INSERT NEW PROJECT
        let insertData: any = {
          id: projectRecord.id,
          brand_name: projectRecord.brand_name,
          bride_groom_names: projectRecord.bride_groom_names,
          slug: projectRecord.slug,
          cover_url: projectRecord.cover_url,
          logo_url: projectRecord.logo_url,
          status: projectRecord.status,
          created_at: now,
          updated_at: now,
          instagram: projectRecord.instagram,
          whatsapp: projectRecord.whatsapp,
          show_socials: projectRecord.show_socials,
        };

        if (userId) {
          insertData.user_id = userId;
        }

        let { error: projErr } = await supabase.from('projects').insert(insertData);

        // Fallback if columns don't exist yet in user's Supabase schema
        if (
          projErr &&
          (projErr.message?.includes('instagram') ||
            projErr.message?.includes('whatsapp') ||
            projErr.message?.includes('show_socials'))
        ) {
          delete insertData.instagram;
          delete insertData.whatsapp;
          delete insertData.show_socials;
          const retry = await supabase.from('projects').insert(insertData);
          projErr = retry.error;
        }

        // If insert error is foreign key on user_id, retry with user_id = null
        if (
          projErr &&
          (projErr.message?.includes('foreign key') ||
            projErr.message?.includes('user_id') ||
            projErr.code === '23503')
        ) {
          const fallbackData = { ...insertData, user_id: null };
          const retryRes = await supabase.from('projects').insert(fallbackData);
          projErr = retryRes.error;
        }

        if (projErr) {
          console.error('Supabase insert project error:', projErr);
          return {
            success: false,
            error: `Gagal menyimpan proyek ke Supabase: ${projErr.message}. Pastikan Anda telah menjalankan skrip SQL schema & RLS di SQL Editor Supabase.`,
          };
        }

        // 2. INSERT GALLERIES
        if (galleryRecords.length > 0) {
          const { error: galErr } = await supabase.from('galleries').insert(galleryRecords);
          if (galErr) {
            console.error('Supabase insert galleries error:', galErr);
            return {
              success: false,
              error: `Proyek tersimpan di Supabase, namun galeri foto gagal disimpan: ${galErr.message}`,
            };
          }
        }
      }

      // Sync to local storage for instant browser caching
      syncToLocal(projectRecord, galleryRecords, Boolean(projectId));

      return {
        success: true,
        project: { ...projectRecord, galleries: galleryRecords },
      };
    } catch (err: any) {
      console.error('Supabase unexpected error during save:', err);
      return {
        success: false,
        error: `Gagal menyimpan ke Supabase: ${err.message || 'Kesalahan jaringan atau server Supabase'}.`,
      };
    }
  }

  // Local cache synchronization
  syncToLocal(projectRecord, galleryRecords, Boolean(projectId));
  return {
    success: true,
    project: { ...projectRecord, galleries: galleryRecords },
  };
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status, updated_at: now })
        .eq('id', id);

      if (error) {
        console.error('Supabase update status error:', error);
        return {
          success: false,
          error: `Gagal memperbarui status di Supabase: ${error.message}`,
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menghubungi Supabase' };
    }
  }

  // Sync to local
  const projects = getLocalProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx >= 0) {
    projects[idx].status = status;
    projects[idx].updated_at = now;
    saveLocalProjects(projects);
    return { success: true };
  }

  return { success: true };
}

export async function deleteProject(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // 1. Delete associated galleries first
      await supabase.from('galleries').delete().eq('project_id', id);

      // 2. Delete project
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete project error:', error);
        return {
          success: false,
          error: `Gagal menghapus proyek dari Supabase: ${error.message}`,
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menghubungi Supabase' };
    }
  }

  // Remove from local cache
  const projects = getLocalProjects().filter((p) => p.id !== id);
  saveLocalProjects(projects);

  const galleries = getLocalGalleries().filter((g) => g.project_id !== id);
  saveLocalGalleries(galleries);

  return { success: true };
}

// -------------------------------------------------------------
// FILE UPLOAD (SUPABASE STORAGE + DATA URL FALLBACK)
// -------------------------------------------------------------

export interface UploadMediaResult {
  url: string;
  error?: string;
  compressionInfo?: {
    originalSize: string;
    compressedSize: string;
    savedPercent: number;
  };
}

export async function uploadMediaFile(
  file: File,
  folder: 'covers' | 'logos'
): Promise<UploadMediaResult> {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    return { url: '', error: 'Format file tidak didukung. Harap unggah file JPG, PNG, atau WebP.' };
  }

  // Allow larger original files (up to 25MB) as they will be compressed locally
  const maxInitialSize = 25 * 1024 * 1024;
  if (file.size > maxInitialSize) {
    return { url: '', error: 'Ukuran file asli terlalu besar. Maksimum 25MB.' };
  }

  // 1. Kompres gambar di sisi klien (mengurangi MB/KB secara signifikan)
  let compressed;
  try {
    compressed = await compressImage(file, folder);
  } catch (err: any) {
    return { url: '', error: err.message || 'Gagal mengompres gambar.' };
  }

  const compressionInfo = {
    originalSize: compressed.originalSizeFormatted,
    compressedSize: compressed.compressedSizeFormatted,
    savedPercent: compressed.savedPercentage,
  };

  const fileToUpload = compressed.file;

  // 2. Upload file terkompresi ke Supabase Storage jika telah terkonfigurasi
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const ext = fileToUpload.name.split('.').pop() || 'jpg';
      const cleanFileName = `${folder}/${Date.now()}-${generateUUID().substring(0, 8)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('wedding-media')
        .upload(cleanFileName, fileToUpload, { cacheControl: '3600', upsert: true });

      if (!error && data) {
        const { data: pubData } = supabase.storage.from('wedding-media').getPublicUrl(cleanFileName);
        if (pubData?.publicUrl) {
          return { url: pubData.publicUrl, compressionInfo };
        }
      } else if (error) {
        console.warn('Supabase storage upload note:', error.message);
      }
    } catch (e) {
      console.warn('Supabase storage upload failed:', e);
    }
  }

  // 3. Fallback: Gunakan Data URL yang sudah dikompresi agar hemat memori browser
  return {
    url: compressed.dataUrl,
    compressionInfo,
  };
}
