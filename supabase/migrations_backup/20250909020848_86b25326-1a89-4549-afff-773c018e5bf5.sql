-- Create function to handle message pinning
CREATE OR REPLACE FUNCTION public.pin_message(message_id UUID, chat_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if message is already pinned
  IF EXISTS (
    SELECT 1 FROM pinned_messages 
    WHERE message_id = pin_message.message_id 
    AND chat_id = pin_message.chat_id
  ) THEN
    -- Unpin the message
    DELETE FROM pinned_messages 
    WHERE message_id = pin_message.message_id 
    AND chat_id = pin_message.chat_id;
  ELSE
    -- Pin the message
    INSERT INTO pinned_messages (message_id, chat_id, pinned_by, pinned_at)
    VALUES (pin_message.message_id, pin_message.chat_id, auth.uid(), NOW());
  END IF;
END;
$$;