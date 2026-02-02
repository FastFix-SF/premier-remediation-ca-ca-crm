-- Create function to sync lead status to quote_requests
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on leads table
DROP TRIGGER IF EXISTS sync_lead_status_trigger ON leads;
CREATE TRIGGER sync_lead_status_trigger
  AFTER UPDATE OF status ON leads
  FOR EACH ROW
  EXECUTE FUNCTION sync_lead_status_to_quotes();

-- Create function to sync quote status to leads
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on quote_requests table
DROP TRIGGER IF EXISTS sync_quote_status_trigger ON quote_requests;
CREATE TRIGGER sync_quote_status_trigger
  AFTER UPDATE OF status ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION sync_quote_status_to_leads();