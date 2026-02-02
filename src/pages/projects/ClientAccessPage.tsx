import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Info, Save, ExternalLink, Mail, Phone } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Json } from '@/integrations/supabase/types';

interface ClientAccessModule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  hasTemplate?: boolean;
}

interface ClientAccessSettings {
  photos?: boolean;
  schedule?: boolean;
  daily_logs?: boolean;
  documents?: boolean;
  estimates?: boolean;
  invoices?: boolean;
  messaging?: boolean;
  notes?: boolean;
  change_orders?: boolean;
  submittals?: boolean;
  financial_summary?: boolean;
  work_orders?: boolean;
  show_phone?: boolean;
  show_email?: boolean;
}

const defaultModules: ClientAccessModule[] = [
  { id: 'photos', label: 'Photos', description: 'Before & After photos only', enabled: true },
  { id: 'schedule', label: 'Schedule', description: 'Project schedule', enabled: true },
  { id: 'daily_logs', label: 'Daily Logs', description: 'All items', enabled: false },
  { id: 'documents', label: 'Documents', description: 'Shared with client', enabled: false },
  { id: 'estimates', label: 'Estimates', description: 'Pending Approval, Approved', enabled: false, hasTemplate: true },
  { id: 'invoices', label: 'Invoices', description: 'Submitted, Approved, Paid', enabled: true, hasTemplate: true },
  { id: 'messaging', label: 'Messaging', description: 'All client messages', enabled: true },
  { id: 'notes', label: 'Notes', description: 'Shared with client', enabled: false },
  { id: 'change_orders', label: 'Change Orders', description: 'Pending Approval, Approved, Billed', enabled: false, hasTemplate: true },
  { id: 'submittals', label: 'Submittals', description: 'Submitted, Approved', enabled: false },
  { id: 'financial_summary', label: 'Financial Summary', description: 'Show/Hide Financial Summary', enabled: false },
  { id: 'work_orders', label: 'Work Orders', description: 'Submitted, Approved, Complete', enabled: false, hasTemplate: true },
];

export const ClientAccessPage: React.FC = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [modules, setModules] = useState<ClientAccessModule[]>(defaultModules);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch project details including client_access_settings
  const { data: project, isLoading } = useQuery({
    queryKey: ['project-client-access', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, address, client_phone, client_access_settings')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Initialize state from database settings when project loads
  useEffect(() => {
    if (project?.client_access_settings) {
      const settings = project.client_access_settings as unknown as ClientAccessSettings;
      
      // Update modules based on saved settings
      setModules(prev => prev.map(m => ({
        ...m,
        enabled: settings[m.id as keyof ClientAccessSettings] ?? m.enabled
      })));
      
      // Update contact display settings
      setShowPhone(settings.show_phone ?? false);
      setShowEmail(settings.show_email ?? false);
    }
  }, [project?.client_access_settings]);

  // Count before/after photos
  const { data: photoStats } = useQuery({
    queryKey: ['project-photo-stats', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_photos')
        .select('photo_tag')
        .eq('project_id', id!)
        .in('photo_tag', ['before', 'after']);
      
      if (error) throw error;
      
      const beforeCount = data?.filter(p => p.photo_tag === 'before').length || 0;
      const afterCount = data?.filter(p => p.photo_tag === 'after').length || 0;
      
      return { beforeCount, afterCount, total: beforeCount + afterCount };
    },
    enabled: !!id,
  });

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Build settings object from current state
      const settings: ClientAccessSettings = {
        ...modules.reduce((acc, m) => ({ ...acc, [m.id]: m.enabled }), {} as ClientAccessSettings),
        show_phone: showPhone,
        show_email: showEmail
      };
      
      const { error } = await supabase
        .from('projects')
        .update({ client_access_settings: settings as unknown as Json })
        .eq('id', id);
      
      if (error) throw error;
      
      // Invalidate queries so the preview updates
      queryClient.invalidateQueries({ queryKey: ['project-client-access', id] });
      queryClient.invalidateQueries({ queryKey: ['project-client-portal', id] });
      
      toast({
        title: 'Settings saved',
        description: 'Client access settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setModules(prev => prev.map(m => 
      m.id === moduleId ? { ...m, enabled: !m.enabled } : m
    ));
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <ProjectSidebar />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <ProjectSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Client Access Preferences</h1>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Project Info Banner */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{project?.name}</p>
                  <p className="text-sm text-muted-foreground">{project?.address}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => navigate(`/admin/projects/${id}/client-portal-preview`)}
                >
                  <ExternalLink className="h-4 w-4" />
                  Preview Client Portal
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Display Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Display Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="showPhone"
                    checked={showPhone}
                    onCheckedChange={(checked) => setShowPhone(checked === true)}
                  />
                  <Label htmlFor="showPhone" className="flex items-center gap-2 cursor-pointer">
                    <Phone className="h-4 w-4" />
                    Show Phone
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="showEmail"
                    checked={showEmail}
                    onCheckedChange={(checked) => setShowEmail(checked === true)}
                  />
                  <Label htmlFor="showEmail" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-4 w-4" />
                    Show Email
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modules Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Modules to Display</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b font-medium text-sm">
                  <div className="col-span-4">Modules to Display</div>
                  <div className="col-span-5 flex items-center gap-1">
                    <span className="w-1 h-4 bg-primary rounded-full"></span>
                    Items Shown
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <span className="w-1 h-4 bg-primary rounded-full"></span>
                    Template/View
                  </div>
                </div>

                {/* Table Body */}
                {modules.map((module) => (
                  <div 
                    key={module.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 border-b hover:bg-muted/30 transition-colors"
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <Checkbox 
                        id={module.id}
                        checked={module.enabled}
                        onCheckedChange={() => toggleModule(module.id)}
                      />
                      <Label htmlFor={module.id} className="cursor-pointer font-medium">
                        {module.label}
                      </Label>
                    </div>
                    <div className="col-span-5 flex items-center text-sm text-muted-foreground">
                      {module.id === 'photos' && photoStats ? (
                        <span>
                          {module.description} ({photoStats.beforeCount} before, {photoStats.afterCount} after)
                        </span>
                      ) : (
                        module.description
                      )}
                    </div>
                    <div className="col-span-3 flex items-center justify-between">
                      {module.hasTemplate ? (
                        <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                          Select Template to Use
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground/50 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Configure what {module.label.toLowerCase()} are visible to clients</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Photo Preview */}
          {modules.find(m => m.id === 'photos')?.enabled && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  📸 Photos Preview
                  <span className="text-xs font-normal text-muted-foreground">
                    (Only Before & After photos will be shown to clients)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="font-medium text-sm">Before Photos</span>
                    </div>
                    <p className="text-2xl font-bold">{photoStats?.beforeCount || 0}</p>
                    <p className="text-xs text-muted-foreground">photos tagged as "before"</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="font-medium text-sm">After Photos</span>
                    </div>
                    <p className="text-2xl font-bold">{photoStats?.afterCount || 0}</p>
                    <p className="text-xs text-muted-foreground">photos tagged as "after"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
