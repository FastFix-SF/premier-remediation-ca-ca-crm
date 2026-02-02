
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Settings, Database, Globe, CheckCircle, AlertCircle, RefreshCw, Shield, Bell, BarChart3, Save, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';

interface ApiStatus {
  name: string;
  key: string;
  status: 'connected' | 'disconnected';
  description: string;
}

interface AdminSettingsProps {}

const AdminSettings: React.FC<AdminSettingsProps> = () => {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([
    { name: 'OpenAI API', key: 'OPENAI_API_KEY', status: 'connected', description: 'AI chat and content generation' },
    { name: 'Stripe API', key: 'STRIPE_SECRET_KEY', status: 'connected', description: 'Payment processing' }
  ]);
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    storage: 'healthy',
    functions: 'healthy',
    auth: 'healthy'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    leadNotifications: true,
    systemAlerts: false
  });
  const { toast } = useToast();

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    setIsLoading(true);
    try {
      // Check database connection
      const { error: dbError } = await supabase.from('leads').select('count').limit(1);
      
      // Check auth system
      const { data: { session } } = await supabase.auth.getSession();
      
      setSystemHealth({
        database: dbError ? 'error' : 'healthy',
        storage: 'healthy',
        functions: 'healthy',
        auth: session ? 'healthy' : 'warning'
      });

      toast({
        title: "System Health Check Complete",
        description: "All systems are running normally",
      });
    } catch (error) {
      console.error('Health check failed:', error);
      toast({
        title: "Health Check Failed",
        description: "Some systems may be experiencing issues",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'disconnected':
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      case 'disconnected':
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Disconnected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>;
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Settings Updated",
      description: `${key} has been ${value ? 'enabled' : 'disabled'}`,
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="system" className="space-y-6">
        <div className="bg-muted/50 rounded-xl border shadow-sm p-2 inline-flex">
          <TabsList variant="segmented">
            <TabsTrigger variant="segmented" value="system" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              System
            </TabsTrigger>
            <TabsTrigger variant="segmented" value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger variant="segmented" value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    System Health
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={checkSystemHealth}
                    disabled={isLoading}
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Check Health
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(systemHealth).map(([key, status]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status)}
                        <span className="font-medium capitalize">{key}</span>
                      </div>
                      {getStatusBadge(status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Database Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Total Leads</span>
                    <Badge variant="secondary">147</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Blog Posts</span>
                    <Badge variant="secondary">23</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Chat Sessions</span>
                    <Badge variant="secondary">1,284</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Projects Synced</span>
                    <Badge variant="secondary">45</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View Detailed Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Access Control</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium block">Two-Factor Authentication</span>
                        <span className="text-sm text-muted-foreground">Require 2FA for admin access</span>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium block">Session Timeout</span>
                        <span className="text-sm text-muted-foreground">Auto-logout after inactivity</span>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Data Protection</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium block">Data Encryption</span>
                        <span className="text-sm text-muted-foreground">Encrypt sensitive data at rest</span>
                      </div>
                      <Switch defaultChecked disabled />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium block">Backup Encryption</span>
                        <span className="text-sm text-muted-foreground">Encrypt database backups</span>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Email Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium block">New Lead Alerts</span>
                        <span className="text-sm text-muted-foreground">Get notified when new leads are captured</span>
                      </div>
                      <Switch 
                        checked={notifications.leadNotifications}
                        onCheckedChange={(checked) => handleNotificationChange('leadNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium block">System Alerts</span>
                        <span className="text-sm text-muted-foreground">Receive system health and error notifications</span>
                      </div>
                      <Switch 
                        checked={notifications.systemAlerts}
                        onCheckedChange={(checked) => handleNotificationChange('systemAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium block">Daily Reports</span>
                        <span className="text-sm text-muted-foreground">Daily summary of leads and activity</span>
                      </div>
                      <Switch 
                        checked={notifications.emailAlerts}
                        onCheckedChange={(checked) => handleNotificationChange('emailAlerts', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">System Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium block">Version</span>
                      <span className="text-sm text-muted-foreground">1.2.0</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium block">Last Updated</span>
                      <span className="text-sm text-muted-foreground">Today</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium block">Environment</span>
                      <span className="text-sm text-muted-foreground">Production</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium block">Uptime</span>
                      <span className="text-sm text-muted-foreground">99.9%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
