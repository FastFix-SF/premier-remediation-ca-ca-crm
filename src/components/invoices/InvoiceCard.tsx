import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Invoice } from '@/hooks/useInvoices';

interface InvoiceCardProps {
  invoice: Invoice;
  onClick: () => void;
}

export function InvoiceCard({ invoice, onClick }: InvoiceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm truncate">{invoice.customer_name}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Inv. #{invoice.invoice_number}
        </p>
        {invoice.address && (
          <p className="text-xs text-muted-foreground truncate">
            {invoice.address}
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <p className="font-bold text-primary">
            {formatCurrency(invoice.total_amount)}
          </p>
          {invoice.balance_due > 0 && invoice.balance_due < invoice.total_amount && (
            <Badge variant="outline" className="text-xs">
              Due: {formatCurrency(invoice.balance_due)}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
