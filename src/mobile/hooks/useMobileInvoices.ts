import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Invoice, InvoiceItem } from '@/hooks/useInvoices';

// Fetch invoices for a specific project
export function useProjectInvoices(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!projectId
  });
}

// Create invoice for a project
export function useCreateProjectInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoice: Partial<Invoice>) => {
      // Remove UI-only fields that don't exist in DB
      const { invoice_date, terms, ...dbInvoice } = invoice as any;
      
      // Map 'terms' to 'payment_terms' if provided
      if (terms && !dbInvoice.payment_terms) {
        dbInvoice.payment_terms = terms;
      }
      
      const { data, error } = await supabase
        .from('invoices')
        .insert([dbInvoice])
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      toast({ title: 'Error creating invoice', description: error.message, variant: 'destructive' });
    }
  });
}

// Update invoice
export function useUpdateProjectInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      // Remove UI-only fields that don't exist in DB
      const { invoice_date, terms, ...dbUpdates } = updates as any;
      
      // Map 'terms' to 'payment_terms' if provided
      if (terms && !dbUpdates.payment_terms) {
        dbUpdates.payment_terms = terms;
      }
      
      const { data, error } = await supabase
        .from('invoices')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] });
    }
  });
}

// Delete invoice
export function useDeleteProjectInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice deleted' });
    }
  });
}
