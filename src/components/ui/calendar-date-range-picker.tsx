import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarDateRangePickerProps {
  date?: {
    from: Date;
    to: Date;
  };
  onDateChange?: (range: { from: Date; to: Date }) => void;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export const CalendarDateRangePicker: React.FC<CalendarDateRangePickerProps> = ({
  date,
  onDateChange,
  align = 'start',
  className
}) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (range: any) => {
    if (range?.from && range?.to && onDateChange) {
      onDateChange({ from: range.from, to: range.to });
      setOpen(false);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-[260px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};