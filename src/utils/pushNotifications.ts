import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = 'BNxz9VjJ8bnVJl7-W8qKDp6rC5MxKG5jQXZJ_qrG5qKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqQ'; // Will be replaced with actual key

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  try {
    // Request notification permission
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
      });
    }

    // Send subscription to backend
    const { error } = await supabase
      .from('push_subscriptions' as any)
      .upsert({
        user_id: userId,
        subscription: subscription.toJSON() as any,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }

    console.log('Push notification subscription successful');
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
}

export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }

    // Remove subscription from backend
    const { error } = await supabase
      .from('push_subscriptions' as any)
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing push subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function checkNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}
