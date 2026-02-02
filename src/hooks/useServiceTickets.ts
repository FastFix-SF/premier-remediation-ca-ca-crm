import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ServiceTicket {
  id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  customer_id: string | null;
  project_id: string | null;
  service_address: string | null;
  service_city: string | null;
  service_state: string | null;
  service_zip: string | null;
  access_gate_code: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_hours: number | null;
  assigned_technician_id: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  completed_at: string | null;
  is_billable: boolean;
  total_amount: number;
  service_notes: string | null;
  internal_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: { name: string; email: string } | null;
}

export interface ServiceTicketItem {
  id: string;
  ticket_id: string;
  item_type: string;
  item_name: string;
  description: string | null;
  cost_code: string | null;
  quantity: number;
  unit: string;
  unit_cost: number;
  total: number;
  created_at: string;
}

export interface ServiceTicketNote {
  id: string;
  ticket_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

export interface ServiceTicketFile {
  id: string;
  ticket_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface ServiceTicketInvoice {
  id: string;
  ticket_id: string;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  created_at: string;
}

export interface ServiceTicketPayment {
  id: string;
  ticket_id: string;
  invoice_id: string | null;
  payment_date: string;
  amount: number;
  payment_type: string;
  payment_note: string | null;
  status: string;
  created_at: string;
}

export interface ServiceTicketTimeCard {
  id: string;
  ticket_id: string;
  employee_id: string | null;
  employee_name: string | null;
  work_date: string;
  clock_in: string | null;
  clock_out: string | null;
  duration_hours: number | null;
  cost_code: string | null;
  notes: string | null;
  created_at: string;
}

export const TICKET_STATUSES = [
  { key: 'unscheduled', label: 'Unscheduled', color: 'bg-gray-100 text-gray-800' },
  { key: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
  { key: 'en_route', label: 'En Route', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'checked_in', label: 'Checked-In', color: 'bg-purple-100 text-purple-800' },
  { key: 'requires_followup', label: 'Requires Follow up', color: 'bg-orange-100 text-orange-800' },
  { key: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

// Fetch all tickets
export const useServiceTickets = (status?: string) => {
  return useQuery({
    queryKey: ['service-tickets', status],
    queryFn: async () => {
      let query = (supabase as any)
        .from('service_tickets')
        .select(`
          *,
          customer:leads(name, email)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceTicket[];
    },
  });
};

// Fetch single ticket with all related data
export const useServiceTicket = (ticketId: string | null) => {
  return useQuery({
    queryKey: ['service-ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;

      const { data, error } = await (supabase as any)
        .from('service_tickets')
        .select(`
          *,
          customer:leads(name, email, phone, company)
        `)
        .eq('id', ticketId)
        .maybeSingle();

      if (error) throw error;
      return data as ServiceTicket;
    },
    enabled: !!ticketId,
  });
};

// Fetch ticket items
export const useServiceTicketItems = (ticketId: string | null) => {
  return useQuery({
    queryKey: ['service-ticket-items', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];

      const { data, error } = await (supabase as any)
        .from('service_ticket_items')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at');

      if (error) throw error;
      return data as ServiceTicketItem[];
    },
    enabled: !!ticketId,
  });
};

// Fetch ticket notes
export const useServiceTicketNotes = (ticketId: string | null) => {
  return useQuery({
    queryKey: ['service-ticket-notes', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];

      const { data, error } = await (supabase as any)
        .from('service_ticket_notes')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ServiceTicketNote[];
    },
    enabled: !!ticketId,
  });
};

// Fetch ticket files
export const useServiceTicketFiles = (ticketId: string | null) => {
  return useQuery({
    queryKey: ['service-ticket-files', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];

      const { data, error } = await (supabase as any)
        .from('service_ticket_files')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as ServiceTicketFile[];
    },
    enabled: !!ticketId,
  });
};

// Fetch ticket invoices
export const useServiceTicketInvoices = (ticketId: string | null) => {
  return useQuery({
    queryKey: ['service-ticket-invoices', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];

      const { data, error } = await (supabase as any)
        .from('service_ticket_invoices')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      return data as ServiceTicketInvoice[];
    },
    enabled: !!ticketId,
  });
};

// Fetch ticket payments
export const useServiceTicketPayments = (ticketId: string | null) => {
  return useQuery({
    queryKey: ['service-ticket-payments', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];

      const { data, error } = await (supabase as any)
        .from('service_ticket_payments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as ServiceTicketPayment[];
    },
    enabled: !!ticketId,
  });
};

// Fetch ticket time cards
export const useServiceTicketTimeCards = (ticketId: string | null) => {
  return useQuery({
    queryKey: ['service-ticket-timecards', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];

      const { data, error } = await (supabase as any)
        .from('service_ticket_time_cards')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('work_date', { ascending: false });

      if (error) throw error;
      return data as ServiceTicketTimeCard[];
    },
    enabled: !!ticketId,
  });
};

// Create ticket
export const useCreateServiceTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: Partial<ServiceTicket>) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await (supabase as any)
        .from('service_tickets')
        .insert({
          ...ticket,
          ticket_number: '', // Will be auto-generated
          created_by: user?.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-tickets'] });
      toast.success('Service ticket created');
    },
    onError: () => {
      toast.error('Failed to create ticket');
    },
  });
};

// Normalize updates for DB compatibility
// Converts empty strings to null for date/time/numeric/uuid columns
const normalizeServiceTicketUpdates = (updates: Partial<ServiceTicket>): Record<string, any> => {
  const normalized: Record<string, any> = {};
  
  // Fields that should be null when empty (date/time/numeric/uuid)
  const nullableFields = [
    'scheduled_date',
    'scheduled_time', 
    'duration_hours',
    'assigned_technician_id',
    'customer_id',
    'project_id',
    'latitude',
    'longitude',
    'total_amount',
  ];
  
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue; // Skip undefined keys
    
    if (nullableFields.includes(key)) {
      // Convert empty string to null, parse numbers
      if (value === '' || value === null) {
        normalized[key] = null;
      } else if (['duration_hours', 'latitude', 'longitude', 'total_amount'].includes(key)) {
        normalized[key] = typeof value === 'string' ? parseFloat(value) || null : value;
      } else {
        normalized[key] = value;
      }
    } else {
      normalized[key] = value;
    }
  }
  
  return normalized;
};

// Update ticket
export const useUpdateServiceTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: Partial<ServiceTicket> }) => {
      const normalizedUpdates = normalizeServiceTicketUpdates(updates);
      
      console.log('Updating service ticket:', ticketId, normalizedUpdates);
      
      const { data, error } = await (supabase as any)
        .from('service_tickets')
        .update(normalizedUpdates)
        .eq('id', ticketId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Service ticket update failed:', error, normalizedUpdates);
        throw error;
      }
      return data;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['service-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['service-ticket', ticketId] });
      toast.success('Ticket updated');
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to update ticket';
      toast.error(message);
    },
  });
};

// Delete ticket
export const useDeleteServiceTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await (supabase as any)
        .from('service_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-tickets'] });
      toast.success('Ticket deleted');
    },
    onError: () => {
      toast.error('Failed to delete ticket');
    },
  });
};

// Add ticket note
export const useAddServiceTicketNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await (supabase as any)
        .from('service_ticket_notes')
        .insert({
          ticket_id: ticketId,
          content,
          created_by: user?.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['service-ticket-notes', ticketId] });
      toast.success('Note added');
    },
    onError: () => {
      toast.error('Failed to add note');
    },
  });
};

// Add ticket item
export const useAddServiceTicketItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Partial<ServiceTicketItem>) => {
      const { data, error } = await (supabase as any)
        .from('service_ticket_items')
        .insert(item)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, item) => {
      queryClient.invalidateQueries({ queryKey: ['service-ticket-items', item.ticket_id] });
      toast.success('Item added');
    },
    onError: () => {
      toast.error('Failed to add item');
    },
  });
};

// Delete ticket item
export const useDeleteServiceTicketItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, ticketId }: { itemId: string; ticketId: string }) => {
      const { error } = await (supabase as any)
        .from('service_ticket_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return ticketId;
    },
    onSuccess: (ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['service-ticket-items', ticketId] });
      toast.success('Item deleted');
    },
    onError: () => {
      toast.error('Failed to delete item');
    },
  });
};
