import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Expense {
  id: string;
  expense_number: string | null;
  expense_name: string;
  vendor: string | null;
  expense_type: string | null;
  expense_date: string | null;
  employee_name: string | null;
  account: string | null;
  bank_account: string | null;
  cost_code: string | null;
  amount: number | null;
  is_billable: boolean | null;
  status: string | null;
  reason: string | null;
  ref_number: string | null;
  project_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseNote {
  id: string;
  expense_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

export const useExpenses = () => {
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Expense[];
    },
  });

  const createExpense = useMutation({
    mutationFn: async (expense: Omit<Partial<Expense>, 'id'> & { expense_name: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as Expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create expense: ' + error.message);
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (error) => {
      toast.error('Failed to update expense: ' + error.message);
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete expense: ' + error.message);
    },
  });

  return {
    expenses,
    isLoading,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};

export const useExpenseNotes = (expenseId: string) => {
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['expense-notes', expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_notes')
        .select('*')
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExpenseNote[];
    },
    enabled: !!expenseId,
  });

  const createNote = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('expense_notes')
        .insert({ expense_id: expenseId, content })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-notes', expenseId] });
      toast.success('Note added');
    },
    onError: (error) => {
      toast.error('Failed to add note: ' + error.message);
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('expense_notes').delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-notes', expenseId] });
      toast.success('Note deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete note: ' + error.message);
    },
  });

  return { notes, isLoading, createNote, deleteNote };
};
