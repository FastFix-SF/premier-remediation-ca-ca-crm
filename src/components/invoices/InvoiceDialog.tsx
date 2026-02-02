import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Trash2 } from 'lucide-react';
import { InvoiceStatusStepper } from './InvoiceStatusStepper';
import { InvoiceDetailsTab } from './tabs/InvoiceDetailsTab';
import { InvoiceItemsTab } from './tabs/InvoiceItemsTab';
import { InvoiceTermsTab } from './tabs/InvoiceTermsTab';
import { InvoicePaymentsTab } from './tabs/InvoicePaymentsTab';
import { InvoiceFilesTab } from './tabs/InvoiceFilesTab';
import { InvoiceNotesTab } from './tabs/InvoiceNotesTab';
import { Invoice, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from '@/hooks/useInvoices';
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

interface InvoiceDialogProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  isNew?: boolean;
}

export function InvoiceDialog({ invoice, isOpen, onClose, isNew = false }: InvoiceDialogProps) {
  const [localInvoice, setLocalInvoice] = useState<Partial<Invoice>>({});
  const [activeTab, setActiveTab] = useState('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();

  useEffect(() => {
    if (invoice) {
      setLocalInvoice(invoice);
      setIsSaved(true);
    } else if (isNew) {
      const timestamp = Date.now().toString().slice(-6);
      setLocalInvoice({
        status: 'draft',
        invoice_number: `INV-${timestamp}`,
        project_name: 'New Invoice',
        customer_name: '',
        total_amount: 0,
        subtotal: 0,
        balance_due: 0
      });
      setIsSaved(false);
    }
  }, [invoice, isNew]);

  const handleFieldChange = (field: keyof Invoice, value: any) => {
    setLocalInvoice(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = async (status: string) => {
    handleFieldChange('status', status);
    if (localInvoice.id) {
      await updateInvoice.mutateAsync({ id: localInvoice.id, status });
    }
  };

  const handleSave = async () => {
    if (!localInvoice.customer_name) {
      toast({ title: 'Customer name is required', variant: 'destructive' });
      return;
    }

    try {
      if (localInvoice.id) {
        await updateInvoice.mutateAsync({ ...localInvoice, id: localInvoice.id } as Invoice & { id: string });
        toast({ title: 'Invoice saved' });
      } else {
        const newInvoice = await createInvoice.mutateAsync(localInvoice);
        setLocalInvoice(newInvoice);
        setIsSaved(true);
        toast({ title: 'Invoice created' });
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleTabChange = async (tab: string) => {
    // Auto-save before switching to tabs that need an invoice ID
    if (!isSaved && ['items', 'payments', 'files', 'notes'].includes(tab)) {
      if (!localInvoice.customer_name) {
        toast({ title: 'Please enter customer name first', variant: 'destructive' });
        return;
      }
      await handleSave();
    }
    setActiveTab(tab);
  };

  const handleDelete = async () => {
    if (localInvoice.id) {
      await deleteInvoice.mutateAsync(localInvoice.id);
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <DialogTitle className="text-xl">
                  {isNew && !isSaved ? 'New Invoice' : `Invoice ${localInvoice.invoice_number || ''}`}
                </DialogTitle>
                {localInvoice.customer_name && (
                  <p className="text-sm text-muted-foreground">{localInvoice.customer_name}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={localInvoice.status === 'paid' ? 'default' : 'secondary'}>
                  {formatCurrency(localInvoice.total_amount || 0)}
                </Badge>
                {localInvoice.id && (
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
              <InvoiceStatusStepper
                currentStatus={localInvoice.status || 'draft'}
                onStatusChange={handleStatusChange}
              />
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
            <TabsList className="shrink-0 grid grid-cols-6 w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="details" className="mt-0">
                <InvoiceDetailsTab invoice={localInvoice} onChange={handleFieldChange} />
              </TabsContent>

              <TabsContent value="items" className="mt-0">
                {localInvoice.id ? (
                  <InvoiceItemsTab invoiceId={localInvoice.id} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">Save the invoice first to add items</p>
                )}
              </TabsContent>

              <TabsContent value="terms" className="mt-0">
                <InvoiceTermsTab invoice={localInvoice} onChange={handleFieldChange} />
              </TabsContent>

              <TabsContent value="payments" className="mt-0">
                {localInvoice.id ? (
                  <InvoicePaymentsTab invoiceId={localInvoice.id} invoice={localInvoice} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">Save the invoice first to add payments</p>
                )}
              </TabsContent>

              <TabsContent value="files" className="mt-0">
                {localInvoice.id ? (
                  <InvoiceFilesTab invoiceId={localInvoice.id} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">Save the invoice first to upload files</p>
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                {localInvoice.id ? (
                  <InvoiceNotesTab invoiceId={localInvoice.id} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">Save the invoice first to add notes</p>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <div className="shrink-0 flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleSave}>
              {isSaved ? 'Save Changes' : 'Create Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this invoice and all associated items, payments, files, and notes.
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
