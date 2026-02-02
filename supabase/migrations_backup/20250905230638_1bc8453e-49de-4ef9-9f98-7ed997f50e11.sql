-- Add new columns to projects table for profitability tracking
ALTER TABLE public.projects 
ADD COLUMN external_ref text,
ADD COLUMN cf_project_id text,
ADD COLUMN budget_labor numeric DEFAULT 0,
ADD COLUMN budget_materials numeric DEFAULT 0,
ADD COLUMN target_gp_percentage numeric DEFAULT 20.0;

-- Create employee_pay_rates table
CREATE TABLE public.employee_pay_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_mapping_id uuid NOT NULL,
  hourly_rate numeric NOT NULL,
  overtime_multiplier numeric DEFAULT 1.5,
  effective_from date NOT NULL,
  effective_to date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create project_materials table
CREATE TABLE public.project_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  date date NOT NULL,
  vendor text NOT NULL,
  item_code text,
  item_description text NOT NULL,
  quantity numeric DEFAULT 1,
  unit text DEFAULT 'each',
  unit_price numeric NOT NULL,
  tax_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  source text NOT NULL DEFAULT 'manual', -- 'cf', 'upload', 'manual'
  external_id text,
  file_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create project_daily_reports table
CREATE TABLE public.project_daily_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  report_date date NOT NULL,
  crew_count integer DEFAULT 0,
  hours_total numeric DEFAULT 0,
  summary text,
  weather jsonb DEFAULT '{}',
  photos jsonb DEFAULT '[]',
  materials_used jsonb DEFAULT '[]',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id, report_date)
);

-- Create project_incidents table
CREATE TABLE public.project_incidents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  incident_date date NOT NULL,
  incident_type text NOT NULL, -- 'safety', 'quality', 'weather', 'equipment', 'other'
  severity text NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  description text NOT NULL,
  photos jsonb DEFAULT '[]',
  resolved boolean DEFAULT false,
  follow_up text,
  reported_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create project_rating table
CREATE TABLE public.project_rating (
  project_id uuid NOT NULL PRIMARY KEY,
  rating text NOT NULL, -- 'excellent', 'acceptable', 'mediocre', 'poor'
  notes text,
  ai_suggested_rating text,
  ai_suggestion_reason text,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create project_revenue table
CREATE TABLE public.project_revenue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  revenue_type text NOT NULL DEFAULT 'manual', -- 'cf', 'manual', 'contract'
  amount numeric NOT NULL,
  description text,
  external_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.employee_pay_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_rating ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_revenue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admins to manage all data
CREATE POLICY "Admins can manage employee pay rates" ON public.employee_pay_rates
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can manage project materials" ON public.project_materials
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can manage daily reports" ON public.project_daily_reports
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can manage incidents" ON public.project_incidents
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can manage ratings" ON public.project_rating
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can manage revenue" ON public.project_revenue
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  ));

-- Create function to calculate project labor costs
CREATE OR REPLACE FUNCTION public.calculate_project_labor_cost(
  p_project_id uuid,
  p_from_date date DEFAULT NULL,
  p_to_date date DEFAULT NULL
) RETURNS TABLE (
  total_labor_cost numeric,
  regular_hours numeric,
  overtime_hours numeric,
  total_hours numeric
) LANGUAGE plpgsql AS $$
DECLARE
  _from_date date := COALESCE(p_from_date, '1900-01-01');
  _to_date date := COALESCE(p_to_date, CURRENT_DATE);
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN wa.total_hours <= 40 THEN wa.total_hours * COALESCE(epr.hourly_rate, 25.0)
        ELSE 
          (40 * COALESCE(epr.hourly_rate, 25.0)) + 
          ((wa.total_hours - 40) * COALESCE(epr.hourly_rate, 25.0) * COALESCE(epr.overtime_multiplier, 1.5))
      END
    ), 0) as total_labor_cost,
    COALESCE(SUM(LEAST(wa.total_hours, 40)), 0) as regular_hours,
    COALESCE(SUM(GREATEST(wa.total_hours - 40, 0)), 0) as overtime_hours,
    COALESCE(SUM(wa.total_hours), 0) as total_hours
  FROM public.workforce_attendance wa
  JOIN public.employee_mapping em ON em.id = wa.employee_mapping_id
  LEFT JOIN public.employee_pay_rates epr ON epr.employee_mapping_id = em.id
    AND DATE(wa.work_date) >= epr.effective_from
    AND (epr.effective_to IS NULL OR DATE(wa.work_date) <= epr.effective_to)
  JOIN public.projects p ON p.external_ref = wa.connecteam_timecard_id::text -- This needs to be fixed based on actual mapping
  WHERE p.id = p_project_id
    AND DATE(wa.work_date) >= _from_date
    AND DATE(wa.work_date) <= _to_date;
END;
$$;

-- Create triggers for updated_at columns
CREATE TRIGGER update_employee_pay_rates_updated_at
  BEFORE UPDATE ON public.employee_pay_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_materials_updated_at
  BEFORE UPDATE ON public.project_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_daily_reports_updated_at
  BEFORE UPDATE ON public.project_daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_incidents_updated_at
  BEFORE UPDATE ON public.project_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();