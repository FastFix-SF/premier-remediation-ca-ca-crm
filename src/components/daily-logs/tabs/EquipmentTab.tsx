import React, { useState } from 'react';
import { Plus, Trash2, Wrench, Truck, ClipboardList } from 'lucide-react';
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
  DailyLogEquipment,
  useAddDailyLogEquipment,
  useDeleteDailyLogEquipment,
} from '@/hooks/useDailyLogs';

interface EquipmentTabProps {
  dailyLogId: string;
  equipment: DailyLogEquipment[];
}

export const EquipmentTab: React.FC<EquipmentTabProps> = ({ dailyLogId, equipment }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [equipmentType, setEquipmentType] = useState<'delivered' | 'used' | 'log'>('used');
  const [equipmentName, setEquipmentName] = useState('');
  const [hours, setHours] = useState('');
  const [operator, setOperator] = useState('');
  const [costCode, setCostCode] = useState('');
  const [status, setStatus] = useState('');

  const addMutation = useAddDailyLogEquipment();
  const deleteMutation = useDeleteDailyLogEquipment();

  const deliveredEquipment = equipment.filter((e) => e.equipment_type === 'delivered');
  const usedEquipment = equipment.filter((e) => e.equipment_type === 'used');
  const logEquipment = equipment.filter((e) => e.equipment_type === 'log');

  const handleAdd = async () => {
    await addMutation.mutateAsync({
      daily_log_id: dailyLogId,
      equipment_type: equipmentType,
      equipment_name: equipmentName,
      hours: hours ? parseFloat(hours) : null,
      operator: operator || null,
      cost_code: costCode || null,
      status: status || null,
      description: null,
    });
    resetForm();
    setAddOpen(false);
  };

  const resetForm = () => {
    setEquipmentName('');
    setHours('');
    setOperator('');
    setCostCode('');
    setStatus('');
  };

  const EquipmentTable = ({ items }: { items: DailyLogEquipment[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Equipment</TableHead>
          <TableHead>Hours</TableHead>
          <TableHead>Operator</TableHead>
          <TableHead>Cost Code</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.equipment_name}</TableCell>
            <TableCell>{item.hours ?? '-'}</TableCell>
            <TableCell>{item.operator || '-'}</TableCell>
            <TableCell>{item.cost_code || '-'}</TableCell>
            <TableCell>{item.status || '-'}</TableCell>
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
          Add Equipment
        </Button>
      </div>

      {/* Equipment Delivered */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Equipment Delivered ({deliveredEquipment.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deliveredEquipment.length > 0 ? (
            <EquipmentTable items={deliveredEquipment} />
          ) : (
            <p className="text-sm text-muted-foreground">No equipment delivered</p>
          )}
        </CardContent>
      </Card>

      {/* Equipment Used */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Equipment Used ({usedEquipment.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usedEquipment.length > 0 ? (
            <EquipmentTable items={usedEquipment} />
          ) : (
            <p className="text-sm text-muted-foreground">No equipment used</p>
          )}
        </CardContent>
      </Card>

      {/* Equipment Log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Equipment Log ({logEquipment.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logEquipment.length > 0 ? (
            <EquipmentTable items={logEquipment} />
          ) : (
            <p className="text-sm text-muted-foreground">No equipment logs</p>
          )}
        </CardContent>
      </Card>

      {/* Add Equipment Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={equipmentType} onValueChange={(v) => setEquipmentType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="log">Log Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipment Name</Label>
              <Input
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                placeholder="e.g., Crane, Forklift"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Operator</Label>
                <Input
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="Operator name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost Code</Label>
                <Input
                  value={costCode}
                  onChange={(e) => setCostCode(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Input
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="e.g., Active, Idle"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!equipmentName}>
              Add Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
