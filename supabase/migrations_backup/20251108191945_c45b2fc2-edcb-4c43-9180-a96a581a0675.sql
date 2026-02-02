-- Add columns to store the map state when ROI image was captured
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS roi_image_center_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS roi_image_center_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS roi_image_zoom DOUBLE PRECISION DEFAULT 19,
ADD COLUMN IF NOT EXISTS roi_image_bearing DOUBLE PRECISION DEFAULT 0;

COMMENT ON COLUMN quote_requests.roi_image_center_lat IS 'Latitude of map center when ROI image was captured';
COMMENT ON COLUMN quote_requests.roi_image_center_lng IS 'Longitude of map center when ROI image was captured';
COMMENT ON COLUMN quote_requests.roi_image_zoom IS 'Zoom level when ROI image was captured';
COMMENT ON COLUMN quote_requests.roi_image_bearing IS 'Map bearing/rotation when ROI image was captured';