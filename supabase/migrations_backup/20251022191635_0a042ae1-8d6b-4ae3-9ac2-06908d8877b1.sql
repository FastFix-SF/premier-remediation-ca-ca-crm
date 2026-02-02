-- Check if user exists in team_directory and update/insert accordingly
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.team_directory WHERE user_id = 'e47c4828-d1ce-4c81-ad15-feefe747cb69') THEN
    -- Update existing record
    UPDATE public.team_directory
    SET role = 'owner',
        status = 'active',
        updated_at = NOW()
    WHERE user_id = 'e47c4828-d1ce-4c81-ad15-feefe747cb69';
  ELSE
    -- Insert new record
    INSERT INTO public.team_directory (
      user_id,
      email,
      full_name,
      role,
      status,
      invited_at
    )
    VALUES (
      'e47c4828-d1ce-4c81-ad15-feefe747cb69',
      '115106196839',
      'Sebastian Runciman',
      'owner',
      'active',
      NOW()
    );
  END IF;
END $$;