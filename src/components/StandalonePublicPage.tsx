import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicProjectBySlug } from '../lib/dataService';
import { ProjectWithGalleries } from '../types';
import { PublicGalleryPage } from './PublicGalleryPage';
import { Loader2 } from 'lucide-react';

export const StandalonePublicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectWithGalleries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchProject() {
      if (!slug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const proj = await getPublicProjectBySlug(slug);
        if (isMounted) {
          setProject(proj);
        }
      } catch (err) {
        console.error('Error fetching public project:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchProject();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400 mb-3" />
        <p className="text-xs tracking-wider uppercase font-medium text-stone-500">
          Memuat Galeri Pernikahan...
        </p>
      </div>
    );
  }

  return (
    <PublicGalleryPage
      project={project}
      isPreview={false}
      onBackToAdmin={() => navigate('/')}
    />
  );
};
