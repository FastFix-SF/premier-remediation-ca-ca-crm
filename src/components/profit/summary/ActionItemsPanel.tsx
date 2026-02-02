import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckSquare, 
  ClipboardCheck, 
  FileWarning,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionItemsPanelProps {
  openPunchlists: number;
  pendingInspections: number;
  pendingChangeOrders: number;
  overdueItems: number;
  onItemClick?: (type: string) => void;
}

export const ActionItemsPanel: React.FC<ActionItemsPanelProps> = ({
  openPunchlists,
  pendingInspections,
  pendingChangeOrders,
  overdueItems,
  onItemClick
}) => {
  const totalItems = openPunchlists + pendingInspections + pendingChangeOrders;
  const hasUrgentItems = overdueItems > 0;

  const actionItems = [
    {
      key: 'punchlists',
      label: 'Open Punchlists',
      count: openPunchlists,
      icon: CheckSquare,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-200',
    },
    {
      key: 'inspections',
      label: 'Pending Inspections',
      count: pendingInspections,
      icon: ClipboardCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-200',
    },
    {
      key: 'change_orders',
      label: 'Pending Change Orders',
      count: pendingChangeOrders,
      icon: FileWarning,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <Card className="relative overflow-hidden">
      {hasUrgentItems && (
        <div className="absolute top-0 right-0 p-2">
          <Badge variant="destructive" className="animate-pulse">
            <AlertCircle className="h-3 w-3 mr-1" />
            {overdueItems} Overdue
          </Badge>
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Action Items
          {totalItems > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalItems} Total
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
              <CheckSquare className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-600">All Clear!</p>
            <p className="text-xs text-muted-foreground">No pending action items</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actionItems.map((item) => {
              const Icon = item.icon;
              if (item.count === 0) return null;
              
              return (
                <button
                  key={item.key}
                  onClick={() => onItemClick?.(item.key)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                    "hover:scale-[1.02] hover:shadow-md",
                    item.bgColor,
                    item.borderColor
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", item.bgColor)}>
                      <Icon className={cn("h-4 w-4", item.color)} />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn("font-bold", item.color, item.bgColor)}
                  >
                    {item.count}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
