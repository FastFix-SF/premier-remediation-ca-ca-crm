-- Create submittals table
CREATE TABLE public.submittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  submittal_type TEXT,
  spec_section TEXT,
  status TEXT DEFAULT 'draft',
  submitted_by UUID,
  coordinator_id UUID,
  date_received TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  sent_to TEXT,
  plan_sheet_numbers TEXT,
  external_link TEXT,
  internal_approver_id UUID,
  internal_response TEXT,
  internal_comments TEXT,
  external_approver TEXT,
  external_status TEXT,
  external_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.submittals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on submittals" ON public.submittals FOR ALL USING (true);
CREATE INDEX idx_submittals_project ON public.submittals(project_id);

-- Create submittal items table
CREATE TABLE public.submittal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submittal_id UUID NOT NULL REFERENCES public.submittals(id) ON DELETE CASCADE,
  item_number TEXT NOT NULL,
  name TEXT NOT NULL,
  plan_sheet_numbers TEXT,
  manufacturer TEXT,
  spec_section TEXT,
  description TEXT,
  date_sent TIMESTAMPTZ,
  date_received TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  response_status TEXT,
  response_note TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.submittal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on submittal_items" ON public.submittal_items FOR ALL USING (true);
CREATE INDEX idx_submittal_items_submittal ON public.submittal_items(submittal_id);

-- Create submittal item attachments table
CREATE TABLE public.submittal_item_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submittal_item_id UUID NOT NULL REFERENCES public.submittal_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.submittal_item_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on submittal_item_attachments" ON public.submittal_item_attachments FOR ALL USING (true);
CREATE INDEX idx_submittal_item_attachments ON public.submittal_item_attachments(submittal_item_id);

-- Create storage bucket for submittal attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('submittal-attachments', 'submittal-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view submittal attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'submittal-attachments');

CREATE POLICY "Authenticated users can upload submittal attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'submittal-attachments');

CREATE POLICY "Authenticated users can delete submittal attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'submittal-attachments');