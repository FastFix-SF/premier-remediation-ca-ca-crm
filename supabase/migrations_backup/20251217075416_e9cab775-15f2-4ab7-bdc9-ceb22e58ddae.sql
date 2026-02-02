-- Create table for agent conversations
CREATE TABLE public.agent_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  title TEXT,
  last_message TEXT,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for agent conversation messages
CREATE TABLE public.agent_conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  agent_type TEXT,
  confidence INTEGER,
  structured_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_conversation_messages ENABLE ROW LEVEL SECURITY;

-- Policies for agent_conversations
CREATE POLICY "Users can view their own agent conversations" 
ON public.agent_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent conversations" 
ON public.agent_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent conversations" 
ON public.agent_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent conversations" 
ON public.agent_conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for agent_conversation_messages
CREATE POLICY "Users can view messages in their conversations" 
ON public.agent_conversation_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.agent_conversations 
  WHERE id = conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their conversations" 
ON public.agent_conversation_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.agent_conversations 
  WHERE id = conversation_id AND user_id = auth.uid()
));

-- Create indexes
CREATE INDEX idx_agent_conversations_user_id ON public.agent_conversations(user_id);
CREATE INDEX idx_agent_conversations_updated_at ON public.agent_conversations(updated_at DESC);
CREATE INDEX idx_agent_conversation_messages_conversation_id ON public.agent_conversation_messages(conversation_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_agent_conversations_updated_at
BEFORE UPDATE ON public.agent_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();