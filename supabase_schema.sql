-- ====================================================================
-- MAHLIGAI — SCHEMA DATABASE & RLS POLICIES SUPABASE (VERSI TERBARU)
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

-- Migrasi keamanan jika tabel sudah ada dari versi sebelumnya:
-- Pastikan user_id nullable dan tidak memblokir insert tanpa akun auth
DO $$
BEGIN
    ALTER TABLE public.projects ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Index untuk performa pencarian cepat
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
-- Publik dapat melihat proyek yang berstatus 'published'
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;
CREATE POLICY "Public can view published projects"
    ON public.projects FOR SELECT
    USING (status = 'published');

-- Admin dapat membaca semua proyek (baik lewat role authenticated maupun anon key dari aplikasi)
DROP POLICY IF EXISTS "Allow select projects" ON public.projects;
CREATE POLICY "Allow select projects"
    ON public.projects FOR SELECT
    TO anon, authenticated
    USING (true);

-- Admin dapat membuat proyek baru (INSERT)
DROP POLICY IF EXISTS "Allow insert projects" ON public.projects;
CREATE POLICY "Allow insert projects"
    ON public.projects FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admin dapat memperbarui proyek (UPDATE)
DROP POLICY IF EXISTS "Allow update projects" ON public.projects;
CREATE POLICY "Allow update projects"
    ON public.projects FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Admin dapat menghapus proyek (DELETE)
DROP POLICY IF EXISTS "Allow delete projects" ON public.projects;
CREATE POLICY "Allow delete projects"
    ON public.projects FOR DELETE
    TO anon, authenticated
    USING (true);

-- 5. Kebijakan RLS untuk Galleries
-- Publik hanya dapat membaca galeri aktif jika proyeknya 'published'
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

-- Admin dapat membaca semua galeri
DROP POLICY IF EXISTS "Allow select all galleries" ON public.galleries;
CREATE POLICY "Allow select all galleries"
    ON public.galleries FOR SELECT
    TO anon, authenticated
    USING (true);

-- Admin dapat menambahkan galeri (INSERT)
DROP POLICY IF EXISTS "Allow insert galleries" ON public.galleries;
CREATE POLICY "Allow insert galleries"
    ON public.galleries FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admin dapat memperbarui galeri (UPDATE)
DROP POLICY IF EXISTS "Allow update galleries" ON public.galleries;
CREATE POLICY "Allow update galleries"
    ON public.galleries FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Admin dapat menghapus galeri (DELETE)
DROP POLICY IF EXISTS "Allow delete galleries" ON public.galleries;
CREATE POLICY "Allow delete galleries"
    ON public.galleries FOR DELETE
    TO anon, authenticated
    USING (true);

-- 6. Konfigurasi Storage Bucket untuk Upload Cover & Logo Media
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
    USING (bucket_id = 'wedding-media');
