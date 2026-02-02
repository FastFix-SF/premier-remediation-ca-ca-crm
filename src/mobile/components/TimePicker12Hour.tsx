import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimePicker12HourProps {
  value: string; // 24-hour format "HH:mm"
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TimePicker12Hour: React.FC<TimePicker12HourProps> = ({
  value,
  onChange,
  placeholder = 'Select time'
}) => {
  // Parse 24-hour time to 12-hour components
  const parseTime = (time24: string) => {
    if (!time24) return { hour: '', minute: '', period: 'AM' };
    
    const [hourStr, minuteStr] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    
    if (hour === 0) hour = 12;
    else if (hour > 12) hour = hour - 12;
    
    return {
      hour: hour.toString(),
      minute: minuteStr || '00',
      period
    };
  };

  // Convert 12-hour to 24-hour format
  const to24Hour = (hour: string, minute: string, period: string) => {
    if (!hour || !minute) return '';
    
    let h = parseInt(hour, 10);
    if (period === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h = h + 12;
    }
    
    return `${h.toString().padStart(2, '0')}:${minute}`;
  };

  const { hour, minute, period } = parseTime(value);

  const handleChange = (type: 'hour' | 'minute' | 'period', newValue: string) => {
    const currentParsed = parseTime(value);
    let newHour = type === 'hour' ? newValue : currentParsed.hour || '12';
    let newMinute = type === 'minute' ? newValue : currentParsed.minute || '00';
    let newPeriod = type === 'period' ? newValue : currentParsed.period;
    
    const time24 = to24Hour(newHour, newMinute, newPeriod);
    onChange(time24);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = ['00', '15', '30', '45'];

  return (
    <div className="flex gap-1.5 xs:gap-2 sm:gap-2.5">
      <Select value={hour} onValueChange={(v) => handleChange('hour', v)}>
        <SelectTrigger className="h-10 xs:h-9 sm:h-10 text-sm xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 flex-1 min-w-0 touch-manipulation">
          <SelectValue placeholder="Hr" />
        </SelectTrigger>
        <SelectContent className="z-50">
          {hours.map((h) => (
            <SelectItem key={h} value={h} className="text-sm min-h-[44px] flex items-center">
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={minute} onValueChange={(v) => handleChange('minute', v)}>
        <SelectTrigger className="h-10 xs:h-9 sm:h-10 text-sm xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 flex-1 min-w-0 touch-manipulation">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent className="z-50">
          {minutes.map((m) => (
            <SelectItem key={m} value={m} className="text-sm min-h-[44px] flex items-center">
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={period} onValueChange={(v) => handleChange('period', v)}>
        <SelectTrigger className="h-10 xs:h-9 sm:h-10 text-sm xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 w-14 xs:w-14 sm:w-16 touch-manipulation">
          <SelectValue placeholder="AM" />
        </SelectTrigger>
        <SelectContent className="z-50">
          <SelectItem value="AM" className="text-sm min-h-[44px] flex items-center">AM</SelectItem>
          <SelectItem value="PM" className="text-sm min-h-[44px] flex items-center">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
