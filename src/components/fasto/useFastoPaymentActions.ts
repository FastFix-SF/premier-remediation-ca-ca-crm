import { useEffect, useCallback } from 'react';
import { onFastoAction, FastoAction, FastoActionResult, FASTO_ACTIONS, FastoContext } from './fastoActionApi';
import { 
  highlightElement, 
  simulateClick, 
  waitForElement, 
  waitForDialog,
  fillInputField,
  clickFastoAction,
  selectDropdownOption,
  delay
} from './FastoVisualAutomation';

/**
 * Payment action handlers interface
 */
export interface PaymentActionHandlers {
  recordPayment?: (data: {
    invoiceId?: string;
    amount: number;
    method?: string;
    date?: string;
    notes?: string;
  }) => Promise<string>;
  updatePayment?: (paymentId: string, data: Partial<{
    amount: number;
    method: string;
    date: string;
    notes: string;
  }>) => Promise<void>;
}

/**
 * Hook to register Fasto payment action handlers
 */
export function useFastoPaymentActions(handlers: PaymentActionHandlers): void {
  const handleAction = useCallback(async (action: FastoAction): Promise<FastoActionResult> => {
    console.log('[FastoPaymentActions] Received action:', action.type, action.payload);
    
    switch (action.type) {
      case FASTO_ACTIONS.PAYMENT_RECORD: {
        const { invoiceId, amount, method, date, notes } = action.payload as { 
          invoiceId?: string;
          amount: number;
          method?: string;
          date?: string;
          notes?: string;
        };
        
        // Try visual UI automation first
        console.log('[FastoPaymentActions] Starting visual payment recording');
        
        const createSuccess = await clickFastoAction('payment-create', { waitAfter: 500 });
        
        if (createSuccess) {
          const dialog = await waitForDialog('payment-dialog', 1200);
          
          if (dialog) {
            await fillInputField('[data-fasto-field="payment-amount"]', amount.toString());
            
            if (method) {
              await selectDropdownOption('[data-fasto-field="payment-method"]', method.toLowerCase());
            }
            
            if (notes) {
              await fillInputField('[data-fasto-field="payment-notes"]', notes);
            }
            
            await delay(300);
            const saveButton = await waitForElement('[data-fasto-action="payment-save"]', 800);
            
            if (saveButton) {
              await highlightElement(saveButton, 300);
              simulateClick(saveButton);
              
              return { 
                success: true, 
                message: `Recorded payment of $${amount}` 
              };
            }
          }
        }
        
        // Fallback to direct handler
        if (handlers.recordPayment) {
          try {
            const newId = await handlers.recordPayment({ invoiceId, amount, method, date, notes });
            FastoContext.setLastPaymentId(newId);
            return { 
              success: true, 
              message: `Recorded payment of $${amount}`,
              data: { paymentId: newId }
            };
          } catch (error) {
            return { 
              success: false, 
              message: error instanceof Error ? error.message : 'Failed to record payment' 
            };
          }
        }
        
        return { success: false, message: 'Record payment handler not available' };
      }
      
      case FASTO_ACTIONS.PAYMENT_UPDATE: {
        const { paymentId, ...updateData } = action.payload as { 
          paymentId?: string;
          amount?: number;
          method?: string;
          date?: string;
          notes?: string;
        };
        
        const targetId = paymentId || FastoContext.getLastPaymentId();
        
        if (!targetId) {
          return { success: false, message: 'No payment selected' };
        }
        
        if (!handlers.updatePayment) {
          return { success: false, message: 'Update handler not available' };
        }
        
        try {
          await handlers.updatePayment(targetId, updateData);
          FastoContext.setLastPaymentId(targetId);
          return { success: true, message: 'Payment updated' };
        } catch (error) {
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to update payment' 
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
