import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePermit } from '@/hooks/usePermits';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CreatePermitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePermitDialog: React.FC<CreatePermitDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const createPermit = useCreatePermit();
  
  const [formData, setFormData] = useState({
    permit_number: '',
    permit_type: 'building',
    project_id: '',
    project_name: '',
    project_address: '',
    agency_name: '',
    fee: '',
    pulled_date: '',
    approved_date: '',
    expires_date: '',
    must_pull_by_date: '',
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, address')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedProject = projects.find(p => p.id === formData.project_id);
    
    await createPermit.mutateAsync({
      permit_number: formData.permit_number,
      permit_type: formData.permit_type,
      project_id: formData.project_id || null,
      project_name: selectedProject?.name || formData.project_name || null,
      project_address: selectedProject?.address || formData.project_address || null,
      agency_name: formData.agency_name || null,
      fee: formData.fee ? parseFloat(formData.fee) : null,
      pulled_date: formData.pulled_date || null,
      approved_date: formData.approved_date || null,
      expires_date: formData.expires_date || null,
      must_pull_by_date: formData.must_pull_by_date || null,
      status: 'active',
    });
    
    setFormData({
      permit_number: '',
      permit_type: 'building',
      project_id: '',
      project_name: '',
      project_address: '',
      agency_name: '',
      fee: '',
      pulled_date: '',
      approved_date: '',
      expires_date: '',
      must_pull_by_date: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Permit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="permit_number">Permit Number *</Label>
            <Input
              id="permit_number"
              value={formData.permit_number}
              onChange={(e) => setFormData({ ...formData, permit_number: e.target.value })}
              placeholder="e.g., BLD2024-12345"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="permit_type">Permit Type</Label>
            <Select
              value={formData.permit_type}
              onValueChange={(value) => setFormData({ ...formData, permit_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="building">Building</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="mechanical">Mechanical</SelectItem>
                <SelectItem value="roofing">Roofing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => setFormData({ ...formData, project_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name || project.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency_name">Agency</Label>
            <Input
              id="agency_name"
              value={formData.agency_name}
              onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
              placeholder="e.g., City of San Francisco"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee">Fee ($)</Label>
            <Input
              id="fee"
              type="number"
              step="0.01"
              value={formData.fee}
              onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pulled_date">Pulled Date</Label>
              <Input
                id="pulled_date"
                type="date"
                value={formData.pulled_date}
                onChange={(e) => setFormData({ ...formData, pulled_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approved_date">Approved Date</Label>
              <Input
                id="approved_date"
                type="date"
                value={formData.approved_date}
                onChange={(e) => setFormData({ ...formData, approved_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expires_date">Expires Date</Label>
              <Input
                id="expires_date"
                type="date"
                value={formData.expires_date}
                onChange={(e) => setFormData({ ...formData, expires_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="must_pull_by_date">Must Pull By</Label>
              <Input
                id="must_pull_by_date"
                type="date"
                value={formData.must_pull_by_date}
                onChange={(e) => setFormData({ ...formData, must_pull_by_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPermit.isPending}>
              {createPermit.isPending ? 'Creating...' : 'Create Permit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
