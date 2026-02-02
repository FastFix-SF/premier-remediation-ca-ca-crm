import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Package, 
  Hammer, 
  Truck, 
  Users,
  MoreHorizontal 
} from 'lucide-react';
import { 
  useChangeOrderItems, 
  useCreateChangeOrderItem, 
  useUpdateChangeOrderItem,
  useDeleteChangeOrderItem,
  ChangeOrderItem 
} from '@/hooks/useChangeOrders';

interface COItemsTabProps {
  changeOrderId?: string;
}

const ITEM_TYPES = [
  { value: 'material', label: 'Material', icon: Package },
  { value: 'labor', label: 'Labor', icon: Hammer },
  { value: 'equipment', label: 'Equipment', icon: Truck },
  { value: 'subcontractor', label: 'Subcontractor', icon: Users },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
] as const;

export function COItemsTab({ changeOrderId }: COItemsTabProps) {
  const { data: items = [], isLoading } = useChangeOrderItems(changeOrderId);
  const createMutation = useCreateChangeOrderItem();
  const updateMutation = useUpdateChangeOrderItem();
  const deleteMutation = useDeleteChangeOrderItem();

  const [newItem, setNewItem] = useState<Partial<ChangeOrderItem>>({
    item_type: 'material',
    item_name: '',
    quantity: 0,
    unit_cost: 0,
    unit: 'ea',
    markup_percent: 0,
  });

  if (!changeOrderId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Save the change order first to add items.
      </div>
    );
  }

  const handleAddItem = async () => {
    if (!newItem.item_name?.trim()) return;
    
    const total = (newItem.quantity || 0) * (newItem.unit_cost || 0) * (1 + (newItem.markup_percent || 0) / 100);
    
    await createMutation.mutateAsync({
      change_order_id: changeOrderId,
      ...newItem,
      total,
    });
    
    setNewItem({
      item_type: 'material',
      item_name: '',
      quantity: 0,
      unit_cost: 0,
      unit: 'ea',
      markup_percent: 0,
    });
  };

  const handleDeleteItem = (id: string) => {
    deleteMutation.mutate({ id, changeOrderId });
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const getTypeIcon = (type: string) => {
    const found = ITEM_TYPES.find(t => t.value === type);
    return found ? <found.icon className="h-4 w-4" /> : null;
  };

  const estimatedCost = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  const totalMarkup = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost * item.markup_percent / 100), 0);
  const grandTotal = estimatedCost + totalMarkup;

  return (
    <div className="space-y-4">
      {/* Totals Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
        <div>
          <div className="text-sm text-muted-foreground">Estimated Cost</div>
          <div className="text-lg font-semibold">{formatCurrency(estimatedCost)}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Markup</div>
          <div className="text-lg font-semibold">{formatCurrency(totalMarkup)}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Grand Total</div>
          <div className="text-lg font-semibold text-primary">{formatCurrency(grandTotal)}</div>
        </div>
      </div>

      {/* Items Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Type</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead className="w-20">QTY</TableHead>
              <TableHead className="w-24">Unit Cost</TableHead>
              <TableHead className="w-16">Unit</TableHead>
              <TableHead className="w-16">MU%</TableHead>
              <TableHead className="w-24">Total</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No items added yet
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {getTypeIcon(item.item_type)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.item_name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.unit_cost)}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.markup_percent}%</TableCell>
                  <TableCell className="font-medium">{formatCurrency(item.total)}</TableCell>
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
              ))
            )}
            
            {/* Add New Item Row */}
            <TableRow className="bg-muted/30">
              <TableCell>
                <Select
                  value={newItem.item_type}
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, item_type: value as any }))}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-3 w-3" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  value={newItem.item_name || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, item_name: e.target.value }))}
                  placeholder="Item name"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={newItem.quantity || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={newItem.unit_cost || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={newItem.unit || 'ea'}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={newItem.markup_percent || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, markup_percent: parseFloat(e.target.value) || 0 }))}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(
                    (newItem.quantity || 0) * (newItem.unit_cost || 0) * (1 + (newItem.markup_percent || 0) / 100)
                  )}
                </span>
              </TableCell>
              <TableCell>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddItem}
                  disabled={!newItem.item_name?.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
