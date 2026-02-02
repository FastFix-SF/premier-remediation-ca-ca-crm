import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LocalNotifications } from '@capacitor/local-notifications';

// Helper to create in-app notification
async function createInAppNotification(params: {
  memberId: string;
  type: string;
  title: string;
  message?: string;
  priority?: 'normal' | 'high' | 'urgent';
  referenceId?: string;
  referenceType?: string;
  actionUrl?: string;
}) {
  const { memberId, type, title, message, priority = 'normal', referenceId, referenceType, actionUrl } = params;

  try {
    await supabase
      .from('team_member_notifications')
      .insert({
        member_id: memberId,
        type,
        title,
        message: message || null,
        priority,
        reference_id: referenceId || null,
        reference_type: referenceType || null,
        action_url: actionUrl || null,
        is_read: false,
      });
  } catch (error) {
    console.error('Failed to create in-app notification:', error);
  }
}

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  useEffect(() => {
    if (!user) return;

    // Generate unique channel names to prevent duplicate subscription errors
    const instanceId = Math.random().toString(36).substring(7);
    
    // Clean up any existing channels first
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Listen for new messages
    const messagesChannel = supabase
      .channel(`new-messages-${user.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `sender_id=neq.${user.id}`,
        },
        async (payload) => {
          console.log('New message received:', payload);
          
          // Check if user is in this conversation
          const { data: conversation } = await supabase
            .from('direct_conversations')
            .select('*')
            .eq('id', payload.new.conversation_id)
            .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
            .maybeSingle();

          if (conversation) {
            // Create in-app notification
            await createInAppNotification({
              memberId: user.id,
              type: 'message_received',
              title: 'New Message',
              message: 'You have a new team message',
              priority: 'normal',
              referenceId: payload.new.conversation_id as string,
              referenceType: 'conversation',
              actionUrl: `/mobile/chat/${payload.new.conversation_id}`,
            });

            // Send SMS notification
            await supabase.functions.invoke('send-sms-notification', {
              body: {
                userId: user.id,
                title: 'New Message',
                body: 'You have a new team message',
                data: {
                  type: 'message',
                  conversationId: payload.new.conversation_id,
                },
              },
            });
          }
        }
      )
      .subscribe();

    channelsRef.current.push(messagesChannel);

    // Listen for job schedule assignments
    const schedulesChannel = supabase
      .channel(`job-schedules-${user.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_schedules',
        },
        async (payload) => {
          console.log('🔔 Job schedule change detected:', {
            event: payload.eventType,
            new: payload.new,
            old: payload.old
          });
          
          const newSchedule = payload.new as any;
          const oldSchedule = payload.old as any;
          
          // Check if user was just added to the schedule
          const newAssignedUsers = newSchedule?.assigned_users || [];
          const oldAssignedUsers = oldSchedule?.assigned_users || [];
          
          const wasJustAssigned = newAssignedUsers.some(
            (u: any) => (u.user_id === user.id || u.email === user.email)
          ) && !oldAssignedUsers.some(
            (u: any) => (u.user_id === user.id || u.email === user.email)
          );

          console.log('🔍 Assignment check:', {
            wasJustAssigned,
            userId: user.id,
            newAssignedUsers,
            oldAssignedUsers
          });

          // Only send notifications for PUBLISHED schedules (status === 'scheduled')
          // Draft schedules should NOT trigger notifications
          if (wasJustAssigned && newSchedule && newSchedule.status === 'scheduled') {
            console.log('✅ User was just assigned to a PUBLISHED shift, sending notification');
            
            // Create in-app notification
            await createInAppNotification({
              memberId: user.id,
              type: 'schedule_assigned',
              title: 'New Schedule Assignment',
              message: `You've been assigned to ${newSchedule.job_name || 'a job'}`,
              priority: 'high',
              referenceId: newSchedule.id,
              referenceType: 'schedule',
              actionUrl: '/mobile/schedule',
            });

            // Send local notification immediately as fallback
            try {
              await LocalNotifications.schedule({
                notifications: [{
                  title: 'New Schedule Assignment',
                  body: `You've been assigned to ${newSchedule.job_name || 'a job'}`,
                  id: Date.now(),
                  schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
                  extra: {
                    type: 'schedule',
                    scheduleId: newSchedule.id,
                  },
                }],
              });
              console.log('📱 Local notification scheduled');
            } catch (error) {
              console.error('❌ Error scheduling local notification:', error);
            }

            // Send SMS notification
            try {
              const { data, error } = await supabase.functions.invoke('send-sms-notification', {
                body: {
                  userId: user.id,
                  title: 'New Schedule Assignment',
                  body: `You've been assigned to ${newSchedule.job_name}`,
                  data: {
                    type: 'schedule',
                    scheduleId: newSchedule.id,
                  },
                },
              });
              console.log('📤 SMS notification response:', { data, error });
            } catch (error) {
              console.error('❌ Error sending SMS notification:', error);
            }
          }
        }
      )
      .subscribe();

    channelsRef.current.push(schedulesChannel);

    // Listen for employee request status updates
    const requestsChannel = supabase
      .channel(`employee-requests-${user.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'employee_requests',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('🔔 Employee request updated:', payload);
          
          const newRequest = payload.new as any;
          const oldRequest = payload.old as any;
          
          // Only notify if status changed
          if (newRequest.status !== oldRequest.status && newRequest.status !== 'pending') {
            const statusText = newRequest.status === 'approved' ? '✅ Approved' : '❌ Denied';
            const requestType = newRequest.request_type || 'request';
            
            // Create in-app notification
            await createInAppNotification({
              memberId: user.id,
              type: 'request_status',
              title: `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} Request ${statusText}`,
              message: newRequest.notes || `Your ${requestType} request has been ${newRequest.status}`,
              priority: 'normal',
              referenceId: newRequest.id,
              referenceType: 'request',
              actionUrl: '/mobile/requests',
            });

            try {
              await LocalNotifications.schedule({
                notifications: [{
                  title: `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} Request ${statusText}`,
                  body: newRequest.notes || `Your ${requestType} request has been ${newRequest.status}`,
                  id: Date.now(),
                  schedule: { at: new Date(Date.now() + 1000) },
                  extra: {
                    type: 'request',
                    requestId: newRequest.id,
                    status: newRequest.status,
                  },
                }],
              });
              console.log('📱 Request notification scheduled');
            } catch (error) {
              console.error('❌ Error scheduling request notification:', error);
            }

            try {
              await supabase.functions.invoke('send-sms-notification', {
                body: {
                  userId: user.id,
                  title: `${requestType} Request ${statusText}`,
                  body: newRequest.notes || `Your ${requestType} request has been ${newRequest.status}`,
                  data: {
                    type: 'request',
                    requestId: newRequest.id,
                    status: newRequest.status,
                  },
                },
              });
            } catch (error) {
              console.error('❌ Error sending SMS notification:', error);
            }
          }
        }
      )
      .subscribe();

    channelsRef.current.push(requestsChannel);

    // Listen for new project updates
    const updatesChannel = supabase
      .channel(`project-updates-${user.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_updates',
        },
        async (payload) => {
          console.log('🔔 New project update:', payload);
          
          const newUpdate = payload.new as any;
          
          // Only notify team members assigned to THIS specific project
          const { data: assignments } = await supabase
            .from('project_team_assignments')
            .select('user_id')
            .eq('project_id', newUpdate.project_id);
          
          // Check if current user is assigned to this project and didn't create the update
          const shouldNotify = assignments?.some(a => a.user_id === user.id) && 
                             newUpdate.created_by !== user.id;
          
          if (shouldNotify) {
            // Create in-app notification
            await createInAppNotification({
              memberId: user.id,
              type: 'project_update',
              title: 'New Project Update',
              message: newUpdate.title || 'A new project update has been posted',
              priority: 'normal',
              referenceId: newUpdate.project_id,
              referenceType: 'project',
              actionUrl: `/mobile/projects/${newUpdate.project_id}`,
            });

            try {
              await LocalNotifications.schedule({
                notifications: [{
                  title: 'New Update',
                  body: newUpdate.title || 'A new project update has been posted',
                  id: Date.now(),
                  schedule: { at: new Date(Date.now() + 1000) },
                  extra: {
                    type: 'update',
                    updateId: newUpdate.id,
                    projectId: newUpdate.project_id,
                  },
                }],
              });
              console.log('📱 Update notification scheduled');
            } catch (error) {
              console.error('❌ Error scheduling update notification:', error);
            }

            try {
              await supabase.functions.invoke('send-sms-notification', {
                body: {
                  userId: user.id,
                  title: 'New Project Update',
                  body: newUpdate.title || 'A new project update has been posted',
                  data: {
                    type: 'update',
                    updateId: newUpdate.id,
                    projectId: newUpdate.project_id,
                  },
                },
              });
            } catch (error) {
              console.error('❌ Error sending SMS notification:', error);
            }
          }
        }
      )
      .subscribe();

    channelsRef.current.push(updatesChannel);

    // Listen for task assignments
    const tasksChannel = supabase
      .channel(`task-assignments-${user.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_tasks',
        },
        async (payload) => {
          const newTask = payload.new as any;
          const oldTask = payload.old as any;
          
          // Check if user was just assigned
          const wasJustAssigned = newTask?.assigned_to === user.id && 
                                 oldTask?.assigned_to !== user.id;
          
          if (wasJustAssigned) {
            await createInAppNotification({
              memberId: user.id,
              type: 'task_assigned',
              title: 'New Task Assigned',
              message: newTask.title || 'You have been assigned a new task',
              priority: 'high',
              referenceId: newTask.id,
              referenceType: 'task',
              actionUrl: `/mobile/projects/${newTask.project_id}`,
            });
          }
        }
      )
      .subscribe();

    channelsRef.current.push(tasksChannel);

    // Listen for subtask assignments
    const subtasksChannel = supabase
      .channel(`subtask-assignments-${user.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_subtasks',
        },
        async (payload) => {
          const newSubtask = payload.new as any;
          const oldSubtask = payload.old as any;
          
          // Check if user was just assigned
          const wasJustAssigned = newSubtask?.assigned_to === user.id && 
                                 oldSubtask?.assigned_to !== user.id;
          
          if (wasJustAssigned) {
            await createInAppNotification({
              memberId: user.id,
              type: 'subtask_assigned',
              title: 'New Subtask Assigned',
              message: newSubtask.title || 'You have been assigned a new subtask',
              priority: 'normal',
              referenceId: newSubtask.id,
              referenceType: 'subtask',
              actionUrl: `/mobile/tasks`,
            });
          }
        }
      )
      .subscribe();

    channelsRef.current.push(subtasksChannel);

    // Listen for team_tasks collaborator assignments
    const collaboratorChannel = supabase
      .channel(`task-collaborators-${user.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'team_tasks',
        },
        async (payload) => {
          const newTask = payload.new as any;
          const oldTask = payload.old as any;
          
          const newCollaborators: string[] = newTask?.collaborator_ids || [];
          const oldCollaborators: string[] = oldTask?.collaborator_ids || [];
          
          // Check if user was just added as collaborator
          const wasJustAddedAsCollaborator = 
            newCollaborators.includes(user.id) && 
            !oldCollaborators.includes(user.id);
          
          if (wasJustAddedAsCollaborator && newTask.owner_id !== user.id) {
            console.log('📋 User added as collaborator to task:', newTask.title);
            
            await createInAppNotification({
              memberId: user.id,
              type: 'task_collaborator',
              title: 'Added as Collaborator',
              message: `You've been added as a collaborator on: ${newTask.title}`,
              priority: 'normal',
              referenceId: newTask.id,
              referenceType: 'task',
              actionUrl: '/mobile/tasks',
            });

            // Send SMS notification
            try {
              await supabase.functions.invoke('send-sms-notification', {
                body: {
                  userId: user.id,
                  title: 'Added as Collaborator',
                  body: `You've been added as a collaborator on: ${newTask.title}`,
                  data: {
                    type: 'task_collaborator',
                    taskId: newTask.id,
                  },
                },
              });
            } catch (error) {
              console.error('❌ Error sending collaborator SMS notification:', error);
            }
          }
        }
      )
      .subscribe();

    channelsRef.current.push(collaboratorChannel);

    // Listen for project team assignments - when user is added to a project
    const projectAssignmentsChannel = supabase
      .channel(`project-assignments-${user.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_team_assignments',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('📁 User added to project:', payload);
          
          const assignment = payload.new as any;
          
          // Get project name
          const { data: project } = await supabase
            .from('projects')
            .select('name')
            .eq('id', assignment.project_id)
            .maybeSingle();
          
          await createInAppNotification({
            memberId: user.id,
            type: 'project_assigned',
            title: 'Added to Project',
            message: `You've been added to project: ${project?.name || 'a project'}`,
            priority: 'high',
            referenceId: assignment.project_id,
            referenceType: 'project',
            actionUrl: `/mobile/projects/${assignment.project_id}`,
          });

          // Send local notification
          try {
            await LocalNotifications.schedule({
              notifications: [{
                title: 'Added to Project',
                body: `You've been added to project: ${project?.name || 'a project'}`,
                id: Date.now(),
                schedule: { at: new Date(Date.now() + 1000) },
                extra: {
                  type: 'project_assigned',
                  projectId: assignment.project_id,
                },
              }],
            });
          } catch (error) {
            console.error('❌ Error scheduling project assignment notification:', error);
          }

          // Send SMS notification
          try {
            await supabase.functions.invoke('send-sms-notification', {
              body: {
                userId: user.id,
                title: 'Added to Project',
                body: `You've been added to project: ${project?.name || 'a project'}`,
                data: {
                  type: 'project_assigned',
                  projectId: assignment.project_id,
                },
              },
            });
          } catch (error) {
            console.error('❌ Error sending project assignment SMS:', error);
          }
        }
      )
      .subscribe();

    channelsRef.current.push(projectAssignmentsChannel);

    // Listen for team_tasks owner assignments (when user becomes owner of a task)
    const teamTaskOwnerChannel = supabase
      .channel(`team-task-owner-${user.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_tasks',
        },
        async (payload) => {
          const newTask = payload.new as any;
          const oldTask = payload.old as any;
          
          // Check if user was just assigned as owner
          const wasJustAssigned = newTask?.owner_id === user.id && 
                                 oldTask?.owner_id !== user.id;
          
          if (wasJustAssigned) {
            console.log('📋 User assigned as task owner:', newTask.title);
            
            await createInAppNotification({
              memberId: user.id,
              type: 'task_assigned',
              title: `Task: ${newTask.title || 'New Task'}`,
              message: 'You have been assigned as the owner of this task',
              priority: 'high',
              referenceId: newTask.id,
              referenceType: 'task',
              actionUrl: '/mobile/tasks',
            });

            // Send local notification
            try {
              await LocalNotifications.schedule({
                notifications: [{
                  title: `Task: ${newTask.title || 'New Task'}`,
                  body: 'You have been assigned as the owner of this task',
                  id: Date.now(),
                  schedule: { at: new Date(Date.now() + 1000) },
                  extra: {
                    type: 'task_assigned',
                    taskId: newTask.id,
                  },
                }],
              });
            } catch (error) {
              console.error('❌ Error scheduling task owner notification:', error);
            }

            // Send SMS notification
            try {
              await supabase.functions.invoke('send-sms-notification', {
                body: {
                  userId: user.id,
                  title: `Task: ${newTask.title || 'New Task'}`,
                  body: 'You have been assigned as the owner of this task',
                  data: {
                    type: 'task_assigned',
                    taskId: newTask.id,
                  },
                },
              });
            } catch (error) {
              console.error('❌ Error sending task owner SMS:', error);
            }
          }
        }
      )
      .subscribe();

    channelsRef.current.push(teamTaskOwnerChannel);

    // Listen for team chat messages
    const teamChatsChannel = supabase
      .channel(`team-chats-${user.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chats',
          filter: `sender_user_id=neq.${user.id}`,
        },
        async (payload) => {
          const newChat = payload.new as any;
          
          // Check if user is assigned to this project
          const { data: assignment } = await supabase
            .from('project_team_assignments')
            .select('id')
            .eq('project_id', newChat.project_id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (assignment) {
            // Get sender name
            const { data: sender } = await supabase
              .from('team_directory')
              .select('full_name')
              .eq('user_id', newChat.sender_id)
              .maybeSingle();
            
            const senderName = sender?.full_name || 'Someone';
            
            await createInAppNotification({
              memberId: user.id,
              type: 'message',
              title: `New message from ${senderName}`,
              message: newChat.message?.substring(0, 100) || 'New message in project chat',
              priority: 'normal',
              referenceId: newChat.project_id,
              referenceType: 'chat',
              actionUrl: `/mobile/chat/${newChat.project_id}`,
            });
          }
        }
      )
      .subscribe();

    channelsRef.current.push(teamChatsChannel);

    // Cleanup
    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [user]);
};
