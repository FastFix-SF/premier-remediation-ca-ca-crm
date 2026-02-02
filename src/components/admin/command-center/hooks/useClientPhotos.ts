import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientPhoto {
  id: string;
  url: string;
  caption: string | null;
  tag: string | null;
  isBefore: boolean;
  isAfter: boolean;
  uploadedAt: string;
}

export const useClientPhotos = (projectId: string | undefined) => {
  const { data: photos = [], isLoading, refetch } = useQuery({
    queryKey: ['client-photos', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_photos')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(photo => ({
        id: photo.id,
        url: photo.photo_url,
        caption: photo.caption,
        tag: photo.photo_tag,
        isBefore: photo.is_highlighted_before || false,
        isAfter: photo.is_highlighted_after || false,
        uploadedAt: photo.uploaded_at
      })) as ClientPhoto[];
    },
    enabled: !!projectId
  });

  // Separate before and after photos
  const beforePhotos = photos.filter(p => p.isBefore);
  const afterPhotos = photos.filter(p => p.isAfter);
  const otherPhotos = photos.filter(p => !p.isBefore && !p.isAfter);

  return {
    photos,
    beforePhotos,
    afterPhotos,
    otherPhotos,
    isLoading,
    refetch
  };
};
