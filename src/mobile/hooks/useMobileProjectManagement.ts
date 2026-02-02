import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useMobileProjectDelete = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        if (error.code === '42501') {
          throw new Error('You do not have permission to delete this project');
        }
        throw error;
      }
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete project:', error);
      
      // Check for foreign key constraint violations
      if (error.message?.includes('violates foreign key constraint')) {
        if (error.message?.includes('invoices')) {
          toast.error('Cannot delete project with existing invoices. Please delete or reassign invoices first.');
        } else {
          toast.error('Cannot delete project. It has related records that must be removed first.');
        }
      } else {
        toast.error(error.message || 'Failed to delete project');
      }
    }
  });
};

export const useMobileProjectUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, updates }: { 
      projectId: string; 
      updates: Record<string, any> 
    }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-projects'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-project'] });
      toast.success('Project updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project');
    }
  });
};

export const useMobileTeamAssignment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addTeamMember = useMutation({
    mutationFn: async ({ 
      projectId, 
      userId, 
      role 
    }: { 
      projectId: string; 
      userId: string; 
      role: string; 
    }) => {
      const { data, error } = await supabase
        .from('project_team_assignments')
        .insert({
          project_id: projectId,
          user_id: userId,
          role,
          assigned_by: user?.id
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mobile-project-team', variables.projectId] });
      toast.success('Team member added successfully');
    },
    onError: (error: any) => {
      console.error('Failed to add team member:', error);
      if (error.message?.includes('row-level security') || error.code === '42501') {
        toast.error('You do not have permission to add team members. Contact an administrator.');
      } else {
        toast.error('Failed to add team member');
      }
    }
  });

  const removeTeamMember = useMutation({
    mutationFn: async ({ assignmentId, projectId }: { assignmentId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_team_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      return assignmentId;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mobile-project-team', variables.projectId] });
      toast.success('Team member removed successfully');
    },
    onError: (error: any) => {
      console.error('Failed to remove team member:', error);
      if (error.message?.includes('row-level security') || error.code === '42501') {
        toast.error('You do not have permission to remove team members. Contact an administrator.');
      } else {
        toast.error('Failed to remove team member');
      }
    }
  });

  return { addTeamMember, removeTeamMember };
};

export const useMobileAvailableTeamMembers = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('team_directory')
        .select('user_id, full_name, email, role')
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      return data || [];
    }
  });
};