import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TimelineEvent {
  id: string;
  type: 'invoice' | 'payment' | 'document' | 'status_change' | 'message' | 'photo' | 'task' | 'change_order' | 'estimate';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  metadata?: Record<string, unknown>;
}

export const useClientTimeline = (projectId: string | undefined) => {
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['client-timeline', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const timelineEvents: TimelineEvent[] = [];

      // Fetch invoices - use project_name instead of title
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, project_name, status, total_amount, created_at')
        .eq('project_id', projectId);
      
      (invoices || []).forEach(inv => {
        timelineEvents.push({
          id: `invoice-${inv.id}`,
          type: 'invoice',
          title: `Invoice ${inv.invoice_number || '#'}`,
          description: `${inv.project_name || 'Invoice'} - $${(inv.total_amount || 0).toLocaleString()} (${inv.status})`,
          timestamp: inv.created_at,
          icon: 'receipt',
          metadata: inv
        });
      });

      // Fetch payments via invoices
      const { data: projectInvoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('project_id', projectId);
      
      if (projectInvoices && projectInvoices.length > 0) {
        const invoiceIds = projectInvoices.map(i => i.id);
        const { data: payments } = await supabase
          .from('payments')
          .select('id, payment_number, amount, payment_date, payment_type')
          .in('invoice_id', invoiceIds);
        
        (payments || []).forEach(pmt => {
          timelineEvents.push({
            id: `payment-${pmt.id}`,
            type: 'payment',
            title: `Payment Received`,
            description: `$${(pmt.amount || 0).toLocaleString()} via ${pmt.payment_type || 'Unknown'}`,
            timestamp: pmt.payment_date,
            icon: 'dollar-sign',
            metadata: pmt
          });
        });
      }

      // Fetch documents (contracts)
      const { data: contracts } = await supabase
        .from('client_contracts')
        .select('id, title, status, created_at')
        .eq('project_id', projectId);
      
      (contracts || []).forEach(doc => {
        timelineEvents.push({
          id: `contract-${doc.id}`,
          type: 'document',
          title: doc.title || 'Contract',
          description: `Status: ${doc.status || 'Draft'}`,
          timestamp: doc.created_at,
          icon: 'file-text',
          metadata: doc
        });
      });

      // Fetch project documents - use 'name' instead of 'document_name'
      const { data: projectDocs } = await supabase
        .from('project_documents')
        .select('id, name, category, uploaded_at')
        .eq('project_id', projectId);
      
      (projectDocs || []).forEach(doc => {
        timelineEvents.push({
          id: `doc-${doc.id}`,
          type: 'document',
          title: doc.name,
          description: `Category: ${doc.category || 'General'}`,
          timestamp: doc.uploaded_at,
          icon: 'file',
          metadata: doc
        });
      });

      // Fetch photos
      const { data: photos } = await supabase
        .from('project_photos')
        .select('id, caption, photo_tag, uploaded_at')
        .eq('project_id', projectId);
      
      (photos || []).forEach(photo => {
        timelineEvents.push({
          id: `photo-${photo.id}`,
          type: 'photo',
          title: 'Photo Uploaded',
          description: photo.caption || photo.photo_tag || 'Project photo',
          timestamp: photo.uploaded_at,
          icon: 'camera',
          metadata: photo
        });
      });

      // Fetch completed tasks - use is_completed instead of status
      const { data: tasks } = await supabase
        .from('project_tasks')
        .select('id, title, is_completed, completed_at, created_at')
        .eq('project_id', projectId)
        .eq('is_completed', true);
      
      (tasks || []).forEach(task => {
        timelineEvents.push({
          id: `task-${task.id}`,
          type: 'task',
          title: 'Task Completed',
          description: task.title,
          timestamp: task.completed_at || task.created_at,
          icon: 'check-circle',
          metadata: task
        });
      });

      // Fetch change orders
      const { data: changeOrders } = await supabase
        .from('change_orders')
        .select('id, co_number, title, status, grand_total, created_at')
        .eq('project_id', projectId);
      
      (changeOrders || []).forEach(co => {
        timelineEvents.push({
          id: `co-${co.id}`,
          type: 'change_order',
          title: `Change Order ${co.co_number || '#'}`,
          description: `${co.title} - $${(co.grand_total || 0).toLocaleString()} (${co.status})`,
          timestamp: co.created_at,
          icon: 'edit',
          metadata: co
        });
      });

      // Fetch estimates
      const { data: estimates } = await supabase
        .from('project_estimates')
        .select('id, estimate_number, title, status, grand_total, created_at')
        .eq('project_id', projectId);
      
      (estimates || []).forEach(est => {
        timelineEvents.push({
          id: `est-${est.id}`,
          type: 'estimate',
          title: `Estimate ${est.estimate_number || '#'}`,
          description: `${est.title || 'Estimate'} - $${(est.grand_total || 0).toLocaleString()} (${est.status})`,
          timestamp: est.created_at,
          icon: 'file-text',
          metadata: est
        });
      });

      // Sort by timestamp descending (most recent first)
      return timelineEvents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
    enabled: !!projectId
  });

  return { events, isLoading, refetch };
};
