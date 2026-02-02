-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  photo_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('garage', 'standing_seam', 'shingles', 'general')),
  requires_protection BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory_logs table for history tracking
CREATE TABLE public.inventory_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  note TEXT
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_items
CREATE POLICY "Team members can view inventory items"
ON public.inventory_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_directory
    WHERE team_directory.user_id = auth.uid() AND team_directory.status = 'active'
  ) OR is_admin()
);

CREATE POLICY "Team members can insert inventory items"
ON public.inventory_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_directory
    WHERE team_directory.user_id = auth.uid() AND team_directory.status = 'active'
  ) OR is_admin()
);

CREATE POLICY "Team members can update inventory items"
ON public.inventory_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM team_directory
    WHERE team_directory.user_id = auth.uid() AND team_directory.status = 'active'
  ) OR is_admin()
);

CREATE POLICY "Admins can delete inventory items"
ON public.inventory_items FOR DELETE
USING (is_admin());

-- RLS policies for inventory_logs
CREATE POLICY "Team members can view inventory logs"
ON public.inventory_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_directory
    WHERE team_directory.user_id = auth.uid() AND team_directory.status = 'active'
  ) OR is_admin()
);

CREATE POLICY "Team members can insert inventory logs"
ON public.inventory_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_directory
    WHERE team_directory.user_id = auth.uid() AND team_directory.status = 'active'
  ) OR is_admin()
);

-- Create updated_at trigger
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for inventory photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('inventory-photos', 'inventory-photos', true);

-- Storage policies for inventory-photos bucket
CREATE POLICY "Anyone can view inventory photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'inventory-photos');

CREATE POLICY "Team members can upload inventory photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'inventory-photos' AND (
    EXISTS (
      SELECT 1 FROM team_directory
      WHERE team_directory.user_id = auth.uid() AND team_directory.status = 'active'
    ) OR is_admin()
  )
);

CREATE POLICY "Team members can update inventory photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'inventory-photos' AND (
    EXISTS (
      SELECT 1 FROM team_directory
      WHERE team_directory.user_id = auth.uid() AND team_directory.status = 'active'
    ) OR is_admin()
  )
);

CREATE POLICY "Admins can delete inventory photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'inventory-photos' AND is_admin());