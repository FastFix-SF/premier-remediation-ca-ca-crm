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
 * Work order action handlers interface
 */
export interface WorkOrderActionHandlers {
  createWorkOrder?: (data: {
    title: string;
    description?: string;
    priority?: string;
    assignee?: string;
    projectId?: string;
  }) => Promise<string>;
  updateWorkOrder?: (workOrderId: string, data: Partial<{
    title: string;
    description: string;
    priority: string;
    assignee: string;
    status: string;
  }>) => Promise<void>;
  updateStatus?: (workOrderId: string, newStatus: string) => Promise<void>;
  deleteWorkOrder?: (workOrderId: string) => Promise<void>;
  findByTitle?: (title: string) => { id: string; title: string } | null;
}

/**
 * Hook to register Fasto work order action handlers
 */
export function useFastoWorkOrderActions(handlers: WorkOrderActionHandlers): void {
  const handleAction = useCallback(async (action: FastoAction): Promise<FastoActionResult> => {
    console.log('[FastoWorkOrderActions] Received action:', action.type, action.payload);
    
    switch (action.type) {
      case FASTO_ACTIONS.WORK_ORDER_CREATE: {
        const { title, description, priority, assignee, projectId } = action.payload as { 
          title: string;
          description?: string;
          priority?: string;
          assignee?: string;
          projectId?: string;
        };
        
        // Try visual UI automation first
        console.log('[FastoWorkOrderActions] Starting visual work order creation');
        
        const createSuccess = await clickFastoAction('work-order-create', { waitAfter: 500 });
        
        if (createSuccess) {
          const dialog = await waitForDialog('work-order-dialog', 1200);
          
          if (dialog) {
            await fillInputField('[data-fasto-field="work-order-title"]', title);
            
            if (description) {
              await fillInputField('[data-fasto-field="work-order-description"]', description);
            }
            
            if (priority) {
              await selectDropdownOption('[data-fasto-field="work-order-priority"]', priority.toLowerCase());
            }
            
            await delay(300);
            const saveButton = await waitForElement('[data-fasto-action="work-order-save"]', 800);
            
            if (saveButton) {
              await highlightElement(saveButton, 300);
              simulateClick(saveButton);
              
              return { 
                success: true, 
                message: `Created work order: "${title}"` 
              };
            }
          }
        }
        
        // Fallback to direct handler
        if (handlers.createWorkOrder) {
          try {
            const newId = await handlers.createWorkOrder({ title, description, priority, assignee, projectId });
            FastoContext.setLastWorkOrderId(newId);
            return { 
              success: true, 
              message: `Created work order: "${title}"`,
              data: { workOrderId: newId }
            };
          } catch (error) {
            return { 
              success: false, 
              message: error instanceof Error ? error.message : 'Failed to create work order' 
            };
          }
        }
        
        return { success: false, message: 'Create handler not available' };
      }
      
      case FASTO_ACTIONS.WORK_ORDER_UPDATE: {
        const { workOrderId, ...updateData } = action.payload as { 
          workOrderId?: string;
          title?: string;
          description?: string;
          priority?: string;
          assignee?: string;
        };
        
        const targetId = workOrderId || FastoContext.getLastWorkOrderId();
        
        if (!targetId) {
          return { success: false, message: 'No work order selected' };
        }
        
        // Try visual automation first
        const menuTrigger = document.querySelector(
          `[data-fasto-action="work-order-menu-trigger"][data-fasto-work-order-id="${targetId}"]`
        ) as HTMLElement;
        
        if (menuTrigger) {
          await scrollIntoViewIfNeeded(menuTrigger);
          await highlightElement(menuTrigger, 300);
          simulateClick(menuTrigger);
          
          await delay(250);
          
          const editButton = await waitForElement('[role="menu"] [data-fasto-action="edit-work-order"]', 500);
          
          if (editButton) {
            await highlightElement(editButton, 300);
            simulateClick(editButton);
            
            const dialog = await waitForDialog('work-order-dialog', 1200);
            
            if (dialog) {
              if (updateData.title) {
                await fillInputField('[data-fasto-field="work-order-title"]', updateData.title);
              }
              if (updateData.description) {
                await fillInputField('[data-fasto-field="work-order-description"]', updateData.description);
              }
              if (updateData.priority) {
                await selectDropdownOption('[data-fasto-field="work-order-priority"]', updateData.priority.toLowerCase());
              }
              
              await delay(300);
              const saveButton = await waitForElement('[data-fasto-action="work-order-save"]', 800);
              
              if (saveButton) {
                await highlightElement(saveButton, 300);
                simulateClick(saveButton);
                
                return { success: true, message: 'Work order updated' };
              }
            }
          }
        }
        
        // Fallback to direct handler
        if (handlers.updateWorkOrder) {
          try {
            await handlers.updateWorkOrder(targetId, updateData);
            FastoContext.setLastWorkOrderId(targetId);
            return { success: true, message: 'Work order updated' };
          } catch (error) {
            return { 
              success: false, 
              message: error instanceof Error ? error.message : 'Failed to update work order' 
            };
          }
        }
        
        return { success: false, message: 'Update handler not available' };
      }
      
      case FASTO_ACTIONS.WORK_ORDER_UPDATE_STATUS: {
        const { workOrderId, newStatus } = action.payload as { workOrderId?: string; newStatus: string };
        
        const targetId = workOrderId || FastoContext.getLastWorkOrderId();
        
        if (!targetId) {
          return { success: false, message: 'No work order selected' };
        }
        
        if (!handlers.updateStatus) {
          return { success: false, message: 'Status update handler not available' };
        }
        
        try {
          await handlers.updateStatus(targetId, newStatus);
          FastoContext.setLastWorkOrderId(targetId);
          return { success: true, message: `Work order status updated to "${newStatus}"` };
        } catch (error) {
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to update status' 
          };
        }
      }
      
      case FASTO_ACTIONS.WORK_ORDER_DELETE: {
        const { workOrderId } = action.payload as { workOrderId: string };
        
        if (!handlers.deleteWorkOrder) {
          return { success: false, message: 'Delete handler not available' };
        }
        
        try {
          await handlers.deleteWorkOrder(workOrderId);
          return { success: true, message: 'Work order deleted' };
        } catch (error) {
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to delete work order' 
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
