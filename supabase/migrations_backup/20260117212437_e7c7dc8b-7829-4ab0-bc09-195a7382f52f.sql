-- Phase 1: Database Updates for Client Portal

-- 1.1 Add project_id and expires_at to client_portal_access
ALTER TABLE public.client_portal_access 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE public.client_portal_access 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_portal_access_project 
ON public.client_portal_access(project_id);

CREATE INDEX IF NOT EXISTS idx_client_portal_access_slug 
ON public.client_portal_access(url_slug);

-- 1.2 Create trigger to auto-generate slug from project data
CREATE OR REPLACE FUNCTION public.generate_project_portal_slug()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.url_slug IS NULL OR NEW.url_slug = '' THEN
    -- Get slug from project's client_name or address
    SELECT LOWER(REGEXP_REPLACE(
      COALESCE(client_name, SPLIT_PART(address, ',', 1), 'project'),
      '[^a-zA-Z0-9]+', '-', 'g'
    ))
    INTO base_slug
    FROM projects WHERE id = NEW.project_id;
    
    -- Clean up the slug
    base_slug := TRIM(BOTH '-' FROM COALESCE(base_slug, 'project'));
    final_slug := base_slug;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM client_portal_access WHERE url_slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.url_slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS before_insert_project_portal_access ON public.client_portal_access;
CREATE TRIGGER before_insert_project_portal_access
BEFORE INSERT ON public.client_portal_access
FOR EACH ROW EXECUTE FUNCTION public.generate_project_portal_slug();

-- 1.3 Create client_updates table for project updates
CREATE TABLE IF NOT EXISTS public.client_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  media_urls TEXT[],
  update_type TEXT DEFAULT 'progress' CHECK (update_type IN ('progress', 'milestone', 'before_after', 'schedule_change', 'preview')),
  requires_acknowledgment BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_updates_project ON public.client_updates(project_id);

ALTER TABLE public.client_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view client updates" ON public.client_updates 
FOR SELECT USING (true);

CREATE POLICY "Team members can manage client updates" ON public.client_updates 
FOR ALL USING (is_admin() OR check_user_admin_or_owner());

-- 1.4 Create client_contracts table
CREATE TABLE IF NOT EXISTS public.client_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  proposal_id UUID,
  title TEXT NOT NULL,
  contract_number TEXT,
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'signed', 'expired', 'terminated')),
  start_date DATE,
  end_date DATE,
  total_value NUMERIC,
  signed_at TIMESTAMPTZ,
  signed_by_name TEXT,
  signature_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_contracts_project ON public.client_contracts(project_id);

ALTER TABLE public.client_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view sent contracts" ON public.client_contracts 
FOR SELECT USING (status != 'pending');

CREATE POLICY "Team members can manage contracts" ON public.client_contracts 
FOR ALL USING (is_admin() OR check_user_admin_or_owner());

-- 1.5 Add portal-visible columns to project_tasks
ALTER TABLE public.project_tasks 
ADD COLUMN IF NOT EXISTS visible_to_client BOOLEAN DEFAULT true;

ALTER TABLE public.project_tasks 
ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0;

ALTER TABLE public.project_tasks 
ADD COLUMN IF NOT EXISTS screenshots JSONB DEFAULT '[]';

-- 1.6 Update RLS policy for client_portal_access to allow public slug lookup
DROP POLICY IF EXISTS "Public can view active portal access by slug" ON public.client_portal_access;
CREATE POLICY "Public can view active portal access by slug" ON public.client_portal_access 
FOR SELECT USING (is_active = true);