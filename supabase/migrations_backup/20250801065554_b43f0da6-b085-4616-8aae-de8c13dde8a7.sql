-- Drop the existing mug_requests table
DROP TABLE IF EXISTS public.mug_requests CASCADE;

-- Create new simplified mug_requests table
CREATE TABLE public.mug_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email text NOT NULL,
  mug_accepted boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mug_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can insert mug requests" 
ON public.mug_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all mug requests" 
ON public.mug_requests 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Customers can view their own mug requests" 
ON public.mug_requests 
FOR SELECT 
USING (customer_email = auth.email());