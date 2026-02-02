import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RoofAnalysis {
  id: string;
  aerial_image_id: string;
  analysis_status: string;
  total_roof_area?: number;
  roof_complexity_score?: number;
  roof_outline_coordinates?: any;
  roof_planes_data?: any;
  ai_confidence_score?: number;
  ai_response_data?: any;
  penetration_count?: number;
  chimney_count?: number;
  vent_count?: number;
  skylight_count?: number;
  gutter_length_ft?: number;
  downspout_count?: number;
  roof_pitch_degrees?: number;
  dormer_count?: number;
  valley_count?: number;
  ridge_length_ft?: number;
  created_at: string;
  updated_at: string;
}

export interface RoofFeature {
  id: string;
  roof_analysis_id: string;
  feature_type: string;
  feature_coordinates: any;
  dimensions?: any;
  feature_count: number;
  confidence_score: number;
  measurements?: any;
  created_at: string;
}

export interface RoofPlane {
  id: string;
  roof_analysis_id: string;
  plane_coordinates: any;
  area_sqft?: number;
  slope_angle?: number;
  plane_type: string;
  created_at: string;
}

export const useRoofAnalysis = (aerialImageId?: string) => {
  const queryClient = useQueryClient();

  // Fetch roof analysis for a specific aerial image
  const {
    data: roofAnalysis,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['roof-analysis', aerialImageId],
    queryFn: async (): Promise<RoofAnalysis | null> => {
      if (!aerialImageId) return null;

      const { data, error } = await supabase
        .from('roof_analyses')
        .select('*')
        .eq('aerial_image_id', aerialImageId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching roof analysis:', error);
        throw error;
      }

      return data;
    },
    enabled: !!aerialImageId
  });

  // Fetch roof planes for a specific analysis
  const {
    data: roofPlanes,
    isLoading: isPlanesLoading
  } = useQuery({
    queryKey: ['roof-planes', roofAnalysis?.id],
    queryFn: async (): Promise<RoofPlane[]> => {
      if (!roofAnalysis?.id) return [];

      const { data, error } = await supabase
        .from('roof_planes')
        .select('*')
        .eq('roof_analysis_id', roofAnalysis.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching roof planes:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!roofAnalysis?.id
  });

  // Fetch roof features for a specific analysis
  const {
    data: roofFeatures,
    isLoading: isFeaturesLoading
  } = useQuery({
    queryKey: ['roof-features', roofAnalysis?.id],
    queryFn: async (): Promise<RoofFeature[]> => {
      if (!roofAnalysis?.id) return [];

      const { data, error } = await supabase
        .from('roof_features')
        .select('*')
        .eq('roof_analysis_id', roofAnalysis.id)
        .order('feature_type', { ascending: true });

      if (error) {
        console.error('Error fetching roof features:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!roofAnalysis?.id
  });

  // Trigger roof analysis
  const analyzeRoof = useMutation({
    mutationFn: async ({
      aerialImageId,
      imageUrl,
      propertyAddress
    }: {
      aerialImageId: string;
      imageUrl: string;
      propertyAddress: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('analyze-roof-ai', {
        body: {
          aerialImageId,
          imageUrl,
          propertyAddress
        }
      });

      if (error) {
        console.error('Error analyzing roof:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roof-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['roof-planes'] });
      queryClient.invalidateQueries({ queryKey: ['roof-features'] });
      toast.success(`Roof analysis completed! Total area: ${data.totalArea?.toLocaleString()} sq ft`);
    },
    onError: (error: any) => {
      console.error('Error analyzing roof:', error);
      toast.error('Failed to analyze roof');
    }
  });

  // Delete roof analysis
  const deleteAnalysis = useMutation({
    mutationFn: async (analysisId: string) => {
      const { error } = await supabase
        .from('roof_analyses')
        .delete()
        .eq('id', analysisId);

      if (error) {
        console.error('Error deleting roof analysis:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roof-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['roof-planes'] });
      queryClient.invalidateQueries({ queryKey: ['roof-features'] });
      toast.success('Roof analysis deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting roof analysis:', error);
      toast.error('Failed to delete roof analysis');
    }
  });

  return {
    roofAnalysis,
    roofPlanes: roofPlanes || [],
    roofFeatures: roofFeatures || [],
    isLoading: isLoading || isPlanesLoading || isFeaturesLoading,
    error,
    refetch,
    analyzeRoof,
    deleteAnalysis
  };
};

export default useRoofAnalysis;