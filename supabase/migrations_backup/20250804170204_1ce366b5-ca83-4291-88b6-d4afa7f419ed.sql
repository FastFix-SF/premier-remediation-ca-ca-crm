-- Create call_logs table for storing Bland AI call data
CREATE TABLE public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bland_call_id TEXT NOT NULL UNIQUE,
  recording_url TEXT,
  to_number TEXT NOT NULL,
  from_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_available BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin-only access
CREATE POLICY "Admins can view all call logs" 
ON public.call_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Admins can insert call logs" 
ON public.call_logs 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Admins can update call logs" 
ON public.call_logs 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Create indexes for performance
CREATE INDEX idx_call_logs_bland_call_id ON public.call_logs(bland_call_id);
CREATE INDEX idx_call_logs_created_at ON public.call_logs(created_at DESC);
CREATE INDEX idx_call_logs_synced_at ON public.call_logs(synced_at DESC);