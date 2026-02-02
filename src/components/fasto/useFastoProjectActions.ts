import { useEffect, useCallback } from 'react';
import { onFastoAction, FastoAction, FastoActionResult, FASTO_ACTIONS, FastoContext } from './fastoActionApi';
import { 
  highlightElement, 
  simulateClick, 
  waitForElement, 
  waitForDialog,
  scrollIntoViewIfNeeded,
  fillInputField,
  delay
} from './FastoVisualAutomation';

/**
 * Project action handlers interface
 */
export interface ProjectActionHandlers {
  editName?: (projectId: string, newName: string) => Promise<void>;
  updateStatus?: (projectId: string, newStatus: string) => Promise<void>;
  deleteProject?: (projectId: string) => Promise<void>;
  findProjectByName?: (name: string) => { id: string; name: string } | null;
}

/**
 * Hook to register Fasto project action handlers
 */
export function useFastoProjectActions(handlers: ProjectActionHandlers): void {
  const handleAction = useCallback(async (action: FastoAction): Promise<FastoActionResult> => {
    console.log('[FastoProjectActions] Received action:', action.type, action.payload);
    
    switch (action.type) {
      case FASTO_ACTIONS.PROJECT_EDIT_NAME: {
        const { projectName, newName, projectId: payloadId } = action.payload as { 
          projectName?: string; 
          newName: string; 
          projectId?: string;
        };
        
        let targetProjectId = payloadId as string | undefined;
        let foundProjectName = projectName;
        
        if (!targetProjectId && projectName && handlers.findProjectByName) {
          const found = handlers.findProjectByName(projectName);
          if (found) {
            targetProjectId = found.id;
            foundProjectName = found.name;
          }
        }
        
        if (!targetProjectId) {
          targetProjectId = FastoContext.getLastProjectId() || undefined;
        }
        
        if (!targetProjectId) {
          return { success: false, message: `Could not find project "${projectName}"` };
        }
        
        // Try visual UI automation first
        console.log('[FastoProjectActions] Starting agentic UI edit for project:', targetProjectId);
        
        // Step 1: Find and click the menu trigger
        const menuTrigger = document.querySelector(
          `[data-fasto-action="project-menu-trigger"][data-fasto-project-id="${targetProjectId}"]`
        ) as HTMLElement;
        
        if (menuTrigger) {
          await scrollIntoViewIfNeeded(menuTrigger);
          await highlightElement(menuTrigger, 300);
          simulateClick(menuTrigger);
          
          await delay(250);
          
          let editButton = await waitForElement(
            `[data-fasto-action="edit-project"][data-fasto-project-id="${targetProjectId}"]`,
            800
          );
          
          if (!editButton) {
            editButton = await waitForElement('[role="menu"] [data-fasto-action="edit-project"]', 500);
          }
          
          if (editButton) {
            await highlightElement(editButton, 300);
            simulateClick(editButton);
            
            await waitForDialog('edit-project', 1200);
            
            const success = await fillInputField('[data-fasto-field="project-name"]', newName);
            
            if (success) {
              await delay(300);
              const saveButton = await waitForElement('[data-fasto-action="save-project"]', 800);
              
              if (saveButton) {
                await highlightElement(saveButton, 300);
                simulateClick(saveButton);
                
                FastoContext.setLastProjectId(targetProjectId);
                return { 
                  success: true, 
                  message: `Renamed "${foundProjectName}" to "${newName}"` 
                };
              }
            }
          }
        }
        
        // Fallback to direct handler
        if (handlers.editName) {
          try {
            await handlers.editName(targetProjectId, newName);
            FastoContext.setLastProjectId(targetProjectId);
            return { 
              success: true, 
              message: `Updated project name to "${newName}"` 
            };
          } catch (error) {
            return { 
              success: false, 
              message: error instanceof Error ? error.message : 'Failed to edit project' 
            };
          }
        }
        
        return { success: false, message: 'Edit handler not available' };
      }
      
      case FASTO_ACTIONS.PROJECT_UPDATE_STATUS: {
        const { projectId, newStatus } = action.payload as { projectId: string; newStatus: string };
        
        if (!handlers.updateStatus) {
          return { success: false, message: 'Status update handler not available' };
        }
        
        try {
          await handlers.updateStatus(projectId, newStatus);
          FastoContext.setLastProjectId(projectId);
          return { success: true, message: `Status updated to "${newStatus}"` };
        } catch (error) {
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to update status' 
          };
        }
      }
      
      case FASTO_ACTIONS.PROJECT_DELETE: {
        const { projectId } = action.payload as { projectId: string };
        
        if (!handlers.deleteProject) {
          return { success: false, message: 'Delete handler not available' };
        }
        
        try {
          await handlers.deleteProject(projectId);
          return { success: true, message: 'Project deleted' };
        } catch (error) {
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to delete project' 
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
