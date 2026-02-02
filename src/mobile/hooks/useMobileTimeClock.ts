import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getTodayDateStringPacific, getDateStringPacific } from '@/utils/timezone';

export interface MobileTimeClockEntry {
  id: string;
  user_id: string;
  employee_name: string;
  employee_role?: string;
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
  break_time_minutes?: number;
  status: string;
  location?: string;
  clock_out_location?: string;
  break_location?: string;
  project_name?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeLocation {
  user_id: string;
  name: string;
  avatar_url?: string;
  latitude: number;
  longitude: number;
  status: string;
  clockInTime: string;
  totalHours: number;
}

export const useMobileTimeClock = () => {
  const { toast } = useToast();
  const [timeClockEntries, setTimeClockEntries] = useState<MobileTimeClockEntry[]>([]);
  const [employeeLocations, setEmployeeLocations] = useState<EmployeeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [teamMemberNamesMap, setTeamMemberNamesMap] = useState<Map<string, { name: string; avatar_url?: string }>>(new Map());

  // Load all time clock entries (not just today)
  const loadTimeClockData = async (isInitialLoad = true) => {
    try {
      // Only show loading spinner on initial load, not refreshes
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const { data, error } = await supabase
        .from('time_clock')
        .select('*')
        .order('clock_in', { ascending: false });

      if (error) throw error;

      const entries = data || [];
      setTimeClockEntries(entries);

      // Fetch team member names for ALL users (filter out null/undefined)
      const allUserIds = [...new Set(entries.map(e => e.user_id).filter(id => id != null))];
      
      if (allUserIds.length > 0) {
        const { data: allTeamMembers, error: teamError } = await supabase
          .from('team_directory')
          .select('user_id, full_name')
          .in('user_id', allUserIds);

        if (teamError) console.error('Team directory error:', teamError);

        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', allUserIds);

        const nameMap = new Map();
        
        // Also add entries from time_clock for users not in team_directory
        entries.forEach(entry => {
          if (entry.user_id && entry.employee_name && entry.employee_name !== 'Unknown') {
            const profile = allProfiles?.find(p => p.id === entry.user_id);
            if (!nameMap.has(entry.user_id)) {
              nameMap.set(entry.user_id, {
                name: entry.employee_name,
                avatar_url: profile?.avatar_url
              });
            }
          }
        });
        
        // Override with team_directory data (more authoritative)
        allTeamMembers?.forEach(member => {
          const profile = allProfiles?.find(p => p.id === member.user_id);
          nameMap.set(member.user_id, {
            name: member.full_name || nameMap.get(member.user_id)?.name || 'Unknown',
            avatar_url: profile?.avatar_url
          });
        });
        
        setTeamMemberNamesMap(nameMap);
      }

      // Process locations for map display (only today's active entries in Pacific Time)
      const todayStr = getTodayDateStringPacific();
      const todayEntries = entries.filter(entry => {
        const entryDateStr = getDateStringPacific(entry.clock_in);
        return entryDateStr === todayStr;
      });

      // Get unique user IDs from today's entries
      const userIds = [...new Set(todayEntries.map(e => e.user_id))];

      if (userIds.length === 0) {
        setEmployeeLocations([]);
        return;
      }

      // Fetch profile data for all users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      // Fetch team directory data for additional info
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_directory')
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (profileError) console.error('Profile fetch error:', profileError);
      if (teamError) console.error('Team fetch error:', teamError);

      // Create lookup maps
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const teamMap = new Map(teamMembers?.map(t => [t.user_id, t]) || []);

      const locations: EmployeeLocation[] = [];
      const processedUsers = new Set<string>();

      todayEntries.forEach(entry => {
        if (!processedUsers.has(entry.user_id) && entry.location) {
          const [lat, lng] = entry.location.split(',');
          if (lat && lng) {
            // Calculate total hours for today
            const userEntries = todayEntries.filter(e => e.user_id === entry.user_id);
            const totalHours = userEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
            
            // Get current status (most recent entry)
            const currentEntry = userEntries.find(e => !e.clock_out) || userEntries[0];

            // Get profile and team data
            const profile = profileMap.get(entry.user_id);
            const teamMember = teamMap.get(entry.user_id);

            // Determine best name to display (priority: profile display_name > team full_name > employee_name)
            let displayName = 'Unknown Employee';
            if (profile?.display_name) {
              displayName = profile.display_name;
            } else if (teamMember?.full_name) {
              displayName = teamMember.full_name;
            } else if (entry.employee_name && entry.employee_name !== 'Unknown') {
              displayName = entry.employee_name;
            }

            locations.push({
              user_id: entry.user_id,
              name: displayName,
              avatar_url: profile?.avatar_url,
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
              status: (currentEntry?.status as any) || 'completed',
              clockInTime: entry.clock_in,
              totalHours: totalHours
            });
            processedUsers.add(entry.user_id);
          }
        }
      });

      setEmployeeLocations(locations);
    } catch (error) {
      console.error('Error loading time clock data:', error);
      toast({
        title: "Error",
        description: "Failed to load time clock data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get entries for a specific employee on a specific date (in Pacific Time)
  const getEmployeeEntriesForDate = (userId: string, date: Date): MobileTimeClockEntry[] => {
    // Format date as Pacific Time YYYY-MM-DD
    const dateStr = getDateStringPacific(date);
    
    return timeClockEntries.filter(entry => {
      // Convert entry clock_in to Pacific Time date for comparison
      const entryDateStr = getDateStringPacific(entry.clock_in);
      return entry.user_id === userId && entryDateStr === dateStr;
    });
  };

  // Get daily summary for an employee on a specific date
  const getEmployeeDailySummaryForDate = (userId: string, date: Date) => {
    const entries = getEmployeeEntriesForDate(userId, date);
    const totalHours = entries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
    const totalBreakTime = entries.reduce((sum, entry) => sum + (entry.break_time_minutes || 0), 0);
    
    return {
      totalHours: totalHours,
      totalBreakMinutes: totalBreakTime,
      shiftsCount: entries.length,
      isCurrentlyClocked: entries.some(entry => !entry.clock_out),
      currentStatus: entries.find(entry => !entry.clock_out)?.status || 'completed'
    };
  };

  // Get entries for a specific employee (today's entries)
  const getEmployeeEntries = (userId: string): MobileTimeClockEntry[] => {
    return getEmployeeEntriesForDate(userId, new Date());
  };

  // Get daily summary for an employee (today)
  const getEmployeeDailySummary = (userId: string) => {
    return getEmployeeDailySummaryForDate(userId, new Date());
  };

  // Get active/clocked-in employees count (today only in Pacific Time)
  const getActiveClockedCount = () => {
    const todayStr = getTodayDateStringPacific();
    
    const activeUsers = new Set<string>();
    timeClockEntries.forEach(entry => {
      const entryDateStr = getDateStringPacific(entry.clock_in);
      
      if (entryDateStr === todayStr && !entry.clock_out) {
        activeUsers.add(entry.user_id);
      }
    });
    return activeUsers.size;
  };

  // Get total employees who clocked in today (Pacific Time)
  const getTotalClockedInToday = () => {
    const todayStr = getTodayDateStringPacific();
    
    const todayUsers = new Set<string>();
    timeClockEntries.forEach(entry => {
      const entryDateStr = getDateStringPacific(entry.clock_in);
      
      if (entryDateStr === todayStr) {
        todayUsers.add(entry.user_id);
      }
    });
    return todayUsers.size;
  };

  // Get employee locations for a specific date (Pacific Time)
  const getEmployeeLocationsForDate = useCallback(async (date: Date): Promise<EmployeeLocation[]> => {
    const dateStr = getDateStringPacific(date);
    
    const dateEntries = timeClockEntries.filter(entry => {
      const entryDateStr = getDateStringPacific(entry.clock_in);
      return entryDateStr === dateStr;
    });

    // Get unique user IDs from date's entries
    const userIds = [...new Set(dateEntries.map(e => e.user_id).filter(id => id != null))];

    if (userIds.length === 0) {
      return [];
    }

    // Fetch profile data for all users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);

    // Fetch team directory data for additional info
    const { data: teamMembers } = await supabase
      .from('team_directory')
      .select('user_id, full_name')
      .in('user_id', userIds);

    // Create lookup maps
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const teamMap = new Map(teamMembers?.map(t => [t.user_id, t]) || []);

    const locations: EmployeeLocation[] = [];
    const processedUsers = new Set<string>();

    dateEntries.forEach(entry => {
      if (!processedUsers.has(entry.user_id) && entry.location) {
        const [lat, lng] = entry.location.split(',');
        if (lat && lng) {
          // Calculate total hours for this date
          const userEntries = dateEntries.filter(e => e.user_id === entry.user_id);
          const totalHours = userEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
          
          // Get current status (most recent entry)
          const currentEntry = userEntries.find(e => !e.clock_out) || userEntries[0];

          // Get profile and team data
          const profile = profileMap.get(entry.user_id);
          const teamMember = teamMap.get(entry.user_id);

          // Determine best name to display
          let displayName = 'Unknown Employee';
          if (profile?.display_name) {
            displayName = profile.display_name;
          } else if (teamMember?.full_name) {
            displayName = teamMember.full_name;
          } else if (entry.employee_name && entry.employee_name !== 'Unknown') {
            displayName = entry.employee_name;
          }

          locations.push({
            user_id: entry.user_id,
            name: displayName,
            avatar_url: profile?.avatar_url,
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            status: (currentEntry?.status as any) || 'completed',
            clockInTime: entry.clock_in,
            totalHours: totalHours
          });
          processedUsers.add(entry.user_id);
        }
      }
    });

    return locations;
  }, [timeClockEntries]);

  useEffect(() => {
    loadTimeClockData(true);
    
    // Set up real-time subscription
    const instanceId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`time_clock_changes-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_clock'
        },
        (payload) => {
          console.log('Time clock update:', payload);
          loadTimeClockData(false); // Don't show loading spinner on real-time updates
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    timeClockEntries,
    employeeLocations,
    loading,
    selectedEmployee,
    setSelectedEmployee,
    getEmployeeEntries,
    getEmployeeEntriesForDate,
    getEmployeeDailySummary,
    getEmployeeDailySummaryForDate,
    getActiveClockedCount,
    getTotalClockedInToday,
    getEmployeeLocationsForDate,
    refreshData: () => loadTimeClockData(false),
    teamMemberNamesMap,
  };
};