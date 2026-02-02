-- Add fastrackfix@gmail.com as admin user with full access
INSERT INTO public.admin_users (user_id, email, is_active)
VALUES (
  gen_random_uuid(), 
  'fastrackfix@gmail.com', 
  true
) ON CONFLICT (email) DO UPDATE SET is_active = true;

-- Also add to team_members as Owner
INSERT INTO public.team_members (user_id, email, full_name, role, is_active)
VALUES (
  (SELECT user_id FROM public.admin_users WHERE email = 'fastrackfix@gmail.com' LIMIT 1),
  'fastrackfix@gmail.com',
  'FastTrack Admin',
  'Owner',
  true
) ON CONFLICT (email) DO UPDATE SET 
  role = 'Owner', 
  is_active = true;