-- Add missing columns to call_logs table for comprehensive Bland AI sync
ALTER TABLE public.call_logs 
ADD COLUMN IF NOT EXISTS status text,
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS duration_min numeric,
ADD COLUMN IF NOT EXISTS summary text,
ADD COLUMN IF NOT EXISTS transcript text,
ADD COLUMN IF NOT EXISTS raw jsonb DEFAULT '{}'::jsonb;

-- Create unique constraint on bland_call_id (drop first if exists to avoid conflicts)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'call_logs_bland_call_id_unique'
  ) THEN
    ALTER TABLE public.call_logs 
    ADD CONSTRAINT call_logs_bland_call_id_unique UNIQUE (bland_call_id);
  END IF;
END $$;

-- Update RLS policies to ensure proper access for service role
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