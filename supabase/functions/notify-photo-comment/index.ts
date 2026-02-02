import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyPhotoCommentRequest {
  projectId: string;
  photoId: string;
  commentText: string;
  commenterName: string;
  annotationType?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { projectId, photoId, commentText, commenterName, annotationType } = await req.json() as NotifyPhotoCommentRequest;

    console.log(`Processing notification for project ${projectId}, photo ${photoId}`);

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, address')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      throw new Error('Project not found');
    }

    // Get all team members assigned to this project
    const { data: assignments, error: assignmentsError } = await supabase
      .from('project_team_assignments')
      .select('user_id, role')
      .eq('project_id', projectId);

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      throw new Error('Failed to fetch team assignments');
    }

    if (!assignments || assignments.length === 0) {
      console.log('No team members assigned to this project');
      return new Response(
        JSON.stringify({ success: true, message: 'No team members to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user details from team_directory for SMS
    const userIds = assignments.map(a => a.user_id);
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_directory')
      .select('user_id, full_name, phone_number, role')
      .in('user_id', userIds)
      .eq('status', 'active');

    if (teamError) {
      console.error('Error fetching team members:', teamError);
    }

    // Prioritize project managers for notification
    const projectManagers = assignments.filter(a => a.role === 'project_manager');
    const priorityUserIds = projectManagers.length > 0 
      ? projectManagers.map(pm => pm.user_id)
      : userIds;

    // Build notification message
    const truncatedComment = commentText.length > 100 
      ? commentText.substring(0, 100) + '...' 
      : commentText;
    
    const notificationMessage = annotationType 
      ? `📍 ${commenterName} marked a photo on "${project.name}" and commented: "${truncatedComment}"`
      : `💬 ${commenterName} commented on a photo on "${project.name}": "${truncatedComment}"`;

    console.log(`Sending notifications to ${priorityUserIds.length} team members`);

    // Send SMS notifications via Twilio
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber && teamMembers) {
      const smsPromises = teamMembers
        .filter(tm => tm.phone_number && priorityUserIds.includes(tm.user_id))
        .map(async (member) => {
          try {
            const response = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
              {
                method: 'POST',
                headers: {
                  'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  To: member.phone_number!,
                  From: twilioPhoneNumber,
                  Body: notificationMessage,
                }),
              }
            );
            
            if (!response.ok) {
              console.error(`Failed to send SMS to ${member.full_name}:`, await response.text());
            } else {
              console.log(`SMS sent to ${member.full_name}`);
            }
          } catch (e) {
            console.error(`Error sending SMS to ${member.full_name}:`, e);
          }
        });

      await Promise.all(smsPromises);
    }

    // Create in-app notifications for all team members
    const notificationPromises = userIds.map(async (userId) => {
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: annotationType ? 'New Photo Markup' : 'New Photo Comment',
          body: notificationMessage,
          data: {
            type: 'photo_comment',
            project_id: projectId,
            photo_id: photoId,
            commenter_name: commenterName
          }
        });
      } catch (e) {
        console.error(`Error creating notification for ${userId}:`, e);
      }
    });

    await Promise.all(notificationPromises);

    console.log('Notifications sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: priorityUserIds.length,
        message: `Notified ${priorityUserIds.length} team members` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-photo-comment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
