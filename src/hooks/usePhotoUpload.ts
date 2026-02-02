import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export const usePhotoUpload = () => {
  const queryClient = useQueryClient()

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      // Get photo details first
      const { data: photo, error: fetchError } = await supabase
        .from('project_photos')
        .select('photo_url')
        .eq('id', photoId)
        .maybeSingle()

      if (fetchError) throw fetchError

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      // Delete from storage
      if (photo.photo_url) {
        const urlParts = photo.photo_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const projectFolder = urlParts[urlParts.length - 2]
        const filePath = `projects/${projectFolder}/${fileName}`
        
        await supabase.storage
          .from('project-photos')
          .remove([filePath])
      }
    },
    onSuccess: () => {
      // Invalidate both photo and storage queries
      queryClient.invalidateQueries({ queryKey: ['project-photos'] })
      queryClient.invalidateQueries({ queryKey: ['storage-metrics'] })
      toast.success('Photo deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting photo:', error)
      toast.error('Failed to delete photo')
    }
  })

  const uploadPhoto = useMutation({
    mutationFn: async ({ projectId, file, compressedFile }: {
      projectId: string
      file: File
      compressedFile: File
    }) => {
      const user = await supabase.auth.getUser()
      if (!user.data.user) throw new Error('User not authenticated')

      // Create unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = compressedFile.name.split('.').pop() || 'jpg'
      const fileName = `project_${projectId}_${timestamp}_${randomString}.${fileExtension}`
      const filePath = `projects/${projectId}/${fileName}`

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(filePath)

      // Save to database
      const { error: dbError } = await supabase
        .from('project_photos')
        .insert({
          project_id: projectId,
          photo_url: publicUrl,
          is_visible_to_customer: false,
          uploaded_by: user.data.user.id,
          display_order: 0,
          photo_tag: null,
          is_highlighted_before: false,
          is_highlighted_after: false,
          file_size: compressedFile.size
        })

      if (dbError) {
        // Clean up uploaded file on database error
        await supabase.storage
          .from('project-photos')
          .remove([filePath])
        throw dbError
      }

      return { originalSize: file.size, compressedSize: compressedFile.size }
    },
    onSuccess: (data) => {
      // Invalidate both photo and storage queries
      queryClient.invalidateQueries({ queryKey: ['project-photos'] })
      queryClient.invalidateQueries({ queryKey: ['storage-metrics'] })
      
      const originalSize = (data.originalSize / 1024 / 1024).toFixed(1)
      const compressedSize = (data.compressedSize / 1024 / 1024).toFixed(1)
      
      toast.success(`Photo uploaded successfully! Compressed from ${originalSize} MB to ${compressedSize} MB`)
    },
    onError: (error) => {
      console.error('Upload error:', error)
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  return {
    deletePhoto,
    uploadPhoto
  }
}