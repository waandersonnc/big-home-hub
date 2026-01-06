-- =============================================================================
-- SCRIPT DE DADOS DEMO COMPLETO (SCHEMA REAL) - BigHome Hub
-- =============================================================================
-- INSTRUÇÕES:
-- 1. Este script usa o schema REAL do banco de dados descoberto via introspecção.
-- 2. Já existe o owner demo: demo@bighome.com.br (UUID: f6daa179-65ad-47db-a340-0bd31b3acbf5)
-- 3. Execute no SQL Editor do Supabase.
-- =============================================================================

DO $$
DECLARE
    -- 👇 UUIDS
    demo_owner_id UUID := 'f6daa179-65ad-47db-a340-0bd31b3acbf5';
    
    -- IDs das empresas (serão gerados)
    company_centro_id UUID;
    company_zona_sul_id UUID;
    company_jardins_id UUID;
    
    -- IDs fictícios para equipe
    demo_manager_id UUID := '00000000-0000-0000-0000-000000000001';
    demo_broker_1_id UUID := '00000000-0000-0000-0000-000000000002';
    demo_broker_2_id UUID := '00000000-0000-0000-0000-000000000003';
    
BEGIN
    -- ==========================================================================
    -- 1. INSERIR OWNER DEMO
    -- ==========================================================================
    INSERT INTO owners (id, email, name, phone, validoutoken, active)
    VALUES (
        demo_owner_id,
        'demo@bighome.com.br',
        'Demo Owner',
        '(11) 99999-0000',
        TRUE,
        TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        validoutoken = TRUE;

    RAISE NOTICE '✅ Owner demo inserido/atualizado';

    -- ==========================================================================
    -- 2. INSERIR IMOBILIÁRIAS (3 unidades)
    -- ==========================================================================
    
    -- BigHome Centro
    INSERT INTO real_estate_companies (
        owner_id, name, email, document, phone, 
        zip_code, address, city, state, active
    ) VALUES (
        demo_owner_id,
        'BigHome Centro',
        'centro@bighomedemo.com',
        '12.345.678/0001-01',
        '(11) 3333-1111',
        '01310-100',
        'Av. Paulista, 1000',
        'São Paulo',
        'SP',
        TRUE
    )
    ON CONFLICT (document) DO NOTHING
    RETURNING id INTO company_centro_id;
    
    IF company_centro_id IS NULL THEN
        SELECT id INTO company_centro_id FROM real_estate_companies WHERE document = '12.345.678/0001-01';
    END IF;

    -- BigHome Zona Sul
    INSERT INTO real_estate_companies (
        owner_id, name, email, document, phone,
        zip_code, address, city, state, active
    ) VALUES (
        demo_owner_id,
        'BigHome Zona Sul',
        'zonasul@bighomedemo.com',
        '12.345.678/0002-02',
        '(11) 3333-2222',
        '04543-011',
        'Av. Faria Lima, 2000',
        'São Paulo',
        'SP',
        TRUE
    )
    ON CONFLICT (document) DO NOTHING
    RETURNING id INTO company_zona_sul_id;
    
    IF company_zona_sul_id IS NULL THEN
        SELECT id INTO company_zona_sul_id FROM real_estate_companies WHERE document = '12.345.678/0002-02';
    END IF;

    -- BigHome Jardins
    INSERT INTO real_estate_companies (
        owner_id, name, email, document, phone,
        zip_code, address, city, state, active
    ) VALUES (
        demo_owner_id,
        'BigHome Jardins',
        'jardins@bighomedemo.com',
        '12.345.678/0003-03',
        '(11) 3333-3333',
        '01426-001',
        'Rua Oscar Freire, 500',
        'São Paulo',
        'SP',
        TRUE
    )
    ON CONFLICT (document) DO NOTHING
    RETURNING id INTO company_jardins_id;
    
    IF company_jardins_id IS NULL THEN
        SELECT id INTO company_jardins_id FROM real_estate_companies WHERE document = '12.345.678/0003-03';
    END IF;

    RAISE NOTICE '✅ 3 Imobiliárias inseridas';

    -- ==========================================================================
    -- 3. INSERIR GERENTE E CORRETORES
    -- ==========================================================================
    BEGIN
        INSERT INTO users (id, company_id, name, email, role, active)
        VALUES (demo_manager_id, company_centro_id, 'Carlos Gerente Demo', 'gerente.demo@bighome.com.br', 'manager', TRUE)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
        
        INSERT INTO users (id, company_id, manager_id, name, email, role, active)
        VALUES (demo_broker_1_id, company_centro_id, demo_manager_id, 'João Corretor Demo', 'corretor1.demo@bighome.com.br', 'realtor', TRUE)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
        
        INSERT INTO users (id, company_id, manager_id, name, email, role, active)
        VALUES (demo_broker_2_id, company_centro_id, demo_manager_id, 'Maria Corretora Demo', 'corretor2.demo@bighome.com.br', 'realtor', TRUE)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
        
        RAISE NOTICE '✅ Equipe inserida';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Falha ao inserir equipe (Auth restriction).';
        demo_broker_1_id := NULL;
        demo_broker_2_id := NULL;
    END;

    -- ==========================================================================
    -- 4. INSERIR LEADS
    -- ==========================================================================
    INSERT INTO leads (company_id, assigned_to, name, email, phone, stage, source) VALUES
    (company_centro_id, demo_broker_1_id, 'João Silva', 'joao.silva@email.com', '(11) 98001-0001', 'new', 'facebook'),
    (company_centro_id, demo_broker_1_id, 'Maria Santos', 'maria.santos@email.com', '(11) 98001-0002', 'contacted', 'instagram'),
    (company_centro_id, demo_broker_1_id, 'Pedro Oliveira', 'pedro.oliv@email.com', '(11) 98001-0003', 'visit_scheduled', 'website'),
    (company_centro_id, demo_broker_1_id, 'Ana Costa', 'ana.costa@email.com', '(11) 98001-0004', 'proposal', 'referral'),
    (company_centro_id, demo_broker_1_id, 'Carlos Souza', 'carlos.s@email.com', '(11) 98001-0005', 'won', 'whatsapp'),
    (company_centro_id, demo_broker_1_id, 'Fernanda Lima', 'fer.lima@email.com', '(11) 98001-0006', 'won', 'facebook'),
    (company_centro_id, demo_broker_2_id, 'Roberto Almeida', 'rob.alm@email.com', '(11) 98001-0007', 'won', 'instagram'),
    (company_centro_id, demo_broker_2_id, 'Juliana Dias', 'ju.dias@email.com', '(11) 98001-0008', 'new', 'website'),
    (company_centro_id, NULL, 'Lucas Martins', 'lucas.m@email.com', '(11) 98001-0009', 'contacted', 'referral'),
    
    (company_zona_sul_id, NULL, 'Olivia Pereira', 'olivia.p@email.com', '(11) 97001-0001', 'new', 'facebook'),
    (company_zona_sul_id, NULL, 'Paulo Ribeiro', 'paulo.r@email.com', '(11) 97001-0002', 'won', 'instagram'),
    (company_zona_sul_id, NULL, 'Raquel Alves', 'raquel.a@email.com', '(11) 97001-0003', 'contacted', 'website'),
    
    (company_jardins_id, NULL, 'Bruno Melo', 'bruno.m@email.com', '(11) 96001-0001', 'new', 'facebook'),
    (company_jardins_id, NULL, 'Camila Nunes', 'camila.n@email.com', '(11) 96001-0002', 'won', 'instagram');

    RAISE NOTICE '✅ Leads inseridos!';

END $$;
