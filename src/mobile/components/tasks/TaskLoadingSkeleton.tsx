import React from 'react';

export const TaskLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i} 
          className="relative bg-card/80 backdrop-blur-sm border border-l-4 border-l-muted rounded-2xl p-4 overflow-hidden"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          
          <div className="flex gap-3">
            <div className="flex-1 space-y-3">
              {/* Title skeleton */}
              <div className="flex items-start justify-between gap-2">
                <div className="h-5 bg-muted/60 rounded-lg w-3/4 animate-pulse" />
                <div className="h-5 w-10 bg-muted/60 rounded-full animate-pulse" />
              </div>
              
              {/* Status badge skeleton */}
              <div className="h-6 w-24 bg-muted/60 rounded-full animate-pulse" />
              
              {/* Meta row skeleton */}
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-muted/60 rounded-full animate-pulse" />
                <div className="h-5 w-5 bg-muted/60 rounded-full animate-pulse" />
                <div className="h-5 w-20 bg-muted/60 rounded-full animate-pulse" />
              </div>
            </div>
            
            {/* Chevron skeleton */}
            <div className="w-5 h-5 bg-muted/40 rounded animate-pulse mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskLoadingSkeleton;
