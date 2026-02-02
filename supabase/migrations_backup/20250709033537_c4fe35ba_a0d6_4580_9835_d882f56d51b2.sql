
-- Add columns to track highlighted before/after photos for the main slider
ALTER TABLE public.project_photos 
ADD COLUMN is_highlighted_before boolean DEFAULT false,
ADD COLUMN is_highlighted_after boolean DEFAULT false;

-- Create indexes for performance
CREATE INDEX idx_project_photos_highlighted_before ON public.project_photos(project_id, is_highlighted_before) WHERE is_highlighted_before = true;
CREATE INDEX idx_project_photos_highlighted_after ON public.project_photos(project_id, is_highlighted_after) WHERE is_highlighted_after = true;

-- Create function to ensure only one highlighted before/after photo per project
CREATE OR REPLACE FUNCTION public.ensure_single_highlight()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting is_highlighted_before to true, clear other highlighted before photos in the same project
    IF NEW.is_highlighted_before = true AND (OLD.is_highlighted_before IS NULL OR OLD.is_highlighted_before = false) THEN
        UPDATE public.project_photos 
        SET is_highlighted_before = false 
        WHERE project_id = NEW.project_id 
          AND id != NEW.id 
          AND is_highlighted_before = true;
    END IF;
    
    -- If setting is_highlighted_after to true, clear other highlighted after photos in the same project
    IF NEW.is_highlighted_after = true AND (OLD.is_highlighted_after IS NULL OR OLD.is_highlighted_after = false) THEN
        UPDATE public.project_photos 
        SET is_highlighted_after = false 
        WHERE project_id = NEW.project_id 
          AND id != NEW.id 
          AND is_highlighted_after = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single highlight constraint
CREATE TRIGGER trigger_ensure_single_highlight
    BEFORE UPDATE ON public.project_photos
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_highlight();
