
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export const usePhotoManagement = () => {
  const queryClient = useQueryClient()

  const updatePhotoVisibility = useMutation({
    mutationFn: async ({ 
      photoId, 
      isPublic, 
      adminNotes 
    }: { 
      photoId: string
      isPublic: boolean
      adminNotes?: string 
    }) => {
      const { error } = await supabase
        .from('project_photos')
        .update({ 
          is_visible_to_customer: isPublic,
          caption: adminNotes
        })
        .eq('id', photoId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-photos'] })
      queryClient.invalidateQueries({ queryKey: ['storage-metrics'] })
      toast.success('Photo visibility updated')
    },
    onError: (error) => {
      console.error('Error updating photo visibility:', error)
      toast.error('Failed to update photo visibility')
    }
  })

  const updateProjectVisibility = useMutation({
    mutationFn: async ({ 
      projectId, 
      isPublic, 
      adminNotes 
    }: { 
      projectId: string
      isPublic: boolean
      adminNotes?: string 
    }) => {
      const { error } = await supabase
        .from('projects')
        .update({ 
          is_public: isPublic,
          description: adminNotes
        })
        .eq('id', projectId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project visibility updated')
    },
    onError: (error) => {
      console.error('Error updating project visibility:', error)
      toast.error('Failed to update project visibility')
    }
  })

  const bulkUpdatePhotos = useMutation({
    mutationFn: async ({ 
      photoIds, 
      isPublic 
    }: { 
      photoIds: string[]
      isPublic: boolean 
    }) => {
      const { error } = await supabase
        .from('project_photos')
        .update({ 
          is_visible_to_customer: isPublic
        })
        .in('id', photoIds)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-photos'] })
      queryClient.invalidateQueries({ queryKey: ['storage-metrics'] })
      toast.success('Photos updated successfully')
    },
    onError: (error) => {
      console.error('Error bulk updating photos:', error)
      toast.error('Failed to update photos')
    }
  })

  return {
    updatePhotoVisibility,
    updateProjectVisibility,
    bulkUpdatePhotos
  }
}
