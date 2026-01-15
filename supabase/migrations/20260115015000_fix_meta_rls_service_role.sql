-- Allow the Service Role (used by n8n/Backends) to access meta_integrations without ownership checks
-- This bypasses the need for auth.uid() matching the owner

DROP POLICY IF EXISTS "Service Role Full Access" ON meta_integrations;

CREATE POLICY "Service Role Full Access" ON meta_integrations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Optional: Ensure RLS is enabled so this policy takes effect alongside others
ALTER TABLE meta_integrations ENABLE ROW LEVEL SECURITY;
