-- Add notes column to inventory_items
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create inventory_categories table for custom categories
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view categories
CREATE POLICY "Authenticated users can view inventory categories"
ON public.inventory_categories
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to manage categories
CREATE POLICY "Authenticated users can manage inventory categories"
ON public.inventory_categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert default categories
INSERT INTO public.inventory_categories (key, label, color, display_order) VALUES
  ('garage', 'Garage', '#3b82f6', 1),
  ('standing_seam', 'Standing Seam', '#22c55e', 2),
  ('shingles', 'Shingles', '#f59e0b', 3),
  ('general', 'General', '#6b7280', 4)
ON CONFLICT (key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_inventory_categories_updated_at
BEFORE UPDATE ON public.inventory_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();