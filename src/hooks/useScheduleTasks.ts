import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ScheduleTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  color: string | null;
  is_completed: boolean;
  created_at: string;
  type: 'task' | 'shift';
  project?: {
    id: string;
    name: string;
  };
}

export interface ScheduleProject {
  id: string;
  name: string;
  start_date: string | null;
  status: string;
  tasks: ScheduleTask[];
}

export const useScheduleData = (projectId?: string) => {
  return useQuery({
    queryKey: ['schedule-data', projectId],
    queryFn: async () => {
      // Fetch all projects
      let projectsQuery = supabase
        .from('projects')
        .select('id, name, start_date, status')
        .in('status', ['active', 'in_progress', 'pending'])
        .order('name');

      if (projectId) {
        projectsQuery = projectsQuery.eq('id', projectId);
      }

      const { data: projects, error: projectsError } = await projectsQuery;
      if (projectsError) throw projectsError;

      // Fetch all tasks
      let tasksQuery = supabase
        .from('project_tasks')
        .select('*')
        .order('start_date', { ascending: true });

      if (projectId) {
        tasksQuery = tasksQuery.eq('project_id', projectId);
      }

      const { data: tasks, error: tasksError } = await tasksQuery;
      if (tasksError) throw tasksError;

      // Fetch all job schedules (shifts)
      let shiftsQuery = supabase
        .from('job_schedules')
        .select('*')
        .order('start_time', { ascending: true });

      if (projectId) {
        shiftsQuery = shiftsQuery.eq('project_id', projectId);
      }

      const { data: shifts, error: shiftsError } = await shiftsQuery;
      if (shiftsError) throw shiftsError;

      // Group tasks and shifts by project
      const projectMap = new Map<string, ScheduleProject>();

      projects?.forEach((project) => {
        projectMap.set(project.id, {
          id: project.id,
          name: project.name,
          start_date: project.start_date,
          status: project.status,
          tasks: [],
        });
      });

      // Add tasks to projects
      tasks?.forEach((task) => {
        const project = projectMap.get(task.project_id);
        if (project) {
          project.tasks.push({
            id: task.id,
            project_id: task.project_id,
            title: task.title,
            description: task.description,
            start_date: task.start_date,
            end_date: task.end_date,
            duration_days: task.duration_days || 1,
            color: task.color || '#3b82f6',
            is_completed: task.is_completed,
            created_at: task.created_at,
            type: 'task',
            project: { id: project.id, name: project.name },
          });
        }
      });

      // Add shifts to projects
      shifts?.forEach((shift) => {
        if (!shift.project_id) return;
        const project = projectMap.get(shift.project_id);
        if (project) {
          const startDate = shift.start_time ? new Date(shift.start_time) : null;
          const endDate = shift.end_time ? new Date(shift.end_time) : null;
          const durationDays = startDate && endDate 
            ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
            : 1;

          project.tasks.push({
            id: shift.id,
            project_id: shift.project_id,
            title: shift.job_name || 'Shift',
            description: shift.description,
            start_date: startDate ? startDate.toISOString().split('T')[0] : null,
            end_date: endDate ? endDate.toISOString().split('T')[0] : null,
            duration_days: durationDays,
            color: shift.color || '#22c55e',
            is_completed: shift.status === 'completed',
            created_at: shift.created_at,
            type: 'shift',
            project: { id: project.id, name: project.name },
          });
        }
      });

      return Array.from(projectMap.values());
    },
  });
};

// Keep the old hook for backward compatibility
export const useScheduleTasks = (projectId?: string) => {
  return useQuery({
    queryKey: ['schedule-tasks', projectId],
    queryFn: async () => {
      let query = supabase
        .from('project_tasks')
        .select(`
          *,
          project:projects(id, name)
        `)
        .order('start_date', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(task => ({
        ...task,
        type: 'task' as const,
      })) as ScheduleTask[];
    },
  });
};

export const useCreateScheduleTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: {
      project_id: string;
      title: string;
      description?: string;
      start_date: string;
      end_date?: string;
      duration_days?: number;
      color?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_tasks')
        .insert({
          ...task,
          created_by: user.user.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-data'] });
    },
  });
};

export const useUpdateScheduleTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      start_date?: string;
      end_date?: string;
      duration_days?: number;
      title?: string;
      description?: string;
      color?: string;
      is_completed?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('project_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-data'] });
    },
  });
};

export const useDeleteScheduleTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-data'] });
    },
  });
};
