import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { FileSpreadsheet, DollarSign, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClientEstimatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

interface Estimate {
  id: string;
  estimate_number: string | null;
  title: string | null;
  status: string | null;
  grand_total: number | null;
  created_at: string;
  expiration_date: string | null;
}

export const ClientEstimatesModal: React.FC<ClientEstimatesModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName
}) => {
  const { data: estimates, isLoading } = useQuery({
    queryKey: ['client-estimates', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_estimates')
        .select('id, estimate_number, title, status, grand_total, created_at, expiration_date')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Estimate[];
    },
    enabled: isOpen && !!projectId
  });

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'sent': return 'bg-blue-500/10 text-blue-700 border-blue-200';
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
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Estimates
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
            ) : estimates?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No estimates available</p>
              </div>
            ) : (
              estimates?.map(estimate => (
                <div key={estimate.id} className="border rounded-lg p-3 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-sm">{estimate.title || 'Untitled Estimate'}</h4>
                      {estimate.estimate_number && (
                        <p className="text-xs text-muted-foreground">#{estimate.estimate_number}</p>
                      )}
                    </div>
                    {estimate.status && (
                      <Badge variant="outline" className={getStatusColor(estimate.status)}>
                        {estimate.status}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(parseISO(estimate.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-sm">
                      <DollarSign className="h-4 w-4 text-primary" />
                      {formatCurrency(estimate.grand_total)}
                    </div>
                  </div>

                  {estimate.expiration_date && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Valid until: {format(parseISO(estimate.expiration_date), 'MMM d, yyyy')}
                    </p>
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
