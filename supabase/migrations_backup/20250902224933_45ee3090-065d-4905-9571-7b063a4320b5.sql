-- Fix team_directory structure for proper invitation handling
-- Make user_id nullable during invitation process and use email as primary constraint

-- Drop existing primary key constraint
ALTER TABLE public.team_directory DROP CONSTRAINT team_directory_pkey;

-- Make user_id nullable for invitation process
ALTER TABLE public.team_directory ALTER COLUMN user_id DROP NOT NULL;

-- Add email as primary key instead
ALTER TABLE public.team_directory ADD CONSTRAINT team_directory_pkey PRIMARY KEY (email);

-- Add unique constraint on user_id when it's not null
CREATE UNIQUE INDEX team_directory_user_id_unique ON public.team_directory (user_id) WHERE user_id IS NOT NULL;

-- Clean up any duplicate entries by email, keeping the most recent
WITH duplicates AS (
  SELECT email, 
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM public.team_directory
)
DELETE FROM public.team_directory 
WHERE (email, created_at) IN (
  SELECT td.email, td.created_at 
  FROM public.team_directory td
  JOIN duplicates d ON d.email = td.email 
  WHERE d.rn > 1
);