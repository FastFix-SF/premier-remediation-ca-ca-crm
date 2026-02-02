import { useState, useEffect, useCallback } from 'react';

export interface ActivityLogEntry {
  id: string;
  action_type: 'roi_saved' | 'measurements_run' | 'imagery_selected' | 'auto_outline' | 'converted_to_project' | 'error' | 'system';
  action_description: string;
  metadata?: any;
  created_at: string;
}

export const useActivityLog = (quoteRequestId?: string) => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Simple in-memory activity logging for now
  const fetchActivities = useCallback(async () => {
    // No-op for now - activities are stored in memory
    setLoading(false);
  }, []);

  // Log a new activity
  const logActivity = useCallback(async (
    actionType: ActivityLogEntry['action_type'],
    description: string,
    metadata?: any
  ) => {
    const newActivity: ActivityLogEntry = {
      id: Date.now().toString(),
      action_type: actionType,
      action_description: description,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };
    
    setActivities(prev => [newActivity, ...prev.slice(0, 49)]);
  }, []);

  // Convenience methods for common actions
  const logROISaved = useCallback((roi: any) => {
    logActivity('roi_saved', 'ROI area saved and updated', { roi });
  }, [logActivity]);

  const logMeasurementsRun = useCallback((success: boolean, method?: string) => {
    logActivity('measurements_run', 
      success ? 'Roof measurements completed successfully' : 'Roof measurements failed',
      { success, method }
    );
  }, [logActivity]);

  const logImagerySelected = useCallback((imagery: any) => {
    logActivity('imagery_selected', `Imagery selected: ${imagery.provider || 'unknown'}`, { imagery });
  }, [logActivity]);

  const logAutoOutline = useCallback((success: boolean, structureCount?: number) => {
    logActivity('auto_outline',
      success 
        ? `Auto-outline completed${structureCount ? ` (${structureCount} structures detected)` : ''}`
        : 'Auto-outline failed',
      { success, structureCount }
    );
  }, [logActivity]);

  const logConvertedToProject = useCallback((projectId: string) => {
    logActivity('converted_to_project', 'Quote request converted to project', { projectId });
  }, [logActivity]);

  const logError = useCallback((error: string, context?: any) => {
    logActivity('error', `Error: ${error}`, { error, context });
  }, [logActivity]);

  const logSystem = useCallback((message: string, metadata?: any) => {
    logActivity('system', message, metadata);
  }, [logActivity]);

  return {
    activities,
    loading,
    fetchActivities,
    logActivity,
    logROISaved,
    logMeasurementsRun,
    logImagerySelected,
    logAutoOutline,
    logConvertedToProject,
    logError,
    logSystem
  };
};

export default useActivityLog;