import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Save, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Estimate, useEstimateScopeItems, useCreateScopeItem, useUpdateScopeItem, useDeleteScopeItem, useUpdateEstimate } from '@/hooks/useEstimates';

interface EstimateScopeTabProps {
  estimate: Estimate;
}

const SCOPE_CATEGORIES = [
  'UNDERLAYMENT',
  'STANDING SEAM',
  'SHEET METAL',
  'FLASHING',
  'VENTILATION',
  'TEAROFF',
  'DEBRIS REMOVAL',
  'OTHER',
];

export function EstimateScopeTab({ estimate }: EstimateScopeTabProps) {
  const [summary, setSummary] = useState(estimate.scope_summary || '');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    category: 'OTHER',
    description: '',
    quantity: 1,
    unit: '',
    is_included: true,
  });
  const [summaryChanged, setSummaryChanged] = useState(false);

  const { data: scopeItems = [], isLoading } = useEstimateScopeItems(estimate.id);
  const createScopeItem = useCreateScopeItem();
  const updateScopeItem = useUpdateScopeItem();
  const deleteScopeItem = useDeleteScopeItem();
  const updateEstimate = useUpdateEstimate();

  useEffect(() => {
    setSummaryChanged(summary !== (estimate.scope_summary || ''));
  }, [summary, estimate.scope_summary]);

  const handleSaveSummary = async () => {
    await updateEstimate.mutateAsync({
      id: estimate.id,
      scope_summary: summary,
    });
    setSummaryChanged(false);
  };

  const handleAddItem = async () => {
    await createScopeItem.mutateAsync({
      estimate_id: estimate.id,
      ...newItem,
    });
    setIsAddDialogOpen(false);
    setNewItem({
      category: 'OTHER',
      description: '',
      quantity: 1,
      unit: '',
      is_included: true,
    });
  };

  const handleToggleIncluded = async (itemId: string, currentValue: boolean) => {
    await updateScopeItem.mutateAsync({
      id: itemId,
      estimateId: estimate.id,
      is_included: !currentValue,
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteScopeItem.mutateAsync({ id: itemId, estimateId: estimate.id });
  };

  // Group items by category
  const groupedItems = scopeItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof scopeItems>);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Scope Summary</CardTitle>
          {summaryChanged && (
            <Button onClick={handleSaveSummary} size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Enter a summary of the scope of work..."
            className="min-h-[150px]"
          />
        </CardContent>
      </Card>

      {/* Scope Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Scope Items</CardTitle>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading scope items...</p>
          ) : scopeItems.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No scope items yet. Add items to define the scope of work.
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category}>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3">{category}</h4>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <Checkbox
                          checked={item.is_included || false}
                          onCheckedChange={() => handleToggleIncluded(item.id, item.is_included || false)}
                        />
                        <div className="flex-1">
                          <p className={item.is_included ? '' : 'text-muted-foreground line-through'}>
                            {item.description}
                          </p>
                        </div>
                        {item.quantity && item.quantity > 1 && (
                          <span className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Scope Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              >
                {SCOPE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Describe the scope item..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="e.g., SF, LF, EA"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-included"
                checked={newItem.is_included}
                onCheckedChange={(checked) => setNewItem({ ...newItem, is_included: !!checked })}
              />
              <Label htmlFor="is-included">Include in PDF</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={!newItem.description || createScopeItem.isPending}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
