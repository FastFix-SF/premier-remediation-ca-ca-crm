import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus } from 'lucide-react';
import { useInvoicePayments, useCreateInvoicePayment, useDeleteInvoicePayment, InvoicePayment, Invoice } from '@/hooks/useInvoices';
import { format } from 'date-fns';

interface InvoicePaymentsTabProps {
  invoiceId: string;
  invoice: Partial<Invoice>;
}

const PAYMENT_TYPES = ['check', 'credit_card', 'ach', 'cash', 'other'];

export function InvoicePaymentsTab({ invoiceId, invoice }: InvoicePaymentsTabProps) {
  const { data: payments = [], isLoading } = useInvoicePayments(invoiceId);
  const createPayment = useCreateInvoicePayment();
  const deletePayment = useDeleteInvoicePayment();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState<Partial<InvoicePayment>>({
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_type: 'check',
    amount: 0,
    payment_note: '',
    status: 'received'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const balanceDue = (invoice.total_amount || 0) - totalPaid;

  const handleAddPayment = async () => {
    await createPayment.mutateAsync({
      ...newPayment,
      invoice_id: invoiceId
    });
    
    setIsDialogOpen(false);
    setNewPayment({
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_type: 'check',
      amount: 0,
      payment_note: '',
      status: 'received'
    });
  };

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading payments...</div>;

  return (
    <div className="space-y-4">
      {/* Balance Summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Invoice Total</p>
            <p className="text-xl font-bold">{formatCurrency(invoice.total_amount || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Balance Due</p>
            <p className={`text-xl font-bold ${balanceDue > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(balanceDue)}
            </p>
          </div>
        </div>
      </div>

      {/* Add Payment Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={newPayment.payment_date}
                    onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select 
                    value={newPayment.payment_type} 
                    onValueChange={(v) => setNewPayment({ ...newPayment, payment_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Note</Label>
                <Input
                  value={newPayment.payment_note || ''}
                  onChange={(e) => setNewPayment({ ...newPayment, payment_note: e.target.value })}
                  placeholder="Check #, reference, etc."
                />
              </div>
              <Button onClick={handleAddPayment} className="w-full" disabled={!newPayment.amount}>
                Record Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payments Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No payments recorded yet
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="capitalize">
                    {payment.payment_type.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.payment_note || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deletePayment.mutate({ id: payment.id, invoiceId })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
