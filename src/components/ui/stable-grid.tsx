import React from 'react';
import { cn } from '@/lib/utils';

interface StableGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  minItemWidth?: string;
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4', 
  lg: 'gap-6',
  xl: 'gap-8'
};

export const StableGrid: React.FC<StableGridProps> = ({
  children,
  className,
  columns = { default: 1, lg: 2 },
  gap = 'lg',
  minItemWidth = '300px'
}) => {
  const gridClasses = Object.entries(columns)
    .map(([breakpoint, cols]) => {
      if (breakpoint === 'default') {
        return `grid-cols-${cols}`;
      }
      return `${breakpoint}:grid-cols-${cols}`;
    })
    .join(' ');

  return (
    <div 
      className={cn(
        'grid stable-grid',
        gridClasses,
        gapClasses[gap],
        className
      )}
      style={{
        gridTemplateColumns: columns.default === 1 
          ? '1fr' 
          : `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
      }}
    >
      {children}
    </div>
  );
};