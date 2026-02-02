import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ClientInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  created_at: string;
  due_date: string | null;
  total_amount: number;
  balance_due: number | null;
  status: string;
  description: string | null;
  online_payment_enabled: boolean | null;
  paid_at: string | null;
}

export const ClientInvoicesModal: React.FC<ClientInvoicesModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName
}) => {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['client-invoices', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, created_at, due_date, total_amount, balance_due, status, description, online_payment_enabled, paid_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: isOpen && !!projectId
  });

  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return { 
          icon: CheckCircle, 
          color: 'bg-green-500/10 text-green-700 border-green-200',
          label: 'Paid'
        };
      case 'pending':
      case 'sent':
        return { 
          icon: Clock, 
          color: 'bg-amber-500/10 text-amber-700 border-amber-200',
          label: 'Pending'
        };
      case 'overdue':
        return { 
          icon: AlertCircle, 
          color: 'bg-red-500/10 text-red-700 border-red-200',
          label: 'Overdue'
        };
      case 'draft':
        return { 
          icon: FileText, 
          color: 'bg-muted text-muted-foreground',
          label: 'Draft'
        };
      default:
        return { 
          icon: FileText, 
          color: 'bg-muted text-muted-foreground',
          label: status || 'Unknown'
        };
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalDue = invoices?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;
  const totalPaid = invoices?.reduce((sum, inv) => {
    const paid = (inv.total_amount || 0) - (inv.balance_due || 0);
    return sum + Math.max(0, paid);
  }, 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Invoices
          </DialogTitle>
          {projectName && (
            <p className="text-sm text-muted-foreground">{projectName}</p>
          )}
        </DialogHeader>

        {/* Summary */}
        {invoices && invoices.length > 0 && (
          <div className="px-4 py-3 bg-muted/30 border-b grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance Due</p>
              <p className={cn(
                "text-lg font-semibold",
                totalDue > 0 ? "text-amber-600" : "text-muted-foreground"
              )}>
                {formatCurrency(totalDue)}
              </p>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-[55vh]">
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-muted rounded-lg h-20" />
                ))}
              </div>
            ) : invoices?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No invoices yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices?.map(invoice => {
                  const statusInfo = getStatusInfo(invoice.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div 
                      key={invoice.id} 
                      className="border rounded-lg p-4 bg-card"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-medium text-sm">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(invoice.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn("flex items-center gap-1", statusInfo.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      
                      {invoice.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                          {invoice.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-semibold">{formatCurrency(invoice.total_amount)}</p>
                        </div>
                        {invoice.status !== 'paid' && invoice.balance_due && invoice.balance_due > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Balance Due</p>
                            <p className="font-semibold text-amber-600">{formatCurrency(invoice.balance_due)}</p>
                          </div>
                        )}
                      </div>

                      {invoice.due_date && invoice.status !== 'paid' && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Due: {format(parseISO(invoice.due_date), 'MMM d, yyyy')}
                        </p>
                      )}

                      {invoice.online_payment_enabled && invoice.status !== 'paid' && invoice.balance_due && invoice.balance_due > 0 && (
                        <Button className="w-full mt-3" size="sm">
                          Pay Now
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
