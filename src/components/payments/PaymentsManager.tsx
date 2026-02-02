import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Search } from 'lucide-react';
import { PaymentCard } from './PaymentCard';
import { PaymentDialog } from './PaymentDialog';
import { usePayments, Payment } from '@/hooks/usePayments';

const PAYMENT_COLUMNS = [
  { key: 'received', label: 'Received' },
  { key: 'in_review', label: 'In Review' },
  { key: 'verified', label: 'Verified' },
  { key: 'failed', label: 'Failed' },
];

export function PaymentsManager() {
  const { data: payments = [], isLoading } = usePayments();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewPayment, setIsNewPayment] = useState(false);

  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments;
    const term = searchTerm.toLowerCase();
    return payments.filter(pmt => 
      pmt.customer_name?.toLowerCase().includes(term) ||
      pmt.invoice_number?.toLowerCase().includes(term) ||
      pmt.address?.toLowerCase().includes(term) ||
      pmt.reference_number?.toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  const paymentsByColumn = useMemo(() => {
    const grouped: Record<string, Payment[]> = {};
    PAYMENT_COLUMNS.forEach(col => grouped[col.key] = []);
    
    filteredPayments.forEach(payment => {
      const column = payment.status || 'received';
      if (grouped[column]) {
        grouped[column].push(payment);
      } else {
        grouped['received'].push(payment);
      }
    });
    
    return grouped;
  }, [filteredPayments]);

  const handleOpenPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsNewPayment(false);
    setIsDialogOpen(true);
  };

  const handleNewPayment = () => {
    setSelectedPayment(null);
    setIsNewPayment(true);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPayment(null);
    setIsNewPayment(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading payments...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleNewPayment}>
          <Plus className="h-4 w-4 mr-2" />
          Payment
        </Button>
      </div>

      {/* Kanban Board */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {PAYMENT_COLUMNS.map((column) => (
            <div key={column.key} className="w-64 shrink-0">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{column.label}</h3>
                  <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                    {paymentsByColumn[column.key]?.length || 0}
                  </span>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {paymentsByColumn[column.key]?.map((payment) => (
                    <PaymentCard
                      key={payment.id}
                      payment={payment}
                      onClick={() => handleOpenPayment(payment)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Payment Dialog */}
      <PaymentDialog
        payment={selectedPayment}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        isNew={isNewPayment}
      />
    </div>
  );
}
