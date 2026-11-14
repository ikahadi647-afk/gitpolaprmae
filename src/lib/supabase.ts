import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'mahligai_supabase_config';

export interface StoredSupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): StoredSupabaseConfig | null {
  // 1. Direct environment variables from .env
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (
    typeof envUrl === 'string' &&
    typeof envKey === 'string' &&
    envUrl.trim() !== '' &&
    envKey.trim() !== ''
  ) {
    return { url: envUrl.trim(), anonKey: envKey.trim() };
  }

  // 2. Stored browser fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch {
    // ignore
  }

  return null;
}

export function saveStoredSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
  cachedClient = null;
}

export function clearStoredSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const cfg = getStoredSupabaseConfig();
  if (cfg?.url && cfg?.anonKey) {
    try {
      cachedClient = createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return cachedClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseClient());
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; tableReady?: boolean }> {
  try {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl.startsWith('https://')) {
      return { success: false, message: 'URL Supabase harus berawalan https://' };
    }
    if (!cleanKey) {
      return { success: false, message: 'Anon Key tidak boleh kosong' };
    }

    const client = createClient(cleanUrl, cleanKey);
    const { error } = await client.from('projects').select('id', { count: 'exact', head: true });

    if (error) {
      // If table doesn't exist yet, connection is valid but schema needed
      if (
        error.message?.includes('relation "public.projects" does not exist') ||
        error.code === '42P01'
      ) {
        return {
          success: true,
          tableReady: false,
          message: 'Koneksi ke Supabase berhasil! Namun tabel `projects` belum dibuat. Jalankan SQL Schema di SQL Editor Supabase.',
        };
      }
      return {
        success: false,
        message: `Koneksi ditolak oleh Supabase: ${error.message} (Kode: ${error.code || 'UNKNOWN'})`,
      };
    }

    return {
      success: true,
      tableReady: true,
      message: 'Koneksi ke Supabase aktif dan tabel `projects` siap digunakan!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menghubungi server Supabase. Periksa URL dan koneksi internet Anda.',
    };
  }
}

export const SUPABASE_SQL_SCRIPT = `-- ====================================================================
-- POLA FRAME — SCHEMA DATABASE & RLS POLICIES SUPABASE (VERSI TERBARU)
-- Platform Pengelolaan Galeri Foto Pengantin & Link Google Drive
-- Jalankan skrip ini langsung di SQL Editor Supabase Anda
-- ====================================================================

-- 1. Buat Tabel Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT NULL,
    brand_name TEXT NOT NULL,
    bride_groom_names TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    cover_url TEXT NOT NULL,
    logo_url TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Migrasi keamanan & kolom tambahan jika tabel sudah ada:
DO $$
BEGIN
    ALTER TABLE public.projects ALTER COLUMN user_id DROP NOT NULL;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS instagram TEXT DEFAULT '';
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '';
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS show_socials BOOLEAN DEFAULT true;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

-- 2. Buat Tabel Galleries (Album foto per acara)
CREATE TABLE IF NOT EXISTS public.galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    drive_url TEXT NOT NULL,
    cover_url TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_galleries_project_id ON public.galleries(project_id);
CREATE INDEX IF NOT EXISTS idx_galleries_sort_order ON public.galleries(project_id, sort_order ASC);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan RLS untuk Projects
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;
CREATE POLICY "Public can view published projects"
    ON public.projects FOR SELECT
    USING (status = 'published');

DROP POLICY IF EXISTS "Allow select projects" ON public.projects;
CREATE POLICY "Allow select projects"
    ON public.projects FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow insert projects" ON public.projects;
CREATE POLICY "Allow insert projects"
    ON public.projects FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update projects" ON public.projects;
CREATE POLICY "Allow update projects"
    ON public.projects FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete projects" ON public.projects;
CREATE POLICY "Allow delete projects"
    ON public.projects FOR DELETE
    TO anon, authenticated
    USING (true);

-- 5. Kebijakan RLS untuk Galleries
DROP POLICY IF EXISTS "Public can view active galleries" ON public.galleries;
CREATE POLICY "Public can view active galleries"
    ON public.galleries FOR SELECT
    USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = galleries.project_id
            AND public.projects.status = 'published'
        )
    );

DROP POLICY IF EXISTS "Allow select all galleries" ON public.galleries;
CREATE POLICY "Allow select all galleries"
    ON public.galleries FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow insert galleries" ON public.galleries;
CREATE POLICY "Allow insert galleries"
    ON public.galleries FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update galleries" ON public.galleries;
CREATE POLICY "Allow update galleries"
    ON public.galleries FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete galleries" ON public.galleries;
CREATE POLICY "Allow delete galleries"
    ON public.galleries FOR DELETE
    TO anon, authenticated
    USING (true);

-- 6. Konfigurasi Storage Bucket untuk Media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wedding-media', 'wedding-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view wedding media" ON storage.objects;
CREATE POLICY "Public can view wedding media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'wedding-media');

DROP POLICY IF EXISTS "Allow upload wedding media" ON storage.objects;
CREATE POLICY "Allow upload wedding media"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'wedding-media');

DROP POLICY IF EXISTS "Allow update wedding media" ON storage.objects;
CREATE POLICY "Allow update wedding media"
    ON storage.objects FOR UPDATE
    TO anon, authenticated
    USING (bucket_id = 'wedding-media');

DROP POLICY IF EXISTS "Allow delete wedding media" ON storage.objects;
CREATE POLICY "Allow delete wedding media"
    ON storage.objects FOR DELETE
    TO anon, authenticated
    USING (bucket_id = 'wedding-media');`;
