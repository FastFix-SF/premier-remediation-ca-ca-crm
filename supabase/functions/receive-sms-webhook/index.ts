import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== TYPES =====
interface TeamMember {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  phone_number?: string;
}

type UserRole = "owner" | "admin" | "contributor" | "unknown";

// Valid statuses for updates
const VALID_LEAD_STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost", "ready_to_quote", "needs_follow_up"];
const VALID_PROJECT_STATUSES = ["pending", "scheduled", "in_progress", "active", "completed", "cancelled", "on_hold"];
const VALID_QUOTE_STATUSES = ["new", "pending", "reviewed", "quoted", "accepted", "declined", "expired"];

// ===== HELPER FUNCTIONS =====

function getDateRanges() {
  const now = new Date();
  
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayEnd = new Date(todayStart.getTime() - 1);
  
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisWeekEnd = new Date(thisWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekEnd = new Date(thisWeekStart.getTime() - 1);
  
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  
  return {
    now,
    todayStart,
    todayEnd,
    yesterdayStart,
    yesterdayEnd,
    thisWeekStart,
    thisWeekEnd,
    lastWeekStart,
    lastWeekEnd,
    thisMonthStart,
    lastMonthStart,
    lastMonthEnd
  };
}

function normalizePhone(phone: string): string {
  // Remove all non-digits
  let digits = phone.replace(/\D/g, "");
  // Handle multiple leading 1s
  if (digits.match(/^1{2,}/)) {
    digits = digits.replace(/^1+/, "1");
  }
  return digits;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ===== USER IDENTIFICATION =====

async function identifyUser(phone: string): Promise<{ member: TeamMember | null; role: UserRole }> {
  const normalizedPhone = normalizePhone(phone);
  console.log(`Looking up user by phone: ${phone} (normalized: ${normalizedPhone})`);

  try {
    // Try matching by email field (for phone signups) or phone_number field
    const { data: members, error } = await supabase
      .from("team_directory")
      .select("user_id, email, full_name, role, status, phone_number")
      .eq("status", "active");

    if (error) {
      console.error("Error looking up team member:", error);
      return { member: null, role: "unknown" };
    }

    // Find member by matching normalized phone
    const member = members?.find(m => {
      const emailDigits = normalizePhone(m.email || "");
      const phoneDigits = normalizePhone(m.phone_number || "");
      return emailDigits === normalizedPhone || 
             phoneDigits === normalizedPhone ||
             emailDigits.endsWith(normalizedPhone.slice(-10)) ||
             phoneDigits.endsWith(normalizedPhone.slice(-10)) ||
             normalizedPhone.endsWith(emailDigits.slice(-10)) ||
             normalizedPhone.endsWith(phoneDigits.slice(-10));
    });

    if (!member) {
      console.log("No team member found for phone:", phone);
      return { member: null, role: "unknown" };
    }

    console.log(`Found team member: ${member.full_name} (${member.role})`);
    
    // Determine role category
    let role: UserRole = "contributor";
    if (member.role === "owner") {
      role = "owner";
    } else if (member.role === "admin") {
      role = "admin";
    }

    return { member, role };
  } catch (error) {
    console.error("Error in identifyUser:", error);
    return { member: null, role: "unknown" };
  }
}

// ===== CONVERSATION HISTORY =====

async function getConversationHistory(phone: string): Promise<string> {
  try {
    const { data: recentSms } = await supabase
      .from("sms_conversations")
      .select("*")
      .or(`from_phone.eq.${phone},to_phone.eq.${phone}`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!recentSms || recentSms.length === 0) {
      return "No recent conversation history.";
    }

    return recentSms
      .reverse()
      .map(msg => {
        const isUser = msg.from_phone === phone;
        const role = isUser ? "You" : "RoofBot";
        return `${role}: ${msg.message}`;
      })
      .join("\n");
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    return "Unable to fetch conversation history.";
  }
}

// ===== SEARCH FUNCTIONS =====

async function searchLeads(query: string): Promise<any[]> {
  const searchTerm = `%${query.toLowerCase()}%`;
  
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
    .limit(5);
  
  return leads || [];
}

async function searchProjects(query: string): Promise<any[]> {
  const searchTerm = `%${query.toLowerCase()}%`;
  
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`)
    .limit(5);
  
  return projects || [];
}

async function searchQuotes(query: string): Promise<any[]> {
  const searchTerm = `%${query.toLowerCase()}%`;
  
  const { data: quotes } = await supabase
    .from("quote_requests")
    .select("*")
    .or(`name.ilike.${searchTerm},property_address.ilike.${searchTerm},email.ilike.${searchTerm}`)
    .limit(5);
  
  return quotes || [];
}

async function searchTeamMember(name: string): Promise<TeamMember | null> {
  const { data: members } = await supabase
    .from("team_directory")
    .select("user_id, email, full_name, role, status, phone_number")
    .ilike("full_name", `%${name}%`)
    .eq("status", "active")
    .limit(1);
  
  return members?.[0] || null;
}

// ===== NUMBERED TEAM LIST FOR EASY SELECTION =====

interface NumberedTeamMember extends TeamMember {
  index: number;
}

async function getActiveTeamMembers(): Promise<TeamMember[]> {
  const { data: members } = await supabase
    .from("team_directory")
    .select("user_id, email, full_name, role, status, phone_number")
    .eq("status", "active")
    .order("full_name");
  
  return members || [];
}

function formatNumberedTeamList(members: TeamMember[]): string {
  if (!members || members.length === 0) {
    return "No active team members found.";
  }
  
  return members.map((m, index) => 
    `${index + 1}. ${m.full_name}`
  ).join("\n");
}

async function resolveTeamMemberFromInput(input: string): Promise<TeamMember | null> {
  const trimmedInput = input.trim();
  
  // Get all active team members
  const members = await getActiveTeamMembers();
  
  // Check if input is a number (1, 2, 3, etc.)
  if (/^\d+$/.test(trimmedInput)) {
    const index = parseInt(trimmedInput) - 1; // Convert to 0-based index
    if (index >= 0 && index < members.length) {
      console.log(`Resolved number ${trimmedInput} to team member: ${members[index].full_name}`);
      return members[index];
    }
    return null;
  }
  
  // Check if input contains a number (like "assign 2" or "#2")
  const numberMatch = trimmedInput.match(/(\d+)/);
  if (numberMatch) {
    const index = parseInt(numberMatch[1]) - 1;
    if (index >= 0 && index < members.length) {
      console.log(`Resolved embedded number to team member: ${members[index].full_name}`);
      return members[index];
    }
  }
  
  // Fall back to name search
  const member = members.find(m => 
    m.full_name.toLowerCase().includes(trimmedInput.toLowerCase()) ||
    trimmedInput.toLowerCase().includes(m.full_name.toLowerCase())
  );
  
  if (member) {
    console.log(`Resolved name "${trimmedInput}" to team member: ${member.full_name}`);
    return member;
  }
  
  // Last resort: fuzzy search using existing function
  return await searchTeamMember(trimmedInput);
}

// ===== UPDATE FUNCTIONS =====

async function updateLeadStatus(leadId: string, newStatus: string): Promise<{ success: boolean; message: string }> {
  const normalizedStatus = newStatus.toLowerCase().replace(/\s+/g, "_");
  
  if (!VALID_LEAD_STATUSES.includes(normalizedStatus)) {
    return { 
      success: false, 
      message: `Invalid status. Valid options: ${VALID_LEAD_STATUSES.join(", ")}` 
    };
  }
  
  const { error } = await supabase
    .from("leads")
    .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  
  if (error) {
    console.error("Error updating lead status:", error);
    return { success: false, message: `Failed to update: ${error.message}` };
  }
  
  return { success: true, message: `Lead status updated to "${normalizedStatus}"` };
}

async function updateProjectStatus(projectId: string, newStatus: string): Promise<{ success: boolean; message: string }> {
  const normalizedStatus = newStatus.toLowerCase().replace(/\s+/g, "_");
  
  if (!VALID_PROJECT_STATUSES.includes(normalizedStatus)) {
    return { 
      success: false, 
      message: `Invalid project status. Valid options: ${VALID_PROJECT_STATUSES.join(", ")}` 
    };
  }
  
  const { error } = await supabase
    .from("projects")
    .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
    .eq("id", projectId);
  
  if (error) {
    console.error("Error updating project status:", error);
    return { success: false, message: `Failed to update project: ${error.message}` };
  }
  
  return { success: true, message: `Project status updated to "${normalizedStatus}"` };
}

async function updateQuoteStatus(quoteId: string, newStatus: string): Promise<{ success: boolean; message: string }> {
  const normalizedStatus = newStatus.toLowerCase().replace(/\s+/g, "_");
  
  if (!VALID_QUOTE_STATUSES.includes(normalizedStatus)) {
    return { 
      success: false, 
      message: `Invalid quote status. Valid options: ${VALID_QUOTE_STATUSES.join(", ")}` 
    };
  }
  
  const { error } = await supabase
    .from("quote_requests")
    .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
    .eq("id", quoteId);
  
  if (error) {
    console.error("Error updating quote status:", error);
    return { success: false, message: `Failed to update quote: ${error.message}` };
  }
  
  return { success: true, message: `Quote status updated to "${normalizedStatus}"` };
}

async function markInvoicePaid(invoiceNumber: string): Promise<{ success: boolean; message: string }> {
  const { data: invoice, error: findError } = await supabase
    .from("invoices")
    .select("*")
    .or(`invoice_number.ilike.%${invoiceNumber}%,invoice_number.eq.${invoiceNumber}`)
    .limit(1)
    .maybeSingle();
  
  if (findError || !invoice) {
    return { success: false, message: `Invoice "${invoiceNumber}" not found` };
  }
  
  if (invoice.status === "paid") {
    return { success: true, message: `Invoice #${invoice.invoice_number} is already marked as paid` };
  }
  
  const { error } = await supabase
    .from("invoices")
    .update({ 
      status: "paid", 
      paid_at: new Date().toISOString(),
      balance_due: 0,
      updated_at: new Date().toISOString() 
    })
    .eq("id", invoice.id);
  
  if (error) {
    console.error("Error marking invoice paid:", error);
    return { success: false, message: `Failed to update invoice: ${error.message}` };
  }
  
  return { success: true, message: `Invoice #${invoice.invoice_number} marked as PAID ($${invoice.total_amount.toLocaleString()})` };
}

async function addLeadNote(leadId: string, note: string, existingNotes: string | null): Promise<{ success: boolean; message: string }> {
  const timestamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const newNote = `[${timestamp} via SMS] ${note}`;
  const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;
  
  const { error } = await supabase
    .from("leads")
    .update({ notes: updatedNotes, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  
  if (error) {
    console.error("Error adding lead note:", error);
    return { success: false, message: `Failed to add note: ${error.message}` };
  }
  
  return { success: true, message: `Note added successfully` };
}

// ===== CREATE LEAD FUNCTION =====

async function createLead(name: string, email: string, status: string = "new", phone?: string): Promise<{ success: boolean; message: string }> {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "_");
  
  if (!VALID_LEAD_STATUSES.includes(normalizedStatus)) {
    return { 
      success: false, 
      message: `Invalid status. Valid options: ${VALID_LEAD_STATUSES.join(", ")}` 
    };
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: name,
      email: email,
      phone: phone || null,
      status: normalizedStatus,
      project_type: "residential-installation",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating lead:", error);
    return { success: false, message: `Failed to create lead: ${error.message}` };
  }
  
  return { success: true, message: `Lead "${name}" created with status "${normalizedStatus}"` };
}

// ===== CREATE SCHEDULE FUNCTION =====

async function createSchedule(
  jobName: string, 
  location: string | null, 
  startTime: Date, 
  endTime: Date,
  assignedUsers: any[] = []
): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase
    .from("job_schedules")
    .insert({
      job_name: jobName,
      location: location,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      assigned_users: assignedUsers,
      status: "scheduled",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating schedule:", error);
    return { success: false, message: `Failed to create schedule: ${error.message}` };
  }
  
  const dateStr = startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { success: true, message: `Schedule created: ${jobName} on ${dateStr} at ${timeStr}` };
}

// ===== TIME CLOCK FUNCTIONS =====

async function clockIn(userId: string, employeeName: string): Promise<string> {
  const dates = getDateRanges();
  
  // Check if already clocked in
  const { data: activeEntry } = await supabase
    .from("time_clock")
    .select("*")
    .eq("user_id", userId)
    .is("clock_out", null)
    .maybeSingle();
  
  if (activeEntry) {
    const clockInTime = new Date(activeEntry.clock_in);
    return `⚠️ You're already clocked in since ${formatTime(clockInTime)}`;
  }
  
  // Find their assigned job for today
  const { data: todayJobs } = await supabase
    .from("job_schedules")
    .select("id, job_name, location")
    .gte("start_time", dates.todayStart.toISOString())
    .lte("start_time", dates.todayEnd.toISOString());
  
  // Find job where user is in assigned_users
  const todayJob = todayJobs?.find(j => {
    if (!j.assigned_users) return false;
    const users = Array.isArray(j.assigned_users) ? j.assigned_users : [];
    return users.some((u: any) => u.user_id === userId || u.id === userId);
  });
  
  // Create time clock entry
  const { error } = await supabase.from("time_clock").insert({
    user_id: userId,
    employee_name: employeeName,
    clock_in: new Date().toISOString(),
    job_id: todayJob?.id || null,
    status: "active"
  });
  
  if (error) {
    console.error("Error clocking in:", error);
    return `❌ Failed to clock in: ${error.message}`;
  }
  
  const jobInfo = todayJob ? ` for ${todayJob.job_name}` : "";
  return `✅ Clocked in at ${formatTime(new Date())}${jobInfo}`;
}

async function clockOut(userId: string): Promise<string> {
  const { data: activeEntry } = await supabase
    .from("time_clock")
    .select("*")
    .eq("user_id", userId)
    .is("clock_out", null)
    .maybeSingle();
  
  if (!activeEntry) {
    return `⚠️ You're not currently clocked in`;
  }
  
  const clockOutTime = new Date();
  const clockInTime = new Date(activeEntry.clock_in);
  const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
  
  const { error } = await supabase
    .from("time_clock")
    .update({ 
      clock_out: clockOutTime.toISOString(),
      total_hours: Math.round(totalHours * 100) / 100,
      status: "completed"
    })
    .eq("id", activeEntry.id);
  
  if (error) {
    console.error("Error clocking out:", error);
    return `❌ Failed to clock out: ${error.message}`;
  }
  
  return `✅ Clocked out at ${formatTime(clockOutTime)}. Total: ${totalHours.toFixed(1)} hours`;
}

async function getMyClockStatus(userId: string): Promise<string> {
  const { data: activeEntry } = await supabase
    .from("time_clock")
    .select("*")
    .eq("user_id", userId)
    .is("clock_out", null)
    .maybeSingle();
  
  if (activeEntry) {
    const clockInTime = new Date(activeEntry.clock_in);
    const now = new Date();
    const hoursWorked = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
    return `You're clocked in since ${formatTime(clockInTime)} (${hoursWorked.toFixed(1)}h so far)`;
  }
  
  return "You're not currently clocked in";
}

// ===== MESSAGE TO TEAM MEMBER =====

async function sendMessageToTeamMember(fromName: string, toName: string, message: string): Promise<string> {
  // Find the recipient
  const recipient = await searchTeamMember(toName);
  
  if (!recipient) {
    return `❌ Couldn't find team member "${toName}"`;
  }
  
  // Get recipient's phone (from email field for phone signups or phone_number)
  const recipientPhone = recipient.phone_number || (recipient.email.match(/^\d+$/) ? recipient.email : null);
  
  if (!recipientPhone) {
    return `❌ ${recipient.full_name} doesn't have a phone number on file`;
  }
  
  // Format the phone number
  let formattedPhone = recipientPhone.replace(/\D/g, "");
  if (formattedPhone.length === 10) {
    formattedPhone = "+1" + formattedPhone;
  } else if (!formattedPhone.startsWith("+")) {
    formattedPhone = "+" + formattedPhone;
  }
  
  // Send via Twilio
  const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
  
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.error("Twilio credentials not configured");
    return `❌ SMS system not configured`;
  }
  
  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const authHeader = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    
    const smsBody = `📱 Message from ${fromName}:\n\n${message}\n\n(Reply to respond)`;
    
    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: twilioPhoneNumber,
        Body: smsBody,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twilio error:", errorText);
      return `❌ Failed to send message to ${recipient.full_name}`;
    }
    
    // Log the message
    await supabase.from("sms_conversations").insert({
      from_phone: twilioPhoneNumber,
      to_phone: formattedPhone,
      direction: "outbound",
      message: smsBody,
      context: { team_message: true, from_user: fromName, to_user: recipient.full_name }
    });
    
    return `✅ Message sent to ${recipient.full_name}`;
  } catch (error) {
    console.error("Error sending team message:", error);
    return `❌ Failed to send message`;
  }
}

