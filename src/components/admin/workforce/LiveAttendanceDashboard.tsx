import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Clock, Users, MapPin, Activity, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useToast } from '../../../hooks/use-toast';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

interface LiveAttendanceEntry {
  id: string;
  employee_mapping_id: string;
  employee_name: string;
  employee_role?: string;
  clock_in: string;
  clock_out?: string;
  status: string; // Changed from literal union to string to match database
  work_date: string;
  location_data?: any;
  total_hours?: number;
  break_duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

interface LiveMetrics {
  currentlyWorking: number;
  onBreak: number;
  lateToday: number;
  totalHoursToday: number;
  avgClockInTime: string;
}

const LiveAttendanceDashboard = () => {
  const [attendanceEntries, setAttendanceEntries] = useState<LiveAttendanceEntry[]>([]);
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLiveAttendance();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, []);

  const fetchLiveAttendance = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('workforce_attendance')
        .select('*')
        .eq('work_date', today)
        .order('clock_in', { ascending: false });

      if (error) throw error;

      const entries = data || [];
      setAttendanceEntries(entries);
      setMetrics(calculateLiveMetrics(entries));
      setLastSync(new Date());
    } catch (error) {
      console.error('Error fetching live attendance:', error);
      toast({
        title: "Sync Error",
        description: "Failed to fetch live attendance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const instanceId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`workforce-attendance-changes-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workforce_attendance',
        },
        (payload) => {
          console.log('Real-time attendance update:', payload);
          fetchLiveAttendance(); // Refresh data on any change
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            toast({
              title: "Attendance Update",
              description: `${payload.new?.employee_name || 'Employee'} attendance updated`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateLiveMetrics = (entries: LiveAttendanceEntry[]): LiveMetrics => {
    const currentlyWorking = entries.filter(e => 
      (e.status === 'clocked_in' || e.status === 'on_time') && !e.clock_out
    ).length;
    
    const onBreak = entries.filter(e => e.status === 'on_break').length;
    const lateToday = entries.filter(e => e.status === 'late').length;
    
    const totalHoursToday = entries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
    
    // Calculate average clock-in time
    const clockInTimes = entries
      .filter(e => e.clock_in)
      .map(e => new Date(e.clock_in).getHours() + new Date(e.clock_in).getMinutes() / 60);
    
    const avgHours = clockInTimes.length > 0 
      ? clockInTimes.reduce((sum, h) => sum + h, 0) / clockInTimes.length 
      : 8;
    
    const avgClockInTime = `${Math.floor(avgHours)}:${String(Math.round((avgHours % 1) * 60)).padStart(2, '0')}`;

    return {
      currentlyWorking,
      onBreak,
      lateToday,
      totalHoursToday,
      avgClockInTime
    };
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      // Refresh local data from database
      await fetchLiveAttendance();
      
      toast({
        title: "Refresh Complete",
        description: "Attendance data refreshed successfully",
      });
    } catch (error) {
      console.error('Manual refresh error:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh attendance data",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string, clockOut?: string) => {
    if ((status === 'clocked_in' || status === 'on_time') && !clockOut) {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Working
      </Badge>;
    }
    if (status === 'on_break') {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">
        <Clock className="w-3 h-3 mr-1" />
        On Break
      </Badge>;
    }
    if (status === 'late') {
      return <Badge className="bg-red-100 text-red-800 border-red-200">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Late
      </Badge>;
    }
    if (status === 'clocked_out' || clockOut) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Attendance Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Sync */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Live Attendance Dashboard
              </CardTitle>
              <CardDescription>
                Real-time employee clock-in/out status • {attendanceEntries.length} entries today
                {lastSync && (
                  <span className="ml-2">
                    • Last updated {formatDistanceToNow(lastSync, { addSuffix: true })}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button 
              onClick={handleManualSync}
              disabled={isSyncing}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Live Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Currently Working</p>
                  <p className="text-2xl font-bold text-emerald-800">{metrics.currentlyWorking}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">On Break</p>
                  <p className="text-2xl font-bold text-amber-800">{metrics.onBreak}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Late Today</p>
                  <p className="text-2xl font-bold text-red-800">{metrics.lateToday}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hours Today</p>
                  <p className="text-2xl font-bold">{metrics.totalHoursToday.toFixed(1)}h</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Clock-in</p>
                  <p className="text-2xl font-bold">{metrics.avgClockInTime}</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Today's Activity Feed
          </CardTitle>
          <CardDescription>Real-time clock-in/out activity</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceEntries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">No attendance records today</p>
              <p className="text-sm text-muted-foreground">
                Employee clock-ins will appear here in real-time
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendanceEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{entry.employee_name}</h3>
                        {entry.employee_role && (
                          <Badge variant="outline">{entry.employee_role}</Badge>
                        )}
                        {getStatusBadge(entry.status, entry.clock_out)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Clock In
                          </p>
                          <p>{format(parseISO(entry.clock_in), 'h:mm a')}</p>
                          <p className="text-xs">{getTimeAgo(entry.clock_in)}</p>
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Clock Out
                          </p>
                          <p>{entry.clock_out ? format(parseISO(entry.clock_out), 'h:mm a') : 'Still working'}</p>
                          {entry.clock_out && (
                            <p className="text-xs">{getTimeAgo(entry.clock_out)}</p>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">Hours</p>
                          <p>{entry.total_hours?.toFixed(1) || '0.0'}h</p>
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Location
                          </p>
                          <p>{entry.location_data?.address || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {entry.break_duration_minutes && entry.break_duration_minutes > 0 && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Break time:</span> {entry.break_duration_minutes} minutes
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">Last Update</div>
                      <div className="text-sm">{getTimeAgo(entry.updated_at)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveAttendanceDashboard;