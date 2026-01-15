-- Migration to ensure all necessary columns for Meta Integration exist
-- This handles lead retrieval (page access token) and business manager selection

ALTER TABLE meta_integrations 
ADD COLUMN IF NOT EXISTS meta_user_id TEXT,
ADD COLUMN IF NOT EXISTS meta_ad_account_id TEXT,
ADD COLUMN IF NOT EXISTS meta_ad_account_name TEXT,
ADD COLUMN IF NOT EXISTS meta_page_id TEXT,
ADD COLUMN IF NOT EXISTS meta_page_name TEXT,
ADD COLUMN IF NOT EXISTS meta_page_access_token TEXT,
ADD COLUMN IF NOT EXISTS meta_business_id TEXT,
ADD COLUMN IF NOT EXISTS meta_business_name TEXT,
ADD COLUMN IF NOT EXISTS my_owner UUID,
ADD COLUMN IF NOT EXISTS scope_leads BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS scope_metrics BOOLEAN DEFAULT FALSE;

-- Ensure RLS is active (just in case)
ALTER TABLE meta_integrations ENABLE ROW LEVEL SECURITY;

-- Policy to allow owners to manage their integrations
DROP POLICY IF EXISTS "Owners can manage their own meta integrations" ON meta_integrations;
CREATE POLICY "Owners can manage their own meta integrations" ON meta_integrations
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM real_estate_companies
        WHERE real_estate_companies.id = meta_integrations.company_id
        AND real_estate_companies.owner_id = auth.uid()
    )
);
