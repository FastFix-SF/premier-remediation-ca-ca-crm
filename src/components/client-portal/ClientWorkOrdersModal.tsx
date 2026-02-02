import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Wrench, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClientWorkOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

interface WorkOrder {
  id: string;
  work_order_number: string | null;
  title: string;
  status: string | null;
  service_start_date: string | null;
  description: string | null;
}

export const ClientWorkOrdersModal: React.FC<ClientWorkOrdersModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName
}) => {
  const { data: workOrders, isLoading } = useQuery({
    queryKey: ['client-work-orders', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('id, work_order_number, title, status, service_start_date, description')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkOrder[];
    },
    enabled: isOpen && !!projectId
  });

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'pending': return 'bg-amber-500/10 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-red-500/10 text-red-700 border-red-200';
    default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Work Orders
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
                  <div key={i} className="animate-pulse bg-muted rounded-lg h-20" />
                ))}
              </div>
            ) : workOrders?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No work orders</p>
              </div>
            ) : (
              workOrders?.map(wo => (
                <div key={wo.id} className="border rounded-lg p-3 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-sm">{wo.title}</h4>
                      {wo.work_order_number && (
                        <p className="text-xs text-muted-foreground">#{wo.work_order_number}</p>
                      )}
                    </div>
                    {wo.status && (
                      <Badge variant="outline" className={getStatusColor(wo.status)}>
                        {wo.status.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                  
                  {wo.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {wo.description}
                    </p>
                  )}

                  {wo.service_start_date && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Scheduled: {format(parseISO(wo.service_start_date), 'MMM d, yyyy')}</span>
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
