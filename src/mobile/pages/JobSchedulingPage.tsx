import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search, Plus, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarSheet } from '@/mobile/components/CalendarSheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths } from 'date-fns';
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
  clockInStatus: 'all-clocked-in' | 'running-late' | 'none';
  lateUsers: string[];
}
export const JobSchedulingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch real shifts from database
  const {
    data: shifts = []
  } = useQuery({
    queryKey: ['job-schedules'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('job_schedules').select('*').order('start_time');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch current clock-in entries
  const {
    data: clockedInEntries = []
  } = useQuery({
    queryKey: ['clock-entries-active'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('time_clock').select('user_id, job_id, employee_name').is('clock_out', null);
      if (error) throw error;
      return data || [];
    }
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
    const assignedUsers: AssignedUserInfo[] = rawAssignedUsers.map((user: any) => ({
      name: user?.name || 'Unknown',
      initials: user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'UN',
      avatar: user?.avatar,
      userId: user?.user_id || user?.id,
      status: user?.assignment_status || 'pending'
    }));
    const firstUser = assignedUsers[0] || {
      name: 'Unassigned',
      initials: 'UN'
    };

    // Get confirmed users
    const confirmedUsers = assignedUsers.filter(u => u.status === 'confirmed');

    // Check which confirmed users are clocked in for this shift
    const clockedInUserIds = clockedInEntries.filter(entry => entry.job_id === shift.id).map(entry => entry.user_id);
    const lateUsers = confirmedUsers.filter(u => u.userId && !clockedInUserIds.includes(u.userId)).map(u => u.name);

    // Determine clock-in status
    let clockInStatus: 'all-clocked-in' | 'running-late' | 'none' = 'none';
    if (confirmedUsers.length > 0) {
      if (lateUsers.length === 0) {
        clockInStatus = 'all-clocked-in';
      } else {
        clockInStatus = 'running-late';
      }
    }
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
      status: (shift.status === 'draft' ? 'draft' : shift.status === 'completed' ? 'completed' : shift.status === 'in-progress' ? 'in-progress' : 'scheduled') as 'scheduled' | 'in-progress' | 'completed' | 'draft',
      color: shift.color || '#dc2626',
      clockInStatus,
      lateUsers
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
  const getColorClasses = (color: ScheduleItem['color']) => {
    // If color is a hex code, use it directly as background
    if (typeof color === 'string' && color.startsWith('#')) {
      return '';
    }
    // Fallback for old color strings
    switch (color) {
      case 'purple':
        return 'bg-gradient-to-br from-purple-600 to-purple-700';
      case 'red':
        return 'bg-gradient-to-br from-red-600 to-red-700';
      case 'blue':
        return 'bg-gradient-to-br from-blue-600 to-blue-700';
      default:
        return 'bg-gradient-to-br from-red-600 to-red-700';
    }
  };
  return <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/mobile/admin')} className="h-10 w-10">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">ROOFING</h1>
              <ChevronLeft className="h-5 w-5 rotate-[-90deg]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(val) => setViewMode(val as 'day' | 'week' | 'month')}>
              <SelectTrigger className="h-9 w-[90px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setIsCalendarOpen(true)}>
              <CalendarIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Plus className="h-6 w-6 text-primary" />
            </Button>
          </div>
        </div>

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="text-center py-4">
            <div className="text-4xl font-light text-foreground">{selectedDate.getDate()}</div>
            <div className="text-lg text-muted-foreground">{format(selectedDate, 'EEEE')}</div>
            <div className="text-sm text-muted-foreground">{format(selectedDate, 'MMMM yyyy')}</div>
            <div className="flex justify-center gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <>
            <div className="text-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {format(selectedDate, 'MMMM yyyy')}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((date, index) => (
                <button key={index} onClick={() => setSelectedDate(date)} className="flex flex-col items-center py-2 rounded-lg transition-colors">
                  <span className={`text-xs mb-1 ${isSameDay(date, selectedDate) ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {dayNames[index]}
                  </span>
                  <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-full ${isSameDay(date, selectedDate) ? 'bg-primary text-primary-foreground' : ''}`}>
                    <span className={`text-lg font-medium ${isSameDay(date, selectedDate) ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  {hasScheduleOnDay(date) && <div className={`w-1 h-1 rounded-full mt-1 ${isSameDay(date, selectedDate) ? 'bg-primary-foreground' : 'bg-primary'}`} />}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Month View */}
        {viewMode === 'month' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs text-muted-foreground py-1">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((date, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedDate(date);
                    setCurrentMonth(date);
                  }}
                  className={`flex flex-col items-center justify-center p-1 rounded-lg transition-colors min-h-[40px] ${
                    !isCurrentMonth(date) ? 'opacity-30' : ''
                  } ${isSameDay(date, selectedDate) ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <span className={`text-sm ${isSameDay(date, selectedDate) ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {date.getDate()}
                  </span>
                  {hasScheduleOnDay(date) && (
                    <div className={`w-1 h-1 rounded-full mt-0.5 ${isSameDay(date, selectedDate) ? 'bg-primary-foreground' : 'bg-primary'}`} />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Schedule List */}
      <div className="p-4 space-y-3 min-h-[calc(100vh-280px)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-light text-foreground">{selectedDate.getDate()}</span>
            <span className="text-lg text-muted-foreground">
              {dayNames[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1]}
            </span>
          </div>
          <button onClick={() => setIsAddMenuOpen(true)} className="flex items-center gap-1.5 text-primary font-medium text-sm px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg active:scale-95 transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {scheduleItems.filter(item => isSameDay(item.date, selectedDate)).map(item => <div key={item.id} onClick={() => navigate(`/mobile/shift/${item.id}`)} className={`${item.status === 'draft' ? 'bg-gradient-to-br from-amber-500/40 to-yellow-600/40 border-2 border-amber-400/50 border-dashed' : getColorClasses(item.color)} rounded-xl p-3 text-white shadow-md relative cursor-pointer`} style={item.status !== 'draft' && typeof item.color === 'string' && item.color.startsWith('#') ? {
        background: item.color
      } : undefined}>
              {item.status === 'draft' && <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                  DRAFT
                </div>}
              
              {item.status === 'completed' && <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                  <div className="w-2 h-3.5 border-white border-r-2 border-b-2 transform rotate-45 -translate-y-0.5" />
                </div>}
              
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Job Title with arrow indicator */}
                  <div className="flex items-center gap-1.5">
                    <ChevronDown className="w-4 h-4 text-green-300 flex-shrink-0" />
                    <span className="font-semibold text-sm truncate">{item.title}</span>
                  </div>
                  
                  {/* Address - street only */}
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 opacity-80 flex-shrink-0" />
                    <span className="text-xs opacity-90 truncate">{item.shortAddress}</span>
                  </div>
                  
                  {/* Time */}
                  <div className="text-xs opacity-80">
                    {item.startTime} - {item.endTime}
                  </div>
                  
                  {/* Assigned User Name */}
                  <div className="text-xs font-medium opacity-90">
                    {item.assignedUser.name}
                  </div>
                  
                  {/* Clock-in Status Badge */}
                  {item.clockInStatus !== 'none' && <div className="pt-1">
                      {item.clockInStatus === 'all-clocked-in' ? <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <span className="text-[10px] font-medium">All clocked in</span>
                        </div> : <div className="inline-flex flex-col gap-0.5">
                          <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            <span className="text-[10px] font-medium">Running late</span>
                          </div>
                          {item.lateUsers.length > 0 && <span className="text-[9px] opacity-70 pl-1 truncate max-w-[150px]">
                              {item.lateUsers.join(', ')}
                            </span>}
                        </div>}
                    </div>}
                </div>
                
                <Avatar className="w-10 h-10 border-2 border-white/30 flex-shrink-0">
                  {item.assignedUser.avatar ? <AvatarImage src={item.assignedUser.avatar} /> : null}
                  <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                    {item.assignedUser.initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>)}

        {/* Add Shift Button */}
        <button onClick={() => setIsAddMenuOpen(true)} className="w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform mx-auto mt-4">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Calendar Sheet */}
      <CalendarSheet isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Add Menu Sheet */}
      <Sheet open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl">
          <div className="space-y-2 pb-4">
            <Button variant="ghost" className="w-full h-16 text-lg font-medium text-primary hover:bg-primary/5 justify-center" onClick={() => {
            setIsAddMenuOpen(false);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            navigate(`/mobile/add-shift?date=${dateStr}`);
          }}>
              Add shift
            </Button>
            
            <Separator className="my-2" />
            
            
          </div>
        </SheetContent>
      </Sheet>
    </div>;
};