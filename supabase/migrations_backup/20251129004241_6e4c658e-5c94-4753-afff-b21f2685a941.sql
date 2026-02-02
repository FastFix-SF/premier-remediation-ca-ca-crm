-- Fix search_path for sync functions to resolve security warning
CREATE OR REPLACE FUNCTION sync_lead_status_to_quotes()
RETURNS TRIGGER AS $$
BEGIN
  -- When a lead status is updated, update matching quote_requests by email
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE quote_requests
    SET status = NEW.status,
        updated_at = now()
    WHERE LOWER(email) = LOWER(NEW.email)
      AND status IS DISTINCT FROM NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION sync_quote_status_to_leads()
RETURNS TRIGGER AS $$
BEGIN
  -- When a quote status is updated, update matching leads by email
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE leads
    SET status = NEW.status,
        updated_at = now()
    WHERE LOWER(email) = LOWER(NEW.email)
      AND status IS DISTINCT FROM NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';