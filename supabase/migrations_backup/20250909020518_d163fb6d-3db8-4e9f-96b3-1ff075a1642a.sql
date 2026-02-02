-- Create message_threads table for threaded conversations
CREATE TABLE public.message_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_message_id UUID NOT NULL,
  sender TEXT NOT NULL,
  sender_user_id UUID,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  channel_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pinned_messages table for pinning important messages
CREATE TABLE public.pinned_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  channel_id TEXT NOT NULL,
  pinned_by UUID,
  pinned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id) -- Each message can only be pinned once
);

-- Enable Row Level Security
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for message_threads
CREATE POLICY "Team members can view message threads" 
ON public.message_threads 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM team_directory 
    WHERE user_id = auth.uid() AND status = 'active'
  ) OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Team members can create message threads" 
ON public.message_threads 
FOR INSERT 
WITH CHECK (
  sender_user_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM team_directory 
      WHERE user_id = auth.uid() AND status = 'active'
    ) OR 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- Create policies for pinned_messages
CREATE POLICY "Team members can view pinned messages" 
ON public.pinned_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM team_directory 
    WHERE user_id = auth.uid() AND status = 'active'
  ) OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Team members can pin messages" 
ON public.pinned_messages 
FOR INSERT 
WITH CHECK (
  pinned_by = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM team_directory 
      WHERE user_id = auth.uid() AND status = 'active'
    ) OR 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

CREATE POLICY "Team members can unpin messages" 
ON public.pinned_messages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM team_directory 
    WHERE user_id = auth.uid() AND status = 'active'
  ) OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Add indexes for better performance
CREATE INDEX idx_message_threads_parent_id ON public.message_threads(parent_message_id);
CREATE INDEX idx_message_threads_channel_id ON public.message_threads(channel_id);
CREATE INDEX idx_pinned_messages_channel_id ON public.pinned_messages(channel_id);
CREATE INDEX idx_pinned_messages_message_id ON public.pinned_messages(message_id);