import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Calendar as CalendarIcon,
  Flag,
  Target,
  Users,
  Truck,
  Clock,
  Repeat,
  Plus,
  Play,
  Timer,
  Focus,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
  getHours,
  setHours,
} from 'date-fns';

type ViewMode = 'day' | 'week' | 'month';

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  end_time?: string | null;
  owner_name?: string;
  owner_id?: string | null;
  completed_at?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  end_date?: string | null;
  status: string;
  color_code?: string;
  is_recurring?: boolean;
}

interface ProjectCalendarProps {
  tasks: Task[];
  events: CalendarEvent[];
  onTaskClick: (task: Task) => void;
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date, hour?: number) => void;
  onAddEvent?: () => void;
  activeTimerTaskId?: string | null;
  onStartTimer?: (task: Task) => void;
  userXP?: number;
  userStreak?: number;
  onTaskComplete?: (task: Task) => void;
}

export const ProjectCalendar: React.FC<ProjectCalendarProps> = ({
  tasks,
  events,
  onTaskClick,
  onEventClick,
  onDayClick,
  onAddEvent,
  activeTimerTaskId,
  onStartTimer,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [currentMinute, setCurrentMinute] = useState(new Date().getMinutes());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentHour(now.getHours());
      setCurrentMinute(now.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to current hour in day view
  useEffect(() => {
    if (viewMode === 'day' && isToday(currentDate) && scrollRef.current) {
      const hourElement = scrollRef.current.querySelector(`[data-hour="${currentHour}"]`);
      if (hourElement) {
        hourElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [viewMode, currentDate]);

  // Navigation handlers
  const goToToday = () => setCurrentDate(new Date());

  const navigatePrev = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, -1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const navigateNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  // Month view calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentDate]);

  // Week view days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  // Hours for day/week view
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getItemsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dayTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      return format(new Date(task.due_date), 'yyyy-MM-dd') === dateStr;
    });

    const dayEvents = events.filter(event => {
      return format(new Date(event.event_date), 'yyyy-MM-dd') === dateStr;
    });

    return { tasks: dayTasks, events: dayEvents };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'border-l-red-500 bg-red-500/10';
      case 'P1': return 'border-l-orange-500 bg-orange-500/10';
      case 'P2': return 'border-l-blue-500 bg-blue-500/10';
      case 'P3': return 'border-l-slate-500 bg-slate-500/10';
      default: return 'border-l-slate-500 bg-slate-500/10';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'bg-red-500 text-white';
      case 'P1': return 'bg-orange-500 text-white';
      case 'P2': return 'bg-blue-500 text-white';
      case 'P3': return 'bg-slate-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'milestone': return Target;
      case 'review': return Users;
      case 'deadline': return Flag;
      case 'kickoff': return CalendarIcon;
      case 'delivery': return Truck;
      case 'meeting': return Clock;
      default: return CalendarIcon;
    }
  };

  const getEventColor = (type: string, colorCode?: string) => {
    if (colorCode) return colorCode;
    switch (type) {
      case 'milestone': return 'bg-purple-500';
      case 'review': return 'bg-cyan-500';
      case 'deadline': return 'bg-red-500';
      case 'kickoff': return 'bg-green-500';
      case 'delivery': return 'bg-yellow-500';
      case 'meeting': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const getHeaderTitle = () => {
    if (viewMode === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy');
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  // Format time for display
  const formatTimeDisplay = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Calculate time range display for tasks
  const getTimeRange = (task: Task) => {
    if (!task.due_date) return null;
    const start = new Date(task.due_date);
    const startStr = formatTimeDisplay(start);
    if (task.end_time) {
      const end = new Date(task.end_time);
      const endStr = formatTimeDisplay(end);
      const durationMs = end.getTime() - start.getTime();
      const durationMins = Math.round(durationMs / 60000);
      const durationStr = durationMins >= 60 
        ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
        : `${durationMins}m`;
      return { startStr, endStr, durationStr };
    }
    return { startStr, endStr: null, durationStr: null };
  };

  // Render Day View - Clean & Simple
  const renderDayView = () => {
    const isTodayView = isToday(currentDate);
    
    // Get tasks for today, excluding completed ones from timeline
    const todaysTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      return isSameDay(new Date(task.due_date), currentDate);
    });
    
    const activeTasks = todaysTasks.filter(t => t.status !== 'DONE');
    
    return (
      <div className="space-y-4">
        {/* Clean Date Header */}
        <div className="flex items-start justify-between p-6 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-start gap-4">
            {/* Large Date Number */}
            <span className="text-6xl font-bold text-white leading-none">
              {format(currentDate, 'd')}
            </span>
            <div className="pt-1">
              <div className="text-xl font-semibold text-white">
                {format(currentDate, 'EEEE')}
              </div>
              <div className="text-sm text-white/50">
                {format(currentDate, 'MMMM yyyy')}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {onAddEvent && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAddEvent}
                className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
              >
                <Flag className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => onDayClick(currentDate)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <ScrollArea className="h-[500px]" ref={scrollRef}>
            <div className="relative">
              {hours.map((hour) => {
                const hourTasks = activeTasks.filter(task => {
                  if (!task.due_date) return false;
                  const taskDate = new Date(task.due_date);
                  return getHours(taskDate) === hour;
                });
                
                const timeLabel = format(setHours(new Date(), hour), 'h:mm a');
                const isCurrentHour = isTodayView && hour === currentHour;
                const nowMinuteOffset = isCurrentHour ? (currentMinute / 60) * 100 : 0;
                
                return (
                  <div
                    key={hour}
                    data-hour={hour}
                    className={`flex border-b border-white/5 min-h-[80px] cursor-pointer group relative ${
                      isCurrentHour ? 'bg-amber-500/5' : 'hover:bg-white/[0.02]'
                    }`}
                    onClick={() => hourTasks.length === 0 && onDayClick(currentDate, hour)}
                  >
                    {/* Current time indicator */}
                    {isCurrentHour && (
                      <div 
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{ top: `${nowMinuteOffset}%` }}
                      >
                        <div className="flex items-center">
                          <div className="w-20 flex justify-end pr-2">
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/20 px-1.5 py-0.5 rounded">
                              NOW
                            </span>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <div className="flex-1 h-[2px] bg-amber-500" />
                        </div>
                      </div>
                    )}

                    {/* Yellow accent bar for current hour */}
                    {isCurrentHour && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                    )}

                    {/* Time Label */}
                    <div className={`w-20 flex-shrink-0 py-3 px-3 text-right ${
                      isCurrentHour ? 'text-amber-400 font-medium' : 'text-white/40'
                    }`}>
                      <span className="text-sm">{timeLabel}</span>
                    </div>
                    
                    {/* Task Area */}
                    <div className="flex-1 p-2 relative border-l border-white/5">
                      <AnimatePresence>
                        {hourTasks.map((task, taskIndex) => {
                          const isTimerActive = activeTimerTaskId === task.id;
                          const timeRange = getTimeRange(task);

                          return (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: 50 }}
                              transition={{ delay: taskIndex * 0.05 }}
                              onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 cursor-pointer border-l-4 transition-all hover:bg-white/5 ${getPriorityColor(task.priority)} ${
                                isTimerActive ? 'ring-1 ring-emerald-500/50' : ''
                              }`}
                            >
                              {/* Priority Badge */}
                              <Badge className={`${getPriorityBadgeColor(task.priority)} border-0 text-xs font-bold px-2`}>
                                {task.priority}
                              </Badge>
                              
                              {/* Task Title */}
                              <span className="flex-1 font-medium text-white truncate">{task.title}</span>
                              
                              {/* Play Button */}
                              {isTimerActive ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs font-medium flex items-center gap-1">
                                  <Timer className="w-3 h-3" />
                                  Active
                                </Badge>
                              ) : onStartTimer && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-8 h-8 rounded-full border border-white/20 text-white/60 hover:text-white hover:bg-white/10"
                                  onClick={(e) => { e.stopPropagation(); onStartTimer(task); }}
                                >
                                  <Play className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              
                              {/* Time Range Display */}
                              {timeRange && (
                                <div className="flex items-center gap-2 text-sm text-white/50">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {timeRange.startStr}
                                    {timeRange.endStr && ` — ${timeRange.endStr}`}
                                  </span>
                                </div>
                              )}
                              
                              {/* Duration Badge */}
                              {timeRange?.durationStr && (
                                <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                                  {timeRange.durationStr}
                                </Badge>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      
                      {/* Add button on hover */}
                      {hourTasks.length === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white hover:bg-white/10"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Simple Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/40 px-1">
          <span className="font-medium text-white/60">Tasks:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>P0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>P1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>P2</span>
          </div>
          <span className="text-white/20">|</span>
          <span className="font-medium text-white/60">Events:</span>
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3" />
            <span>Milestone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flag className="w-3 h-3" />
            <span>Deadline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            <span>Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Repeat className="w-3 h-3" />
            <span>Recurring</span>
          </div>
        </div>
      </div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-white/10">
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className={`p-2 text-center border-r border-white/5 last:border-0 ${
                  isToday(day) ? 'bg-indigo-500/10' : ''
                }`}
              >
                <div className="text-xs text-white/60">{format(day, 'EEE')}</div>
                <div className={`text-lg font-medium ${isToday(day) ? 'text-indigo-400' : 'text-white'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Week Content */}
          <ScrollArea className="h-[450px]">
            <div className="grid grid-cols-7">
              {weekDays.map((day, idx) => {
                const { tasks: dayTasks, events: dayEvents } = getItemsForDay(day);
                
                return (
                  <div
                    key={idx}
                    className={`min-h-[400px] p-2 border-r border-white/5 last:border-0 ${
                      isToday(day) ? 'bg-indigo-500/5' : ''
                    }`}
                    onClick={() => onDayClick(day)}
                  >
                    <div className="space-y-1">
                      {dayTasks.slice(0, 6).map(task => (
                        <div
                          key={task.id}
                          onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                          className={`text-[10px] px-1.5 py-1 rounded cursor-pointer hover:opacity-80 ${getPriorityColor(task.priority)} text-white truncate`}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayEvents.slice(0, 3).map(event => {
                        const EventIcon = getEventIcon(event.event_type);
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                            className={`text-[10px] px-1.5 py-1 rounded cursor-pointer hover:opacity-80 flex items-center gap-1 ${getEventColor(event.event_type, event.color_code)} text-white`}
                          >
                            <EventIcon className="w-2.5 h-2.5 flex-shrink-0" />
                            {event.is_recurring && <Repeat className="w-2 h-2 flex-shrink-0" />}
                            <span className="truncate">{event.title}</span>
                          </div>
                        );
                      })}
                      {dayTasks.length + dayEvents.length > 9 && (
                        <div className="text-[10px] text-white/40 px-1">
                          +{dayTasks.length + dayEvents.length - 9} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  // Render Month View
  const renderMonthView = () => {
    return (
      <div className="border border-white/10 rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-white/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-medium text-white/60 border-b border-white/10"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const { tasks: dayTasks, events: dayEvents } = getItemsForDay(day);
            const hasItems = dayTasks.length > 0 || dayEvents.length > 0;
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <Popover key={idx}>
                <PopoverTrigger asChild>
                  <div
                    className={`min-h-[80px] p-1 border-b border-r border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${
                      !isCurrentMonth ? 'bg-white/[0.02]' : ''
                    }`}
                    onClick={() => !hasItems && onDayClick(day)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-medium ${
                          isCurrentDay
                            ? 'w-6 h-6 flex items-center justify-center rounded-full bg-indigo-500 text-white'
                            : isCurrentMonth
                            ? 'text-white'
                            : 'text-white/30'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Task/Event Pills */}
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate ${getPriorityColor(task.priority)} text-white`}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayEvents.slice(0, 2 - Math.min(dayTasks.length, 2)).map((event) => {
                        const EventIcon = getEventIcon(event.event_type);
                        return (
                          <div
                            key={event.id}
                            className={`text-[10px] px-1 py-0.5 rounded truncate flex items-center gap-1 ${getEventColor(event.event_type, event.color_code)} text-white`}
                          >
                            <EventIcon className="w-2.5 h-2.5 flex-shrink-0" />
                            {event.is_recurring && <Repeat className="w-2 h-2 flex-shrink-0" />}
                            <span className="truncate">{event.title}</span>
                          </div>
                        );
                      })}
                      {dayTasks.length + dayEvents.length > 2 && (
                        <div className="text-[10px] text-white/40 px-1">
                          +{dayTasks.length + dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverTrigger>

                {hasItems && (
                  <PopoverContent
                    className="w-64 bg-slate-800 border-white/10 p-0"
                    align="start"
                  >
                    <div className="p-3 border-b border-white/10">
                      <h4 className="text-sm font-semibold text-white">
                        {format(day, 'EEEE, MMMM d')}
                      </h4>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {/* Tasks */}
                      {dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-2 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                          onClick={() => onTaskClick(task)}
                        >
                          <div className="flex items-start gap-2">
                            <CheckSquare className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{task.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge className={`text-[10px] px-1 py-0 ${getPriorityColor(task.priority)} text-white border-0`}>
                                  {task.priority}
                                </Badge>
                                {task.owner_name && (
                                  <span className="text-[10px] text-white/40">{task.owner_name}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Events */}
                      {dayEvents.map((event) => {
                        const EventIcon = getEventIcon(event.event_type);
                        return (
                          <div
                            key={event.id}
                            className="p-2 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                            onClick={() => onEventClick(event)}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-4 h-4 rounded flex items-center justify-center ${getEventColor(event.event_type, event.color_code)}`}>
                                <EventIcon className="w-2.5 h-2.5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate flex items-center gap-1">
                                  {event.title}
                                  {event.is_recurring && <Repeat className="w-3 h-3 text-white/40" />}
                                </p>
                                <p className="text-[10px] text-white/40 capitalize">{event.event_type}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </PopoverContent>
                )}
              </Popover>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header - Only show when NOT in day view (day view has its own header) */}
      {viewMode !== 'day' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">
            {getHeaderTitle()}
          </h2>
        </div>
      )}
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <Button
                key={mode}
                variant="ghost"
                size="sm"
                className={`text-xs px-4 py-2 ${
                  viewMode === mode 
                    ? mode === 'day' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30' 
                      : 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
                onClick={() => setViewMode(mode)}
              >
                {mode === 'day' && <Focus className="w-3 h-3 mr-1.5" />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={navigatePrev}
              className="text-white/60 hover:text-white h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-white/60 hover:text-white h-8"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateNext}
              className="text-white/60 hover:text-white h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Add Event Button */}
          {onAddEvent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddEvent}
              className="text-white/60 hover:text-white h-8"
            >
              <Plus className="w-4 h-4 mr-1" />
              Event
            </Button>
          )}
        </div>
      </div>

      {/* Legend - Hide in day view as it has its own visual design */}
      {viewMode !== 'day' && (
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-white/60">P0/Deadline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-white/60">P1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-white/60">Milestone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-white/60">Kickoff</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Repeat className="w-3 h-3 text-white/40" />
            <span className="text-white/60">Recurring</span>
          </div>
        </div>
      )}

      {/* Calendar Content */}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}
    </div>
  );
};
