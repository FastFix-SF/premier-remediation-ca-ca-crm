import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { useInvoiceItems, useCreateInvoiceItem, useUpdateInvoiceItem, useDeleteInvoiceItem, InvoiceItem } from '@/hooks/useInvoices';

interface InvoiceItemsTabProps {
  invoiceId: string;
}

const ITEM_TYPES = ['material', 'labor', 'equipment', 'subcontractor', 'other'];

export function InvoiceItemsTab({ invoiceId }: InvoiceItemsTabProps) {
  const { data: items = [], isLoading } = useInvoiceItems(invoiceId);
  const createItem = useCreateInvoiceItem();
  const updateItem = useUpdateInvoiceItem();
  const deleteItem = useDeleteInvoiceItem();
  
  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({
    item_type: 'material',
    item_name: '',
    quantity: 1,
    unit_cost: 0,
    unit: 'EA',
    markup_percent: 0,
    is_taxable: true
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const calculateTotal = (item: Partial<InvoiceItem>) => {
    const base = (item.quantity || 0) * (item.unit_cost || 0);
    const markup = base * ((item.markup_percent || 0) / 100);
    return base + markup;
  };

  const handleAddItem = async () => {
    if (!newItem.item_name) return;
    
    await createItem.mutateAsync({
      ...newItem,
      invoice_id: invoiceId,
      total: calculateTotal(newItem),
      display_order: items.length
    });
    
    setNewItem({
      item_type: 'material',
      item_name: '',
      quantity: 1,
      unit_cost: 0,
      unit: 'EA',
      markup_percent: 0,
      is_taxable: true
    });
  };

  const handleUpdateItem = async (id: string, field: keyof InvoiceItem, value: any) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    const updated = { ...item, [field]: value };
    updated.total = calculateTotal(updated);
    
    await updateItem.mutateAsync({ id, [field]: value, total: updated.total });
  };

  const subTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const taxableAmount = items.filter(i => i.is_taxable).reduce((sum, item) => sum + (item.total || 0), 0);
  const taxRate = 0.0875; // Example tax rate
  const tax = taxableAmount * taxRate;
  const total = subTotal + tax;

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading items...</div>;

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-20">Qty</TableHead>
              <TableHead className="w-24">Unit Cost</TableHead>
              <TableHead className="w-16">Unit</TableHead>
              <TableHead className="w-20">Markup %</TableHead>
              <TableHead className="w-24 text-right">Total</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Select 
                    value={item.item_type} 
                    onValueChange={(v) => handleUpdateItem(item.id, 'item_type', v)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={item.item_name}
                    onChange={(e) => handleUpdateItem(item.id, 'item_name', e.target.value)}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="h-8 w-16"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.unit_cost}
                    onChange={(e) => handleUpdateItem(item.id, 'unit_cost', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.unit}
                    onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                    className="h-8 w-14"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.markup_percent}
                    onChange={(e) => handleUpdateItem(item.id, 'markup_percent', parseFloat(e.target.value) || 0)}
                    className="h-8 w-16"
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.total)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteItem.mutate({ id: item.id, invoiceId })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {/* New item row */}
            <TableRow className="bg-muted/30">
              <TableCell>
                <Select 
                  value={newItem.item_type} 
                  onValueChange={(v) => setNewItem({ ...newItem, item_type: v })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  placeholder="Item name"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                  className="h-8 w-16"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={newItem.unit_cost}
                  onChange={(e) => setNewItem({ ...newItem, unit_cost: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="h-8 w-14"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={newItem.markup_percent}
                  onChange={(e) => setNewItem({ ...newItem, markup_percent: parseFloat(e.target.value) || 0 })}
                  className="h-8 w-16"
                />
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(calculateTotal(newItem))}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleAddItem}
                  disabled={!newItem.item_name}
                >
                  <Plus className="h-4 w-4 text-primary" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Totals Summary */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sub Total:</span>
            <span className="font-medium">{formatCurrency(subTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax ({(taxRate * 100).toFixed(2)}%):</span>
            <span className="font-medium">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
