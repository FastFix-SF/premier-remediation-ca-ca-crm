import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MobileTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  owner_id: string | null;
  owner_name?: string;
  current_focus: boolean;
  estimated_duration: string;
  project_id: string | null;
  project_name?: string;
  client_id: string | null;
  client_name: string | null;
  blocker_notes: string | null;
  progress_percent: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  subtask_count?: number;
  completed_subtasks?: number;
}

export interface MobileSubtask {
  id: string;
  parent_task_id: string;
  title: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  display_order: number;
  created_at: string;
}

export interface TeamMember {
  user_id: string;
  full_name: string;
}

export interface Project {
  id: string;
  name: string | null;
}

export const useMobileTasks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mobile-tasks'],
    queryFn: async () => {
      // Fetch team members for mapping
      const { data: members } = await supabase
        .from('team_directory')
        .select('user_id, full_name')
        .eq('status', 'active');

      // Fetch projects for mapping
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name');

      // Fetch tasks
      const { data: tasksData, error } = await supabase
        .from('team_tasks')
        .select('*')
        .order('current_focus', { ascending: false })
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      const memberMap = new Map(members?.map((m) => [m.user_id, m.full_name]) || []);
      const projectMap = new Map(projectsData?.map((p) => [p.id, p.name]) || []);

      // Fetch subtask counts
      const taskIds = tasksData?.map(t => t.id) || [];
      const { data: subtasks } = await supabase
        .from('task_subtasks')
        .select('parent_task_id, status')
        .in('parent_task_id', taskIds);

      const subtaskCounts = new Map<string, { total: number; completed: number }>();
      subtasks?.forEach(s => {
        const current = subtaskCounts.get(s.parent_task_id) || { total: 0, completed: 0 };
        current.total++;
        if (s.status === 'DONE') current.completed++;
        subtaskCounts.set(s.parent_task_id, current);
      });

      // Normalize tasks
      const normalizedTasks: MobileTask[] = (tasksData || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        owner_id: t.owner_id,
        owner_name: t.owner_id ? memberMap.get(t.owner_id) : undefined,
        current_focus: t.current_focus,
        estimated_duration: t.estimated_duration,
        project_id: t.project_id,
        project_name: t.project_id ? projectMap.get(t.project_id) || undefined : undefined,
        client_id: t.client_id,
        client_name: t.client_name,
        blocker_notes: t.blocker_notes,
        progress_percent: t.progress_percent,
        completed_at: t.completed_at,
        created_at: t.created_at,
        updated_at: t.updated_at,
        subtask_count: subtaskCounts.get(t.id)?.total || 0,
        completed_subtasks: subtaskCounts.get(t.id)?.completed || 0,
      }));

      return normalizedTasks;
    },
  });
};

export const useMobileTaskDetail = (taskId: string | undefined) => {
  return useQuery({
    queryKey: ['mobile-task-detail', taskId],
    queryFn: async () => {
      if (!taskId) return null;

      // Fetch task
      const { data: task, error } = await supabase
        .from('team_tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();

      if (error) throw error;
      if (!task) return null;

      // Fetch owner name
      let ownerName = undefined;
      if (task.owner_id) {
        const { data: owner } = await supabase
          .from('team_directory')
          .select('full_name')
          .eq('user_id', task.owner_id)
          .maybeSingle();
        ownerName = owner?.full_name;
      }

      // Fetch project name
      let projectName = undefined;
      if (task.project_id) {
        const { data: project } = await supabase
          .from('projects')
          .select('name')
          .eq('id', task.project_id)
          .maybeSingle();
        projectName = project?.name;
      }

      // Fetch subtasks
      const { data: subtasks } = await supabase
        .from('task_subtasks')
        .select('*')
        .eq('parent_task_id', taskId)
        .order('display_order', { ascending: true });

      return {
        ...task,
        owner_name: ownerName,
        project_name: projectName,
        subtasks: subtasks || [],
        subtask_count: subtasks?.length || 0,
        completed_subtasks: subtasks?.filter(s => s.status === 'DONE').length || 0,
      };
    },
    enabled: !!taskId,
  });
};

export const useTeamMembers = () => {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_directory')
        .select('user_id, full_name')
        .eq('status', 'active')
        .order('full_name');
      
      if (error) throw error;
      return data as TeamMember[];
    },
  });
};

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Project[];
    },
  });
};

export const useCreateMobileTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: {
      title: string;
      description?: string;
      owner_id?: string;
      due_date?: string;
      priority?: string;
      project_id?: string;
      estimated_duration?: string;
    }) => {
      const { data, error } = await supabase
        .from('team_tasks')
        .insert({
          title: taskData.title,
          description: taskData.description || null,
          owner_id: taskData.owner_id || null,
          due_date: taskData.due_date || null,
          priority: taskData.priority || 'P2',
          project_id: taskData.project_id || null,
          estimated_duration: taskData.estimated_duration || 'M',
          status: 'TODO',
          current_focus: false,
          progress_percent: 0,
        })
        .select('id')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-tasks'] });
      toast.success('Task created!');
    },
    onError: (error) => {
      toast.error('Failed to create task');
      console.error('Create task error:', error);
    },
  });
};

export const useUpdateMobileTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, updates }: {
      taskId: string;
      updates: Partial<{
        title: string;
        description: string | null;
        owner_id: string | null;
        due_date: string | null;
        priority: string;
        project_id: string | null;
        estimated_duration: string;
        status: string;
        blocker_notes: string | null;
        current_focus: boolean;
        completed_at: string | null;
      }>;
    }) => {
      const { error } = await supabase
        .from('team_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-task-detail'] });
    },
    onError: (error) => {
      toast.error('Failed to update task');
      console.error('Update task error:', error);
    },
  });
};

export const useDeleteMobileTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('team_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-tasks'] });
      toast.success('Task deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete task');
      console.error('Delete task error:', error);
    },
  });
};

export const useToggleSubtask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subtaskId, currentStatus }: { subtaskId: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
      const { error } = await supabase
        .from('task_subtasks')
        .update({ status: newStatus })
        .eq('id', subtaskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-task-detail'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-tasks'] });
    },
  });
};
