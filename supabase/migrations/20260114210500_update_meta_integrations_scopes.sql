-- Add scope columns to meta_integrations table
ALTER TABLE meta_integrations 
ADD COLUMN IF NOT EXISTS scope_leads BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS scope_metrics BOOLEAN DEFAULT FALSE;
