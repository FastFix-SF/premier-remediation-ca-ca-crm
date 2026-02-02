import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract @mentions from message text
const extractMentions = (text: string): string[] => {
  const mentionRegex = /@([\w\s]+?)(?=\s@|\s|$)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1].trim());
  }
  return mentions;
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the webhook payload from database trigger
    const payload = await req.json();
    console.log('📨 Received chat mention webhook:', JSON.stringify(payload));

    const record = payload.record || payload;
    const { id: messageId, message, sender_user_id, sender, channel_name } = record;

    if (!message || !sender_user_id) {
      console.log('⚠️ Missing message or sender_user_id, skipping');
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract mentions from message
    const mentions = extractMentions(message);
    console.log('🔍 Found mentions:', mentions);

    if (mentions.length === 0) {
      return new Response(JSON.stringify({ success: true, mentions: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract project ID from channel name (format: project-{uuid})
    const projectIdMatch = channel_name?.match(/^project-(.+)$/);
    const projectId = projectIdMatch ? projectIdMatch[1] : null;

    // Get all active team members
    const { data: allMembers, error: membersError } = await supabase
      .from('team_directory')
      .select('user_id, full_name, email, preferred_language, phone')
      .eq('status', 'active');

    if (membersError) {
      console.error('❌ Error fetching team members:', membersError);
      throw membersError;
    }

    let notificationsCreated = 0;

    for (const mentionName of mentions) {
      // Find matching member
      const matchedMember = allMembers?.find(member => {
        const fullName = member.full_name?.toLowerCase() || '';
        const emailName = member.email?.split('@')[0]?.toLowerCase() || '';
        const searchName = mentionName.toLowerCase();
        return fullName === searchName || emailName === searchName || fullName.includes(searchName);
      });

      if (!matchedMember?.user_id || matchedMember.user_id === sender_user_id) {
        console.log(`⚠️ No match for @${mentionName} or self-mention, skipping`);
        continue;
      }

      console.log(`✅ Matched @${mentionName} to user:`, matchedMember.user_id);

      // Check if notification already exists to avoid duplicates
      const { data: existing } = await supabase
        .from('team_member_notifications')
        .select('id')
        .eq('member_id', matchedMember.user_id)
        .eq('reference_id', messageId)
        .eq('type', 'mention')
        .single();

      if (existing) {
        console.log('⚠️ Notification already exists, skipping');
        continue;
      }

      // Create in-app notification
      const { error: notifError } = await supabase
        .from('team_member_notifications')
        .insert({
          member_id: matchedMember.user_id,
          type: 'mention',
          title: `@${sender || 'Someone'} mentioned you`,
          message: message.length > 100 ? message.substring(0, 100) + '...' : message,
          priority: 'high',
          reference_id: projectId || messageId,
          reference_type: 'project_chat',
          action_url: projectId ? `/mobile/projects/${projectId}` : '/mobile/messages',
          is_read: false,
        });

      if (notifError) {
        console.error('❌ Error creating notification:', notifError);
      } else {
        notificationsCreated++;
        console.log('✅ Created in-app notification for mention');
      }

      // Send SMS notification if user has phone number
      if (matchedMember.phone) {
        try {
          const lang = matchedMember.preferred_language || 'en';
          const smsMessage = lang === 'es'
            ? `${sender || 'Alguien'} te mencionó: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`
            : `${sender || 'Someone'} mentioned you: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`;

          await supabase.functions.invoke('send-sms-notification', {
            body: {
              to: matchedMember.phone,
              message: smsMessage,
              userId: matchedMember.user_id,
              notificationType: 'mention',
            },
          });
          console.log('📱 SMS notification sent');
        } catch (smsError) {
          console.error('❌ SMS send failed:', smsError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, notificationsCreated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error processing mentions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
