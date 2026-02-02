import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useServiceTicketItems,
  useAddServiceTicketItem,
  useDeleteServiceTicketItem,
} from '@/hooks/useServiceTickets';

interface ServiceTicketServiceTabProps {
  ticketId: string;
}

export const ServiceTicketServiceTab: React.FC<ServiceTicketServiceTabProps> = ({ ticketId }) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    item_type: 'labor',
    item_name: '',
    cost_code: '',
    quantity: 1,
    unit: 'ea',
    unit_cost: 0,
  });

  const { data: items = [] } = useServiceTicketItems(ticketId);
  const addItem = useAddServiceTicketItem();
  const deleteItem = useDeleteServiceTicketItem();

  const totalProfit = items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleAddItem = async () => {
    await addItem.mutateAsync({
      ticket_id: ticketId,
      ...newItem,
    });
    setNewItem({
      item_type: 'labor',
      item_name: '',
      cost_code: '',
      quantity: 1,
      unit: 'ea',
      unit_cost: 0,
    });
    setShowAddDialog(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="h-2 w-2 bg-green-500 rounded" />
            Service Ticket Items
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600">
              Profit: ${totalProfit.toFixed(2)} (0%)
            </Badge>
            <Badge variant="outline">💰 $0.00</Badge>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item to Service Ticket
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Type</th>
                <th className="text-left p-3 text-sm font-medium">Item Name</th>
                <th className="text-left p-3 text-sm font-medium">Cost Code</th>
                <th className="text-right p-3 text-sm font-medium">QTY</th>
                <th className="text-right p-3 text-sm font-medium">Unit Cost</th>
                <th className="text-right p-3 text-sm font-medium">Unit</th>
                <th className="text-right p-3 text-sm font-medium">Total</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 text-sm">{item.item_type}</td>
                  <td className="p-3 text-sm">{item.item_name}</td>
                  <td className="p-3 text-sm">{item.cost_code || '-'}</td>
                  <td className="p-3 text-sm text-right">{item.quantity}</td>
                  <td className="p-3 text-sm text-right">${item.unit_cost.toFixed(2)}</td>
                  <td className="p-3 text-sm text-right">{item.unit}</td>
                  <td className="p-3 text-sm text-right">${item.total.toFixed(2)}</td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteItem.mutate({ itemId: item.id, ticketId })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No Records Available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox />
            No Cost Service Ticket
          </label>
        </div>
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select
                value={newItem.item_type}
                onValueChange={(v) => setNewItem({ ...newItem, item_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Item Name</Label>
              <Input
                value={newItem.item_name}
                onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Cost Code</Label>
              <Input
                value={newItem.cost_code}
                onChange={(e) => setNewItem({ ...newItem, cost_code: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Unit Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.unit_cost}
                  onChange={(e) => setNewItem({ ...newItem, unit_cost: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={!newItem.item_name || addItem.isPending}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
