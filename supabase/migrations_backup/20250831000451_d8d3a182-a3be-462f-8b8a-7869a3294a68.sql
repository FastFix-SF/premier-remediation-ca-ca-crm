-- Drop the restrictive constraint that only allows 'before', 'after', 'reference', 'progress'
ALTER TABLE proposal_photos DROP CONSTRAINT proposal_photos_photo_type_check;

-- The valid_photo_type constraint already allows all needed values including 'current' and 'proposed'