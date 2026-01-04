-- 1. ADICIONAR COLUNAS NA TABELA USERS
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('owner', 'manager', 'broker'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS real_estate_company_id UUID REFERENCES real_estate_companies(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_password_reset BOOLEAN DEFAULT FALSE;

-- 2. ADICIONAR COLUNAS NA TABELA LEADS
ALTER TABLE leads ADD COLUMN IF NOT EXISTS real_estate_company_id UUID REFERENCES real_estate_companies(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES users(id);

-- 3. POLÍTICAS DE RLS PARA LEADS

-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- OWNER: Ver tudo de suas imobiliárias
CREATE POLICY "Owners can view all leads of their companies" ON leads
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM real_estate_companies
    WHERE id = leads.real_estate_company_id
    AND owner_id = auth.uid()
  )
);

-- MANAGER: Ver leads de seus corretores (e os seus próprios)
CREATE POLICY "Managers can view leads of their team" ON leads
FOR ALL USING (
  leads.manager_id = auth.uid() OR
  leads.broker_id = auth.uid()
);

-- BROKER: Ver apenas seus próprios leads
CREATE POLICY "Brokers can view only their own leads" ON leads
FOR ALL USING (
  leads.broker_id = auth.uid()
);

-- 4. POLÍTICAS PARA USERS (EQUIPE)

-- OWNER: Ver toda a equipe de suas imobiliárias
CREATE POLICY "Owners can view their team" ON users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM real_estate_companies
    WHERE id = users.real_estate_company_id
    AND owner_id = auth.uid()
  )
);

-- MANAGER: Ver apenas sua equipe de corretores
CREATE POLICY "Managers can view their brokers" ON users
FOR SELECT USING (
  users.manager_id = auth.uid()
);
