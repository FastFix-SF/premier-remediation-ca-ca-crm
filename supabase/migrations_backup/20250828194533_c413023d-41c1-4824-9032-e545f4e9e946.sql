-- Update RLS policies for visualizer tables to work with anonymous access
-- Drop existing policies
DROP POLICY IF EXISTS "Anonymous users can manage via session token" ON visualizer_projects;
DROP POLICY IF EXISTS "Users can manage masks in their projects" ON visualizer_masks;
DROP POLICY IF EXISTS "Users can manage variants in their projects" ON visualizer_variants;

-- Update visualizer_projects policies
CREATE POLICY "Anonymous users can manage via session token" ON visualizer_projects
FOR ALL 
USING (
  (auth.uid() = owner) OR 
  (session_token IS NOT NULL AND owner IS NULL)
);

-- Add RLS policies for visualizer_images
ALTER TABLE visualizer_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage images in their projects" ON visualizer_images
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM visualizer_projects vp 
    WHERE vp.id = visualizer_images.project_id 
    AND (
      (auth.uid() = vp.owner) OR 
      (vp.session_token IS NOT NULL AND vp.owner IS NULL)
    )
  )
);

-- Update visualizer_masks policies
CREATE POLICY "Users can manage masks in their projects" ON visualizer_masks
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM visualizer_images vi 
    JOIN visualizer_projects vp ON vp.id = vi.project_id 
    WHERE vi.id = visualizer_masks.image_id 
    AND (
      (auth.uid() = vp.owner) OR 
      (vp.session_token IS NOT NULL AND vp.owner IS NULL)
    )
  )
);

-- Update visualizer_variants policies
CREATE POLICY "Users can manage variants in their projects" ON visualizer_variants
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM visualizer_images vi 
    JOIN visualizer_projects vp ON vp.id = vi.project_id 
    WHERE vi.id = visualizer_variants.image_id 
    AND (
      (auth.uid() = vp.owner) OR 
      (vp.session_token IS NOT NULL AND vp.owner IS NULL)
    )
  )
);