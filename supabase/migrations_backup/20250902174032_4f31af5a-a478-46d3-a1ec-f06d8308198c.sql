-- Add fastrackfix@gmail.com as admin user with full access
INSERT INTO public.admin_users (user_id, email, is_active)
SELECT gen_random_uuid(), 'fastrackfix@gmail.com', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_users WHERE email = 'fastrackfix@gmail.com'
);

-- Also add to team_members as Owner
INSERT INTO public.team_members (user_id, email, full_name, role, is_active)
SELECT 
  (SELECT user_id FROM public.admin_users WHERE email = 'fastrackfix@gmail.com' LIMIT 1),
  'fastrackfix@gmail.com',
  'FastTrack Admin',
  'Owner',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_members WHERE email = 'fastrackfix@gmail.com'
);