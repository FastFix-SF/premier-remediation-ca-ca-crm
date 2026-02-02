-- Add file_size column to project_photos table to track actual storage size
ALTER TABLE public.project_photos 
ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;

-- Add index for better performance when querying by file size
CREATE INDEX IF NOT EXISTS idx_project_photos_file_size 
ON public.project_photos(file_size);

-- Update existing records to have a default file size (can be updated later)
UPDATE public.project_photos 
SET file_size = 0 
WHERE file_size IS NULL;