import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeamMember {
  user_id: string;
  full_name: string;
  phone: string | null;
  language_preference: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    console.log(`Processing reminders for tasks/events between ${now.toISOString()} and ${oneHourFromNow.toISOString()}`);

    const results = { tasks: 0, events: 0, remindersSent: 0, skipped: 0, errors: 0 };

    // 1. Get tasks due within the next hour that haven't been completed
    const { data: upcomingTasks, error: tasksError } = await supabase
      .from('team_tasks')
      .select(`
        id,
        title,
        due_date,
        owner_id,
        collaborator_ids,
        status
      `)
      .not('due_date', 'is', null)
      .gte('due_date', now.toISOString())
      .lte('due_date', oneHourFromNow.toISOString())
      .neq('status', 'DONE');

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    console.log(`Found ${upcomingTasks?.length || 0} upcoming tasks`);

    // 2. Get calendar events within the next hour
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from('project_calendar_events')
      .select(`
        id,
        title,
        event_date,
        assignee_ids
      `)
      .gte('event_date', now.toISOString())
      .lte('event_date', oneHourFromNow.toISOString());

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    console.log(`Found ${upcomingEvents?.length || 0} upcoming events`);

    // Helper function to send reminder
    const sendReminder = async (
      itemType: 'task' | 'event',
      itemId: string,
      itemTitle: string,
      memberId: string,
      scheduledFor: string
    ) => {
      // Check if reminder already sent
      const { data: existing } = await supabase
        .from('task_event_reminders')
        .select('id')
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .eq('member_id', memberId)
        .single();

      if (existing) {
        results.skipped++;
        return;
      }

      // Get member details
      const { data: member } = await supabase
        .from('team_directory')
        .select('user_id, full_name, phone, language_preference')
        .eq('user_id', memberId)
        .single() as { data: TeamMember | null };

      if (!member?.phone) {
        console.log(`No phone for member ${memberId}, skipping SMS`);
        results.skipped++;
        return;
      }

      // Format message based on language preference
      const isSpanish = member.language_preference === 'es';
      const message = isSpanish
        ? `Recordatorio: "${itemTitle}" comienza pronto. Por favor revisa tu calendario.`
        : `Reminder: "${itemTitle}" is starting soon. Please check your schedule.`;

      try {
        // Send SMS via existing function
        const { error: smsError } = await supabase.functions.invoke('send-sms-notification', {
          body: { 
            phone: member.phone, 
            message,
            title: isSpanish ? 'Recordatorio de Tarea' : 'Task Reminder'
          }
        });

        if (smsError) {
          console.error(`SMS error for ${memberId}:`, smsError);
          results.errors++;
          return;
        }

        // Log the reminder
        await supabase.from('task_event_reminders').insert({
          item_type: itemType,
          item_id: itemId,
          member_id: memberId,
          scheduled_for: scheduledFor,
          sent_at: new Date().toISOString(),
          status: 'sent'
        });

        console.log(`Reminder sent to ${member.full_name} for ${itemType}: ${itemTitle}`);
        results.remindersSent++;
      } catch (smsError) {
        console.error('SMS sending error:', smsError);
        results.errors++;
      }
    };

    // 3. Process task reminders
    for (const task of upcomingTasks || []) {
      results.tasks++;
      
      // Get all member IDs (owner + collaborators)
      const memberIds: string[] = [];
      if (task.owner_id) memberIds.push(task.owner_id);
      if (task.collaborator_ids && Array.isArray(task.collaborator_ids)) {
        memberIds.push(...task.collaborator_ids.filter(Boolean));
      }

      // Remove duplicates
      const uniqueMemberIds = [...new Set(memberIds)];

      for (const memberId of uniqueMemberIds) {
        await sendReminder('task', task.id, task.title, memberId, task.due_date);
      }
    }

    // 4. Process event reminders
    for (const event of upcomingEvents || []) {
      results.events++;

      // Get assignee IDs
      const assigneeIds = (event.assignee_ids || []).filter(Boolean);

      for (const memberId of assigneeIds) {
        await sendReminder('event', event.id, event.title, memberId, event.event_date);
      }
    }

    console.log('Reminder processing complete:', results);

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      processedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing reminders:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
