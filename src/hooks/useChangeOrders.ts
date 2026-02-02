import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChangeOrder {
  id: string;
  co_number: string | null;
  title: string;
  description: string | null;
  project_id: string | null;
  estimate_id: string | null;
  customer_id: string | null;
  status: 'on_hold' | 'open' | 'pending_approval' | 'unbilled_approved' | 'billed' | 'denied';
  date: string;
  requested_by: string | null;
  customer_co_number: string | null;
  time_delay: string | null;
  associated_rfi: string | null;
  project_manager_id: string | null;
  estimator_id: string | null;
  estimated_cost: number;
  profit_margin: number;
  sub_total: number;
  tax: number;
  grand_total: number;
  is_no_cost: boolean;
  approved_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  projects?: { name: string; address: string } | null;
  directory_contacts?: { company: string; contact_name: string } | null;
}

export interface ChangeOrderItem {
  id: string;
  change_order_id: string;
  item_type: 'material' | 'labor' | 'equipment' | 'subcontractor' | 'other';
  item_name: string;
  cost_code: string | null;
  quantity: number;
  unit_cost: number;
  unit: string;
  markup_percent: number;
  total: number;
  is_taxable: boolean;
  assigned_to: string | null;
  display_order: number;
  created_at: string;
}

export interface ChangeOrderFile {
  id: string;
  change_order_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface ChangeOrderNote {
  id: string;
  change_order_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

// Fetch all change orders
export function useChangeOrders() {
  return useQuery({
    queryKey: ['change-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('change_orders')
        .select(`
          *,
          projects:project_id(name, address),
          directory_contacts:customer_id(company, contact_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ChangeOrder[];
    },
  });
}

// Fetch single change order
export function useChangeOrder(id?: string) {
  return useQuery({
    queryKey: ['change-order', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('change_orders')
        .select(`
          *,
          projects:project_id(name, address),
          directory_contacts:customer_id(company, contact_name)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ChangeOrder;
    },
    enabled: !!id,
  });
}

// Create change order
export function useCreateChangeOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<ChangeOrder>) => {
      const { data: result, error } = await supabase
        .from('change_orders')
        .insert([data as any])
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-orders'] });
      toast.success('Change order created');
    },
    onError: (error) => {
      toast.error('Failed to create change order');
      console.error(error);
    },
  });
}

// Update change order
export function useUpdateChangeOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ChangeOrder> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('change_orders')
        .update(data)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['change-orders'] });
      queryClient.invalidateQueries({ queryKey: ['change-order', variables.id] });
    },
    onError: (error) => {
      toast.error('Failed to update change order');
      console.error(error);
    },
  });
}

// Delete change order
export function useDeleteChangeOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('change_orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-orders'] });
      toast.success('Change order deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete change order');
      console.error(error);
    },
  });
}

// ===== ITEMS =====

export function useChangeOrderItems(changeOrderId?: string) {
  return useQuery({
    queryKey: ['change-order-items', changeOrderId],
    queryFn: async () => {
      if (!changeOrderId) return [];
      const { data, error } = await supabase
        .from('change_order_items')
        .select('*')
        .eq('change_order_id', changeOrderId)
        .order('display_order');
      
      if (error) throw error;
      return data as ChangeOrderItem[];
    },
    enabled: !!changeOrderId,
  });
}

export function useCreateChangeOrderItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<ChangeOrderItem>) => {
      const { data: result, error } = await supabase
        .from('change_order_items')
        .insert([data as any])
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['change-order-items', variables.change_order_id] });
    },
  });
}

export function useUpdateChangeOrderItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ChangeOrderItem> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('change_order_items')
        .update(data)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['change-order-items', result.change_order_id] });
    },
  });
}

export function useDeleteChangeOrderItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, changeOrderId }: { id: string; changeOrderId: string }) => {
      const { error } = await supabase
        .from('change_order_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return changeOrderId;
    },
    onSuccess: (changeOrderId) => {
      queryClient.invalidateQueries({ queryKey: ['change-order-items', changeOrderId] });
    },
  });
}

// ===== FILES =====

export function useChangeOrderFiles(changeOrderId?: string) {
  return useQuery({
    queryKey: ['change-order-files', changeOrderId],
    queryFn: async () => {
      if (!changeOrderId) return [];
      const { data, error } = await supabase
        .from('change_order_files')
        .select('*')
        .eq('change_order_id', changeOrderId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data as ChangeOrderFile[];
    },
    enabled: !!changeOrderId,
  });
}

export function useUploadChangeOrderFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ changeOrderId, file }: { changeOrderId: string; file: File }) => {
      const fileName = `${changeOrderId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('quote-attachments')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('quote-attachments')
        .getPublicUrl(fileName);
      
      const { data, error } = await supabase
        .from('change_order_files')
        .insert({
          change_order_id: changeOrderId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['change-order-files', variables.changeOrderId] });
      toast.success('File uploaded');
    },
    onError: (error) => {
      toast.error('Failed to upload file');
      console.error(error);
    },
  });
}

export function useDeleteChangeOrderFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, changeOrderId }: { id: string; changeOrderId: string }) => {
      const { error } = await supabase
        .from('change_order_files')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return changeOrderId;
    },
    onSuccess: (changeOrderId) => {
      queryClient.invalidateQueries({ queryKey: ['change-order-files', changeOrderId] });
      toast.success('File deleted');
    },
  });
}

// ===== NOTES =====

export function useChangeOrderNotes(changeOrderId?: string) {
  return useQuery({
    queryKey: ['change-order-notes', changeOrderId],
    queryFn: async () => {
      if (!changeOrderId) return [];
      const { data, error } = await supabase
        .from('change_order_notes')
        .select('*')
        .eq('change_order_id', changeOrderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ChangeOrderNote[];
    },
    enabled: !!changeOrderId,
  });
}

export function useCreateChangeOrderNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { change_order_id: string; content: string }) => {
      const { data: result, error } = await supabase
        .from('change_order_notes')
        .insert(data)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['change-order-notes', variables.change_order_id] });
      toast.success('Note added');
    },
  });
}

export function useDeleteChangeOrderNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, changeOrderId }: { id: string; changeOrderId: string }) => {
      const { error } = await supabase
        .from('change_order_notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return changeOrderId;
    },
    onSuccess: (changeOrderId) => {
      queryClient.invalidateQueries({ queryKey: ['change-order-notes', changeOrderId] });
    },
  });
}

// Stats
export function useChangeOrderStats() {
  return useQuery({
    queryKey: ['change-order-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('change_orders')
        .select('status, grand_total');
      
      if (error) throw error;
      
      const stats = {
        onHold: 0,
        open: 0,
        pendingApproval: 0,
        unbilledApproved: 0,
        billed: 0,
        denied: 0,
        totalValue: 0,
      };
      
      data?.forEach((co) => {
        switch (co.status) {
          case 'on_hold': stats.onHold++; break;
          case 'open': stats.open++; break;
          case 'pending_approval': stats.pendingApproval++; break;
          case 'unbilled_approved': stats.unbilledApproved++; break;
          case 'billed': stats.billed++; break;
          case 'denied': stats.denied++; break;
        }
        stats.totalValue += Number(co.grand_total) || 0;
      });
      
      return stats;
    },
  });
}
