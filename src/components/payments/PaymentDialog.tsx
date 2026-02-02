import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, MessageSquare, Files } from 'lucide-react';
import { PaymentStatusStepper } from './PaymentStatusStepper';
import { PaymentDetailsTab } from './tabs/PaymentDetailsTab';
import { PaymentNotesTab } from './tabs/PaymentNotesTab';
import { PaymentFilesTab } from './tabs/PaymentFilesTab';
import { Payment, useCreatePayment, useUpdatePayment, useDeletePayment } from '@/hooks/usePayments';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
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

interface PaymentDialogProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  isNew?: boolean;
}

export function PaymentDialog({ payment, isOpen, onClose, isNew = false }: PaymentDialogProps) {
  const [localPayment, setLocalPayment] = useState<Partial<Payment>>({});
  const [activeTab, setActiveTab] = useState('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();

  useEffect(() => {
    if (payment) {
      setLocalPayment(payment);
      setIsSaved(true);
    } else if (isNew) {
      setLocalPayment({
        status: 'received',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_type: 'check',
        amount: 0
      });
      setIsSaved(false);
    }
  }, [payment, isNew]);

  const handleFieldChange = (field: keyof Payment, value: any) => {
    setLocalPayment(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = async (status: string) => {
    handleFieldChange('status', status);
    if (localPayment.id) {
      await updatePayment.mutateAsync({ id: localPayment.id, status });
    }
  };

  const handleSave = async () => {
    if (!localPayment.customer_name) {
      toast({ title: 'Customer name is required', variant: 'destructive' });
      return;
    }

    try {
      if (localPayment.id) {
        await updatePayment.mutateAsync({ ...localPayment, id: localPayment.id } as Payment & { id: string });
        toast({ title: 'Payment saved' });
      } else {
        const newPayment = await createPayment.mutateAsync(localPayment);
        setLocalPayment(newPayment);
        setIsSaved(true);
        toast({ title: 'Payment created' });
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleTabChange = async (tab: string) => {
    // Auto-save before switching to notes or files tab
    if (!isSaved && (tab === 'notes' || tab === 'files')) {
      if (!localPayment.customer_name) {
        toast({ title: 'Please enter customer name first', variant: 'destructive' });
        return;
      }
      await handleSave();
    }
    setActiveTab(tab);
  };

  const handleDelete = async () => {
    if (localPayment.id) {
      await deletePayment.mutateAsync(localPayment.id);
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl">
                    {localPayment.customer_name || 'New Payment'}
                  </DialogTitle>
                  <Badge variant="outline" className="capitalize">
                    {localPayment.payment_type || 'check'}
                  </Badge>
                </div>
                <Badge variant={localPayment.status === 'verified' ? 'default' : 'secondary'} className="capitalize">
                  {localPayment.status?.replace('_', ' ') || 'Received'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(localPayment.amount || 0)}
                </span>
                {localPayment.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <PaymentStatusStepper
                currentStatus={localPayment.status || 'received'}
                onStatusChange={handleStatusChange}
              />
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
            <TabsList className="shrink-0 grid grid-cols-3 w-64">
              <TabsTrigger value="details" className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Details
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-1.5">
                <Files className="h-3.5 w-3.5" />
                Files
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Notes
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="details" className="mt-0">
                <PaymentDetailsTab payment={localPayment} onChange={handleFieldChange} />
              </TabsContent>

              <TabsContent value="files" className="mt-0">
                {localPayment.id ? (
                  <PaymentFilesTab paymentId={localPayment.id} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">Save the payment first to upload files</p>
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                {localPayment.id ? (
                  <PaymentNotesTab paymentId={localPayment.id} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">Save the payment first to add notes</p>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <div className="shrink-0 flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleSave}>
              {isSaved ? 'Save Changes' : 'Create Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment and all associated notes.
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
}
