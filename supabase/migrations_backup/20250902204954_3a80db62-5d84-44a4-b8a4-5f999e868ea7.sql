-- Fix the infinite recursion issue by removing the problematic trigger
-- The auto_cleanup_expired_tokens trigger causes infinite loops

-- Remove the trigger that's causing recursion
DROP TRIGGER IF EXISTS auto_cleanup_expired_tokens_trigger ON public.team_directory;

-- The cleanup function can still be called manually when needed
-- This prevents the infinite recursion while keeping the cleanup functionality available