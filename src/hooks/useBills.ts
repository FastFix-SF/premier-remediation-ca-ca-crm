import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Bill {
  id: string;
  bill_number: string | null;
  vendor_id: string | null;
  vendor_name: string | null;
  project_id: string | null;
  project_name: string | null;
  description: string | null;
  bill_date: string;
  due_date: string | null;
  terms: string | null;
  sub_total: number | null;
  tax: number | null;
  total: number | null;
  paid: number | null;
  balance_due: number | null;
  status: string | null;
  is_billable: boolean | null;
  ref_number: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface BillItem {
  id: string;
  bill_id: string;
  item_name: string;
  description: string | null;
  cost_code: string | null;
  quantity: number | null;
  unit: string | null;
  unit_cost: number | null;
  total: number | null;
  is_taxable: boolean | null;
  display_order: number | null;
  created_at: string;
}

export interface BillPayment {
  id: string;
  bill_id: string;
  payment_date: string;
  amount: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface BillFile {
  id: string;
  bill_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
  uploaded_by: string | null;
}

export interface BillNote {
  id: string;
  bill_id: string;
  content: string;
  created_at: string;
  created_by: string | null;
}

export function useBills() {
  return useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Bill[];
    },
  });
}

export function useBill(id: string | null) {
  return useQuery({
    queryKey: ['bill', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Bill;
    },
    enabled: !!id,
  });
}

export function useBillItems(billId: string | null) {
  return useQuery({
    queryKey: ['bill-items', billId],
    queryFn: async () => {
      if (!billId) return [];
      const { data, error } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', billId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as BillItem[];
    },
    enabled: !!billId,
  });
}

export function useBillPayments(billId: string | null) {
  return useQuery({
    queryKey: ['bill-payments', billId],
    queryFn: async () => {
      if (!billId) return [];
      const { data, error } = await supabase
        .from('bill_payments')
        .select('*')
        .eq('bill_id', billId)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data as BillPayment[];
    },
    enabled: !!billId,
  });
}

export function useBillFiles(billId: string | null) {
  return useQuery({
    queryKey: ['bill-files', billId],
    queryFn: async () => {
      if (!billId) return [];
      const { data, error } = await supabase
        .from('bill_files')
        .select('*')
        .eq('bill_id', billId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data as BillFile[];
    },
    enabled: !!billId,
  });
}

export function useBillNotes(billId: string | null) {
  return useQuery({
    queryKey: ['bill-notes', billId],
    queryFn: async () => {
      if (!billId) return [];
      const { data, error } = await supabase
        .from('bill_notes')
        .select('*')
        .eq('bill_id', billId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BillNote[];
    },
    enabled: !!billId,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Bill>) => {
      const { data: result, error } = await supabase
        .from('bills')
        .insert([data as any])
        .select()
        .maybeSingle();
      if (error) throw error;
      return result as Bill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Bill> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('bills')
        .update(data as any)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return result as Bill;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['bill', variables.id] });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

export function useCreateBillItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<BillItem>) => {
      const { data: result, error } = await supabase
        .from('bill_items')
        .insert([data as any])
        .select()
        .maybeSingle();
      if (error) throw error;
      return result as BillItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bill-items', variables.bill_id] });
    },
  });
}

export function useDeleteBillItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, billId }: { id: string; billId: string }) => {
      const { error } = await supabase.from('bill_items').delete().eq('id', id);
      if (error) throw error;
      return billId;
    },
    onSuccess: (billId) => {
      queryClient.invalidateQueries({ queryKey: ['bill-items', billId] });
    },
  });
}

export function useCreateBillPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<BillPayment>) => {
      const { data: result, error } = await supabase
        .from('bill_payments')
        .insert([data as any])
        .select()
        .maybeSingle();
      if (error) throw error;
      return result as BillPayment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bill-payments', variables.bill_id] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

export function useDeleteBillPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, billId }: { id: string; billId: string }) => {
      const { error } = await supabase.from('bill_payments').delete().eq('id', id);
      if (error) throw error;
      return billId;
    },
    onSuccess: (billId) => {
      queryClient.invalidateQueries({ queryKey: ['bill-payments', billId] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

export function useCreateBillNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<BillNote>) => {
      const { data: result, error } = await supabase
        .from('bill_notes')
        .insert([data as any])
        .select()
        .maybeSingle();
      if (error) throw error;
      return result as BillNote;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bill-notes', variables.bill_id] });
    },
  });
}

export function useDeleteBillNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, billId }: { id: string; billId: string }) => {
      const { error } = await supabase.from('bill_notes').delete().eq('id', id);
      if (error) throw error;
      return billId;
    },
    onSuccess: (billId) => {
      queryClient.invalidateQueries({ queryKey: ['bill-notes', billId] });
    },
  });
}
