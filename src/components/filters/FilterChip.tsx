
import React from 'react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  count?: number;
  className?: string;
}

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected = false,
  onClick,
  disabled = false,
  count,
  className,
}) => {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected
          ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
          : 'bg-background text-foreground border-border hover:bg-muted',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={cn(
            'text-xs',
            selected ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export default FilterChip;
