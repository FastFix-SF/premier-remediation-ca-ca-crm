import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLearningMetrics = () => {
  // Get total training samples (count unique quotes)
  const { data: totalSamples } = useQuery({
    queryKey: ['learning-metrics', 'total-samples'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('quote_training_sessions')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Get quote samples count
  const { data: samplesByType } = useQuery({
    queryKey: ['learning-metrics', 'by-type'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('quote_training_sessions')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      return {
        'Total Quotes': count || 0
      };
    },
    refetchInterval: 30000
  });

  // Get latest AI metrics
  const { data: aiMetrics } = useQuery({
    queryKey: ['learning-metrics', 'ai-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_learning_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    refetchInterval: 60000 // Refetch every minute
  });

  // Calculate learning readiness based on number of quotes
  const getReadinessLevel = () => {
    if (!totalSamples) return { level: 'collecting', percentage: 0, message: 'Start working on quotes to collect training data' };
    
    if (totalSamples < 5) {
      return {
        level: 'collecting',
        percentage: (totalSamples / 5) * 100,
        message: `${totalSamples}/5 quotes - Keep working!`
      };
    } else if (totalSamples < 10) {
      return {
        level: 'ready',
        percentage: 50 + ((totalSamples - 5) / 5) * 25,
        message: `${totalSamples} quotes - Ready to start learning`
      };
    } else if (totalSamples < 20) {
      return {
        level: 'learning',
        percentage: 75 + ((totalSamples - 10) / 10) * 15,
        message: `${totalSamples} quotes - Building confidence`
      };
    } else {
      return {
        level: 'confident',
        percentage: 90 + Math.min((totalSamples - 20) / 10, 10),
        message: `${totalSamples}+ quotes - High confidence mode`
      };
    }
  };

  return {
    totalSamples: totalSamples || 0,
    samplesByType: samplesByType || {},
    aiMetrics,
    readiness: getReadinessLevel()
  };
};