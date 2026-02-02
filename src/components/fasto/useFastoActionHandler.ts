import { useEffect, useCallback } from 'react';
import { onFastoAction, FastoAction, FastoActionResult, FASTO_ACTIONS } from './fastoActionApi';

/**
 * Lead action handlers interface
 */
export interface LeadActionHandlers {
  // Called when Fasto wants to edit a lead's name
  editName?: (leadId: string, newName: string) => Promise<void>;
  // Called when Fasto wants to update a lead's status
  updateStatus?: (leadId: string, newStatus: string) => Promise<void>;
  // Called when Fasto wants to delete a lead
  deleteLead?: (leadId: string) => Promise<void>;
  // Find a lead by name (for matching voice commands to actual leads)
  findLeadByName?: (name: string) => { id: string; name: string } | null;
}

/**
 * Highlight an element to show Fasto is interacting with it (agent mode visual)
 */
function highlightElement(element: HTMLElement, durationMs: number = 400): Promise<void> {
  return new Promise(resolve => {
    const originalOutline = element.style.outline;
    const originalOutlineOffset = element.style.outlineOffset;
    const originalTransition = element.style.transition;
    const originalZIndex = element.style.zIndex;
    
    // Add green glow effect
    element.style.outline = '3px solid #22c55e';
    element.style.outlineOffset = '2px';
    element.style.transition = 'outline 0.15s ease';
    element.style.zIndex = '9999';
    
    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.outlineOffset = originalOutlineOffset;
      element.style.transition = originalTransition;
      element.style.zIndex = originalZIndex;
      resolve();
    }, durationMs);
  });
}

/**
 * Simulate a click on an element with proper event dispatching
 */
function simulateClick(element: HTMLElement): void {
  console.log('[FastoAction] Simulating click on:', element);
  
  // Focus the element first
  element.focus();
  
  // Dispatch mouse events for proper React/Radix handling
  const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
  const mouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window });
  const click = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
  
  element.dispatchEvent(mouseDown);
  element.dispatchEvent(mouseUp);
  element.dispatchEvent(click);
}

/**
 * Wait for an element to appear in the DOM (checks globally for portals)
 */
function waitForElement(selector: string, timeoutMs: number = 2000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const check = () => {
      // Check globally (important for Radix portals that render at body level)
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime > timeoutMs) {
        console.warn('[FastoAction] Element timeout:', selector);
        resolve(null);
        return;
      }
      
      requestAnimationFrame(check);
    };
    
    check();
  });
}

/**
 * Wait for the leads page to be active and visible
 */
function waitForLeadsPageActive(timeoutMs: number = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const check = () => {
      // Check if the leads page marker is present and the sales tab is active
      const leadsMarker = document.querySelector('[data-fasto-page="admin-sales-leads"]');
      const salesTabActive = document.querySelector('[data-fasto-page="admin-sales"][data-state="active"]');
      
      if (leadsMarker && salesTabActive) {
        console.log('[FastoAction] Leads page is active and visible');
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > timeoutMs) {
        console.warn('[FastoAction] Leads page not active after timeout');
        resolve(false);
        return;
      }
      
      requestAnimationFrame(check);
    };
    
    check();
  });
}

/**
 * Scroll an element into view smoothly
 */
function scrollIntoViewIfNeeded(element: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Give scroll time to complete
    setTimeout(resolve, 300);
  });
}

/**
 * Hook to register Fasto lead action handlers
 * This allows components to respond to Fasto's agentic actions
 */
