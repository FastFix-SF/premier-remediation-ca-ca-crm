-- Extend proposal_photos table for Current vs. Proposed comparison blocks
ALTER TABLE public.proposal_photos 
ADD COLUMN comparison_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN comparison_block_id UUID DEFAULT NULL;

-- Add new photo types for current vs proposed
-- Note: We're keeping backward compatibility with 'before' and 'after'
-- but adding 'current' and 'proposed' as the new preferred types

-- Update existing photo types to be more flexible
ALTER TABLE public.proposal_photos 
ALTER COLUMN photo_type TYPE TEXT;

-- Create an index on the new comparison_block_id for performance
CREATE INDEX IF NOT EXISTS idx_proposal_photos_comparison_block_id 
ON public.proposal_photos(comparison_block_id);

-- Add a check to ensure photo_type values are valid
ALTER TABLE public.proposal_photos 
ADD CONSTRAINT valid_photo_type 
CHECK (photo_type IN ('before', 'after', 'current', 'proposed', 'reference', 'progress'));

-- Create a function to migrate existing before/after photos to current/proposed
CREATE OR REPLACE FUNCTION migrate_before_after_to_current_proposed()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update 'before' photos to 'current'
  UPDATE public.proposal_photos 
  SET photo_type = 'current'
  WHERE photo_type = 'before';
  
  -- Update 'after' photos to 'proposed'  
  UPDATE public.proposal_photos
  SET photo_type = 'proposed'
  WHERE photo_type = 'after';
END;
$$;