import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClientScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

interface ScheduleItem {
  id: string;
  job_name: string;
  start_time: string;
  end_time: string;
  status: string;
  location: string | null;
  description: string | null;
}

export const ClientScheduleModal: React.FC<ClientScheduleModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName
}) => {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['client-schedule', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_schedules')
        .select('id, job_name, start_time, end_time, status, location, description')
        .eq('project_id', projectId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as ScheduleItem[];
    },
    enabled: isOpen && !!projectId
  });

  const today = startOfDay(new Date());
  const upcomingSchedules = schedules?.filter(s => 
    isAfter(parseISO(s.start_time), today) || s.status === 'scheduled'
  ) || [];
  const pastSchedules = schedules?.filter(s => 
    isBefore(parseISO(s.end_time), today) && s.status !== 'scheduled'
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'scheduled': return 'bg-amber-500/10 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatStatus = (status: string) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Scheduled';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Project Schedule
          </DialogTitle>
          {projectName && (
            <p className="text-sm text-muted-foreground">{projectName}</p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-muted rounded-lg h-24" />
                ))}
              </div>
            ) : schedules?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No scheduled activities yet</p>
              </div>
            ) : (
              <>
                {/* Upcoming */}
                {upcomingSchedules.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Upcoming</h3>
                    <div className="space-y-2">
                      {upcomingSchedules.map(item => (
                        <div key={item.id} className="border rounded-lg p-3 bg-card">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm">{item.job_name}</h4>
                            <Badge variant="outline" className={getStatusColor(item.status)}>
                              {formatStatus(item.status)}
                            </Badge>
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              <span>
                                {format(parseISO(item.start_time), 'MMM d, yyyy')} at {format(parseISO(item.start_time), 'h:mm a')}
                              </span>
                            </div>
                            {item.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{item.location}</span>
                              </div>
                            )}
                          </div>
                          {item.description && (
                            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed */}
                {pastSchedules.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Completed</h3>
                    <div className="space-y-2">
                      {pastSchedules.slice(0, 5).map(item => (
                        <div key={item.id} className="border rounded-lg p-3 bg-muted/30">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm text-muted-foreground">{item.job_name}</h4>
                            <Badge variant="outline" className={getStatusColor(item.status)}>
                              {formatStatus(item.status)}
                            </Badge>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {format(parseISO(item.start_time), 'MMM d, yyyy')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
