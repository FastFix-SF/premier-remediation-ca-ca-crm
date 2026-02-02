-- Add admin_background_style column to profiles table to store user-specific background preferences
ALTER TABLE public.profiles 
ADD COLUMN admin_background_style TEXT DEFAULT '{"background":"linear-gradient(135deg, rgb(249 250 251) 0%, rgb(255 255 255) 100%)"}';

COMMENT ON COLUMN public.profiles.admin_background_style IS 'Stores user-specific admin dashboard background style as JSON string';