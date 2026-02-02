import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, MapPin, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleShift {
  id: string;
  job_name: string;
  description: string | null;
  location: string;
  start_time: string;
  end_time: string;
  status: string;
  color: string;
  estimated_hours: number;
  assigned_users: Array<{ id: string; name: string; email: string }>;
}

export const ProjectSchedulePage: React.FC = () => {
  const { id: projectId } = useParams();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, address')
        .eq('id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['project-schedules', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_schedules')
        .select('*')
        .eq('project_id', projectId)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map((schedule: any) => ({
        ...schedule,
        assigned_users: Array.isArray(schedule.assigned_users) 
          ? schedule.assigned_users.map((user: any) => 
              typeof user === 'string' 
                ? { id: user, name: user, email: '' }
                : user
            )
          : []
      })) as ScheduleShift[];
    },
    enabled: !!projectId,
  });

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const getShiftsForDate = (date: Date) => {
    return schedules.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return isSameDay(shiftDate, date);
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'next' ? 7 : -7;
    setCurrentDate(addDays(currentDate, days));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-amber-100 text-amber-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <ProjectSidebar />
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <ProjectSidebar />
      <main className="flex-1 p-3 sm:p-6 overflow-x-hidden">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Project Schedule</h1>
          <p className="text-sm sm:text-base text-muted-foreground truncate">{project?.name} - {project?.address}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 sm:gap-6">
          {/* Day Picker Calendar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                className="rounded-md pointer-events-auto"
                modifiers={{
                  hasShifts: schedules.map(s => new Date(s.start_time))
                }}
                modifiersStyles={{
                  hasShifts: { fontWeight: 'bold', textDecoration: 'underline' }
                }}
              />
            </CardContent>
          </Card>

          {/* Week View Calendar */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CalendarDays className="h-5 w-5" />
                  Week View
                </CardTitle>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')} className="px-2 sm:px-3">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Previous</span>
                  </Button>
                  <span className="text-xs sm:text-sm font-medium px-1 sm:px-3 min-w-0 sm:min-w-[180px] text-center whitespace-nowrap">
                    {format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM dd')} - {format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM dd, yyyy')}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => navigateWeek('next')} className="px-2 sm:px-3">
                    <span className="hidden sm:inline mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {getWeekDays().map((day, index) => {
                  const dayShifts = getShiftsForDate(day);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "border rounded-lg p-2 sm:p-3 min-h-[120px] sm:min-h-[200px]",
                        isToday ? 'border-primary bg-primary/5' : 'border-border'
                      )}
                    >
                      <div className="text-sm font-medium mb-3">
                        <div className="text-muted-foreground">{format(day, 'EEE')}</div>
                        <div className={cn(
                          "text-lg",
                          isToday && "text-primary font-bold"
                        )}>
                          {format(day, 'dd')}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {dayShifts.map((shift) => (
                          <div
                            key={shift.id}
                            className="text-xs p-2 rounded bg-muted hover:bg-muted/80 cursor-pointer"
                            style={{ borderLeft: `3px solid ${shift.color}` }}
                          >
                            <div className="font-medium truncate">{shift.job_name}</div>
                            <div className="text-muted-foreground">
                              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                            </div>
                            <Badge className={cn("mt-1 text-[10px] px-1 py-0", getStatusColor(shift.status))}>
                              {shift.status.replace('_', ' ')}
                            </Badge>
                            {shift.assigned_users.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{shift.assigned_users.length}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {dayShifts.length === 0 && (
                          <div className="text-xs text-muted-foreground italic text-center py-4">
                            No shifts
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Scheduled Shifts */}
        <Card className="mt-4 sm:mt-6">
          <CardHeader>
            <CardTitle>All Scheduled Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No shifts have been scheduled for this project yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className="w-2 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: shift.color }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{shift.job_name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(shift.start_time), 'MMM d, yyyy')} • {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                        </p>
                        {shift.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{shift.location}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 ml-5 sm:ml-0">
                      <Badge className={cn("text-xs", getStatusColor(shift.status))}>
                        {shift.status.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{shift.assigned_users.length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
