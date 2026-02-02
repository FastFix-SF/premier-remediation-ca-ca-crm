import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BreakDurationPickerProps {
  value: string; // "HH:mm" format for duration
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const PRESET_MINUTES = [0, 5, 10, 15, 20, 30, 45, 60];

export const BreakDurationPicker: React.FC<BreakDurationPickerProps> = ({
  value,
  onConfirm,
  onCancel,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState(() => {
    if (value) {
      const [h, m] = value.split(':');
      return (parseInt(h) * 60) + parseInt(m || '0');
    }
    return 0;
  });

  const handleConfirm = () => {
    const hours = Math.floor(selectedMinutes / 60);
    const mins = selectedMinutes % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    onConfirm(timeString);
  };

  return (
    <div className="flex flex-col px-4 py-2">
      <p className="text-sm text-muted-foreground text-center mb-4">Select break duration</p>
      
      <div className="grid grid-cols-4 gap-2 mb-6">
        {PRESET_MINUTES.map((mins) => (
          <button
            key={mins}
            onClick={() => setSelectedMinutes(mins)}
            className={cn(
              "h-12 rounded-xl text-sm font-medium transition-all",
              selectedMinutes === mins
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-foreground hover:bg-muted"
            )}
          >
            {mins === 0 ? 'None' : mins === 60 ? '1 hr' : `${mins} min`}
          </button>
        ))}
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
