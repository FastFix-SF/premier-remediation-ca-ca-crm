-- =============================================
-- CLIENTS SECTION - COMPLETE DATABASE SETUP
-- =============================================

-- 1. SALES CLIENTS TABLE (Main Client Data)
CREATE TABLE public.sales_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  business_name TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  secondary_phone TEXT,
  secondary_email TEXT,
  preferred_contact_method TEXT DEFAULT 'phone',
  website TEXT,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  avatar_url TEXT,
  industry TEXT,
  company_size TEXT,
  lead_source TEXT,
  service_area TEXT,
  instagram_handle TEXT,
  facebook_url TEXT,
  tiktok_handle TEXT,
  google_business_url TEXT,
  status TEXT NOT NULL DEFAULT 'LEAD',
  assigned_to UUID,
  notes TEXT,
  plan_type TEXT,
  plan_start_date DATE,
  monthly_value NUMERIC,
  onboarding_date DATE,
  contract_end_date DATE,
  preferred_language TEXT DEFAULT 'en',
  chatbot_started_at TIMESTAMPTZ,
  last_chatbot_message_at TIMESTAMPTZ,
  parent_client_id UUID REFERENCES public.sales_clients(id) ON DELETE SET NULL,
  client_type TEXT,
  call_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_clients
ADD CONSTRAINT sales_clients_status_check 
CHECK (status IN ('LEAD', 'PROSPECT', 'PROPOSAL_SENT', 'CONTRACT_SENT', 'ACTIVE', 'INACTIVE', 'CLOSED', 'LOST'));

ALTER TABLE public.sales_clients
ADD CONSTRAINT sales_clients_type_check 
CHECK (client_type IS NULL OR client_type IN ('contact', 'business'));

ALTER TABLE public.sales_clients
ADD CONSTRAINT sales_clients_plan_check 
CHECK (plan_type IS NULL OR plan_type IN ('starter', 'growth', 'pro', 'advanced', 'fasto'));

CREATE INDEX idx_sales_clients_status ON public.sales_clients(status);
CREATE INDEX idx_sales_clients_parent ON public.sales_clients(parent_client_id);
CREATE INDEX idx_sales_clients_assigned ON public.sales_clients(assigned_to);

ALTER TABLE public.sales_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view all clients"
ON public.sales_clients FOR SELECT
USING (public.is_active_team_member());

CREATE POLICY "Team members can create clients"
ON public.sales_clients FOR INSERT
WITH CHECK (public.is_active_team_member());

CREATE POLICY "Team members can update clients"
ON public.sales_clients FOR UPDATE
USING (public.is_active_team_member());

CREATE POLICY "Team members can delete clients"
ON public.sales_clients FOR DELETE
USING (public.is_active_team_member());

