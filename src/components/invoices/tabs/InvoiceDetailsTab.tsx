import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Invoice } from '@/hooks/useInvoices';

interface InvoiceDetailsTabProps {
  invoice: Partial<Invoice>;
  onChange: (field: keyof Invoice, value: any) => void;
}

export function InvoiceDetailsTab({ invoice, onChange }: InvoiceDetailsTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Invoice Date</Label>
          <Input
            type="date"
            value={invoice.invoice_date || ''}
            onChange={(e) => onChange('invoice_date', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input
            type="date"
            value={invoice.due_date || ''}
            onChange={(e) => onChange('due_date', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Invoiced To (Customer Name)</Label>
        <Input
          value={invoice.customer_name || ''}
          onChange={(e) => onChange('customer_name', e.target.value)}
          placeholder="Customer name"
        />
      </div>

      <div className="space-y-2">
        <Label>Customer Email</Label>
        <Input
          type="email"
          value={invoice.customer_email || ''}
          onChange={(e) => onChange('customer_email', e.target.value)}
          placeholder="customer@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label>Address</Label>
        <Input
          value={invoice.address || ''}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Property address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Terms</Label>
          <Select value={invoice.terms || 'net30'} onValueChange={(v) => onChange('terms', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
              <SelectItem value="net15">Net 15</SelectItem>
              <SelectItem value="net30">Net 30</SelectItem>
              <SelectItem value="net45">Net 45</SelectItem>
              <SelectItem value="net60">Net 60</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Retainage %</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={invoice.retainage_percent || 0}
            onChange={(e) => onChange('retainage_percent', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Period Start Date</Label>
          <Input
            type="date"
            value={invoice.period_start_date || ''}
            onChange={(e) => onChange('period_start_date', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Period End Date</Label>
          <Input
            type="date"
            value={invoice.period_end_date || ''}
            onChange={(e) => onChange('period_end_date', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Approved By</Label>
        <Input
          value={invoice.approved_by || ''}
          onChange={(e) => onChange('approved_by', e.target.value)}
          placeholder="Approver name"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={invoice.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Invoice description..."
          rows={4}
        />
      </div>
    </div>
  );
}
