import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Search } from 'lucide-react';
import { InvoiceCard } from './InvoiceCard';
import { InvoiceDialog } from './InvoiceDialog';
import { useInvoices, Invoice } from '@/hooks/useInvoices';

const INVOICE_COLUMNS = [
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'paid', label: 'Paid' },
  { key: 'due_1_30', label: 'Due 1-30' },
  { key: 'due_31_60', label: 'Due 31-60' },
  { key: 'due_61_90', label: 'Due 61-90' },
  { key: 'due_91_plus', label: 'Due 91+' },
  { key: 'in_collection', label: 'In Collection' },
  { key: 'write_off', label: 'Write-Off' },
];

export function InvoicesManager() {
  const { data: invoices = [], isLoading } = useInvoices();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewInvoice, setIsNewInvoice] = useState(false);

  const getInvoiceColumn = (invoice: Invoice): string => {
    if (invoice.status === 'paid') return 'paid';
    if (invoice.status === 'draft') return 'draft';
    if (invoice.status === 'in_collection') return 'in_collection';
    if (invoice.status === 'write_off') return 'write_off';
    
    // Calculate days overdue for submitted/unpaid invoices
    if (invoice.due_date && invoice.balance_due > 0) {
      const dueDate = new Date(invoice.due_date);
      const today = new Date();
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue <= 0) return 'submitted';
      if (daysOverdue <= 30) return 'due_1_30';
      if (daysOverdue <= 60) return 'due_31_60';
      if (daysOverdue <= 90) return 'due_61_90';
      return 'due_91_plus';
    }
    
    return 'submitted';
  };

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const term = searchTerm.toLowerCase();
    return invoices.filter(inv => 
      inv.customer_name?.toLowerCase().includes(term) ||
      inv.invoice_number?.toLowerCase().includes(term) ||
      inv.address?.toLowerCase().includes(term)
    );
  }, [invoices, searchTerm]);

  const invoicesByColumn = useMemo(() => {
    const grouped: Record<string, Invoice[]> = {};
    INVOICE_COLUMNS.forEach(col => grouped[col.key] = []);
    
    filteredInvoices.forEach(invoice => {
      const column = getInvoiceColumn(invoice);
      if (grouped[column]) {
        grouped[column].push(invoice);
      }
    });
    
    return grouped;
  }, [filteredInvoices]);

  const handleOpenInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsNewInvoice(false);
    setIsDialogOpen(true);
  };

  const handleNewInvoice = () => {
    setSelectedInvoice(null);
    setIsNewInvoice(true);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedInvoice(null);
    setIsNewInvoice(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading invoices...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleNewInvoice}>
          <Plus className="h-4 w-4 mr-2" />
          Invoice
        </Button>
      </div>

      {/* Kanban Board */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {INVOICE_COLUMNS.map((column) => (
            <div key={column.key} className="w-64 shrink-0">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{column.label}</h3>
                  <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                    {invoicesByColumn[column.key]?.length || 0}
                  </span>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {invoicesByColumn[column.key]?.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      onClick={() => handleOpenInvoice(invoice)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Invoice Dialog */}
      <InvoiceDialog
        invoice={selectedInvoice}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        isNew={isNewInvoice}
      />
    </div>
  );
}
