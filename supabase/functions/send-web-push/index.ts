import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  url?: string;
  channelId?: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, title, body, url, channelId, data } = await req.json() as PushPayload;

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's push subscription
    const { data: subscriptions, error: fetchError } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user:', userId);
      return new Response(
        JSON.stringify({ message: 'No push subscriptions found for user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@roofingfriend.com';

    if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Import web-push for sending notifications
    const webpush = await import('npm:web-push@3.6.6');
    
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/mobile/messages',
      channelId,
      data,
      tag: `message-${channelId || 'general'}`,
    });

    // Send push notification to all user's subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        console.log('Push notification sent successfully');
        return { success: true };
      } catch (error) {
        console.error('Error sending push notification:', error);
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabaseClient
            .from('push_subscriptions')
            .delete()
            .eq('user_id', userId)
            .eq('subscription', sub.subscription);
        }
        
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successCount} of ${results.length} notifications`,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-web-push function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
