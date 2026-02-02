-- Create failed requests table for tracking what Fasto couldn't do
CREATE TABLE IF NOT EXISTS public.fasto_failed_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    request_text TEXT NOT NULL,
    agent_response TEXT,
    failure_reason TEXT,
    tool_attempted TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fasto_failed_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own failed requests
CREATE POLICY "Users can insert own failed requests"
ON public.fasto_failed_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all failed requests
CREATE POLICY "Admins can view all failed requests"
ON public.fasto_failed_requests
FOR SELECT
USING (public.is_admin());

-- Create index for efficient querying
CREATE INDEX idx_fasto_failed_requests_created_at ON public.fasto_failed_requests(created_at DESC);
CREATE INDEX idx_fasto_failed_requests_category ON public.fasto_failed_requests(category);