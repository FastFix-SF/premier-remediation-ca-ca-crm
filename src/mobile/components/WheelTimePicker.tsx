import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WheelTimePickerProps {
  value: string; // 24-hour format "HH:mm"
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const WheelTimePicker: React.FC<WheelTimePickerProps> = ({
  value,
  onConfirm,
  onCancel,
}) => {
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  const hoursArray = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutesArray = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periodArray = ['AM', 'PM'];

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      const hour24 = parseInt(h);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      setHours(hour12.toString());
      setMinutes(m || '00');
      setPeriod(hour24 >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  useEffect(() => {
    // Scroll to initial position after mount
    const scrollToPosition = () => {
      if (hoursRef.current) {
        const index = hoursArray.indexOf(hours);
        hoursRef.current.scrollTop = index * 36;
      }
      if (minutesRef.current) {
        const index = minutesArray.indexOf(minutes);
        minutesRef.current.scrollTop = index * 36;
      }
      if (periodRef.current) {
        const index = periodArray.indexOf(period);
        periodRef.current.scrollTop = index * 36;
      }
    };
    
    requestAnimationFrame(scrollToPosition);
  }, [hours, minutes, period]);

  const handleConfirm = () => {
    let hour24 = parseInt(hours);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    const timeString = `${hour24.toString().padStart(2, '0')}:${minutes}`;
    onConfirm(timeString);
  };

  const handleScroll = (ref: React.RefObject<HTMLDivElement>, items: string[], setter: (val: string) => void) => {
    if (ref.current) {
      const scrollTop = ref.current.scrollTop;
      const itemHeight = 36;
      const index = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
      setter(items[clampedIndex]);
    }
  };

  const renderWheelColumn = (
    items: string[], 
    currentValue: string, 
    onChange: (val: string) => void,
    columnRef: React.RefObject<HTMLDivElement>,
    width = 'w-14'
  ) => (
    <div className={`relative h-[144px] ${width} overflow-hidden`}>
      <div 
        ref={columnRef}
        className="h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory touch-pan-y"
        onScroll={() => handleScroll(columnRef, items, onChange)}
      >
        <div className="h-[54px]" />
        {items.map((item) => (
          <div
            key={item}
            onClick={() => onChange(item)}
            className={cn(
              "h-9 flex items-center justify-center text-lg font-medium snap-center transition-all cursor-pointer",
              item === currentValue ? "text-foreground" : "text-muted-foreground/40"
            )}
          >
            {item}
          </div>
        ))}
        <div className="h-[54px]" />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[54px] bg-gradient-to-b from-background to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[54px] bg-gradient-to-t from-background to-transparent" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col px-2">
      <div className="relative flex items-center justify-center gap-0 py-2">
        {renderWheelColumn(hoursArray, hours, setHours, hoursRef)}
        <span className="text-lg font-medium text-muted-foreground mx-0.5">:</span>
        {renderWheelColumn(minutesArray, minutes, setMinutes, minutesRef)}
        {renderWheelColumn(periodArray, period, (val) => setPeriod(val as 'AM' | 'PM'), periodRef)}
        
        {/* Selection indicator */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-9 border-y border-border/20 pointer-events-none" />
      </div>

      <div className="flex gap-2 pt-2 pb-4">
        <Button
          variant="outline"
          className="flex-1 h-10 rounded-xl text-sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 h-10 rounded-xl text-[#0891b2] bg-transparent hover:bg-[#0891b2]/10 border-0 font-medium text-sm"
          onClick={handleConfirm}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};
