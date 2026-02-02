-- Create edge categories table to store edge type definitions
CREATE TABLE IF NOT EXISTS public.edge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  hotkey TEXT,
  group_name TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.edge_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view edge categories
CREATE POLICY "Anyone can view edge categories"
  ON public.edge_categories
  FOR SELECT
  USING (is_active = true);

-- Admins can manage edge categories
CREATE POLICY "Admins can manage edge categories"
  ON public.edge_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Insert default edge categories
INSERT INTO public.edge_categories (key, label, color, hotkey, group_name, display_order) VALUES
  ('unlabeled', 'UNLABELED', '#FCD34D', '0', 'Special', 0),
  ('eave', 'EAVE', '#EF4444', '1', 'Edges', 1),
  ('rake', 'RAKE', '#9CA3AF', '2', 'Edges', 2),
  ('ridge', 'RIDGE', '#A855F7', '3', 'Edges', 3),
  ('hip', 'HIP', '#92400E', '4', 'Edges', 4),
  ('valley', 'VALLEY', '#EC4899', '5', 'Edges', 5),
  ('step', 'STEP', '#3B82F6', '6', 'Walls/Steps', 6),
  ('wall', 'WALL', '#06B6D4', '7', 'Walls/Steps', 7),
  ('pitch_change', 'PITCH CHANGE', '#F97316', '8', 'Pitch', 8)
ON CONFLICT (key) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_edge_categories_updated_at
  BEFORE UPDATE ON public.edge_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();