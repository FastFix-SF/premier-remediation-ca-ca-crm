-- Change label column from TEXT to TEXT[] (array) to support multiple labels
ALTER TABLE public.projects 
DROP COLUMN IF EXISTS label;

ALTER TABLE public.projects 
ADD COLUMN labels TEXT[] DEFAULT '{}';