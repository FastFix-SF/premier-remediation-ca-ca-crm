import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Expense, useExpenses } from '@/hooks/useExpenses';
import { ExpenseStatusStepper } from './ExpenseStatusStepper';
import { ExpenseDetailsTab } from './tabs/ExpenseDetailsTab';
import { ExpenseNotesTab } from './tabs/ExpenseNotesTab';
import { ExpenseFilesTab } from './tabs/ExpenseFilesTab';
import { format } from 'date-fns';
import { FileText, MessageSquare, Calendar, Trash2, Files } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExpenseDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExpenseDialog = ({ expense, open, onOpenChange }: ExpenseDialogProps) => {
  const { updateExpense, deleteExpense } = useExpenses();
  const [localExpense, setLocalExpense] = useState<Expense | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    if (expense) {
      setLocalExpense({ ...expense });
    }
  }, [expense]);

  const debouncedSave = useDebouncedCallback(
    (updates: Partial<Expense>) => {
      if (localExpense?.id) {
        updateExpense.mutate({ id: localExpense.id, ...updates });
      }
    },
    500
  );

  const handleChange = useCallback(
    (field: keyof Expense, value: any) => {
      if (!localExpense) return;
      const updated = { ...localExpense, [field]: value };
      setLocalExpense(updated);
      debouncedSave({ [field]: value });
    },
    [localExpense, debouncedSave]
  );

  const handleStatusChange = (status: string) => {
    if (!localExpense) return;
    const updated = { ...localExpense, status };
    setLocalExpense(updated);
    updateExpense.mutate({ id: localExpense.id, status });
  };

  const handleDelete = () => {
    if (!localExpense) return;
    deleteExpense.mutate(localExpense.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!localExpense) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {localExpense.expense_name}
                </DialogTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  {localExpense.vendor && (
                    <span>{localExpense.vendor}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {localExpense.expense_date
                      ? format(new Date(localExpense.expense_date), 'MMM d, yyyy')
                      : 'No date'}
                  </span>
                  <span>{localExpense.expense_number}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setShowDeleteAlert(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <ExpenseStatusStepper
              currentStatus={localExpense.status || 'pending'}
              onStatusChange={handleStatusChange}
            />
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2">
                <Files className="h-4 w-4" />
                Files
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <ExpenseDetailsTab expense={localExpense} onChange={handleChange} />
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <ExpenseFilesTab expenseId={localExpense.id} />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <ExpenseNotesTab expenseId={localExpense.id} />
            </TabsContent>
          </Tabs>

          <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
            Created: {format(new Date(localExpense.created_at), 'MMM d, yyyy h:mm a')}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
