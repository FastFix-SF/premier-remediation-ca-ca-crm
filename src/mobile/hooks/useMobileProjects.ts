import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MobileProject } from '@/shared/types';
import { toast } from 'sonner';

const isAdmin = async (): Promise<boolean> => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  
  // Check if user is owner or admin
  const { data: teamMember } = await supabase
    .from('team_directory')
    .select('role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  
  return !!adminUser || teamMember?.role === 'owner' || teamMember?.role === 'admin';
};

export const useMobileProjects = (searchQuery = '') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mobile-projects', user?.id, searchQuery],
    queryFn: async (): Promise<MobileProject[]> => {
      if (!user) throw new Error('User not authenticated');

      console.log('🔍 Fetching mobile projects for user:', user.id);
      
      // Check if user is admin/owner
      const userIsAdmin = await isAdmin();
      
      let projectIds: string[] = [];
      
      if (!userIsAdmin) {
        // Get projects the user is assigned to via team assignments
        const { data: assignments, error: assignmentsError } = await supabase
          .from('project_team_assignments')
          .select('project_id')
          .eq('user_id', user.id);
        
        if (assignmentsError) {
          console.error('❌ Assignments query error:', assignmentsError);
          throw assignmentsError;
        }
        
        // Get projects where user is the sales representative
        const { data: salesProjects, error: salesError } = await supabase
          .from('projects')
          .select('id')
          .eq('sales_representative_id', user.id);
        
        if (salesError) {
          console.error('❌ Sales projects query error:', salesError);
          throw salesError;
        }
        
        // Combine both lists and deduplicate
        const assignedIds = (assignments || []).map(a => a.project_id);
        const salesIds = (salesProjects || []).map(p => p.id);
        projectIds = [...new Set([...assignedIds, ...salesIds])];
        
        console.log('📋 User assigned to projects:', assignedIds.length, 'Sales rep for:', salesIds.length, 'Total unique:', projectIds.length);
        
        // If user has no assignments or sales projects, return empty array
        if (projectIds.length === 0) {
          console.log('ℹ️ No project assignments or sales rep projects found for user');
          return [];
        }
      }
      
      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          address,
          status,
          created_at,
          updated_at,
          project_type,
          customer_email,
          external_ref,
          labels,
          client_name
        `)
        .order('updated_at', { ascending: false });

      // If not admin, filter by assigned project IDs
      if (!userIsAdmin && projectIds.length > 0) {
        query = query.in('id', projectIds);
      }

      // Apply search filter if provided (server-side for basic text fields)
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,external_ref.ilike.%${searchQuery}%,client_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      
      console.log('📊 Projects query result:', { data: data?.length, error });

      if (error) {
        console.error('❌ Projects query error:', error);
        throw error;
      }

      // For each project, fetch the best photo
      const projectsWithPhotos = await Promise.all(
        (data || []).map(async (project) => {
          // Try to get a highlighted photo first, then fall back to any photo
          const { data: photos } = await supabase
            .from('project_photos')
            .select('photo_url, is_highlighted_before, is_highlighted_after, display_order')
            .eq('project_id', project.id)
            .order('is_highlighted_before', { ascending: false })
            .order('is_highlighted_after', { ascending: false })
            .order('display_order', { ascending: true })
            .order('uploaded_at', { ascending: false })
            .limit(1);

          const bestPhotoUrl = photos && photos.length > 0 ? photos[0].photo_url : undefined;

          return {
            ...project,
            code: project.external_ref || `PROJ-${project.id.slice(0, 8)}`,
            lastActivity: new Date(project.updated_at).toLocaleDateString(),
            teamSize: 1, // Will be enhanced later with real team count
            bestPhotoUrl,
          };
        })
      );

      console.log('✅ Transformed projects:', projectsWithPhotos.length);
      return projectsWithPhotos;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      name, 
      address, 
      projectType,
      clientName,
      clientPhone,
      additionalContact 
    }: { 
      name: string; 
      address?: string;
      projectType?: string;
      clientName?: string;
      clientPhone?: string;
      additionalContact?: string;
    }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Check if the user is a sales person
      const { data: teamMember } = await supabase
        .from('team_directory')
        .select('role')
        .eq('user_id', user.data.user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      const isSalesUser = teamMember?.role === 'sales';

      // Create the project - if sales user, set them as sales_representative_id
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name,
          address,
          project_type: projectType,
          client_name: clientName,
          client_phone: clientPhone,
          additional_contact: additionalContact,
          status: 'active',
          created_by: user.data.user.id,
          // Auto-assign sales user as sales representative
          ...(isSalesUser && { sales_representative_id: user.data.user.id }),
        })
        .select()
        .maybeSingle();

      if (projectError) throw projectError;

      // Create team assignment for the creator
      // Sales users get contributor role, others get project_manager role
      const { error: assignmentError } = await supabase
        .from('project_team_assignments')
        .insert({
          project_id: project.id,
          user_id: user.data.user.id,
          role: isSalesUser ? 'contributor' : 'project_manager',
          assigned_by: user.data.user.id,
        });

      if (assignmentError) throw assignmentError;

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-projects'] });
      toast.success('Project created successfully');
    },
    onError: (error) => {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    }
  });
};

export const useMobileProject = (projectId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mobile-project', projectId, user?.id],
    queryFn: async (): Promise<MobileProject | null> => {
      if (!user || !projectId) throw new Error('User not authenticated or project ID missing');

      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          address,
          customer_email,
          status,
          created_at,
          updated_at,
          is_featured,
          client_name,
          client_phone,
          additional_contact,
          project_type,
          labels,
          start_date,
          stopped_date,
          end_date
        `)
        .eq('id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!projectId,
    staleTime: 30 * 1000, // 30 seconds for faster updates
  });
};

