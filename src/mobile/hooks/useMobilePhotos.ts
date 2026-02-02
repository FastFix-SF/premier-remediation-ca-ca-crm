import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MobileProjectPhoto } from '@/shared/types';
import { toast } from 'sonner';

const getInitials = (fullName?: string): string => {
  if (!fullName) return '??';
  const parts = fullName.trim().split(' ').filter(Boolean);
  const first = parts[0]?.charAt(0)?.toUpperCase() || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0)?.toUpperCase() : '';
  return first + last || '??';
};

export const useMobilePhotos = (projectId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mobile-photos', projectId, user?.id],
    queryFn: async (): Promise<MobileProjectPhoto[]> => {
      if (!user || !projectId) throw new Error('User not authenticated or project ID missing');

      const { data, error } = await supabase
        .from('project_photos')
        .select(`
          id,
          project_id,
          photo_url,
          caption,
          recommendation,
          uploaded_by,
          uploaded_at,
          file_size
        `)
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Get unique uploader IDs
      const uploaderIds = [...new Set(data.map(p => p.uploaded_by).filter(Boolean))];

      // Fetch team member details for uploaders
      let teamMembers: Record<string, { full_name: string }> = {};
      if (uploaderIds.length > 0) {
        const { data: members } = await supabase
          .from('team_directory')
          .select('user_id, full_name')
          .in('user_id', uploaderIds);

        if (members) {
          teamMembers = members.reduce((acc, m) => {
            if (m.user_id) {
              acc[m.user_id] = { full_name: m.full_name || '' };
            }
            return acc;
          }, {} as Record<string, { full_name: string }>);
        }
      }

      // Map photos with uploader details
      return data.map(photo => ({
        ...photo,
        uploader_initials: getInitials(teamMembers[photo.uploaded_by || '']?.full_name),
        uploader_name: teamMembers[photo.uploaded_by || '']?.full_name || 'Unknown'
      }));
    },
    enabled: !!user && !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes for better caching
  });
};

export const useMobilePhotoUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, file, caption, recommendation }: {
      projectId: string;
      file: File;
      caption?: string;
      recommendation?: string;
    }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Create unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `project_${projectId}_${timestamp}_${randomString}.${fileExtension}`;
      const filePath = `projects/${projectId}/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(filePath);

      // Save to database
      const { data: photo, error: dbError } = await supabase
        .from('project_photos')
        .insert({
          project_id: projectId,
          photo_url: publicUrl,
          caption,
          recommendation,
          is_visible_to_customer: false,
          uploaded_by: user.data.user.id,
          display_order: 0,
          photo_tag: null,
          is_highlighted_before: false,
          is_highlighted_after: false,
          file_size: file.size
        })
        .select()
        .maybeSingle();

      if (dbError) {
        // Clean up uploaded file on database error
        await supabase.storage
          .from('project-photos')
          .remove([filePath]);
        throw dbError;
      }

      return photo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mobile-photos', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-photos'] });
      toast.success('Photo uploaded successfully');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
};

export const useMobilePhotoDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      console.log('[useMobilePhotoDelete] Starting delete for photoId:', photoId);
      
      // Get photo details first
      console.log('[useMobilePhotoDelete] Fetching photo details...');
      const { data: photo, error: fetchError } = await supabase
        .from('project_photos')
        .select('photo_url, project_id')
        .eq('id', photoId)
        .maybeSingle();

      if (fetchError) {
        console.error('[useMobilePhotoDelete] Fetch error:', fetchError);
        throw fetchError;
      }
      console.log('[useMobilePhotoDelete] Photo details fetched:', photo.project_id);

      // Delete from database
      console.log('[useMobilePhotoDelete] Deleting from database...');
      const { error: dbError } = await supabase
        .from('project_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) {
        console.error('[useMobilePhotoDelete] Database delete error:', dbError);
        throw dbError;
      }
      console.log('[useMobilePhotoDelete] Database delete successful');

      // Delete from storage (best effort - don't block on this)
      if (photo.photo_url) {
        console.log('[useMobilePhotoDelete] Deleting from storage...');
        try {
          const urlParts = photo.photo_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const projectFolder = urlParts[urlParts.length - 2];
          const filePath = `projects/${projectFolder}/${fileName}`;
          
          await supabase.storage
            .from('project-photos')
            .remove([filePath]);
          console.log('[useMobilePhotoDelete] Storage delete successful');
        } catch (storageError) {
          // Log but don't throw - storage cleanup is best effort
          console.warn('[useMobilePhotoDelete] Storage delete failed (non-blocking):', storageError);
        }
      }

      console.log('[useMobilePhotoDelete] Delete complete, returning project_id:', photo.project_id);
      return photo.project_id;
    },
    onSuccess: (projectId) => {
      console.log('[useMobilePhotoDelete] onSuccess - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['mobile-photos', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-photos'] });
      toast.success('Photo deleted successfully');
    },
    onError: (error) => {
      console.error('[useMobilePhotoDelete] onError:', error);
      toast.error('Failed to delete photo');
    }
  });
};

export const useMobilePhotoUpdateCaption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, caption }: { photoId: string; caption: string }) => {
      const { data, error } = await supabase
        .from('project_photos')
        .update({ caption })
        .eq('id', photoId)
        .select('project_id')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mobile-photos', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-photos'] });
      toast.success('Notes updated successfully');
    },
    onError: (error) => {
      console.error('Error updating photo notes:', error);
      toast.error('Failed to update notes');
    }
  });
};

export const useMobilePhotoUpdateRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, recommendation }: { photoId: string; recommendation: string }) => {
      const { data, error } = await supabase
        .from('project_photos')
        .update({ recommendation })
        .eq('id', photoId)
        .select('project_id')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mobile-photos', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-photos'] });
      toast.success('Recommendation updated successfully');
    },
    onError: (error) => {
      console.error('Error updating photo recommendation:', error);
      toast.error('Failed to update recommendation');
    }
  });
};

export const useMobilePhotoUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, file }: { photoId: string; file: File }) => {
      // 1. Get existing photo details
      const { data: photo, error: fetchError } = await supabase
        .from('project_photos')
        .select('photo_url, project_id')
        .eq('id', photoId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // 2. Delete old file from storage
      if (photo.photo_url) {
        const urlParts = photo.photo_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const projectFolder = urlParts[urlParts.length - 2];
        const filePath = `projects/${projectFolder}/${fileName}`;
        await supabase.storage.from('project-photos').remove([filePath]);
      }

      // 3. Upload new file
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const newFileName = `project_${photo.project_id}_${timestamp}_${randomString}.${fileExtension}`;
      const newFilePath = `projects/${photo.project_id}/${newFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(newFilePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // 4. Get new public URL and update database
      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(newFilePath);

      const { data, error: updateError } = await supabase
        .from('project_photos')
        .update({ photo_url: publicUrl })
        .eq('id', photoId)
        .select('project_id')
        .maybeSingle();

      if (updateError) {
        // Clean up uploaded file on database error
        await supabase.storage.from('project-photos').remove([newFilePath]);
        throw updateError;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mobile-photos', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-photos'] });
      toast.success('Photo updated successfully');
    },
    onError: (error) => {
      console.error('Error updating photo:', error);
      toast.error('Failed to update photo');
    }
  });
};