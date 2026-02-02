-- Create mug_requests table to track customer mug gift requests
CREATE TABLE public.mug_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  reviews_attempted JSONB DEFAULT '{"google": false, "yelp": false}'::jsonb,
  mug_decision TEXT CHECK (mug_decision IN ('accepted', 'declined')),
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fulfillment_status TEXT NOT NULL DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'shipped', 'delivered')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mug_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for mug_requests
CREATE POLICY "Admins can manage all mug requests" 
ON public.mug_requests 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
));

CREATE POLICY "Customers can view their own mug requests" 
ON public.mug_requests 
FOR SELECT 
USING (customer_email = auth.email());

CREATE POLICY "Customers can create mug requests for their projects" 
ON public.mug_requests 
FOR INSERT 
WITH CHECK (
  customer_email = auth.email() AND 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = mug_requests.project_id 
    AND projects.customer_email = auth.email()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mug_requests_updated_at
  BEFORE UPDATE ON public.mug_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();