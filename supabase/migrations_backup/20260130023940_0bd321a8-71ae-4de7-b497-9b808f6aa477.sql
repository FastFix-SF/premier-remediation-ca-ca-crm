-- =====================================================
-- PART 1: CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Trigger Function 1: Project Team Assignments
CREATE OR REPLACE FUNCTION public.notify_project_assignment()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  project_name TEXT;
BEGIN
  -- Only proceed if user_id is not null
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get project name
  SELECT name INTO project_name FROM projects WHERE id = NEW.project_id;
  
  -- Create notification for the assigned user
  INSERT INTO team_member_notifications (
    member_id, type, title, message, priority,
    reference_id, reference_type, action_url, is_read
  ) VALUES (
    NEW.user_id,
    'project_assigned',
    'Added to Project',
    'You have been added to: ' || COALESCE(project_name, 'a project'),
    'high',
    NEW.project_id,
    'project',
    '/mobile/projects/' || NEW.project_id,
    false
  );
  
  RETURN NEW;
END;
$$;

-- Trigger Function 2: Team Task Owner Assignments
CREATE OR REPLACE FUNCTION public.notify_task_owner_assignment()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Only trigger if owner_id changed and new owner exists
  IF NEW.owner_id IS NOT NULL AND 
     (OLD IS NULL OR OLD.owner_id IS DISTINCT FROM NEW.owner_id) THEN
    
    INSERT INTO team_member_notifications (
      member_id, type, title, message, priority,
      reference_id, reference_type, action_url, is_read
    ) VALUES (
      NEW.owner_id,
      'task_assigned',
      'Task: ' || COALESCE(NEW.title, 'New Task'),
      'You have been assigned a new task',
      'high',
      NEW.id,
      'task',
      '/mobile/tasks',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger Function 3: Direct Message Notifications
CREATE OR REPLACE FUNCTION public.notify_direct_message()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  conv RECORD;
BEGIN
  -- Get conversation details
  SELECT * INTO conv FROM direct_conversations WHERE id = NEW.conversation_id;
  
  IF conv IS NOT NULL THEN
    -- Determine the recipient (the other participant)
    IF conv.participant_one_id = NEW.sender_id THEN
      recipient_id := conv.participant_two_id;
    ELSE
      recipient_id := conv.participant_one_id;
    END IF;
    
    -- Only create notification if recipient exists
    IF recipient_id IS NOT NULL THEN
      -- Get sender name
      SELECT full_name INTO sender_name FROM team_directory WHERE user_id = NEW.sender_id;
      
      -- Create notification for recipient
      INSERT INTO team_member_notifications (
        member_id, type, title, message, priority,
        reference_id, reference_type, action_url, is_read
      ) VALUES (
        recipient_id,
        'message_received',
        'New Message from ' || COALESCE(sender_name, 'Someone'),
        LEFT(NEW.content, 100),
        'normal',
        NEW.conversation_id,
        'conversation',
        '/mobile/chat/' || NEW.conversation_id,
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- PART 2: CREATE TRIGGERS
-- =====================================================

-- Trigger 1: On project team assignment insert
DROP TRIGGER IF EXISTS on_project_team_assignment ON project_team_assignments;
CREATE TRIGGER on_project_team_assignment
  AFTER INSERT ON project_team_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_project_assignment();

-- Trigger 2: On team task owner assignment (insert or update)
DROP TRIGGER IF EXISTS on_task_owner_assignment ON team_tasks;
CREATE TRIGGER on_task_owner_assignment
  AFTER INSERT OR UPDATE OF owner_id ON team_tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_owner_assignment();

-- Trigger 3: On direct message insert
DROP TRIGGER IF EXISTS on_direct_message ON team_messages;
CREATE TRIGGER on_direct_message
  AFTER INSERT ON team_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_direct_message();

-- =====================================================
-- PART 3: BACKFILL HISTORICAL NOTIFICATIONS
-- =====================================================

-- Backfill project assignments (mark as read since historical)
INSERT INTO team_member_notifications (member_id, type, title, message, priority, reference_id, reference_type, action_url, is_read, created_at)
SELECT 
  pta.user_id,
  'project_assigned',
  'Added to Project',
  'You have been added to: ' || COALESCE(p.name, 'a project'),
  'normal',
  pta.project_id,
  'project',
  '/mobile/projects/' || pta.project_id,
  true,
  COALESCE(pta.assigned_at, NOW())
FROM project_team_assignments pta
JOIN projects p ON p.id = pta.project_id
WHERE pta.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Backfill task owner assignments (mark as read since historical)
INSERT INTO team_member_notifications (member_id, type, title, message, priority, reference_id, reference_type, action_url, is_read, created_at)
SELECT 
  owner_id,
  'task_assigned',
  'Task: ' || COALESCE(title, 'Task'),
  'You have been assigned a task',
  'normal',
  id,
  'task',
  '/mobile/tasks',
  true,
  created_at
FROM team_tasks
WHERE owner_id IS NOT NULL
ON CONFLICT DO NOTHING;