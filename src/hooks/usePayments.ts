import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  payment_number?: string;
  customer_name: string;
  invoice_id?: string;
  invoice_number?: string;
  payment_date: string;
  amount: number;
  payment_type: string;
  deposit_to?: string;
  reference_number?: string;
  address?: string;
  status: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentNote {
  id: string;
  payment_id: string;
  title?: string;
  content: string;
  created_by?: string;
  created_at?: string;
}

// Fetch all payments
export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    }
  });
}

// Fetch single payment
export function usePayment(paymentId: string | undefined) {
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      if (!paymentId) return null;
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Payment;
    },
    enabled: !!paymentId
  });
}

// Create payment
export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payment: Partial<Payment>) => {
      const { data, error } = await supabase
        .from('payments')
        .insert([payment as any])
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      toast({ title: 'Error creating payment', description: error.message, variant: 'destructive' });
    }
  });
}

// Update payment
export function useUpdatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Payment> & { id: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data as Payment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', data.id] });
    }
  });
}

// Delete payment
export function useDeletePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: 'Payment deleted' });
    }
  });
}

// Payment Notes
export function usePaymentNotes(paymentId: string | undefined) {
  return useQuery({
    queryKey: ['payment-notes', paymentId],
    queryFn: async () => {
      if (!paymentId) return [];
      const { data, error } = await supabase
        .from('payment_notes')
        .select('*')
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PaymentNote[];
    },
    enabled: !!paymentId
  });
}

export function useCreatePaymentNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (note: Partial<PaymentNote>) => {
      const { data, error } = await supabase
        .from('payment_notes')
        .insert([note as any])
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data as PaymentNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-notes', data.payment_id] });
    }
  });
}

export function useDeletePaymentNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, paymentId }: { id: string; paymentId: string }) => {
      const { error } = await supabase
        .from('payment_notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return paymentId;
    },
    onSuccess: (paymentId) => {
      queryClient.invalidateQueries({ queryKey: ['payment-notes', paymentId] });
    }
  });
}
