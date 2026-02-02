import React, { useState, useRef } from 'react';
import { ShieldCheck, Plus, Calendar } from 'lucide-react';
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

interface AddInsuranceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: InsuranceFormData) => void;
}

interface InsuranceFormData {
  policyType: string;
  policyNumber: string;
  expiresDate: string;
  doesNotExpire: boolean;
  limit: string;
  files: File[];
}

const AddInsuranceDialog: React.FC<AddInsuranceDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<InsuranceFormData>({
    policyType: '',
    policyNumber: '',
    expiresDate: '',
    doesNotExpire: false,
    limit: '0.00',
    files: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, files: [...formData.files, ...Array.from(e.target.files)] });
    }
  };

  const handleSubmit = () => {
    onSubmit?.(formData);
    onOpenChange(false);
    setFormData({
      policyType: '',
      policyNumber: '',
      expiresDate: '',
      doesNotExpire: false,
      limit: '0.00',
      files: [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">Add Insurance</DialogTitle>
        </DialogHeader>

        <div className="border-l-2 border-primary/20 pl-6 space-y-6">
          {/* Policy Type */}
          <div className="space-y-2">
            <Label htmlFor="policyType" className="text-sm font-medium">
              Policy Type <span className="text-destructive">*</span>
            </Label>
            <Input
              id="policyType"
              value={formData.policyType}
              onChange={(e) =>
                setFormData({ ...formData, policyType: e.target.value })
              }
              placeholder="Enter policy type"
              className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
            />
          </div>

          {/* Policy # */}
          <div className="space-y-2">
            <Label htmlFor="policyNumber" className="text-sm font-medium">
              Policy # <span className="text-destructive">*</span>
            </Label>
            <Input
              id="policyNumber"
              value={formData.policyNumber}
              onChange={(e) =>
                setFormData({ ...formData, policyNumber: e.target.value })
              }
              placeholder="Enter policy number"
              className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
            />
          </div>

          {/* Expires */}
          <div className="space-y-2">
            <Label htmlFor="expiresDate" className="text-sm font-medium">
              Expires
            </Label>
            <div className="relative">
              <Input
                id="expiresDate"
                type="date"
                value={formData.expiresDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiresDate: e.target.value })
                }
                disabled={formData.doesNotExpire}
                className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary pr-10"
              />
              <Calendar className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Does Not Expire */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="doesNotExpireInsurance"
              checked={formData.doesNotExpire}
              onCheckedChange={(checked) =>
                setFormData({ 
                  ...formData, 
                  doesNotExpire: checked as boolean,
                  expiresDate: checked ? '' : formData.expiresDate 
                })
              }
            />
            <Label htmlFor="doesNotExpireInsurance" className="text-sm font-medium cursor-pointer">
              Does Not Expire
            </Label>
          </div>

          {/* Limit */}
          <div className="space-y-2">
            <Label htmlFor="limit" className="text-sm font-medium">
              Limit
            </Label>
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="limit"
                value={formData.limit}
                onChange={(e) =>
                  setFormData({ ...formData, limit: e.target.value })
                }
                placeholder="0.00"
                type="number"
                step="0.01"
                className="border-0 border-b rounded-none pl-4 focus-visible:ring-0 focus-visible:border-primary"
              />
            </div>
          </div>

          {/* Files */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Files</Label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Plus className="h-6 w-6 text-muted-foreground" />
              </button>
              {formData.files.map((file, index) => (
                <div key={index} className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center text-xs text-center p-2 overflow-hidden">
                  {file.name}
                </div>
              ))}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Insurance</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddInsuranceDialog;
