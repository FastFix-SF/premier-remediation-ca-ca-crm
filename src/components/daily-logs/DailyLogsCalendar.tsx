import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { DailyLogEntry } from '@/hooks/useDailyLogs';
import { format } from 'date-fns';

interface DailyLogsCalendarProps {
  logs: DailyLogEntry[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

export const DailyLogsCalendar: React.FC<DailyLogsCalendarProps> = ({
  logs,
  selectedDate,
  onSelectDate,
}) => {
  // Get dates that have logs
  const logDates = logs.map((log) => format(new Date(log.log_date), 'yyyy-MM-dd'));

  const modifiers = {
    hasLog: (date: Date) => logDates.includes(format(date, 'yyyy-MM-dd')),
  };

  const modifiersStyles = {
    hasLog: {
      position: 'relative' as const,
    },
  };

  return (
    <div className="bg-card border rounded-lg p-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        className="rounded-md pointer-events-auto"
        components={{
          DayContent: ({ date }) => {
            const hasLog = logDates.includes(format(date, 'yyyy-MM-dd'));
            return (
              <div className="relative w-full h-full flex items-center justify-center">
                <span>{date.getDate()}</span>
                {hasLog && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
            );
          },
        }}
      />
    </div>
  );
};
