-- Add coordinator_id column to project_documents table
ALTER TABLE public.project_documents 
ADD COLUMN coordinator_id UUID REFERENCES auth.users(id);

-- Add index for faster lookups
CREATE INDEX idx_project_documents_coordinator ON public.project_documents(coordinator_id);