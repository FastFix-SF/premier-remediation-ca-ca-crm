import { Bill, useBillItems, useCreateBillItem, useDeleteBillItem } from '@/hooks/useBills';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BillDetailsTabProps {
  bill: Bill;
  onChange: (field: keyof Bill, value: any) => void;
}

export function BillDetailsTab({ bill, onChange }: BillDetailsTabProps) {
  const { data: items = [], isLoading: itemsLoading } = useBillItems(bill.id);
  const createItem = useCreateBillItem();
  const deleteItem = useDeleteBillItem();

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  const handleAddItem = async () => {
    try {
      await createItem.mutateAsync({
        bill_id: bill.id,
        item_name: 'New Item',
        quantity: 1,
        unit_cost: 0,
        unit: 'EA',
      });
      toast.success('Item added');
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync({ id: itemId, billId: bill.id });
      toast.success('Item deleted');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const subTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Bill Info Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vendor_name">Vendor</Label>
          <Input
            id="vendor_name"
            value={bill.vendor_name || ''}
            onChange={(e) => onChange('vendor_name', e.target.value)}
            placeholder="Vendor name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="total">Amount</Label>
          <Input
            id="total"
            type="number"
            step="0.01"
            value={bill.total || ''}
            onChange={(e) => onChange('total', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ref_number">Ref. #</Label>
          <Input
            id="ref_number"
            value={bill.ref_number || ''}
            onChange={(e) => onChange('ref_number', e.target.value)}
            placeholder="Reference number"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bill_date">Bill Date</Label>
          <Input
            id="bill_date"
            type="date"
            value={bill.bill_date || ''}
            onChange={(e) => onChange('bill_date', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            type="date"
            value={bill.due_date || ''}
            onChange={(e) => onChange('due_date', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="terms">Terms</Label>
          <Select value={bill.terms || ''} onValueChange={(value) => onChange('terms', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
              <SelectItem value="Net 10">Net 10</SelectItem>
              <SelectItem value="Net 15">Net 15</SelectItem>
              <SelectItem value="Net 30">Net 30</SelectItem>
              <SelectItem value="Net 45">Net 45</SelectItem>
              <SelectItem value="Net 60">Net 60</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={bill.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Bill description"
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_billable"
          checked={bill.is_billable || false}
          onCheckedChange={(checked) => onChange('is_billable', checked)}
        />
        <Label htmlFor="is_billable" className="text-sm font-normal">Billable</Label>
      </div>

      {/* Line Items Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Lump Sum/Item Costs</h4>
          <Button size="sm" variant="outline" onClick={handleAddItem} disabled={createItem.isPending}>
            {createItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            Add Item to Bill
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8">Type</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Cost Code</TableHead>
                <TableHead className="text-right">QTY</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-10">Tax</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No items added yet
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>📦</TableCell>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.cost_code || '-'}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_cost)}</TableCell>
                    <TableCell>{item.unit || 'EA'}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                    <TableCell>
                      <Checkbox checked={item.is_taxable || false} disabled />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Tax/Amount Summary */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Sub Total</span>
          <span>{formatCurrency(subTotal || bill.sub_total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span>{formatCurrency(bill.tax)}</span>
        </div>
        <div className="flex justify-between font-semibold border-t pt-2">
          <span>Total</span>
          <span>{formatCurrency(bill.total)}</span>
        </div>
        <div className="flex justify-between text-sm text-green-600">
          <span>Payment</span>
          <span>-{formatCurrency(bill.paid)}</span>
        </div>
        <div className="flex justify-between font-semibold border-t pt-2">
          <span>Balance Due</span>
          <span>{formatCurrency(bill.balance_due)}</span>
        </div>
      </div>
    </div>
  );
}
