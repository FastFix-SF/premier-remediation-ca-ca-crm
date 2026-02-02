import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateEstimate, PROJECT_TYPES, SECTORS, Estimate } from '@/hooks/useEstimates';
import { format, addDays } from 'date-fns';

interface CreateEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (estimate: Estimate) => void;
}

export function CreateEstimateDialog({ open, onOpenChange, onSuccess }: CreateEstimateDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    city: '',
    state: '',
    zip: '',
    project_type: 'residential',
    sector: 'new_construction',
    estimate_date: format(new Date(), 'yyyy-MM-dd'),
    expiration_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  });

  const createEstimate = useCreateEstimate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await createEstimate.mutateAsync(formData);
      onOpenChange(false);
      setFormData({
        title: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: '',
        city: '',
        state: '',
        zip: '',
        project_type: 'residential',
        sector: 'new_construction',
        estimate_date: format(new Date(), 'yyyy-MM-dd'),
        expiration_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      });
      if (onSuccess) {
        onSuccess(result as Estimate);
      }
    } catch (error) {
      console.error('Failed to create estimate:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Estimate</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Title / Project Name</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Smith Residence Re-Roof"
                />
              </div>
              <div>
                <Label htmlFor="project_type">Project Type</Label>
                <Select
                  value={formData.project_type}
                  onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sector">Sector</Label>
                <Select
                  value={formData.sector}
                  onValueChange={(value) => setFormData({ ...formData, sector: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((sector) => (
                      <SelectItem key={sector.value} value={sector.value}>
                        {sector.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Phone</Label>
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Project Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="customer_address">Street Address</Label>
                <Input
                  id="customer_address"
                  value={formData.customer_address}
                  onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="San Francisco"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="CA"
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="94102"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimate_date">Estimate Date</Label>
                <Input
                  id="estimate_date"
                  type="date"
                  value={formData.estimate_date}
                  onChange={(e) => setFormData({ ...formData, estimate_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEstimate.isPending}>
              {createEstimate.isPending ? 'Creating...' : 'Create Estimate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
