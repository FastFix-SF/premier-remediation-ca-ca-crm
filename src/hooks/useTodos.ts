import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'critical' | 'low';
  status: 'pending' | 'complete';
  due_date: string | null;
  project_id: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  address: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
  } | null;
}

export const useTodos = () => {
  return useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('todos')
        .select(`
          *,
          project:projects(id, name)
        `)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as Todo[];
    },
  });
};

export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (todo: {
      title: string;
      description?: string;
      priority?: 'high' | 'medium' | 'critical' | 'low';
      due_date?: string;
      project_id?: string;
      assigned_to?: string;
      assigned_to_name?: string;
      address?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('todos')
        .insert({
          ...todo,
          created_by: user.user?.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      description?: string;
      priority?: 'high' | 'medium' | 'critical' | 'low';
      status?: 'pending' | 'complete';
      due_date?: string;
      project_id?: string;
      assigned_to?: string;
      assigned_to_name?: string;
      address?: string;
    }) => {
      const { data, error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};
