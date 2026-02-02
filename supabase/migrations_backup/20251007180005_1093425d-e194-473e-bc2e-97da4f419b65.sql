-- Add material_items column to quote_requests for storing materials and pricing
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS material_items jsonb DEFAULT '[]'::jsonb;

-- Add edges column to quote_requests for storing edge categories
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS edges jsonb DEFAULT '[]'::jsonb;

-- Add pins column to quote_requests for storing map pins/markers
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS pins jsonb DEFAULT '[]'::jsonb;

-- Create quote_settings table for default settings
CREATE TABLE IF NOT EXISTS quote_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_waste_pct numeric DEFAULT 10,
  default_markup_pct numeric DEFAULT 15,
  labor_rate_per_sq numeric DEFAULT 350,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on quote_settings
ALTER TABLE quote_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage settings
CREATE POLICY "Admins can manage quote settings"
  ON quote_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_active = true
    )
  );

-- Insert default settings record
INSERT INTO quote_settings (default_waste_pct, default_markup_pct, labor_rate_per_sq)
VALUES (10, 15, 350)
ON CONFLICT DO NOTHING;