import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Calendar, List, User, Clock, MapPin } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useToast } from '../../../hooks/use-toast';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

interface ScheduleRecord {
  id: string;
  employee_name: string;
  employee_role: string;
  project_name?: string;
  shift_start: string;
  shift_end: string;
  scheduled_hours?: number;
  assigned_date: string;
  shift_title?: string;
  shift_description?: string;
  status: string;
}

const SchedulingView = () => {
  const [scheduleData, setScheduleData] = useState<ScheduleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const fetchScheduleData = async () => {
    try {
      const { data, error } = await supabase
        .from('workforce_schedules')
        .select(`
          *,
          projects(name)
        `)
        .order('assigned_date', { ascending: true })
        .order('shift_start', { ascending: true });

      if (error) throw error;

      const formattedData = data?.map(record => ({
        id: record.id,
        employee_name: record.employee_name,
        employee_role: record.employee_role || 'Employee',
        project_name: record.projects?.name || 'Unassigned',
        shift_start: record.shift_start,
        shift_end: record.shift_end,
        scheduled_hours: record.scheduled_hours,
        assigned_date: record.assigned_date,
        shift_title: record.shift_title,
        shift_description: record.shift_description,
        status: record.status,
      })) || [];

      setScheduleData(formattedData);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      toast({
        title: "Error",
        description: "Failed to load schedule data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Scheduled', variant: 'default' as const },
      confirmed: { label: 'Confirmed', variant: 'secondary' as const },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const },
      completed: { label: 'Completed', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'outline' as const
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatTime = (timeString: string) => {
    return format(new Date(timeString), 'h:mm a');
  };

  const formatHours = (hours?: number) => {
    if (!hours) return '-';
    return `${hours.toFixed(1)}h`;
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const getSchedulesForDay = (date: Date) => {
    return scheduleData.filter(schedule =>
      isSameDay(new Date(schedule.assigned_date), date)
    );
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'next' ? 7 : -7;
    setCurrentDate(addDays(currentDate, days));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <div className="flex justify-between items-center">
          <div className="bg-muted/50 rounded-xl p-1.5 inline-flex">
            <TabsList variant="segmented">
              <TabsTrigger variant="segmented" value="week" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Week View
              </TabsTrigger>
              <TabsTrigger variant="segmented" value="table" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Table View
              </TabsTrigger>
            </TabsList>
          </div>

          {viewMode === 'week' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                ← Previous Week
              </Button>
              <span className="text-sm font-medium px-3">
                {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM dd')} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                Next Week →
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="week" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays().map((day, index) => {
                  const daySchedules = getSchedulesForDay(day);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-3 min-h-32 ${
                        isToday ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="text-sm font-medium mb-2">
                        <div>{format(day, 'EEE')}</div>
                        <div className={`text-lg ${isToday ? 'text-primary font-bold' : ''}`}>
                          {format(day, 'dd')}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        {daySchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="text-xs p-2 rounded bg-muted hover:bg-muted/80 cursor-pointer"
                            title={`${schedule.employee_name} - ${schedule.project_name}\n${formatTime(schedule.shift_start)} - ${formatTime(schedule.shift_end)}`}
                          >
                            <div className="font-medium truncate">{schedule.employee_name}</div>
                            <div className="text-muted-foreground truncate">{schedule.project_name}</div>
                            <div className="text-muted-foreground">
                              {formatTime(schedule.shift_start)} - {formatTime(schedule.shift_end)}
                            </div>
                          </div>
                        ))}
                        
                        {daySchedules.length === 0 && (
                          <div className="text-xs text-muted-foreground italic">
                            No schedules
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {scheduleData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No schedule data found</p>
                  <p className="text-sm">Try syncing workforce data to see employee schedules</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Shift Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduleData.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {record.employee_name}
                          </div>
                        </TableCell>
                        <TableCell>{record.employee_role}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            {record.project_name}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(record.assigned_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {formatTime(record.shift_start)} - {formatTime(record.shift_end)}
                          </div>
                        </TableCell>
                        <TableCell>{formatHours(record.scheduled_hours)}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchedulingView;