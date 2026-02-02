import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChangeOrder } from '@/hooks/useChangeOrders';
import { format } from 'date-fns';

interface ChangeOrderCardProps {
  order: ChangeOrder;
  onClick: () => void;
}

export function ChangeOrderCard({ order, onClick }: ChangeOrderCardProps) {
  const getInitials = (name?: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <Card 
      className="p-3 cursor-pointer hover:shadow-md transition-shadow bg-card"
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="font-medium text-sm line-clamp-2">{order.title}</div>
        
        {order.projects?.name && (
          <div className="text-xs text-muted-foreground line-clamp-1">
            {order.projects.name}
          </div>
        )}
        
        {order.directory_contacts?.company && (
          <div className="text-xs text-muted-foreground line-clamp-1">
            {order.directory_contacts.company}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-muted-foreground">
            {order.co_number}
          </div>
          {order.grand_total > 0 && (
            <div className="text-xs font-medium text-primary">
              {formatCurrency(order.grand_total)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {getInitials(order.requested_by)}
            </AvatarFallback>
          </Avatar>
          <div className="text-[10px] text-muted-foreground">
            {format(new Date(order.date), 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    </Card>
  );
}
