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
 * Convert 24-hour time format to 12-hour AM/PM format
 * @example convertTo12Hour("14:00") => "2:00 PM"
 * @example convertTo12Hour("09:30") => "9:30 AM"
 */
function convertTo12Hour(time24: string): string {
  // Handle already-converted times
  if (time24.includes('AM') || time24.includes('PM')) {
    return time24;
  }
  
  const [hours, minutes] = time24.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    return time24; // Return as-is if invalid
  }
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Normalize time format - accepts both 24h and 12h, always returns 12h AM/PM
 */
function normalizeTimeFormat(time: string | undefined): string | undefined {
  if (!time) return undefined;
  return convertTo12Hour(time);
}

/**
 * Schedule action handlers interface
 */
export interface ScheduleActionHandlers {
  createShift?: (data: {
    date: string;
    startTime?: string;
    endTime?: string;
    employeeId?: string;
    projectId?: string;
    jobType?: string;
  }) => Promise<string>;
  updateShift?: (shiftId: string, data: Partial<{
    date: string;
    startTime: string;
    endTime: string;
    employeeId: string;
  }>) => Promise<void>;
  deleteShift?: (shiftId: string) => Promise<void>;
}

/**
 * Hook to register Fasto schedule action handlers
 */
export function useFastoScheduleActions(handlers: ScheduleActionHandlers): void {
  const handleAction = useCallback(async (action: FastoAction): Promise<FastoActionResult> => {
    console.log('[FastoScheduleActions] Received action:', action.type, action.payload);
    
    switch (action.type) {
      case FASTO_ACTIONS.SCHEDULE_CREATE_SHIFT: {
        const payload = action.payload as { 
          date: string;
          startTime?: string;
          endTime?: string;
          employeeId?: string;
          projectId?: string;
          jobType?: string;
        };
        
        // Normalize time formats (convert 24h to 12h AM/PM if needed)
        const date = payload.date;
        const startTime = normalizeTimeFormat(payload.startTime);
        const endTime = normalizeTimeFormat(payload.endTime);
        const { employeeId, projectId, jobType } = payload;
        
        console.log('[FastoScheduleActions] Normalized times:', { startTime, endTime });
        
        // Try visual UI automation first
        console.log('[FastoScheduleActions] Starting visual shift creation');
        
        const createSuccess = await clickFastoAction('shift-create', { waitAfter: 500 });
        
        if (createSuccess) {
          const dialog = await waitForDialog('shift-dialog', 1200);
          
          if (dialog) {
            if (date) {
              await fillInputField('[data-fasto-field="shift-date"]', date);
            }
            if (startTime) {
              await fillInputField('[data-fasto-field="shift-start-time"]', startTime);
            }
            if (endTime) {
              await fillInputField('[data-fasto-field="shift-end-time"]', endTime);
            }
            
            await delay(300);
            const saveButton = await waitForElement('[data-fasto-action="shift-save"]', 800);
            
            if (saveButton) {
              await highlightElement(saveButton, 300);
              simulateClick(saveButton);
              
              return { 
                success: true, 
                message: `Created shift for ${date}${startTime ? ` at ${startTime}` : ''}` 
              };
            }
          }
        }
        
        // Fallback to direct handler
        if (handlers.createShift) {
          try {
            const newId = await handlers.createShift({ date, startTime, endTime, employeeId, projectId, jobType });
            FastoContext.setLastScheduleId(newId);
            return { 
              success: true, 
              message: `Created shift for ${date}`,
              data: { shiftId: newId }
            };
          } catch (error) {
            return { 
              success: false, 
              message: error instanceof Error ? error.message : 'Failed to create shift' 
            };
          }
        }
        
        return { success: false, message: 'Create handler not available' };
      }
      
      case FASTO_ACTIONS.SCHEDULE_UPDATE_SHIFT: {
        const { shiftId, ...updateData } = action.payload as { 
          shiftId: string;
          date?: string;
          startTime?: string;
          endTime?: string;
          employeeId?: string;
        };
        
        const targetId = shiftId || FastoContext.getLastScheduleId();
        
        if (!targetId) {
          return { success: false, message: 'No shift selected' };
        }
        
        // Try visual automation first
        const menuTrigger = document.querySelector(
          `[data-fasto-action="shift-menu-trigger"][data-fasto-shift-id="${targetId}"]`
        ) as HTMLElement;
        
        if (menuTrigger) {
          await scrollIntoViewIfNeeded(menuTrigger);
          await highlightElement(menuTrigger, 300);
          simulateClick(menuTrigger);
          
          await delay(250);
          
          const editButton = await waitForElement('[role="menu"] [data-fasto-action="edit-shift"]', 500);
          
          if (editButton) {
            await highlightElement(editButton, 300);
            simulateClick(editButton);
            
            const dialog = await waitForDialog('shift-dialog', 1200);
            
            if (dialog) {
              if (updateData.date) {
                await fillInputField('[data-fasto-field="shift-date"]', updateData.date);
              }
              if (updateData.startTime) {
                await fillInputField('[data-fasto-field="shift-start-time"]', updateData.startTime);
              }
              if (updateData.endTime) {
                await fillInputField('[data-fasto-field="shift-end-time"]', updateData.endTime);
              }
              
              await delay(300);
              const saveButton = await waitForElement('[data-fasto-action="shift-save"]', 800);
              
              if (saveButton) {
                await highlightElement(saveButton, 300);
                simulateClick(saveButton);
                
                return { success: true, message: 'Shift updated' };
              }
            }
          }
        }
        
        // Fallback to direct handler
        if (handlers.updateShift) {
          try {
            await handlers.updateShift(targetId, updateData);
            FastoContext.setLastScheduleId(targetId);
            return { success: true, message: 'Shift updated' };
          } catch (error) {
            return { 
              success: false, 
              message: error instanceof Error ? error.message : 'Failed to update shift' 
            };
          }
        }
        
        return { success: false, message: 'Update handler not available' };
      }
      
      case FASTO_ACTIONS.SCHEDULE_DELETE_SHIFT: {
        const { shiftId } = action.payload as { shiftId: string };
        
        if (!handlers.deleteShift) {
          return { success: false, message: 'Delete handler not available' };
        }
        
        try {
          await handlers.deleteShift(shiftId);
          return { success: true, message: 'Shift deleted' };
        } catch (error) {
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to delete shift' 
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
