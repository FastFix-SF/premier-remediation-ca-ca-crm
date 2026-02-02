-- Add Downspouts items to the quote
DO $$
DECLARE
  current_items jsonb;
  new_downspouts_items jsonb;
BEGIN
  -- Get current items
  SELECT rf_items INTO current_items
  FROM quote_requests
  WHERE id = 'd38f1c58-c166-4aad-8348-ad91c4c01b44';

  -- Remove existing Downspouts items
  current_items := (
    SELECT jsonb_agg(item)
    FROM jsonb_array_elements(COALESCE(current_items, '[]'::jsonb)) item
    WHERE item->>'category' != 'Downspouts'
  );

  -- Define new Downspouts items
  new_downspouts_items := '[
    {"id": "downspout-1", "name": "Install All 1 Story Downspout Aluminum 10''", "category": "Downspouts", "coverage": "1", "labor": "47.30", "material": "65.00", "factor": "1.00", "total": "112.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-2", "name": "Install all 2 Story Downspout Aluminum 20''", "category": "Downspouts", "coverage": "1", "labor": "73.50", "material": "85.00", "factor": "1.00", "total": "158.50", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-3", "name": "Install Roof scupper 24 gage Galvanized 4x4", "category": "Downspouts", "coverage": "1", "labor": "47.30", "material": "70.00", "factor": "1.00", "total": "117.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-4", "name": "Install Roof scupper TPO/PVC 4x4", "category": "Downspouts", "coverage": "1", "labor": "68.30", "material": "45.00", "factor": "1.00", "total": "113.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-5", "name": "Install 2\" TPO/PVC Drain outlet", "category": "Downspouts", "coverage": "1", "labor": "68.30", "material": "56.00", "factor": "1.00", "total": "124.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-6", "name": "Install 3\" TPO/PVC Drain outlet", "category": "Downspouts", "coverage": "1", "labor": "68.30", "material": "64.00", "factor": "1.00", "total": "132.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-7", "name": "Install 2\" Galvanized Drain outlet", "category": "Downspouts", "coverage": "1", "labor": "68.30", "material": "15.00", "factor": "1.00", "total": "83.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-8", "name": "Remove and re install Drain Compression Ring", "category": "Downspouts", "coverage": "1", "labor": "131.30", "material": "65.00", "factor": "1.00", "total": "196.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-9", "name": "Install New Leader head", "category": "Downspouts", "coverage": "1", "labor": "68.30", "material": "85.00", "factor": "1.00", "total": "153.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-10", "name": "Install 3x3 Corrugated or smooth Downspout Two Story", "category": "Downspouts", "coverage": "1", "labor": "236.30", "material": "150.00", "factor": "1.00", "total": "386.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-11", "name": "Install 3\" Round Downspout I Story", "category": "Downspouts", "coverage": "1", "labor": "131.30", "material": "150.00", "factor": "1.00", "total": "281.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-12", "name": "Install 3\" Round Downspout 2 Story", "category": "Downspouts", "coverage": "1", "labor": "236.30", "material": "250.00", "factor": "1.00", "total": "486.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-13", "name": "Install 3\" Round Downspout 3 Story", "category": "Downspouts", "coverage": "1", "labor": "341.30", "material": "350.00", "factor": "1.00", "total": "691.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-14", "name": "Install 3\" Round Downspout 4 Story", "category": "Downspouts", "coverage": "1", "labor": "472.50", "material": "475.00", "factor": "1.00", "total": "947.50", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-15", "name": "Repair Downspouts as needed.", "category": "Downspouts", "coverage": "1", "labor": "236.30", "material": "45.00", "factor": "1.00", "total": "281.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-16", "name": "Install 3\" Galvanized Drop outlet Drain.", "category": "Downspouts", "coverage": "1", "labor": "26.30", "material": "45.00", "factor": "1.00", "total": "71.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-17", "name": "Install 2x3 Rectangular spouts kynar pre painted 1 Story", "category": "Downspouts", "coverage": "1", "labor": "73.50", "material": "40.00", "factor": "1.00", "total": "113.50", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-18", "name": "Install 2x3 Rectangular spouts kynar pre painted 2 Story", "category": "Downspouts", "coverage": "1", "labor": "105.00", "material": "70.00", "factor": "1.00", "total": "175.00", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-19", "name": "Install New commercial drain assembly,", "category": "Downspouts", "coverage": "1", "labor": "656.30", "material": "225.00", "factor": "1.00", "total": "881.30", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-20", "name": "Install all 3 Story Downspout Aluminum 30''", "category": "Downspouts", "coverage": "1", "labor": "94.50", "material": "105.00", "factor": "1.00", "total": "199.50", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-21", "name": "Install 3x4 Steel Downspouts 1 Story kynar coated", "category": "Downspouts", "coverage": "1", "labor": "73.50", "material": "65.00", "factor": "1.00", "total": "138.50", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null},
    {"id": "downspout-22", "name": "Install 3x4 Steel Downspouts 2 Story kynar coated", "category": "Downspouts", "coverage": "1", "labor": "125.00", "material": "110.00", "factor": "1.00", "total": "235.00", "unit": "$/Ea.", "isVisible": true, "showInProposal": true, "image": null}
  ]'::jsonb;

  -- Merge the items
  current_items := COALESCE(current_items, '[]'::jsonb) || new_downspouts_items;

  -- Update the quote
  UPDATE quote_requests
  SET rf_items = current_items,
      updated_at = NOW()
  WHERE id = 'd38f1c58-c166-4aad-8348-ad91c4c01b44';
END $$;