import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  subtotal: number;
  balance_due: number;
  status: string;
  invoice_date?: string; // UI-only, maps to created_at in DB
  due_date?: string;
  terms?: string; // UI-only alias for payment_terms
  payment_terms?: string;
  description?: string;
  address?: string;
  terms_conditions?: string;
  retainage_percent?: number;
  period_start_date?: string;
  period_end_date?: string;
  approved_by?: string;
  online_payment_enabled?: boolean;
  project_id?: string;
  project_name: string;
  estimate_id?: string;
  customer_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_type: string;
  item_name: string;
  cost_code?: string;
  quantity: number;
  unit_cost: number;
  unit: string;
  markup_percent: number;
  total: number;
  is_taxable: boolean;
  display_order: number;
  photo_url?: string;
  created_at?: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  payment_date: string;
  payment_type: string;
  payment_note?: string;
  amount: number;
  status: string;
  created_at?: string;
  created_by?: string;
}

export interface InvoiceFile {
  id: string;
  invoice_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  uploaded_by?: string;
  uploaded_at?: string;
}

export interface InvoiceNote {
  id: string;
  invoice_id: string;
  content: string;
  created_by?: string;
  created_at?: string;
}

// Fetch all invoices
export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invoice[];
    }
  });
}

// Fetch single invoice
export function useInvoice(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Invoice;
    },
    enabled: !!invoiceId
  });
}

// Create invoice
export function useCreateInvoice() {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      toast({ title: 'Error creating invoice', description: error.message, variant: 'destructive' });
    }
  });
}

// Update invoice
export function useUpdateInvoice() {
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
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] });
    }
  });
}

// Delete invoice
export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice deleted' });
    }
  });
}

// Invoice Items
export function useInvoiceItems(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice-items', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('display_order');
      
      if (error) throw error;
      return data as InvoiceItem[];
    },
    enabled: !!invoiceId
  });
}

export function useCreateInvoiceItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Partial<InvoiceItem>) => {
      const { data, error } = await supabase
        .from('invoice_items')
        .insert([item as any])
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data as InvoiceItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-items', data.invoice_id] });
    }
  });
}

export function useUpdateInvoiceItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InvoiceItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('invoice_items')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data as InvoiceItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-items', data.invoice_id] });
    }
  });
}

export function useDeleteInvoiceItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string; invoiceId: string }) => {
      const { error } = await supabase
        .from('invoice_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return invoiceId;
    },
    onSuccess: (invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-items', invoiceId] });
    }
  });
}

// Invoice Payments
export function useInvoicePayments(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice-payments', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from('invoice_payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data as InvoicePayment[];
    },
    enabled: !!invoiceId
  });
}

export function useCreateInvoicePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payment: Partial<InvoicePayment>) => {
      const { data, error } = await supabase
        .from('invoice_payments')
        .insert([payment as any])
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data as InvoicePayment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-payments', data.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
}

export function useDeleteInvoicePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string; invoiceId: string }) => {
      const { error } = await supabase
        .from('invoice_payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return invoiceId;
    },
    onSuccess: (invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-payments', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
}

// Invoice Files
export function useInvoiceFiles(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice-files', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from('invoice_files')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data as InvoiceFile[];
    },
    enabled: !!invoiceId
  });
}

export function useUploadInvoiceFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invoiceId, file }: { invoiceId: string; file: File }) => {
      const filePath = `${invoiceId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(filePath);
      
      const { data, error } = await supabase
        .from('invoice_files')
        .insert([{
          invoice_id: invoiceId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size
        }])
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data as InvoiceFile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-files', data.invoice_id] });
      toast({ title: 'File uploaded' });
    }
  });
}

export function useDeleteInvoiceFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string; invoiceId: string }) => {
      const { error } = await supabase
        .from('invoice_files')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return invoiceId;
    },
    onSuccess: (invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-files', invoiceId] });
    }
  });
}

// Invoice Notes
export function useInvoiceNotes(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice-notes', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from('invoice_notes')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InvoiceNote[];
    },
    enabled: !!invoiceId
  });
}

export function useCreateInvoiceNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (note: Partial<InvoiceNote>) => {
      const { data, error } = await supabase
        .from('invoice_notes')
        .insert([note as any])
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data as InvoiceNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-notes', data.invoice_id] });
    }
  });
}

export function useDeleteInvoiceNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string; invoiceId: string }) => {
      const { error } = await supabase
        .from('invoice_notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return invoiceId;
    },
    onSuccess: (invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-notes', invoiceId] });
    }
  });
}

// Stats
export function useInvoiceStats() {
  return useQuery({
    queryKey: ['invoice-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('status, total_amount, balance_due');
      
      if (error) throw error;
      
      const invoices = data || [];
      const statusCounts: Record<string, number> = {};
      let totalBilled = 0;
      let totalOutstanding = 0;
      
      invoices.forEach(inv => {
        statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
        totalBilled += inv.total_amount || 0;
        totalOutstanding += inv.balance_due || 0;
      });
      
      return {
        total: invoices.length,
        statusCounts,
        totalBilled,
        totalOutstanding
      };
    }
  });
}
