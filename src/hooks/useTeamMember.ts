import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TeamMember {
  user_id: string;
  email: string;
  full_name?: string;
  role: string;
  secondary_role?: string | null;
  status: string;
  phone_number?: string | null;
}

export const useTeamMember = () => {
  const { user } = useAuth();

  const { data: teamMembers = [], isLoading: loading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from('team_directory')
        .select('user_id, email, full_name, role, secondary_role, status, phone_number')
        .eq('status', 'active');

      if (error) throw error;
      return members || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const currentMember = teamMembers.find(member => member.user_id === user?.id) || null;

  const getMemberByUserId = (userId: string) => {
    return teamMembers.find(member => member.user_id === userId);
  };

  const getMemberByEmail = (email: string) => {
    return teamMembers.find(member => member.email === email);
  };

  const getCurrentUserDisplayName = () => {
    if (currentMember?.full_name) {
      return currentMember.full_name;
    }
    return user?.email?.split('@')[0] || 'You';
  };

  const getDisplayName = (userId?: string, fallbackName?: string) => {
    if (userId) {
      const member = getMemberByUserId(userId);
      if (member?.full_name) {
        return member.full_name;
      }
    }
    return fallbackName || 'Unknown User';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-red-600';
      case 'admin':
        return 'text-blue-600';
      case 'leader':
        return 'text-purple-600';
      case 'contributor':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return {
    currentMember,
    teamMembers,
    loading,
    getMemberByUserId,
    getMemberByEmail,
    getCurrentUserDisplayName,
    getDisplayName,
    getInitials,
    getRoleColor,
  };
};