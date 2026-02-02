import React, { useState } from 'react';
import { Plus, MapPin, Satellite } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateQuoteProjectDialogProps {
  onProjectCreated?: () => void;
}

export function CreateQuoteProjectDialog({ onProjectCreated }: CreateQuoteProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: ''
  });
  const [createdProject, setCreatedProject] = useState<{
    id: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      toast({
        title: "Required Fields",
        description: "Please enter both project name and address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create the main project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: formData.name.trim(),
          address: formData.address.trim(),
          status: 'active',
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
          created_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();

      if (projectError) throw projectError;

      // Step 2: Geocode the address (we'll store coords in quote_requests table later if needed)
      const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-address', {
        body: {
          quote_request_id: project.id, // We'll use project id temporarily
          address: formData.address.trim()
        }
      });

      if (geocodeError) {
        console.warn('Geocoding failed:', geocodeError);
        // Continue without coordinates
      }

      const latitude = geocodeData?.latitude;
      const longitude = geocodeData?.longitude;

      // Step 3: Create roof quoter project entry
      const { error: quoterError } = await supabase
        .from('roof_quoter_projects')
        .insert({
          project_id: project.id,
          address: formData.address.trim(),
          city: '',
          state: '',
          zip: ''
        });

      if (quoterError) throw quoterError;

      setCreatedProject({
        id: project.id,
        latitude,
        longitude
      });

      toast({
        title: "Project Created",
        description: "Project has been created successfully.",
      });

      // Close dialog and refresh
      setOpen(false);
      setFormData({ name: '', address: '' });
      setCreatedProject(null);
      onProjectCreated?.();

      // Open quoter in new tab
      setTimeout(() => {
        window.open(`/projects/${project.id}/quoter`, '_blank');
      }, 500);

    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setFormData({ name: '', address: '' });
    setCreatedProject(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Quote Project
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Quote Project</DialogTitle>
            <DialogDescription>
              Enter the project details to get started with the roof quoter.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="e.g., Johnson Residence Roof"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Property Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="address"
                  placeholder="123 Main St, City, State 12345"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll use this address to find the best aerial imagery
              </p>
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Satellite className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}