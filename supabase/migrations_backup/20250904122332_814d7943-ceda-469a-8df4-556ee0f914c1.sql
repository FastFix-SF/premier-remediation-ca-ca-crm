-- Create ConnectTeam workforce integration tables

-- Store ConnectTeam API configuration
CREATE TABLE public.connecteam_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_endpoint TEXT NOT NULL DEFAULT 'https://api.connecteam.com/v1',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT NOT NULL DEFAULT 'idle',
  sync_errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Employee mapping between ConnectTeam and our team directory
CREATE TABLE public.employee_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connecteam_employee_id TEXT NOT NULL,
  team_directory_user_id UUID,
  email TEXT NOT NULL,
  connecteam_name TEXT,
  sync_status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(connecteam_employee_id),
  UNIQUE(email)
);

-- Workforce attendance records from ConnectTeam
CREATE TABLE public.workforce_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_mapping_id UUID NOT NULL REFERENCES employee_mapping(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  connecteam_timecard_id TEXT,
  employee_name TEXT NOT NULL,
  employee_role TEXT,
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC(5,2),
  break_duration_minutes INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'clocked_out', -- clocked_in, clocked_out, late, on_time
  work_date DATE NOT NULL,
  location_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sync_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workforce scheduling data from ConnectTeam
CREATE TABLE public.workforce_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_mapping_id UUID NOT NULL REFERENCES employee_mapping(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  connecteam_schedule_id TEXT,
  employee_name TEXT NOT NULL,
  employee_role TEXT,
  shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_end TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_hours NUMERIC(5,2),
  assigned_date DATE NOT NULL,
  shift_title TEXT,
  shift_description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, confirmed, cancelled, completed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sync_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workforce messages and announcements from ConnectTeam
CREATE TABLE public.workforce_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connecteam_message_id TEXT,
  author_employee_id TEXT,
  author_name TEXT NOT NULL,
  author_role TEXT,
  message_text TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'announcement', -- announcement, chat, alert, system
  channel_name TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  is_important BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sync_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(connecteam_message_id)
);

-- Enable Row Level Security
ALTER TABLE public.connecteam_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ConnectTeam config (Admin only)
CREATE POLICY "Admins can manage ConnectTeam config"
ON public.connecteam_config
FOR ALL
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- RLS Policies for employee mapping (Admin only)
CREATE POLICY "Admins can manage employee mapping"
ON public.employee_mapping
FOR ALL
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- RLS Policies for workforce attendance
CREATE POLICY "Admins can view all attendance"
ON public.workforce_attendance
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Team members can view their own attendance"
ON public.workforce_attendance
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM employee_mapping em
  JOIN team_directory td ON td.user_id = auth.uid()
  WHERE em.id = workforce_attendance.employee_mapping_id 
  AND em.email = td.email
));

-- RLS Policies for workforce schedules
CREATE POLICY "Admins can view all schedules"
ON public.workforce_schedules
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Team members can view their own schedules"
ON public.workforce_schedules
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM employee_mapping em
  JOIN team_directory td ON td.user_id = auth.uid()
  WHERE em.id = workforce_schedules.employee_mapping_id 
  AND em.email = td.email
));

-- RLS Policies for workforce messages (all team members can view)
CREATE POLICY "Team members can view workforce messages"
ON public.workforce_messages
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM team_directory 
  WHERE user_id = auth.uid() AND status = 'active'
) OR EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Create indexes for performance
CREATE INDEX idx_workforce_attendance_employee ON workforce_attendance(employee_mapping_id);
CREATE INDEX idx_workforce_attendance_date ON workforce_attendance(work_date);
CREATE INDEX idx_workforce_attendance_project ON workforce_attendance(project_id);

CREATE INDEX idx_workforce_schedules_employee ON workforce_schedules(employee_mapping_id);
CREATE INDEX idx_workforce_schedules_date ON workforce_schedules(assigned_date);
CREATE INDEX idx_workforce_schedules_project ON workforce_schedules(project_id);

CREATE INDEX idx_workforce_messages_timestamp ON workforce_messages(timestamp DESC);
CREATE INDEX idx_workforce_messages_type ON workforce_messages(message_type);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_connecteam_config_updated_at
  BEFORE UPDATE ON public.connecteam_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_mapping_updated_at
  BEFORE UPDATE ON public.employee_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workforce_attendance_updated_at
  BEFORE UPDATE ON public.workforce_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workforce_schedules_updated_at
  BEFORE UPDATE ON public.workforce_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();