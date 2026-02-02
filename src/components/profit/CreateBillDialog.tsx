import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";

interface CreateBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onBillCreated?: () => void;
}

export function CreateBillDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  onBillCreated 
}: CreateBillDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendor: '',
    order_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'ordered'
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('material_bills')
        .insert({
          project_id: projectId,
          vendor: formData.vendor,
          order_date: formData.order_date,
          notes: formData.notes,
          status: formData.status
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      toast({
        title: "Bill Created",
        description: `Bill ${data.bill_number} has been created successfully.`,
      });

      onBillCreated?.();
      handleClose();
    } catch (error) {
      console.error('Error creating bill:', error);
      toast({
        title: "Error",
        description: "Failed to create bill. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      vendor: '',
      order_date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'ordered'
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Material Bill</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Input
              id="vendor"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder="Enter vendor name"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="order_date">Order Date</Label>
            <Input
              id="order_date"
              type="date"
              value={formData.order_date}
              onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about this order"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Bill'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}