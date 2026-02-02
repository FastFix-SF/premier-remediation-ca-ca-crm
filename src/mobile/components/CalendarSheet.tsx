import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, eachMonthOfInterval, startOfWeek, endOfWeek } from 'date-fns';

interface CalendarSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const CalendarSheet: React.FC<CalendarSheetProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
}) => {

  // Fetch all shifts to determine which dates have shifts
  const { data: shifts = [] } = useQuery({
    queryKey: ['job-schedules-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_schedules')
        .select('start_time')
        .order('start_time');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  // Create a set of dates that have shifts for quick lookup
  const datesWithShifts = new Set(
    shifts.map(shift => format(new Date(shift.start_time), 'yyyy-MM-dd'))
  );

  const hasShiftOnDate = (date: Date) => {
    return datesWithShifts.has(format(date, 'yyyy-MM-dd'));
  };

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weeks = [];
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div key={format(monthDate, 'yyyy-MM')} className="mb-8">
        <h3 className="text-center text-lg font-medium text-muted-foreground mb-4">
          {format(monthDate, 'MMMM yyyy')}
        </h3>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map(day => {
                const isCurrentMonth = day.getMonth() === monthDate.getMonth();
                const isSelected = isSameDay(day, selectedDate);
                const hasShift = hasShiftOnDate(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      onSelectDate(day);
                      onClose();
                    }}
                    className={`
                      relative h-12 flex flex-col items-center justify-center rounded-lg transition-colors
                      ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40'}
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                    `}
                  >
                    <span className="text-sm">{format(day, 'd')}</span>
                    {hasShift && isCurrentMonth && (
                      <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Generate all months from October 2025 to December 2029
  const monthsToShow = eachMonthOfInterval({
    start: new Date(2025, 9, 1), // October 2025
    end: new Date(2029, 11, 31)  // December 2029
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-center">Select Date</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {monthsToShow.map(month => renderMonth(month))}
        </div>

        <div className="flex-shrink-0 p-4 border-t">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
