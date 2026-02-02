-- Manually grant admin access to +15106196839 user with email
INSERT INTO public.admin_users (user_id, email, is_active)
VALUES ('7c562443-11b2-4e59-8133-9c7b60d31391', '15106196839', true)
ON CONFLICT (user_id) DO UPDATE SET is_active = true, email = '15106196839';

-- Update team_directory to give owner role and active status
UPDATE public.team_directory
SET role = 'owner', status = 'active'
WHERE user_id = '7c562443-11b2-4e59-8133-9c7b60d31391';