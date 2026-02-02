-- Create app_settings table for storing analytics configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for app_settings
CREATE POLICY "Admins can manage app settings" 
ON public.app_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default analytics settings
INSERT INTO public.app_settings (key, value, description) 
VALUES (
  'analytics_config',
  '{"analytics_shared_site": "", "analytics_shared_token": ""}'::jsonb,
  'Lovable Analytics shared stats configuration'
) ON CONFLICT (key) DO NOTHING;