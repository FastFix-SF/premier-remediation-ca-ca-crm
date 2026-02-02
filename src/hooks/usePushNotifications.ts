import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  PushNotifications, 
  Token, 
  PushNotificationSchema, 
  ActionPerformed 
} from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only work on native platforms');
      return;
    }

    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      // Request permission
      const permResult = await PushNotifications.requestPermissions();
      
      if (permResult.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();
      } else {
        console.log('Push notification permission denied');
        return;
      }

      // On success, we should be able to receive notifications
      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('Push registration success, token: ' + token.value);
        setDeviceToken(token.value);
        await registerDeviceToken(token.value);
        setIsRegistered(true);
      });

      // Some issue with push notification setup
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      // Show us the notification payload if the app is open on our device
      PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('Push notification received: ' + JSON.stringify(notification));
          toast.info(notification.title || 'New notification', {
            description: notification.body
          });
        }
      );

      // Method called when tapping on a notification
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification: ActionPerformed) => {
          console.log('Push notification action performed', notification);
          // Handle notification tap - navigate to relevant page
          const data = notification.notification.data;
          if (data?.type === 'message') {
            // Navigate to messages
            window.location.href = '/mobile/messages';
          } else if (data?.type === 'project_update') {
            // Navigate to project
            if (data.projectId) {
              window.location.href = `/project/${data.projectId}`;
            }
          }
        }
      );
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const registerDeviceToken = async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const platform = Capacitor.getPlatform();

      // Check if device already registered
      const { data: existingDevice } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user.id)
        .eq('device_token', token)
        .maybeSingle();

      if (!existingDevice) {
        // Register new device
        const { error } = await supabase
          .from('user_devices')
          .insert({
            user_id: user.id,
            device_token: token,
            platform: platform
          });

        if (error) {
          console.error('Error saving device token:', error);
        } else {
          console.log('Device token saved successfully');
        }
      } else {
        // Update existing device
        const { error } = await supabase
          .from('user_devices')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existingDevice.id);

        if (error) {
          console.error('Error updating device token:', error);
        }
      }
    } catch (error) {
      console.error('Error in registerDeviceToken:', error);
    }
  };

  const unregisterDevice = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !deviceToken) return;

      await supabase
        .from('user_devices')
        .delete()
        .eq('user_id', user.id)
        .eq('device_token', deviceToken);

      await PushNotifications.removeAllListeners();
      setIsRegistered(false);
      setDeviceToken(null);
    } catch (error) {
      console.error('Error unregistering device:', error);
    }
  };

  return {
    isRegistered,
    deviceToken,
    unregisterDevice
  };
};
