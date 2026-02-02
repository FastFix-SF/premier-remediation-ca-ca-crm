import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AerialImage {
  id: string;
  lead_id?: string;
  project_id?: string;
  quote_request_id?: string;
  property_address: string;
  latitude?: number;
  longitude?: number;
  image_url: string;
  thumbnail_url?: string;
  image_type: string;
  api_source: string;
  capture_date?: string;
  season?: string;
  angle?: string;
  resolution?: string;
  zoom_level?: number;
  image_quality_score?: number;
  file_size?: number;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

export const useAerialImages = (quoteRequestId?: string, projectId?: string) => {
  const queryClient = useQueryClient();

  // Fetch aerial images for a specific quote request or project
  const {
    data: aerialImages,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['aerial-images', quoteRequestId, projectId],
    queryFn: async (): Promise<AerialImage[]> => {
      let query = supabase.from('aerial_images').select('*');

      if (quoteRequestId) {
        query = query.eq('quote_request_id', quoteRequestId);
      }
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (!quoteRequestId && !projectId) {
        // Return all images if no specific filter
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching aerial images:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!(quoteRequestId || projectId || (!quoteRequestId && !projectId))
  });

// Trigger aerial imagery acquisition
const acquireAerialImagery = useMutation({
  mutationFn: async ({
    quoteRequestId,
    projectId,
    propertyAddress,
    latitude,
    longitude
  }: {
    quoteRequestId?: string;
    projectId?: string;
    propertyAddress: string;
    latitude?: number;
    longitude?: number;
  }) => {
    const { data, error } = await supabase.functions.invoke('acquire-aerial-imagery', {
      body: {
        quoteRequestId,
        projectId,
        propertyAddress,
        latitude,
        longitude
      }
    });

    if (error) {
      console.error('Error acquiring aerial imagery:', error);
      throw error;
    }

    return data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['aerial-images'] });
    toast.success(`Successfully acquired ${data.images?.length || 0} aerial images`);
  },
  onError: (error: any) => {
    console.error('Error acquiring aerial imagery:', error);
    toast.error('Failed to acquire aerial imagery');
  }
});

  // Delete aerial image
  const deleteAerialImage = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase
        .from('aerial_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('Error deleting aerial image:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerial-images'] });
      toast.success('Aerial image deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting aerial image:', error);
      toast.error('Failed to delete aerial image');
    }
  });

  // Update aerial image metadata
  const updateAerialImage = useMutation({
    mutationFn: async ({
      imageId,
      updates
    }: {
      imageId: string;
      updates: Partial<AerialImage>;
    }) => {
      const { error } = await supabase
        .from('aerial_images')
        .update(updates)
        .eq('id', imageId);

      if (error) {
        console.error('Error updating aerial image:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerial-images'] });
      toast.success('Aerial image updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating aerial image:', error);
      toast.error('Failed to update aerial image');
    }
  });

  return {
    aerialImages: aerialImages || [],
    isLoading,
    error,
    refetch,
    acquireAerialImagery,
    deleteAerialImage,
    updateAerialImage
  };
};

export default useAerialImages;