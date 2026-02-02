import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const AddMaterialDialog: React.FC<AddMaterialDialogProps> = ({
  open,
  onOpenChange,
  projectId
}) => {
  const [bills, setBills] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: new Date(),
    vendor: '',
    item_code: '',
    item_description: '',
    quantity: 1,
    unit: 'each',
    unit_price: '',
    tax_amount: '',
    notes: '',
    bill_id: '',
    quantity_ordered: '',
    quantity_received: '',
    status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch available bills when dialog opens
  useEffect(() => {
    if (open) {
      fetchBills();
    }
  }, [open, projectId]);

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from('material_bills')
        .select('*')
        .eq('project_id', projectId)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor || !formData.item_description || !formData.unit_price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const unitPrice = parseFloat(formData.unit_price);
      const taxAmount = parseFloat(formData.tax_amount) || 0;
      const quantityOrdered = parseFloat(formData.quantity_ordered || formData.quantity.toString());
      const quantityReceived = parseFloat(formData.quantity_received || '0');
      const quantityRemaining = quantityOrdered - quantityReceived;
      const totalAmount = (unitPrice * quantityOrdered) + taxAmount;

      const { error } = await supabase
        .from('project_materials')
        .insert({
          project_id: projectId,
          date: formData.date.toISOString().split('T')[0],
          vendor: formData.vendor,
          item_code: formData.item_code || null,
          item_description: formData.item_description,
          quantity: quantityOrdered, // Keep for backward compatibility
          quantity_ordered: quantityOrdered,
          quantity_received: quantityReceived,
          quantity_remaining: quantityRemaining,
          unit: formData.unit,
          unit_price: unitPrice,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          bill_id: formData.bill_id || null,
          status: formData.status,
          source: 'manual',
          notes: formData.notes || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Material added successfully",
      });

      // Reset form
      setFormData({
        date: new Date(),
        vendor: '',
        item_code: '',
        item_description: '',
        quantity: 1,
        unit: 'each',
        unit_price: '',
        tax_amount: '',
        notes: '',
        bill_id: '',
        quantity_ordered: '',
        quantity_received: '',
        status: 'pending'
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error adding material:', error);
      toast({
        title: "Error",
        description: "Failed to add material",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    const unitPrice = parseFloat(formData.unit_price) || 0;
    const taxAmount = parseFloat(formData.tax_amount) || 0;
    return (unitPrice * formData.quantity) + taxAmount;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Material Item</DialogTitle>
          <DialogDescription>
            Add a new material purchase to this project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Link to Bill */}
          <div className="space-y-2">
            <Label htmlFor="bill_id">Link to Bill (Optional)</Label>
            <Select value={formData.bill_id} onValueChange={(value) => handleInputChange('bill_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select existing bill or leave blank" />
              </SelectTrigger>
              <SelectContent>
                {bills.map((bill) => (
                  <SelectItem key={bill.id} value={bill.id}>
                    {bill.bill_number} - {bill.vendor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && handleInputChange('date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Vendor */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor *</Label>
            <Input
              id="vendor"
              value={formData.vendor}
              onChange={(e) => handleInputChange('vendor', e.target.value)}
              placeholder="Home Depot, Lowes, etc."
              required
            />
          </div>

          {/* Item Code */}
          <div className="space-y-2">
            <Label htmlFor="item_code">Item Code/SKU</Label>
            <Input
              id="item_code"
              value={formData.item_code}
              onChange={(e) => handleInputChange('item_code', e.target.value)}
              placeholder="Optional SKU or part number"
            />
          </div>

          {/* Item Description */}
          <div className="space-y-2">
            <Label htmlFor="item_description">Item Description *</Label>
            <Textarea
              id="item_description"
              value={formData.item_description}
              onChange={(e) => handleInputChange('item_description', e.target.value)}
              placeholder="Describe the material or item"
              required
              rows={2}
            />
          </div>

          {/* Enhanced Quantity Tracking */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity_ordered">Qty Ordered *</Label>
              <Input
                id="quantity_ordered"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.quantity_ordered || formData.quantity}
                onChange={(e) => handleInputChange('quantity_ordered', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity_received">Qty Received</Label>
              <Input
                id="quantity_received"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity_received}
                onChange={(e) => handleInputChange('quantity_received', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="each">Each</SelectItem>
                  <SelectItem value="sq ft">Sq Ft</SelectItem>
                  <SelectItem value="bundle">Bundle</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="roll">Roll</SelectItem>
                  <SelectItem value="sheet">Sheet</SelectItem>
                  <SelectItem value="linear ft">Linear Ft</SelectItem>
                  <SelectItem value="gallon">Gallon</SelectItem>
                  <SelectItem value="lb">Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="sent_to_yard">Sent to Yard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Unit Price and Tax */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price *</Label>
              <Input
                id="unit_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => handleInputChange('unit_price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_amount">Tax Amount</Label>
              <Input
                id="tax_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.tax_amount}
                onChange={(e) => handleInputChange('tax_amount', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Total Display */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="text-lg font-bold">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes or details"
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Material'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};