-- Create labor burden configuration table
CREATE TABLE public.labor_burden_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workers_comp_rate NUMERIC NOT NULL DEFAULT 0.03,
  health_insurance_monthly NUMERIC NOT NULL DEFAULT 600,
  payroll_tax_rate NUMERIC NOT NULL DEFAULT 0.153,
  other_benefits_rate NUMERIC NOT NULL DEFAULT 0.02,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create overhead configuration table
CREATE TABLE public.overhead_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_staff_rate NUMERIC NOT NULL DEFAULT 15.00,
  liability_insurance_rate NUMERIC NOT NULL DEFAULT 0.005,
  equipment_rental_rate NUMERIC NOT NULL DEFAULT 8.00,
  facility_overhead_rate NUMERIC NOT NULL DEFAULT 5.00,
  allocation_method TEXT NOT NULL DEFAULT 'labor_hours',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project overhead allocation table
CREATE TABLE public.project_overhead_allocation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  allocation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  office_staff_cost NUMERIC NOT NULL DEFAULT 0,
  liability_insurance_cost NUMERIC NOT NULL DEFAULT 0,
  equipment_rental_cost NUMERIC NOT NULL DEFAULT 0,
  facility_overhead_cost NUMERIC NOT NULL DEFAULT 0,
  total_overhead_cost NUMERIC NOT NULL DEFAULT 0,
  labor_hours_base NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add labor burden fields to employee_pay_rates
ALTER TABLE public.employee_pay_rates
ADD COLUMN burden_multiplier NUMERIC DEFAULT 1.35,
ADD COLUMN overhead_allocation_rate NUMERIC DEFAULT 15.00;

-- Enable RLS
ALTER TABLE public.labor_burden_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overhead_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_overhead_allocation ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage labor burden config" 
ON public.labor_burden_config 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Admins can manage overhead config" 
ON public.overhead_config 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Admins can manage project overhead allocation" 
ON public.project_overhead_allocation 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Create triggers for updated_at
CREATE TRIGGER update_labor_burden_config_updated_at
  BEFORE UPDATE ON public.labor_burden_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_overhead_config_updated_at
  BEFORE UPDATE ON public.overhead_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_overhead_allocation_updated_at
  BEFORE UPDATE ON public.project_overhead_allocation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configurations
INSERT INTO public.labor_burden_config (
  workers_comp_rate,
  health_insurance_monthly,
  payroll_tax_rate,
  other_benefits_rate
) VALUES (0.03, 600, 0.153, 0.02);

INSERT INTO public.overhead_config (
  office_staff_rate,
  liability_insurance_rate,
  equipment_rental_rate,
  facility_overhead_rate,
  allocation_method
) VALUES (15.00, 0.005, 8.00, 5.00, 'labor_hours');