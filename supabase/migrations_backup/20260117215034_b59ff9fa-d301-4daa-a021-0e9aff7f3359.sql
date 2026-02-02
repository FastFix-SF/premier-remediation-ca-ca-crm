-- Fix client_portal_access: make client_id nullable since we primarily use project_id
ALTER TABLE public.client_portal_access 
ALTER COLUMN client_id DROP NOT NULL;

-- Add project_id to client_chatbot_conversations for project-based lookup
ALTER TABLE public.client_chatbot_conversations 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- Make client_id nullable in chatbot conversations
ALTER TABLE public.client_chatbot_conversations 
ALTER COLUMN client_id DROP NOT NULL;

-- Create index for project lookup on chatbot conversations
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_project 
ON public.client_chatbot_conversations(project_id);