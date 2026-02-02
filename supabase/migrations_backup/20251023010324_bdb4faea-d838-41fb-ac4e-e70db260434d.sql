-- Enable realtime for employee_requests table
ALTER TABLE public.employee_requests REPLICA IDENTITY FULL;

-- Add employee_requests to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_requests;