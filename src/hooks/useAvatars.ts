import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AvatarCache {
  [userId: string]: string | null;
}

export const useAvatars = (userIds: string[]) => {
  return useQuery({
    queryKey: ['avatars', ...userIds.sort()],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', userIds);

      if (error) throw error;

      const avatarCache: AvatarCache = {};
      data?.forEach(profile => {
        avatarCache[profile.id] = profile.avatar_url;
      });

      return avatarCache;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    enabled: userIds.length > 0,
  });
};

export const useAvatar = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['avatar', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data?.avatar_url || null;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    enabled: !!userId,
  });
};
