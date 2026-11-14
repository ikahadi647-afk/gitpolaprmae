export type ProjectStatus = 'draft' | 'published' | 'archived';

export interface Project {
  id: string;
  user_id: string;
  brand_name: string;
  bride_groom_names: string;
  slug: string;
  cover_url: string;
  logo_url?: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  galleries_count?: number;
  instagram?: string;
  whatsapp?: string;
  show_socials?: boolean;
}

export interface Gallery {
  id: string;
  project_id: string;
  name: string;
  drive_url: string;
  cover_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithGalleries extends Project {
  galleries: Gallery[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  mode: 'supabase' | 'local';
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
}
