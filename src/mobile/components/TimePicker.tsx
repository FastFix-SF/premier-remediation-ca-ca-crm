import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  value: string; // Format: "HH:mm"
  onSelect: (time: string) => void;
  title?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  isOpen,
  onClose,
  value,
  onSelect,
  title = 'Select Time'
}) => {
  const [hours, setHours] = useState('08');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      const hour24 = parseInt(h);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      setHours(hour12.toString().padStart(2, '0'));
      setMinutes(m);
      setPeriod(hour24 >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  const handleConfirm = () => {
    let hour24 = parseInt(hours);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    const timeString = `${hour24.toString().padStart(2, '0')}:${minutes}`;
    onSelect(timeString);
    onClose();
  };

  const scrollToItem = (ref: React.RefObject<HTMLDivElement>, index: number) => {
    if (ref.current) {
      const item = ref.current.children[index] as HTMLElement;
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const hoursArray = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutesArray = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="text-center">{title}</SheetTitle>
        </SheetHeader>
        
        <div className="flex items-center justify-center gap-2 my-6">
          {/* Hours */}
          <div className="relative h-48 w-20 overflow-hidden">
            <div 
              ref={hoursRef}
              className="h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
              onScroll={(e) => {
                const scrollTop = e.currentTarget.scrollTop;
                const itemHeight = 48;
                const index = Math.round(scrollTop / itemHeight);
                setHours(hoursArray[index]);
              }}
            >
              <div className="h-20" />
              {hoursArray.map((hour) => (
                <div
                  key={hour}
                  className={cn(
                    "h-12 flex items-center justify-center text-2xl font-medium snap-center transition-all cursor-pointer",
                    hour === hours ? "text-primary scale-110" : "text-muted-foreground"
                  )}
                  onClick={() => {
                    setHours(hour);
                    scrollToItem(hoursRef, hoursArray.indexOf(hour));
                  }}
                >
                  {hour}
                </div>
              ))}
              <div className="h-20" />
            </div>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
              <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 border-y border-border/50" />
            </div>
          </div>

          <span className="text-3xl font-bold text-primary">:</span>

          {/* Minutes */}
          <div className="relative h-48 w-20 overflow-hidden">
            <div 
              ref={minutesRef}
              className="h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
              onScroll={(e) => {
                const scrollTop = e.currentTarget.scrollTop;
                const itemHeight = 48;
                const index = Math.round(scrollTop / itemHeight);
                setMinutes(minutesArray[index]);
              }}
            >
              <div className="h-20" />
              {minutesArray.map((minute) => (
                <div
                  key={minute}
                  className={cn(
                    "h-12 flex items-center justify-center text-2xl font-medium snap-center transition-all cursor-pointer",
                    minute === minutes ? "text-primary scale-110" : "text-muted-foreground"
                  )}
                  onClick={() => {
                    setMinutes(minute);
                    scrollToItem(minutesRef, minutesArray.indexOf(minute));
                  }}
                >
                  {minute}
                </div>
              ))}
              <div className="h-20" />
            </div>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
              <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 border-y border-border/50" />
            </div>
          </div>

          {/* AM/PM */}
          <div className="flex flex-col gap-2 ml-2">
            <Button
              variant={period === 'AM' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('AM')}
              className="h-10 w-16"
            >
              AM
            </Button>
            <Button
              variant={period === 'PM' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('PM')}
              className="h-10 w-16"
            >
              PM
            </Button>
          </div>
        </div>

        <div className="flex gap-3 pb-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
