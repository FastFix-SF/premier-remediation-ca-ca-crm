import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProjectWithPhoto {
  id: string;
  name: string;
  description?: string;
  original_scope?: string;
  status: string;
  created_at: string;
  updated_at: string;
  start_date?: string;
  end_date?: string;
  address?: string;
  project_type?: string;
  project_category?: string;
  roof_type?: string;
  is_public?: boolean;
  is_featured?: boolean;
  customer_rating?: number;
  rating_submitted_at?: string;
  customer_email?: string;
  project_assignments?: { customer_email: string }[];
  best_photo?: {
    id: string;
    photo_url: string;
    caption?: string;
    photo_tag?: string;
    is_highlighted_before?: boolean;
    is_highlighted_after?: boolean;
    display_order?: number;
  };
}

export const useProjectsWithPhotos = () => {
  const [projects, setProjects] = useState<ProjectWithPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchProjectsWithPhotos = async () => {
    try {
      setLoading(true);
      
      // Fetch projects with their photos
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          project_assignments(customer_email),
          project_photos(
            id,
            photo_url,
            caption,
            photo_tag,
            is_highlighted_before,
            is_highlighted_after,
            display_order
          )
        `)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Apply best photo selection algorithm
      const projectsWithBestPhoto = (projectsData || []).map(project => {
        const photos = project.project_photos || [];
        let bestPhoto = null;

        if (photos.length > 0) {
          // Priority order for best photo selection:
          // 1. Highlighted "after" photos (is_highlighted_after = true)
          // 2. "After" photos (photo_tag = 'after')
          // 3. Highlighted "before" photos (is_highlighted_before = true) 
          // 4. Highest display_order photos
          // 5. First uploaded photo (fallback)

          const highlightedAfter = photos.find(p => p.is_highlighted_after);
          const afterPhotos = photos.filter(p => p.photo_tag === 'after');
          const highlightedBefore = photos.find(p => p.is_highlighted_before);
          const orderedPhotos = photos.filter(p => p.display_order && p.display_order > 0)
            .sort((a, b) => (b.display_order || 0) - (a.display_order || 0));

          bestPhoto = highlightedAfter || 
                     (afterPhotos.length > 0 ? afterPhotos[0] : null) ||
                     highlightedBefore ||
                     (orderedPhotos.length > 0 ? orderedPhotos[0] : null) ||
                     photos[0];
        }

        return {
          ...project,
          best_photo: bestPhoto
        };
      });

      setProjects(projectsWithBestPhoto);
    } catch (error) {
      console.error('Error fetching projects with photos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsWithPhotos();
  }, []);

  // Smart search across multiple fields with debouncing
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;

    const query = searchQuery.toLowerCase().trim();
    const searchTerms = query.split(/\s+/);

    return projects.filter(project => {
      const searchableText = [
        project.name,
        project.address,
        project.description,
        project.customer_email,
        project.project_category,
        project.roof_type,
        project.status,
        ...(project.project_assignments?.map(a => a.customer_email) || [])
      ].filter(Boolean).join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [projects, searchQuery]);

  return {
    projects: filteredProjects,
    allProjects: projects,
    loading,
    searchQuery,
    setSearchQuery,
    refetch: fetchProjectsWithPhotos
  };
};