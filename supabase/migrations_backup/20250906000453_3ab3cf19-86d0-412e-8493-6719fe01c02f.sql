-- Add ConnectTeam job linking columns to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS connectteam_job_code_raw text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS connectteam_job_code_norm text;  
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS connectteam_job_id text;

-- Create index on normalized job code for fast lookups
CREATE INDEX IF NOT EXISTS idx_projects_connectteam_job_code_norm ON public.projects(connectteam_job_code_norm);

-- Create work_activities table for project-specific labor tracking
CREATE TABLE IF NOT EXISTS public.work_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_mapping_id uuid REFERENCES public.employee_mapping(id),
  connectteam_timecard_id text UNIQUE,
  employee_name text NOT NULL,
  employee_role text,
  work_date date NOT NULL,
  clock_in timestamp with time zone NOT NULL,
  clock_out timestamp with time zone,
  regular_hours numeric DEFAULT 0,
  overtime_hours numeric DEFAULT 0,
  total_hours numeric DEFAULT 0,
  hourly_rate numeric DEFAULT 25.0,
  overtime_rate numeric DEFAULT 37.5,
  total_cost numeric DEFAULT 0,
  status text DEFAULT 'completed',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on work_activities
ALTER TABLE public.work_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for work_activities
CREATE POLICY "Admins can manage work activities" 
ON public.work_activities 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Team members can view work activities" 
ON public.work_activities 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.team_directory 
  WHERE user_id = auth.uid() AND status = 'active'
));

-- Add trigger for updating timestamps
CREATE TRIGGER update_work_activities_updated_at
  BEFORE UPDATE ON public.work_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();