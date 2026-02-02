-- Add is_featured column to projects table
ALTER TABLE public.projects 
ADD COLUMN is_featured boolean DEFAULT false;

-- Create function to check featured projects limit
CREATE OR REPLACE FUNCTION public.check_featured_projects_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only check if setting is_featured to true
  IF NEW.is_featured = true AND (OLD.is_featured IS NULL OR OLD.is_featured = false) THEN
    -- Check if we already have 3 featured projects
    IF (SELECT COUNT(*) FROM projects WHERE is_featured = true AND id != NEW.id) >= 3 THEN
      RAISE EXCEPTION 'Cannot feature more than 3 projects. Please unfeature another project first.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to enforce featured projects limit
CREATE TRIGGER check_featured_projects_limit_trigger
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.check_featured_projects_limit();