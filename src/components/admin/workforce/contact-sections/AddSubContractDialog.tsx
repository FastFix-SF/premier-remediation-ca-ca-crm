import React, { useState } from 'react';
import { FileSignature, ExternalLink, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useContractors } from '@/hooks/useDirectoryContacts';
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

interface AddSubContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  onSubmit?: (data: SubContractFormData) => void;
}

interface SubContractFormData {
  project: string;
  subject: string;
  agreementNumber: string;
  subcontractor: string;
  billable: boolean;
}

const AddSubContractDialog: React.FC<AddSubContractDialogProps> = ({
  open,
  onOpenChange,
  contactId,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<SubContractFormData>({
    project: '',
    subject: '',
    agreementNumber: '',
    subcontractor: '',
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

  // Fetch contractors from directory_contacts
  const { data: contractors = [] } = useContractors();

  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (contact: typeof contractors[0]) => {
    if (contact.first_name && contact.last_name) {
      return `${contact.first_name} ${contact.last_name}`;
    }
    return contact.contact_name || contact.company || contact.email || 'Unknown';
  };

  const handleSubmit = () => {
    onSubmit?.(formData);
    onOpenChange(false);
    setFormData({
      project: '',
      subject: '',
      agreementNumber: '',
      subcontractor: '',
      billable: false,
    });
  };

  const selectedContractor = contractors.find((c) => c.id === formData.subcontractor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileSignature className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">Add Sub-Contract</DialogTitle>
        </DialogHeader>

        <div className="border-l-2 border-primary/20 pl-6 space-y-6">
          {/* Project */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Project <span className="text-destructive">*</span>
            </Label>
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

          {/* Subject & Agreement # Row */}
          <div className="grid grid-cols-2 gap-6">
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

            <div className="space-y-2">
              <Label htmlFor="agreementNumber" className="text-sm font-medium">
                Agreement # <span className="text-destructive">*</span>
              </Label>
              <Input
                id="agreementNumber"
                value={formData.agreementNumber}
                onChange={(e) =>
                  setFormData({ ...formData, agreementNumber: e.target.value })
                }
                placeholder="Enter agreement number"
                className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
              />
            </div>
          </div>

          {/* Subcontractor */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Subcontractor</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                {selectedContractor && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-medium text-primary">
                    {getInitials(selectedContractor.company || getDisplayName(selectedContractor))}
                  </div>
                )}
                <Select
                  value={formData.subcontractor}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subcontractor: value })
                  }
                >
                  <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0 flex-1">
                    <SelectValue placeholder="Select subcontractor" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.company || getDisplayName(contractor)}
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

          {/* Billable Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="billable-subcontract"
              checked={formData.billable}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, billable: checked as boolean })
              }
            />
            <Label htmlFor="billable-subcontract" className="text-sm font-medium cursor-pointer">
              Billable
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Sub-Contract</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubContractDialog;
