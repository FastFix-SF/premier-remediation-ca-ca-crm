import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Payment } from '@/hooks/usePayments';
import { format } from 'date-fns';

interface PaymentCardProps {
  payment: Payment;
  onClick: () => void;
}

export function PaymentCard({ payment, onClick }: PaymentCardProps) {
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
          <p className="font-semibold text-sm truncate">{payment.customer_name}</p>
          <span className="text-xs text-muted-foreground shrink-0">
            {format(new Date(payment.payment_date), 'MM/dd/yyyy')}
          </span>
        </div>
        {payment.invoice_number && (
          <p className="text-xs text-muted-foreground">
            Inv. #{payment.invoice_number}
          </p>
        )}
        {payment.address && (
          <p className="text-xs text-muted-foreground truncate">
            {payment.address}
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <p className="font-bold text-primary">
            {formatCurrency(payment.amount)}
          </p>
          <Badge variant="outline" className="text-xs capitalize">
            {payment.payment_type}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
