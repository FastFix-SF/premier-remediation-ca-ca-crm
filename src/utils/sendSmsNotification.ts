import { supabase } from '@/integrations/supabase/client';

interface SendSmsNotificationParams {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const sendSmsNotification = async ({
  userId,
  title,
  body,
  data = {}
}: SendSmsNotificationParams) => {
  try {
    console.log('📱 Sending SMS notification:', { userId, title, body });
    
    const { data: result, error } = await supabase.functions.invoke('send-sms-notification', {
      body: {
        userId,
        title,
        body,
        data
      }
    });

    if (error) {
      console.error('❌ Error sending SMS notification:', error);
      return { success: false, error };
    }

    console.log('✅ SMS notification sent:', result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Error in sendSmsNotification:', error);
    return { success: false, error };
  }
};

// Helper to send notification when a team message is sent
export const notifyTeamMessage = async (recipientId: string, senderName: string, messagePreview: string, conversationId?: string) => {
  return sendSmsNotification({
    userId: recipientId,
    title: `💬 New message from ${senderName}`,
    body: messagePreview,
    data: {
      type: 'message',
      senderId: recipientId,
      conversationId
    }
  });
};

// Helper to send notification for project updates
export const notifyProjectUpdate = async (userId: string, projectName: string, updateType: string, projectId?: string) => {
  return sendSmsNotification({
    userId,
    title: `📋 Project Update: ${projectName}`,
    body: `${updateType}`,
    data: {
      type: 'project_update',
      projectName,
      projectId
    }
  });
};

// Helper to send notification for job assignments
export const notifyJobAssignment = async (userId: string, jobName: string) => {
  return sendSmsNotification({
    userId,
    title: '📅 New Schedule Assignment',
    body: `You've been assigned to ${jobName}`,
    data: {
      type: 'schedule',
      jobName
    }
  });
};

// Helper to send notification for @mentions in chat
export const notifyMention = async (
  mentionedUserId: string, 
  senderName: string, 
  messagePreview: string, 
  channelName: string,
  projectId?: string,
  displayChannelName?: string  // Human-readable name for SMS display
) => {
  return sendSmsNotification({
    userId: mentionedUserId,
    title: `@${senderName} mentioned you`,
    body: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
    data: {
      type: 'mention',
      channelId: channelName,                       // Used for reply routing (database lookup)
      channelName: displayChannelName || channelName, // Human-readable name for confirmation SMS
      senderName: senderName,                       // For context
      projectId
    }
  });
};

// Helper to notify all admins and owners when a new shift/time-off request is submitted
export const notifyNewEmployeeRequest = async (
  requestType: 'shift' | 'time_off',
  employeeName: string,
  details: string,
  shiftData?: {
    date: string;
    startTime: string;
    endTime: string;
  }
) => {
  console.log('📝 Notifying admins/owners of new employee request:', { requestType, employeeName, details, shiftData });
  
  try {
    // Fetch all admins and owners from team_directory
    const { data: adminUsers, error } = await supabase
      .from('team_directory')
      .select('user_id, full_name, role')
      .in('role', ['admin', 'owner'])
      .eq('status', 'active');

    if (error) {
      console.error('❌ Error fetching admin users:', error);
      return { success: false, error };
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('⚠️ No admins/owners found to notify');
      return { success: true, result: 'No admins to notify' };
    }

    // Filter to only those with user_id (actually linked to auth)
    const linkedAdmins = adminUsers.filter(admin => admin.user_id);
    
    if (linkedAdmins.length === 0) {
      console.log('⚠️ No linked admins/owners found to notify');
      return { success: true, result: 'No linked admins to notify' };
    }

    console.log(`📤 Sending notifications to ${linkedAdmins.length} admins/owners`);

    const title = requestType === 'shift' 
      ? `📝 Timesheet Edit Request`
      : `🏖️ Time Off Request from ${employeeName}`;

    // Send notifications to all admins/owners in parallel
    const notificationPromises = linkedAdmins.map(admin => 
      sendSmsNotification({
        userId: admin.user_id!,
        title,
        body: details,
        data: {
          type: 'employee_request',
          requestType,
          employeeName,
          shiftData
        }
      })
    );

    const results = await Promise.allSettled(notificationPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Sent ${successful}/${linkedAdmins.length} notifications`);

    return { success: true, result: { sent: successful, total: linkedAdmins.length } };
  } catch (error) {
    console.error('❌ Error in notifyNewEmployeeRequest:', error);
    return { success: false, error };
  }
};

// Helper to notify an employee when their request is denied
export const notifyRequestDenied = async (
  userId: string,
  requestType: 'shift' | 'time_off' | 'break',
  reason?: string
) => {
  const requestTypeName = requestType === 'shift' 
    ? 'shift request' 
    : requestType === 'time_off' 
      ? 'time off request' 
      : 'break request';
  
  return sendSmsNotification({
    userId,
    title: `❌ Request Denied`,
    body: `Your ${requestTypeName} has been denied.${reason ? ` Reason: ${reason}` : ''}`,
    data: {
      type: 'request_denied',
      requestType
    }
  });
};

// Helper to notify a technician when assigned to a service ticket
export const notifyServiceTicketAssignment = async (
  technicianUserId: string,
  ticketNumber: string,
  ticketTitle: string,
  scheduledDate?: string | null,
  scheduledTime?: string | null,
  serviceAddress?: string | null
) => {
  // Format the date/time if available
  let scheduleInfo = '';
  if (scheduledDate) {
    const dateObj = new Date(scheduledDate + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    scheduleInfo = scheduledTime 
      ? `${dayName} ${month}/${day} at ${scheduledTime}` 
      : `${dayName} ${month}/${day}`;
  }
  
  // Build message body
  const details = [
    `Ticket #${ticketNumber}: ${ticketTitle}`,
    scheduleInfo ? `Scheduled: ${scheduleInfo}` : null,
    serviceAddress ? `Location: ${serviceAddress}` : null
  ].filter(Boolean).join('\n');

  return sendSmsNotification({
    userId: technicianUserId,
    title: '🔧 Service Ticket Assignment',
    body: details,
    data: {
      type: 'service_ticket_assignment',
      ticketNumber,
      ticketTitle
    }
  });
};

// Helper to notify admins when a user clocks into an unassigned project
export const notifyProjectAccessRequest = async (
  employeeName: string,
  projectName: string,
  projectAddress?: string
) => {
  console.log('🔔 Notifying admins of project access request:', { employeeName, projectName, projectAddress });
  
  try {
    // Only notify specific designated recipients for project access requests
    const designatedRecipients = ['Fernanda Garcia', 'Brissa Tintori'];
    
    const { data: adminUsers, error } = await supabase
      .from('team_directory')
      .select('user_id, full_name, role')
      .in('full_name', designatedRecipients)
      .eq('status', 'active');

    if (error) {
      console.error('❌ Error fetching admin users:', error);
      return { success: false, error };
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('⚠️ No admins/owners found to notify');
      return { success: true, result: 'No admins to notify' };
    }

    // Filter to only those with user_id (actually linked to auth)
    const linkedAdmins = adminUsers.filter(admin => admin.user_id);
    
    if (linkedAdmins.length === 0) {
      console.log('⚠️ No linked admins/owners found to notify');
      return { success: true, result: 'No linked admins to notify' };
    }

    console.log(`📤 Sending project access request notifications to ${linkedAdmins.length} admins/owners`);

    const locationText = projectAddress ? ` at ${projectAddress}` : '';
    const message = `${employeeName} is requesting to be added to project: ${projectName}${locationText}. Please assign them if approved.`;

    // Send notifications to all admins/owners in parallel
    const notificationPromises = linkedAdmins.map(admin => 
      sendSmsNotification({
        userId: admin.user_id!,
        title: '🔔 Project Assignment Request',
        body: message,
        data: {
          type: 'project_access_request',
          employeeName,
          projectName,
          projectAddress
        }
      })
    );

    const results = await Promise.allSettled(notificationPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Sent ${successful}/${linkedAdmins.length} project access request notifications`);

    return { success: true, result: { sent: successful, total: linkedAdmins.length } };
  } catch (error) {
    console.error('❌ Error in notifyProjectAccessRequest:', error);
    return { success: false, error };
  }
};

// Helper to notify user when assigned to a task
export const notifyTaskAssignment = async (
  assigneeUserId: string,
  taskTitle: string,
  assignedByName?: string,
  isCollaborator: boolean = false
) => {
  const role = isCollaborator ? 'collaborator' : 'assignee';
  const byText = assignedByName ? ` by ${assignedByName}` : '';
  
  return sendSmsNotification({
    userId: assigneeUserId,
    title: `📋 New Task Assignment`,
    body: `You've been added as ${role} on: "${taskTitle}"${byText}`,
    data: {
      type: 'task_assignment',
      taskTitle,
      role
    }
  });
};

// Helper to notify an employee when their request is approved
export const notifyRequestApproved = async (
  userId: string,
  requestType: 'shift' | 'time_off' | 'break',
  details?: string
) => {
  const requestTypeName = requestType === 'shift' 
    ? 'shift request' 
    : requestType === 'time_off' 
      ? 'time off request' 
      : 'break request';
  
  return sendSmsNotification({
    userId,
    title: `✅ Request Approved`,
    body: `Your ${requestTypeName} has been approved!${details ? ` ${details}` : ''}`,
    data: {
      type: 'request_approved',
      requestType
    }
  });
};
