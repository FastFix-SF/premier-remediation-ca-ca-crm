-- Add secondary_role column to team_directory for multi-role support
ALTER TABLE public.team_directory 
ADD COLUMN IF NOT EXISTS secondary_role text DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.team_directory.secondary_role IS 'Optional second role for users who need privileges from multiple roles';