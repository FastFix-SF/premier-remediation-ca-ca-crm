import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrainingDocument {
  id: string;
  category: string;
  fileName: string;
  summary: string;
  extractedData: any;
}

interface TrainingContextResult {
  trainingDocuments: TrainingDocument[];
  aiContext: string;
  count: number;
}

export function useTrainingContext(quoteId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['training-context', quoteId],
    queryFn: async () => {
      if (!quoteId) return null;

      const { data, error } = await supabase.functions.invoke('search-training-context', {
        body: { 
          quoteId,
          categories: ['sketch_report', 'estimate', 'material_order', 'labor_report'],
          limit: 5
        }
      });

      if (error) throw error;
      return data as TrainingContextResult;
    },
    enabled: enabled && !!quoteId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
