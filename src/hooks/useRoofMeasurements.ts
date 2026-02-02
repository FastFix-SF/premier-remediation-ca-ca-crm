import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RoofMeasurementData {
  area: {
    total_squares: number;
    total_sq_ft: number;
    planes: Array<{ id: string; sq_ft: number }>;
    waste_factor_percent: number;
  };
  linear: {
    eave_edge_lf: number;
    rake_edge_lf: number;
    drip_edge_eave_lf: number;
    drip_edge_rake_lf: number;
    ridges_lf: number;
    hips_lf: number;
    valleys_lf: number;
    pitch_break_lf: number;
    step_flashing_lf: number;
    wall_flashing_apron_lf: number;
    side_wall_lf: number;
    head_wall_lf: number;
    return_walls_lf: number;
  };
  features: {
    chimneys: Array<{ count: number; sizes: string[] }>;
    vents: {
      pipe_boots: number;
      box_vents: number;
      turbine_vents: number;
      ridge_vents_lf: number;
    };
    skylights: Array<{ count: number; sizes: string[] }>;
    dormers: number;
    satellite_dishes: number;
    hvac_units: number;
  };
  pitch: {
    primary: string;
    by_plane: Array<{ id: string; pitch: string }>;
    average: string;
    range: string;
  };
  materials: {
    shingles_squares: number;
    panels_sheets: number;
    underlayment_sq_ft: number;
    ice_water_lf: number;
    flashing_step_lf: number;
    flashing_apron_lf: number;
    ridge_caps_lf: number;
    hip_ridge_shingles_lf: number;
    starter_strip_lf: number;
    valley_liner_lf: number;
    gutters_lf: number;
    downspouts_count: number;
    gutter_guards_lf: number;
  };
  derived: {
    total_planes: number;
    total_perimeter_lf: number;
    complexity: 'low' | 'medium' | 'high';
    estimated_waste_percent: number;
  };
  confidence: number;
  notes: string;
}

export interface RoofMeasurement {
  id: string;
  project_id: string;
  assistant_thread_id?: string;
  assistant_run_id?: string;
  data: RoofMeasurementData;
  confidence_score: number;
  analysis_notes?: string;
  created_at: string;
  updated_at: string;
}

export const useRoofMeasurements = (projectId?: string) => {
  const queryClient = useQueryClient();

  // Fetch roof measurements for a specific project
  const {
    data: roofMeasurement,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['roof-measurements', projectId],
    queryFn: async (): Promise<RoofMeasurement | null> => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('roof_measurements')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching roof measurements:', error);
        throw error;
      }

      return data ? {
        ...data,
        data: data.data as unknown as RoofMeasurementData
      } : null;
    },
    enabled: !!projectId
  });

  // Trigger AI roof measurement analysis
  const measureRoof = useMutation({
    mutationFn: async ({
      projectId,
      imageUrl,
      address,
      lat,
      lng,
      bounds,
      fallbackPitch = "6/12"
    }: {
      projectId: string;
      imageUrl: string;
      address?: string;
      lat?: number;
      lng?: number;
      bounds?: { north: number; south: number; east: number; west: number } | null;
      fallbackPitch?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-measure-roof', {
        body: {
          projectId,
          imageUrl,
          address,
          lat,
          lng,
          bounds,
          fallbackPitch
        }
      });

      if (error) {
        console.error('Error measuring roof:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roof-measurements'] });
      toast.success(`Roof measurement completed! Total: ${data.data?.area?.total_sq_ft?.toLocaleString()} sq ft`);
    },
    onError: (error: any) => {
      console.error('Error measuring roof:', error);
      toast.error('Failed to measure roof with AI');
    }
  });

  return {
    roofMeasurement,
    isLoading,
    error,
    refetch,
    measureRoof
  };
};

export default useRoofMeasurements;