-- Migration to add page_id and page_name to meta_integrations
ALTER TABLE meta_integrations 
ADD COLUMN IF NOT EXISTS meta_page_id TEXT,
ADD COLUMN IF NOT EXISTS meta_page_name TEXT;
