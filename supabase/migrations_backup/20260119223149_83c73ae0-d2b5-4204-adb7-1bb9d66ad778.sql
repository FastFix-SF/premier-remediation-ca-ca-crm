-- Backfill notifications from recent direct messages (last 30 days)
INSERT INTO team_member_notifications (member_id, type, title, message, priority, reference_id, reference_type, action_url, created_at)
SELECT 
  CASE 
    WHEN c.participant_one_id = m.sender_id THEN c.participant_two_id 
    ELSE c.participant_one_id 
  END as recipient_id,
  'message_received',
  'Message from ' || COALESCE(td.full_name, 'Team Member'),
  LEFT(m.content, 100),
  'normal',
  m.id,
  'message',
  '/mobile/messages',
  m.created_at
FROM team_messages m
JOIN direct_conversations c ON c.id = m.conversation_id
LEFT JOIN team_directory td ON td.user_id = m.sender_id
WHERE m.created_at > NOW() - INTERVAL '30 days'
  AND m.is_deleted = false
ON CONFLICT DO NOTHING;

-- Backfill notifications from job schedule assignments (last 30 days)
INSERT INTO team_member_notifications (member_id, type, title, message, priority, reference_id, reference_type, action_url, created_at)
SELECT 
  (assigned_user->>'id')::uuid as member_id,
  'schedule_assigned',
  'Schedule: ' || COALESCE(js.job_name, 'New Job'),
  'You have been assigned to ' || COALESCE(js.job_name, 'a new job'),
  'high',
  js.id,
  'schedule',
  '/mobile/schedule',
  js.created_at
FROM job_schedules js,
LATERAL jsonb_array_elements(js.assigned_users) as assigned_user
WHERE js.created_at > NOW() - INTERVAL '30 days'
  AND js.assigned_users IS NOT NULL
  AND jsonb_array_length(js.assigned_users) > 0
  AND (assigned_user->>'id') IS NOT NULL
ON CONFLICT DO NOTHING;

-- Backfill notifications from task assignments (last 30 days)
INSERT INTO team_member_notifications (member_id, type, title, message, priority, reference_id, reference_type, action_url, created_at)
SELECT 
  pt.assigned_to as member_id,
  'task_assigned',
  'Task: ' || COALESCE(pt.title, 'New Task'),
  'You have been assigned a new task',
  'high',
  pt.id,
  'task',
  '/mobile/tasks',
  COALESCE(pt.assigned_at, pt.created_at)
FROM project_tasks pt
WHERE pt.assigned_to IS NOT NULL
  AND COALESCE(pt.assigned_at, pt.created_at) > NOW() - INTERVAL '30 days'
ON CONFLICT DO NOTHING;

-- Backfill notifications from team chat messages (last 30 days)
INSERT INTO team_member_notifications (member_id, type, title, message, priority, reference_id, reference_type, action_url, created_at)
SELECT DISTINCT
  pta.user_id as member_id,
  'message',
  'Chat in ' || COALESCE(tc.channel_name, 'Channel'),
  LEFT(tc.message, 100),
  'normal',
  tc.id,
  'chat',
  '/mobile/chat/' || tc.channel_name,
  tc.created_at
FROM team_chats tc
JOIN project_team_assignments pta ON pta.project_id::text = REPLACE(tc.channel_name, 'project-', '')
WHERE tc.created_at > NOW() - INTERVAL '30 days'
  AND tc.sender_user_id IS NOT NULL
  AND tc.sender_user_id != pta.user_id
  AND pta.user_id IS NOT NULL
ON CONFLICT DO NOTHING;