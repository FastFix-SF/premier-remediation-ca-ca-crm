-- Sync admin_users to user_roles with 'admin' role
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'
FROM public.admin_users
WHERE is_active = true
ON CONFLICT DO NOTHING;