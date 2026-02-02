import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, DollarSign, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClientChangeOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

interface ChangeOrder {
  id: string;
  co_number: string | null;
  title: string;
  status: string;
  grand_total: number | null;
  date: string;
  description: string | null;
}

export const ClientChangeOrdersModal: React.FC<ClientChangeOrdersModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName
}) => {
  const { data: changeOrders, isLoading } = useQuery({
    queryKey: ['client-change-orders', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('change_orders')
        .select('id, co_number, title, status, grand_total, date, description')
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as ChangeOrder[];
    },
    enabled: isOpen && !!projectId
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'pending': return 'bg-amber-500/10 text-amber-700 border-amber-200';
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'rejected': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Change Orders
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
            ) : changeOrders?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No change orders</p>
              </div>
            ) : (
              changeOrders?.map(co => (
                <div key={co.id} className="border rounded-lg p-3 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-sm">{co.title}</h4>
                      {co.co_number && (
                        <p className="text-xs text-muted-foreground">#{co.co_number}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={getStatusColor(co.status)}>
                      {co.status}
                    </Badge>
                  </div>
                  
                  {co.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {co.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(parseISO(co.date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-sm">
                      <DollarSign className="h-4 w-4 text-primary" />
                      {formatCurrency(co.grand_total)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
