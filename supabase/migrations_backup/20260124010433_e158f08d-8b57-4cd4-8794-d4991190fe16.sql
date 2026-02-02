-- Create function to notify task collaborators when added
CREATE OR REPLACE FUNCTION public.notify_task_collaborator()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  new_collaborator_id UUID;
  old_collaborator_ids UUID[];
  new_collaborator_ids UUID[];
  task_title TEXT;
  task_owner_name TEXT;
BEGIN
  -- Get old and new collaborator arrays
  old_collaborator_ids := COALESCE(OLD.collaborator_ids, ARRAY[]::UUID[]);
  new_collaborator_ids := COALESCE(NEW.collaborator_ids, ARRAY[]::UUID[]);
  
  -- Get task details
  task_title := NEW.title;
  
  -- Get owner name
  SELECT full_name INTO task_owner_name
  FROM team_directory
  WHERE user_id = NEW.owner_id
  LIMIT 1;
  
  -- Find new collaborators (in new but not in old)
  FOREACH new_collaborator_id IN ARRAY new_collaborator_ids
  LOOP
    IF NOT (new_collaborator_id = ANY(old_collaborator_ids)) THEN
      -- This is a newly added collaborator, create notification
      INSERT INTO team_member_notifications (
        member_id,
        type,
        title,
        message,
        priority,
        reference_id,
        reference_type,
        action_url,
        is_read
      ) VALUES (
        new_collaborator_id,
        'task_collaborator',
        'Added as collaborator',
        COALESCE(task_owner_name, 'Someone') || ' added you as collaborator on: ' || COALESCE(task_title, 'a task'),
        'normal',
        NEW.id,
        'task',
        '/mobile/tasks',
        false
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for collaborator notifications
DROP TRIGGER IF EXISTS on_collaborator_added ON team_tasks;
CREATE TRIGGER on_collaborator_added
  AFTER UPDATE ON team_tasks
  FOR EACH ROW
  WHEN (OLD.collaborator_ids IS DISTINCT FROM NEW.collaborator_ids)
  EXECUTE FUNCTION notify_task_collaborator();

-- Create function to notify on request status change
CREATE OR REPLACE FUNCTION public.notify_request_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  requester_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only trigger when status changes from pending to approved/denied
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'denied') THEN
    -- Get requester name
    SELECT full_name INTO requester_name
    FROM team_directory
    WHERE user_id = NEW.user_id
    LIMIT 1;
    
    -- Build notification content
    IF NEW.status = 'approved' THEN
      notification_title := 'Request Approved ✓';
      notification_message := 'Your ' || COALESCE(NEW.request_type, 'request') || ' request has been approved.';
    ELSE
      notification_title := 'Request Denied';
      notification_message := 'Your ' || COALESCE(NEW.request_type, 'request') || ' request was denied.' || 
        CASE WHEN NEW.admin_notes IS NOT NULL THEN ' Reason: ' || NEW.admin_notes ELSE '' END;
    END IF;
    
    -- Create notification for the requester
    INSERT INTO team_member_notifications (
      member_id,
      type,
      title,
      message,
      priority,
      reference_id,
      reference_type,
      action_url,
      is_read
    ) VALUES (
      NEW.user_id,
      'request_status',
      notification_title,
      notification_message,
      CASE WHEN NEW.status = 'denied' THEN 'high' ELSE 'normal' END,
      NEW.id,
      'request',
      '/mobile/requests',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for request status notifications
DROP TRIGGER IF EXISTS on_request_status_change ON employee_requests;
CREATE TRIGGER on_request_status_change
  AFTER UPDATE ON employee_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_request_status_change();

-- Create database webhook trigger for chat mentions (calls edge function)
CREATE OR REPLACE FUNCTION public.trigger_chat_mention_webhook()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Only process messages that contain @ mentions
  IF NEW.message LIKE '%@%' THEN
    -- Use pg_net to call the edge function
    PERFORM net.http_post(
      url := 'https://mnitzgoythqqevhtkitj.supabase.co/functions/v1/process-chat-mentions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', NEW.id,
          'message', NEW.message,
          'sender_user_id', NEW.sender_user_id,
          'sender', NEW.sender,
          'channel_name', NEW.channel_name
        )
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to trigger mention webhook: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for chat mentions
DROP TRIGGER IF EXISTS on_chat_message_insert ON team_chats;
CREATE TRIGGER on_chat_message_insert
  AFTER INSERT ON team_chats
  FOR EACH ROW
  EXECUTE FUNCTION trigger_chat_mention_webhook();