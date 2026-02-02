import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, FileText, Plus, Minus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractSummaryCardProps {
  originalContract: number;
  approvedChangeOrders: number;
  pendingChangeOrders: number;
  revisedContract: number;
  retention: number;
  retentionAmount: number;
}

export const ContractSummaryCard: React.FC<ContractSummaryCardProps> = ({
  originalContract,
  approvedChangeOrders,
  pendingChangeOrders,
  revisedContract,
  retention,
  retentionAmount
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Contract Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original Contract */}
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Original Contract</span>
          </div>
          <span className="font-semibold">{formatCurrency(originalContract)}</span>
        </div>

        {/* Approved Change Orders */}
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Plus className={cn("h-4 w-4", approvedChangeOrders >= 0 ? "text-green-600" : "text-destructive")} />
            <span className="text-sm text-muted-foreground">Approved COs</span>
          </div>
          <span className={cn("font-semibold", approvedChangeOrders >= 0 ? "text-green-600" : "text-destructive")}>
            {approvedChangeOrders >= 0 ? '+' : ''}{formatCurrency(approvedChangeOrders)}
          </span>
        </div>

        {/* Pending Change Orders (if any) */}
        {pendingChangeOrders !== 0 && (
          <div className="flex items-center justify-between py-2 border-b border-border/50 bg-amber-500/5 -mx-4 px-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">Pending COs</span>
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                Unapproved
              </Badge>
            </div>
            <span className="font-semibold text-amber-600">
              {pendingChangeOrders >= 0 ? '+' : ''}{formatCurrency(pendingChangeOrders)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t-2 border-primary/20 pt-2" />

        {/* Revised Contract Total */}
        <div className="flex items-center justify-between py-2 bg-primary/5 -mx-4 px-4 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Revised Contract</span>
          </div>
          <span className="text-xl font-bold text-primary">{formatCurrency(revisedContract)}</span>
        </div>

        {/* Retention */}
        <div className="flex items-center justify-between py-2 text-sm">
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Retention ({retention}%)</span>
          </div>
          <span className="text-muted-foreground">-{formatCurrency(retentionAmount)}</span>
        </div>

        {/* Net Contract (after retention) */}
        <div className="flex items-center justify-between py-2 border-t border-border/50">
          <span className="text-sm font-medium">Net Billable</span>
          <span className="font-semibold">{formatCurrency(revisedContract - retentionAmount)}</span>
        </div>
      </CardContent>
    </Card>
  );
};
