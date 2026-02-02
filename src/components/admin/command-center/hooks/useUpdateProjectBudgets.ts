import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BudgetUpdates {
  contract_amount?: number;
  budget_labor?: number;
  budget_materials?: number;
  budget_overhead?: number;
}

export const useUpdateProjectBudgets = (projectId: string | undefined) => {
  const queryClient = useQueryClient();

  const updateBudgets = useMutation({
    mutationFn: async (updates: BudgetUpdates) => {
      if (!projectId) throw new Error('No project ID');

      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['client-financials', projectId] });
      queryClient.invalidateQueries({ queryKey: ['client-labor', projectId] });
      queryClient.invalidateQueries({ queryKey: ['client-materials', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Budget updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update budgets:', error);
      toast.error('Failed to update budget');
    }
  });

  return {
    updateBudgets,
    isUpdating: updateBudgets.isPending
  };
};
