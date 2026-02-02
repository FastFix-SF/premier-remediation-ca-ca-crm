import { useState, useEffect } from 'react';
import { Bill, useUpdateBill, useDeleteBill } from '@/hooks/useBills';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileText, CreditCard, Paperclip, StickyNote, Trash2, CheckCircle } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { toast } from 'sonner';
import { BillDetailsTab } from './tabs/BillDetailsTab';
import { BillPaymentsTab } from './tabs/BillPaymentsTab';
import { BillFilesTab } from './tabs/BillFilesTab';
import { BillNotesTab } from './tabs/BillNotesTab';
import { isAfter } from 'date-fns';

interface BillDialogProps {
  bill: Bill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillDialog({ bill, open, onOpenChange }: BillDialogProps) {
  const [localBill, setLocalBill] = useState<Bill | null>(bill);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const updateBill = useUpdateBill();
  const deleteBill = useDeleteBill();

  useEffect(() => {
    setLocalBill(bill);
  }, [bill]);

  const debouncedSave = useDebouncedCallback(async (data: Partial<Bill>) => {
    if (!localBill?.id) return;
    try {
      await updateBill.mutateAsync({ id: localBill.id, ...data });
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error('Failed to save changes');
    }
  }, 500);

  const handleChange = (field: keyof Bill, value: any) => {
    if (!localBill) return;
    const updated = { ...localBill, [field]: value };
    setLocalBill(updated);
    debouncedSave({ [field]: value });
  };

  const handleDelete = async () => {
    if (!localBill?.id) return;
    try {
      await deleteBill.mutateAsync(localBill.id);
      toast.success('Bill deleted');
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete bill');
    }
  };

  const getStatusBadge = () => {
    if (!localBill) return null;
    const today = new Date();
    const isOverdue = localBill.due_date && isAfter(today, new Date(localBill.due_date)) && localBill.status !== 'paid';
    
    if (localBill.status === 'paid') {
      return <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle className="w-3 h-3" /> Paid</Badge>;
    }
    if (localBill.status === 'void') {
      return <Badge variant="secondary">Void</Badge>;
    }
    if (isOverdue) {
      return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
    }
    if (localBill.status === 'partial') {
      return <Badge className="bg-yellow-100 text-yellow-700">Partial</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-700">Open</Badge>;
  };

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  if (!localBill) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getStatusBadge()}
                <span className="text-sm text-muted-foreground">{localBill.bill_number}</span>
              </div>
              <DialogTitle className="text-xl">
                {localBill.vendor_name || 'Untitled Bill'}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-muted-foreground">Balance Due:</span>
                <span className="font-semibold text-lg">{formatCurrency(localBill.balance_due)}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details" className="gap-2">
                <FileText className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-2">
                <Paperclip className="h-4 w-4" />
                Files
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <StickyNote className="h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <BillDetailsTab bill={localBill} onChange={handleChange} />
            </TabsContent>
            <TabsContent value="payments" className="mt-4">
              <BillPaymentsTab bill={localBill} />
            </TabsContent>
            <TabsContent value="files" className="mt-4">
              <BillFilesTab bill={localBill} />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <BillNotesTab bill={localBill} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bill? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
