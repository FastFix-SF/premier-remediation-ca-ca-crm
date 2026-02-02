import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MobileProjectVideo {
  id: string;
  project_id: string;
  video_url: string;
  thumbnail_url?: string;
  caption?: string;
  duration_seconds?: number;
  uploaded_by: string;
  uploaded_at: string;
  file_size?: number;
  is_visible_to_customer: boolean;
}

export const useMobileVideos = (projectId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mobile-videos', projectId, user?.id],
    queryFn: async (): Promise<MobileProjectVideo[]> => {
      if (!user || !projectId) throw new Error('User not authenticated or project ID missing');

      const { data, error } = await supabase
        .from('project_videos')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!projectId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useMobileVideoUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, file, caption }: {
      projectId: string;
      file: File;
      caption?: string;
    }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Create unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'mp4';
      const fileName = `video_${projectId}_${timestamp}_${randomString}.${fileExtension}`;
      const filePath = `${user.data.user.id}/${projectId}/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-videos')
        .getPublicUrl(filePath);

      // Save to database
      const { data: video, error: dbError } = await supabase
        .from('project_videos')
        .insert({
          project_id: projectId,
          video_url: publicUrl,
          caption,
          uploaded_by: user.data.user.id,
          file_size: file.size,
          is_visible_to_customer: false
        })
        .select()
        .maybeSingle();

      if (dbError) {
        // Clean up uploaded file on database error
        await supabase.storage
          .from('project-videos')
          .remove([filePath]);
        throw dbError;
      }

      return video;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mobile-videos', data.project_id] });
      toast.success('Video uploaded successfully');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
};

export const useMobileVideoDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      // Get video details first
      const { data: video, error: fetchError } = await supabase
        .from('project_videos')
        .select('video_url, project_id, uploaded_by')
        .eq('id', videoId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_videos')
        .delete()
        .eq('id', videoId);

      if (dbError) throw dbError;

      // Delete from storage
      if (video.video_url) {
        try {
          const url = new URL(video.video_url);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.findIndex(p => p === 'project-videos');
          if (bucketIndex !== -1) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            await supabase.storage
              .from('project-videos')
              .remove([filePath]);
          }
        } catch (e) {
          console.error('Error deleting video from storage:', e);
        }
      }

      return video.project_id;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['mobile-videos', projectId] });
      toast.success('Video deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    }
  });
};