// ===== SEND SYSTEM NOTIFICATION (Owner Power) =====

async function sendSystemNotification(
  recipientInput: string, 
  message: string, 
  notificationType: string = "update"
): Promise<string> {
  const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
  
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.error("Twilio credentials not configured");
    return `❌ SMS system not configured`;
  }

  // Type emoji mapping
  const typeEmojis: Record<string, string> = {
    announcement: "📢",
    update: "📋",
    reminder: "⏰",
    alert: "🚨"
  };
  
  const emoji = typeEmojis[notificationType] || "📋";
  const typeLabel = notificationType.charAt(0).toUpperCase() + notificationType.slice(1);
  
  // Format the official notification message
  const smsBody = `${emoji} Roofing Friend ${typeLabel}\n\n${message}\n\n📱 Open the app for more details`;

  // Get all active team members
  const allMembers = await getActiveTeamMembers();
  
  // Determine recipients with role-based filtering
  let recipients: TeamMember[] = [];
  const recipientLower = recipientInput.toLowerCase().trim();
  
  // Check for role-based filters first
  if (recipientLower === "all" || recipientLower === "everyone" || recipientLower === "team" || recipientLower === "all team" || recipientLower === "all users") {
    // Broadcast to everyone
    recipients = allMembers;
    console.log(`Broadcasting to ALL ${allMembers.length} team members`);
  } else if (recipientLower === "contributors" || recipientLower === "all contributors") {
    // Only contributors
    recipients = allMembers.filter(m => m.role === "contributor");
    console.log(`Targeting ${recipients.length} contributors`);
  } else if (recipientLower === "admins" || recipientLower === "all admins") {
    // Only admins
    recipients = allMembers.filter(m => m.role === "admin");
    console.log(`Targeting ${recipients.length} admins`);
  } else if (recipientLower === "owners" || recipientLower === "all owners") {
    // Only owners
    recipients = allMembers.filter(m => m.role === "owner");
    console.log(`Targeting ${recipients.length} owners`);
  } else if (recipientLower === "management" || recipientLower === "all management" || recipientLower === "managers") {
    // Owners and admins combined
    recipients = allMembers.filter(m => m.role === "owner" || m.role === "admin");
    console.log(`Targeting ${recipients.length} management (owners + admins)`);
  } else {
    // Single recipient - resolve by number or name
    const singleRecipient = await resolveTeamMemberFromInput(recipientInput);
    if (singleRecipient) {
      recipients = [singleRecipient];
    }
  }
  
  if (recipients.length === 0) {
    const teamList = allMembers.map((m, i) => `${i + 1}. ${m.full_name}`).join("\n");
    return `❌ Couldn't find "${recipientInput}". Reply with a number or "all":\n${teamList}`;
  }
  
  console.log(`Sending system notification to ${recipients.length} recipient(s): ${recipients.map(r => r.full_name).join(", ")}`);
  
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  const authHeader = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
  
  let successCount = 0;
  let failCount = 0;
  const sentNames: string[] = [];
  
  for (const recipient of recipients) {
    // Get phone number
    let recipientPhone = recipient.phone_number;
    if (!recipientPhone && recipient.email && /^\d+$/.test(recipient.email.replace(/\D/g, ""))) {
      recipientPhone = recipient.email;
    }
    
    if (!recipientPhone) {
      console.log(`Skipping ${recipient.full_name} - no phone number`);
      failCount++;
      continue;
    }
    
    const normalizedPhone = normalizePhone(recipientPhone);
    const formattedPhone = normalizedPhone.startsWith("1") ? `+${normalizedPhone}` : `+1${normalizedPhone}`;
    
    try {
      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: twilioPhoneNumber,
          Body: smsBody,
        }),
      });
      
      if (response.ok) {
        successCount++;
        sentNames.push(recipient.full_name);
        
        // Log the notification
        await supabase.from("sms_conversations").insert({
          from_phone: twilioPhoneNumber,
          to_phone: formattedPhone,
          direction: "outbound",
          message: smsBody,
          context: { 
            system_notification: true, 
            notification_type: notificationType,
            to_user: recipient.full_name 
          }
        });
        
        // Also log to notifications table
        await supabase.from("notifications").insert({
          user_id: recipient.user_id,
          title: `${emoji} Roofing Friend ${typeLabel}`,
          body: message,
          type: `sms_${notificationType}`,
          read: false
        });
      } else {
        const errorText = await response.text();
        console.error(`Failed to send to ${recipient.full_name}:`, errorText);
        failCount++;
      }
    } catch (error) {
      console.error(`Error sending to ${recipient.full_name}:`, error);
      failCount++;
    }
  }
  
  // Return result summary
  if (recipients.length === 1) {
    return successCount > 0 
      ? `✅ ${emoji} System notification sent to ${sentNames[0]}`
      : `❌ Failed to send notification`;
  } else {
    return `✅ ${emoji} System notification sent to ${successCount} team members${failCount > 0 ? ` (${failCount} failed)` : ""}`;
  }
}

