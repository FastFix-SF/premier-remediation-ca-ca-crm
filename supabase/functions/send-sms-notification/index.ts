import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Spanish translations for SMS notifications
const translations = {
  en: {
    // Message notifications
    newMessage: "💬 New Message",
    newMessageBody: "You have a new team message",
    
    // Schedule/Assignment notifications
    newScheduleAssignment: "📍 New Schedule Assignment",
    youveBeenAssignedTo: "You've been assigned to",
    
    // Service ticket assignment
    serviceTicketAssignment: "🔧 Service Ticket Assignment",
    youveBeenAssignedToTicket: "You've been assigned to a service ticket",
    
    // Request notifications
    requestApproved: "✅ Request Approved",
    requestRejected: "❌ Request Rejected",
    requestPending: "⏰ Request Pending",
    requestStatusUpdate: "📝 Request Status Updated",
    yourRequestHasBeen: "Your request has been",
    
    // Employee request notifications (for admins)
    timesheetEditRequest: "has requested to edit a timesheet entry for",
    timeOffRequest: "has requested time off for",
    
    // Project notifications
    newProjectUpdate: "📋 New Project Update",
    projectUpdatePosted: "A new project update has been posted",
    
    // Overtime reminder
    overtimeReminder: "⏰ Long Shift Reminder",
    overtimeReminderBody: "You've been clocked in for 9 hours. Are you still working or did you forget to clock out?",
    
    // Task assignment
    taskAssignment: "📋 New Task Assignment",
    addedAsAssignee: "You've been added as assignee on",
    addedAsCollaborator: "You've been added as collaborator on",
    
    // General
    job: "job",
    task: "task",
    at: "at",
    checkApp: "Check the Roofing Friend Mobile app",
  },
  es: {
    // Message notifications
    newMessage: "💬 Nuevo Mensaje",
    newMessageBody: "Tienes un nuevo mensaje del equipo",
    
    // Schedule/Assignment notifications  
    newScheduleAssignment: "📍 Nueva Asignación de Horario",
    youveBeenAssignedTo: "Has sido asignado a",
    
    // Service ticket assignment
    serviceTicketAssignment: "🔧 Asignación de Ticket de Servicio",
    youveBeenAssignedToTicket: "Se te ha asignado un ticket de servicio",
    
    // Request notifications
    requestApproved: "✅ Solicitud Aprobada",
    requestRejected: "❌ Solicitud Rechazada",
    requestPending: "⏰ Solicitud Pendiente",
    requestStatusUpdate: "📝 Estado de Solicitud Actualizado",
    yourRequestHasBeen: "Tu solicitud ha sido",
    
    // Employee request notifications (for admins)
    timesheetEditRequest: "ha solicitado editar una entrada de hoja de tiempo para",
    timeOffRequest: "ha solicitado tiempo libre para",
    
    // Project notifications
    newProjectUpdate: "📋 Nueva Actualización de Proyecto",
    projectUpdatePosted: "Se ha publicado una nueva actualización del proyecto",
    
    // Overtime reminder
    overtimeReminder: "⏰ Recordatorio de Turno Largo",
    overtimeReminderBody: "Has estado registrado por 9 horas. ¿Sigues trabajando o olvidaste marcar tu salida?",
    
    // Task assignment
    taskAssignment: "📋 Nueva Asignación de Tarea",
    addedAsAssignee: "Has sido asignado a",
    addedAsCollaborator: "Has sido añadido como colaborador en",
    
    // General
    job: "trabajo",
    task: "tarea",
    at: "en",
    checkApp: "Revisa la aplicación móvil de Roofing Friend",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, body, data = {} }: SMSRequest = await req.json();
    console.log("📱 SMS Notification Request:", { userId, title, body, data });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    // Get user's SMS preferences and language from team_directory
    const { data: teamMember, error: teamError } = await supabase
      .from("team_directory")
      .select("email, sms_notifications_enabled, language")
      .eq("user_id", userId)
      .single();

    if (teamError || !teamMember) {
      console.error("❌ User not found in team_directory:", teamError);
      throw new Error("User not found");
    }

    // Check if user has SMS notifications enabled
    if (teamMember.sms_notifications_enabled === false) {
      console.log("⏭️ User has SMS notifications disabled, skipping");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "User has SMS notifications disabled",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get user's language preference (default to English)
    const userLang = (teamMember.language === 'es' ? 'es' : 'en') as 'en' | 'es';
    const t = translations[userLang];
    console.log(`🌍 User language preference: ${userLang}`);

    // Get phone number from auth.users (where mobile app signups store the phone)
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authUser?.user?.phone) {
      console.error("❌ Phone not found in auth.users:", authError);
      // Fallback: try the email field in team_directory (legacy behavior)
      console.log("⚠️ Falling back to team_directory.email as phone");
    }
    
    // Use auth.users.phone if available, otherwise fall back to team_directory.email
    const phoneNumber = authUser?.user?.phone || teamMember.email;
    
    if (!phoneNumber) {
      throw new Error("No phone number found for user");
    }
    
    // Normalize phone number: remove non-digits, ensure it starts with country code
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    
    // Format to E.164 format (+1XXXXXXXXXX)
    const e164Phone = cleanPhone.startsWith("1") 
      ? `+${cleanPhone}` 
      : `+1${cleanPhone}`;

    console.log("📞 Sending SMS to:", e164Phone);

    // Log notification to database with context for reply routing
    try {
      await supabase.from("notifications").insert({
        user_id: userId,
        title,
        message: body,
        type: data.type || "general",
        data,
        read: false,
      });

      // Also log to sms_conversations for reply tracking
      await supabase.from("sms_conversations").insert({
        from_phone: twilioPhoneNumber,
        to_phone: e164Phone,
        direction: "outbound",
        message: `${title}\n\n${body}`,
        context: {
          notification_type: data.type,
          user_id: userId,
          // Include chat context for reply routing if this is a message or mention notification
          chat_reply: data.type === 'message' || data.type === 'mention' || data.channelId ? true : false,
          channel_id: data.channelId || data.channelName || null,
          channel_name: data.channelName || data.channelId || null,
          sender_name: data.senderName || null,
          project_id: data.projectId || null,
        }
      });
    } catch (logError) {
      console.error("⚠️ Failed to log notification:", logError);
      // Continue even if logging fails
    }

    // Construct translated message based on notification type
    let translatedTitle = title;
    let translatedBody = body;

    const notificationType = data.type;

    switch (notificationType) {
      case 'message':
        translatedTitle = t.newMessage;
        translatedBody = t.newMessageBody;
        // Add reply instruction for chat messages
        if (data.channelId) {
          translatedBody += userLang === 'es'
            ? '\n\n💬 Responde a este mensaje para enviar al chat'
            : '\n\n💬 Reply to this message to send to chat';
        }
        break;

      case 'mention':
        translatedTitle = userLang === 'es' 
          ? `📣 ${data.senderName || 'Alguien'} te mencionó`
          : `📣 ${data.senderName || 'Someone'} mentioned you`;
        translatedBody = body;
        // Add reply instruction for mentions
        if (data.channelId) {
          translatedBody += userLang === 'es'
            ? '\n\n💬 Responde a este mensaje para enviar al chat'
            : '\n\n💬 Reply to this message to send to chat';
        }
        break;

      case 'schedule':
        translatedTitle = t.newScheduleAssignment;
        // Extract job name from body if available
        const jobNameMatch = body.match(/assigned to (.+)/i);
        if (jobNameMatch && jobNameMatch[1]) {
          translatedBody = `${t.youveBeenAssignedTo} ${jobNameMatch[1]}`;
        } else {
          translatedBody = body; // Fallback to original body
        }
        break;

      case 'employee_request':
        // Format for admin notifications about employee requests
        const employeeName = data.employeeName || 'An employee';
        const requestType = data.requestType;
        const shiftData = data.shiftData;
        
        if (requestType === 'shift' && shiftData) {
          // Format date like "Thu 12/18"
          const dateObj = new Date(shiftData.date + 'T00:00:00');
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const month = dateObj.getMonth() + 1;
          const day = dateObj.getDate();
          
          // Format times like "08:18am"
          const formatTime = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'pm' : 'am';
            const displayHour = hour % 12 || 12;
            return `${displayHour.toString().padStart(2, '0')}:${minutes}${ampm}`;
          };
          
          const startTime = formatTime(shiftData.startTime);
          const endTime = formatTime(shiftData.endTime);
          
          translatedTitle = '';
          translatedBody = `${employeeName} ${t.timesheetEditRequest} ${dayName} ${month}/${day}, ${startTime}-${endTime}`;
        } else if (requestType === 'time_off') {
          translatedTitle = '';
          translatedBody = `${employeeName} ${t.timeOffRequest}`;
          // Add details from body if available
          if (body) {
            translatedBody += `\n${body}`;
          }
        } else {
          translatedTitle = t.requestStatusUpdate;
          translatedBody = body;
        }
        break;

      case 'request':
        // Determine request status
        const status = data.status?.toLowerCase();
        if (status === 'approved') {
          translatedTitle = t.requestApproved;
        } else if (status === 'rejected') {
          translatedTitle = t.requestRejected;
        } else if (status === 'pending') {
          translatedTitle = t.requestPending;
        } else {
          translatedTitle = t.requestStatusUpdate;
        }
        
        // Translate body if it contains status text
        if (body.includes('has been')) {
          const requestStatus = status || 'updated';
          translatedBody = `${t.yourRequestHasBeen} ${requestStatus}`;
        } else {
          translatedBody = body;
        }
        break;

      case 'update':
        translatedTitle = t.newProjectUpdate;
        translatedBody = body || t.projectUpdatePosted;
        break;

      case 'overtime_reminder':
        translatedTitle = t.overtimeReminder;
        translatedBody = t.overtimeReminderBody;
        break;

      case 'service_ticket_assignment':
        translatedTitle = t.serviceTicketAssignment;
        // Use the pre-formatted body with ticket details
        translatedBody = body;
        break;

      case 'task_assignment':
        translatedTitle = t.taskAssignment;
        const taskRole = data.role;
        const taskTitle = data.taskTitle || 'a task';
        if (taskRole === 'collaborator') {
          translatedBody = `${t.addedAsCollaborator}: "${taskTitle}"`;
        } else {
          translatedBody = `${t.addedAsAssignee}: "${taskTitle}"`;
        }
        // Append "by Name" if present in body
        const byMatch = body.match(/by (.+)$/);
        if (byMatch) {
          translatedBody += ` by ${byMatch[1]}`;
        }
        break;

      default:
        // For unknown types, try pattern matching as fallback
        if (title.toLowerCase().includes("message")) {
          translatedTitle = t.newMessage;
        } else if (title.toLowerCase().includes("assignment") || title.toLowerCase().includes("assigned")) {
          translatedTitle = t.newScheduleAssignment;
        } else if (title.toLowerCase().includes("update")) {
          translatedTitle = t.newProjectUpdate;
        }
        break;
    }

    // Format SMS message
    const smsBody = `${translatedTitle}

${translatedBody}

${t.checkApp}`;

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: e164Phone,
          From: twilioPhoneNumber,
          Body: smsBody,
        }),
      }
    );

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("❌ Twilio error:", twilioData);
      throw new Error(`Twilio error: ${twilioData.message || "Unknown error"}`);
    }

    console.log("✅ SMS sent successfully:", twilioData.sid);
    console.log("📤 SMS Content:", { title: translatedTitle, body: translatedBody, language: userLang });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageSid: twilioData.sid,
        to: e164Phone,
        language: userLang,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("❌ Error sending SMS:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
