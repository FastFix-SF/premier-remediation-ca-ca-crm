-- Roof Quoter MVP Database Schema
-- Create enum for edge labels
CREATE TYPE edge_label AS ENUM ('EAVE','RAKE','RIDGE','HIP','VALLEY','STEP','WALL','PITCH_CHANGE');

-- Projects table (already exists, but we need to ensure it has the required fields)
-- We'll create a roof_quoter_projects table to store quoter-specific data

-- Roof Quoter Projects (extends existing projects)
CREATE TABLE IF NOT EXISTS roof_quoter_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id)
);

-- Imagery Assets
CREATE TABLE imagery_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  vendor TEXT NOT NULL,
  url TEXT NOT NULL,
  capture_date DATE,
  bounds_geojson JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Roof Facets (polygons with properties)
CREATE TABLE facets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  polygon_geojson JSONB NOT NULL,
  pitch DECIMAL DEFAULT 4.0,
  story INTEGER DEFAULT 1,
  flags JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Roof Edges (with labels and measurements)
CREATE TABLE edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  facet_id UUID REFERENCES facets(id) ON DELETE SET NULL,
  line_geojson JSONB NOT NULL,
  label edge_label NOT NULL,
  length_ft NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pins (items like skylights, vents, etc.)
CREATE TABLE pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  size TEXT,
  qty INTEGER DEFAULT 1,
  position_point_geojson JSONB NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Calculated Quantities
CREATE TABLE quantities (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  area_sq NUMERIC DEFAULT 0,
  eave_lf NUMERIC DEFAULT 0,
  rake_lf NUMERIC DEFAULT 0,
  ridge_lf NUMERIC DEFAULT 0,
  hip_lf NUMERIC DEFAULT 0,
  valley_lf NUMERIC DEFAULT 0,
  wall_lf NUMERIC DEFAULT 0,
  step_lf NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Price Sheets (templates for different roofing systems)
CREATE TABLE price_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  system TEXT NOT NULL, -- 'TPO', 'METAL', 'SHINGLE'
  lines JSONB NOT NULL DEFAULT '[]', -- Array of pricing line items
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Estimates (final pricing calculations)
CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  price_sheet_id UUID REFERENCES price_sheets(id),
  settings JSONB DEFAULT '{}', -- waste%, pitch factors, labor burden, overhead%, markup%
  totals JSONB DEFAULT '{}', -- direct, op, total, tax, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE roof_quoter_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagery_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE facets ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE quantities ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admins can manage all data
CREATE POLICY "Admins can manage roof quoter projects" ON roof_quoter_projects FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins can manage imagery assets" ON imagery_assets FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins can manage facets" ON facets FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins can manage edges" ON edges FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins can manage pins" ON pins FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins can manage quantities" ON quantities FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins can manage price sheets" ON price_sheets FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Anyone can view active price sheets" ON price_sheets FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage estimates" ON estimates FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Add updated_at triggers
CREATE TRIGGER update_roof_quoter_projects_updated_at
  BEFORE UPDATE ON roof_quoter_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imagery_assets_updated_at
  BEFORE UPDATE ON imagery_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facets_updated_at
  BEFORE UPDATE ON facets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_edges_updated_at
  BEFORE UPDATE ON edges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pins_updated_at
  BEFORE UPDATE ON pins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quantities_updated_at
  BEFORE UPDATE ON quantities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_sheets_updated_at
  BEFORE UPDATE ON price_sheets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimates_updated_at
  BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert seed price sheets
INSERT INTO price_sheets (name, system, lines) VALUES 
('Standard TPO System', 'TPO', '[
  {"code":"ISO","label":"Polyiso Rigid Insulation","unit":"SQ","qtyFrom":"area_sq","wastePct":5,"unitCost":45,"markupPct":25},
  {"code":"TISO","label":"Tapered ISO (allowance)","unit":"SQ","qtyFrom":"manual","wastePct":0,"unitCost":15,"markupPct":25},
  {"code":"DD12","label":"1/2\" DensDeck","unit":"SQ","qtyFrom":"area_sq","wastePct":3,"unitCost":65,"markupPct":25},
  {"code":"TPO60","label":"60-mil TPO Membrane","unit":"SQ","qtyFrom":"area_sq","wastePct":5,"unitCost":85,"markupPct":25},
  {"code":"TERM","label":"Term Bar / Counter-Flashing","unit":"LF","qtyFrom":"wall_lf","wastePct":2,"unitCost":8,"markupPct":25},
  {"code":"DRAINS","label":"TPO Drains/Accessories","unit":"EA","qtyFrom":"pins:type=Drain","wastePct":0,"unitCost":125,"markupPct":25},
  {"code":"WALK","label":"Walk Pads","unit":"SQ","qtyFrom":"manual","wastePct":0,"unitCost":35,"markupPct":25}
]'),
('Standing Seam Metal', 'METAL', '[
  {"code":"COIL","label":"Coil (by exposure)","unit":"SQ","qtyFrom":"area_sq","wastePct":7,"unitCost":75,"markupPct":25},
  {"code":"PANEL","label":"Panel Fab/Install","unit":"SQ","qtyFrom":"area_sq","wastePct":5,"unitCost":125,"markupPct":25},
  {"code":"EAVE","label":"Eave/Drip Edge","unit":"LF","qtyFrom":"eave_lf","wastePct":3,"unitCost":12,"markupPct":25},
  {"code":"RAKE","label":"Rake/Sidewall Flashing","unit":"LF","qtyFrom":"rake_lf","wastePct":3,"unitCost":15,"markupPct":25},
  {"code":"RIDGE","label":"Ridge Cap","unit":"LF","qtyFrom":"ridge_lf","wastePct":2,"unitCost":18,"markupPct":25},
  {"code":"HIP","label":"Hip Cap","unit":"LF","qtyFrom":"hip_lf","wastePct":2,"unitCost":18,"markupPct":25},
  {"code":"VAL","label":"Valley Metal","unit":"LF","qtyFrom":"valley_lf","wastePct":2,"unitCost":22,"markupPct":25}
]');