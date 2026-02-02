-- Create project access requests table
CREATE TABLE public.project_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  requester_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  reason TEXT DEFAULT 'Photo upload access needed',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_access_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create their own access requests"
ON public.project_access_requests
FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can view their own requests"
ON public.project_access_requests
FOR SELECT
TO authenticated
USING (requester_id = auth.uid());

CREATE POLICY "Project members can view and manage requests for their projects"
ON public.project_access_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_team_assignments pta
    WHERE pta.project_id = project_access_requests.project_id
    AND pta.user_id = auth.uid()
  )
  OR is_admin()
);

-- Add index for faster lookups
CREATE INDEX idx_project_access_requests_project_id ON public.project_access_requests(project_id);
CREATE INDEX idx_project_access_requests_status ON public.project_access_requests(status);

-- Add updated_at trigger
CREATE TRIGGER update_project_access_requests_updated_at
BEFORE UPDATE ON public.project_access_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();