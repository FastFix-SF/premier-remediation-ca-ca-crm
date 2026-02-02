-- Add columns for enhanced lead tracking
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS mrf_prospect_id TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS qualification_data JSONB DEFAULT '{}'::jsonb;

-- Create visitor sessions table for tracking
CREATE TABLE IF NOT EXISTS public.visitor_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mrf_prospect_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  page_views INTEGER DEFAULT 1,
  total_time_seconds INTEGER DEFAULT 0,
  session_data JSONB DEFAULT '{}'::jsonb,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chat conversations table for message history
CREATE TABLE IF NOT EXISTS public.chat_conversations_mrf (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mrf_prospect_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  interest_score INTEGER DEFAULT 0,
  qualification_data JSONB DEFAULT '{}'::jsonb,
  lead_id UUID REFERENCES public.leads(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations_mrf ENABLE ROW LEVEL SECURITY;

-- Create policies for visitor sessions (admin access only)
CREATE POLICY "Admins can view all visitor sessions"
  ON public.visitor_sessions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "System can insert visitor sessions"
  ON public.visitor_sessions FOR INSERT 
  WITH CHECK (true);

-- Create policies for chat conversations (admin access only)
CREATE POLICY "Admins can view all chat conversations"
  ON public.chat_conversations_mrf FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "System can insert chat conversations"
  ON public.chat_conversations_mrf FOR INSERT 
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_mrf_prospect_id ON public.visitor_sessions(mrf_prospect_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_mrf_prospect_id ON public.chat_conversations_mrf(mrf_prospect_id);
CREATE INDEX IF NOT EXISTS idx_leads_mrf_prospect_id ON public.leads(mrf_prospect_id);

-- Create trigger for updating visitor sessions updated_at
CREATE TRIGGER update_visitor_sessions_updated_at
  BEFORE UPDATE ON public.visitor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();