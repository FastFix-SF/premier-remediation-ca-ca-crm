import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook for fetching work activities
export const useMobileWorkActivities = (projectId: string) => {
  return useQuery({
    queryKey: ['mobile-work-activities', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_activities')
        .select('*')
        .eq('project_id', projectId)
        .order('work_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
};

// Hook for fetching job schedules
export const useMobileJobSchedules = (projectId: string) => {
  return useQuery({
    queryKey: ['mobile-job-schedules', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_schedules')
        .select('*')
        .eq('project_id', projectId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
};

// Hook for fetching project status updates with author names
export const useMobileProjectStatusUpdates = (projectId: string) => {
  return useQuery({
    queryKey: ['mobile-project-status-updates', projectId],
    queryFn: async () => {
      // First get status updates
      const { data: updates, error } = await supabase
        .from('project_status_updates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!updates || updates.length === 0) return [];
      
      // Get unique user IDs to fetch names
      const userIds = [...new Set(updates.map(u => u.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: teamMembers } = await supabase
          .from('team_directory')
          .select('user_id, full_name')
          .in('user_id', userIds);
        
        // Create a lookup map for names
        const nameMap = new Map(teamMembers?.map(m => [m.user_id, m.full_name]) || []);
        
        // Merge names into updates
        return updates.map(u => ({
          ...u,
          author_name: nameMap.get(u.user_id) || null
        }));
      }
      
      return updates;
    },
    enabled: !!projectId,
  });
};

// Hook for fetching customer information from leads
export const useMobileCustomerInfo = (customerEmail?: string) => {
  return useQuery({
    queryKey: ['mobile-customer-info', customerEmail],
    queryFn: async () => {
      if (!customerEmail) return null;
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('email', customerEmail)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!customerEmail,
  });
};

// Hook for fetching project team assignments with team member names
export const useMobileProjectTeam = (projectId: string) => {
  return useQuery({
    queryKey: ['mobile-project-team', projectId],
    queryFn: async () => {
      // First get project assignments
      const { data: assignments, error } = await supabase
        .from('project_team_assignments')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      
      if (!assignments || assignments.length === 0) return [];
      
      // Get team member names from team_directory
      const userIds = assignments.map(a => a.user_id).filter(Boolean);
      const { data: teamMembers } = await supabase
        .from('team_directory')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      // Create a lookup map for names
      const nameMap = new Map(teamMembers?.map(m => [m.user_id, m.full_name]) || []);
      
      // Merge names into assignments
      return assignments.map(a => ({
        ...a,
        full_name: nameMap.get(a.user_id) || null
      }));
    },
    enabled: !!projectId,
  });
};

// Hook for generating AI summary
export const useMobileProjectAISummary = (projectId: string, projectData?: any) => {
  return useQuery({
    queryKey: ['mobile-project-ai-summary', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `Please provide a comprehensive AI summary for project ${projectData?.name || projectId}. 
          Include project health status, key insights, potential issues, progress analysis, and recommendations.
          Project Status: ${projectData?.status}
          Customer: ${projectData?.customer_email || 'Not specified'}
          Address: ${projectData?.address || 'Not specified'}
          
          Generate a professional summary focusing on project status, progress, and any actionable insights.`
        }
      });

      if (error) throw error;
      return data?.response || 'Unable to generate AI summary at this time.';
    },
    enabled: !!projectId && !!projectData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};