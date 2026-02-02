import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Clock, Users, AlertTriangle, TrendingUp, Download, DollarSign } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { format, parseISO, differenceInHours, startOfWeek, endOfWeek } from 'date-fns';
import { useTeamMembers } from '../../../hooks/useTeamMembers';

interface TimeClockEntry {
  id: string;
  employee_name: string;
  employee_role?: string;
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
  overtime_hours?: number;
  break_time_minutes: number;
  location?: string;
  project_name?: string;
  status: string;
  notes?: string;
  created_at: string;
  user_id?: string;
  address?: string;
}

interface AttendanceMetrics {
  total_hours: number;
  overtime_hours: number;
  late_clockouts: number;
  active_employees: number;
  average_daily_hours: number;
  total_labor_cost: number;
  overtime_cost: number;
}

const TimeClockSummary = () => {
  const [timeEntries, setTimeEntries] = useState<TimeClockEntry[]>([]);
  const [metrics, setMetrics] = useState<AttendanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: teamMembers } = useTeamMembers();

  const HOURLY_RATE = 65; // TODO: Make this configurable

  useEffect(() => {
    if (teamMembers) {
      fetchTimeClockData();
    }
  }, [currentDate, teamMembers]);

  const reverseGeocode = async (location: string): Promise<string> => {
    if (!location || !location.includes(',')) return location;
    
    const [lat, lng] = location.split(',').map(s => s.trim());
    if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) return location;

    try {
      const { data, error } = await supabase.functions.invoke('reverse-geocode', {
        body: { latitude: Number(lat), longitude: Number(lng) }
      });

      if (error) throw error;
      return data?.address || location;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return location;
    }
  };

  const fetchTimeClockData = async () => {
    try {
      setLoading(true);
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);

      const { data, error } = await supabase
        .from('time_clock')
        .select('*')
        .gte('clock_in', weekStart.toISOString())
        .lte('clock_in', weekEnd.toISOString())
        .order('clock_in', { ascending: false });

      if (error) throw error;

      // Enrich entries with team member names and addresses
      const enrichedEntries = await Promise.all((data || []).map(async (entry) => {
        const member = teamMembers?.find(m => m.user_id === entry.user_id);
        const address = entry.location ? await reverseGeocode(entry.location) : undefined;
        
        return {
          ...entry,
          employee_name: member?.full_name || entry.employee_name || 'Unknown',
          employee_role: member?.role || entry.employee_role,
          address
        };
      }));

      setTimeEntries(enrichedEntries);
      setMetrics(calculateMetrics(enrichedEntries));
    } catch (error) {
      console.error('Error fetching time clock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (entries: TimeClockEntry[]): AttendanceMetrics => {
    const totalHours = entries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
    const overtimeHours = entries.reduce((sum, entry) => sum + (entry.overtime_hours || 0), 0);
    const lateClockouts = entries.filter(entry => 
      entry.clock_out && new Date(entry.clock_out).getHours() > 17
    ).length;
    const activeEmployees = new Set(entries.map(entry => entry.employee_name)).size;
    const averageDailyHours = activeEmployees > 0 ? totalHours / (activeEmployees * 7) : 0;
    const totalLaborCost = totalHours * HOURLY_RATE;
    const overtimeCost = overtimeHours * HOURLY_RATE * 0.5; // Time and a half premium

    return {
      total_hours: totalHours,
      overtime_hours: overtimeHours,
      late_clockouts: lateClockouts,
      active_employees: activeEmployees,
      average_daily_hours: averageDailyHours,
      total_labor_cost: totalLaborCost,
      overtime_cost: overtimeCost
    };
  };

  const getStatusBadge = (status: string, clockOut?: string) => {
    if (status === 'active' && !clockOut) {
      return <Badge className="bg-emerald-100 text-emerald-800">Currently Working</Badge>;
    }
    if (clockOut && new Date(clockOut).getHours() > 17) {
      return <Badge variant="secondary">Late Clockout</Badge>;
    }
    return <Badge variant="outline">Completed</Badge>;
  };

  const formatHours = (hours?: number) => {
    if (!hours) return '0.0h';
    return `${hours.toFixed(1)}h`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const exportTimeClockData = () => {
    const csvData = timeEntries.map(entry => ({
      'Employee Name': entry.employee_name,
      'Role/Position': entry.employee_role || '',
      'Shift Date': format(parseISO(entry.clock_in), 'MM/dd/yyyy'),
      'Clock In Time': format(parseISO(entry.clock_in), 'h:mm a'),
      'Clock Out Time': entry.clock_out ? format(parseISO(entry.clock_out), 'h:mm a') : 'In Progress',
      'Regular Hours': entry.total_hours?.toFixed(2) || '0.00',
      'Overtime Hours': entry.overtime_hours?.toFixed(2) || '0.00',
      'Break Minutes': entry.break_time_minutes.toString(),
      'Base Pay': formatCurrency((entry.total_hours || 0) * HOURLY_RATE),
      'OT Premium': entry.overtime_hours ? formatCurrency(entry.overtime_hours * HOURLY_RATE * 0.5) : '$0.00',
      'Total Cost': formatCurrency((entry.total_hours || 0) * HOURLY_RATE + (entry.overtime_hours || 0) * HOURLY_RATE * 0.5),
      'Work Location': entry.address || entry.project_name || '',
      'Status': entry.status,
      'Notes': entry.notes || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-summary-${format(startOfWeek(currentDate), 'yyyy-MM-dd')}-to-${format(endOfWeek(currentDate), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time Clock Summary
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Weekly Payroll Summary
              </CardTitle>
              <CardDescription>
                Pay period: {format(startOfWeek(currentDate), 'MMM d')} - {format(endOfWeek(currentDate), 'MMM d, yyyy')} • {timeEntries.length} time records
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigateWeek('prev')}>
                ← Previous Week
              </Button>
              <Button variant="outline" onClick={() => navigateWeek('next')}>
                Next Week →
              </Button>
              <Button variant="outline" onClick={exportTimeClockData}>
                <Download className="w-4 h-4 mr-2" />
                Export for Payroll
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Billable Hours</p>
                  <p className="text-3xl font-bold mt-1">{formatHours(metrics.total_hours)}</p>
                  <p className="text-xs text-muted-foreground mt-1">This week</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Overtime Hours</p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 mt-1">{formatHours(metrics.overtime_hours)}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Premium rate (1.5x)</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Active Employees</p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{metrics.active_employees}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">This pay period</p>
                </div>
                <Users className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Total Labor Cost</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-1">{formatCurrency(metrics.total_labor_cost)}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Before burden</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cost Analysis Card */}
      {metrics && metrics.overtime_cost > 0 && (
        <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5" />
              Overtime Premium Alert
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-400">
              Additional payroll costs due to overtime hours worked this period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Overtime Hours</p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-200">
                  {formatHours(metrics.overtime_hours)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Premium Cost (0.5x)</p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-200">
                  {formatCurrency(metrics.overtime_cost)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Avg. Daily Hours</p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-200">
                  {formatHours(metrics.average_daily_hours)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Time Records</CardTitle>
          <CardDescription>
            Review and verify employee hours for payroll processing • Week ending {format(endOfWeek(currentDate), 'MMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">No time records found</p>
              <p className="text-sm text-muted-foreground">
                Employee time clock data will appear here for payroll processing
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg overflow-hidden">
                  {/* Header Row - Employee Info */}
                  <div className="bg-muted/30 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {entry.employee_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">{entry.employee_name}</h3>
                          {entry.employee_role && (
                            <p className="text-sm text-muted-foreground capitalize">{entry.employee_role}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(entry.status, entry.clock_out)}
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground font-medium">LABOR COST</p>
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency((entry.total_hours || 0) * HOURLY_RATE)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Details Grid */}
                  <div className="p-4">
                    <div className="grid grid-cols-4 gap-6">
                      {/* Shift Start */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Shift Start</p>
                        <p className="text-sm font-medium">{format(parseISO(entry.clock_in), 'MMM d')}</p>
                        <p className="text-base font-semibold">{format(parseISO(entry.clock_in), 'h:mm a')}</p>
                      </div>

                      {/* Shift End */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Shift End</p>
                        {entry.clock_out ? (
                          <>
                            <p className="text-sm font-medium">{format(parseISO(entry.clock_out), 'MMM d')}</p>
                            <p className="text-base font-semibold">{format(parseISO(entry.clock_out), 'h:mm a')}</p>
                          </>
                        ) : (
                          <p className="text-base font-semibold text-amber-600">Currently Working</p>
                        )}
                      </div>

                      {/* Total Hours */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Hours</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatHours(entry.total_hours)}
                        </p>
                        {entry.overtime_hours && entry.overtime_hours > 0 && (
                          <p className="text-xs font-semibold text-amber-600">
                            +{formatHours(entry.overtime_hours)} OT
                          </p>
                        )}
                      </div>

                      {/* Break Time */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Break Time</p>
                        <p className="text-base font-semibold">
                          {entry.break_time_minutes} min
                        </p>
                      </div>
                    </div>

                    {/* Work Location */}
                    {(entry.address || entry.project_name) && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Work Location</p>
                        <p className="text-sm">{entry.address || entry.project_name}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {entry.notes && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-blue-900 dark:text-blue-200">{entry.notes}</p>
                      </div>
                    )}

                    {/* Overtime Cost Alert */}
                    {entry.overtime_hours && entry.overtime_hours > 0 && (
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Overtime Premium</p>
                          </div>
                          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                            +{formatCurrency(entry.overtime_hours * HOURLY_RATE * 0.5)}
                          </p>
                        </div>
                      </div>
                    )}
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

export default TimeClockSummary;