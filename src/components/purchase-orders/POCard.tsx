import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { format } from 'date-fns';
import { Building2, Calendar, DollarSign, MapPin } from 'lucide-react';

interface POCardProps {
  po: PurchaseOrder;
  onClick: () => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  pricing_requested: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  submitted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  received: 'bg-green-500/20 text-green-400 border-green-500/30',
  closed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  declined: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const POCard = ({ po, onClick }: POCardProps) => {
  const statusColor = statusColors[po.status || 'draft'] || statusColors.draft;

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-all duration-200 bg-card/50 backdrop-blur-sm border-border/50"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">
              {po.title}
            </h4>
            <p className="text-xs text-muted-foreground">
              {po.po_number}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          {po.supplier && (
            <div className="flex items-center gap-2">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{po.supplier}</span>
            </div>
          )}
          {po.ship_to && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{po.ship_to}</span>
            </div>
          )}
          {po.order_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(po.order_date), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
            <DollarSign className="h-4 w-4" />
            {((po.total_amount || 0) + (po.tax_amount || 0)).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          {po.is_billable && (
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
              Billable
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
