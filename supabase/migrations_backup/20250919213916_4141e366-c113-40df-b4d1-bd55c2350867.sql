-- Create employee_requests table to store all types of requests
CREATE TABLE public.employee_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('shift', 'break', 'time_off')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Shift request fields
  job_name TEXT,
  shift_start_date DATE,
  shift_end_date DATE,
  shift_start_time TIME,
  shift_end_time TIME,
  total_hours NUMERIC,
  include_mileage BOOLEAN DEFAULT false,
  
  -- Break request fields
  break_type TEXT,
  break_start_time TIMESTAMP WITH TIME ZONE,
  break_end_time TIMESTAMP WITH TIME ZONE,
  break_duration_minutes INTEGER,
  
  -- Time off request fields
  time_off_type TEXT,
  is_all_day BOOLEAN DEFAULT false,
  time_off_start_date DATE,
  time_off_end_date DATE,
  time_off_start_time TIME,
  time_off_end_time TIME,
  total_time_off_hours NUMERIC,
  
  -- Common fields
  notes TEXT,
  explanation TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employee_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for employee requests
CREATE POLICY "Users can view their own requests" 
ON public.employee_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests" 
ON public.employee_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests" 
ON public.employee_requests 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all employee requests" 
ON public.employee_requests 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employee_requests_updated_at
BEFORE UPDATE ON public.employee_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();