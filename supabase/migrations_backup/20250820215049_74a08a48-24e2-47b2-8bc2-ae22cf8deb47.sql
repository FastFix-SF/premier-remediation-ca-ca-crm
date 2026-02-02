-- Add missing columns to call_logs table for comprehensive Bland AI sync
ALTER TABLE public.call_logs 
ADD COLUMN IF NOT EXISTS status text,
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS duration_min numeric,
ADD COLUMN IF NOT EXISTS summary text,
ADD COLUMN IF NOT EXISTS transcript text,
ADD COLUMN IF NOT EXISTS raw jsonb DEFAULT '{}'::jsonb;

-- Create unique constraint on bland_call_id for proper upsert functionality
ALTER TABLE public.call_logs 
ADD CONSTRAINT IF NOT EXISTS call_logs_bland_call_id_unique UNIQUE (bland_call_id);

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Service role can insert call logs" ON public.call_logs;
CREATE POLICY "Service role can insert call logs" 
ON public.call_logs 
FOR INSERT 
TO service_role 
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update call logs" ON public.call_logs;
CREATE POLICY "Service role can update call logs" 
ON public.call_logs 
FOR UPDATE 
TO service_role 
USING (true);