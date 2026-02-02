import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SolarSegment {
  segmentId: string;
  areaSqFt: number;
  areaSquares: number;
  pitch: string;
  pitchDegrees: number;
  azimuth: number;
  orientation: string;
  center: { latitude: number; longitude: number };
  boundingBox: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  perimeter: number;
  heightAtCenter: number;
}

interface ParsedRoofData {
  totalAreaSqFt: number;
  totalAreaSquares: number;
  totalPerimeter: number;
  segments: SolarSegment[];
  maxPanelsCount: number;
  maxSunshineHours: number;
  edgeEstimates: {
    eave_lf: number;
    rake_lf: number;
    ridge_lf: number;
    hip_lf: number;
    valley_lf: number;
    wall_lf: number;
    step_lf: number;
  };
  imageryUrl?: string;
}

interface SolarAnalysis {
  id: string;
  quote_request_id: string;
  raw_api_response: any;
  parsed_roof_data: ParsedRoofData;
  total_area_sqft: number;
  total_area_squares: number;
  imagery_date: string;
  imagery_quality: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_score: number;
  status: 'processing' | 'complete' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export const useSolarAnalysis = (quoteId?: string) => {
  const queryClient = useQueryClient();

  // Fetch existing solar analysis
  const { data: solarAnalysis, isLoading, error, refetch } = useQuery({
    queryKey: ['solar-analysis', quoteId],
    queryFn: async () => {
      if (!quoteId) return null;

      const { data, error } = await supabase
        .from('solar_analyses')
        .select('*')
        .eq('quote_request_id', quoteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as SolarAnalysis | null;
    },
    enabled: !!quoteId,
  });

  // Trigger new solar analysis
  const analyzeSolar = useMutation({
    mutationFn: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      if (!quoteId) throw new Error('Quote ID is required');

      const { data, error } = await supabase.functions.invoke('google-solar-analysis', {
        body: { quoteId, latitude, longitude },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Analysis failed');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solar-analysis', quoteId] });
      toast.success('Solar analysis complete!');
    },
    onError: (error: Error) => {
      console.error('Solar analysis error:', error);
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  // Apply solar data to quantities table
  const applyToQuantities = useMutation({
    mutationFn: async (projectId: string) => {
      if (!solarAnalysis?.parsed_roof_data) {
        throw new Error('No solar analysis data available');
      }

      const { edgeEstimates, totalAreaSqFt } = solarAnalysis.parsed_roof_data;

      const { error } = await supabase
        .from('quantities')
        .upsert({
          project_id: projectId,
          area_sq: totalAreaSqFt,
          eave_lf: edgeEstimates.eave_lf,
          rake_lf: edgeEstimates.rake_lf,
          ridge_lf: edgeEstimates.ridge_lf,
          hip_lf: edgeEstimates.hip_lf,
          valley_lf: edgeEstimates.valley_lf,
          wall_lf: edgeEstimates.wall_lf || 0,
          step_lf: edgeEstimates.step_lf || 0,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'project_id'
        });

      if (error) throw error;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantities'] });
      toast.success('Quantities updated from Solar API data!');
    },
    onError: (error: Error) => {
      console.error('Error updating quantities:', error);
      toast.error(`Failed to update quantities: ${error.message}`);
    },
  });

  // Update quote request with solar measurements
  const applyToQuote = useMutation({
    mutationFn: async () => {
      if (!quoteId || !solarAnalysis?.parsed_roof_data) {
        throw new Error('No solar analysis data available');
      }

      const { edgeEstimates, totalAreaSqFt } = solarAnalysis.parsed_roof_data;

      const { error } = await supabase
        .from('quote_requests')
        .update({
          measurements: {
            total_area: totalAreaSqFt,
            eave: edgeEstimates.eave_lf,
            rake: edgeEstimates.rake_lf,
            ridge: edgeEstimates.ridge_lf,
            hip: edgeEstimates.hip_lf,
            valley: edgeEstimates.valley_lf,
            source: 'google_solar_api',
            updated_at: new Date().toISOString(),
          },
        })
        .eq('id', quoteId);

      if (error) throw error;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      toast.success('Quote updated with Solar API measurements!');
    },
    onError: (error: Error) => {
      console.error('Error updating quote:', error);
      toast.error(`Failed to update quote: ${error.message}`);
    },
  });

  return {
    solarAnalysis,
    isLoading,
    error,
    refetch,
    analyzeSolar,
    applyToQuantities,
    applyToQuote,
  };
};