// Hook to fetch ALL projects regardless of assignment (for clock-in)
export const useAllProjects = (searchQuery = '') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-projects', searchQuery],
    queryFn: async (): Promise<MobileProject[]> => {
      if (!user) throw new Error('User not authenticated');

      console.log('🔍 Fetching ALL projects for clock-in');
      
      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          address,
          status,
          created_at,
          updated_at,
          project_type,
          customer_email,
          external_ref,
          labels,
          client_name
        `)
        .order('updated_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,external_ref.ilike.%${searchQuery}%,client_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ All projects query error:', error);
        throw error;
      }

      console.log('✅ Fetched all projects:', data?.length);
      
      return (data || []).map(project => ({
        ...project,
        code: project.external_ref || `PROJ-${project.id.slice(0, 8)}`,
        lastActivity: new Date(project.updated_at).toLocaleDateString(),
        teamSize: 1,
      }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to get current user's project assignments
export const useUserProjectAssignments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-project-assignments', user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('project_team_assignments')
        .select('project_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error fetching user assignments:', error);
        return [];
      }

      return (data || []).map(a => a.project_id);
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });
};

export const useMobileJobSchedules = (searchQuery = '') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mobile-job-schedules', user?.id, searchQuery],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const admin = await isAdmin();

      // Fetch all job schedules first
      let query = supabase
        .from('job_schedules')
        .select('*')
        .order('start_time', { ascending: false });

      // Apply search filter if provided
      if (searchQuery) {
        query = query.or(`job_name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If not admin, filter by checking if user ID is in assigned_users array
      if (!admin && data) {
        console.log('🔍 Filtering job schedules for user:', user.id);
        console.log('📋 Total jobs before filter:', data.length);
        
        const filteredData = data.filter(job => {
          const assignedUsers = job.assigned_users as any[];
          if (!assignedUsers || !Array.isArray(assignedUsers)) return false;
          
          // Check if user.id matches any assigned user (could be object with id, user_id, or just string)
          return assignedUsers.some(assigned => {
            if (typeof assigned === 'string') {
              return assigned === user.id;
            }
            if (typeof assigned === 'object' && assigned !== null) {
              // Check both .id and .user_id to handle different data formats
              const assignedId = assigned.id || assigned.user_id;
              return assignedId === user.id;
            }
            return false;
          });
        });
        
        console.log('✅ Jobs after filter:', filteredData.length);
        return filteredData;
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds for faster updates after assignments
  });
};

export const useDeleteJobSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('job_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
      return scheduleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-job-schedules'] });
      toast.success('Job schedule deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete job schedule: ${error.message}`);
    },
  });
};

// Hook to get ONLY today's assigned jobs for clock-in
export const useTodayAssignedJobs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['today-assigned-jobs', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get start and end of today
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

      console.log('🔍 Fetching today\'s assigned jobs for user:', user.id);
      console.log('📅 Date range:', startOfDay, 'to', endOfDay);

      // Fetch job schedules for today
      const { data: jobSchedules, error } = await supabase
        .from('job_schedules')
        .select('*')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time');

      if (error) {
        console.error('❌ Error fetching today\'s jobs:', error);
        throw error;
      }

      // Filter to only jobs where user is assigned
      const userJobs = (jobSchedules || []).filter(job => {
        const assignedUsers = job.assigned_users as any[];
        if (!assignedUsers || !Array.isArray(assignedUsers)) return false;
        
        return assignedUsers.some(assigned => {
          if (typeof assigned === 'string') {
            return assigned === user.id;
          }
          if (typeof assigned === 'object' && assigned !== null) {
            const assignedId = assigned.id || assigned.user_id;
            return assignedId === user.id;
          }
          return false;
        });
      });

      console.log('✅ Today\'s assigned jobs:', userJobs.length);
      return userJobs;
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  });
};