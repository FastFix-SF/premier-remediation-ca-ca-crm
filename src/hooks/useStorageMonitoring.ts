import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface StorageMetrics {
  totalPhotos: number
  totalSizeBytes: number
  totalSizeMB: number
  photosByProject: Record<string, number>
  recentUploads: number
  avgPhotoSize: number
}

export const useStorageMonitoring = () => {
  const getStorageMetrics = useQuery({
    queryKey: ['storage-metrics'],
    queryFn: async (): Promise<StorageMetrics> => {
      try {
        // Get all photos with project info
        const { data: photos, error } = await supabase
          .from('project_photos')
          .select('project_id, uploaded_at')

        if (error) throw error

        // Get storage usage from Supabase Storage
        const { data: files, error: storageError } = await supabase
          .storage
          .from('project-photos')
          .list('', { limit: 1000 })

        if (storageError) throw storageError

        const totalSizeBytes = files?.reduce((acc, file) => acc + (file.metadata?.size || 0), 0) || 0
        const totalSizeMB = totalSizeBytes / (1024 * 1024)
        
        // Calculate metrics
        const photosByProject = photos?.reduce((acc, photo) => {
          acc[photo.project_id] = (acc[photo.project_id] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        const recentUploads = photos?.filter(photo => 
          new Date(photo.uploaded_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length || 0

        const avgPhotoSize = totalSizeBytes / (photos?.length || 1)

        return {
          totalPhotos: photos?.length || 0,
          totalSizeBytes,
          totalSizeMB: Math.round(totalSizeMB * 100) / 100,
          photosByProject,
          recentUploads,
          avgPhotoSize: Math.round(avgPhotoSize / 1024) // KB
        }
      } catch (error) {
        console.error('Storage monitoring error:', error)
        throw error
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000 // Consider stale after 2 minutes
  })

  return {
    metrics: getStorageMetrics.data,
    isLoading: getStorageMetrics.isLoading,
    error: getStorageMetrics.error,
    refetch: getStorageMetrics.refetch
  }
}