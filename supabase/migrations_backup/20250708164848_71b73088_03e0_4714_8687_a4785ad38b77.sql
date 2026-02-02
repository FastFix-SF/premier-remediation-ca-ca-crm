-- Admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the authorized admin user
INSERT INTO admin_users (user_id, email, is_active)
SELECT id, email, true 
FROM auth.users 
WHERE email = 'fastrackfix@gmail.com'
ON CONFLICT DO NOTHING;

-- Lead status enum for roofing business
CREATE TYPE lead_status AS ENUM (
  'new', 'qualified', 'contacted', 'estimate_scheduled',
  'proposal_sent', 'closed_won', 'closed_lost', 'nurturing'
);

-- Blog category enum for roofing
CREATE TYPE blog_category AS ENUM (
  'Metal Roofing', 'Installation Tips', 'Maintenance',
  'Commercial Projects', 'Residential Projects', 'Industry News'
);

-- Update existing leads table to add roofing-specific fields
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS project_type TEXT,
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS roof_size TEXT,
ADD COLUMN IF NOT EXISTS timeline TEXT,
ADD COLUMN IF NOT EXISTS budget_range TEXT;

-- Fix status column type conversion
ALTER TABLE leads ALTER COLUMN status DROP DEFAULT;
ALTER TABLE leads ALTER COLUMN status TYPE lead_status USING 
  CASE status 
    WHEN 'new' THEN 'new'::lead_status
    WHEN 'qualified' THEN 'qualified'::lead_status 
    WHEN 'contacted' THEN 'contacted'::lead_status
    ELSE 'new'::lead_status
  END;
ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new'::lead_status;

-- Lead scoring system
CREATE TABLE lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  total_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  project_fit_score INTEGER DEFAULT 0,
  readiness_score INTEGER DEFAULT 0,
  urgency_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Blog posts table
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Roofing Friend Team',
  category blog_category NOT NULL,
  image_url TEXT,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  read_time TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Missed opportunities view for lead recovery
CREATE VIEW missed_opportunities AS
SELECT 
  c.session_id,
  c.created_at,
  c.user_message,
  c.assistant_response,
  c.interest_score,
  vs.page_views,
  vs.total_time_seconds,
  CASE 
    WHEN vs.total_time_seconds > 300 AND vs.page_views >= 3 THEN 'High Engagement'
    WHEN vs.total_time_seconds > 120 OR vs.page_views >= 2 THEN 'Medium Engagement'
    ELSE 'Low Engagement'
  END as engagement_level
FROM chat_conversations_mrf c
LEFT JOIN visitor_sessions vs ON c.mrf_prospect_id = vs.mrf_prospect_id
LEFT JOIN leads l ON c.mrf_prospect_id = l.mrf_prospect_id
WHERE l.id IS NULL AND c.interest_score > 3;

-- Lead recovery function
CREATE OR REPLACE FUNCTION recover_missed_leads() RETURNS INTEGER AS $$
DECLARE
  recovered_count INTEGER := 0;
  missed_lead RECORD;
  new_lead_id UUID;
BEGIN
  FOR missed_lead IN 
    SELECT DISTINCT ON (mrf_prospect_id) 
      mrf_prospect_id,
      user_message,
      assistant_response,
      interest_score,
      created_at
    FROM chat_conversations_mrf c
    WHERE c.interest_score >= 5 
      AND c.mrf_prospect_id NOT IN (SELECT DISTINCT mrf_prospect_id FROM leads WHERE mrf_prospect_id IS NOT NULL)
    ORDER BY mrf_prospect_id, interest_score DESC, created_at DESC
  LOOP
    INSERT INTO leads (
      mrf_prospect_id,
      name,
      status,
      source,
      notes,
      created_at
    ) VALUES (
      missed_lead.mrf_prospect_id,
      'Recovered Lead',
      'new'::lead_status,
      'lead_recovery',
      'Auto-recovered from high-interest conversation: ' || LEFT(missed_lead.user_message, 200),
      missed_lead.created_at
    ) RETURNING id INTO new_lead_id;
    
    recovered_count := recovered_count + 1;
  END LOOP;
  
  RETURN recovered_count;
END;
$$ LANGUAGE plpgsql;

-- App configuration table for settings
CREATE TABLE app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admins only" ON admin_users FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins only" ON lead_scores FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins can manage blog posts" ON blog_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Public can view published blog posts" ON blog_posts FOR SELECT USING (
  published = true
);

CREATE POLICY "Admins can manage config" ON app_config FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Update existing leads policy to allow admin access
DROP POLICY IF EXISTS "Admins and sales reps can view all leads" ON leads;
CREATE POLICY "Admins can manage all leads" ON leads FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Triggers for updated_at columns
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_scores_updated_at
  BEFORE UPDATE ON lead_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();