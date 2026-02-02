-- Drop and recreate get_team_members RPC to include phone_number
DROP FUNCTION IF EXISTS public.get_team_members(text, integer, integer);

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
  updated_at timestamptz,
  phone_number text
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
  SELECT user_id, email, full_name, role, role_label, status, invited_at, last_login_at, created_at, updated_at, phone_number
  FROM base;
$$;