export function useFastoLeadActions(handlers: LeadActionHandlers): void {
  const handleAction = useCallback(async (action: FastoAction): Promise<FastoActionResult> => {
    console.log('[FastoLeadActions] Received action:', action.type, action.payload);
    
    switch (action.type) {
      case FASTO_ACTIONS.LEAD_EDIT_NAME: {
        const { leadName, newName, leadId: payloadLeadId } = action.payload as { 
          leadName?: string; 
          newName: string; 
          leadId?: string;
        };
        
        // Find the lead by name or use provided ID
        let targetLeadId = payloadLeadId as string | undefined;
        let foundLeadName = leadName;
        
        if (!targetLeadId && leadName && handlers.findLeadByName) {
          const found = handlers.findLeadByName(leadName as string);
          if (found) {
            targetLeadId = found.id;
            foundLeadName = found.name;
          }
        }
        
        if (!targetLeadId) {
          return { success: false, message: `Could not find lead "${leadName}"` };
        }
        
        // ===== AGENTIC UI MODE =====
        // Try to click the menu trigger, then the edit button, then fill the form
        console.log('[FastoAction] Starting agentic UI edit for lead:', targetLeadId);
        
        // Step 0: Wait for the leads page to be active
        const leadsActive = await waitForLeadsPageActive(1500);
        if (!leadsActive) {
          console.log('[FastoAction] Leads page not visible, proceeding with direct update');
        }
        
        // Step 1: Find the lead row and scroll it into view
        const leadRow = document.querySelector(
          `tr:has([data-fasto-lead-id="${targetLeadId}"])`
        ) as HTMLElement;
        
        if (leadRow) {
          await scrollIntoViewIfNeeded(leadRow);
        }
        
        // Step 2: Find and click the "..." menu trigger for this lead
        const menuTrigger = document.querySelector(
          `[data-fasto-action="lead-menu-trigger"][data-fasto-lead-id="${targetLeadId}"]`
        ) as HTMLElement;
        
        if (menuTrigger) {
          console.log('[FastoAction] Found menu trigger, highlighting and clicking...');
          await highlightElement(menuTrigger, 300);
          simulateClick(menuTrigger);
          
          // Step 3: Wait for menu to open (Radix renders in portal at body level)
          // Give it more time since portals can be slow
          await new Promise(resolve => setTimeout(resolve, 250));
          
          // Look for the Edit button in the global DOM (portal renders at body level)
          // Try multiple selectors since the portal might not have lead-id
          let editButton = await waitForElement(
            `[data-fasto-action="edit-lead"][data-fasto-lead-id="${targetLeadId}"]`,
            800
          );
          
          // Fallback: look for any edit-lead action in an open menu
          if (!editButton) {
            editButton = await waitForElement(
              '[data-fasto-menu="lead-actions"] [data-fasto-action="edit-lead"], [role="menu"] [data-fasto-action="edit-lead"]',
              500
            );
          }
          
          // Last fallback: look for any menuitem with Edit text
          if (!editButton) {
            const allMenuItems = document.querySelectorAll('[role="menuitem"]');
            for (const item of allMenuItems) {
              if (item.textContent?.includes('Edit') && (item as HTMLElement).offsetParent !== null) {
                editButton = item as HTMLElement;
                break;
              }
            }
          }
          
          if (editButton) {
            console.log('[FastoAction] Found edit button, highlighting and clicking...');
            await highlightElement(editButton, 300);
            simulateClick(editButton);
            
            // Step 4: Wait for dialog to open
            await new Promise(resolve => setTimeout(resolve, 400));
            
            // Look for the edit dialog
            const editDialog = await waitForElement(
              '[data-fasto-dialog="edit-lead"], [role="dialog"]:has([data-fasto-field="edit-name"])',
              1200
            );
            
            if (editDialog) {
              // Find the name input
              const nameInput = await waitForElement(
                '[data-fasto-field="edit-name"]',
                800
              ) as HTMLInputElement;
              
              if (nameInput) {
                console.log('[FastoAction] Found name input, highlighting and setting value...');
                await highlightElement(nameInput, 250);
                
                // Focus the input
                nameInput.focus();
                nameInput.select();
                
                // Set value using native setter to trigger React state update
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype,
                  'value'
                )?.set;
                
                if (nativeInputValueSetter) {
                  nativeInputValueSetter.call(nameInput, newName);
                } else {
                  nameInput.value = newName;
                }
                
                // Dispatch input event to trigger React onChange
                nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                nameInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Step 5: Click the save button
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const saveButton = await waitForElement(
                  '[data-fasto-action="save-lead"]',
                  800
                );
                
                if (saveButton) {
                  console.log('[FastoAction] Found save button, highlighting and clicking...');
                  await highlightElement(saveButton, 300);
                  simulateClick(saveButton);
                  
                  return { 
                    success: true, 
                    message: `Renamed "${foundLeadName}" to "${newName}"` 
                  };
                } else {
                  console.warn('[FastoAction] Save button not found');
                }
              } else {
                console.warn('[FastoAction] Name input not found');
              }
            } else {
              console.warn('[FastoAction] Edit dialog not found');
            }
          } else {
            console.warn('[FastoAction] Edit button not found in menu');
            // Close the menu if it's open but we couldn't find the button
            document.body.click();
          }
        } else {
          console.warn('[FastoAction] Menu trigger not found for lead:', targetLeadId);
        }
        
        // ===== FALLBACK: Direct DB update =====
        console.log('[FastoAction] UI elements not found, falling back to direct update');
        
        if (handlers.editName) {
          try {
            await handlers.editName(targetLeadId, newName as string);
            return { 
              success: true, 
              message: `Updated lead name to "${newName}" (I couldn't find the on-screen controls, so I updated it directly)` 
            };
          } catch (error) {
            return { 
              success: false, 
              message: error instanceof Error ? error.message : 'Failed to edit lead' 
            };
          }
        }
        
        return { success: false, message: 'Edit handler not available' };
      }
      
      case FASTO_ACTIONS.LEAD_UPDATE_STATUS: {
        const { leadId, newStatus } = action.payload as { leadId: string; newStatus: string };
        
        if (!handlers.updateStatus) {
          return { success: false, message: 'Status update handler not available' };
        }
        
        try {
          await handlers.updateStatus(leadId, newStatus);
          return { success: true, message: `Status updated to "${newStatus}"` };
        } catch (error) {
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to update status' 
          };
        }
      }
      
      case FASTO_ACTIONS.LEAD_DELETE: {
        const { leadId } = action.payload as { leadId: string };
        
        if (!handlers.deleteLead) {
          return { success: false, message: 'Delete handler not available' };
        }
        
        try {
          await handlers.deleteLead(leadId);
          return { success: true, message: 'Lead deleted' };
        } catch (error) {
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to delete lead' 
          };
        }
      }
      
      default:
        // Not a lead action, ignore
        return { success: false, message: 'Unknown action type' };
    }
  }, [handlers]);

  useEffect(() => {
    const unsubscribe = onFastoAction(handleAction);
    return unsubscribe;
  }, [handleAction]);
}
