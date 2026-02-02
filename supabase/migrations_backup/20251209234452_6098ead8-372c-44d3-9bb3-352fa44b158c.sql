-- Add rating column to directory_contacts
ALTER TABLE public.directory_contacts 
ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5);

-- Create contact_notes table for storing notes
CREATE TABLE IF NOT EXISTS public.contact_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.directory_contacts(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create contact_files table for storing file references
CREATE TABLE IF NOT EXISTS public.contact_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.directory_contacts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contact_notes
CREATE POLICY "Anyone can view contact notes" 
ON public.contact_notes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create contact notes" 
ON public.contact_notes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contact notes" 
ON public.contact_notes 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete contact notes" 
ON public.contact_notes 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for contact_files
CREATE POLICY "Anyone can view contact files" 
ON public.contact_files 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create contact files" 
ON public.contact_files 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete contact files" 
ON public.contact_files 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at on contact_notes
CREATE TRIGGER update_contact_notes_updated_at
BEFORE UPDATE ON public.contact_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();