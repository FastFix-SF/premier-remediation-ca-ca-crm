-- Fix infinite recursion in user_roles policy
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;

-- Allow service role to manage user_roles  
CREATE POLICY "Service role can manage user_roles" 
ON user_roles 
FOR ALL 
USING (current_setting('role') = 'service_role');

-- Clear and populate site_content table with roofing-specific content
DELETE FROM site_content;

INSERT INTO site_content (title, url, content_type, category, content, keywords, search_score) VALUES
('R-Panel Metal Roofing', '/metal-roof-panels', 'product', 'Products', 'Durable 26-gauge steel R-Panel roofing for residential and commercial applications. Multiple color options, 25-year warranty. Expert installation available.', ARRAY['r-panel', 'metal roofing', '26 gauge', 'steel', 'residential', 'commercial', 'warranty'], 10),
('Standing Seam Systems', '/standing-seam-systems', 'product', 'Products', 'Premium 24-gauge standing seam metal roofing with concealed fasteners. Superior weather protection and modern aesthetics for high-end projects.', ARRAY['standing seam', 'concealed fasteners', '24 gauge', 'premium', 'weather protection'], 10),
('Metal Roof Installation', '/metal-roof-installation', 'service', 'Services', 'Professional metal roof installation by licensed contractors. Custom fabrication, on-site installation, fully insured with lifetime craftsmanship warranty.', ARRAY['installation', 'contractors', 'licensed', 'insured', 'warranty', 'fabrication'], 9),
('Residential Roofing', '/residential-roofing', 'service', 'Services', 'Complete residential roofing solutions including metal panels, shingles, repairs, and replacements. Serving San Francisco Bay Area homeowners.', ARRAY['residential', 'homes', 'shingles', 'repairs', 'replacement', 'bay area'], 8),
('Commercial Roofing', '/commercial-roofing', 'service', 'Services', 'Large-scale commercial roofing projects including warehouses, office buildings, and industrial facilities. Metal roofing systems built to last.', ARRAY['commercial', 'warehouses', 'office buildings', 'industrial', 'large scale'], 8),
('Roof Repair & Maintenance', '/roof-repair-maintenance', 'service', 'Services', 'Emergency roof repairs, leak fixes, and preventive maintenance. 24/7 emergency service for urgent roofing issues in the Bay Area.', ARRAY['repair', 'maintenance', 'emergency', 'leak', '24/7', 'urgent'], 9),
('Roofing Materials Guide', '/store', 'faq', 'Education', 'Complete guide to roofing materials including metal panels, gauges, colors, and applications. Compare R-Panel vs Standing Seam systems.', ARRAY['materials', 'guide', 'gauges', 'colors', 'comparison', 'education'], 7),
('Bay Area Service Areas', '/services', 'service', 'Locations', 'We serve San Francisco, Oakland, Hayward, Walnut Creek, Tiburon, Petaluma, and all San Mateo County locations.', ARRAY['san francisco', 'oakland', 'hayward', 'walnut creek', 'tiburon', 'petaluma', 'san mateo'], 6),
('Get Free Quote', '/contact', 'service', 'Contact', 'Request a free roofing estimate. Our experts will assess your project and provide detailed pricing for materials and installation.', ARRAY['quote', 'estimate', 'free', 'pricing', 'assessment', 'consultation'], 10),
('Roofing Projects Gallery', '/projects', 'faq', 'Gallery', 'View completed roofing projects throughout the Bay Area. See before and after photos of residential and commercial installations.', ARRAY['projects', 'gallery', 'photos', 'before after', 'completed'], 5);