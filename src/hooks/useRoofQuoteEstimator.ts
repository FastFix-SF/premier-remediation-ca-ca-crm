import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoofQuoteInput {
  maskPolygon: Array<{ x: number; y: number }>;
  imageUrl: string;
  pitch?: string;
  quoteId?: string;
  pricingConfig?: {
    costPerSquare?: number;
    laborPerSquare?: number;
    edgeCostPerFoot?: number;
    ventCost?: number;
    chimneyCost?: number;
    skylightCost?: number;
    hvacCost?: number;
  };
}

interface RoofFeature {
  type: 'vent' | 'chimney' | 'skylight' | 'solar_panel' | 'hvac' | 'other';
  position: { x: number; y: number };
  confidence: number;
  dimensions?: { width: number; height: number };
}

interface Edge {
  start: [number, number];
  end: [number, number];
  edgeType: string;
  length: number;
  confidence: number;
}

interface QuoteEstimate {
  roofArea: {
    planArea: number;
    surfaceArea: number;
    pitch: string;
    pitchFactor: number;
    squares: number;
  };
  edges: {
    type: string;
    length: number;
    linearFeet: number;
  }[];
  features: {
    type: string;
    count: number;
    unitCost: number;
    totalCost: number;
  }[];
  pricing: {
    roofingMaterial: number;
    labor: number;
    edgeMaterials: number;
    features: number;
    subtotal: number;
    contingency: number;
    total: number;
  };
  confidence: number;
}

interface QuoteEstimatorResult {
  success: boolean;
  estimate: QuoteEstimate;
  roofType: string;
  edges: Edge[];
  features: RoofFeature[];
}

export function useRoofQuoteEstimator() {
  const generateQuote = useMutation({
    mutationFn: async (input: RoofQuoteInput): Promise<QuoteEstimatorResult> => {
      console.log('💰 Starting AI roof quote estimation...');
      console.log('Input:', {
        polygonPoints: input.maskPolygon.length,
        pitch: input.pitch || '4/12',
        hasImage: !!input.imageUrl,
        quoteId: input.quoteId
      });

      const { data, error } = await supabase.functions.invoke('ai-roof-quote-estimator', {
        body: {
          maskPolygon: input.maskPolygon,
          imageUrl: input.imageUrl,
          pitch: input.pitch || '4/12',
          quoteId: input.quoteId,
          pricingConfig: input.pricingConfig
        }
      });

      if (error) {
        console.error('Quote estimator error:', error);
        throw new Error(error.message || 'Failed to generate quote');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Quote generation failed');
      }

      console.log('✅ Quote generated:', {
        total: data.estimate.pricing.total,
        squares: data.estimate.roofArea.squares,
        features: data.features?.length || 0,
        edges: data.edges?.length || 0
      });

      return data;
    },
    onSuccess: (data) => {
      const total = data.estimate.pricing.total;
      const squares = data.estimate.roofArea.squares.toFixed(1);
      toast.success('Quote generated successfully', {
        description: `${squares} squares - Estimated cost: $${total.toLocaleString()}`
      });
    },
    onError: (error) => {
      console.error('Quote generation failed:', error);
      toast.error('Quote generation failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  return {
    generateQuote: generateQuote.mutateAsync,
    isGenerating: generateQuote.isPending,
    error: generateQuote.error,
    data: generateQuote.data
  };
}
