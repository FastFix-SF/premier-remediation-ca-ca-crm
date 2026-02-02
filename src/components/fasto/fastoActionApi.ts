/**
 * Fasto Action API
 * Global event system for agentic UI actions
 * Components register handlers, Fasto dispatches actions
 */

export interface FastoAction {
  type: string;
  payload: Record<string, unknown>;
}

export interface FastoActionResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

// Event name for the action system
export const FASTO_ACTION_EVENT = 'fastoAction';

/**
 * Dispatch a Fasto action to any registered handlers
 */
export function dispatchFastoAction(action: FastoAction): void {
  console.log('[FastoAction] Dispatching:', action.type, action.payload);
  window.dispatchEvent(
    new CustomEvent(FASTO_ACTION_EVENT, { detail: action })
  );
}

/**
 * Register a handler for Fasto actions
 * Returns an unsubscribe function
 */
export function onFastoAction(
  handler: (action: FastoAction) => Promise<FastoActionResult> | FastoActionResult
): () => void {
  const listener = async (event: Event) => {
    const customEvent = event as CustomEvent<FastoAction>;
    const action = customEvent.detail;
    
    try {
      const result = await handler(action);
      
      // Dispatch result event for Fasto to handle
      window.dispatchEvent(
        new CustomEvent('fastoActionResult', {
          detail: { action, result }
        })
      );
    } catch (error) {
      console.error('[FastoAction] Handler error:', error);
      window.dispatchEvent(
        new CustomEvent('fastoActionResult', {
          detail: {
            action,
            result: {
              success: false,
              message: error instanceof Error ? error.message : 'Action failed'
            }
          }
        })
      );
    }
  };
  
  window.addEventListener(FASTO_ACTION_EVENT, listener);
  return () => window.removeEventListener(FASTO_ACTION_EVENT, listener);
}

// Action type constants
export const FASTO_ACTIONS = {
  // Lead actions
  LEAD_EDIT_NAME: 'lead.edit_name',
  LEAD_UPDATE_STATUS: 'lead.update_status',
  LEAD_DELETE: 'lead.delete',
  LEAD_CREATE: 'lead.create',
  
  // Proposal actions
  PROPOSAL_ADD_SCOPE: 'proposal.add_scope_item',
  PROPOSAL_UPDATE_PRICE: 'proposal.update_price',
  PROPOSAL_CREATE: 'proposal.create',
  
  // Project actions
  PROJECT_UPDATE_STATUS: 'project.update_status',
  PROJECT_EDIT_NAME: 'project.edit_name',
  PROJECT_DELETE: 'project.delete',
  PROJECT_CREATE: 'project.create',
  
  // Invoice actions
  INVOICE_CREATE: 'invoice.create',
  INVOICE_UPDATE_STATUS: 'invoice.update_status',
  INVOICE_MARK_PAID: 'invoice.mark_paid',
  INVOICE_DELETE: 'invoice.delete',
  
  // Schedule actions
  SCHEDULE_CREATE_SHIFT: 'schedule.create_shift',
  SCHEDULE_UPDATE_SHIFT: 'schedule.update_shift',
  SCHEDULE_DELETE_SHIFT: 'schedule.delete_shift',
  
  // Work Order actions
  WORK_ORDER_CREATE: 'work_order.create',
  WORK_ORDER_UPDATE: 'work_order.update',
  WORK_ORDER_DELETE: 'work_order.delete',
  WORK_ORDER_UPDATE_STATUS: 'work_order.update_status',
  
  // Expense actions
  EXPENSE_CREATE: 'expense.create',
  EXPENSE_UPDATE: 'expense.update',
  EXPENSE_DELETE: 'expense.delete',
  
  // Payment actions
  PAYMENT_RECORD: 'payment.record',
  PAYMENT_UPDATE: 'payment.update',
  
  // Inspection actions
  INSPECTION_SCHEDULE: 'inspection.schedule',
  INSPECTION_UPDATE: 'inspection.update',
  
  // Punchlist actions
  PUNCHLIST_CREATE: 'punchlist.create',
  PUNCHLIST_UPDATE: 'punchlist.update',
  PUNCHLIST_COMPLETE: 'punchlist.complete',
  
  // Navigation actions (for complex navigation)
  NAVIGATE_WITH_CONTEXT: 'navigate.with_context',
} as const;

