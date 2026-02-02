import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Building2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarSheet } from '@/mobile/components/CalendarSheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AssignedUserInfo {
  name: string;
  initials: string;
  avatar?: string;
  userId?: string;
  status?: string;
}

interface ScheduleItem {
  id: string;
  title: string;
  location: string;
  shortAddress: string;
  startTime: string;
  endTime: string;
  date: Date;
  assignedUser: AssignedUserInfo;
  assignedUsers: AssignedUserInfo[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'draft';
  color: string;
  assignmentStatus: string;
}

export const MySchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch shifts assigned to current user
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['my-schedule-shifts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_schedules')
        .select('*')
        .order('start_time');
      
      if (error) throw error;
      
      // Filter to only shifts where current user is assigned
      return (data || []).filter(shift => {
        const assignedUsers = Array.isArray(shift.assigned_users) ? shift.assigned_users : [];
        return assignedUsers.some((u: any) => 
          u.user_id === user?.id || u.id === user?.id
        );
      });
    },
    enabled: !!user?.id,
  });

  // Helper to extract street address only
  const getStreetAddress = (fullAddress: string): string => {
    if (!fullAddress) return 'No location';
    const parts = fullAddress.split(',');
    return parts[0]?.trim() || fullAddress;
  };

  // Transform database shifts to ScheduleItem format
  const scheduleItems: ScheduleItem[] = shifts.map(shift => {
    const startDate = new Date(shift.start_time);
    const endDate = new Date(shift.end_time);

    // Get assigned users from jsonb field
    const rawAssignedUsers = Array.isArray(shift.assigned_users) ? shift.assigned_users : [];
    const assignedUsers: AssignedUserInfo[] = rawAssignedUsers.map((u: any) => ({
      name: u?.name || 'Unknown',
      initials: u?.name ? u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'UN',
      avatar: u?.avatar,
      userId: u?.user_id || u?.id,
      status: u?.assignment_status || 'pending'
    }));

    // Find current user's assignment status
    const currentUserAssignment = rawAssignedUsers.find((u: any) => 
      u.user_id === user?.id || u.id === user?.id
    ) as { assignment_status?: string } | undefined;
    const assignmentStatus = currentUserAssignment?.assignment_status || 'pending';

    const firstUser = assignedUsers[0] || { name: 'Unassigned', initials: 'UN' };

    return {
      id: shift.id,
      title: shift.job_name,
      location: shift.location || 'No location',
      shortAddress: getStreetAddress(shift.location || ''),
      startTime: format(startDate, 'h:mm a'),
      endTime: format(endDate, 'h:mm a'),
      date: startDate,
      assignedUser: firstUser,
      assignedUsers,
      status: (shift.status === 'draft' ? 'draft' : shift.status === 'completed' ? 'completed' : shift.status === 'in-progress' ? 'in-progress' : 'scheduled') as ScheduleItem['status'],
      color: shift.color || '#3b82f6',
      assignmentStatus
    };
  });

  // Generate week days
  const getWeekDays = () => {
    const week = [];
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      week.push(date);
    }
    return week;
  };

  // Generate month days for calendar grid
  const getMonthDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const hasScheduleOnDay = (date: Date) => {
    return scheduleItems.some(item => item.date.toDateString() === date.toDateString());
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  // Calculate upcoming shift count
  const upcomingShiftCount = useMemo(() => {
    const now = new Date();
    return scheduleItems.filter(item => item.date >= now).length;
  }, [scheduleItems]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { 
          label: 'Confirmed', 
          className: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm',
          icon: <CheckCircle2 className="w-3 h-3" />
        };
      case 'rejected':
        return { 
          label: 'Declined', 
          className: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm',
          icon: <XCircle className="w-3 h-3" />
        };
      default:
        return { 
          label: 'Pending', 
          className: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm animate-pulse',
          icon: <AlertCircle className="w-3 h-3" />
        };
    }
  };

  const filteredItems = scheduleItems.filter(item => isSameDay(item.date, selectedDate));

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Header with gradient accent */}
      <div className="relative px-4 pt-6 pb-4">
        {/* Gradient accent background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/10" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/mobile/home')} 
              className="h-10 w-10 rounded-xl bg-background/50 backdrop-blur-sm hover:bg-background/80"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Schedule</h1>
              <p className="text-sm text-muted-foreground">
                {upcomingShiftCount} upcoming shift{upcomingShiftCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-xl bg-background/50 backdrop-blur-sm hover:bg-background/80" 
            onClick={() => setIsCalendarOpen(true)}
          >
            <CalendarIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Pill-style View Mode Tabs */}
      <div className="px-4 pb-3">
        <div className="flex gap-1.5 p-1 bg-muted/50 rounded-2xl backdrop-blur-sm">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200",
                viewMode === mode
                  ? "bg-background shadow-md text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Navigation Section */}
      <div className="px-4 pb-4 border-b border-border/50">
        {/* Day View */}
        {viewMode === 'day' && (
          <div className="text-center py-4 animate-fade-in">
            <div className="inline-flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5">
              <div className="text-5xl font-bold text-foreground">{selectedDate.getDate()}</div>
              <div className="text-lg font-medium text-foreground/80">{format(selectedDate, 'EEEE')}</div>
              <div className="text-sm text-muted-foreground">{format(selectedDate, 'MMMM yyyy')}</div>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl"
                onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl px-4"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl"
                onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="animate-fade-in">
            <div className="text-center mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                {format(selectedDate, 'MMMM yyyy')}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((date, index) => {
                const hasShifts = hasScheduleOnDay(date);
                const isSelected = isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);
                
                return (
                  <button 
                    key={index} 
                    onClick={() => setSelectedDate(date)} 
                    className={cn(
                      "relative flex flex-col items-center py-2 rounded-2xl transition-all duration-200",
                      isSelected 
                        ? "bg-primary shadow-lg shadow-primary/25 scale-105" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    {/* Today indicator dot */}
                    {isTodayDate && !isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                    
                    <span className={cn(
                      "text-xs mb-1 font-medium",
                      isSelected ? "text-primary-foreground" : "text-muted-foreground"
                    )}>
                      {dayNames[index]}
                    </span>
                    
                    <span className={cn(
                      "text-lg font-bold w-10 h-10 flex items-center justify-center rounded-full",
                      isSelected ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {date.getDate()}
                    </span>
                    
                    {/* Shift indicator with gradient */}
                    {hasShifts && (
                      <div className={cn(
                        "mt-1 w-1.5 h-1.5 rounded-full",
                        isSelected 
                          ? "bg-primary-foreground" 
                          : "bg-gradient-to-r from-primary to-accent"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Month View */}
        {viewMode === 'month' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm font-semibold">{format(currentMonth, 'MMMM yyyy')}</span>
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((date, index) => {
                const hasShifts = hasScheduleOnDay(date);
                const isSelected = isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedDate(date);
                      setCurrentMonth(date);
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-1 rounded-xl transition-all min-h-[40px]",
                      !isCurrentMonth(date) ? 'opacity-30' : '',
                      isSelected 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : isTodayDate 
                          ? "ring-2 ring-primary/50" 
                          : "hover:bg-muted/50"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {date.getDate()}
                    </span>
                    {hasShifts && (
                      <div className={cn(
                        "w-1 h-1 rounded-full mt-0.5",
                        isSelected ? "bg-primary-foreground" : "bg-primary"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Schedule List */}
      <div className="p-4 space-y-3 flex-1">
        {/* Selected Date Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10">
            <span className="text-2xl font-bold text-foreground">{selectedDate.getDate()}</span>
          </div>
          <div>
            <span className="text-lg font-semibold text-foreground">
              {format(selectedDate, 'EEEE')}
            </span>
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} shift{filteredItems.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Loading your schedule...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Beautiful Empty State */
          <div className="text-center py-16 px-4 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
              {/* Pulsing ring effect */}
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-50" />
              <CalendarIcon className="w-12 h-12 text-foreground/40 relative z-10" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Shifts Today</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              You don't have any scheduled shifts for this day. Check other dates on the calendar.
            </p>
          </div>
        ) : (
          /* Glassmorphism Shift Cards */
          <div className="space-y-3">
            {filteredItems.map((item, index) => {
              const statusBadge = getStatusBadge(item.assignmentStatus);
              const startHour = format(item.date, 'h');
              const startPeriod = format(item.date, 'a');
              
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/mobile/shift/${item.id}`)}
                  className={cn(
                    "relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4",
                    "transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
                    "animate-fade-in cursor-pointer overflow-hidden",
                    "border-l-4"
                  )}
                  style={{ 
                    borderLeftColor: item.color,
                    animationDelay: `${index * 80}ms`
                  }}
                >
                  {/* Gradient overlay at top */}
                  <div 
                    className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                    style={{ background: `linear-gradient(to right, ${item.color}, ${item.color}80)` }}
                  />
                  
                  <div className="flex items-start gap-3 pt-1">
                    {/* Time badge on the left */}
                    <div className="flex flex-col items-center justify-center px-3 py-2 bg-muted/50 rounded-xl min-w-[60px]">
                      <span className="text-xl font-bold text-foreground">{startHour}</span>
                      <span className="text-xs text-muted-foreground uppercase">{startPeriod}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-foreground truncate">{item.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground truncate">{item.shortAddress}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {item.startTime} - {item.endTime}
                        </span>
                      </div>
                      
                      {/* Status badge with gradient */}
                      <div className="mt-2.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                          statusBadge.className
                        )}>
                          {statusBadge.icon}
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                    
                    {/* Stacked Avatars */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex -space-x-2 flex-shrink-0">
                        {item.assignedUsers.slice(0, 3).map((u, idx) => (
                          <Avatar key={idx} className="w-8 h-8 border-2 border-background shadow-sm">
                            {u.avatar ? <AvatarImage src={u.avatar} /> : null}
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                              {u.initials}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {item.assignedUsers.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground shadow-sm">
                            +{item.assignedUsers.length - 3}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Calendar Sheet */}
      <CalendarSheet
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
    </div>
  );
};
