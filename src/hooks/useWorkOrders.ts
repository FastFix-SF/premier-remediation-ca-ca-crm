import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type WorkOrderStatus = 'open' | 'estimating' | 'submitted' | 'approved' | 'complete' | 'cancelled';

export interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  description: string | null;
  status: WorkOrderStatus;
  project_id: string | null;
  location: string | null;
  service_start_date: string | null;
  service_end_date: string | null;
  issued_by: string | null;
  issued_by_name: string | null;
  invoiced_to: string | null;
  customer_contract_number: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  estimated_cost: number;
  profit_amount: number;
  profit_percentage: number;
  subtotal: number;
  tax_amount: number;
  tax_percentage: number;
  grand_total: number;
  markup_percentage: number;
  hours: number;
  terms_and_conditions: string | null;
  is_no_cost: boolean;
  site_type: string | null;
  site_drawing: string | null;
  site_page: string | null;
  site_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderItem {
  id: string;
  work_order_id: string;
  item_type: string | null;
  item_name: string;
  cost_code: string | null;
  quantity: number;
  unit: string | null;
  unit_cost: number;
  markup_percentage: number;
  total: number;
  tax_applicable: boolean;
  display_order: number;
  created_at: string;
}

export interface WorkOrderNote {
  id: string;
  work_order_id: string;
  content: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface WorkOrderFile {
  id: string;
  work_order_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export const useWorkOrders = () => {
  return useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkOrder[];
    }
  });
};

export const useWorkOrder = (id: string | null) => {
  return useQuery({
    queryKey: ['work-order', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as WorkOrder;
    },
    enabled: !!id
  });
};

export const useWorkOrderItems = (workOrderId: string | null) => {
  return useQuery({
    queryKey: ['work-order-items', workOrderId],
    queryFn: async () => {
      if (!workOrderId) return [];
      const { data, error } = await supabase
        .from('work_order_items')
        .select('*')
        .eq('work_order_id', workOrderId)
        .order('display_order');

      if (error) throw error;
      return data as WorkOrderItem[];
    },
    enabled: !!workOrderId
  });
};

export const useWorkOrderNotes = (workOrderId: string | null) => {
  return useQuery({
    queryKey: ['work-order-notes', workOrderId],
    queryFn: async () => {
      if (!workOrderId) return [];
      const { data, error } = await supabase
        .from('work_order_notes')
        .select('*')
        .eq('work_order_id', workOrderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkOrderNote[];
    },
    enabled: !!workOrderId
  });
};

export const useWorkOrderFiles = (workOrderId: string | null) => {
  return useQuery({
    queryKey: ['work-order-files', workOrderId],
    queryFn: async () => {
      if (!workOrderId) return [];
      const { data, error } = await supabase
        .from('work_order_files')
        .select('*')
        .eq('work_order_id', workOrderId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as WorkOrderFile[];
    },
    enabled: !!workOrderId
  });
};

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<WorkOrder>) => {
      // Generate work order number
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true });
      
      const woNumber = `WO #${year}-${String((count || 0) + 1).padStart(3, '0')}`;

      const insertData = {
        title: data.title || 'Untitled',
        work_order_number: woNumber,
        description: data.description,
        status: data.status || 'open',
        project_id: data.project_id,
        location: data.location,
        service_start_date: data.service_start_date,
        service_end_date: data.service_end_date,
        assigned_to: data.assigned_to,
        assigned_to_name: data.assigned_to_name,
        created_by: user?.id,
        issued_by: user?.id
      };

      const { data: workOrder, error } = await supabase
        .from('work_orders')
        .insert(insertData)
        .select()
        .maybeSingle();

      if (error) throw error;
      return workOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Work order created successfully');
    },
    onError: (error) => {
      console.error('Failed to create work order:', error);
      toast.error('Failed to create work order');
    }
  });
};

export const useUpdateWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<WorkOrder> & { id: string }) => {
      const { data: workOrder, error } = await supabase
        .from('work_orders')
        .update(data)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return workOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-order', data.id] });
      toast.success('Work order updated');
    },
    onError: (error) => {
      console.error('Failed to update work order:', error);
      toast.error('Failed to update work order');
    }
  });
};

export const useDeleteWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Work order deleted');
    },
    onError: (error) => {
      console.error('Failed to delete work order:', error);
      toast.error('Failed to delete work order');
    }
  });
};

export const useCreateWorkOrderItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<WorkOrderItem> & { work_order_id: string; item_name: string }) => {
      const insertData = {
        work_order_id: data.work_order_id,
        item_name: data.item_name,
        item_type: data.item_type,
        cost_code: data.cost_code,
        quantity: data.quantity,
        unit: data.unit,
        unit_cost: data.unit_cost,
        markup_percentage: data.markup_percentage,
        total: data.total,
        tax_applicable: data.tax_applicable,
        display_order: data.display_order
      };

      const { data: item, error } = await supabase
        .from('work_order_items')
        .insert(insertData)
        .select()
        .maybeSingle();

      if (error) throw error;
      return item as WorkOrderItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work-order-items', data.work_order_id] });
    }
  });
};

export const useCreateWorkOrderNote = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { work_order_id: string; content: string; created_by_name?: string }) => {
      const { data: note, error } = await supabase
        .from('work_order_notes')
        .insert({
          ...data,
          created_by: user?.id
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return note;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work-order-notes', data.work_order_id] });
      toast.success('Note added');
    }
  });
};
