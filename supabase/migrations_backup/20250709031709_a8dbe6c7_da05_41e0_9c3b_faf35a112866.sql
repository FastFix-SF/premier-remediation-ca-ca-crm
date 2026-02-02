
-- Add photo_tag column to project_photos table
ALTER TABLE project_photos 
ADD COLUMN photo_tag TEXT CHECK (photo_tag IN ('before', 'after') OR photo_tag IS NULL);

-- Add an index for better query performance when filtering by photo_tag
CREATE INDEX idx_project_photos_photo_tag ON project_photos(photo_tag) WHERE photo_tag IS NOT NULL;

-- Add an index for project_id and photo_tag combination for efficient filtering
CREATE INDEX idx_project_photos_project_photo_tag ON project_photos(project_id, photo_tag) WHERE photo_tag IS NOT NULL;
