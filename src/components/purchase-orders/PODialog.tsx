import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PurchaseOrder, usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { POStatusStepper } from './POStatusStepper';
import { PODetailsTab } from './tabs/PODetailsTab';
import { PONotesTab } from './tabs/PONotesTab';
import { POFilesTab } from './tabs/POFilesTab';
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

interface PODialogProps {
  po: PurchaseOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PODialog = ({ po, open, onOpenChange }: PODialogProps) => {
  const { updatePurchaseOrder, deletePurchaseOrder } = usePurchaseOrders();
  const [localPO, setLocalPO] = useState<PurchaseOrder | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    if (po) {
      setLocalPO({ ...po });
    }
  }, [po]);

  const debouncedSave = useDebouncedCallback(
    (updates: Partial<PurchaseOrder>) => {
      if (localPO?.id) {
        updatePurchaseOrder.mutate({ id: localPO.id, ...updates });
      }
    },
    500
  );

  const handleChange = useCallback(
    (field: keyof PurchaseOrder, value: any) => {
      if (!localPO) return;
      const updated = { ...localPO, [field]: value };
      setLocalPO(updated);
      debouncedSave({ [field]: value });
    },
    [localPO, debouncedSave]
  );

  const handleStatusChange = (status: string) => {
    if (!localPO) return;
    const updated = { ...localPO, status };
    setLocalPO(updated);
    updatePurchaseOrder.mutate({ id: localPO.id, status });
  };

  const handleDelete = () => {
    if (!localPO) return;
    deletePurchaseOrder.mutate(localPO.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!localPO) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {localPO.title}
                </DialogTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  {localPO.supplier && (
                    <span>{localPO.supplier}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {localPO.order_date
                      ? format(new Date(localPO.order_date), 'MMM d, yyyy')
                      : 'No date'}
                  </span>
                  <span>{localPO.po_number}</span>
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

            <POStatusStepper
              currentStatus={localPO.status || 'draft'}
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
              <PODetailsTab po={localPO} onChange={handleChange} />
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <POFilesTab poId={localPO.id} />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <PONotesTab poId={localPO.id} />
            </TabsContent>
          </Tabs>

          <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
            Created: {format(new Date(localPO.created_at), 'MMM d, yyyy h:mm a')}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this purchase order? This action cannot be undone.
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
