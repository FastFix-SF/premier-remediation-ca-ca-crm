import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AppIconRecord {
  app_id: string;
  icon_url: string | null;
  status: string;
}

export const useAppIcons = () => {
  return useQuery({
    queryKey: ['app-icons'],
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase
        .from('app_icons')
        .select('app_id, icon_url')
        .eq('status', 'completed')
        .not('icon_url', 'is', null);

      if (error) {
        console.error('Error fetching app icons:', error);
        return {};
      }

      // Return as a lookup map: { "projects": "https://...", ... }
      return Object.fromEntries(
        (data || [])
          .filter((item): item is { app_id: string; icon_url: string } => 
            item.icon_url !== null
          )
          .map(item => [item.app_id, item.icon_url])
      );
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 2, // Keep in cache for 2 hours
  });
};

export const useAllAppIconStatuses = () => {
  return useQuery({
    queryKey: ['app-icons-all'],
    queryFn: async (): Promise<AppIconRecord[]> => {
      const { data, error } = await supabase
        .from('app_icons')
        .select('app_id, icon_url, status')
        .order('app_id');

      if (error) {
        console.error('Error fetching app icon statuses:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 1000 * 30, // 30 seconds for admin view
  });
};
