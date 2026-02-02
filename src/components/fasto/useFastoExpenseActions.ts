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
  selectDropdownOption,
  delay
} from './FastoVisualAutomation';

/**
 * Expense action handlers interface
 */
export interface ExpenseActionHandlers {
  createExpense?: (data: {
    amount: number;
    category?: string;
    description?: string;
    vendor?: string;
    date?: string;
    projectId?: string;
  }) => Promise<string>;
  updateExpense?: (expenseId: string, data: Partial<{
    amount: number;
    category: string;
    description: string;
    vendor: string;
  }>) => Promise<void>;
  deleteExpense?: (expenseId: string) => Promise<void>;
}

/**
 * Hook to register Fasto expense action handlers
 */
export function useFastoExpenseActions(handlers: ExpenseActionHandlers): void {
  const handleAction = useCallback(async (action: FastoAction): Promise<FastoActionResult> => {
    console.log('[FastoExpenseActions] Received action:', action.type, action.payload);
    
    switch (action.type) {
      case FASTO_ACTIONS.EXPENSE_CREATE: {
        const { amount, category, description, vendor, date, projectId } = action.payload as { 
          amount: number;
          category?: string;
          description?: string;
          vendor?: string;
          date?: string;
          projectId?: string;
        };
        
        // Try visual UI automation first
        console.log('[FastoExpenseActions] Starting visual expense creation');
        
        const createSuccess = await clickFastoAction('expense-create', { waitAfter: 500 });
        
        if (createSuccess) {
          const dialog = await waitForDialog('expense-dialog', 1200);
          
          if (dialog) {
            await fillInputField('[data-fasto-field="expense-amount"]', amount.toString());
            
            if (category) {
              await selectDropdownOption('[data-fasto-field="expense-category"]', category.toLowerCase());
            }
            
            if (description) {
              await fillInputField('[data-fasto-field="expense-description"]', description);
            }
            
            if (vendor) {
              await fillInputField('[data-fasto-field="expense-vendor"]', vendor);
            }
            
            await delay(300);
            const saveButton = await waitForElement('[data-fasto-action="expense-save"]', 800);
            
            if (saveButton) {
              await highlightElement(saveButton, 300);
              simulateClick(saveButton);
              
              return { 
                success: true, 
                message: `Created expense for $${amount}` 
              };
            }
          }
        }
        
        // Fallback to direct handler
        if (handlers.createExpense) {
          try {
            const newId = await handlers.createExpense({ amount, category, description, vendor, date, projectId });
            FastoContext.setLastExpenseId(newId);
            return { 
              success: true, 
              message: `Created expense for $${amount}`,
              data: { expenseId: newId }
            };
          } catch (error) {
            return { 
              success: false, 
              message: error instanceof Error ? error.message : 'Failed to create expense' 
            };
          }
        }
        
        return { success: false, message: 'Create handler not available' };
      }
      
      case FASTO_ACTIONS.EXPENSE_UPDATE: {
        const { expenseId, ...updateData } = action.payload as { 
          expenseId?: string;
          amount?: number;
          category?: string;
          description?: string;
          vendor?: string;
        };
        
        const targetId = expenseId || FastoContext.getLastExpenseId();
        
        if (!targetId) {
          return { success: false, message: 'No expense selected' };
        }
        
        // Try visual automation first
        const menuTrigger = document.querySelector(
          `[data-fasto-action="expense-menu-trigger"][data-fasto-expense-id="${targetId}"]`
        ) as HTMLElement;
        
        if (menuTrigger) {
          await scrollIntoViewIfNeeded(menuTrigger);
          await highlightElement(menuTrigger, 300);
          simulateClick(menuTrigger);
          
          await delay(250);
          
          const editButton = await waitForElement('[role="menu"] [data-fasto-action="edit-expense"]', 500);
          
          if (editButton) {
            await highlightElement(editButton, 300);
            simulateClick(editButton);
            
            const dialog = await waitForDialog('expense-dialog', 1200);
            
            if (dialog) {
              if (updateData.amount !== undefined) {
                await fillInputField('[data-fasto-field="expense-amount"]', updateData.amount.toString());
              }
              if (updateData.category) {
                await selectDropdownOption('[data-fasto-field="expense-category"]', updateData.category.toLowerCase());
              }
              if (updateData.description) {
                await fillInputField('[data-fasto-field="expense-description"]', updateData.description);
              }
              
              await delay(300);
              const saveButton = await waitForElement('[data-fasto-action="expense-save"]', 800);
              
              if (saveButton) {
                await highlightElement(saveButton, 300);
                simulateClick(saveButton);
                
                return { success: true, message: 'Expense updated' };
              }
            }
          }
        }
        
        // Fallback to direct handler
        if (handlers.updateExpense) {
          try {
            await handlers.updateExpense(targetId, updateData);
            FastoContext.setLastExpenseId(targetId);
            return { success: true, message: 'Expense updated' };
          } catch (error) {
            return { 
              success: false, 
              message: error instanceof Error ? error.message : 'Failed to update expense' 
            };
          }
        }
        
        return { success: false, message: 'Update handler not available' };
      }
      
      case FASTO_ACTIONS.EXPENSE_DELETE: {
        const { expenseId } = action.payload as { expenseId: string };
        
        if (!handlers.deleteExpense) {
          return { success: false, message: 'Delete handler not available' };
        }
        
        try {
          await handlers.deleteExpense(expenseId);
          return { success: true, message: 'Expense deleted' };
        } catch (error) {
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to delete expense' 
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
