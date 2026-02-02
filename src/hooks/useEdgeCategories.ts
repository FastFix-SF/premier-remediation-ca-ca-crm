import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EdgeCategory {
  id: string;
  key: string;
  label: string;
  color: string;
  hotkey: string | null;
  group_name: string | null;
  display_order: number;
  is_active: boolean;
}

export const useEdgeCategories = () => {
  return useQuery({
    queryKey: ['edge-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edge_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as EdgeCategory[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
