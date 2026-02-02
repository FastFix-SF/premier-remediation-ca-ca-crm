-- Secure the missed_opportunities view by removing public access
-- Note: missed_opportunities is a VIEW; RLS cannot be applied to views.
-- We restrict access via privileges to prevent exposure through PostgREST.

REVOKE ALL PRIVILEGES ON PUBLIC.missed_opportunities FROM anon, authenticated;

-- Optionally, allow only elevated internal roles to read (service roles bypass anyway)
GRANT SELECT ON PUBLIC.missed_opportunities TO service_role;
