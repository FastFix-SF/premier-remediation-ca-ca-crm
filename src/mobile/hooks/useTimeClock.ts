import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { offlineQueue } from '@/lib/offline-queue';
import { isPreviousDayPacific, getEndOfDayPacific, getTodayStartPacific } from '@/utils/timezone';
import { useSmartGeolocation } from './useSmartGeolocation';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface TimeClockEntry {
  id: string;
  user_id: string;
  employee_name: string;
  employee_role?: string;
  project_name?: string;
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
  break_time_minutes?: number;
  break_start_time?: string;
  break_location?: string;
  overtime_hours?: number;
  status: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

// Helper function for retry with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`[TimeClock] Attempt ${attempt + 1}/${retries} failed:`, error);
      if (attempt === retries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
    }
  }
  throw new Error('All retry attempts failed');
};

export const useTimeClock = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use smart geolocation hook for better permission handling
  const {
    location: geoLocation,
    error: geoError,
    permissionState,
    loading: geoLoading,
    requestPermission,
    openSettings,
    refresh: refreshLocation,
    canRequestAgain,
  } = useSmartGeolocation();
  
  // Map the smart geolocation to the expected format
  const currentLocation: Location | null = geoLocation;
  const locationError: string | null = geoError;
  
  const [isClocked, setIsClocked] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [todayHours, setTodayHours] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeClockEntry | null>(null);
  const [previousDayEntry, setPreviousDayEntry] = useState<TimeClockEntry | null>(null);
  const [needsShiftRequest, setNeedsShiftRequest] = useState(false);

  // Load current status and hours when user is available
  // Clear any stale time clock queue items (offline sync no longer used for time clock)
  useEffect(() => {
    if (user) {
      loadCurrentStatus();
      loadTodayHours();
      // Clear stale time clock queue items since we no longer use offline sync
      offlineQueue.clearTimeClockQueue();
    }
  }, [user]);


  const loadCurrentStatus = async () => {
    if (!user) return;

    try {
      const todayStart = getTodayStartPacific();
      
      // First, check for active entries from TODAY
      const { data: todayData, error: todayError } = await supabase
        .from('time_clock')
        .select('*')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .in('status', ['active', 'on_break'])
        .gte('clock_in', todayStart)
        .order('clock_in', { ascending: false })
        .limit(1);

      if (todayError) {
        console.error('Error loading today status:', todayError);
        return;
      }

      if (todayData && todayData.length > 0) {
        const entry = todayData[0];
        console.log('[TimeClock] Found active entry today:', entry.id, 'status:', entry.status);
        setCurrentEntry(entry);
        setIsClocked(true);
        setIsOnBreak(entry.status === 'on_break');
        setPreviousDayEntry(null);
        return;
      }

      // No active entry today, check for unclosed entries from PREVIOUS days
      const { data: oldData, error: oldError } = await supabase
        .from('time_clock')
        .select('*')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .in('status', ['active', 'on_break'])
        .lt('clock_in', todayStart)
        .order('clock_in', { ascending: false })
        .limit(1);

      if (oldError) {
        console.error('Error loading previous day entries:', oldError);
        return;
      }

      if (oldData && oldData.length > 0) {
        const oldEntry = oldData[0];
        console.log('[TimeClock] Found unclosed entry from previous day:', oldEntry.id);
        setPreviousDayEntry(oldEntry);
        setIsClocked(false);
        setIsOnBreak(false);
        setCurrentEntry(null);
      } else {
        console.log('[TimeClock] No active entry found for user');
        setIsClocked(false);
        setIsOnBreak(false);
        setCurrentEntry(null);
        setPreviousDayEntry(null);
      }

      // Check if user needs to submit a shift request (from localStorage)
      const needsRequest = localStorage.getItem('needs-shift-request') === 'true';
      setNeedsShiftRequest(needsRequest);
    } catch (error) {
      console.error('Error loading current status:', error);
    }
  };

  const loadTodayHours = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('time_clock')
        .select('total_hours')
        .eq('user_id', user.id)
        .gte('clock_in', `${today}T00:00:00.000Z`)
        .lt('clock_in', `${today}T23:59:59.999Z`);

      if (error) {
        console.error('Error loading hours:', error);
        return;
      }

      const totalHours = data?.reduce((sum, entry) => sum + (entry.total_hours || 0), 0) || 0;
      setTodayHours(totalHours);
    } catch (error) {
      console.error('Error loading today hours:', error);
    }
  };

  const clockIn = async (projectId?: string, projectName?: string) => {
    if (!user || !currentLocation) {
      toast({
        title: "Error",
        description: "Location is required to clock in",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const locationString = `${currentLocation.latitude},${currentLocation.longitude}`;

      let employeeName = 'Unknown';
      
      const { data: teamMember } = await supabase
        .from('team_directory')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (teamMember?.full_name) {
        employeeName = teamMember.full_name;
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile?.display_name) {
          employeeName = profile.display_name;
        } else if (user.email) {
          employeeName = user.email;
        }
      }

      const { data, error } = await supabase
        .from('time_clock')
        .insert({
          user_id: user.id,
          employee_name: employeeName,
          clock_in: now.toISOString(),
          status: 'active',
          location: locationString,
          job_id: projectId,
          project_name: projectName,
        })
        .select();

      if (error) {
        console.error('Clock in error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from clock in');
      }

      const entry = data[0];
      setCurrentEntry(entry);
      setIsClocked(true);
      
      toast({
        title: "Clocked In",
        description: projectName 
          ? `Successfully clocked in to ${projectName} at ${now.toLocaleTimeString()}`
          : `Successfully clocked in at ${now.toLocaleTimeString()}`,
      });

      await loadTodayHours();
    } catch (error) {
      console.error('Clock in error:', error);
      toast({
        title: "Clock In Failed",
        description: error instanceof Error ? error.message : "Unable to clock in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clockOut = async () => {
    if (!currentEntry) {
      console.error('[TimeClock] clockOut called but currentEntry is null');
      toast({
        title: "Error",
        description: "No active clock-in session found",
        variant: "destructive",
      });
      return null;
    }

    const entryId = currentEntry.id;
    const clockInTime = new Date(currentEntry.clock_in);
    const clockOutTime = new Date();
    // Subtract break time from total hours
    const breakMinutes = currentEntry.break_time_minutes || 0;
    const rawHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
    const totalHours = Math.max(0, rawHours - (breakMinutes / 60));
    const clockOutTimeStr = clockOutTime.toISOString();

    console.log('[TimeClock] Starting clock out:', { entryId, clockOutTime: clockOutTimeStr, totalHours, breakMinutes });

    // Store entry data before clearing
    const completedEntryData = {
      id: entryId,
      clock_in: currentEntry.clock_in,
      clock_out: clockOutTimeStr,
      clock_in_location: currentEntry.location || null,
      clock_out_location: currentLocation ? `${currentLocation.latitude},${currentLocation.longitude}` : null,
      break_location: currentEntry.break_location || null,
      break_time_minutes: breakMinutes,
      total_hours: totalHours,
      project_name: currentEntry.project_name || null,
      notes: currentEntry.notes || null,
    };

    setLoading(true);
    
    // Optimistically update UI immediately
    setIsClocked(false);
    setIsOnBreak(false);
    setCurrentEntry(null);

    try {
      // Try with retry logic
      await retryWithBackoff(async () => {
        const { error } = await supabase
          .from('time_clock')
          .update({
            clock_out: clockOutTimeStr,
            clock_out_location: completedEntryData.clock_out_location,
            total_hours: totalHours,
            status: 'completed',
          })
          .eq('id', entryId);

        if (error) {
          console.error('[TimeClock] Database update error:', error);
          throw error;
        }
      });

      console.log('[TimeClock] Clock out successful');

      await loadTodayHours();
      
      // Return the completed entry data for the confirmation modal
      return completedEntryData;
    } catch (error) {
      console.error('[TimeClock] Clock out failed:', error);
      
      // Revert optimistic update
      setIsClocked(true);
      setCurrentEntry({ id: entryId } as any);
      
      toast({
        title: "Clock Out Failed",
        description: "Unable to clock out. Please check your internet connection and try again.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startBreak = async () => {
    if (!currentEntry) return;

    setLoading(true);
    try {
      const breakLocationString = currentLocation
        ? `${currentLocation.latitude},${currentLocation.longitude}`
        : null;
      const breakStartTime = new Date().toISOString();

      console.log('[TimeClock] startBreak -> saving break_start_time:', breakStartTime);

      // Direct update without retry wrapper for reliability
      const { data, error } = await supabase
        .from('time_clock')
        .update({
          status: 'on_break',
          break_location: breakLocationString,
          break_start_time: breakStartTime,
        })
        .eq('id', currentEntry.id)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('[TimeClock] startBreak database error:', error);
        throw error;
      }

      console.log('[TimeClock] startBreak <- saved successfully, break_start_time:', data.break_start_time);

      // Verify the update worked
      if (!data.break_start_time) {
        console.error('[TimeClock] startBreak: break_start_time not saved!');
        throw new Error('Failed to save break start time');
      }

      setIsOnBreak(true);
      setCurrentEntry(data as any);

      toast({
        title: "Break Started",
        description: "You are now on break",
      });
    } catch (error) {
      console.error('[TimeClock] Start break error:', error);
      setIsOnBreak(false);

      toast({
        title: "Break Failed",
        description: "Unable to start break. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const endBreak = async () => {
    if (!currentEntry) return;

    setLoading(true);
    try {
      // Get fresh entry from database
      const { data: freshEntry, error: fetchError } = await supabase
        .from('time_clock')
        .select('break_start_time, break_time_minutes')
        .eq('id', currentEntry.id)
        .maybeSingle();

      if (fetchError) {
        console.error('[TimeClock] endBreak fetch error:', fetchError);
        throw fetchError;
      }

      const breakStartTime = freshEntry?.break_start_time;
      
      if (!breakStartTime) {
        console.error('[TimeClock] No break_start_time in database!');
        throw new Error('Break start time not found');
      }

      // Simple calculation: end time - start time
      const breakStart = new Date(breakStartTime);
      const breakEnd = new Date();
      const durationMs = breakEnd.getTime() - breakStart.getTime();
      const durationMinutes = Math.max(1, Math.ceil(durationMs / 60000)); // At least 1 minute

      const existingBreakMinutes = freshEntry?.break_time_minutes || 0;
      const totalBreakMinutes = existingBreakMinutes + durationMinutes;

      console.log('[TimeClock] endBreak calculation:', {
        breakStart: breakStartTime,
        breakEnd: breakEnd.toISOString(),
        durationMinutes,
        totalBreakMinutes
      });

      // Update database - direct call without retry
      const { data, error } = await supabase
        .from('time_clock')
        .update({
          status: 'active',
          break_time_minutes: totalBreakMinutes,
          break_start_time: null, // Clear for next break
        })
        .eq('id', currentEntry.id)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('[TimeClock] endBreak update error:', error);
        throw error;
      }

      console.log('[TimeClock] endBreak saved:', data.break_time_minutes, 'minutes');

      setIsOnBreak(false);
      setCurrentEntry(data as any);

      toast({
        title: "Break Ended",
        description: `Break was ${totalBreakMinutes} minutes`,
      });
    } catch (error) {
      console.error('[TimeClock] End break error:', error);

      toast({
        title: "End Break Failed",
        description: "Unable to end break. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = () => {
    loadCurrentStatus();
  };

  const refreshHours = () => {
    loadTodayHours();
  };

  // Clock out a previous day entry (set clock_out to 11:59 PM of that day)
  const clockOutPreviousDay = async () => {
    if (!previousDayEntry) {
      console.error('[TimeClock] No previous day entry to clock out');
      return;
    }

    setLoading(true);
    try {
      const clockInDate = new Date(previousDayEntry.clock_in);
      const clockOutTime = getEndOfDayPacific(clockInDate);
      const totalHours = (clockOutTime.getTime() - clockInDate.getTime()) / (1000 * 60 * 60);

      const { error } = await supabase
        .from('time_clock')
        .update({
          clock_out: clockOutTime.toISOString(),
          total_hours: totalHours,
          status: 'completed',
          notes: (previousDayEntry.notes || '') + ' [Late clock-out: forgot to clock out]',
        })
        .eq('id', previousDayEntry.id);

      if (error) throw error;

      console.log('[TimeClock] Closed previous day entry:', previousDayEntry.id);
      
      // Set flag that user needs to submit a shift request
      localStorage.setItem('needs-shift-request', 'true');
      setNeedsShiftRequest(true);
      
      toast({
        title: "Previous Shift Closed",
        description: `Your shift from ${clockInDate.toLocaleDateString()} has been closed. Please submit a shift request to correct the hours.`,
      });

      setPreviousDayEntry(null);
      await loadTodayHours();
    } catch (error) {
      console.error('[TimeClock] Error closing previous day entry:', error);
      toast({
        title: "Error",
        description: "Failed to close previous shift. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear the needs shift request flag (called after submitting a request)
  const clearShiftRequestFlag = () => {
    localStorage.removeItem('needs-shift-request');
    setNeedsShiftRequest(false);
  };

  return {
    currentLocation,
    locationError,
    isClocked,
    isOnBreak,
    todayHours,
    loading,
    currentEntry,
    previousDayEntry,
    needsShiftRequest,
    clockIn,
    clockOut,
    clockOutPreviousDay,
    startBreak,
    endBreak,
    refreshStatus,
    refreshHours,
    clearShiftRequestFlag,
    // New permission-related exports
    permissionState,
    canRequestAgain,
    requestPermission,
    openSettings,
    refreshLocation,
  };
};
