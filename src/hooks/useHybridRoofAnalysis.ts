import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HybridAnalysisInput {
  perimeter: Array<{ x: number; y: number }>;
  latitude?: number;
  longitude?: number;
  quoteId?: string;
  imageUrl?: string;
}

interface Edge {
  start: [number, number];
  end: [number, number];
  edgeType: string;
  length: number;
  confidence: number;
  aiConfidence?: number;
  adjustmentReason?: string;
  confidenceBreakdown?: {
    ai: number;
    geometric: number;
    training: number;
    method: string;
  };
}

interface HybridAnalysisResult {
  success: boolean;
  edges: Edge[];
  roofType: string;
  method: string;
  confidence: number;
  analysis: {
    geometric: {
      edges: Edge[];
      roofType: string;
      geometricConfidence: number;
    };
    aiValidation: {
      validatedEdges: Edge[];
      roofTypeConfirmed: string;
      overallConfidence: number;
    };
    edgeCount: number;
  };
}

export function useHybridRoofAnalysis() {
  const analyzeRoof = useMutation({
    mutationFn: async (input: HybridAnalysisInput): Promise<HybridAnalysisResult> => {
      console.log('🔬 Starting hybrid roof analysis...');
      console.log('Input:', {
        perimeterPoints: input.perimeter.length,
        hasLocation: !!(input.latitude && input.longitude),
        hasImage: !!input.imageUrl,
        quoteId: input.quoteId
      });

      const { data, error } = await supabase.functions.invoke('hybrid-roof-analysis', {
        body: {
          perimeter: input.perimeter,
          latitude: input.latitude,
          longitude: input.longitude,
          quoteId: input.quoteId,
          imageUrl: input.imageUrl
        }
      });

      if (error) {
        console.error('Hybrid analysis error:', error);
        throw new Error(error.message || 'Failed to analyze roof');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Analysis failed');
      }

      console.log('✅ Hybrid analysis complete:', {
        method: data.method,
        edgesDetected: data.edges?.length,
        roofType: data.roofType,
        confidence: data.confidence
      });

      return data;
    },
    onSuccess: (data) => {
      const confidencePercent = Math.round(data.confidence * 100);
      toast.success('Hybrid roof analysis complete', {
        description: `${data.edges.length} edges detected with ${confidencePercent}% confidence using ${data.method}`
      });
    },
    onError: (error) => {
      console.error('Hybrid analysis failed:', error);
      toast.error('Hybrid analysis failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  return {
    analyzeRoof: analyzeRoof.mutateAsync,
    isAnalyzing: analyzeRoof.isPending,
    error: analyzeRoof.error,
    data: analyzeRoof.data
  };
}
