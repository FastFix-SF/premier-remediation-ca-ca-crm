import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Invoice } from '@/hooks/useInvoices';

interface InvoiceTermsTabProps {
  invoice: Partial<Invoice>;
  onChange: (field: keyof Invoice, value: any) => void;
}

export function InvoiceTermsTab({ invoice, onChange }: InvoiceTermsTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Terms & Conditions</Label>
        <Textarea
          value={invoice.terms_conditions || ''}
          onChange={(e) => onChange('terms_conditions', e.target.value)}
          placeholder="Enter terms and conditions for this invoice..."
          rows={15}
          className="font-mono text-sm"
        />
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p>Tip: Use this section to include payment terms, warranty information, or any legal disclaimers specific to this invoice.</p>
      </div>
    </div>
  );
}
