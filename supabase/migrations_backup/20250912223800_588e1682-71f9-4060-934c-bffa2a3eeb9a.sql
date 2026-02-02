-- Ensure team_chats table has voice message support
DO $$ 
BEGIN
    -- Add audio_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_chats' AND column_name = 'audio_url') THEN
        ALTER TABLE public.team_chats ADD COLUMN audio_url TEXT;
    END IF;
    
    -- Add duration column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_chats' AND column_name = 'duration') THEN
        ALTER TABLE public.team_chats ADD COLUMN duration NUMERIC;
    END IF;
END $$;