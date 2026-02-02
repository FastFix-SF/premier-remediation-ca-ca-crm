import { useState } from 'react';
import { useExpenses, Expense } from '@/hooks/useExpenses';
import { ExpenseCard } from './ExpenseCard';
import { ExpenseDialog } from './ExpenseDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Loader2, Receipt } from 'lucide-react';

const EXPENSE_COLUMNS = [
  { key: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { key: 'approved', label: 'Approved', color: 'bg-blue-500' },
  { key: 'paid', label: 'Paid', color: 'bg-green-500' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

export const ExpensesManager = () => {
  const { expenses, isLoading, createExpense } = useExpenses();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExpenses = expenses?.filter((expense) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      expense.expense_name?.toLowerCase().includes(query) ||
      expense.vendor?.toLowerCase().includes(query) ||
      expense.expense_number?.toLowerCase().includes(query) ||
      expense.employee_name?.toLowerCase().includes(query)
    );
  });

  const getExpensesByStatus = (status: string) => {
    return filteredExpenses?.filter((e) => (e.status || 'pending') === status) || [];
  };

  const handleCreateExpense = async () => {
    const result = await createExpense.mutateAsync({
      expense_name: 'New Expense',
      status: 'pending',
      expense_type: 'material',
      expense_date: new Date().toISOString().split('T')[0],
    });
    setSelectedExpense(result);
    setDialogOpen(true);
  };

  const handleCardClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Expenses
          </h2>
          <p className="text-muted-foreground text-sm">
            {expenses?.length || 0} total expenses
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses..."
              className="pl-9"
            />
          </div>
          <Button onClick={handleCreateExpense} disabled={createExpense.isPending}>
            {createExpense.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Expense
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
          {EXPENSE_COLUMNS.map((column) => {
            const columnExpenses = getExpensesByStatus(column.key);
            return (
              <div key={column.key} className="flex flex-col bg-muted/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-medium text-sm">{column.label}</h3>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {columnExpenses.length}
                  </span>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-3 pr-2">
                    {columnExpenses.map((expense) => (
                      <ExpenseCard
                        key={expense.id}
                        expense={expense}
                        onClick={() => handleCardClick(expense)}
                      />
                    ))}
                    {columnExpenses.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No expenses
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog */}
      <ExpenseDialog
        expense={selectedExpense}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};
