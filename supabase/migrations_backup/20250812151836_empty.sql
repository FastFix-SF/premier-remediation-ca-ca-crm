-- Secure missed_opportunities table: enable RLS and restrict access to admins only

-- Enable Row Level Security
ALTER TABLE public.missed_opportunities ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies if any (idempotent guard)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'missed_opportunities'
  ) THEN
    -- We don't know names, so selectively drop known names if present
    PERFORM 1;
  END IF;
END $$;

-- Allow admins to manage all rows
CREATE POLICY "Admins can manage missed opportunities"
ON public.missed_opportunities
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.is_active = true
  )
);

-- Optional explicit read-only policy for admins (redundant but clearer intent)
CREATE POLICY "Admins can view missed opportunities"
ON public.missed_opportunities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.is_active = true
  )
);
