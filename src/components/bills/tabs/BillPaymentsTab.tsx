import { useState } from 'react';
import { Bill, useBillPayments, useCreateBillPayment, useDeleteBillPayment } from '@/hooks/useBills';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Loader2, CreditCard, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BillPaymentsTabProps {
  bill: Bill;
}

export function BillPaymentsTab({ bill }: BillPaymentsTabProps) {
  const { data: payments = [], isLoading } = useBillPayments(bill.id);
  const createPayment = useCreateBillPayment();
  const deletePayment = useDeleteBillPayment();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: '',
    notes: '',
  });

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  const handleAddPayment = async () => {
    try {
      await createPayment.mutateAsync({
        bill_id: bill.id,
        payment_date: newPayment.payment_date,
        amount: parseFloat(newPayment.amount) || 0,
        payment_method: newPayment.payment_method || null,
        notes: newPayment.notes || null,
      });
      toast.success('Payment added');
      setDialogOpen(false);
      setNewPayment({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: '',
        notes: '',
      });
    } catch (error) {
      toast.error('Failed to add payment');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await deletePayment.mutateAsync({ id: paymentId, billId: bill.id });
      toast.success('Payment deleted');
    } catch (error) {
      toast.error('Failed to delete payment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">Payments History</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Balance Due: </span>
          <span className="font-semibold text-primary">{formatCurrency(bill.balance_due)}</span>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Payment
          </Button>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No payments recorded for this bill</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Payment Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment Notes</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      📅 {format(new Date(payment.payment_date), 'MM/dd/yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>{payment.notes || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeletePayment(payment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={newPayment.payment_date}
                onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input
                id="payment_method"
                value={newPayment.payment_method}
                onChange={(e) => setNewPayment({ ...newPayment, payment_method: e.target.value })}
                placeholder="Check, ACH, Credit Card, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={newPayment.notes}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                placeholder="Payment notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPayment} disabled={createPayment.isPending}>
              {createPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
