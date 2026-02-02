import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceItem } from '@/hooks/useInvoices';

// Fetch all invoice items for multiple invoices at once
export function useAllInvoiceItems(invoiceIds: string[]) {
  return useQuery({
    queryKey: ['all-invoice-items', invoiceIds],
    queryFn: async () => {
      if (!invoiceIds.length) return {};
      
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .in('invoice_id', invoiceIds)
        .order('display_order');
      
      if (error) throw error;
      
      // Group items by invoice_id for easy lookup
      const grouped: Record<string, InvoiceItem[]> = {};
      (data as InvoiceItem[]).forEach(item => {
        if (!grouped[item.invoice_id]) {
          grouped[item.invoice_id] = [];
        }
        grouped[item.invoice_id].push(item);
      });
      
      return grouped;
    },
    enabled: invoiceIds.length > 0
  });
}
