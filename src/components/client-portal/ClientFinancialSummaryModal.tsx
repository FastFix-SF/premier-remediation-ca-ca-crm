import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClientFinancialSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

export const ClientFinancialSummaryModal: React.FC<ClientFinancialSummaryModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName
}) => {
  // Fetch estimates
  const { data: estimates } = useQuery({
    queryKey: ['client-financial-estimates', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_estimates')
        .select('grand_total, status')
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!projectId
  });

  // Fetch invoices
  const { data: invoices } = useQuery({
    queryKey: ['client-financial-invoices', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('total_amount, balance_due, status')
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!projectId
  });

  // Fetch change orders
  const { data: changeOrders } = useQuery({
    queryKey: ['client-financial-change-orders', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('change_orders')
        .select('grand_total, status')
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!projectId
  });

  // Calculate totals
  const approvedEstimates = estimates?.filter(e => e.status?.toLowerCase() === 'approved') || [];
  const contractValue = approvedEstimates.reduce((sum, e) => sum + (e.grand_total || 0), 0);
  
  const approvedCOs = changeOrders?.filter(co => co.status?.toLowerCase() === 'approved') || [];
  const changeOrderValue = approvedCOs.reduce((sum, co) => sum + (co.grand_total || 0), 0);
  
  const totalInvoiced = invoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0;
  const totalPaid = invoices?.reduce((sum, i) => sum + ((i.total_amount || 0) - (i.balance_due || 0)), 0) || 0;
  const balanceDue = totalInvoiced - totalPaid;

  const adjustedContractValue = contractValue + changeOrderValue;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isLoading = !estimates || !invoices || !changeOrders;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Financial Summary
          </DialogTitle>
          {projectName && (
            <p className="text-sm text-muted-foreground">{projectName}</p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse bg-muted rounded-lg h-16" />
                ))}
              </div>
            ) : (
              <>
                {/* Contract Value */}
                <Card className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Contract Value</p>
                        <p className="text-xl font-bold">{formatCurrency(contractValue)}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Change Orders */}
                {changeOrderValue > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Approved Change Orders</p>
                          <p className="text-lg font-semibold text-amber-600">
                            +{formatCurrency(changeOrderValue)}
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-amber-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Adjusted Total */}
                {changeOrderValue > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Adjusted Contract Value</p>
                          <p className="text-xl font-bold">{formatCurrency(adjustedContractValue)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Total Paid */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Paid</p>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <TrendingDown className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Balance Due */}
                <Card className={balanceDue > 0 ? 'border-red-200' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Balance Due</p>
                        <p className={`text-lg font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(balanceDue)}
                        </p>
                      </div>
                      {balanceDue > 0 && (
                        <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-red-600" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-semibold">{approvedEstimates.length}</p>
                    <p className="text-[10px] text-muted-foreground">Estimates</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-semibold">{approvedCOs.length}</p>
                    <p className="text-[10px] text-muted-foreground">Change Orders</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-semibold">{invoices?.length || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Invoices</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
