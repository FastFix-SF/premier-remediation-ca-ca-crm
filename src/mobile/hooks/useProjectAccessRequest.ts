import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AccessRequest {
  id: string;
  project_id: string;
  requester_id: string;
  requester_name: string;
  status: 'pending' | 'approved' | 'denied';
  reason: string | null;
  requested_at: string;
  responded_at: string | null;
  responded_by: string | null;
}

export const useProjectAccessRequest = (projectId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user has access to project
  const hasAccessQuery = useQuery({
    queryKey: ['project-access', projectId, user?.id],
    queryFn: async () => {
      if (!user || !projectId) return { hasAccess: false, pendingRequest: null };

      // Check if user is assigned to project
      const { data: assignment, error } = await supabase
        .from('project_team_assignments')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (assignment) {
        return { hasAccess: true, pendingRequest: null };
      }

      // Check if user is admin
      const { data: isAdmin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (isAdmin) {
        return { hasAccess: true, pendingRequest: null };
      }

      // Check for pending request
      const { data: pendingRequest } = await supabase
        .from('project_access_requests')
        .select('*')
        .eq('project_id', projectId)
        .eq('requester_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      return { 
        hasAccess: false, 
        pendingRequest: pendingRequest as AccessRequest | null 
      };
    },
    enabled: !!user && !!projectId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Request access mutation
  const requestAccessMutation = useMutation({
    mutationFn: async () => {
      if (!user || !projectId) throw new Error('User or project not found');

      // Get user name from team_directory
      const { data: teamMember } = await supabase
        .from('team_directory')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const requesterName = teamMember?.full_name || user.email || 'Unknown User';

      const { data, error } = await supabase
        .from('project_access_requests')
        .insert({
          project_id: projectId,
          requester_id: user.id,
          requester_name: requesterName,
          reason: 'Photo upload access needed'
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-access', projectId] });
      toast.success('Access request sent! Project team members have been notified.');
    },
    onError: (error) => {
      console.error('Error requesting access:', error);
      toast.error('Failed to request access. Please try again.');
    }
  });

  // Approve access mutation (for project members)
  const approveAccessMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('User not found');

      // Get the request details
      const { data: request, error: fetchError } = await supabase
        .from('project_access_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Update request status
      const { error: updateError } = await supabase
        .from('project_access_requests')
        .update({
          status: 'approved',
          responded_at: new Date().toISOString(),
          responded_by: user.id
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add user to project team
      const { error: assignError } = await supabase
        .from('project_team_assignments')
        .insert({
          project_id: request.project_id,
          user_id: request.requester_id,
          role: 'contributor',
          assigned_by: user.id
        });

      if (assignError) throw assignError;

      return request;
    },
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ['project-access', request.project_id] });
      queryClient.invalidateQueries({ queryKey: ['pending-access-requests'] });
      toast.success(`${request.requester_name} has been added to the project!`);
    },
    onError: (error) => {
      console.error('Error approving access:', error);
      toast.error('Failed to approve access request.');
    }
  });

  return {
    hasAccess: hasAccessQuery.data?.hasAccess ?? false,
    pendingRequest: hasAccessQuery.data?.pendingRequest,
    isLoading: hasAccessQuery.isLoading,
    requestAccess: requestAccessMutation.mutate,
    isRequesting: requestAccessMutation.isPending,
    approveAccess: approveAccessMutation.mutate,
    isApproving: approveAccessMutation.isPending,
  };
};

// Hook to get pending access requests for projects the user is assigned to
export const usePendingAccessRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-access-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all projects the user is assigned to
      const { data: assignments } = await supabase
        .from('project_team_assignments')
        .select('project_id')
        .eq('user_id', user.id);

      if (!assignments?.length) return [];

      const projectIds = assignments.map(a => a.project_id);

      // Get pending requests for those projects
      const { data: requests, error } = await supabase
        .from('project_access_requests')
        .select(`
          *,
          projects:project_id (
            project_name,
            address
          )
        `)
        .in('project_id', projectIds)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return requests || [];
    },
    enabled: !!user,
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });
};
