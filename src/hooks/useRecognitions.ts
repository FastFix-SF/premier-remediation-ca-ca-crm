import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Recognition {
  id: string;
  from_user_id: string;
  to_user_ids: string[];
  badge_name: string;
  badge_emoji: string;
  message: string | null;
  created_at: string;
  from_user?: {
    full_name: string | null;
    email: string;
    avatar_url?: string | null;
  };
}

export const useRecognitions = () => {
  return useQuery({
    queryKey: ['recognitions'],
    queryFn: async () => {
      // Fetch recognitions
      const { data, error } = await supabase
        .from('recognitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch team directory to get display names
      const { data: teamData } = await supabase
        .from('team_directory')
        .select('user_id, full_name, email');

      // Fetch profiles to get avatar URLs
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url');

      const teamMap = new Map(teamData?.map(t => [t.user_id, t]) || []);
      const profileMap = new Map(profilesData?.map(p => [p.id, p.avatar_url]) || []);

      // Transform data to match UI expectations
      return (data || []).map(recognition => {
        const fromUser = teamMap.get(recognition.from_user_id);
        return {
          ...recognition,
          from_user: fromUser ? {
            full_name: fromUser.full_name,
            email: fromUser.email,
            avatar_url: profileMap.get(recognition.from_user_id)
          } : null
        };
      }) as Recognition[];
    },
    staleTime: 30 * 1000,
  });
};
