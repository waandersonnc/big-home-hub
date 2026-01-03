import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Use dynamic import to ensure dotenv.config() has run before supabase.ts is evaluated
const { supabase } = await import('./src/lib/supabase.ts')

async function testConnection() {
    console.log('🧪 Testando conexão com Supabase...\n')

    // ========================================
    // TESTE 1: Buscar Imóveis
    // ========================================
    console.log('📦 TESTE 1: Buscando imóveis...')
    const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('*')
        .limit(3)

    if (propError) {
        console.error('❌ Erro ao buscar imóveis:', propError.message)
    } else {
        console.log(`✅ Imóveis encontrados: ${properties.length}`)
        if (properties.length > 0) {
            console.log(`   Primeiro: ${properties[0].title} - R$ ${properties[0].price.toLocaleString('pt-BR')}`)
        }
    }

    // ========================================
    // TESTE 2: Buscar Leads
    // ========================================
    console.log('\n👥 TESTE 2: Buscando leads...')
    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .limit(5)

    if (leadError) {
        console.error('❌ Erro ao buscar leads:', leadError.message)
    } else {
        console.log(`✅ Leads encontrados: ${leads.length}`)
        if (leads.length > 0) {
            console.log(`   Primeiro: ${leads[0].name} (${leads[0].stage})`)
        }
    }

    // ========================================
    // TESTE 3: Buscar Usuários (Equipe)
    // ========================================
    console.log('\n🧑‍💼 TESTE 3: Buscando usuários...')
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')

    if (userError) {
        console.error('❌ Erro ao buscar usuários:', userError.message)
    } else {
        console.log(`✅ Usuários encontrados: ${users.length}`)
        users.forEach(u => {
            const roleLabel = u.role === 'manager' ? 'Gerente' : 'Corretor'
            console.log(`   - ${u.name} (${roleLabel}) - Comissão: ${u.commission_percentage}%`)
        })
    }

    // ========================================
    // TESTE 4: Buscar Imobiliária
    // ========================================
    console.log('\n🏢 TESTE 4: Buscando imobiliária...')
    const { data: companies, error: companyError } = await supabase
        .from('real_estate_companies')
        .select('*')
        .limit(1)

    if (companyError) {
        console.error('❌ Erro ao buscar imobiliária:', companyError.message)
    } else {
        console.log(`✅ Imobiliária encontrada: ${companies[0]?.name}`)
        console.log(`   CNPJ: ${companies[0]?.document}`)
        console.log(`   Cidade: ${companies[0]?.city}/${companies[0]?.state}`)
    }

    // ========================================
    // TESTE 5: Buscar Transação Financeira
    // ========================================
    console.log('\n💰 TESTE 5: Buscando transações...')
    const { data: transactions, error: transError } = await supabase
        .from('financial_transactions')
        .select('*, commissions(*)')
        .limit(1)

    if (transError) {
        console.error('❌ Erro ao buscar transações:', transError.message)
    } else {
        if (transactions.length > 0) {
            const t = transactions[0]
            console.log(`✅ Transação encontrada:`)
            console.log(`   Valor: R$ ${t.total_amount.toLocaleString('pt-BR')}`)
            console.log(`   Status: ${t.status}`)
            console.log(`   Comissões: ${t.commissions?.length || 0} registros`)
        } else {
            console.log('⚠️ Nenhuma transação encontrada (esperado se não houver vendas)')
        }
    }

    // ========================================
    // TESTE 6: Contar todos os dados DEMO
    // ========================================
    console.log('\n📊 TESTE 6: Resumo dos dados DEMO...')

    const countQuery = async (table) => {
        const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('company_id', '00000000-0000-0000-0000-000000000002')
        return count || 0
    }

    const demoProperties = await countQuery('properties')
    const demoLeads = await countQuery('leads')
    const demoUsers = await countQuery('users')

    console.log(`   Imóveis DEMO: ${demoProperties}`)
    console.log(`   Leads DEMO: ${demoLeads}`)
    console.log(`   Usuários DEMO: ${demoUsers}`)

    // ========================================
    // RESULTADO FINAL
    // ========================================
    console.log('\n' + '='.repeat(50))
    if (!propError && !leadError && !userError && !companyError) {
        console.log('🎉 SUCESSO! Todas as conexões funcionaram!')
        console.log('✅ Supabase está configurado corretamente')
        console.log('✅ Dados de demonstração estão acessíveis')
        console.log('✅ Pronto para integrar com o frontend!')
    } else {
        console.log('⚠️ Alguns testes falharam. Revise os erros acima.')
    }
    console.log('='.repeat(50))
}

// Executar testes
testConnection()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n💥 Erro fatal:', err)
        process.exit(1)
    })
