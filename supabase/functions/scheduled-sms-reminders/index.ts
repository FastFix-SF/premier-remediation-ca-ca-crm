import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bilingual reminder messages
const reminderMessages = {
  clock_in: {
    en: "⏰ Good morning! Don't forget to clock in for your shift today. Have a great day!",
    es: "⏰ ¡Buenos días! No olvides marcar tu entrada para tu turno de hoy. ¡Que tengas un excelente día!"
  },
  break: {
    en: "🍽️ Reminder: Don't forget to clock out for your break! Take time to rest and recharge.",
    es: "🍽️ Recordatorio: ¡No olvides marcar tu descanso! Tómate un tiempo para descansar."
  },
  timesheet: {
    en: "📋 End of day reminder: Please review your work hours in the timesheet before heading home.",
    es: "📋 Recordatorio de fin de día: Por favor revisa tus horas de trabajo en la hoja de tiempo antes de irte."
  }
};

const reminderTitles = {
  clock_in: {
    en: "Clock-In Reminder",
    es: "Recordatorio de Entrada"
  },
  break: {
    en: "Break Reminder", 
    es: "Recordatorio de Descanso"
  },
  timesheet: {
    en: "Timesheet Review",
    es: "Revisión de Horas"
  }
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get reminder type from request body or query params
    let reminderType = "clock_in";
    
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      reminderType = body.reminder_type || body.time || "clock_in";
    } else {
      const url = new URL(req.url);
      reminderType = url.searchParams.get("reminder_type") || url.searchParams.get("time") || "clock_in";
    }

    // Validate reminder type
    if (!["clock_in", "break", "timesheet"].includes(reminderType)) {
      console.error(`Invalid reminder type: ${reminderType}`);
      return new Response(
        JSON.stringify({ error: "Invalid reminder type. Must be: clock_in, break, or timesheet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📱 Starting ${reminderType} reminder broadcast...`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "Twilio credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all active team members with SMS notifications enabled
    const { data: teamMembers, error: fetchError } = await supabase
      .from("team_directory")
      .select("id, user_id, full_name, phone_number, language, sms_notifications_enabled")
      .eq("status", "active")
      .eq("sms_notifications_enabled", true)
      .not("phone_number", "is", null);

    if (fetchError) {
      console.error("Error fetching team members:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch team members", details: fetchError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!teamMembers || teamMembers.length === 0) {
      console.log("No team members with SMS notifications enabled");
      return new Response(
        JSON.stringify({ success: true, message: "No team members to notify", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${teamMembers.length} team members to notify`);

    // Send SMS to each team member
    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

    for (const member of teamMembers) {
      try {
        const language = member.language === "es" ? "es" : "en";
        const message = reminderMessages[reminderType as keyof typeof reminderMessages][language];
        const title = reminderTitles[reminderType as keyof typeof reminderTitles][language];

        // Format phone number
        let phoneNumber = member.phone_number.replace(/\D/g, "");
        if (!phoneNumber.startsWith("1") && phoneNumber.length === 10) {
          phoneNumber = "1" + phoneNumber;
        }
        phoneNumber = "+" + phoneNumber;

        console.log(`Sending ${reminderType} reminder to ${member.full_name || 'Unknown'} at ${phoneNumber}`);

        // Send SMS via Twilio
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const twilioResponse = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": "Basic " + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: phoneNumber,
            From: twilioPhoneNumber,
            Body: message,
          }),
        });

        const twilioResult = await twilioResponse.json();

        if (twilioResponse.ok) {
          results.success.push(member.full_name || member.phone_number);
          console.log(`✅ SMS sent to ${member.full_name || 'Unknown'}: ${twilioResult.sid}`);

          // Log notification to database
          await supabase.from("notifications").insert({
            user_id: member.user_id,
            title: title,
            body: message,
            type: `scheduled_${reminderType}`,
            channel: "sms",
            sent_at: new Date().toISOString(),
          });
        } else {
          results.failed.push(member.full_name || member.phone_number);
          console.error(`❌ Failed to send SMS to ${member.full_name || 'Unknown'}:`, twilioResult);
        }
      } catch (smsError) {
        results.failed.push(member.full_name || member.phone_number);
        console.error(`❌ Error sending SMS to ${member.full_name || 'Unknown'}:`, smsError);
      }
    }

    console.log(`📊 Reminder broadcast complete: ${results.success.length} sent, ${results.failed.length} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        reminder_type: reminderType,
        total: teamMembers.length,
        sent: results.success.length,
        failed: results.failed.length,
        details: results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in scheduled-sms-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
