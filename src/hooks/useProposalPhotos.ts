import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProposalPhoto } from '@/types/comparison';

export const useProposalPhotos = (comparisonBlockId?: string) => {
  const queryClient = useQueryClient();

  // Upload photo for comparison block
  const uploadProposalPhoto = useMutation({
    mutationFn: async ({
      file,
      photoType,
      comparisonBlockId,
      proposalId,
      description
    }: {
      file: File;
      photoType: 'current' | 'proposed';
      comparisonBlockId: string;
      proposalId: string;
      description?: string;
    }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Create unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `comparison_${comparisonBlockId}_${photoType}_${timestamp}_${randomString}.${fileExtension}`;
      const filePath = `comparisons/${comparisonBlockId}/${fileName}`;

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

      // Update existing placeholder photo or create new one
      const { data: existingPhoto } = await supabase
        .from('proposal_photos')
        .select('*')
        .eq('comparison_block_id', comparisonBlockId)
        .eq('photo_type', photoType)
        .maybeSingle();

      if (existingPhoto && existingPhoto.id) {
        // Update existing placeholder
        const { data, error: updateError } = await supabase
          .from('proposal_photos')
          .update({
            photo_url: publicUrl,
            description: description || null,
            file_size: file.size
          })
          .eq('id', existingPhoto.id)
          .select()
          .maybeSingle();

        if (updateError) {
          // Clean up uploaded file on database error
          await supabase.storage
            .from('project-photos')
            .remove([filePath]);
          throw updateError;
        }

        return data as ProposalPhoto;
      } else {
        // Create new photo record
        const { data, error: dbError } = await supabase
          .from('proposal_photos')
          .insert({
            proposal_id: proposalId,
            photo_url: publicUrl,
            photo_type: photoType,
            comparison_block_id: comparisonBlockId,
            description: description || null,
            uploaded_by: user.data.user.id,
            file_size: file.size,
            display_order: photoType === 'current' ? 0 : 1
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

        return data as ProposalPhoto;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comparison-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['proposal-photos'] });
      
      const sizeInMB = (data.file_size / (1024 * 1024)).toFixed(2);
      toast.success(`Photo uploaded successfully (${sizeInMB} MB)`);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    }
  });

  // Delete proposal photo
  const deleteProposalPhoto = useMutation({
    mutationFn: async (photoId: string) => {
      // Get photo details first
      const { data: photo, error: fetchError } = await supabase
        .from('proposal_photos')
        .select('photo_url')
        .eq('id', photoId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Extract file path from URL for storage deletion
      if (photo?.photo_url) {
        const url = new URL(photo.photo_url);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(-2).join('/'); // Get last two parts (folder/filename)
        
        // Delete from storage (don't fail if this fails)
        await supabase.storage
          .from('project-photos')
          .remove([filePath])
          .catch(console.warn);
      }

      // Delete from database  
      const { error: deleteError } = await supabase
        .from('proposal_photos')
        .delete()
        .eq('id', photoId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['proposal-photos'] });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete photo');
    }
  });

  return {
    uploadProposalPhoto,
    deleteProposalPhoto
  };
};