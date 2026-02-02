-- Create table for material templates
CREATE TABLE IF NOT EXISTS material_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE material_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage templates
CREATE POLICY "Admins can manage material templates"
ON material_templates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Service role can manage templates
CREATE POLICY "Service role can manage material templates"
ON material_templates
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_material_templates_updated_at
  BEFORE UPDATE ON material_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();