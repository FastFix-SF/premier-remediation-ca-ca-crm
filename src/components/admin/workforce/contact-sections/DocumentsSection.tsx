import React, { useState } from 'react';
import { ChevronRight, Plus, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import AddBillDialog from './AddBillDialog';
import AddExpenseDialog from './AddExpenseDialog';
import AddPurchaseOrderDialog from './AddPurchaseOrderDialog';
import AddSubContractDialog from './AddSubContractDialog';

interface DocumentRow {
  id: string;
  label: string;
  count?: number;
  amount?: number;
  addLabel?: string;
}

interface DocumentsSectionProps {
  contactId: string;
}

const documentRows: DocumentRow[] = [
  { id: 'bills', label: 'Bills', count: 0, amount: 0, addLabel: 'Bill' },
  { id: 'bill-payments', label: 'Bill Payments', count: 0, amount: 0 },
  { id: 'documents', label: 'Documents', count: 0 },
  { id: 'forms', label: 'Forms & Checklists', count: 0 },
  { id: 'email', label: 'Email', count: 0 },
  { id: 'expenses', label: 'Expenses', count: 0, amount: 0, addLabel: 'Expense' },
  { id: 'projects', label: 'Projects', count: 0 },
  { id: 'purchase-orders', label: 'Purchase Orders', count: 0, amount: 0, addLabel: 'Purchase Order' },
  { id: 'sub-contracts', label: 'Sub-Contracts', count: 0, amount: 0, addLabel: 'Sub-Contract' },
];

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ contactId }) => {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [addBillOpen, setAddBillOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addPurchaseOrderOpen, setAddPurchaseOrderOpen] = useState(false);
  const [addSubContractOpen, setAddSubContractOpen] = useState(false);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id) 
        : [...prev, id]
    );
  };

  const handleAddClick = (rowId: string) => {
    if (rowId === 'bills') {
      setAddBillOpen(true);
    } else if (rowId === 'expenses') {
      setAddExpenseOpen(true);
    } else if (rowId === 'purchase-orders') {
      setAddPurchaseOrderOpen(true);
    } else if (rowId === 'sub-contracts') {
      setAddSubContractOpen(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-2">
      {documentRows.map((row) => {
        const isExpanded = expandedRows.includes(row.id);
        const displayLabel = row.count !== undefined && row.count > 0 
          ? `${row.label} (${row.count})` 
          : row.label;

        return (
          <div
            key={row.id}
            className="bg-background rounded-lg border overflow-hidden"
          >
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleRow(row.id)}
            >
              <div className="flex items-center gap-3">
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 text-primary transition-transform",
                    isExpanded && "rotate-90"
                  )} 
                />
                <span className="text-sm font-medium">{displayLabel}</span>
              </div>
              
              <div className="flex items-center gap-3">
                {row.amount !== undefined && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>{formatCurrency(row.amount)}</span>
                  </div>
                )}
                {row.addLabel && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddClick(row.id);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/30 rounded-md transition-all shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{row.addLabel}</span>
                  </button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="px-4 py-3 border-t bg-muted/30">
                <p className="text-sm text-muted-foreground text-center py-4">
                  No {row.label.toLowerCase()} found
                </p>
              </div>
            )}
          </div>
        );
      })}

      <AddBillDialog open={addBillOpen} onOpenChange={setAddBillOpen} contactId={contactId} />
      <AddExpenseDialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen} contactId={contactId} />
      <AddPurchaseOrderDialog open={addPurchaseOrderOpen} onOpenChange={setAddPurchaseOrderOpen} contactId={contactId} />
      <AddSubContractDialog open={addSubContractOpen} onOpenChange={setAddSubContractOpen} contactId={contactId} />
    </div>
  );
};

export default DocumentsSection;
