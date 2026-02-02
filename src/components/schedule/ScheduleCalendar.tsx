import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScheduleTask } from '@/hooks/useScheduleTasks';

interface ScheduleCalendarProps {
  tasks: ScheduleTask[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  tasks,
  selectedDate,
  onDateSelect,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.start_date) return false;
      const taskStart = new Date(task.start_date);
      const taskEnd = task.end_date ? new Date(task.end_date) : taskStart;
      return date >= taskStart && date <= taskEnd;
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dayTasks = getTasksForDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                'relative p-2 text-sm rounded-md transition-colors min-h-[60px] flex flex-col items-center',
                !isCurrentMonth && 'text-muted-foreground/50',
                isSelected && 'bg-primary text-primary-foreground',
                isToday && !isSelected && 'bg-accent',
                !isSelected && 'hover:bg-muted'
              )}
            >
              <span>{format(day, 'd')}</span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: task.color || '#3b82f6' }}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{dayTasks.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
