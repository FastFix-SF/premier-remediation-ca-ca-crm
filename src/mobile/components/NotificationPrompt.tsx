import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { subscribeToPushNotifications, checkNotificationPermission, isPushNotificationSupported } from '@/utils/pushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const NotificationPrompt: React.FC = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkPermissionStatus = async () => {
      if (!isPushNotificationSupported()) {
        return;
      }

      const currentPermission = await checkNotificationPermission();
      setPermission(currentPermission);

      // Show prompt if permission is default (not granted or denied)
      const hasSeenPrompt = localStorage.getItem('notification-prompt-seen');
      if (currentPermission === 'default' && !hasSeenPrompt) {
        // Show after a short delay
        setTimeout(() => setShow(true), 2000);
      }
    };

    checkPermissionStatus();
  }, []);

  const handleEnableNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const success = await subscribeToPushNotifications(user.id);
      
      if (success) {
        toast.success('Notifications enabled! You\'ll receive alerts for new messages.');
        setShow(false);
        localStorage.setItem('notification-prompt-seen', 'true');
      } else {
        toast.error('Could not enable notifications. Please check your browser settings.');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('notification-prompt-seen', 'true');
  };

  if (!show || permission !== 'default' || !isPushNotificationSupported()) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom">
      <Card className="border-2 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Stay Connected</CardTitle>
                <CardDescription className="text-sm">
                  Get instant notifications for new messages
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="flex-1"
          >
            <BellOff className="h-4 w-4 mr-2" />
            Not Now
          </Button>
          <Button
            size="sm"
            onClick={handleEnableNotifications}
            disabled={loading}
            className="flex-1"
          >
            <Bell className="h-4 w-4 mr-2" />
            {loading ? 'Enabling...' : 'Enable'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
