import React, { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import mapboxgl, { Map } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Clock, Coffee, Calendar, FileText, ArrowLeft, AlertTriangle, MapPin, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTimeClock } from '@/mobile/hooks/useTimeClock';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { ProjectSelectionModal } from '@/mobile/components/ProjectSelectionModal';
import { ShiftConfirmationModal } from '@/mobile/components/ShiftConfirmationModal';
import { CrewVerificationModal } from '@/mobile/components/CrewVerificationModal';
import { notifyProjectAccessRequest } from '@/utils/sendSmsNotification';
import { useTeamMember } from '@/hooks/useTeamMember';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { formatTimePacific, formatDateTimePacific, getTodayDateStringPacific, getDateStringPacific } from '@/utils/timezone';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface CompletedShiftData {
  id: string;
  clock_in: string;
  clock_out: string;
  clock_in_location: string | null;
  clock_out_location: string | null;
  break_location: string | null;
  break_time_minutes: number;
  total_hours: number | null;
  project_name: string | null;
  notes: string | null;
}
export const TimeClockTab: React.FC = () => {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    user
  } = useAuth();
  const {
    t
  } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isClocked,
    isOnBreak,
    todayHours,
    currentLocation,
    currentEntry,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    loading,
    locationError,
    refreshHours,
    previousDayEntry,
    needsShiftRequest,
    clockOutPreviousDay,
    clearShiftRequestFlag,
    // New permission-related
    permissionState,
    canRequestAgain,
    requestPermission,
    openSettings,
    refreshLocation
  } = useTimeClock();

  // If we return from the shift edit request page, re-open the confirmation modal.
  useEffect(() => {
    const state = location.state as any;
    if (state?.reopenShiftConfirmation && state?.shiftData) {
      setCompletedShiftData(state.shiftData as CompletedShiftData);
      setShowShiftConfirmation(true);

      // Clear state so refreshes/back don't keep re-opening the modal.
      navigate(location.pathname + location.search, {
        replace: true,
        state: null
      });
    }
  }, [location.state, location.pathname, location.search, navigate]);
  const [elapsedTime, setElapsedTime] = useState('0:00:00');
  const [overtimeReminderSent, setOvertimeReminderSent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [timesheetEntries, setTimesheetEntries] = useState<any[]>([]);
  const [pendingShiftRequests, setPendingShiftRequests] = useState<any[]>([]);
  const [weeklyTimesheet, setWeeklyTimesheet] = useState<{
    date: string;
    dayName: string;
    totalHours: number;
    entries: any[];
    hasPending: boolean;
  }[]>([]);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [addressCache, setAddressCache] = useState<Record<string, string>>({});
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showShiftConfirmation, setShowShiftConfirmation] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState<{
    date: string;
    dayName: string;
    entries: any[];
    hasPending: boolean;
  } | null>(null);
  const [completedShiftData, setCompletedShiftData] = useState<CompletedShiftData | null>(null);
  const [showCrewVerification, setShowCrewVerification] = useState(false);
  const [crewVerificationData, setCrewVerificationData] = useState<{
    projectId: string;
    projectName: string;
    clockIn: string;
    clockOut: string;
  } | null>(null);

  // Check if current user is a leader
  const { data: adminStatus } = useAdminStatus();
  const isLeader = adminStatus?.isLeader || false;

  // Fetch today's assigned jobs
  const {
    data: todayJobs = []
  } = useQuery({
    queryKey: ['today-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const today = new Date();
      const {
        data,
        error
      } = await supabase.from('job_schedules').select('id, title, start_time, project_id, assigned_users').gte('start_time', startOfDay(today).toISOString()).lte('start_time', endOfDay(today).toISOString()).order('start_time');
      if (error) throw error;
      // Filter to only jobs where current user is assigned
      return (data || []).filter((job: any) => {
        const assigned = job.assigned_users || [];
        return assigned.some((u: any) => u.id === user.id || u === user.id);
      });
    },
    enabled: !!user?.id
  });

  // Live timer that updates every second when clocked in
  useEffect(() => {
    if (!isClocked || !currentEntry) {
      setElapsedTime('0:00:00');
      setOvertimeReminderSent(false); // Reset when not clocked in
      return;
    }
    const NINE_HOURS_IN_SECONDS = 9 * 60 * 60; // 32400 seconds

    const updateTimer = async () => {
      const clockInTime = new Date(currentEntry.clock_in).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - clockInTime) / 1000); // seconds

      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor(elapsed % 3600 / 60);
      const seconds = elapsed % 60;
      setElapsedTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

      // Check if 9 hours reached and reminder not yet sent
      if (elapsed >= NINE_HOURS_IN_SECONDS && !overtimeReminderSent && user) {
        setOvertimeReminderSent(true);

        // Send SMS notification
        try {
          console.log('⏰ 9 hours reached, sending overtime reminder SMS');
          await supabase.functions.invoke('send-sms-notification', {
            body: {
              userId: user.id,
              title: 'Long Shift Reminder',
              body: "You've been clocked in for 9 hours. Are you still working or did you forget to clock out?",
              data: {
                type: 'overtime_reminder'
              }
            }
          });
          console.log('✅ Overtime reminder SMS sent');
        } catch (error) {
          console.error('Failed to send overtime reminder SMS:', error);
        }
      }
    };
    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isClocked, currentEntry, overtimeReminderSent, user]);

  // User role check removed - safety checklist no longer required

  useEffect(() => {
    setMounted(true);
    if (user) {
      loadTimesheetEntries();

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadTimesheetEntries();
        refreshHours();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, refreshHours]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || !currentLocation) return;
    let map: mapboxgl.Map | null = null;
    const initMap = async () => {
      try {
        // Get Mapbox token from edge function (same as RoiSelector)
        const {
          data: cfg,
          error: cfgErr
        } = await supabase.functions.invoke("map-config");
        if (cfgErr) {
          console.error("map-config error", cfgErr);
          return;
        }
        if (cfg?.mapboxPublicToken) {
          (mapboxgl as any).accessToken = cfg.mapboxPublicToken;
        } else {
          console.warn("No Mapbox token available");
          return;
        }
        if (!containerRef.current) return;
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [currentLocation.longitude, currentLocation.latitude],
          zoom: 16,
          attributionControl: false,
          dragPan: true,
          scrollZoom: true,
          boxZoom: true,
          dragRotate: true,
          keyboard: true,
          doubleClickZoom: true,
          touchZoomRotate: true
        });
        mapRef.current = map;
        map.on('load', () => {
          if (!map) return;

          // Add user location marker
          new mapboxgl.Marker({
            color: '#3B82F6',
            scale: 1.2
          }).setLngLat([currentLocation.longitude, currentLocation.latitude]).addTo(map);

          // Add navigation controls
          map.addControl(new mapboxgl.NavigationControl({
            visualizePitch: false
          }), 'top-right');
        });
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    };
    initMap();
    return () => {
      if (mapRef.current && mapRef.current.getContainer()) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
        } catch (error) {
          console.warn('Error removing map:', error);
        }
      }
    };
  }, [currentLocation]);
  const loadTimesheetEntries = async () => {
    if (!user) return;
    try {
      const PACIFIC_TZ = 'America/Los_Angeles';
      const getPacificOffsetString = (date: Date): string => {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: PACIFIC_TZ,
          timeZoneName: 'longOffset'
        });
        const parts = formatter.formatToParts(date);
        const offsetPart = parts.find(p => p.type === 'timeZoneName');
        const match = offsetPart?.value?.match(/GMT([+-]\d{2}:\d{2})/);
        return match?.[1] ?? '-08:00';
      };
      const todayStr = getTodayDateStringPacific();
      // Build Pacific day boundaries in UTC ISO for accurate DB query
      const offset = getPacificOffsetString(new Date(`${todayStr}T12:00:00Z`));
      const startISO = new Date(`${todayStr}T00:00:00${offset}`).toISOString();
      const endISO = new Date(`${todayStr}T23:59:59${offset}`).toISOString();
      const [entriesResult, requestsResult] = await Promise.all([supabase.from('time_clock').select('*').eq('user_id', user.id).gte('clock_in', startISO).lte('clock_in', endISO).order('clock_in', {
        ascending: false
      }), supabase.from('employee_requests').select('*').eq('user_id', user.id).eq('request_type', 'shift').eq('status', 'pending').gte('shift_start_date', todayStr)]);
      if (entriesResult.error) {
        console.error('Error loading timesheet entries:', entriesResult.error);
        return;
      }
      setTimesheetEntries(entriesResult.data || []);
      setPendingShiftRequests(requestsResult.data || []);
    } catch (error) {
      console.error('Error loading timesheet entries:', error);
    }
  };
  const loadWeeklyTimesheet = async (offset: number = 0) => {
    if (!user) return;
    try {
      const PACIFIC_TZ = 'America/Los_Angeles';
      const getPacificOffsetString = (date: Date): string => {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: PACIFIC_TZ,
          timeZoneName: 'longOffset'
        });
        const parts = formatter.formatToParts(date);
        const offsetPart = parts.find(p => p.type === 'timeZoneName');
        const match = offsetPart?.value?.match(/GMT([+-]\d{2}:\d{2})/);
        return match?.[1] ?? '-08:00';
      };

      // Get "now" in Pacific Time
      const pacificNow = new Date(new Date().toLocaleString('en-US', {
        timeZone: PACIFIC_TZ
      }));
      const dayOfWeek = pacificNow.getDay();
      // If today is Sunday (0), go back 6 days. Otherwise go back (dayOfWeek - 1) days
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startOfWeek = new Date(pacificNow);
      startOfWeek.setDate(pacificNow.getDate() - daysToMonday + (offset * 7));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Use Pacific date strings for request matching + weekly UI
      const startDate = getDateStringPacific(startOfWeek);
      const endDate = getDateStringPacific(endOfWeek);

      // Build Pacific week boundaries in UTC ISO for accurate DB query
      const startOffset = getPacificOffsetString(new Date(`${startDate}T12:00:00Z`));
      const endOffset = getPacificOffsetString(new Date(`${endDate}T12:00:00Z`));
      const startISO = new Date(`${startDate}T00:00:00${startOffset}`).toISOString();
      const endISO = new Date(`${endDate}T23:59:59${endOffset}`).toISOString();
      const [entriesResult, requestsResult] = await Promise.all([supabase.from('time_clock').select('*').eq('user_id', user.id).gte('clock_in', startISO).lte('clock_in', endISO).order('clock_in', {
        ascending: true
      }), supabase.from('employee_requests').select('*').eq('user_id', user.id).eq('request_type', 'shift').eq('status', 'pending').gte('shift_start_date', startDate).lte('shift_start_date', endDate)]);
      if (entriesResult.error) {
        console.error('Error loading weekly timesheet:', entriesResult.error);
        return;
      }
      const entries = entriesResult.data || [];
      const pendingReqs = requestsResult.data || [];
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      // Build weekly data (all Pacific)
      const weekData = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = getDateStringPacific(date);
        const dayEntries = entries.filter(e => {
          const entryDateStr = getDateStringPacific(e.clock_in);
          return entryDateStr === dateStr;
        });
        const totalHours = dayEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
        const hasPending = pendingReqs.some(req => req.shift_start_date === dateStr);
        weekData.push({
          date: dateStr,
          dayName: dayNames[i],
          totalHours,
          entries: dayEntries,
          hasPending
        });
      }
      setWeeklyTimesheet(weekData);
    } catch (error) {
      console.error('Error loading weekly timesheet:', error);
    }
  };
  useEffect(() => {
    loadWeeklyTimesheet(weekOffset);
  }, [user, weekOffset]);
  const handleClockAction = async () => {
    if (isOnBreak) {
      await endBreak();
    } else if (isClocked) {
      // Show modal INSTANTLY using current entry data before clock out
      if (currentEntry) {
        const clockOutTime = new Date().toISOString();
        const clockInTime = new Date(currentEntry.clock_in).getTime();
        const clockOutTimeMs = new Date(clockOutTime).getTime();
        const breakMinutes = currentEntry.break_time_minutes || 0;
        const totalHours = (clockOutTimeMs - clockInTime) / 1000 / 60 / 60 - breakMinutes / 60;
        
        const shiftData: CompletedShiftData = {
          id: currentEntry.id,
          clock_in: currentEntry.clock_in,
          clock_out: clockOutTime,
          clock_in_location: currentEntry.location || null,
          clock_out_location: currentLocation ? `${currentLocation.latitude},${currentLocation.longitude}` : null,
          break_location: (currentEntry as any).break_location || null,
          break_time_minutes: breakMinutes,
          total_hours: totalHours,
          project_name: currentEntry.project_name || null,
          notes: currentEntry.notes || null
        };
        
        setCompletedShiftData(shiftData);

        // If user is a leader AND was clocked into a project, show crew verification first
        // Access job_id from the database entry (it exists in time_clock table but not in the interface)
        const jobId = (currentEntry as any).job_id;
        if (isLeader && jobId) {
          setCrewVerificationData({
            projectId: jobId,
            projectName: currentEntry.project_name || 'Unknown Project',
            clockIn: currentEntry.clock_in,
            clockOut: clockOutTime
          });
          setShowCrewVerification(true);
        } else {
          // Non-leaders or no project: show regular shift confirmation
          setShowShiftConfirmation(true);
        }
      }

      // Clock out in background
      clockOut();
      // Clear any old safety checklist data (backwards compatibility)
      localStorage.removeItem('safety-checklist-progress');
      localStorage.removeItem('safety-checklist-completed');
    } else {
      // Go straight to project selection for ALL users
      setShowProjectModal(true);
      return;
    }
    // Refresh timesheet and hours after any clock action
    await loadTimesheetEntries();
    refreshHours();
  };

  const handleCrewVerificationComplete = () => {
    setShowCrewVerification(false);
    setCrewVerificationData(null);
    // After crew verification, show shift confirmation for the leader's own shift
    setShowShiftConfirmation(true);
  };

  const handleCrewVerificationClose = () => {
    setShowCrewVerification(false);
    setCrewVerificationData(null);
    // Skip crew verification, go straight to shift confirmation
    setShowShiftConfirmation(true);
  };

  const handleShiftConfirm = () => {
    setShowShiftConfirmation(false);
    setCompletedShiftData(null);
  };
  const handleShiftEdit = () => {
    setShowShiftConfirmation(false);

    // Navigate to shift edit request page with pre-filled data.
    // We also pass a returnTo + shiftData via navigation state so the back arrow can
    // return to the Shift details modal (not the time clock screen).
    if (completedShiftData) {
      const params = new URLSearchParams({
        clockIn: completedShiftData.clock_in,
        clockOut: completedShiftData.clock_out,
        breakMinutes: completedShiftData.break_time_minutes.toString(),
        jobName: completedShiftData.project_name || '',
        entryId: completedShiftData.id
      });
      navigate(`/mobile/requests/shift?${params.toString()}`, {
        state: {
          returnTo: location.pathname + location.search,
          shiftData: completedShiftData
        }
      });
    } else {
      navigate('/mobile/requests/shift', {
        state: {
          returnTo: location.pathname + location.search
        }
      });
    }
  };
  const { getCurrentUserDisplayName } = useTeamMember();
  
  const handleProjectSelection = async (projectId: string, projectName: string, projectAddress?: string) => {
    // Check if user is assigned to this project
    const { data: assignment } = await supabase
      .from('project_team_assignments')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user?.id)
      .maybeSingle();

    // If NOT assigned, notify admins
    if (!assignment) {
      const employeeName = getCurrentUserDisplayName();
      await notifyProjectAccessRequest(employeeName, projectName, projectAddress);
      toast.info('Admins have been notified to add you to this project');
    }

    // Proceed with clock-in regardless
    await clockIn(projectId, projectName);
    await loadTimesheetEntries();
    refreshHours();
  };
  const handleBreakAction = async () => {
    if (isOnBreak) {
      await endBreak();
    } else {
      await startBreak();
    }
    // Refresh timesheet and hours after break action
    await loadTimesheetEntries();
    refreshHours();
  };
  const getMainButtonText = () => {
    if (isOnBreak) return t('timeClock.endBreak');
    if (isClocked) return t('timeClock.clockOut');
    return t('timeClock.clockIn');
  };
  const getMainButtonColor = () => {
    if (isOnBreak) return 'bg-orange-500 hover:bg-orange-600';
    if (isClocked) return 'bg-red-500 hover:bg-red-600';
    return 'bg-blue-500 hover:bg-blue-600';
  };
  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
  };
  const getAddressFromLocation = useCallback(async (location: string): Promise<string> => {
    // Check if already cached
    if (addressCache[location]) {
      return addressCache[location];
    }
    try {
      // Parse coordinates from location string
      const coords = location.split(',').map(s => parseFloat(s.trim()));
      if (coords.length !== 2 || coords.some(isNaN)) {
        return location; // Return original if not valid coordinates
      }
      const [latitude, longitude] = coords;
      const {
        data,
        error
      } = await supabase.functions.invoke('reverse-geocode', {
        body: {
          latitude,
          longitude
        }
      });
      if (error || !data?.address) {
        console.error('Reverse geocode error:', error);
        return location; // Return coordinates if geocoding fails
      }

      // Cache the result
      const address = data.address;
      setAddressCache(prev => ({
        ...prev,
        [location]: address
      }));
      return address;
    } catch (error) {
      console.error('Error getting address:', error);
      return location; // Return coordinates if error
    }
  }, [addressCache]);
  if (locationError) {
    return <div className="flex-1 flex flex-col bg-background">
        {/* Header with back button */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="p-2 h-8 w-8" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5 text-blue-500" />
          </Button>
        <div className="text-center">
            <p className="text-sm text-gray-600">{t('timeClock.totalWorkHoursToday')}</p>
            <p className="text-lg font-semibold text-gray-900">0:00</p>
          </div>
          <div className="w-8" />
        </div>

        {/* Location Error Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <h3 className="text-lg font-semibold mb-2">{t('timeClock.locationRequired')}</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {locationError}
              </p>
              
              {/* Different UI based on permission state */}
              {canRequestAgain ?
            // Native app - can request permission again (denied once, not permanently)
            <Button onClick={requestPermission} className="w-full bg-primary hover:bg-primary/90">
                  <MapPin className="w-4 h-4 mr-2" />
                  {t('timeClock.requestPermissionAgain')}
                </Button> : permissionState === 'denied-always' ?
            // Permanently denied - show settings instructions
            <div className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-left text-sm">
                    <p className="font-medium mb-2">{t('timeClock.howToEnableLocation')}</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>{t('timeClock.locationStep1')}</li>
                      <li>{t('timeClock.locationStep2')}</li>
                      <li>{t('timeClock.locationStep3')}</li>
                    </ol>
                  </div>
                  <Button onClick={async () => {
                await openSettings();
                // After opening settings, refresh to check if permission was granted
                setTimeout(() => refreshLocation(), 1000);
              }} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    {t('timeClock.openSettingsAndRetry')}
                  </Button>
                </div> :
            // Other errors (timeout, unavailable, etc.)
            <Button onClick={refreshLocation} className="bg-primary hover:bg-primary/90">
                  {t('timeClock.enableLocationRetry')}
                </Button>}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t bg-white">
        <Tabs defaultValue="requests" className="w-full">
            <div className="bg-muted/50 p-1.5 mx-2 my-2 rounded-xl">
              <TabsList variant="segmented" className="grid w-full grid-cols-2">
                <TabsTrigger variant="segmented" value="requests">
                  <FileText className="w-4 h-4 mr-2" />
                  {t('timeClock.myRequests')}
                </TabsTrigger>
                <TabsTrigger variant="segmented" value="timesheet">
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('timeClock.timesheet')}
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>
      </div>;
  }
  return <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-blue-500 text-white px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-white hover:bg-white/20" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-center flex-1">
          <p className="text-sm opacity-90">
            {isClocked ? t('timeClock.currentSession') : t('timeClock.totalWorkHoursToday')}
          </p>
          <p className="text-xl font-bold">
            {isClocked ? elapsedTime : formatHours(todayHours)}
          </p>
        </div>
        <div className="w-8" />
      </div>

      {/* Map Container - Full Height */}
      <div className="flex-1 relative bg-gray-200">
        {!currentLocation ? <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">{t('timeClock.gettingLocation')}</p>
            </div>
          </div> : null}
        
        {/* Map */}
        <div ref={containerRef} className="absolute inset-0" />
      </div>

      {/* Clock Action Buttons */}
      <div className="bg-white px-4 py-6 rounded-t-[3rem] -mt-6 relative z-10 shadow-lg">
        {/* Previous Day Entry Warning */}
        {previousDayEntry && <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  You forgot to clock out!
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Shift from {formatDateTimePacific(previousDayEntry.clock_in)} is still open.
                  Clock out to close it and then clock in for today.
                </p>
                <Button onClick={clockOutPreviousDay} disabled={loading} className="mt-2 bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1 h-auto">
                  Close Previous Shift
                </Button>
              </div>
            </div>
          </div>}
        
        {/* Today's Assigned Jobs */}
        <div className="text-center mb-2">
          {todayJobs.length > 0 ? <p className="text-[10px] text-muted-foreground">
              {t('language') === 'es' ? 'Trabajo asignado:' : 'Assigned:'} {todayJobs.map((j: any) => j.title).join(', ')}
            </p> : <p className="text-[10px] text-muted-foreground">
              {t('language') === 'es' ? 'No tienes trabajos asignados hoy' : 'No jobs assigned for today'}
            </p>}
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Main Clock Button */}
          <Button onClick={handleClockAction} disabled={loading || (!currentLocation && !isClocked) || !!previousDayEntry} className={cn("w-32 h-32 rounded-full text-white font-bold text-lg shadow-xl", "bg-blue-500 hover:bg-blue-600", "hover:scale-105 active:scale-95 transition-all duration-200", "disabled:opacity-50 disabled:cursor-not-allowed", "flex flex-col items-center justify-center gap-1")}>
            <Clock className="w-8 h-8" />
            <span className="text-sm font-medium">
              {getMainButtonText()}
            </span>
          </Button>

          {/* Break Button */}
          {isClocked && <Button onClick={handleBreakAction} disabled={loading} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-full font-medium shadow-lg">
              <Coffee className="w-4 h-4 mr-2" />
              {isOnBreak ? t('timeClock.endBreak') : t('timeClock.startBreak')}
            </Button>}
        </div>
      </div>

      {/* Bottom Navigation Tabs */}
      <div className="bg-white border-t">
        <Tabs defaultValue="requests" className="w-full">
            <div className="bg-muted/50 p-1.5 mx-2 my-2 rounded-xl">
              <TabsList variant="segmented" className="grid w-full grid-cols-2">
                <TabsTrigger variant="segmented" value="requests">
                  <FileText className="w-4 h-4 mr-2" />
                  {t('timeClock.myRequests')}
                </TabsTrigger>
                <TabsTrigger variant="segmented" value="timesheet">
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('timeClock.timesheet')}
                </TabsTrigger>
              </TabsList>
            </div>
          
          <TabsContent value="requests" className="p-4 min-h-[200px]">
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-800 mb-4">{t('timeClock.addNewRequest')}</div>
              
              <Button onClick={() => {
              clearShiftRequestFlag();
              navigate('/mobile/requests/shift');
            }} variant="outline" className={cn("w-full justify-center py-3 px-4 bg-white border-blue-200 hover:bg-blue-50 font-medium text-blue-700", needsShiftRequest && "animate-shift-request-blink bg-blue-500 text-white hover:bg-blue-600 border-blue-500")}>
                {needsShiftRequest && <AlertTriangle className="w-4 h-4 mr-2" />}
                {t('timeClock.addShiftRequest')}
              </Button>

              

              <Button onClick={() => navigate('/mobile/requests/time-off')} variant="outline" className="w-full justify-center py-3 px-4 bg-white border-blue-200 hover:bg-blue-50 font-medium text-blue-700">
                {t('timeClock.addTimeOffRequest')}
              </Button>

              
            </div>
          </TabsContent>
          
          <TabsContent value="timesheet" className="p-4 h-64 overflow-y-auto">
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  const weeklyTotal = weeklyTimesheet.reduce((sum, day) => sum + day.totalHours, 0);
                  const timesheetSummary = weeklyTimesheet
                    .map(day => `${day.dayName}: ${formatHours(day.totalHours)}`)
                    .join('\n');
                  
                  const confirmed = window.confirm(
                    `Are you sure your hours are right?\n\n${timesheetSummary}\n\nWeekly Total: ${formatHours(weeklyTotal)}`
                  );
                  
                  if (confirmed) {
                    toast.success('Timesheet submitted successfully!');
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2"
              >
                Submit Timesheet
              </Button>
              
              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeekOffset(prev => prev - 1)}
                  className="p-1 h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <p className="text-sm font-medium text-gray-700">
                  {weekOffset === 0 
                    ? 'This Week' 
                    : weekOffset === -1 
                      ? 'Last Week' 
                      : weeklyTimesheet.length > 0 
                        ? `${new Date(weeklyTimesheet[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(weeklyTimesheet[6].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : 'Weekly Timesheet'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeekOffset(prev => Math.min(0, prev + 1))}
                  disabled={weekOffset >= 0}
                  className="p-1 h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </Button>
              </div>
              
              <div className="space-y-1">
                {weeklyTimesheet.map(day => {
                const isToday = day.date === getTodayDateStringPacific();
                const dateDisplay = new Date(`${day.date}T12:00:00Z`).toLocaleDateString('en-US', {
                  timeZone: 'America/Los_Angeles',
                  month: 'short',
                  day: 'numeric'
                });
                return <div key={day.date} onClick={() => setSelectedDayDetails({
                  date: day.date,
                  dayName: day.dayName,
                  entries: day.entries,
                  hasPending: day.hasPending
                })} className={cn("flex items-center justify-between p-3 rounded-lg text-sm cursor-pointer transition-colors", isToday ? "bg-blue-50 border border-blue-200 hover:bg-blue-100" : "bg-gray-50 hover:bg-gray-100")}>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 text-center font-medium", isToday ? "text-blue-600" : "text-gray-600")}>
                          {day.dayName}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {dateDisplay}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {day.hasPending && <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>}
                        <span className={cn("font-semibold min-w-[50px] text-right", day.totalHours > 0 ? "text-gray-800" : "text-gray-400")}>
                          {formatHours(day.totalHours)}
                        </span>
                      </div>
                    </div>;
              })}
              </div>
              
              {/* Weekly Total */}
              <div className="flex justify-between items-center pt-2 border-t mt-3">
                <span className="font-medium text-gray-700">Weekly Total</span>
                <span className="font-bold text-lg text-gray-800">
                  {formatHours(weeklyTimesheet.reduce((sum, day) => sum + day.totalHours, 0))}
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Safety Checklist removed - all users go straight to project selection */}

      {/* Project Selection Modal */}
      <ProjectSelectionModal open={showProjectModal} onClose={() => setShowProjectModal(false)} onSelectProject={handleProjectSelection} />
      
      {/* Crew Verification Modal (for leaders) */}
      {crewVerificationData && (
        <CrewVerificationModal
          isOpen={showCrewVerification}
          onClose={handleCrewVerificationClose}
          onComplete={handleCrewVerificationComplete}
          projectId={crewVerificationData.projectId}
          projectName={crewVerificationData.projectName}
          leaderClockIn={crewVerificationData.clockIn}
          leaderClockOut={crewVerificationData.clockOut}
        />
      )}
      
      {/* Shift Confirmation Modal */}
      <ShiftConfirmationModal isOpen={showShiftConfirmation} onClose={() => setShowShiftConfirmation(false)} shiftData={completedShiftData} onConfirm={handleShiftConfirm} onEdit={handleShiftEdit} />

      {/* Day Details Sheet */}
      <Sheet open={!!selectedDayDetails} onOpenChange={open => !open && setSelectedDayDetails(null)}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedDayDetails(null)} className="p-1">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <SheetTitle>
                {selectedDayDetails && new Date(`${selectedDayDetails.date}T12:00:00Z`).toLocaleDateString('en-US', {
                timeZone: 'America/Los_Angeles',
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
              </SheetTitle>
            </div>
          </SheetHeader>
          
          <div className="overflow-y-auto h-full pb-8">
            {selectedDayDetails?.entries.length === 0 ? <div className="text-center text-gray-500 py-8">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No entries for this day</p>
              </div> : <div className="space-y-4">
                {selectedDayDetails?.entries.map((entry, index) => <div key={entry.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">Entry #{index + 1}</span>
                      {selectedDayDetails.hasPending && <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>}
                    </div>
                    
                    {entry.project_name && <div className="flex items-center gap-2 text-blue-600 font-medium">
                        <MapPin className="w-4 h-4" />
                        <span>{entry.project_name}</span>
                      </div>}
                    
                    {/* Clock In */}
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Clock In</p>
                        <p className="font-semibold text-gray-800">{formatTimePacific(entry.clock_in)}</p>
                        {entry.location && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <LocationDisplayInline location={entry.location} getAddressFromLocation={getAddressFromLocation} />
                          </p>}
                      </div>
                    </div>
                    
                    {/* Break */}
                    {entry.clock_out && <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <Coffee className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Break</p>
                          <p className="font-semibold text-gray-800">{entry.break_time_minutes || 0} minutes</p>
                          {entry.break_location && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <LocationDisplayInline location={entry.break_location} getAddressFromLocation={getAddressFromLocation} />
                            </p>}
                        </div>
                      </div>}
                    
                    {/* Clock Out */}
                    {entry.clock_out && <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Clock Out</p>
                          <p className="font-semibold text-gray-800">{formatTimePacific(entry.clock_out)}</p>
                          {entry.clock_out_location && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <LocationDisplayInline location={entry.clock_out_location} getAddressFromLocation={getAddressFromLocation} />
                            </p>}
                        </div>
                      </div>}
                    
                    {/* Total Hours */}
                    {entry.total_hours && <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-gray-600 text-sm">Total Hours</span>
                        <span className="font-bold text-gray-800">{formatHours(entry.total_hours)}</span>
                      </div>}
                  </div>)}
              </div>}
          </div>
        </SheetContent>
      </Sheet>
    </div>;
};
const LocationDisplay: React.FC<{
  location: string;
  getAddressFromLocation: (location: string) => Promise<string>;
  t: (key: string) => string;
}> = ({
  location,
  getAddressFromLocation,
  t
}) => {
  const [address, setAddress] = useState<string>(location);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchAddress = async () => {
      if (location && location.includes(',')) {
        setLoading(true);
        try {
          const addr = await getAddressFromLocation(location);
          setAddress(addr);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAddress();
  }, [location, getAddressFromLocation]);
  return <div className="text-gray-500 text-xs">
      <p>📍 {t('timeClock.location')}: {loading ? t('timeClock.gettingAddress') : address}</p>
    </div>;
};
const LocationDisplayInline: React.FC<{
  location: string;
  getAddressFromLocation: (location: string) => Promise<string>;
}> = ({
  location,
  getAddressFromLocation
}) => {
  const [address, setAddress] = useState<string>(location);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchAddress = async () => {
      if (location && location.includes(',')) {
        setLoading(true);
        try {
          const addr = await getAddressFromLocation(location);
          setAddress(addr);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAddress();
  }, [location, getAddressFromLocation]);
  return <span>{loading ? 'Loading...' : address}</span>;
};