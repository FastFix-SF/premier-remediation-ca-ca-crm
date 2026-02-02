import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { BarChart3, Save, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsConfig {
  analytics_shared_site: string;
  analytics_shared_token: string;
}

const AnalyticsIntegration = () => {
  const [config, setConfig] = useState<AnalyticsConfig>({
    analytics_shared_site: '',
    analytics_shared_token: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'analytics_config')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.value && typeof data.value === 'object' && data.value !== null && !Array.isArray(data.value)) {
        const analyticsConfig = data.value as { [key: string]: any };
        const config: AnalyticsConfig = {
          analytics_shared_site: analyticsConfig.analytics_shared_site || '',
          analytics_shared_token: analyticsConfig.analytics_shared_token || ''
        };
        setConfig(config);
        setIsConfigured(!!(config.analytics_shared_site && config.analytics_shared_token));
      }
    } catch (error) {
      console.error('Error loading analytics config:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'analytics_config',
          value: config as any,
          description: 'Lovable Analytics shared stats configuration'
        });

      if (error) throw error;

      setIsConfigured(!!(config.analytics_shared_site && config.analytics_shared_token));
      toast({
        title: "Settings saved",
        description: "Analytics configuration has been updated successfully",
      });
    } catch (error) {
      console.error('Error saving analytics config:', error);
      toast({
        title: "Error",
        description: "Failed to save analytics configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.analytics_shared_site || !config.analytics_shared_token) {
      toast({
        title: "Missing configuration",
        description: "Please fill in both site and token fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analytics-proxy', {
        body: { endpoint: '/realtime' }
      });

      if (error) throw error;

      toast({
        title: "Connection successful",
        description: "Analytics integration is working correctly",
      });
    } catch (error) {
      console.error('Error testing analytics connection:', error);
      toast({
        title: "Connection failed",
        description: "Unable to connect to analytics. Please check your configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isConfigured) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Configured</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Not Configured</Badge>;
  };

  const getStatusIcon = () => {
    return isConfigured ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <AlertCircle className="w-4 h-4 text-gray-600" />;
  };

  if (isLoading && !config.analytics_shared_site) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading configuration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {getStatusIcon()}
            <BarChart3 className="w-4 h-4" />
            Lovable Analytics
          </CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Connect to your Lovable Analytics shared stats for real-time website analytics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="analytics_site">Site Domain</Label>
          <Input
            id="analytics_site"
            placeholder="e.g., roofingfriend.com"
            value={config.analytics_shared_site}
            onChange={(e) => setConfig(prev => ({ ...prev, analytics_shared_site: e.target.value }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="analytics_token">Shared Link Token</Label>
          <Input
            id="analytics_token"
            type="password"
            placeholder="Token from Lovable Analytics share URL"
            value={config.analytics_shared_token}
            onChange={(e) => setConfig(prev => ({ ...prev, analytics_shared_token: e.target.value }))}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 mb-2 font-medium">How to get your shared link:</p>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Go to your Lovable Analytics dashboard</li>
            <li>Click "Share stats" and enable public sharing</li>
            <li>Copy the site domain and auth token from the share URL</li>
            <li>Format: https://plausible.io/share/SITE?auth=TOKEN&embed=true</li>
          </ol>
          <Button variant="outline" size="sm" className="mt-2" asChild>
            <a href="https://lovable.dev" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 mr-1" />
              Open Lovable Analytics
            </a>
          </Button>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={saveConfig} 
            disabled={isSaving || !config.analytics_shared_site || !config.analytics_shared_token}
            className="flex-1"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Configuration
          </Button>
          
          <Button 
            variant="outline" 
            onClick={testConnection}
            disabled={isLoading || !isConfigured}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsIntegration;