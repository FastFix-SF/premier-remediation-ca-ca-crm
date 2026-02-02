import React from 'react';
import { Badge } from '@/components/ui/badge';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  showZero?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  className = '',
  showZero = false
}) => {
  if (count === 0 && !showZero) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className={`h-5 min-w-5 text-xs px-1.5 rounded-full animate-pulse ${className}`}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
};