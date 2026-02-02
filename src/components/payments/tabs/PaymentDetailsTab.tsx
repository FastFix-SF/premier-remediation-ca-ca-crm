import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Payment } from '@/hooks/usePayments';

interface PaymentDetailsTabProps {
  payment: Partial<Payment>;
  onChange: (field: keyof Payment, value: any) => void;
}

const PAYMENT_TYPES = ['check', 'credit_card', 'ach', 'cash', 'wire', 'other'];

export function PaymentDetailsTab({ payment, onChange }: PaymentDetailsTabProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Payment Date</Label>
          <Input
            type="date"
            value={payment.payment_date || ''}
            onChange={(e) => onChange('payment_date', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            value={payment.amount || 0}
            onChange={(e) => onChange('amount', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Customer Name</Label>
        <Input
          value={payment.customer_name || ''}
          onChange={(e) => onChange('customer_name', e.target.value)}
          placeholder="Customer name"
        />
      </div>

      <div className="space-y-2">
        <Label>Address</Label>
        <Input
          value={payment.address || ''}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Property address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Payment Type</Label>
          <Select value={payment.payment_type || 'check'} onValueChange={(v) => onChange('payment_type', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TYPES.map(t => (
                <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Deposit To</Label>
          <Input
            value={payment.deposit_to || ''}
            onChange={(e) => onChange('deposit_to', e.target.value)}
            placeholder="Select account"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Invoice #</Label>
          <Input
            value={payment.invoice_number || ''}
            onChange={(e) => onChange('invoice_number', e.target.value)}
            placeholder="Invoice number"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Reference #</Label>
          <Input
            value={payment.reference_number || ''}
            onChange={(e) => onChange('reference_number', e.target.value)}
            placeholder="Check #, transaction ID, etc."
          />
        </div>
      </div>
    </div>
  );
}
