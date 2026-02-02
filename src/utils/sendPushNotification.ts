import { supabase } from '@/integrations/supabase/client';

interface SendNotificationParams {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const sendPushNotification = async ({
  userId,
  title,
  body,
  data = {}
}: SendNotificationParams) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId,
        title,
        body,
        data
      }
    });

    if (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error };
    }

    console.log('Push notification sent:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return { success: false, error };
  }
};

// Helper to send notification when a team message is sent
export const notifyTeamMessage = async (recipientId: string, senderName: string, messagePreview: string) => {
  return sendPushNotification({
    userId: recipientId,
    title: `New message from ${senderName}`,
    body: messagePreview,
    data: {
      type: 'message',
      senderId: recipientId
    }
  });
};

// Helper to send notification for project updates
export const notifyProjectUpdate = async (userId: string, projectName: string, updateType: string) => {
  return sendPushNotification({
    userId,
    title: `Project Update: ${projectName}`,
    body: `${updateType}`,
    data: {
      type: 'project_update',
      projectName
    }
  });
};
