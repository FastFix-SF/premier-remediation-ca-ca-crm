import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PurchaseOrder {
  id: string;
  po_number: string | null;
  title: string;
  supplier: string | null;
  supplier_contact: string | null;
  from_employee: string | null;
  order_date: string | null;
  delivery_date: string | null;
  ship_to: string | null;
  shipped_via: string | null;
  fob_point: string | null;
  payment_terms: string | null;
  reference_number: string | null;
  description: string | null;
  total_amount: number | null;
  tax_amount: number | null;
  is_billable: boolean | null;
  status: string | null;
  project_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderNote {
  id: string;
  purchase_order_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

export interface PurchaseOrderFile {
  id: string;
  purchase_order_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
}

export const usePurchaseOrders = () => {
  const queryClient = useQueryClient();

  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });

  const createPurchaseOrder = useMutation({
    mutationFn: async (po: Omit<Partial<PurchaseOrder>, 'id'> & { title: string }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert(po)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as PurchaseOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order created');
    },
    onError: (error) => {
      toast.error('Failed to create purchase order: ' + error.message);
    },
  });

  const updatePurchaseOrder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PurchaseOrder> & { id: string }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (error) => {
      toast.error('Failed to update purchase order: ' + error.message);
    },
  });

  const deletePurchaseOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete purchase order: ' + error.message);
    },
  });

  return {
    purchaseOrders,
    isLoading,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
  };
};

export const usePurchaseOrderNotes = (poId: string) => {
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['po-notes', poId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_order_notes')
        .select('*')
        .eq('purchase_order_id', poId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PurchaseOrderNote[];
    },
    enabled: !!poId,
  });

  const createNote = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('purchase_order_notes')
        .insert({ purchase_order_id: poId, content })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['po-notes', poId] });
      toast.success('Note added');
    },
    onError: (error) => {
      toast.error('Failed to add note: ' + error.message);
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('purchase_order_notes').delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['po-notes', poId] });
      toast.success('Note deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete note: ' + error.message);
    },
  });

  return { notes, isLoading, createNote, deleteNote };
};