// ===== CONTEXT BUILDERS =====

async function getOwnerContext(searchQuery?: string): Promise<string> {
  // Full business context - same as original getBusinessContext
  const dates = getDateRanges();
  const { now, todayStart, yesterdayStart, yesterdayEnd, thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd, thisMonthStart } = dates;

  try {
    // ===== LEADS =====
    const { data: allLeads } = await supabase.from("leads").select("*");
    const totalLeads = allLeads?.length || 0;
    const todayLeads = allLeads?.filter(l => new Date(l.created_at) >= todayStart).length || 0;
    const yesterdayLeads = allLeads?.filter(l => {
      const d = new Date(l.created_at);
      return d >= yesterdayStart && d <= yesterdayEnd;
    }).length || 0;
    const weekLeads = allLeads?.filter(l => new Date(l.created_at) >= thisWeekStart).length || 0;
    const monthLeads = allLeads?.filter(l => new Date(l.created_at) >= thisMonthStart).length || 0;
    
    const leadsByStatus = {
      new: allLeads?.filter(l => l.status === "new").length || 0,
      contacted: allLeads?.filter(l => l.status === "contacted").length || 0,
      qualified: allLeads?.filter(l => l.status === "qualified").length || 0,
      proposal: allLeads?.filter(l => l.status === "proposal").length || 0,
      ready_to_quote: allLeads?.filter(l => l.status === "ready_to_quote").length || 0,
      won: allLeads?.filter(l => l.status === "won").length || 0,
      lost: allLeads?.filter(l => l.status === "lost").length || 0,
    };

    const recentLeads = allLeads
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(l => `- ${l.name} | ${l.email || 'no email'} | Status: ${l.status}`)
      .join("\n") || "None";

    let searchResults = "";
    if (searchQuery) {
      const foundLeads = await searchLeads(searchQuery);
      if (foundLeads.length > 0) {
        searchResults = `\n═══ SEARCH RESULTS for "${searchQuery}" ═══\n` +
          foundLeads.map(l => `- ${l.name} | ${l.email || 'no email'} | Status: ${l.status}`).join("\n");
      }
    }

    // ===== QUOTES, PROJECTS, INVOICES =====
    const { data: allQuotes } = await supabase.from("quote_requests").select("*");
    const pendingQuotes = allQuotes?.filter(q => q.status === "pending" || q.status === "new").length || 0;

    const { data: allProjects } = await supabase.from("projects").select("*");
    const activeProjects = allProjects?.filter(p => p.status === "active" || p.status === "in_progress").length || 0;

    const { data: allInvoices } = await supabase.from("invoices").select("*");
    const totalRevenue = allInvoices?.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0;
    const outstandingAmount = allInvoices?.filter(i => i.status !== "paid").reduce((sum, i) => sum + (i.balance_due || 0), 0) || 0;

    // ===== JOBS =====
    const { data: allJobs } = await supabase.from("job_schedules").select("*");
    const todayJobs = allJobs?.filter(j => {
      const jobDate = new Date(j.start_time);
      return jobDate >= todayStart && jobDate <= new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    }) || [];
    
    const todayJobsList = todayJobs
      .map(j => {
        const assignedNames = Array.isArray(j.assigned_users) 
          ? j.assigned_users.map((u: any) => u.name || u.full_name || 'Unknown').join(", ")
          : "Unassigned";
        return `- ${j.job_name} | ${j.location || 'No location'} | Crew: ${assignedNames}`;
      })
      .join("\n") || "No jobs today";

    // ===== TIME CLOCK =====
    const { data: allTimeClockEntries } = await supabase
      .from("time_clock")
      .select("*, team_directory(full_name)")
      .order("clock_in", { ascending: false });

    const currentlyClockedIn = allTimeClockEntries?.filter(e => !e.clock_out) || [];
    const currentlyClockedInList = currentlyClockedIn
      .map(e => {
        const name = e.team_directory?.full_name || e.employee_name || 'Unknown';
        const clockInTime = new Date(e.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `- ${name} | Since ${clockInTime}`;
      })
      .join("\n") || "No one clocked in";

    // ===== TEAM =====
    const { data: teamMembers } = await supabase.from("team_directory").select("*");
    const activeTeam = teamMembers?.filter(t => t.status === "active") || [];
    const activeTeamList = activeTeam.map(t => `- ${t.full_name} (${t.role})`).join("\n") || "None";
    
    // Numbered team list for easy selection
    const numberedTeamList = activeTeam.map((t, i) => `${i + 1}. ${t.full_name}`).join("\n") || "None";

    return `
📊 OWNER DASHBOARD
${now.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
${searchResults}

═══ LEADS ═══
Total: ${totalLeads} | Today: ${todayLeads} | Week: ${weekLeads} | Month: ${monthLeads}
New: ${leadsByStatus.new} | Contacted: ${leadsByStatus.contacted} | Qualified: ${leadsByStatus.qualified}
Ready to Quote: ${leadsByStatus.ready_to_quote} | Won: ${leadsByStatus.won}

Recent:
${recentLeads}

═══ OPERATIONS ═══
Quotes Pending: ${pendingQuotes}
Active Projects: ${activeProjects}

═══ FINANCIALS ═══
Revenue: $${totalRevenue.toLocaleString()}
Outstanding: $${outstandingAmount.toLocaleString()}

═══ TODAY'S SCHEDULE ═══
${todayJobsList}

═══ TIME CLOCK ═══
Clocked In (${currentlyClockedIn.length}):
${currentlyClockedInList}

═══ YOUR TEAM (reply with #) ═══
${numberedTeamList}
`;
  } catch (error) {
    console.error("Error fetching owner context:", error);
    return "Unable to fetch business data.";
  }
}

async function getAdminContext(userId: string): Promise<string> {
  const dates = getDateRanges();
  const { now, todayStart, thisWeekStart } = dates;

  try {
    // Leads (no financial details)
    const { data: allLeads } = await supabase.from("leads").select("*");
    const newLeads = allLeads?.filter(l => l.status === "new").length || 0;
    const contactedLeads = allLeads?.filter(l => l.status === "contacted").length || 0;
    const qualifiedLeads = allLeads?.filter(l => l.status === "qualified").length || 0;

    const recentLeads = allLeads
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(l => `- ${l.name} | ${l.status}`)
      .join("\n") || "None";

    // Projects
    const { data: allProjects } = await supabase.from("projects").select("*");
    const activeProjects = allProjects?.filter(p => p.status === "active" || p.status === "in_progress").length || 0;

    // Jobs
    const { data: allJobs } = await supabase.from("job_schedules").select("*");
    const todayJobs = allJobs?.filter(j => {
      const jobDate = new Date(j.start_time);
      return jobDate >= todayStart && jobDate <= new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    }) || [];
    
    const todayJobsList = todayJobs
      .map(j => {
        const assignedNames = Array.isArray(j.assigned_users) 
          ? j.assigned_users.map((u: any) => u.name || u.full_name || 'Unknown').join(", ")
          : "Unassigned";
        return `- ${j.job_name} | ${j.location || 'No location'} | Crew: ${assignedNames}`;
      })
      .join("\n") || "No jobs today";

    // Time Clock - everyone's status
    const { data: allTimeClockEntries } = await supabase
      .from("time_clock")
      .select("*, team_directory(full_name)")
      .order("clock_in", { ascending: false });

    const currentlyClockedIn = allTimeClockEntries?.filter(e => !e.clock_out) || [];
    const clockedInList = currentlyClockedIn
      .map(e => {
        const name = e.team_directory?.full_name || e.employee_name || 'Unknown';
        return `- ${name}`;
      })
      .join("\n") || "No one clocked in";

    // My clock status
    const myClockStatus = await getMyClockStatus(userId);

    // Team
    const { data: teamMembers } = await supabase.from("team_directory").select("*").eq("status", "active");
    const numberedTeamList = teamMembers?.map((t, i) => `${i + 1}. ${t.full_name}`).join("\n") || "None";

    return `
📋 ADMIN DASHBOARD
${now.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

YOUR CLOCK STATUS: ${myClockStatus}

═══ LEADS ═══
New: ${newLeads} | Contacted: ${contactedLeads} | Qualified: ${qualifiedLeads}

Recent:
${recentLeads}

═══ OPERATIONS ═══
Active Projects: ${activeProjects}

═══ TODAY'S SCHEDULE ═══
${todayJobsList}

═══ TEAM CLOCKED IN ═══
${clockedInList}

═══ YOUR TEAM (reply with #) ═══
${numberedTeamList}
`;
  } catch (error) {
    console.error("Error fetching admin context:", error);
    return "Unable to fetch data.";
  }
}

async function getContributorContext(userId: string, userName: string): Promise<string> {
  const dates = getDateRanges();
  const { now, todayStart, thisWeekStart, thisWeekEnd } = dates;

  try {
    // Get only MY jobs for today and this week
    const { data: allJobs } = await supabase
      .from("job_schedules")
      .select("*")
      .gte("start_time", thisWeekStart.toISOString())
      .lte("start_time", thisWeekEnd.toISOString());

    // Filter to only jobs where this user is assigned
    const myJobs = allJobs?.filter(j => {
      if (!j.assigned_users) return false;
      const users = Array.isArray(j.assigned_users) ? j.assigned_users : [];
      return users.some((u: any) => 
        u.user_id === userId || 
        u.id === userId || 
        (u.name && u.name.toLowerCase().includes(userName.toLowerCase())) ||
        (u.full_name && u.full_name.toLowerCase().includes(userName.toLowerCase()))
      );
    }) || [];

    const todayJobs = myJobs.filter(j => {
      const jobDate = new Date(j.start_time);
      return jobDate >= todayStart && jobDate <= new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    });

    const upcomingJobs = myJobs.filter(j => new Date(j.start_time) > now);

    const todayJobsList = todayJobs.length > 0
      ? todayJobs.map(j => {
          const startTime = new Date(j.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          return `- ${j.job_name}\n  📍 ${j.location || 'No location'}\n  🕐 ${startTime}`;
        }).join("\n")
      : "No jobs assigned today";

    const upcomingJobsList = upcomingJobs.slice(0, 3)
      .map(j => {
        const date = new Date(j.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        return `- ${j.job_name} (${date})`;
      })
      .join("\n") || "None";

    // My clock status
    const myClockStatus = await getMyClockStatus(userId);

    // My hours this week
    const { data: myTimeEntries } = await supabase
      .from("time_clock")
      .select("*")
      .eq("user_id", userId)
      .gte("clock_in", thisWeekStart.toISOString());

    const weekHours = myTimeEntries?.reduce((sum, e) => sum + (e.total_hours || 0), 0) || 0;

    return `
👷 HI ${userName.toUpperCase()}!
${now.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

⏰ ${myClockStatus}
📊 Week Hours: ${weekHours.toFixed(1)}h

═══ TODAY'S JOBS ═══
${todayJobsList}

═══ UPCOMING ═══
${upcomingJobsList}

💬 You can:
- "Clock in" / "Clock out"
- "Message [name]: [your message]"
- Ask about your jobs
`;
  } catch (error) {
    console.error("Error fetching contributor context:", error);
    return "Unable to fetch your data.";
  }
}

// ===== ROLE-SPECIFIC TOOLS =====

const ownerTools = [
  {
    type: "function",
    function: {
      name: "create_lead",
      description: "Create a new lead/customer in the system",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the lead/customer" },
          email: { type: "string", description: "Email address" },
          status: { type: "string", enum: VALID_LEAD_STATUSES, description: "Initial status (default: new)" },
          phone: { type: "string", description: "Phone number (optional)" }
        },
        required: ["name", "email"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_lead_status",
      description: "Update an existing lead's status",
      parameters: {
        type: "object",
        properties: {
          lead_name: { type: "string", description: "Name of the lead" },
          new_status: { type: "string", enum: VALID_LEAD_STATUSES, description: "New status" }
        },
        required: ["lead_name", "new_status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_project_status",
      description: "Update a project's status",
      parameters: {
        type: "object",
        properties: {
          project_name: { type: "string", description: "Name of the project" },
          new_status: { type: "string", enum: VALID_PROJECT_STATUSES, description: "New status" }
        },
        required: ["project_name", "new_status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_quote_status",
      description: "Update a quote's status",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Customer name on the quote" },
          new_status: { type: "string", enum: VALID_QUOTE_STATUSES, description: "New status" }
        },
        required: ["customer_name", "new_status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "mark_invoice_paid",
      description: "Mark an invoice as paid",
      parameters: {
        type: "object",
        properties: {
          invoice_number: { type: "string", description: "Invoice number" }
        },
        required: ["invoice_number"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_note_to_lead",
      description: "Add a note to a lead",
      parameters: {
        type: "object",
        properties: {
          lead_name: { type: "string", description: "Name of the lead" },
          note: { type: "string", description: "Note content" }
        },
        required: ["lead_name", "note"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_schedule",
      description: `Create a new job/shift schedule. All times are Pacific Time (PT).
      
IMPORTANT: When user wants to create a shift:
1. First ask for job name if not provided
2. Ask for date if not provided
3. Ask for start time if not provided
4. For assignment: SHOW THE NUMBERED TEAM LIST from context and ask user to reply with a NUMBER (1, 2, 3...) or name

The user can reply with just a number like "2" to select a team member.`,
      parameters: {
        type: "object",
        properties: {
          job_name: { type: "string", description: "Name/description of the job" },
          location: { type: "string", description: "Job location/address (optional)" },
          date: { type: "string", description: "Date in format YYYY-MM-DD or 'today', 'tomorrow'" },
          start_time: { type: "string", description: "Start time in PT - format HH:MM (24h like 21:30) or '8am', '9:30pm'" },
          end_time: { type: "string", description: "End time in PT (optional, defaults to +8h)" },
          assigned_to: { type: "string", description: "Team member NUMBER (1,2,3...) or name to assign. Use the numbered list from context." }
        },
        required: ["job_name", "date", "start_time", "assigned_to"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "clock_in",
      description: "Clock yourself in for work",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "clock_out",
      description: "Clock yourself out from work",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "send_message_to_team_member",
      description: `Send an SMS message to another team member.

IMPORTANT: When user wants to message someone:
1. SHOW THE NUMBERED TEAM LIST from context
2. Ask user to reply with a NUMBER (1, 2, 3...) or name
3. Then ask for the message content

The user can reply with just a number like "2" to select who to message.`,
      parameters: {
        type: "object",
        properties: {
          recipient_name: { type: "string", description: "Team member NUMBER (1,2,3...) or name. Use the numbered list from context." },
          message: { type: "string", description: "Message content" }
        },
        required: ["recipient_name", "message"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_system_notification",
      description: `Send an official system notification SMS to team members. This appears as an official company notification, not a personal message.

Use this when the owner wants to:
- "Notify all users: Training at 3pm tomorrow"
- "Alert all contributors: Weather delay"
- "Announce to team: Company meeting Friday"
- "Message all admins: Budget review needed"
- "Notify Luis: Great work on the Garcia project!"

ROLE-BASED TARGETING (use these exact phrases):
- "all" / "everyone" / "team" / "all users" - broadcast to ALL team members
- "contributors" / "all contributors" - only contributors
- "admins" / "all admins" - only admins  
- "owners" / "all owners" - only owners
- "management" / "managers" - owners + admins combined
- A NUMBER (1, 2, 3...) or NAME - single person`,
      parameters: {
        type: "object",
        properties: {
          recipient: { 
            type: "string", 
            description: "Target: 'all', 'contributors', 'admins', 'owners', 'management', or a person's name/number" 
          },
          message: { 
            type: "string", 
            description: "The notification message content" 
          },
          notification_type: { 
            type: "string", 
            enum: ["announcement", "update", "reminder", "alert"],
            description: "Type of notification (affects emoji/style). Default: update"
          }
        },
        required: ["recipient", "message"]
      }
    }
  }
];

const adminTools = [
  {
    type: "function",
    function: {
      name: "create_lead",
      description: "Create a new lead/customer in the system",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the lead/customer" },
          email: { type: "string", description: "Email address" },
          status: { type: "string", enum: VALID_LEAD_STATUSES, description: "Initial status (default: new)" },
          phone: { type: "string", description: "Phone number (optional)" }
        },
        required: ["name", "email"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_lead_status",
      description: "Update an existing lead's status",
      parameters: {
        type: "object",
        properties: {
          lead_name: { type: "string", description: "Name of the lead" },
          new_status: { type: "string", enum: VALID_LEAD_STATUSES, description: "New status" }
        },
        required: ["lead_name", "new_status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_project_status",
      description: "Update a project's status",
      parameters: {
        type: "object",
        properties: {
          project_name: { type: "string", description: "Name of the project" },
          new_status: { type: "string", enum: VALID_PROJECT_STATUSES, description: "New status" }
        },
        required: ["project_name", "new_status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_quote_status",
      description: "Update a quote's status",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Customer name on the quote" },
          new_status: { type: "string", enum: VALID_QUOTE_STATUSES, description: "New status" }
        },
        required: ["customer_name", "new_status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_schedule",
      description: `Create a new job/shift schedule. All times are Pacific Time (PT).
      
IMPORTANT: When user wants to create a shift:
1. First ask for job name if not provided
2. Ask for date if not provided
3. Ask for start time if not provided
4. For assignment: SHOW THE NUMBERED TEAM LIST from context and ask user to reply with a NUMBER (1, 2, 3...) or name

The user can reply with just a number like "2" to select a team member.`,
      parameters: {
        type: "object",
        properties: {
          job_name: { type: "string", description: "Name/description of the job" },
          location: { type: "string", description: "Job location/address (optional)" },
          date: { type: "string", description: "Date in format YYYY-MM-DD or 'today', 'tomorrow'" },
          start_time: { type: "string", description: "Start time in PT - format HH:MM (24h like 21:30) or '8am', '9:30pm'" },
          end_time: { type: "string", description: "End time in PT (optional, defaults to +8h)" },
          assigned_to: { type: "string", description: "Team member NUMBER (1,2,3...) or name to assign. Use the numbered list from context." }
        },
        required: ["job_name", "date", "start_time", "assigned_to"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "clock_in",
      description: "Clock yourself in for work",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "clock_out",
      description: "Clock yourself out from work",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "send_message_to_team_member",
      description: `Send an SMS message to another team member.

IMPORTANT: When user wants to message someone:
1. SHOW THE NUMBERED TEAM LIST from context
2. Ask user to reply with a NUMBER (1, 2, 3...) or name
3. Then ask for the message content

The user can reply with just a number like "2" to select who to message.`,
      parameters: {
        type: "object",
        properties: {
          recipient_name: { type: "string", description: "Team member NUMBER (1,2,3...) or name. Use the numbered list from context." },
          message: { type: "string", description: "Message content" }
        },
        required: ["recipient_name", "message"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_system_notification",
      description: `Send an official system notification SMS to team members. This appears as an official company notification.

Use this when the admin wants to:
- "Notify all contributors: Training at 3pm"
- "Alert everyone: Weather delay tomorrow"
- "Announce to team: Meeting cancelled"
- "Message all admins: Budget review needed"
- "Notify Luis: Great work today!"

ROLE-BASED TARGETING:
- "all" / "everyone" / "team" - broadcast to ALL team members
- "contributors" / "all contributors" - only contributors
- "admins" / "all admins" - only admins  
- "owners" / "all owners" - only owners
- "management" / "managers" - owners + admins combined
- A NUMBER (1, 2, 3...) or NAME - single person`,
      parameters: {
        type: "object",
        properties: {
          recipient: { 
            type: "string", 
            description: "Target: 'all', 'contributors', 'admins', 'owners', 'management', or a person's name/number" 
          },
          message: { 
            type: "string", 
            description: "The notification message content" 
          },
          notification_type: { 
            type: "string", 
            enum: ["announcement", "update", "reminder", "alert"],
            description: "Type of notification (affects emoji/style). Default: update"
          }
        },
        required: ["recipient", "message"]
      }
    }
  }
];

const contributorTools = [
  {
    type: "function",
    function: {
      name: "clock_in",
      description: "Clock yourself in for work",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "clock_out",
      description: "Clock yourself out from work",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "send_message_to_team_member",
      description: `Send an SMS message to another team member. User can reply with a NUMBER (1, 2, 3...) to select who to message.`,
      parameters: {
        type: "object",
        properties: {
          recipient_name: { type: "string", description: "Team member NUMBER or name" },
          message: { type: "string", description: "Message content" }
        },
        required: ["recipient_name", "message"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_my_jobs",
      description: "Get information about your assigned jobs",
      parameters: { type: "object", properties: {}, required: [] }
    }
  }
];

// ===== TOOL EXECUTION =====

async function executeToolCall(toolName: string, args: any, member: TeamMember): Promise<string> {
  console.log(`Executing tool: ${toolName}`, args);
  
  switch (toolName) {
    case "create_lead": {
      const result = await createLead(args.name, args.email, args.status || "new", args.phone);
      return result.success 
        ? `✅ ${result.message}`
        : `❌ ${result.message}`;
    }
    
    case "update_lead_status": {
      const leads = await searchLeads(args.lead_name);
      if (leads.length === 0) {
        return `❌ No lead found matching "${args.lead_name}"`;
      }
      if (leads.length > 1) {
        return `⚠️ Multiple leads found: ${leads.map(l => l.name).join(", ")}. Please be more specific.`;
      }
      const result = await updateLeadStatus(leads[0].id, args.new_status);
      return result.success 
        ? `✅ Updated ${leads[0].name} to "${args.new_status}"`
        : `❌ ${result.message}`;
    }
    
    case "update_project_status": {
      const projects = await searchProjects(args.project_name);
      if (projects.length === 0) {
        return `❌ No project found matching "${args.project_name}"`;
      }
      if (projects.length > 1) {
        return `⚠️ Multiple projects found: ${projects.map(p => p.name).join(", ")}. Be more specific.`;
      }
      const result = await updateProjectStatus(projects[0].id, args.new_status);
      return result.success 
        ? `✅ Updated project "${projects[0].name}" to "${args.new_status}"`
        : `❌ ${result.message}`;
    }
    
    case "update_quote_status": {
      const quotes = await searchQuotes(args.customer_name);
      if (quotes.length === 0) {
        return `❌ No quote found matching "${args.customer_name}"`;
      }
      if (quotes.length > 1) {
        return `⚠️ Multiple quotes found. Be more specific.`;
      }
      const result = await updateQuoteStatus(quotes[0].id, args.new_status);
      return result.success 
        ? `✅ Updated quote for ${quotes[0].name} to "${args.new_status}"`
        : `❌ ${result.message}`;
    }
    
    case "mark_invoice_paid": {
      const result = await markInvoicePaid(args.invoice_number);
      return result.success ? `✅ ${result.message}` : `❌ ${result.message}`;
    }
    
    case "add_note_to_lead": {
      const leads = await searchLeads(args.lead_name);
      if (leads.length === 0) {
        return `❌ No lead found matching "${args.lead_name}"`;
      }
      if (leads.length > 1) {
        return `⚠️ Multiple leads found. Be more specific.`;
      }
      const result = await addLeadNote(leads[0].id, args.note, leads[0].notes);
      return result.success 
        ? `✅ Added note to ${leads[0].name}`
        : `❌ ${result.message}`;
    }
    
    case "create_schedule": {
      // Pacific Time offset - dynamically calculated for PST/PDT
      // San Francisco timezone: America/Los_Angeles
      const PACIFIC_TZ = 'America/Los_Angeles';
      
      // Get dynamic Pacific offset accounting for DST
      const getPacificOffsetHours = (date: Date = new Date()): number => {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: PACIFIC_TZ,
          timeZoneName: 'longOffset'
        });
        const parts = formatter.formatToParts(date);
        const offsetPart = parts.find(p => p.type === 'timeZoneName');
        // offsetPart.value will be like "GMT-08:00" or "GMT-07:00"
        if (offsetPart?.value) {
          const match = offsetPart.value.match(/GMT([+-])(\d{2}):(\d{2})/);
          if (match) {
            const sign = match[1] === '-' ? -1 : 1;
            const hours = parseInt(match[2]);
            return sign * hours; // Returns -8 (PST) or -7 (PDT)
          }
        }
        return -8; // Fallback to PST
      };
      
      const PT_OFFSET = getPacificOffsetHours();
      
      // Get current date in Pacific Time
      const nowUTC = new Date();
      const nowPT = new Date(nowUTC.getTime() + PT_OFFSET * 60 * 60 * 1000);
      
      // Parse date in PT
      let scheduleYear = nowPT.getUTCFullYear();
      let scheduleMonth = nowPT.getUTCMonth();
      let scheduleDay = nowPT.getUTCDate();
      
      const dateArg = args.date?.toLowerCase() || "today";
      
      if (dateArg === "today") {
        // Already set to today PT
      } else if (dateArg === "tomorrow") {
        scheduleDay += 1;
      } else {
        // Try to parse the date
        const parsedDate = new Date(args.date + "T00:00:00");
        if (!isNaN(parsedDate.getTime())) {
          scheduleYear = parsedDate.getFullYear();
          scheduleMonth = parsedDate.getMonth();
          scheduleDay = parsedDate.getDate();
        }
      }
      
      // Parse start time
      let startHour = 8;
      let startMinute = 0;
      const timeArg = args.start_time?.toLowerCase() || "8am";
      
      // Handle 24h format like "21:30" or 12h format like "9:30pm"
      const time24Match = timeArg.match(/^(\d{1,2}):(\d{2})$/);
      const time12Match = timeArg.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
      
      if (time24Match) {
        // 24-hour format: "21:30"
        startHour = parseInt(time24Match[1]);
        startMinute = parseInt(time24Match[2]);
      } else if (time12Match) {
        // 12-hour format: "9:30pm" or "9pm"
        startHour = parseInt(time12Match[1]);
        startMinute = parseInt(time12Match[2] || "0");
        const meridiem = time12Match[3]?.toLowerCase();
        if (meridiem === "pm" && startHour !== 12) startHour += 12;
        if (meridiem === "am" && startHour === 12) startHour = 0;
      }
      
      // Create UTC time from PT components
      // PT time = UTC time + PT_OFFSET, so UTC time = PT time - PT_OFFSET
      const startTimeUTC = new Date(Date.UTC(scheduleYear, scheduleMonth, scheduleDay, startHour - PT_OFFSET, startMinute, 0));
      
      // Parse end time (default to +8 hours)
      let endTimeUTC: Date;
      if (args.end_time) {
        let endHour = 17; // Default 5pm
        let endMinute = 0;
        
        const end24Match = args.end_time.match(/^(\d{1,2}):(\d{2})$/);
        const end12Match = args.end_time.toLowerCase().match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
        
        if (end24Match) {
          endHour = parseInt(end24Match[1]);
          endMinute = parseInt(end24Match[2]);
        } else if (end12Match) {
          endHour = parseInt(end12Match[1]);
          endMinute = parseInt(end12Match[2] || "0");
          const endMeridiem = end12Match[3]?.toLowerCase();
          if (endMeridiem === "pm" && endHour !== 12) endHour += 12;
          if (endMeridiem === "am" && endHour === 12) endHour = 0;
        }
        
        endTimeUTC = new Date(Date.UTC(scheduleYear, scheduleMonth, scheduleDay, endHour - PT_OFFSET, endMinute, 0));
      } else {
        endTimeUTC = new Date(startTimeUTC.getTime() + 8 * 60 * 60 * 1000);
      }
      
      // Look up assigned user - REQUIRED (supports numbers or names)
      let assignedUsers: any[] = [];
      if (args.assigned_to) {
        const assignee = await resolveTeamMemberFromInput(args.assigned_to);
        if (assignee) {
          assignedUsers = [{ user_id: assignee.user_id, name: assignee.full_name }];
        } else {
          // Get team list to help user
          const members = await getActiveTeamMembers();
          const teamList = members.map((m, i) => `${i + 1}. ${m.full_name}`).join("\n");
          return `❌ Couldn't find "${args.assigned_to}". Reply with a number:\n${teamList}`;
        }
      }
      
      const result = await createSchedule(
        args.job_name,
        args.location || null,
        startTimeUTC,
        endTimeUTC,
        assignedUsers
      );
      
      // Format response in PT for confirmation
      const startPT = new Date(startTimeUTC.getTime() + PT_OFFSET * 60 * 60 * 1000);
      const timeStrPT = startPT.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
      const dateStrPT = startPT.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });
      const assigneeInfo = assignedUsers.length > 0 ? ` Assigned to: ${assignedUsers.map(u => u.name).join(', ')}` : '';
      
      return result.success 
        ? `✅ Schedule created: ${args.job_name} on ${dateStrPT} at ${timeStrPT} PT.${assigneeInfo}`
        : `❌ ${result.message}`;
    }
    
    case "clock_in": {
      return await clockIn(member.user_id, member.full_name);
    }
    
    case "clock_out": {
      return await clockOut(member.user_id);
    }
    
    case "send_message_to_team_member": {
      // Resolve recipient using number or name
      const recipient = await resolveTeamMemberFromInput(args.recipient_name);
      if (!recipient) {
        const members = await getActiveTeamMembers();
        const teamList = members.map((m, i) => `${i + 1}. ${m.full_name}`).join("\n");
        return `❌ Couldn't find "${args.recipient_name}". Reply with a number:\n${teamList}`;
      }
      return await sendMessageToTeamMember(member.full_name, recipient.full_name, args.message);
    }
    
    case "get_my_jobs": {
      // This is handled by context, just confirm
      return "Your jobs are shown above. Let me know if you need specific details!";
    }
    
    case "send_system_notification": {
      return await sendSystemNotification(
        args.recipient, 
        args.message, 
        args.notification_type || "update"
      );
    }
    
    default:
      return `❌ Unknown action: ${toolName}`;
  }
}

// ===== SYSTEM PROMPTS =====

function getOwnerSystemPrompt(context: string, conversationHistory: string): string {
  return `You are RoofBot, Sebastian's AI business assistant for Roofing Friend via SMS.

CRITICAL RULES:
1. You have FULL ACCESS to all business data shown below
2. Use TOOLS when asked to update/change/create anything - ALWAYS call the tool
3. NEVER say you did something unless you actually called the tool and got success
4. Keep responses SHORT (under 400 chars for SMS)
5. You can: create leads, update statuses, create schedules, clock in/out, message team, SEND SYSTEM NOTIFICATIONS

SYSTEM NOTIFICATIONS (Owner Power):
- Use send_system_notification to send official company notifications
- "Notify Luis: Great job!" → sends official notification to Luis
- "Alert everyone: Weather delay" → broadcasts to all team members
- "Remind 2: Training tomorrow" → sends reminder to team member #2
- Types: announcement (📢), update (📋), reminder (⏰), alert (🚨)

TEAM SELECTION - VERY IMPORTANT:
- The context shows "YOUR TEAM (reply with #)" with numbered list like "1. Luis Texis"
- When creating schedules, sending messages, or notifications, SHOW this numbered list
- Ask user to "reply with a number" (e.g., "1" for first person)
- User can reply with just "1" or "2" to select team members
- For notifications: can also use "all" or "everyone" to broadcast

EXAMPLE for create_schedule:
User: "Create shift for tomorrow"
You: "What's the job name?"
User: "Garcia roof"
You: "What time? (e.g., 8am)"
User: "8am"
You: "Who should I assign? Reply with #:
1. Agustin
2. Brissa
3. Edgar
4. Luis"
User: "4"
[Then call create_schedule with assigned_to="4"]

${context}

═══ RECENT CONVERSATION ═══
${conversationHistory}

When asked to do something, ALWAYS use the appropriate tool. If info is missing, ASK for it first.`;
}

function getAdminSystemPrompt(context: string, conversationHistory: string, memberName: string): string {
  return `You are RoofBot, an admin assistant for ${memberName} at Roofing Friend via SMS.

CRITICAL RULES:
1. You can manage leads, projects, quotes, and schedules
2. Use TOOLS when asked to create/update anything - ALWAYS call the tool
3. NEVER say you did something unless you actually called the tool and got success
4. You CANNOT access revenue/financial details or mark invoices paid
5. Keep responses SHORT (under 400 chars)

TEAM SELECTION - VERY IMPORTANT:
- The context shows "YOUR TEAM (reply with #)" with numbered list
- When creating schedules or sending messages, SHOW this numbered list
- Ask user to "reply with a number" to select team members
- User can reply with just "1" or "2" to select

EXAMPLE:
"Who to message? Reply with #:
1. Agustin
2. Luis
3. Edgar"

${context}

═══ RECENT CONVERSATION ═══
${conversationHistory}

When asked to do something, ALWAYS use the appropriate tool. If info is missing, ASK for it first.`
}

function getContributorSystemPrompt(context: string, conversationHistory: string, memberName: string): string {
  return `You are RoofBot, a work assistant for ${memberName} at Roofing Friend via SMS.

WHAT YOU CAN DO:
1. Clock in/out for ${memberName}'s shift
2. Show their assigned jobs
3. Message teammates (they can reply with a NUMBER to select who)
4. Answer questions about their schedule

WHAT YOU CANNOT DO:
- Access leads, financials, or other business data
- Update any statuses except clock in/out

Keep responses SHORT and friendly (under 400 chars).

${context}

═══ RECENT CONVERSATION ═══
${conversationHistory}`;
}

// ===== AI RESPONSE =====

async function getAIResponse(
  message: string, 
  conversationHistory: string, 
  context: string,
  tools: any[],
  systemPrompt: string,
  member: TeamMember
): Promise<string> {
  const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!openAIApiKey) {
    console.error("OpenAI API key not configured");
    return "AI assistant temporarily unavailable.";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? "auto" : undefined,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return "Sorry, couldn't process that. Try again!";
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message;
    
    // Check if AI wants to call tools
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log("AI requested tool calls:", assistantMessage.tool_calls.length);
      
      const toolResults: { tool_call_id: string; role: string; content: string }[] = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${toolName}`, toolArgs);
        const result = await executeToolCall(toolName, toolArgs, member);
        console.log(`Tool result: ${result}`);
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: result
        });
      }
      
      // Second API call with tool results
      const followUpResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
            assistantMessage,
            ...toolResults
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!followUpResponse.ok) {
        return toolResults.map(r => r.content).join("\n");
      }

      const followUpData = await followUpResponse.json();
      const finalResponse = followUpData.choices?.[0]?.message?.content?.trim() || toolResults.map(r => r.content).join("\n");
      
      return finalResponse.length > 600 ? finalResponse.substring(0, 597) + "..." : finalResponse;
    }
    
    const aiResponse = assistantMessage?.content?.trim() || "No response generated.";
    return aiResponse.length > 600 ? aiResponse.substring(0, 597) + "..." : aiResponse;
    
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return "AI error. Try again!";
  }
}

// ===== XML ESCAPE =====

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ===== MAIN HANDLER =====

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📥 Received SMS webhook from Twilio");

    const formData = await req.formData();
    
    const fromPhone = formData.get("From")?.toString() || "";
    const toPhone = formData.get("To")?.toString() || "";
    const body = formData.get("Body")?.toString() || "";
    const messageSid = formData.get("MessageSid")?.toString() || "";

    console.log("SMS Details:", { fromPhone, toPhone, messageSid, bodyPreview: body.substring(0, 50) });

    // ===== IDENTIFY USER BY PHONE =====
    const { member, role } = await identifyUser(fromPhone);
    console.log(`User identified: ${member?.full_name || 'Unknown'} (role: ${role})`);

    // Find recent outbound for context
    const { data: recentOutbound } = await supabase
      .from("sms_conversations")
      .select("lead_id, context")
      .eq("to_phone", fromPhone)
      .eq("direction", "outbound")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const leadId = recentOutbound?.lead_id || null;
    const originalContext = recentOutbound?.context || {};

    // ===== CHECK IF THIS IS A CHAT REPLY =====
    if (originalContext.chat_reply && originalContext.channel_id && member) {
      console.log("🔄 Detected chat reply, routing to app...");
      
      try {
        // Use the user_id from the original notification context - this is the person
        // who received the SMS and is now replying (more reliable than phone matching)
        const senderUserId = originalContext.user_id || member.user_id;
        
        // Fetch the correct sender name from team_directory using the context user_id
        let senderName = member.full_name || "SMS User";
        if (originalContext.user_id) {
          const { data: senderMember } = await supabase
            .from("team_directory")
            .select("full_name")
            .eq("user_id", originalContext.user_id)
            .single();
          
          if (senderMember?.full_name) {
            senderName = senderMember.full_name;
          }
        }
        
        // Insert the reply directly into team_chats
        const { error: chatError } = await supabase
          .from("team_chats")
          .insert({
            sender: senderName,
            sender_user_id: senderUserId,
            message: body,
            channel_name: originalContext.channel_id,
            message_type: "sms",
            timestamp: new Date().toISOString()
          });

        if (chatError) {
          console.error("Error inserting chat reply:", chatError);
        } else {
          console.log(`✅ SMS reply inserted into chat: ${originalContext.channel_id}`);
          
          // Store the inbound message with context
          await supabase.from("sms_conversations").insert({
            lead_id: leadId,
            from_phone: fromPhone,
            to_phone: toPhone,
            direction: "inbound",
            message: body,
            twilio_sid: messageSid,
            context: {
              ...originalContext,
              is_chat_reply: true,
              routed_to_channel: originalContext.channel_id,
              user_name: member.full_name
            }
          });

          // Send confirmation response
          const confirmMsg = `✅ Message sent to ${originalContext.channel_name || 'chat'}`;
          const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(confirmMsg)}</Message>
</Response>`;

          return new Response(twimlResponse, {
            status: 200,
            headers: { "Content-Type": "application/xml", ...corsHeaders },
          });
        }
      } catch (chatReplyError) {
        console.error("Failed to process chat reply:", chatReplyError);
        // Fall through to normal processing
      }
    }

    // Store inbound message
    const { error: insertError } = await supabase
      .from("sms_conversations")
      .insert({
        lead_id: leadId,
        from_phone: fromPhone,
        to_phone: toPhone,
        direction: "inbound",
        message: body,
        twilio_sid: messageSid,
        context: {
          ...originalContext,
          is_reply: true,
          user_role: role,
          user_name: member?.full_name || null
        }
      });

    if (insertError) {
      console.error("Error storing inbound SMS:", insertError);
    }

    // ===== PROCESS BASED ON ROLE =====
    if (!member || role === "unknown") {
      console.log("Unknown user, ignoring message");
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
        status: 200,
        headers: { "Content-Type": "application/xml", ...corsHeaders },
      });
    }

    if (!body.trim()) {
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
        status: 200,
        headers: { "Content-Type": "application/xml", ...corsHeaders },
      });
    }

    console.log(`🤖 Processing ${role} query from ${member.full_name}...`);

    // Get conversation history
    const conversationHistory = await getConversationHistory(fromPhone);

    // Get role-appropriate context, tools, and system prompt
    let context: string;
    let tools: any[];
    let systemPrompt: string;

    switch (role) {
      case "owner":
        context = await getOwnerContext();
        tools = ownerTools;
        systemPrompt = getOwnerSystemPrompt(context, conversationHistory);
        break;
      case "admin":
        context = await getAdminContext(member.user_id);
        tools = adminTools;
        systemPrompt = getAdminSystemPrompt(context, conversationHistory, member.full_name);
        break;
      case "contributor":
      default:
        context = await getContributorContext(member.user_id, member.full_name);
        tools = contributorTools;
        systemPrompt = getContributorSystemPrompt(context, conversationHistory, member.full_name);
        break;
    }

    // Get AI response
    const aiResponse = await getAIResponse(body, conversationHistory, context, tools, systemPrompt, member);
    console.log("AI Response:", aiResponse);

    // Store AI response
    await supabase.from("sms_conversations").insert({
      lead_id: null,
      from_phone: toPhone,
      to_phone: fromPhone,
      direction: "outbound",
      message: aiResponse,
      twilio_sid: null,
      context: {
        ai_response: true,
        user_role: role,
        user_name: member.full_name,
        original_question: body
      }
    });

    // Return TwiML response
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(aiResponse)}</Message>
</Response>`;

    return new Response(twimlResponse, {
      status: 200,
      headers: { "Content-Type": "application/xml", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Error processing SMS webhook:", error);
    
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
      status: 200,
      headers: { "Content-Type": "application/xml", ...corsHeaders },
    });
  }
});
