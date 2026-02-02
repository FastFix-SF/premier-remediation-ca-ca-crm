-- Enable realtime for project_updates table
ALTER TABLE public.project_updates REPLICA IDENTITY FULL;

-- Add project_updates to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_updates;