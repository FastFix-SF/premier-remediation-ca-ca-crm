import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientEstimate {
  id: string;
  estimate_number: string;
  title: string | null;
  status: string;
  grand_total: number | null;
  created_at: string;
}

export interface ClientInvoice {
  id: string;
  invoice_number: string;
  project_name: string;
  status: string;
  total_amount: number;
  balance_due: number;
  due_date: string | null;
  created_at: string;
}

export interface ClientPayment {
  id: string;
  payment_number: string | null;
  amount: number;
  payment_type: string | null;
  payment_date: string;
  customer_name: string;
}

export interface ClientChangeOrder {
  id: string;
  co_number: string | null;
  title: string;
  status: string;
  grand_total: number | null;
  date: string;
}

export interface ClientFinancialSummary {
  contractValue: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  changeOrdersTotal: number;
  revisedContractValue: number;
}

export const useClientFinancials = (projectId: string | undefined) => {
  // Fetch estimates
  const { data: estimates = [], isLoading: estimatesLoading } = useQuery({
    queryKey: ['client-estimates', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_estimates')
        .select('id, estimate_number, title, status, grand_total, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ClientEstimate[];
    },
    enabled: !!projectId
  });

  // Fetch invoices - use project_name instead of title
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['client-invoices', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, project_name, status, total_amount, balance_due, due_date, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ClientInvoice[];
    },
    enabled: !!projectId
  });

  // Fetch payments - use payment_type instead of payment_method, join by invoice
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['client-payments', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      // Get invoice ids for this project first
      const { data: projectInvoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('project_id', projectId);
      
      if (!projectInvoices || projectInvoices.length === 0) return [];
      
      const invoiceIds = projectInvoices.map(i => i.id);
      const { data, error } = await supabase
        .from('payments')
        .select('id, payment_number, amount, payment_type, payment_date, customer_name')
        .in('invoice_id', invoiceIds)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return (data || []) as ClientPayment[];
    },
    enabled: !!projectId
  });

  // Fetch change orders
  const { data: changeOrders = [], isLoading: changeOrdersLoading } = useQuery({
    queryKey: ['client-change-orders', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('change_orders')
        .select('id, co_number, title, status, grand_total, date')
        .eq('project_id', projectId)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []) as ClientChangeOrder[];
    },
    enabled: !!projectId
  });

  // Calculate summary
  const acceptedEstimates = estimates.filter(e => 
    e.status?.toLowerCase() === 'accepted' || e.status?.toLowerCase() === 'approved'
  );
  const contractValue = acceptedEstimates.reduce((sum, e) => sum + (e.grand_total || 0), 0);
  
  const approvedChangeOrders = changeOrders.filter(co => 
    co.status?.toLowerCase() === 'approved'
  );
  const changeOrdersTotal = approvedChangeOrders.reduce((sum, co) => sum + (co.grand_total || 0), 0);
  
  const totalInvoiced = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const outstandingBalance = invoices.reduce((sum, i) => sum + (i.balance_due || 0), 0);

  const summary: ClientFinancialSummary = {
    contractValue,
    totalInvoiced,
    totalPaid,
    outstandingBalance,
    changeOrdersTotal,
    revisedContractValue: contractValue + changeOrdersTotal
  };

  return {
    estimates,
    invoices,
    payments,
    changeOrders,
    summary,
    isLoading: estimatesLoading || invoicesLoading || paymentsLoading || changeOrdersLoading
  };
};