-- 2. CLIENT PORTAL ACCESS TABLE
CREATE TABLE public.client_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.sales_clients(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  url_slug TEXT UNIQUE,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.generate_client_portal_slug()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.url_slug IS NULL OR NEW.url_slug = '' THEN
    SELECT LOWER(REGEXP_REPLACE(COALESCE(name, 'client'), '[^a-zA-Z0-9]+', '-', 'g'))
    INTO base_slug
    FROM public.sales_clients WHERE id = NEW.client_id;

    base_slug := TRIM(BOTH '-' FROM base_slug);
    final_slug := base_slug;

    WHILE EXISTS (
      SELECT 1 FROM public.client_portal_access
      WHERE url_slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.url_slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER before_insert_client_portal_access
BEFORE INSERT ON public.client_portal_access
FOR EACH ROW EXECUTE FUNCTION public.generate_client_portal_slug();

ALTER TABLE public.client_portal_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage portal access"
ON public.client_portal_access FOR ALL
USING (public.is_active_team_member());

CREATE POLICY "Public can view active portal access by slug"
ON public.client_portal_access FOR SELECT
USING (is_active = true);

-- 3. PLAN DELIVERABLES TABLE (Templates)
CREATE TABLE public.plan_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_deliverables
ADD CONSTRAINT plan_deliverables_plan_check 
CHECK (plan_type IN ('starter', 'growth', 'pro', 'advanced', 'fasto'));

ALTER TABLE public.plan_deliverables
ADD CONSTRAINT plan_deliverables_category_check 
CHECK (category IN ('website', 'crm', 'analytics', 'onboarding', 'receptionist', 'social', 'operations', 'support', 'voice', 'general'));

ALTER TABLE public.plan_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage deliverables"
ON public.plan_deliverables FOR ALL
USING (public.is_active_team_member());

CREATE POLICY "Public can view plan deliverables"
ON public.plan_deliverables FOR SELECT
USING (true);

-- 4. CLIENT DELIVERABLES TABLE (Instances)
CREATE TABLE public.client_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.sales_clients(id) ON DELETE CASCADE,
  deliverable_id UUID NOT NULL REFERENCES public.plan_deliverables(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  progress_percent INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  assigned_team_member UUID,
  notes TEXT,
  screenshots JSONB DEFAULT '[]',
  estimated_completion DATE,
  timeline_events JSONB DEFAULT '[]',
  last_activity TIMESTAMPTZ,
  activity_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_deliverables
ADD CONSTRAINT client_deliverables_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed'));

ALTER TABLE public.client_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage client deliverables"
ON public.client_deliverables FOR ALL
USING (public.is_active_team_member());

CREATE POLICY "Clients can view own deliverables"
ON public.client_deliverables FOR SELECT
USING (true);

-- Trigger to sync deliverables when client plan changes
CREATE OR REPLACE FUNCTION public.sync_client_deliverables()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.plan_type IS DISTINCT FROM NEW.plan_type AND NEW.plan_type IS NOT NULL THEN
    DELETE FROM public.client_deliverables cd
    WHERE cd.client_id = NEW.id
    AND cd.deliverable_id NOT IN (
      SELECT id FROM public.plan_deliverables WHERE plan_type = NEW.plan_type
    );

    INSERT INTO public.client_deliverables (client_id, deliverable_id, status)
    SELECT NEW.id, pd.id, 'pending'
    FROM public.plan_deliverables pd
    WHERE pd.plan_type = NEW.plan_type
    AND NOT EXISTS (
      SELECT 1 FROM public.client_deliverables cd
      WHERE cd.client_id = NEW.id AND cd.deliverable_id = pd.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_update_sales_clients_plan
AFTER UPDATE OF plan_type ON public.sales_clients
FOR EACH ROW EXECUTE FUNCTION public.sync_client_deliverables();

-- 5. CLIENT MESSAGES TABLE
CREATE TABLE public.client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.sales_clients(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'team',
  sender_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_messages
ADD CONSTRAINT client_messages_sender_check 
CHECK (sender_type IN ('team', 'client'));

ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage messages"
ON public.client_messages FOR ALL
USING (public.is_active_team_member());

CREATE POLICY "Clients can view own messages"
ON public.client_messages FOR SELECT
USING (true);

-- 6. CLIENT POLLS TABLE
CREATE TABLE public.client_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.sales_clients(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES public.client_deliverables(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  option_a_label TEXT NOT NULL DEFAULT 'Option A',
  option_b_label TEXT NOT NULL DEFAULT 'Option B',
  option_a_image_url TEXT,
  option_b_image_url TEXT,
  client_choice TEXT,
  client_feedback TEXT,
  is_active BOOLEAN DEFAULT true,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage polls"
ON public.client_polls FOR ALL
USING (public.is_active_team_member());

CREATE POLICY "Clients can view and respond to polls"
ON public.client_polls FOR ALL
USING (true);

-- 7. CLIENT CHATBOT CONVERSATIONS TABLE
CREATE TABLE public.client_chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.sales_clients(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  deep_link_url TEXT,
  twilio_message_sid TEXT,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_chatbot_conversations
ADD CONSTRAINT chatbot_sender_check 
CHECK (sender_type IN ('bot', 'client', 'team'));

ALTER TABLE public.client_chatbot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view conversations"
ON public.client_chatbot_conversations FOR ALL
USING (public.is_active_team_member());

-- 8. CLIENT NOTIFICATIONS TABLE
CREATE TABLE public.client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.sales_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage notifications"
ON public.client_notifications FOR ALL
USING (public.is_active_team_member());

-- 9. CLIENT NFC CARDS TABLE
CREATE TABLE public.client_nfc_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.sales_clients(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  design_url TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'draft',
  design_instructions TEXT,
  card_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_nfc_cards
ADD CONSTRAINT nfc_cards_status_check 
CHECK (status IN ('draft', 'generating', 'ready', 'error'));

ALTER TABLE public.client_nfc_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage NFC cards"
ON public.client_nfc_cards FOR ALL
USING (public.is_active_team_member());

-- 10. CLIENT DESIGNS TABLE
CREATE TABLE public.client_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.sales_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  design_url TEXT,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'background',
  description TEXT,
  inspiration_url TEXT,
  generation_prompt TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_designs
ADD CONSTRAINT designs_category_check 
CHECK (category IN ('background', 'logo', 'illustration', 'pattern'));

ALTER TABLE public.client_designs
ADD CONSTRAINT designs_status_check 
CHECK (status IN ('pending', 'generating', 'ready', 'error'));

ALTER TABLE public.client_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage designs"
ON public.client_designs FOR ALL
USING (public.is_active_team_member());

-- 11. CLIENT ACTIVITY LOG TABLE
CREATE TABLE public.client_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.sales_clients(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES public.client_deliverables(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  actor_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage activity log"
ON public.client_activity_log FOR ALL
USING (public.is_active_team_member());

CREATE POLICY "Clients can view own activity"
ON public.client_activity_log FOR SELECT
USING (true);

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('client-avatars', 'client-avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('client-attachments', 'client-attachments', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('nfc-card-designs', 'nfc-card-designs', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for client-avatars
CREATE POLICY "Public read access for client avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-avatars');

CREATE POLICY "Team members can upload client avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'client-avatars' AND public.is_active_team_member());

CREATE POLICY "Team members can update client avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'client-avatars' AND public.is_active_team_member());

CREATE POLICY "Team members can delete client avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'client-avatars' AND public.is_active_team_member());

-- Storage policies for client-attachments
CREATE POLICY "Public read access for client attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-attachments');

CREATE POLICY "Team members can upload client attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'client-attachments' AND public.is_active_team_member());

CREATE POLICY "Team members can update client attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'client-attachments' AND public.is_active_team_member());

CREATE POLICY "Team members can delete client attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'client-attachments' AND public.is_active_team_member());

-- Storage policies for nfc-card-designs
CREATE POLICY "Public read access for nfc designs"
ON storage.objects FOR SELECT
USING (bucket_id = 'nfc-card-designs');

CREATE POLICY "Team members can upload nfc designs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nfc-card-designs' AND public.is_active_team_member());

CREATE POLICY "Team members can update nfc designs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'nfc-card-designs' AND public.is_active_team_member());

CREATE POLICY "Team members can delete nfc designs"
ON storage.objects FOR DELETE
USING (bucket_id = 'nfc-card-designs' AND public.is_active_team_member());

-- SEED PLAN DELIVERABLES
INSERT INTO public.plan_deliverables (plan_type, item_name, description, category, order_index) VALUES
-- Starter Plan
('starter', 'Website Setup', 'Basic company website with contact form', 'website', 1),
('starter', 'Basic CRM Setup', 'Customer database and lead tracking', 'crm', 2),
('starter', 'Analytics Dashboard', 'Basic traffic and conversion tracking', 'analytics', 3),

-- Growth Plan
('growth', 'Website Setup', 'Basic company website with contact form', 'website', 1),
('growth', 'Basic CRM Setup', 'Customer database and lead tracking', 'crm', 2),
('growth', 'Analytics Dashboard', 'Basic traffic and conversion tracking', 'analytics', 3),
('growth', 'Onboarding Kit', 'Welcome materials and training guides', 'onboarding', 4),
('growth', 'AI Receptionist', '24/7 automated call handling', 'receptionist', 5),

-- Pro Plan
('pro', 'Website Setup', 'Basic company website with contact form', 'website', 1),
('pro', 'Basic CRM Setup', 'Customer database and lead tracking', 'crm', 2),
('pro', 'Analytics Dashboard', 'Basic traffic and conversion tracking', 'analytics', 3),
('pro', 'Onboarding Kit', 'Welcome materials and training guides', 'onboarding', 4),
('pro', 'AI Receptionist', '24/7 automated call handling', 'receptionist', 5),
('pro', 'Social Media Management', 'Content scheduling and posting', 'social', 6),
('pro', 'Operations Tools', 'Workflow automation and scheduling', 'operations', 7),

-- Advanced Plan
('advanced', 'Website Setup', 'Basic company website with contact form', 'website', 1),
('advanced', 'Basic CRM Setup', 'Customer database and lead tracking', 'crm', 2),
('advanced', 'Analytics Dashboard', 'Basic traffic and conversion tracking', 'analytics', 3),
('advanced', 'Onboarding Kit', 'Welcome materials and training guides', 'onboarding', 4),
('advanced', 'AI Receptionist', '24/7 automated call handling', 'receptionist', 5),
('advanced', 'Social Media Management', 'Content scheduling and posting', 'social', 6),
('advanced', 'Operations Tools', 'Workflow automation and scheduling', 'operations', 7),
('advanced', 'Voice AI Integration', 'Advanced voice assistant features', 'voice', 8),
('advanced', 'Premium Support', 'Priority support with dedicated rep', 'support', 9),

-- Fasto Plan (All features)
('fasto', 'Website Setup', 'Premium company website with all features', 'website', 1),
('fasto', 'Advanced CRM', 'Full CRM with automation and integrations', 'crm', 2),
('fasto', 'Advanced Analytics', 'Custom dashboards and reporting', 'analytics', 3),
('fasto', 'VIP Onboarding', 'White-glove onboarding experience', 'onboarding', 4),
('fasto', 'AI Receptionist Pro', 'Advanced AI with custom scripts', 'receptionist', 5),
('fasto', 'Social Media Suite', 'Full social management with ads', 'social', 6),
('fasto', 'Operations Suite', 'Complete operations automation', 'operations', 7),
('fasto', 'Voice AI Pro', 'Custom voice AI with integrations', 'voice', 8),
('fasto', 'Concierge Support', '24/7 dedicated support team', 'support', 9);

-- Updated at trigger for sales_clients
CREATE OR REPLACE FUNCTION public.update_sales_clients_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_sales_clients_timestamp
BEFORE UPDATE ON public.sales_clients
FOR EACH ROW EXECUTE FUNCTION public.update_sales_clients_updated_at();