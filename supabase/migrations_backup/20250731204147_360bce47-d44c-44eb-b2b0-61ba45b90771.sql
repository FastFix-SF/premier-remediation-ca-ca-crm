-- Add customer rating fields to projects table
ALTER TABLE public.projects 
ADD COLUMN customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
ADD COLUMN rating_submitted_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policy to allow customers to update ratings for their projects
CREATE POLICY "Customers can update ratings for their projects" 
ON public.projects
FOR UPDATE 
USING (customer_email = auth.email())
WITH CHECK (customer_email = auth.email());

-- Add feedback_source field to customer_feedback table to distinguish rating-based feedback
ALTER TABLE public.customer_feedback 
ADD COLUMN feedback_source TEXT DEFAULT 'general';

-- Create index for performance on rating queries
CREATE INDEX idx_projects_customer_rating ON public.projects(customer_rating) WHERE customer_rating IS NOT NULL;