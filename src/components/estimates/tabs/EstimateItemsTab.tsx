import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Estimate, EstimateItem, ITEM_TYPES, useEstimateItems, useCreateEstimateItem, useDeleteEstimateItem, useUpdateEstimate } from '@/hooks/useEstimates';
import { cn } from '@/lib/utils';

interface EstimateItemsTabProps {
  estimate: Estimate;
}

export function EstimateItemsTab({ estimate }: EstimateItemsTabProps) {
  const [showMarkup, setShowMarkup] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    item_type: 'material',
    item_name: '',
    description: '',
    cost_code: '',
    quantity: 1,
    unit: 'EA',
    unit_cost: 0,
    markup_pct: 0,
    tax_applicable: false,
  });

  const { data: items = [], isLoading } = useEstimateItems(estimate.id);
  const createItem = useCreateEstimateItem();
  const deleteItem = useDeleteEstimateItem();
  const updateEstimate = useUpdateEstimate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const itemsByType = useMemo(() => {
    const grouped: Record<string, EstimateItem[]> = {};
    items.forEach(item => {
      if (!grouped[item.item_type]) {
        grouped[item.item_type] = [];
      }
      grouped[item.item_type].push(item);
    });
    return grouped;
  }, [items]);

  const typeTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    ITEM_TYPES.forEach(type => {
      totals[type.value] = itemsByType[type.value]?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
    });
    return totals;
  }, [itemsByType]);

  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [items]);

  const handleAddItem = async () => {
    const total = newItem.quantity * newItem.unit_cost * (1 + newItem.markup_pct / 100);
    await createItem.mutateAsync({
      estimate_id: estimate.id,
      ...newItem,
      total,
    });
    setIsAddDialogOpen(false);
    setNewItem({
      item_type: 'material',
      item_name: '',
      description: '',
      cost_code: '',
      quantity: 1,
      unit: 'EA',
      unit_cost: 0,
      markup_pct: 0,
      tax_applicable: false,
    });

    // Update estimate totals
    const newSubtotal = grandTotal + total;
    await updateEstimate.mutateAsync({
      id: estimate.id,
      subtotal: newSubtotal,
      grand_total: newSubtotal * (1 + (estimate.profit_margin_pct || 0) / 100) * (1 + (estimate.tax_pct || 0) / 100),
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteItem.mutateAsync({ id: itemId, estimateId: estimate.id });
  };

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Financial Summary</h3>
            <div className="flex items-center gap-2">
              <Label htmlFor="show-markup" className="text-sm">Show Markup</Label>
              <Switch
                id="show-markup"
                checked={showMarkup}
                onCheckedChange={setShowMarkup}
              />
            </div>
          </div>
          
          {/* Category Bar */}
          <div className="h-4 rounded-full overflow-hidden flex mb-4">
            {ITEM_TYPES.map(type => {
              const percentage = grandTotal > 0 ? (typeTotals[type.value] / grandTotal) * 100 : 0;
              if (percentage === 0) return null;
              return (
                <div
                  key={type.value}
                  className={cn(type.color)}
                  style={{ width: `${percentage}%` }}
                  title={`${type.label}: ${formatCurrency(typeTotals[type.value])}`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4">
            {ITEM_TYPES.map(type => (
              <div key={type.value} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", type.color)} />
                <span className="text-sm">
                  {type.label}: {formatCurrency(typeTotals[type.value])}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading items...</p>
          ) : items.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No items yet. Add your first item.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Cost Code</TableHead>
                    <TableHead className="text-right">QTY</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead>Unit</TableHead>
                    {showMarkup && <TableHead className="text-right">MU%</TableHead>}
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const typeInfo = ITEM_TYPES.find(t => t.value === item.item_type);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", typeInfo?.color)} />
                            <span className="capitalize text-sm">{item.item_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>{item.cost_code || '-'}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_cost || 0)}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        {showMarkup && <TableCell className="text-right">{item.markup_pct}%</TableCell>}
                        <TableCell className="text-right font-medium">{formatCurrency(item.total || 0)}</TableCell>
                        <TableCell>{item.tax_applicable ? '✓' : '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="space-y-2 text-right">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Cost</span>
              <span className="font-medium">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profit Margin ({estimate.profit_margin_pct || 0}%)</span>
              <span className="font-medium">{formatCurrency(grandTotal * (estimate.profit_margin_pct || 0) / 100)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Sub Total</span>
              <span className="font-medium">{formatCurrency(grandTotal * (1 + (estimate.profit_margin_pct || 0) / 100))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({estimate.tax_pct || 0}%)</span>
              <span className="font-medium">{formatCurrency(grandTotal * (estimate.profit_margin_pct || 0) / 100 * (estimate.tax_pct || 0) / 100)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Grand Total</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(grandTotal * (1 + (estimate.profit_margin_pct || 0) / 100) * (1 + (estimate.tax_pct || 0) / 100))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Line Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={newItem.item_type}
                  onValueChange={(value) => setNewItem({ ...newItem, item_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cost Code</Label>
                <Input
                  value={newItem.cost_code}
                  onChange={(e) => setNewItem({ ...newItem, cost_code: e.target.value })}
                  placeholder="e.g., 01-100"
                />
              </div>
            </div>
            <div>
              <Label>Item Name *</Label>
              <Input
                value={newItem.item_name}
                onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                placeholder="Enter item name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Unit Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.unit_cost}
                  onChange={(e) => setNewItem({ ...newItem, unit_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Select
                  value={newItem.unit}
                  onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EA">EA</SelectItem>
                    <SelectItem value="SF">SF</SelectItem>
                    <SelectItem value="LF">LF</SelectItem>
                    <SelectItem value="SQ">SQ</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="DAY">DAY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Markup %</Label>
                <Input
                  type="number"
                  value={newItem.markup_pct}
                  onChange={(e) => setNewItem({ ...newItem, markup_pct: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="tax-applicable"
                  checked={newItem.tax_applicable}
                  onCheckedChange={(checked) => setNewItem({ ...newItem, tax_applicable: checked })}
                />
                <Label htmlFor="tax-applicable">Tax Applicable</Label>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between text-lg font-semibold">
                <span>Item Total:</span>
                <span>{formatCurrency(newItem.quantity * newItem.unit_cost * (1 + newItem.markup_pct / 100))}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={!newItem.item_name || createItem.isPending}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
