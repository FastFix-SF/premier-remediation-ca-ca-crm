import React, { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Receipt, ExternalLink, CreditCard, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVendors } from '@/hooks/useDirectoryContacts';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface AddBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
}

interface BillFormData {
  project: string;
  vendor: string;
  billDate: Date | undefined;
  billNumber: string;
  terms: string;
  billable: boolean;
}

const AddBillDialog: React.FC<AddBillDialogProps> = ({
  open,
  onOpenChange,
  contactId,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BillFormData>({
    project: '',
    vendor: '',
    billDate: new Date(),
    billNumber: '',
    terms: '',
    billable: false,
  });

  // Fetch projects from database
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, address')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch vendors from directory_contacts
  const { data: vendors = [] } = useVendors();

  // Save bill mutation
  const saveBillMutation = useMutation({
    mutationFn: async (data: BillFormData) => {
      const { data: result, error } = await supabase
        .from('contact_bills')
        .insert({
          contact_id: contactId,
          project_id: data.project || null,
          vendor_id: data.vendor || null,
          bill_number: data.billNumber,
          bill_date: data.billDate ? format(data.billDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          terms: data.terms || null,
          is_billable: data.billable,
          status: 'pending',
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Bill saved successfully');
      queryClient.invalidateQueries({ queryKey: ['contact-bills', contactId] });
      onOpenChange(false);
      // Reset form
      setFormData({
        project: '',
        vendor: '',
        billDate: new Date(),
        billNumber: '',
        terms: '',
        billable: false,
      });
    },
    onError: (error) => {
      console.error('Error saving bill:', error);
      toast.error('Failed to save bill');
    },
  });

  const handleSubmit = () => {
    if (!formData.billNumber.trim()) {
      toast.error('Bill number is required');
      return;
    }
    if (!formData.vendor) {
      toast.error('Vendor is required');
      return;
    }
    saveBillMutation.mutate(formData);
  };

  const selectedVendor = vendors.find(v => v.id === formData.vendor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">Add Bill</DialogTitle>
        </DialogHeader>

        <div className="border-l-2 border-primary/20 pl-6 space-y-6">
          {/* Project */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Project</Label>
            <Select
              value={formData.project}
              onValueChange={(value) =>
                setFormData({ ...formData, project: value })
              }
            >
              <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name || project.address || 'Unnamed Project'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vendor & Bill Date Row */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Vendor <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={formData.vendor}
                    onValueChange={(value) =>
                      setFormData({ ...formData, vendor: value })
                    }
                  >
                    <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0">
                      <div className="flex items-center gap-2">
                        {selectedVendor && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">
                            {(selectedVendor.company || selectedVendor.contact_name || 'VD')?.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                        <SelectValue placeholder="Select vendor" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">
                              {(vendor.company || vendor.contact_name || 'VD')?.substring(0, 2).toUpperCase()}
                            </span>
                            {vendor.company || vendor.contact_name || vendor.email}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Bill Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-between font-normal border-0 border-b rounded-none px-0 hover:bg-transparent',
                      !formData.billDate && 'text-muted-foreground'
                    )}
                  >
                    {formData.billDate
                      ? format(formData.billDate, 'MM/dd/yyyy')
                      : 'Select date'}
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.billDate}
                    onSelect={(date) =>
                      setFormData({ ...formData, billDate: date })
                    }
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Bill # & Terms Row */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="billNumber" className="text-sm font-medium">
                Bill # <span className="text-destructive">*</span>
              </Label>
              <Input
                id="billNumber"
                value={formData.billNumber}
                onChange={(e) =>
                  setFormData({ ...formData, billNumber: e.target.value })
                }
                placeholder="Enter bill number"
                className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Terms</Label>
              <Select
                value={formData.terms}
                onValueChange={(value) =>
                  setFormData({ ...formData, terms: value })
                }
              >
                <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0">
                  <SelectValue placeholder="Select terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net-15">Net 15</SelectItem>
                  <SelectItem value="net-30">Net 30</SelectItem>
                  <SelectItem value="net-45">Net 45</SelectItem>
                  <SelectItem value="net-60">Net 60</SelectItem>
                  <SelectItem value="due-on-receipt">Due on Receipt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Billable Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="billable"
              checked={formData.billable}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, billable: checked as boolean })
              }
            />
            <Label htmlFor="billable" className="text-sm font-medium cursor-pointer">
              Billable
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saveBillMutation.isPending}>
            {saveBillMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Bill'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddBillDialog;
