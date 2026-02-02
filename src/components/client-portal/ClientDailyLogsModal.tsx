import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardList, Calendar, Cloud, Sun, CloudRain } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClientDailyLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

interface DailyLog {
  id: string;
  log_date: string;
  status: string | null;
  arrival_time: string | null;
  departure_time: string | null;
  tasks_performed: string | null;
  site_condition: string | null;
  weather_data: { condition?: string; temperature?: number } | null;
}

export const ClientDailyLogsModal: React.FC<ClientDailyLogsModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName
}) => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['client-daily-logs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_log_entries')
        .select('id, log_date, status, arrival_time, departure_time, tasks_performed, site_condition, weather_data')
        .eq('project_id', projectId)
        .order('log_date', { ascending: false });

      if (error) throw error;
      return data as DailyLog[];
    },
    enabled: isOpen && !!projectId
  });

  const getWeatherIcon = (condition: string | undefined) => {
    if (!condition) return <Cloud className="h-4 w-4" />;
    const lower = condition.toLowerCase();
    if (lower.includes('rain') || lower.includes('storm')) return <CloudRain className="h-4 w-4" />;
    if (lower.includes('sun') || lower.includes('clear')) return <Sun className="h-4 w-4" />;
    return <Cloud className="h-4 w-4" />;
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Daily Logs
          </DialogTitle>
          {projectName && (
            <p className="text-sm text-muted-foreground">{projectName}</p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-muted rounded-lg h-24" />
                ))}
              </div>
            ) : logs?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No daily logs recorded yet</p>
              </div>
            ) : (
              logs?.map(log => (
                <div key={log.id} className="border rounded-lg p-3 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {format(parseISO(log.log_date), 'EEEE, MMM d, yyyy')}
                      </span>
                    </div>
                    {log.status && (
                      <Badge variant="outline" className={getStatusColor(log.status)}>
                        {log.status.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                  
                  {log.weather_data && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      {getWeatherIcon(log.weather_data.condition)}
                      <span>{log.weather_data.condition}</span>
                      {log.weather_data.temperature && (
                        <span>• {log.weather_data.temperature}°F</span>
                      )}
                    </div>
                  )}

                  {log.tasks_performed && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-3">
                      {log.tasks_performed}
                    </p>
                  )}

                  {(log.arrival_time || log.departure_time) && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {log.arrival_time && <span>In: {log.arrival_time}</span>}
                      {log.arrival_time && log.departure_time && <span> • </span>}
                      {log.departure_time && <span>Out: {log.departure_time}</span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
