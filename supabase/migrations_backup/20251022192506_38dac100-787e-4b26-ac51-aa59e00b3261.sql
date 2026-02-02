-- Create direct conversations table for 1-on-1 chats between team members
CREATE TABLE public.direct_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_two_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_message_at timestamp with time zone,
  UNIQUE (participant_one_id, participant_two_id),
  CHECK (participant_one_id < participant_two_id) -- Ensure consistent ordering
);

-- Create team messages table
CREATE TABLE public.team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone
);

-- Create read receipts tracking
CREATE TABLE public.message_read_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_message_id uuid REFERENCES public.team_messages(id) ON DELETE SET NULL,
  last_read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for direct_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.direct_conversations FOR SELECT
  USING (
    auth.uid() = participant_one_id OR auth.uid() = participant_two_id
  );

CREATE POLICY "Active team members can create conversations"
  ON public.direct_conversations FOR INSERT
  WITH CHECK (
    (auth.uid() = participant_one_id OR auth.uid() = participant_two_id) AND
    EXISTS (
      SELECT 1 FROM public.team_directory
      WHERE team_directory.user_id = auth.uid()
      AND team_directory.status = 'active'
    )
  );

-- RLS Policies for team_messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.team_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.direct_conversations
      WHERE direct_conversations.id = team_messages.conversation_id
      AND (direct_conversations.participant_one_id = auth.uid() 
           OR direct_conversations.participant_two_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON public.team_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.direct_conversations
      WHERE direct_conversations.id = team_messages.conversation_id
      AND (direct_conversations.participant_one_id = auth.uid() 
           OR direct_conversations.participant_two_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.team_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- RLS Policies for message_read_status
CREATE POLICY "Users can view their own read status"
  ON public.message_read_status FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own read status"
  ON public.message_read_status FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own read status"
  ON public.message_read_status FOR UPDATE
  USING (user_id = auth.uid());

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION public.update_direct_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.direct_conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Trigger to update conversation on new message
CREATE TRIGGER update_direct_conversation_on_message
  AFTER INSERT ON public.team_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_direct_conversation_timestamp();

-- Function to get or create a conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  user1_id uuid,
  user2_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conversation_id uuid;
  smaller_id uuid;
  larger_id uuid;
BEGIN
  -- Ensure consistent ordering
  IF user1_id < user2_id THEN
    smaller_id := user1_id;
    larger_id := user2_id;
  ELSE
    smaller_id := user2_id;
    larger_id := user1_id;
  END IF;

  -- Check if conversation exists
  SELECT id INTO conversation_id
  FROM public.direct_conversations
  WHERE participant_one_id = smaller_id 
    AND participant_two_id = larger_id;

  -- Create if it doesn't exist
  IF conversation_id IS NULL THEN
    INSERT INTO public.direct_conversations (participant_one_id, participant_two_id)
    VALUES (smaller_id, larger_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;

-- Create indexes
CREATE INDEX idx_direct_conversations_participant_one ON public.direct_conversations(participant_one_id);
CREATE INDEX idx_direct_conversations_participant_two ON public.direct_conversations(participant_two_id);
CREATE INDEX idx_team_messages_conversation ON public.team_messages(conversation_id);
CREATE INDEX idx_team_messages_sender ON public.team_messages(sender_id);
CREATE INDEX idx_team_messages_created_at ON public.team_messages(created_at DESC);
CREATE INDEX idx_message_read_status_conversation ON public.message_read_status(conversation_id);
CREATE INDEX idx_message_read_status_user ON public.message_read_status(user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_read_status;