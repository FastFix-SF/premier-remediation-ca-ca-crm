import React from 'react';
import { useFastoLeadActions } from './useFastoActionHandler';
import { useFastoProjectActions } from './useFastoProjectActions';
import { useFastoInvoiceActions } from './useFastoInvoiceActions';
import { useFastoScheduleActions } from './useFastoScheduleActions';
import { useFastoWorkOrderActions } from './useFastoWorkOrderActions';
import { useFastoExpenseActions } from './useFastoExpenseActions';
import { useFastoPaymentActions } from './useFastoPaymentActions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { dispatchFastoDataRefresh } from '@/hooks/useFastoDataRefresh';

/**
 * Fasto Action Registry
 * Globally registers all entity action handlers
 * Mount this once in AdminLayout to enable voice control of all entities
 */
export const FastoActionRegistry: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  // ===== LEAD ACTIONS =====
  useFastoLeadActions({
    findLeadByName: (name: string) => {
      // This is handled by the component that has access to leads data
      // The handler in LeadManagement.tsx will override this
      return null;
    },
    editName: async (leadId: string, newName: string) => {
      const { error } = await supabase
        .from('leads')
        .update({ name: newName })
        .eq('id', leadId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['leads']);
    },
    updateStatus: async (leadId: string, newStatus: string) => {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['leads']);
    },
    deleteLead: async (leadId: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['leads']);
      toast.success('Lead deleted');
    },
  });

  // ===== PROJECT ACTIONS =====
  useFastoProjectActions({
    editName: async (projectId: string, newName: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ name: newName })
        .eq('id', projectId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['projects']);
    },
    updateStatus: async (projectId: string, newStatus: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['projects']);
    },
    deleteProject: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['projects']);
      toast.success('Project deleted');
    },
  });

  // ===== INVOICE ACTIONS =====
  useFastoInvoiceActions({
    createInvoice: async (data) => {
      // Invoice creation best handled via visual automation for proper form validation
      console.log('[FastoRegistry] Invoice create requested:', data);
      toast.info('Opening invoice dialog...');
      return 'visual-automation';
    },
    updateStatus: async (invoiceId: string, newStatus: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['invoices']);
    },
    markPaid: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString(), balance_due: 0 })
        .eq('id', invoiceId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['invoices', 'payments']);
      toast.success('Invoice marked as paid');
    },
    deleteInvoice: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['invoices']);
      toast.success('Invoice deleted');
    },
  });

  // ===== SCHEDULE ACTIONS =====
  // Note: Schedule uses project_schedule table or similar - visual automation preferred
  useFastoScheduleActions({
    createShift: async (data) => {
      // For now, schedule creation is best done via visual automation
      // This fallback handler can be enhanced when schedule table structure is confirmed
      console.log('[FastoRegistry] Schedule create requested:', data);
      toast.info('Opening schedule dialog for shift creation...');
      return 'visual-automation';
    },
    updateShift: async (shiftId: string, data) => {
      console.log('[FastoRegistry] Schedule update requested:', shiftId, data);
      toast.info('Schedule update via visual automation');
    },
    deleteShift: async (shiftId: string) => {
      console.log('[FastoRegistry] Schedule delete requested:', shiftId);
      toast.info('Schedule delete via visual automation');
    },
  });

  // ===== WORK ORDER ACTIONS =====
  useFastoWorkOrderActions({
    createWorkOrder: async (data) => {
      const { data: workOrder, error } = await supabase
        .from('work_orders')
        .insert({
          title: data.title || 'New Work Order',
          description: data.description,
          project_id: data.projectId,
          status: 'draft',
          work_order_number: `WO-${Date.now()}`,
        })
        .select('id')
        .maybeSingle();
      
      if (error) throw error;
      dispatchFastoDataRefresh(['work_orders']);
      toast.success('Work order created');
      return workOrder.id;
    },
    updateWorkOrder: async (workOrderId: string, data) => {
      const { error } = await supabase
        .from('work_orders')
        .update(data)
        .eq('id', workOrderId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['work_orders']);
    },
    updateStatus: async (workOrderId: string, newStatus: string) => {
      const { error } = await supabase
        .from('work_orders')
        .update({ status: newStatus })
        .eq('id', workOrderId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['work_orders']);
    },
    deleteWorkOrder: async (workOrderId: string) => {
      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', workOrderId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['work_orders']);
      toast.success('Work order deleted');
    },
  });

  // ===== EXPENSE ACTIONS =====
  useFastoExpenseActions({
    createExpense: async (data) => {
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
          expense_name: data.description || 'New Expense',
          amount: data.amount,
          expense_type: data.category,
          project_id: data.projectId,
          vendor: data.vendor,
          expense_date: data.date || new Date().toISOString().split('T')[0],
          status: 'pending',
        })
        .select('id')
        .maybeSingle();
      
      if (error) throw error;
      dispatchFastoDataRefresh(['expenses']);
      toast.success('Expense created');
      return expense.id;
    },
    updateExpense: async (expenseId: string, data) => {
      const { error } = await supabase
        .from('expenses')
        .update(data)
        .eq('id', expenseId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['expenses']);
    },
    deleteExpense: async (expenseId: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['expenses']);
      toast.success('Expense deleted');
    },
  });

  // ===== PAYMENT ACTIONS =====
  useFastoPaymentActions({
    recordPayment: async (data) => {
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          invoice_id: data.invoiceId,
          amount: data.amount,
          payment_type: data.method || 'other',
          payment_date: data.date || new Date().toISOString().split('T')[0],
          customer_name: 'Customer',
          status: 'received',
        })
        .select('id')
        .maybeSingle();
      
      if (error) throw error;
      dispatchFastoDataRefresh(['payments', 'invoices']);
      toast.success('Payment recorded');
      return payment.id;
    },
    updatePayment: async (paymentId: string, data) => {
      const { error } = await supabase
        .from('payments')
        .update(data)
        .eq('id', paymentId);
      
      if (error) throw error;
      dispatchFastoDataRefresh(['payments']);
    },
  });

  return <>{children}</>;
};

export default FastoActionRegistry;
