-- Create safety_checklist_responses table
CREATE TABLE public.safety_checklist_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  time_clock_id UUID REFERENCES public.time_clock(id) ON DELETE CASCADE,
  hard_hat BOOLEAN NOT NULL DEFAULT false,
  steel_cap_boots BOOLEAN NOT NULL DEFAULT false,
  safety_vest BOOLEAN NOT NULL DEFAULT false,
  protective_glasses BOOLEAN NOT NULL DEFAULT false,
  additional_items TEXT,
  selfie_url TEXT,
  signature_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.safety_checklist_responses ENABLE ROW LEVEL SECURITY;

-- Users can view their own responses
CREATE POLICY "Users can view their own safety checklist responses"
ON public.safety_checklist_responses
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can insert their own safety checklist responses"
ON public.safety_checklist_responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all responses
CREATE POLICY "Admins can view all safety checklist responses"
ON public.safety_checklist_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Create index for faster queries
CREATE INDEX idx_safety_checklist_responses_user_id ON public.safety_checklist_responses(user_id);
CREATE INDEX idx_safety_checklist_responses_time_clock_id ON public.safety_checklist_responses(time_clock_id);
CREATE INDEX idx_safety_checklist_responses_created_at ON public.safety_checklist_responses(created_at DESC);