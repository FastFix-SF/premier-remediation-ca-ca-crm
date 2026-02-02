-- Make training-data bucket public so AI can access the files
UPDATE storage.buckets 
SET public = true 
WHERE id = 'training-data';