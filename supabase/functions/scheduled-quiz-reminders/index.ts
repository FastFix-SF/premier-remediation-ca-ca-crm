import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if today is Friday (Pacific Time)
    const now = new Date();
    const pacificOffset = -8; // PST, adjust for PDT if needed
    const pacificDate = new Date(now.getTime() + (pacificOffset * 60 * 60 * 1000));
    const dayOfWeek = pacificDate.getUTCDay();
    
    console.log(`📅 Current day of week (Pacific): ${dayOfWeek} (5 = Friday)`);

    // Allow manual trigger or Friday execution
    const url = new URL(req.url);
    const forceRun = url.searchParams.get('force') === 'true';
    
    if (dayOfWeek !== 5 && !forceRun) {
      console.log('⏭️ Not Friday, skipping quiz reminders');
      return new Response(
        JSON.stringify({ message: 'Not Friday, skipping quiz reminders', dayOfWeek }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the current week number
    const weekNumber = getWeekNumber(pacificDate);
    console.log(`📊 Current week number: ${weekNumber}`);

    // Get active quizzes (could be weekly safety quiz or any active quiz)
    const { data: quizzes, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('is_active', true);

    if (quizError) {
      console.error('❌ Error fetching quizzes:', quizError);
      throw quizError;
    }

    if (!quizzes || quizzes.length === 0) {
      console.log('📋 No active quizzes found');
      return new Response(
        JSON.stringify({ message: 'No active quizzes found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${quizzes.length} active quizzes`);

    // Get all active team members
    const { data: members, error: membersError } = await supabase
      .from('team_directory')
      .select('user_id, full_name, language_preference, email')
      .eq('status', 'active');

    if (membersError) {
      console.error('❌ Error fetching team members:', membersError);
      throw membersError;
    }

    if (!members || members.length === 0) {
      console.log('👥 No active team members found');
      return new Response(
        JSON.stringify({ message: 'No active team members found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`👥 Found ${members.length} active team members`);

    let notificationsSent = 0;

    // For each quiz, check who hasn't completed it this week
    for (const quiz of quizzes) {
      // Get attempts for this quiz from this week
      const weekStart = new Date(pacificDate);
      weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
      weekStart.setUTCHours(0, 0, 0, 0);

      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('user_id')
        .eq('quiz_id', quiz.id)
        .gte('submitted_at', weekStart.toISOString());

      if (attemptsError) {
        console.error(`❌ Error fetching attempts for quiz ${quiz.id}:`, attemptsError);
        continue;
      }

      const completedUserIds = attempts?.map(a => a.user_id) || [];
      console.log(`✅ Quiz "${quiz.title}": ${completedUserIds.length} completions this week`);

      // Send notifications to those who haven't completed
      for (const member of members) {
        if (!member.user_id) continue;
        if (completedUserIds.includes(member.user_id)) continue;

        const isSpanish = member.language_preference === 'es';
        const title = isSpanish ? '📋 Cuestionario de Seguridad Semanal' : '📋 Weekly Safety Quiz';
        const message = isSpanish
          ? `Completa tu cuestionario de seguridad: "${quiz.title}"`
          : `Complete your safety training quiz: "${quiz.title}"`;

        // Create in-app notification
        const { error: notifError } = await supabase
          .from('team_member_notifications')
          .insert({
            member_id: member.user_id,
            type: 'safety_quiz',
            title,
            message,
            priority: 'high',
            action_url: '/mobile/quizzes',
            reference_id: quiz.id,
            reference_type: 'quiz',
            is_read: false,
          });

        if (notifError) {
          console.error(`❌ Error creating notification for ${member.email}:`, notifError);
        } else {
          console.log(`🔔 In-app notification sent to ${member.full_name || member.email}`);
        }

        // Send SMS notification
        try {
          await supabase.functions.invoke('send-sms-notification', {
            body: {
              userId: member.user_id,
              title: 'Safety Quiz Reminder',
              body: message,
              data: {
                type: 'safety_quiz',
                quizId: quiz.id,
              },
            },
          });
          console.log(`📱 SMS sent to ${member.full_name || member.email}`);
          notificationsSent++;
        } catch (smsError) {
          console.error(`❌ Error sending SMS to ${member.email}:`, smsError);
        }
      }
    }

    console.log(`✅ Quiz reminder job complete. Sent ${notificationsSent} notifications.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${notificationsSent} quiz reminders`,
        quizzesProcessed: quizzes.length,
        membersChecked: members.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in scheduled-quiz-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
