import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ScheduleEvent {
  id: string;
  job_name: string;
  start_time: string;
  end_time: string;
  location?: string | null;
  status: string;
}

export const TodayScheduleWidget = () => {
  const navigate = useNavigate();
  const today = new Date();
  
  const { data: todaySchedule = [] } = useQuery({
    queryKey: ['today-schedule-widget'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_schedules')
        .select('id, job_name, start_time, end_time, location, status')
        .gte('start_time', startOfDay(today).toISOString())
        .lte('start_time', endOfDay(today).toISOString())
        .order('start_time', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return (data || []) as ScheduleEvent[];
    },
  });

  const { data: tomorrowSchedule = [] } = useQuery({
    queryKey: ['tomorrow-schedule-widget'],
    queryFn: async () => {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data, error } = await supabase
        .from('job_schedules')
        .select('id, job_name, start_time')
        .gte('start_time', startOfDay(tomorrow).toISOString())
        .lte('start_time', endOfDay(tomorrow).toISOString())
        .order('start_time', { ascending: true })
        .limit(2);
      
      if (error) throw error;
      return (data || []) as { id: string; job_name: string; start_time: string }[];
    },
  });

  const formatEventTime = (timeString: string) => {
    return format(parseISO(timeString), 'h:mm a');
  };

  return (
    <div 
      className="h-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-5 flex flex-col cursor-pointer hover:bg-white/[0.07] transition-colors"
      onClick={() => navigate('/admin?tab=schedule')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Today's Schedule</h3>
        <ChevronRight className="w-5 h-5 text-white/40" />
      </div>

      {/* Schedule List */}
      <div className="flex-1 space-y-3 overflow-hidden">
        {todaySchedule.length > 0 ? (
          todaySchedule.map((event, index) => (
            <div 
              key={event.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer",
                index === 0 ? "bg-white/10 hover:bg-white/15" : "bg-transparent hover:bg-white/5"
              )}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/mobile/shift/${event.id}`);
              }}
            >
              <div className="flex-shrink-0 w-14 text-center">
                <p className={cn(
                  "text-sm font-medium",
                  index === 0 ? "text-white" : "text-white/70"
                )}>
                  {formatEventTime(event.start_time)}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium truncate",
                  index === 0 ? "text-white" : "text-white/80"
                )}>
                  {event.job_name}
                </p>
                {event.location && (
                  <p className="text-xs text-white/50 truncate mt-0.5">
                    {event.location}
                  </p>
                )}
              </div>
              {index === 0 && (
                <div className="flex-shrink-0">
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                    Next
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/40 text-sm">No events scheduled for today</p>
          </div>
        )}
      </div>

      {/* Tomorrow Preview */}
      {tomorrowSchedule.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Tomorrow</p>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Clock className="w-3.5 h-3.5" />
            <span>{tomorrowSchedule.length} event{tomorrowSchedule.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};
