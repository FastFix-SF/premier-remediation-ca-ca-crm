import React, { useState } from 'react';
import { FileText, ExternalLink, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVendors } from '@/hooks/useDirectoryContacts';
import { useTeamMembers } from '@/hooks/useTeamMembers';
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

interface AddPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  onSubmit?: (data: PurchaseOrderFormData) => void;
}

interface PurchaseOrderFormData {
  project: string;
  type: string;
  subject: string;
  from: string;
  supplier: string;
  billingStatus: string;
  billable: boolean;
}

const TYPE_OPTIONS = ['Purchase Order', 'Pricing Request'];

const BILLING_STATUS_OPTIONS = [
  'Draft',
  'Pricing Requested',
  'Approved',
  'Submitted',
  'Received',
  'Closed',
  'Cancelled',
  'Declined/ Quotes',
];

const AddPurchaseOrderDialog: React.FC<AddPurchaseOrderDialogProps> = ({
  open,
  onOpenChange,
  contactId,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    project: '',
    type: 'Purchase Order',
    subject: '',
    from: '',
    supplier: '',
    billingStatus: 'Draft',
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

  // Fetch team members from team_directory
  const { data: teamMembers = [] } = useTeamMembers();

  // Fetch vendors from directory_contacts
  const { data: vendors = [] } = useVendors();

  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSubmit = () => {
    onSubmit?.(formData);
    onOpenChange(false);
    setFormData({
      project: '',
      type: 'Purchase Order',
      subject: '',
      from: '',
      supplier: '',
      billingStatus: 'Draft',
      billable: false,
    });
  };

  const selectedEmployee = teamMembers.find((e) => e.user_id === formData.from);
  const selectedVendor = vendors.find((v) => v.id === formData.supplier);

  const getDisplayName = (contact: { first_name?: string | null; last_name?: string | null; contact_name?: string | null; company?: string | null; email?: string | null; full_name?: string | null }) => {
    if (contact.full_name) return contact.full_name;
    if (contact.first_name && contact.last_name) {
      return `${contact.first_name} ${contact.last_name}`;
    }
    return contact.contact_name || contact.company || contact.email || 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">Add Purchase Order</DialogTitle>
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

          {/* Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              placeholder="Enter subject"
              className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
            />
          </div>

          {/* From (Team Members only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              From <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                {selectedEmployee && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-medium text-primary">
                    {getInitials(selectedEmployee.full_name || selectedEmployee.email)}
                  </div>
                )}
                <Select
                  value={formData.from}
                  onValueChange={(value) =>
                    setFormData({ ...formData, from: value })
                  }
                >
                  <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0 flex-1">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.full_name || member.email}
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

          {/* Supplier (Vendors only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Supplier</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                {selectedVendor && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-medium text-primary">
                    {getInitials(selectedVendor.company || getDisplayName(selectedVendor))}
                  </div>
                )}
                <Select
                  value={formData.supplier}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplier: value })
                  }
                >
                  <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0 flex-1">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.company || getDisplayName(vendor)}
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

          {/* PO # & Billing Status Row */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">PO #</Label>
              <div className="border-b py-2">
                <span className="text-sm text-muted-foreground">Save To View</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Billing Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.billingStatus}
                onValueChange={(value) =>
                  setFormData({ ...formData, billingStatus: value })
                }
              >
                <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Billable Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="billable-po"
              checked={formData.billable}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, billable: checked as boolean })
              }
            />
            <Label htmlFor="billable-po" className="text-sm font-medium cursor-pointer">
              Billable
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Purchase Order</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPurchaseOrderDialog;
