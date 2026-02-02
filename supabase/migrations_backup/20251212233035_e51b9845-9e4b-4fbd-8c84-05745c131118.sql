-- Add 'sales' role to rf_roles table
INSERT INTO rf_roles (key, label) 
VALUES ('sales', 'Sales')
ON CONFLICT (key) DO NOTHING;