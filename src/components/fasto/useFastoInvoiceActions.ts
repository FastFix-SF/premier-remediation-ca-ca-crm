import { useEffect, useCallback } from 'react';
import { onFastoAction, FastoAction, FastoActionResult, FASTO_ACTIONS, FastoContext } from './fastoActionApi';
import { 
  highlightElement, 
  simulateClick, 
  waitForElement, 
  waitForDialog,
  scrollIntoViewIfNeeded,
  fillInputField,
  clickFastoAction,
  delay
} from './FastoVisualAutomation';

/**
 * Invoice action handlers interface
 */
export interface InvoiceActionHandlers {
  createInvoice?: (data: { projectId?: string; customerId?: string; amount?: number; description?: string }) => Promise<string>;
  updateStatus?: (invoiceId: string, newStatus: string) => Promise<void>;
  markPaid?: (invoiceId: string) => Promise<void>;
  deleteInvoice?: (invoiceId: string) => Promise<void>;
  findInvoiceByNumber?: (number: string) => { id: string; number: string } | null;
}

/**
 * Hook to register Fasto invoice action handlers
 */
export function useFastoInvoiceActions(handlers: InvoiceActionHandlers): void {
  const handleAction = useCallback(async (action: FastoAction): Promise<FastoActionResult> => {
    console.log('[FastoInvoiceActions] Received action:', action.type, action.payload);
    
    switch (action.type) {
      case FASTO_ACTIONS.INVOICE_CREATE: {
        const { projectId, customerId, amount, description } = action.payload as { 
          projectId?: string;
          customerId?: string;
          amount?: number;
          description?: string;
        };
        
        // Try visual UI automation first
        console.log('[FastoInvoiceActions] Starting visual invoice creation');
        
        // Click create button
        const createSuccess = await clickFastoAction('invoice-create', { waitAfter: 500 });
        
        if (createSuccess) {
          const dialog = await waitForDialog('invoice-dialog', 1200);
          
          if (dialog) {
            if (amount) {
              await fillInputField('[data-fasto-field="invoice-amount"]', amount.toString());
            }
            if (description) {
              await fillInputField('[data-fasto-field="invoice-description"]', description);
            }
            
            await delay(300);
            const saveButton = await waitForElement('[data-fasto-action="invoice-save"]', 800);
            
            if (saveButton) {
              await highlightElement(saveButton, 300);
              simulateClick(saveButton);
              
              return { 
                success: true, 
                message: `Created invoice${amount ? ` for $${amount}` : ''}` 
              };
            }
          }
        }
        
        // Fallback to direct handler
        if (handlers.createInvoice) {
          try {
            const newId = await handlers.createInvoice({ projectId, customerId, amount, description });
            FastoContext.setLastInvoiceId(newId);
            return { 
              success: true, 
              message: `Created invoice${amount ? ` for $${amount}` : ''}`,
              data: { invoiceId: newId }
            };
          } catch (error) {
            return { 
              success: false, 
              message: error instanceof Error ? error.message : 'Failed to create invoice' 
            };
          }
        }
        
        return { success: false, message: 'Create handler not available' };
      }
      
      case FASTO_ACTIONS.INVOICE_UPDATE_STATUS: {
        const { invoiceId, newStatus } = action.payload as { invoiceId: string; newStatus: string };
        
        const targetId = invoiceId || FastoContext.getLastInvoiceId();
        
        if (!targetId) {
          return { success: false, message: 'No invoice selected' };
        }
        
        if (!handlers.updateStatus) {
          return { success: false, message: 'Status update handler not available' };
        }
        
        try {
          await handlers.updateStatus(targetId, newStatus);
          FastoContext.setLastInvoiceId(targetId);
          return { success: true, message: `Invoice status updated to "${newStatus}"` };
        } catch (error) {
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to update status' 
          };
        }
      }
      
      case FASTO_ACTIONS.INVOICE_MARK_PAID: {
        const { invoiceId } = action.payload as { invoiceId?: string };
        
        const targetId = invoiceId || FastoContext.getLastInvoiceId();
        
        if (!targetId) {
          return { success: false, message: 'No invoice selected' };
        }
        
        // Try visual automation first
        const markPaidButton = document.querySelector(
          `[data-fasto-action="mark-paid"][data-fasto-invoice-id="${targetId}"]`
        ) as HTMLElement;
        
        if (markPaidButton) {
          await scrollIntoViewIfNeeded(markPaidButton);
          await highlightElement(markPaidButton, 300);
          simulateClick(markPaidButton);
          
          return { success: true, message: 'Invoice marked as paid' };
        }
        
        // Fallback to direct handler
        if (handlers.markPaid) {
          try {
            await handlers.markPaid(targetId);
            return { success: true, message: 'Invoice marked as paid' };
          } catch (error) {
            return { 
              success: false, 
              message: error instanceof Error ? error.message : 'Failed to mark invoice as paid' 
            };
          }
        }
        
        return { success: false, message: 'Mark paid handler not available' };
      }
      
      case FASTO_ACTIONS.INVOICE_DELETE: {
        const { invoiceId } = action.payload as { invoiceId: string };
        
        if (!handlers.deleteInvoice) {
          return { success: false, message: 'Delete handler not available' };
        }
        
        try {
          await handlers.deleteInvoice(invoiceId);
          return { success: true, message: 'Invoice deleted' };
        } catch (error) {
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to delete invoice' 
          };
        }
      }
      
      default:
        return { success: false, message: 'Unknown action type' };
    }
  }, [handlers]);

  useEffect(() => {
    const unsubscribe = onFastoAction(handleAction);
    return unsubscribe;
  }, [handleAction]);
}
