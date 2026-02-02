import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';

interface ProjectPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageTeam: boolean;
  canAddPhotos: boolean;
  canChat: boolean;
  canCreateTasks: boolean;
  canCreateProjects: boolean;
  isAssigned: boolean;
}

export const useMobilePermissions = (projectId?: string) => {
  const { user } = useAuth();
  const adminStatus = useAdminStatus();

  const { data: teamMember } = useQuery({
    queryKey: ['team-member', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from('team_directory')
        .select('role, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      return data;
    },
    enabled: !!user?.id
  });

  const { data: projectAssignment } = useQuery({
    queryKey: ['project-assignment', user?.id, projectId],
    queryFn: async () => {
      if (!user?.id || !projectId) return null;
      
      const { data } = await supabase
        .from('project_team_assignments')
        .select('id, role')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .maybeSingle();
      
      return data;
    },
    enabled: !!user?.id && !!projectId
  });

  // Check if user is the sales representative for this project
  const { data: isSalesRep } = useQuery({
    queryKey: ['sales-rep-assignment', user?.id, projectId],
    queryFn: async () => {
      if (!user?.id || !projectId) return false;
      
      const { data } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('sales_representative_id', user.id)
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!user?.id && !!projectId
  });

  const isAdmin = adminStatus.data?.isAdmin || false;
  const isOwner = adminStatus.data?.isOwner || false;
  const hasFullAccess = isAdmin || isOwner;
  
  const isAssignedToProject = !!projectAssignment;
  const isSalesRepForProject = isSalesRep || false;
  
  // Check if the user has the "sales" role in team_directory
  const isSalesRole = teamMember?.role === 'sales';
  
  // Admins and owners have full permissions
  // Contributors and Sales Reps can view, add photos, chat but NOT manage team or edit project details
  // Sales users can CREATE new projects (unlike contributors)
  const getProjectPermissions = (): ProjectPermissions => {
    if (hasFullAccess) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canManageTeam: true,
        canAddPhotos: true,
        canChat: true,
        canCreateTasks: true,
        canCreateProjects: true,
        isAssigned: true
      };
    }

    // Sales reps get contributor-level access to their assigned projects
    // BUT they can also create new projects
    if (isSalesRepForProject) {
      return {
        canView: true,
        canEdit: false,
        canDelete: false,
        canManageTeam: false,
        canAddPhotos: true,
        canChat: true,
        canCreateTasks: false,
        canCreateProjects: isSalesRole, // Sales role can create projects
        isAssigned: true
      };
    }

    if (isAssignedToProject) {
      const assignmentRole = projectAssignment?.role || 'contributor';
      // Contributors can only view, add photos, and chat
      const isContributor = assignmentRole === 'contributor';
      // Admins, owners, and project managers have elevated permissions
      const hasElevatedRole = assignmentRole === 'project_manager' || assignmentRole === 'admin' || assignmentRole === 'owner';
      
      return {
        canView: true,
        canEdit: hasElevatedRole, // Only elevated roles can edit project details
        canDelete: assignmentRole === 'owner', // Only owner can delete
        canManageTeam: hasElevatedRole, // Only elevated roles can manage team
        canAddPhotos: true, // All assigned members can add photos
        canChat: true, // All assigned members can chat
        canCreateTasks: hasElevatedRole, // Only elevated roles can create tasks
        canCreateProjects: isSalesRole, // Sales role can create projects
        isAssigned: true
      };
    }

    // Not assigned to any project, but check if they're a sales user (can still create projects)
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canManageTeam: false,
      canAddPhotos: false,
      canChat: false,
      canCreateTasks: false,
      canCreateProjects: isSalesRole, // Sales role can create projects even when not assigned
      isAssigned: false
    };
  };

  return {
    hasFullAccess,
    isAdmin,
    isOwner,
    isSalesRole,
    teamMember,
    projectPermissions: getProjectPermissions(),
    loading: adminStatus.isLoading
  };
};
