import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DailyLogEntry } from '@/hooks/useDailyLogs';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, FileText } from 'lucide-react';

interface DailyLogsListProps {
  logs: DailyLogEntry[];
  selectedLogId: string | null;
  onSelectLog: (logId: string) => void;
  isLoading?: boolean;
}

export const DailyLogsList: React.FC<DailyLogsListProps> = ({
  logs,
  selectedLogId,
  onSelectLog,
  isLoading,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-muted h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No daily logs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {logs.map((log) => (
        <button
          key={log.id}
          onClick={() => onSelectLog(log.id)}
          className={cn(
            'w-full text-left p-3 rounded-lg border transition-all hover:border-primary/50',
            selectedLogId === log.id
              ? 'bg-primary/10 border-primary'
              : 'bg-card border-border hover:bg-muted/50'
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="font-medium text-sm truncate">
              {log.project?.name || 'Unknown Project'}
            </span>
            <Badge variant="secondary" className={cn('text-xs shrink-0', getStatusColor(log.status))}>
              {log.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(log.log_date), 'MMM d, yyyy')}
            </span>
            {log.arrival_time && log.departure_time && (
              <span>
                {log.arrival_time.slice(0, 5)} - {log.departure_time.slice(0, 5)}
              </span>
            )}
          </div>
          {log.project?.address && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{log.project.address}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};