/**
 * Store for context (last active IDs)
 */
export const FastoContext = {
  // Lead context
  setLastLeadId: (id: string) => sessionStorage.setItem('fasto-last-lead-id', id),
  getLastLeadId: (): string | null => sessionStorage.getItem('fasto-last-lead-id'),
  
  // Project context
  setLastProjectId: (id: string) => sessionStorage.setItem('fasto-last-project-id', id),
  getLastProjectId: (): string | null => sessionStorage.getItem('fasto-last-project-id'),
  
  // Proposal context
  setLastProposalId: (id: string) => sessionStorage.setItem('fasto-last-proposal-id', id),
  getLastProposalId: (): string | null => sessionStorage.getItem('fasto-last-proposal-id'),
  
  // Invoice context
  setLastInvoiceId: (id: string) => sessionStorage.setItem('fasto-last-invoice-id', id),
  getLastInvoiceId: (): string | null => sessionStorage.getItem('fasto-last-invoice-id'),
  
  // Schedule context
  setLastScheduleId: (id: string) => sessionStorage.setItem('fasto-last-schedule-id', id),
  getLastScheduleId: (): string | null => sessionStorage.getItem('fasto-last-schedule-id'),
  
  // Work Order context
  setLastWorkOrderId: (id: string) => sessionStorage.setItem('fasto-last-work-order-id', id),
  getLastWorkOrderId: (): string | null => sessionStorage.getItem('fasto-last-work-order-id'),
  
  // Expense context
  setLastExpenseId: (id: string) => sessionStorage.setItem('fasto-last-expense-id', id),
  getLastExpenseId: (): string | null => sessionStorage.getItem('fasto-last-expense-id'),
  
  // Payment context
  setLastPaymentId: (id: string) => sessionStorage.setItem('fasto-last-payment-id', id),
  getLastPaymentId: (): string | null => sessionStorage.getItem('fasto-last-payment-id'),
  
  // Tab/Navigation context
  setCurrentTab: (tab: string) => sessionStorage.setItem('fasto-current-tab', tab),
  getCurrentTab: (): string | null => sessionStorage.getItem('fasto-current-tab'),
  
  setCurrentSubtab: (subtab: string) => sessionStorage.setItem('fasto-current-subtab', subtab),
  getCurrentSubtab: (): string | null => sessionStorage.getItem('fasto-current-subtab'),
  
  // Clear all context
  clearAll: () => {
    const keys = [
      'fasto-last-lead-id', 'fasto-last-project-id', 'fasto-last-proposal-id',
      'fasto-last-invoice-id', 'fasto-last-schedule-id', 'fasto-last-work-order-id',
      'fasto-last-expense-id', 'fasto-last-payment-id', 'fasto-current-tab', 'fasto-current-subtab'
    ];
    keys.forEach(key => sessionStorage.removeItem(key));
  },
  
  // Get current context summary
  getSummary: () => ({
    leadId: sessionStorage.getItem('fasto-last-lead-id'),
    projectId: sessionStorage.getItem('fasto-last-project-id'),
    proposalId: sessionStorage.getItem('fasto-last-proposal-id'),
    invoiceId: sessionStorage.getItem('fasto-last-invoice-id'),
    scheduleId: sessionStorage.getItem('fasto-last-schedule-id'),
    workOrderId: sessionStorage.getItem('fasto-last-work-order-id'),
    expenseId: sessionStorage.getItem('fasto-last-expense-id'),
    paymentId: sessionStorage.getItem('fasto-last-payment-id'),
    currentTab: sessionStorage.getItem('fasto-current-tab'),
    currentSubtab: sessionStorage.getItem('fasto-current-subtab'),
  })
};
