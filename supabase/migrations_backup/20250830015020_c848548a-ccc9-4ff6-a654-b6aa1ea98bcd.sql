-- Fix the search path for the migration function to address security warning
CREATE OR REPLACE FUNCTION migrate_before_after_to_current_proposed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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