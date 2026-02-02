import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import {
  useBidPackageItems,
  useAddBidPackageItem,
  useUpdateBidPackageItem,
  useDeleteBidPackageItem,
  BidPackageItem,
} from '@/hooks/useBidManager';

interface BidItemsTabProps {
  bidPackageId?: string;
}

const ITEM_TYPES = [
  { value: 'material', label: 'Material' },
  { value: 'labor', label: 'Labor' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'other', label: 'Other' },
];

export function BidItemsTab({ bidPackageId }: BidItemsTabProps) {
  const { data: items = [], isLoading } = useBidPackageItems(bidPackageId);
  const addMutation = useAddBidPackageItem();
  const updateMutation = useUpdateBidPackageItem();
  const deleteMutation = useDeleteBidPackageItem();

  const [newItem, setNewItem] = useState({
    item_type: 'material',
    item_name: '',
    quantity: '',
    unit: '',
    cost_code: '',
    description: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<BidPackageItem>>({});

  const handleAddItem = async () => {
    if (!bidPackageId || !newItem.item_name) return;

    await addMutation.mutateAsync({
      bid_package_id: bidPackageId,
      item_type: newItem.item_type,
      item_name: newItem.item_name,
      quantity: newItem.quantity ? parseFloat(newItem.quantity) : null,
      unit: newItem.unit || null,
      cost_code: newItem.cost_code || null,
      description: newItem.description || null,
      display_order: items.length,
    });

    setNewItem({
      item_type: 'material',
      item_name: '',
      quantity: '',
      unit: '',
      cost_code: '',
      description: '',
    });
  };

  const handleEditItem = (item: BidPackageItem) => {
    setEditingId(item.id);
    setEditData(item);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !bidPackageId) return;
    await updateMutation.mutateAsync({
      id: editingId,
      bid_package_id: bidPackageId,
      ...editData,
    });
    setEditingId(null);
    setEditData({});
  };

  const handleDeleteItem = async (id: string) => {
    if (!bidPackageId) return;
    await deleteMutation.mutateAsync({ id, bid_package_id: bidPackageId });
  };

  if (!bidPackageId) {
    return <div className="text-center py-8 text-muted-foreground">Save the bid package first to add items.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add New Item Form */}
      <div className="grid grid-cols-6 gap-2 p-3 bg-muted/50 rounded-lg">
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
        <Input
          placeholder="Item Name *"
          value={newItem.item_name}
          onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
        />
        <Input
          placeholder="QTY"
          type="number"
          value={newItem.quantity}
          onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
        />
        <Input
          placeholder="Unit"
          value={newItem.unit}
          onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
        />
        <Input
          placeholder="Cost Code"
          value={newItem.cost_code}
          onChange={(e) => setNewItem({ ...newItem, cost_code: e.target.value })}
        />
        <Button onClick={handleAddItem} disabled={!newItem.item_name || addMutation.isPending}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Items Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No items yet. Add items above.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>QTY</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Cost Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                {editingId === item.id ? (
                  <>
                    <TableCell>
                      <Select
                        value={editData.item_type || 'material'}
                        onValueChange={(value) => setEditData({ ...editData, item_type: value })}
                      >
                        <SelectTrigger className="h-8">
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
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8"
                        value={editData.item_name || ''}
                        onChange={(e) => setEditData({ ...editData, item_name: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8"
                        type="number"
                        value={editData.quantity || ''}
                        onChange={(e) => setEditData({ ...editData, quantity: parseFloat(e.target.value) || null })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8"
                        value={editData.unit || ''}
                        onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8"
                        value={editData.cost_code || ''}
                        onChange={(e) => setEditData({ ...editData, cost_code: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8"
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="capitalize">{item.item_type}</TableCell>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.cost_code}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEditItem(item)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
