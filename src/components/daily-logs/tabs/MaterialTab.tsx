import React, { useState } from 'react';
import { Plus, Trash2, Package, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DailyLogMaterial,
  useAddDailyLogMaterial,
  useDeleteDailyLogMaterial,
} from '@/hooks/useDailyLogs';

interface MaterialTabProps {
  dailyLogId: string;
  materials: DailyLogMaterial[];
}

export const MaterialTab: React.FC<MaterialTabProps> = ({ dailyLogId, materials }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [materialType, setMaterialType] = useState<'delivered' | 'used'>('delivered');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [supplier, setSupplier] = useState('');
  const [deliveredBy, setDeliveredBy] = useState('');

  const addMutation = useAddDailyLogMaterial();
  const deleteMutation = useDeleteDailyLogMaterial();

  const deliveredMaterials = materials.filter((m) => m.material_type === 'delivered');
  const usedMaterials = materials.filter((m) => m.material_type === 'used');

  const handleAdd = async () => {
    await addMutation.mutateAsync({
      daily_log_id: dailyLogId,
      material_type: materialType,
      item_name: itemName,
      quantity: quantity ? parseFloat(quantity) : null,
      unit: unit || null,
      supplier: supplier || null,
      delivered_by: deliveredBy || null,
      description: null,
    });
    resetForm();
    setAddOpen(false);
  };

  const resetForm = () => {
    setItemName('');
    setQuantity('');
    setUnit('');
    setSupplier('');
    setDeliveredBy('');
  };

  const MaterialTable = ({ items, type }: { items: DailyLogMaterial[]; type: 'delivered' | 'used' }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Unit</TableHead>
          {type === 'delivered' && <TableHead>Supplier</TableHead>}
          {type === 'delivered' && <TableHead>Delivered By</TableHead>}
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.item_name}</TableCell>
            <TableCell>{item.quantity ?? '-'}</TableCell>
            <TableCell>{item.unit || '-'}</TableCell>
            {type === 'delivered' && <TableCell>{item.supplier || '-'}</TableCell>}
            {type === 'delivered' && <TableCell>{item.delivered_by || '-'}</TableCell>}
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate({ id: item.id, dailyLogId })}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Materials Delivered */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Items Delivered ({deliveredMaterials.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deliveredMaterials.length > 0 ? (
            <MaterialTable items={deliveredMaterials} type="delivered" />
          ) : (
            <p className="text-sm text-muted-foreground">No materials delivered</p>
          )}
        </CardContent>
      </Card>

      {/* Materials Used */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="w-4 h-4" />
            Items Used ({usedMaterials.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usedMaterials.length > 0 ? (
            <MaterialTable items={usedMaterials} type="used" />
          ) : (
            <p className="text-sm text-muted-foreground">No materials used</p>
          )}
        </CardContent>
      </Card>

      {/* Add Material Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={materialType} onValueChange={(v) => setMaterialType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Material name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g., sq ft, bundles"
                />
              </div>
            </div>

            {materialType === 'delivered' && (
              <>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delivered By</Label>
                  <Input
                    value={deliveredBy}
                    onChange={(e) => setDeliveredBy(e.target.value)}
                    placeholder="Driver/Company"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!itemName}>
              Add Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
