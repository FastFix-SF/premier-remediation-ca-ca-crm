import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Expense } from '@/hooks/useExpenses';
import { format } from 'date-fns';
import { Store, Calendar, DollarSign, User, Receipt } from 'lucide-react';

interface ExpenseCardProps {
  expense: Expense;
  onClick: () => void;
}

const typeColors: Record<string, string> = {
  material: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  equipment: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  labor: 'bg-green-500/20 text-green-400 border-green-500/30',
  subcontractor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export const ExpenseCard = ({ expense, onClick }: ExpenseCardProps) => {
  const typeColor = typeColors[expense.expense_type || 'other'] || typeColors.other;

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-all duration-200 bg-card/50 backdrop-blur-sm border-border/50"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">
              {expense.expense_name}
            </h4>
            <p className="text-xs text-muted-foreground">
              {expense.expense_number}
            </p>
          </div>
          <Badge variant="outline" className={`${typeColor} text-xs shrink-0`}>
            {expense.expense_type || 'other'}
          </Badge>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          {expense.vendor && (
            <div className="flex items-center gap-2">
              <Store className="h-3 w-3" />
              <span className="truncate">{expense.vendor}</span>
            </div>
          )}
          {expense.employee_name && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span className="truncate">{expense.employee_name}</span>
            </div>
          )}
          {expense.expense_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(expense.expense_date), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
            <DollarSign className="h-4 w-4" />
            {(expense.amount || 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          {expense.is_billable && (
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
              <Receipt className="h-3 w-3 mr-1" />
              Billable
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
