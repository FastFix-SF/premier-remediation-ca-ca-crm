import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Sparkles, Check, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// All available apps in the system
const ALL_APPS = [
  { id: 'projects', name: 'Projects' },
  { id: 'messages', name: 'Messages' },
  { id: 'clock', name: 'Clock In' },
  { id: 'schedule', name: 'Schedule' },
  { id: 'tasks', name: 'Tasks' },
  { id: 'time-off', name: 'Time Off' },
  { id: 'safety', name: 'Safety' },
  { id: 'inventory', name: 'Inventory' },
  { id: 'quizzes', name: 'Quizzes' },
  { id: 'ai-review', name: 'AI Review' },
  { id: 'settings', name: 'Settings' },
  { id: 'scoring', name: 'Scoring' },
  { id: 'photos', name: 'Photos' },
  { id: 'daily-logs', name: 'Daily Logs' },
  { id: 'work-orders', name: 'Work Orders' },
  { id: 'service-tickets', name: 'Tickets' },
  { id: 'inspections', name: 'Inspections' },
  { id: 'punchlists', name: 'Punchlists' },
  { id: 'documents', name: 'Files' },
  { id: 'incidents', name: 'Incidents' },
  { id: 'team', name: 'Team' },
  { id: 'permits', name: 'Permits' },
  { id: 'equipment', name: 'Equipment' },
  { id: 'vehicles', name: 'Vehicles' },
  { id: 'recognitions', name: 'Recognitions' },
  { id: 'leads', name: 'Leads' },
  { id: 'estimates', name: 'Estimates' },
  { id: 'invoices', name: 'Invoices' },
  { id: 'analytics', name: 'Analytics' },
  { id: 'expenses', name: 'Expenses' },
  { id: 'payments', name: 'Payments' },
  { id: 'financials', name: 'Financials' },
  { id: 'training', name: 'Training' },
  { id: 'email', name: 'Email' },
  { id: 'warranties', name: 'Warranties' },
  { id: 'contracts', name: 'Contracts' },
  { id: 'proposals', name: 'Proposals' },
  { id: 'solar', name: 'Solar' },
];

interface AppIconRecord {
  app_id: string;
  icon_url: string | null;
  status: string;
  error_message: string | null;
}

export default function AppIconsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatingApps, setGeneratingApps] = useState<Set<string>>(new Set());

  // Fetch all icon statuses
  const { data: iconRecords = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-app-icons'],
    queryFn: async (): Promise<AppIconRecord[]> => {
      const { data, error } = await supabase
        .from('app_icons')
        .select('app_id, icon_url, status, error_message');

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000, // Poll every 5 seconds while generating
  });

  // Create a lookup map
  const iconMap = useMemo(() => {
    return Object.fromEntries(
      iconRecords.map(r => [r.app_id, r])
    );
  }, [iconRecords]);

  // Generate icon mutation
  const generateMutation = useMutation({
    mutationFn: async ({ appId, appName }: { appId: string; appName: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-app-icon', {
        body: { appId, appName },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Icon Generated',
        description: `Successfully generated icon for ${variables.appName}`,
      });
      setGeneratingApps(prev => {
        const next = new Set(prev);
        next.delete(variables.appId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['admin-app-icons'] });
      queryClient.invalidateQueries({ queryKey: ['app-icons'] });
    },
    onError: (error, variables) => {
      toast({
        title: 'Generation Failed',
        description: `Failed to generate icon for ${variables.appName}: ${error.message}`,
        variant: 'destructive',
      });
      setGeneratingApps(prev => {
        const next = new Set(prev);
        next.delete(variables.appId);
        return next;
      });
    },
  });

  const handleGenerate = (appId: string, appName: string) => {
    setGeneratingApps(prev => new Set(prev).add(appId));
    generateMutation.mutate({ appId, appName });
  };

  const handleGenerateAll = async () => {
    const appsToGenerate = ALL_APPS.filter(app => {
      const record = iconMap[app.id];
      return !record || record.status !== 'completed';
    });

    toast({
      title: 'Batch Generation Started',
      description: `Generating ${appsToGenerate.length} icons. This may take a few minutes.`,
    });

    // Generate sequentially to avoid rate limits
    for (const app of appsToGenerate) {
      setGeneratingApps(prev => new Set(prev).add(app.id));
      try {
        await supabase.functions.invoke('generate-app-icon', {
          body: { appId: app.id, appName: app.name },
        });
        queryClient.invalidateQueries({ queryKey: ['admin-app-icons'] });
      } catch (error) {
        console.error(`Failed to generate icon for ${app.id}:`, error);
      }
      setGeneratingApps(prev => {
        const next = new Set(prev);
        next.delete(app.id);
        return next;
      });
      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    queryClient.invalidateQueries({ queryKey: ['app-icons'] });
    toast({
      title: 'Batch Generation Complete',
      description: 'All icons have been generated.',
    });
  };

  const completedCount = iconRecords.filter(r => r.status === 'completed').length;
  const pendingCount = ALL_APPS.length - completedCount;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">App Icon Manager</h1>
          <p className="text-muted-foreground">
            Generate premium AI 3D icons for all mobile apps (iOS 26 style)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {completedCount}/{ALL_APPS.length} Generated
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={handleGenerateAll} disabled={pendingCount === 0}>
            <Sparkles className="w-4 h-4 mr-1" />
            Generate All ({pendingCount})
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {ALL_APPS.map(app => {
            const record = iconMap[app.id];
            const isGenerating = generatingApps.has(app.id) || record?.status === 'generating';
            const isCompleted = record?.status === 'completed';
            const isFailed = record?.status === 'failed';

            return (
              <Card key={app.id} className={cn(
                "relative overflow-hidden transition-all",
                isCompleted && "ring-2 ring-green-500/20",
                isFailed && "ring-2 ring-red-500/20"
              )}>
                <CardContent className="p-4 flex flex-col items-center gap-3">
                  {/* Icon Preview */}
                  <div className="relative w-16 h-16 rounded-[22%] overflow-hidden bg-muted flex items-center justify-center">
                    {record?.icon_url ? (
                      <img 
                        src={record.icon_url} 
                        alt={app.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                    )}
                    
                    {/* Status overlay */}
                    {isGenerating && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>

                  {/* App Name */}
                  <span className="text-sm font-medium text-center">{app.name}</span>

                  {/* Status Badge */}
                  <Badge 
                    variant={isCompleted ? "default" : isFailed ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        Generating
                      </>
                    ) : isCompleted ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Ready
                      </>
                    ) : isFailed ? (
                      <>
                        <X className="w-3 h-3 mr-1" />
                        Failed
                      </>
                    ) : (
                      'Pending'
                    )}
                  </Badge>

                  {/* Generate/Regenerate Button */}
                  <Button
                    size="sm"
                    variant={isCompleted ? "outline" : "default"}
                    className="w-full"
                    disabled={isGenerating}
                    onClick={() => handleGenerate(app.id, app.name)}
                  >
                    {isCompleted ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Regenerate
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-1" />
                        Generate
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
