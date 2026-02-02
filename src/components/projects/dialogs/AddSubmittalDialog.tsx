import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AddSubmittalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const AddSubmittalDialog: React.FC<AddSubmittalDialogProps> = ({
  open,
  onOpenChange,
  projectId,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    submittal_type: '',
    spec_section: '',
    project_id: projectId,
    coordinator_id: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: teamMembers = [] } = useTeamMembers();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-submittal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a title",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Use new submittals table
      const { error } = await (supabase as any)
        .from('submittals')
        .insert([{
          project_id: formData.project_id,
          name: formData.title.trim(),
          submittal_type: formData.submittal_type || null,
          spec_section: formData.spec_section || null,
          description: formData.description.trim() || null,
          coordinator_id: formData.coordinator_id || null,
          status: 'draft',
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submittal created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['project-document-counts'] });
      queryClient.invalidateQueries({ queryKey: ['project-document-items'] });
      queryClient.invalidateQueries({ queryKey: ['submittals'] });
      setFormData({ title: '', description: '', submittal_type: '', spec_section: '', project_id: projectId, coordinator_id: '' });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating submittal:', error);
      toast({
        title: "Error",
        description: "Failed to create submittal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Submittal</DialogTitle>
          <DialogDescription>
            Create a new submittal for review and approval
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Roofing Material Samples"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select 
                value={formData.project_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="z-[10001] bg-background">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Coordinator</Label>
              <Select 
                value={formData.coordinator_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, coordinator_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select coordinator" />
                </SelectTrigger>
                <SelectContent className="z-[10001] bg-background">
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {(member.full_name || member.email)?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.full_name || member.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Submittal Type</Label>
              <Select 
                value={formData.submittal_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, submittal_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product-data">Product Data</SelectItem>
                  <SelectItem value="shop-drawings">Shop Drawings</SelectItem>
                  <SelectItem value="samples">Samples</SelectItem>
                  <SelectItem value="certificates">Certificates</SelectItem>
                  <SelectItem value="manufacturer-instructions">Manufacturer Instructions</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Spec Section</Label>
              <Input
                value={formData.spec_section}
                onChange={(e) => setFormData(prev => ({ ...prev, spec_section: e.target.value }))}
                placeholder="e.g., 07 31 00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the submittal..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Submittal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
