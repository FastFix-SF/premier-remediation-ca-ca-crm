import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MiniCalendarWidget = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

  // Get events for the current month to show dots
  const { data: monthEvents = [] } = useQuery({
    queryKey: ['calendar-events-widget', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const { data, error } = await supabase
        .from('job_schedules')
        .select('start_time')
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString());
      
      if (error) throw error;
      return (data || []).map(e => parseISO(e.start_time));
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const hasEvent = (day: Date) => {
    return monthEvents.some(eventDate => isSameDay(eventDate, day));
  };

  return (
    <div className="h-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div key={index} className="text-center text-xs text-white/40 font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isSameDay(day, today);
          const dayHasEvent = hasEvent(day);

          return (
            <div
              key={index}
              onClick={() => {
                const dateStr = format(day, 'yyyy-MM-dd');
                navigate(`/admin?tab=workforce&subtab=scheduling&date=${dateStr}`);
              }}
              className={cn(
                "relative flex items-center justify-center aspect-square rounded-full text-sm transition-colors cursor-pointer",
                isCurrentMonth ? "text-white/80" : "text-white/20",
                isCurrentDay && "bg-blue-500 text-white font-semibold",
                !isCurrentDay && isCurrentMonth && "hover:bg-white/10"
              )}
            >
              {format(day, 'd')}
              {dayHasEvent && !isCurrentDay && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
