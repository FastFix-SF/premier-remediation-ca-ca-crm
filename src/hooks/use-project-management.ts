
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export const useProjectManagement = () => {
  const queryClient = useQueryClient()

  const updateProjectVisibility = useMutation({
    mutationFn: async ({ 
      projectId, 
      isPublic 
    }: { 
      projectId: string
      isPublic: boolean
    }) => {
      const { error } = await supabase
        .from('projects')
        .update({ 
          is_public: isPublic
        })
        .eq('id', projectId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project visibility updated successfully')
    },
    onError: (error) => {
      console.error('Error updating project visibility:', error)
      toast.error('Failed to update project visibility')
    }
  })

  return {
    updateProjectVisibility
  }
}
