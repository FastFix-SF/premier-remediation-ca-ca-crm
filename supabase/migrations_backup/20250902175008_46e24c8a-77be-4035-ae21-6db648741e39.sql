-- Complete team directory solution to fix infinite loading

-- 1. Roles table (if not exists)
CREATE TABLE IF NOT EXISTS public.rf_roles (
  key text PRIMARY KEY,
  label text NOT NULL
);

INSERT INTO public.rf_roles(key, label) VALUES
  ('owner', 'Owner'),
  ('admin', 'Admin'),
  ('leader', 'Leader'),
  ('contributor', 'Contributor')
ON CONFLICT (key) DO NOTHING;

-- 2. Team directory table (mirror of invited/active users)
CREATE TABLE IF NOT EXISTS public.team_directory (
  user_id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text,
  role text NOT NULL REFERENCES public.rf_roles(key),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
  invited_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_directory_role ON public.team_directory(role);
CREATE INDEX IF NOT EXISTS idx_team_directory_status ON public.team_directory(status);

-- 3. Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_updated_at() 
RETURNS trigger 
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_team_directory_touch ON public.team_directory;
CREATE TRIGGER trg_team_directory_touch
BEFORE UPDATE ON public.team_directory
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. RLS on team_directory
ALTER TABLE public.team_directory ENABLE ROW LEVEL SECURITY;

-- Owner/Admins can read everything
DROP POLICY IF EXISTS team_dir_admin_read ON public.team_directory;
CREATE POLICY team_dir_admin_read ON public.team_directory
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid() AND a.is_active)
);

-- Owner/Admins can write everything
DROP POLICY IF EXISTS team_dir_admin_write ON public.team_directory;
CREATE POLICY team_dir_admin_write ON public.team_directory
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid() AND a.is_active)
);

-- 5. RPC to list members (supports search/pagination)
CREATE OR REPLACE FUNCTION public.get_team_members(
  q text DEFAULT NULL,
  page int DEFAULT 1,
  page_size int DEFAULT 20
) RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  role text,
  role_label text,
  status text,
  invited_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT td.*, rr.label as role_label
    FROM public.team_directory td
    LEFT JOIN public.rf_roles rr ON rr.key = td.role
    WHERE
      CASE WHEN q IS NULL OR length(q) = 0 THEN true
           ELSE (td.email ILIKE '%'||q||'%' OR COALESCE(td.full_name,'') ILIKE '%'||q||'%')
      END
    ORDER BY td.created_at DESC
    LIMIT page_size
    OFFSET GREATEST((page-1),0)*page_size
  )
  SELECT user_id, email, full_name, role, role_label, status, invited_at, last_login_at, created_at, updated_at
  FROM base;
$$;

-- Allow authenticated users to execute the RPC
REVOKE ALL ON FUNCTION public.get_team_members(text,int,int) FROM public;
GRANT EXECUTE ON FUNCTION public.get_team_members(text,int,int) TO anon, authenticated;

-- 6. Migrate existing admin data to team_directory
INSERT INTO public.team_directory (user_id, email, full_name, role, status, invited_at, last_login_at, created_at)
SELECT 
  COALESCE(au.user_id, gen_random_uuid()),
  au.email,
  COALESCE(tm.full_name, 'Admin User'),
  CASE 
    WHEN tm.role = 'Owner' THEN 'owner'
    WHEN tm.role = 'Admin' THEN 'admin'
    ELSE 'admin'
  END,
  'active',
  au.created_at,
  now(),
  au.created_at
FROM public.admin_users au
LEFT JOIN public.team_members tm ON tm.email = au.email
WHERE au.is_active = true
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = now();

-- Also handle team_members not in admin_users
INSERT INTO public.team_directory (user_id, email, full_name, role, status, invited_at, created_at)
SELECT 
  COALESCE(tm.user_id, gen_random_uuid()),
  tm.email,
  tm.full_name,
  CASE 
    WHEN tm.role = 'Owner' THEN 'owner'
    WHEN tm.role = 'Admin' THEN 'admin'
    ELSE 'contributor'
  END,
  CASE WHEN tm.is_active THEN 'active' ELSE 'disabled' END,
  tm.created_at,
  tm.created_at
FROM public.team_members tm
WHERE tm.email NOT IN (SELECT email FROM public.team_directory)
ON CONFLICT (email) DO NOTHING;