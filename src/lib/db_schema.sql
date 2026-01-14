-- ⚠️ ATENÇÃO: Este script recria TODO o banco de dados para garantir a hierarquia correta.
-- Todos os dados existentes serão perdidos.

DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS real_estate_companies CASCADE;
DROP TABLE IF EXISTS owners CASCADE;

-- 1. Tabela: owners (Donos - Topo da Hierarquia)
-- NÃO TEM company_id
CREATE TABLE owners (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  phone VARCHAR,
  profile_photo_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabela: real_estate_companies (Imobiliárias)
-- TEM owner_id
CREATE TABLE real_estate_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR NOT NULL,
  cnpj VARCHAR(18) NOT NULL,
  phone VARCHAR NOT NULL,
  company_logo_url VARCHAR,
  market_focus VARCHAR[] DEFAULT '{}',
  
  address_zipcode VARCHAR(9) NOT NULL,
  address_street VARCHAR NOT NULL,
  address_number VARCHAR NOT NULL,
  address_complement VARCHAR,
  address_neighborhood VARCHAR NOT NULL,
  address_city VARCHAR NOT NULL,
  address_state VARCHAR(2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Tabela: users (Equipe: Gerentes e Corretores)
-- TEM company_id
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES real_estate_companies(id) ON DELETE CASCADE NOT NULL,
  manager_id UUID REFERENCES users(id), -- Auto-referência para hierarquia interna
  
  full_name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR,
  user_type VARCHAR CHECK (user_type IN ('manager', 'broker', 'owner_staff')) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  needs_password_reset BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tabela: leads (Clientes/Pipeline)
-- TEM company_id
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES real_estate_companies(id) ON DELETE CASCADE NOT NULL,
  manager_id UUID REFERENCES users(id),
  broker_id UUID REFERENCES users(id),
  
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  status VARCHAR DEFAULT 'new', -- new, contact, schedule, proposal, closed
  source VARCHAR,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- Índices e Triggers
CREATE INDEX idx_companies_owner ON real_estate_companies(owner_id);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_leads_company ON leads(company_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON owners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON real_estate_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Segurança (Row Level Security)
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies Simples (Exemplo)
-- Ajuste conforme a lógica de negócios detalhada (ex: gerente vê corretores, corretor vê só seus leads)

-- OWNERS POLICIES
CREATE POLICY "owner_all_access" ON owners FOR ALL USING (auth.uid() = id);

-- COMPANIES POLICIES
CREATE POLICY "company_owner_access" ON real_estate_companies FOR ALL USING (owner_id = auth.uid());

-- USERS POLICIES (Simplificada para Owner)
CREATE POLICY "owner_view_team" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM real_estate_companies WHERE id = users.company_id AND owner_id = auth.uid())
);

-- LEADS POLICIES (Simplificada para Owner)
CREATE POLICY "owner_view_leads" ON leads FOR ALL USING (
  EXISTS (SELECT 1 FROM real_estate_companies WHERE id = leads.company_id AND owner_id = auth.uid())
);
