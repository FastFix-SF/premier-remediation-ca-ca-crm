-- Create sms_conversations table for two-way SMS tracking
CREATE TABLE public.sms_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  from_phone TEXT NOT NULL,
  to_phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message TEXT NOT NULL,
  twilio_sid TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX idx_sms_conversations_lead_id ON public.sms_conversations(lead_id);
CREATE INDEX idx_sms_conversations_from_phone ON public.sms_conversations(from_phone);
CREATE INDEX idx_sms_conversations_to_phone ON public.sms_conversations(to_phone);
CREATE INDEX idx_sms_conversations_created_at ON public.sms_conversations(created_at DESC);

-- Enable RLS
ALTER TABLE public.sms_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage all SMS conversations
CREATE POLICY "Admins can manage SMS conversations"
ON public.sms_conversations
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- RLS Policy: Team members can view SMS conversations
CREATE POLICY "Team members can view SMS conversations"
ON public.sms_conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_directory
    WHERE team_directory.user_id = auth.uid()
    AND team_directory.status = 'active'
  )
);