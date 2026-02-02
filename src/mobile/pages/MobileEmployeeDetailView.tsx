import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  MessageCircle, 
  Clock, 
  Coffee, 
  ChevronLeft, 
  ChevronRight,
  User,
  CalendarIcon,
  Pencil
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMobileTimeClock } from '../hooks/useMobileTimeClock';
import { useTeamMember } from '@/hooks/useTeamMember';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TimeEntryEditModal } from '../components/TimeEntryEditModal';

export const MobileEmployeeDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Check if user is admin or owner
  const [isAdminOrOwner, setIsAdminOrOwner] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      // Check admin_users table
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (adminData) {
        setIsAdminOrOwner(true);
        return;
      }
      
      // Check team_directory for owner/admin role
      const { data: teamData } = await supabase
        .from('team_directory')
        .select('role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('role', ['owner', 'admin'])
        .maybeSingle();
      
      setIsAdminOrOwner(!!teamData);
    };
    
    checkAdminStatus();
  }, [user]);
  
  // Get date from URL query parameter, default to today
  // Parse date string as local time to avoid timezone issues
  const dateParam = searchParams.get('date');
  const initialDate = dateParam 
    ? (() => {
        const [year, month, day] = dateParam.split('-').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed
      })()
    : new Date();
  
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [addressCache, setAddressCache] = useState<Record<string, string>>({});
  
  const { 
    employeeLocations, 
    getEmployeeEntriesForDate, 
    getEmployeeDailySummaryForDate,
    setSelectedEmployee,
    loading: timeClockLoading,
    teamMemberNamesMap,
    timeClockEntries
  } = useMobileTimeClock();
  const { getInitials } = useTeamMember();

  // Cache employee profile to prevent flickering during data refreshes
  const [cachedEmployeeProfile, setCachedEmployeeProfile] = useState<{ name: string; avatar_url?: string } | null>(null);

  // Update cached profile when we get valid data
  useEffect(() => {
    // First try teamMemberNamesMap
    const memberData = teamMemberNamesMap.get(userId!);
    if (memberData?.name && memberData.name !== 'Unknown Employee') {
      setCachedEmployeeProfile(memberData);
      return;
    }
    
    // Fallback to time_clock employee_name
    const entry = timeClockEntries.find(e => e.user_id === userId);
    if (entry?.employee_name && entry.employee_name !== 'Unknown') {
      setCachedEmployeeProfile({ name: entry.employee_name, avatar_url: memberData?.avatar_url });
      return;
    }
    
    // Only set to unknown if we have no cached value and data is loaded
    if (!cachedEmployeeProfile && !timeClockLoading && timeClockEntries.length > 0) {
      setCachedEmployeeProfile({ name: 'Unknown Employee', avatar_url: undefined });
    }
  }, [teamMemberNamesMap, timeClockEntries, userId, timeClockLoading]);

  const employeeProfile = cachedEmployeeProfile || { name: 'Loading...', avatar_url: undefined };

  if (!userId) {
    navigate('/mobile/time-clock');
    return null;
  }

  const employee = employeeLocations.find(emp => emp.user_id === userId);
  const entries = getEmployeeEntriesForDate(userId, selectedDate);
  const summary = getEmployeeDailySummaryForDate(userId, selectedDate);

  if (timeClockLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading employee data...</p>
        </div>
      </div>
    );
  }

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const canGoToNextDay = selectedDate < new Date(new Date().setHours(0, 0, 0, 0));

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const getAddressFromLocation = async (location: string): Promise<string> => {
    if (addressCache[location]) {
      return addressCache[location];
    }

    try {
      const [lat, lon] = location.split(',').map(Number);
      
      const { data, error } = await supabase.functions.invoke('reverse-geocode', {
        body: { latitude: lat, longitude: lon }
      });

      if (error) throw error;
      
      const address = data.address || location;
      setAddressCache(prev => ({ ...prev, [location]: address }));
      return address;
    } catch (error) {
      console.error('Error fetching address:', error);
      return location;
    }
  };

  const getShiftBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'on_break': return 'secondary';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  const getShiftLabel = (entry: any) => {
    if (entry.status === 'on_break') return 'On Break';
    if (entry.clock_out) return 'Work';
    return 'Active';
  };

  const LocationDisplay: React.FC<{ location: string }> = ({ location }) => {
    const [address, setAddress] = useState<string>(location);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      getAddressFromLocation(location).then(addr => {
        setAddress(addr);
        setLoading(false);
      });
    }, [location]);

    if (loading) {
      return <span className="text-muted-foreground">Loading...</span>;
    }

    return <span>{address}</span>;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/mobile/time-clock')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 flex items-center gap-3">
          <Avatar className="w-10 h-10">
            {employeeProfile.avatar_url && (
              <img src={employeeProfile.avatar_url} alt={employeeProfile.name} className="w-full h-full object-cover" loading="lazy" />
            )}
            <AvatarFallback>
              {getInitials(employeeProfile.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold">{employeeProfile.name}</h1>
          </div>
        </div>

        <Button variant="ghost" size="sm">
          <MessageCircle className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation and Date Picker */}
      <div className="flex justify-between items-center gap-2 px-2 sm:px-4 py-2 border-b">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={goToPreviousDay}
          className="flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal flex-shrink min-w-0",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {selectedDate ? format(selectedDate, "MMM dd, yyyy") : <span>Pick a date</span>}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date > new Date()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={goToNextDay}
          disabled={!canGoToNextDay}
          className="flex-shrink-0"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Selected Date Shifts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {format(selectedDate, "MMMM dd, yyyy")} shifts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {entries.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No shifts today</p>
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getShiftBadgeVariant(entry.status)} className="text-xs">
                        {getShiftLabel(entry)}
                      </Badge>
                      <span className="text-sm font-medium">
                        {entry.total_hours ? formatDuration(entry.total_hours) : 'Active'}
                      </span>
                    </div>
                    {isAdminOrOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingEntry(entry)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Timeline of events */}
                  <div className="space-y-1.5 pl-2 border-l-2 border-primary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 -ml-[9px]"></div>
                      <span className="font-medium text-green-700">Clock In:</span>
                      <span className="text-muted-foreground">{formatTime(entry.clock_in)}</span>
                    </div>
                    
                    {(entry.break_time_minutes > 0 || entry.status === 'on_break') && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-orange-500 -ml-[9px]"></div>
                        <Coffee className="w-3 h-3 text-orange-500" />
                        <span className="font-medium text-orange-700">Break:</span>
                        <span className="text-muted-foreground">
                          {entry.status === 'on_break' ? 'Currently on break' : `${entry.break_time_minutes} min`}
                        </span>
                      </div>
                    )}
                    
                    {entry.clock_out ? (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-[9px]"></div>
                        <span className="font-medium text-red-700">Clock Out:</span>
                        <span className="text-muted-foreground">{formatTime(entry.clock_out)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse -ml-[9px]"></div>
                        <span className="font-medium text-blue-700">Still Active</span>
                      </div>
                    )}
                  </div>
                  
                  {entry.location && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <span className="font-medium">Location:</span> <LocationDisplay location={entry.location} />
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Date Totals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {format(selectedDate, "MMM dd")} totals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatDuration(summary.totalHours)}
                </div>
                <p className="text-sm text-muted-foreground">Work hours</p>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-secondary-foreground mb-1">
                  {Math.round(summary.totalBreakMinutes)}m
                </div>
                <p className="text-sm text-muted-foreground">Paid breaks</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Current status</span>
                <Badge variant={getShiftBadgeVariant(summary.currentStatus)}>
                  {summary.currentStatus === 'active' && 'Working'}
                  {summary.currentStatus === 'on_break' && 'On Break'}
                  {summary.currentStatus === 'completed' && 'Completed'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-muted-foreground">Shifts today</span>
                <span className="font-medium">{summary.shiftsCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Modal */}
      {editingEntry && (
        <TimeEntryEditModal
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          entry={editingEntry}
          onSave={() => {
            // Trigger refetch by navigating to the same page
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};