-- Create workforce_attendance table as requested by user
CREATE TABLE IF NOT EXISTS public.workforce_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_mapping_id UUID REFERENCES public.employee_mapping(id),
  connecteam_timecard_id TEXT UNIQUE,
  employee_name TEXT NOT NULL,
  employee_role TEXT,
  project TEXT,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  location_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  work_date DATE NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workforce_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for workforce_attendance
CREATE POLICY "Admins can manage workforce attendance" 
ON public.workforce_attendance 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Team members can view workforce attendance" 
ON public.workforce_attendance 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM team_directory 
  WHERE user_id = auth.uid() AND status = 'active'
));

-- Add trigger for timestamps
CREATE TRIGGER update_workforce_attendance_updated_at
BEFORE UPDATE ON public.workforce_attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();