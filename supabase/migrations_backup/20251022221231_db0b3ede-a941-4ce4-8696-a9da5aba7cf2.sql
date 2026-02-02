-- Remove the check constraint that prevents self-conversations
ALTER TABLE public.direct_conversations 
DROP CONSTRAINT IF EXISTS direct_conversations_check;