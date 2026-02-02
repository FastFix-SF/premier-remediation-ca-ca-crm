-- Enable RLS on rf_roles table and add public read policy
ALTER TABLE public.rf_roles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read role definitions
CREATE POLICY "roles_are_public" ON public.rf_roles
FOR SELECT USING (true);