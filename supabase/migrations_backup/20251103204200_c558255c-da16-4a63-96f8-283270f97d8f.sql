-- Create a new table for project document training data
CREATE TABLE public.project_training_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  source_file_url TEXT NOT NULL,
  source_file_type TEXT NOT NULL CHECK (source_file_type IN ('pdf', 'image')),
  document_category TEXT NOT NULL,
  file_name TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.project_training_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage project training documents"
ON public.project_training_documents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Authenticated users can insert project training documents"
ON public.project_training_documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can view project training documents"
ON public.project_training_documents
FOR SELECT
TO authenticated
USING (true);

-- Add index for faster queries
CREATE INDEX idx_project_training_documents_quote_id ON public.project_training_documents(quote_request_id);
CREATE INDEX idx_project_training_documents_category ON public.project_training_documents(document_category);

-- Add updated_at trigger
CREATE TRIGGER update_project_training_documents_updated_at
  BEFORE UPDATE ON public.project_training_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();