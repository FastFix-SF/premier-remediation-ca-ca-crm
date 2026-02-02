-- Create team_chats table for ConnectTeam chat data
CREATE TABLE public.team_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  team_id TEXT,
  connecteam_chat_id TEXT UNIQUE,
  sender_employee_id TEXT,
  channel_name TEXT,
  message_type TEXT DEFAULT 'chat',
  is_important BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_schedules table for ConnectTeam job scheduling
CREATE TABLE public.job_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  assigned_users JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  connecteam_job_id TEXT UNIQUE,
  project_id UUID,
  location TEXT,
  description TEXT,
  priority TEXT DEFAULT 'normal',
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create time_clock table for ConnectTeam time tracking
CREATE TABLE public.time_clock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC,
  job_id UUID,
  connecteam_timecard_id TEXT UNIQUE,
  employee_name TEXT NOT NULL,
  employee_role TEXT,
  project_name TEXT,
  location TEXT,
  break_time_minutes INTEGER DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_workforce_insights table for tracking AI analysis
CREATE TABLE public.ai_workforce_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_amount NUMERIC,
  impact_type TEXT, -- 'cost_increase', 'time_delay', 'efficiency_loss'
  confidence_score NUMERIC DEFAULT 0.8,
  data_sources JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analysis_period_start TIMESTAMP WITH TIME ZONE,
  analysis_period_end TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.team_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_clock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workforce_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team_chats
CREATE POLICY "Admins can manage all team chats" 
ON public.team_chats 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Team members can view team chats" 
ON public.team_chats 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM team_directory 
  WHERE user_id = auth.uid() AND status = 'active'
));

-- Create RLS policies for job_schedules
CREATE POLICY "Admins can manage all job schedules" 
ON public.job_schedules 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Team members can view job schedules" 
ON public.job_schedules 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM team_directory 
  WHERE user_id = auth.uid() AND status = 'active'
));

-- Create RLS policies for time_clock
CREATE POLICY "Admins can manage all time clock entries" 
ON public.time_clock 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Team members can view their own time entries" 
ON public.time_clock 
FOR SELECT 
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM team_directory 
  WHERE user_id = auth.uid() AND status = 'active'
));

-- Create RLS policies for ai_workforce_insights
CREATE POLICY "Admins can manage AI workforce insights" 
ON public.ai_workforce_insights 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Create indexes for better performance
CREATE INDEX idx_team_chats_timestamp ON public.team_chats(timestamp DESC);
CREATE INDEX idx_team_chats_sender ON public.team_chats(sender);
CREATE INDEX idx_team_chats_connecteam_id ON public.team_chats(connecteam_chat_id);

CREATE INDEX idx_job_schedules_start_time ON public.job_schedules(start_time);
CREATE INDEX idx_job_schedules_status ON public.job_schedules(status);
CREATE INDEX idx_job_schedules_project_id ON public.job_schedules(project_id);

CREATE INDEX idx_time_clock_user_id ON public.time_clock(user_id);
CREATE INDEX idx_time_clock_clock_in ON public.time_clock(clock_in DESC);
CREATE INDEX idx_time_clock_job_id ON public.time_clock(job_id);

CREATE INDEX idx_ai_insights_created_at ON public.ai_workforce_insights(created_at DESC);
CREATE INDEX idx_ai_insights_type ON public.ai_workforce_insights(insight_type);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_job_schedules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_time_clock_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_job_schedules_updated_at
  BEFORE UPDATE ON public.job_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_schedules_timestamp();

CREATE TRIGGER update_time_clock_updated_at
  BEFORE UPDATE ON public.time_clock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_time_clock_timestamp();