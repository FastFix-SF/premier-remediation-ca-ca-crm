import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusPipelineProps {
  currentStatus: string;
  onStatusClick?: (status: string) => void;
}

const PROJECT_STAGES = [
  { key: 'pending', label: 'Pending', color: 'bg-slate-400' },
  { key: 'approved', label: 'Approved', color: 'bg-blue-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-amber-500' },
  { key: 'completed', label: 'Completed', color: 'bg-green-500' },
  { key: 'warranty', label: 'Warranty', color: 'bg-purple-500' },
];

export const StatusPipeline: React.FC<StatusPipelineProps> = ({
  currentStatus,
  onStatusClick
}) => {
  const currentIndex = PROJECT_STAGES.findIndex(
    s => s.key === currentStatus?.toLowerCase().replace(' ', '_')
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full" />
        
        {/* Active progress line */}
        <div 
          className="absolute top-5 left-0 h-1 bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
          style={{ 
            width: `${Math.max(0, (currentIndex / (PROJECT_STAGES.length - 1)) * 100)}%` 
          }}
        />
        
        {/* Stage circles */}
        {PROJECT_STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div
              key={stage.key}
              className="relative z-10 flex flex-col items-center"
            >
              <button
                onClick={() => onStatusClick?.(stage.key)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  "border-2 shadow-sm hover:scale-110",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && `${stage.color} border-white shadow-lg ring-4 ring-primary/20 text-white`,
                  isPending && "bg-muted border-muted-foreground/20 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : isCurrent ? (
                  <Clock className="h-5 w-5 animate-pulse" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>
              <span 
                className={cn(
                  "mt-2 text-xs font-medium text-center whitespace-nowrap",
                  isCurrent && "text-foreground font-semibold",
                  !isCurrent && "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
