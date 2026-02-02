import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useToast } from './use-toast';

export interface ShiftTask {
  id: string;
  shift_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useShiftTasks = (shiftId: string | null) => {
  return useQuery({
    queryKey: ['shift-tasks', shiftId],
    queryFn: async () => {
      if (!shiftId) return [];
      
      const { data, error } = await supabase
        .from('shift_tasks')
        .select('*')
        .eq('shift_id', shiftId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ShiftTask[];
    },
    enabled: !!shiftId
  });
};

export const useCreateShiftTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ shiftId, title, description }: { 
      shiftId: string; 
      title: string; 
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('shift_tasks')
        .insert({
          shift_id: shiftId,
          title,
          description: description || null,
          created_by: user?.id || null
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift-tasks', variables.shiftId] });
      toast({
        title: "Task Added",
        description: "Task has been added to the shift."
      });
    },
    onError: (error) => {
      console.error('Error creating shift task:', error);
      toast({
        title: "Error",
        description: "Failed to add task.",
        variant: "destructive"
      });
    }
  });
};

export const useUpdateShiftTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, updates }: { 
      taskId: string; 
      updates: Partial<Pick<ShiftTask, 'title' | 'description' | 'is_completed'>>;
    }) => {
      const updateData: Record<string, unknown> = { ...updates };
      
      if (updates.is_completed !== undefined) {
        if (updates.is_completed) {
          const { data: { user } } = await supabase.auth.getUser();
          updateData.completed_at = new Date().toISOString();
          updateData.completed_by = user?.id || null;
        } else {
          updateData.completed_at = null;
          updateData.completed_by = null;
        }
      }

      const { data, error } = await supabase
        .from('shift_tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shift-tasks', data.shift_id] });
    },
    onError: (error) => {
      console.error('Error updating shift task:', error);
    }
  });
};

export const useDeleteShiftTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, shiftId }: { taskId: string; shiftId: string }) => {
      const { error } = await supabase
        .from('shift_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return { taskId, shiftId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift-tasks', variables.shiftId] });
      toast({
        title: "Task Deleted",
        description: "Task has been removed from the shift."
      });
    },
    onError: (error) => {
      console.error('Error deleting shift task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive"
      });
    }
  });
};
