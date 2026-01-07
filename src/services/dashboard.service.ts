/**
 * Dashboard Service - Gerencia os dados do dashboard
 * Busca dados do Supabase baseado no tipo de usuário (owner, manager, broker)
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface RealEstateCompany {
    id: string;
    name: string;
    logo_url?: string | null;
    company_logo_url?: string | null;
    owner_id: string;
    cnpj?: string;
    phone?: string;
}

export interface DashboardStats {
    totalLeads: number;
    totalDocs: number;
    totalSales: number;
    totalRevenue: number;
    managersCount: number;
    brokersCount: number;
    teamCount: number; // For backward compatibility if needed
    totalProperties: number;
}

export interface OverviewStats {
    totalLeads: number;
    totalSales: number;
    totalRevenue: number;
    totalCompanies: number;
    managersCount: number;
    brokersCount: number;
    totalProperties: number;
}

export interface CompanyStats {
    id: string;
    name: string;
    leads: number;
    revenue: number;
}

// ============================================
// SERVICE
// ============================================

export const dashboardService = {
    /**
     * Busca a primeira imobiliária do owner logado
     */
    async getOwnerFirstCompany(ownerId: string): Promise<RealEstateCompany | null> {
        try {
            const { data, error } = await supabase
                .from('real_estate_companies')
                .select('*')
                .eq('owner_id', ownerId)
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (error) {
                logger.error('Erro ao buscar empresa do owner:', error.message);
                return null;
            }

            // Mapear campos reais para a interface se necessário
            if (data) {
                return {
                    id: data.id,
                    name: data.name,
                    logo_url: data.logo_url,
                    owner_id: data.owner_id,
                    cnpj: data.document,
                    phone: data.phone
                };
            }

            return null;
        } catch (error) {
            logger.error('Erro em getOwnerFirstCompany:', (error as Error).message);
            return null;
        }
    },

    /**
     * Busca todas as imobiliárias do owner
     */
    async getOwnerCompanies(ownerId: string): Promise<RealEstateCompany[]> {
        try {
            const { data, error } = await supabase
                .from('real_estate_companies')
                .select('*')
                .eq('owner_id', ownerId)
                .order('created_at', { ascending: true });

            if (error) {
                logger.error('Erro ao buscar empresas do owner:', error.message);
                return [];
            }

            return (data || []).map(c => ({
                id: c.id,
                name: c.name,
                logo_url: c.logo_url,
                owner_id: c.owner_id,
                cnpj: c.document,
                phone: c.phone
            }));
        } catch (error) {
            logger.error('Erro em getOwnerCompanies:', (error as Error).message);
            return [];
        }
    },

    /**
     * Busca informações de uma empresa específica
     */
    async getCompanyInfo(companyId: string) {
        try {
            const { data, error } = await supabase
                .from('real_estate_companies')
                .select('*')
                .eq('id', companyId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Erro em getCompanyInfo:', (error as Error).message);
            return null;
        }
    },

    /**
     * Atualiza a meta de uma imobiliária
     */
    async updateCompanyMeta(companyId: string, meta: number) {
        try {
            const { error } = await supabase
                .from('real_estate_companies')
                .update({ meta })
                .eq('id', companyId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            logger.error('Erro em updateCompanyMeta:', (error as Error).message);
            return { success: false, error: (error as Error).message };
        }
    },

    /**
     * Busca a empresa do user (manager/broker) pelo company_id
     */
    async getUserCompany(userId: string): Promise<RealEstateCompany | null> {
        try {
            // Check if user is a manager
            const { data: managerData } = await supabase
                .from('managers')
                .select('company_id')
                .eq('id', userId)
                .maybeSingle();

            let companyId = managerData?.company_id;

            // If not a manager, check if broker
            if (!companyId) {
                const { data: brokerData } = await supabase
                    .from('brokers')
                    .select('company_id')
                    .eq('id', userId)
                    .maybeSingle();
                companyId = brokerData?.company_id;
            }

            if (!companyId) {
                logger.error('Empresa não encontrada para o usuário:', userId);
                return null;
            }

            // Depois buscar a empresa
            const { data, error } = await supabase
                .from('real_estate_companies')
                .select('*')
                .eq('id', companyId)
                .single();

            if (error) {
                logger.error('Erro ao buscar empresa:', error.message);
                return null;
            }

            return {
                id: data.id,
                name: data.name,
                logo_url: data.logo_url,
                owner_id: data.owner_id,
                cnpj: data.document,
                phone: data.phone
            };
        } catch (error) {
            logger.error('Erro em getUserCompany:', (error as Error).message);
            return null;
        }
    },

    /**
     * Busca estatísticas de uma empresa específica com filtro de período
     */
    async getCompanyStats(companyId: string, period: 'month' | 'lastMonth' | 'year' = 'month'): Promise<DashboardStats> {
        try {
            const now = new Date();
            let startDate: string;
            let endDate: string | null = null;

            if (period === 'month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            } else if (period === 'lastMonth') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
            } else if (period === 'year') {
                // Últimos 12 meses (Mês atual + 11 meses anteriores)
                startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();
            } else {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            }

            // Buscar leads da empresa filtrados por data
            let leadsQuery = supabase
                .from('leads')
                .select('id, stage')
                .eq('company_id', companyId)
                .gte('created_at', startDate);

            if (endDate) leadsQuery = leadsQuery.lte('created_at', endDate);

            const { data: leads, error: leadsError } = await leadsQuery;

            if (leadsError) {
                logger.error('Erro ao buscar leads:', leadsError.message);
            }

            const allLeads = leads || [];
            const docsLeads = allLeads.filter(l => l.stage === 'documentação' || l.stage === 'Proposta');
            const salesLeads = allLeads.filter(l => l.stage === 'comprou' || l.stage === 'Contrato');

            // Buscar equipe (não filtrada por data, pois reflete o time atual)
            const [{ count: managersCount }, { count: brokersCount }] = await Promise.all([
                supabase.from('managers').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
                supabase.from('brokers').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
            ]);

            const teamCount = (managersCount || 0) + (brokersCount || 0);

            // Faturamento filtrado por data
            let revenueQuery = supabase
                .from('financial_transactions')
                .select('total_amount, type')
                .eq('company_id', companyId)
                .in('type', ['sale', 'Receita', 'Venda'])
                .eq('status', 'paid')
                .gte('created_at', startDate);

            if (endDate) revenueQuery = revenueQuery.lte('created_at', endDate);

            const { data: transactions } = await revenueQuery;

            const totalRevenue = transactions?.reduce((acc, tx) => acc + (Number(tx.total_amount) || 0), 0) || 0;

            // Total de imóveis (não filtrado por data)
            const { count: propertiesCount } = await supabase
                .from('properties')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .eq('active', true);

            return {
                totalLeads: allLeads.length,
                totalDocs: docsLeads.length,
                totalSales: salesLeads.length,
                totalRevenue,
                managersCount: managersCount || 0,
                brokersCount: brokersCount || 0,
                teamCount,
                totalProperties: propertiesCount || 0
            };
        } catch (error) {
            logger.error('Erro em getCompanyStats:', (error as Error).message);
            return {
                totalLeads: 0,
                totalDocs: 0,
                totalSales: 0,
                totalRevenue: 0,
                managersCount: 0,
                brokersCount: 0,
                teamCount: 0,
                totalProperties: 0
            };
        }
    },

    /**
     * Busca dados formatados para o gráfico de funil baseado no período
     */
    async getChartData(companyId: string, period: 'month' | 'lastMonth' | 'year' = 'month') {
        try {
            const now = new Date();
            let startDate: Date;
            let endDate: Date;
            let isDaily = period !== 'year';

            if (period === 'month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            } else if (period === 'lastMonth') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            } else {
                // Últimos 12 meses rolantes
                startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            }

            // Buscar Leads e Transações para o período
            const [leadsResponse, transactionsResponse] = await Promise.all([
                supabase.from('leads').select('created_at, stage').eq('company_id', companyId).gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
                supabase.from('financial_transactions').select('created_at, total_amount, type').eq('company_id', companyId).eq('status', 'paid').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
            ]);

            const leads = leadsResponse.data || [];
            const transactions = transactionsResponse.data || [];

            const chartPoints: any[] = [];

            if (isDaily) {
                const daysInMonth = endDate.getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                    const dayLeads = leads.filter(l => new Date(l.created_at).getUTCDate() === i);
                    const daySales = leads.filter(l => new Date(l.created_at).getUTCDate() === i && (l.stage === 'comprou' || l.stage === 'Contrato' || l.stage === 'vendido'));
                    const dayDocs = leads.filter(l => new Date(l.created_at).getUTCDate() === i && (l.stage === 'documentação' || l.stage === 'Proposta'));
                    const dayRevenue = transactions.filter(t => new Date(t.created_at).getUTCDate() === i && ['sale', 'Venda', 'Receita'].includes(t.type)).reduce((acc, t) => acc + (Number(t.total_amount) || 0), 0);

                    chartPoints.push({
                        date: i < 10 ? `0${i}` : `${i}`,
                        fullDate: `${i}/${startDate.getMonth() + 1}`,
                        leads: dayLeads.length,
                        docs: dayDocs.length,
                        sales: daySales.length,
                        revenue: dayRevenue
                    });
                }
            } else {
                // Loop pelos últimos 12 meses a partir do startDate
                for (let i = 0; i < 12; i++) {
                    const currentMonthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
                    const month = currentMonthDate.getMonth();
                    const year = currentMonthDate.getFullYear();

                    const monthLeads = leads.filter(l => {
                        const d = new Date(l.created_at);
                        return d.getUTCMonth() === month && d.getUTCFullYear() === year;
                    });
                    const monthSales = leads.filter(l => {
                        const d = new Date(l.created_at);
                        return d.getUTCMonth() === month && d.getUTCFullYear() === year && (l.stage === 'comprou' || l.stage === 'Contrato' || l.stage === 'vendido');
                    });
                    const monthDocs = leads.filter(l => {
                        const d = new Date(l.created_at);
                        return d.getUTCMonth() === month && d.getUTCFullYear() === year && (l.stage === 'documentação' || l.stage === 'Proposta');
                    });
                    const monthRevenue = transactions.filter(t => {
                        const d = new Date(t.created_at);
                        return d.getUTCMonth() === month && d.getUTCFullYear() === year && ['sale', 'Venda', 'Receita'].includes(t.type);
                    }).reduce((acc, t) => acc + (Number(t.total_amount) || 0), 0);

                    const monthLabel = currentMonthDate.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
                    chartPoints.push({
                        date: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
                        leads: monthLeads.length,
                        docs: monthDocs.length,
                        sales: monthSales.length,
                        revenue: monthRevenue
                    });
                }
            }

            return chartPoints;
        } catch (error) {
            logger.error('Erro em getChartData:', (error as Error).message);
            return [];
        }
    },

    /**
     * Busca estatísticas consolidadas de todas as empresas do owner
     */
    async getOwnerOverviewStats(ownerId: string): Promise<OverviewStats> {
        try {
            const companies = await this.getOwnerCompanies(ownerId);

            if (companies.length === 0) {
                return {
                    totalLeads: 0,
                    totalSales: 0,
                    totalRevenue: 0,
                    totalCompanies: 0,
                    managersCount: 0,
                    brokersCount: 0,
                    totalProperties: 0
                };
            }

            const companyIds = companies.map(c => c.id);

            // Buscar todos os leads vinculados ao owner
            const { data: leads, error: leadsError } = await supabase
                .from('leads')
                .select('id, stage, company_id')
                .eq('my_owner', ownerId);

            if (leadsError) {
                logger.error('Erro ao buscar leads overview:', leadsError.message);
            }

            const allLeads = leads || [];
            const salesLeads = allLeads.filter(l => l.stage === 'comprou');

            // Buscar toda equipe vinculada diretamente ao owner
            const { count: managersCount } = await supabase
                .from('managers')
                .select('id', { count: 'exact', head: true })
                .eq('my_owner', ownerId);

            const { count: brokersCount } = await supabase
                .from('brokers')
                .select('id', { count: 'exact', head: true })
                .eq('my_owner', ownerId);

            const managersTotal = managersCount || 0;
            const brokersTotal = brokersCount || 0;

            // Buscar faturamento consolidado
            const { data: revenueData } = await supabase
                .from('financial_transactions')
                .select('total_amount')
                .eq('my_owner', ownerId)
                .in('type', ['sale', 'Receita'])
                .eq('status', 'paid');

            const totalRevenue = revenueData?.reduce((acc, tx) => acc + (Number(tx.total_amount) || 0), 0) || 0;

            // Buscar total de imóveis
            const { count: propertiesCount } = await supabase
                .from('properties')
                .select('id', { count: 'exact', head: true })
                .eq('my_owner', ownerId)
                .eq('active', true);

            return {
                totalLeads: allLeads.length,
                totalSales: salesLeads.length,
                totalRevenue,
                totalCompanies: companies.length,
                managersCount: managersTotal,
                brokersCount: brokersTotal,
                totalProperties: propertiesCount || 0
            };
        } catch (error) {
            logger.error('Erro em getOwnerOverviewStats:', (error as Error).message);
            return {
                totalLeads: 0,
                totalSales: 0,
                totalRevenue: 0,
                totalCompanies: 0,
                managersCount: 0,
                brokersCount: 0,
                totalProperties: 0
            };
        }
    },

    /**
     * Busca estatísticas por empresa para gráficos
     */
    async getCompaniesStatsForCharts(ownerId: string): Promise<CompanyStats[]> {
        try {
            const companies = await this.getOwnerCompanies(ownerId);

            if (companies.length === 0) {
                return [];
            }

            const stats: CompanyStats[] = [];

            for (const company of companies) {
                const companyStats = await this.getCompanyStats(company.id);
                stats.push({
                    id: company.id,
                    name: company.name,
                    leads: companyStats.totalLeads,
                    revenue: companyStats.totalRevenue
                });
            }

            return stats;
        } catch (error) {
            logger.error('Erro em getCompaniesStatsForCharts:', (error as Error).message);
            return [];
        }
    },

    async getRecentLeads(companyId: string, limit: number = 4) {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('company_id', companyId)
                .eq('stage', 'novo')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                logger.error('Erro ao buscar leads recentes:', error.message);
                return [];
            }

            return data || [];
        } catch (error) {
            logger.error('Erro em getRecentLeads:', (error as Error).message);
            return [];
        }
    },

    async getTopAgents(companyId: string, limit: number = 5, period: 'month' | 'lastMonth' | 'year' = 'month') {
        try {
            const now = new Date();
            let startDate: string;
            let endDate: string | null = null;

            if (period === 'month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            } else if (period === 'lastMonth') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
            } else if (period === 'year') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();
            } else {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            }

            // Buscar apenas corretores ativos da empresa
            const { data: brokers } = await supabase
                .from('brokers')
                .select('id, name, phone')
                .eq('company_id', companyId)
                .eq('active', true);

            if (!brokers || brokers.length === 0) {
                return [];
            }

            const agentsWithSales = await Promise.all(
                brokers.map(async (broker) => {
                    let salesQuery = supabase
                        .from('leads')
                        .select('id', { count: 'exact', head: true })
                        .eq('company_id', companyId)
                        .eq('assigned_to', broker.id)
                        .in('stage', ['comprou', 'Contrato', 'vendido'])
                        .gte('created_at', startDate);

                    if (endDate) salesQuery = salesQuery.lte('created_at', endDate);

                    const { count } = await salesQuery;

                    return {
                        id: broker.id,
                        full_name: broker.name,
                        user_type: 'broker',
                        sales: count || 0,
                        avatar: broker.name?.charAt(0).toUpperCase() || 'B'
                    };
                })
            );

            return agentsWithSales
                .filter(a => a.sales > 0)
                .sort((a, b) => b.sales - a.sales)
                .slice(0, limit);
        } catch (error) {
            logger.error('Erro em getTopAgents:', (error as Error).message);
            return [];
        }
    },

    /**
     * Busca leads sem atribuição
     */
    async getUnassignedLeads(companyId: string) {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('company_id', companyId)
                .eq('stage', 'novo')
                .order('created_at', { ascending: false });

            if (error) {
                logger.error('Erro ao buscar leads sem atribuição:', error.message);
                return [];
            }

            return (data || []).map(l => ({
                ...l,
                status: l.stage
            }));
        } catch (error) {
            logger.error('Erro em getUnassignedLeads:', (error as Error).message);
            return [];
        }
    },

    /**
     * Busca as últimas 5 distribuições (leads em espera com corretor atribuído)
     */
    async getRecentDistributions(companyId: string) {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('id, name, updated_at, my_broker, brokers:my_broker(name)')
                .eq('company_id', companyId)
                .eq('stage', 'em espera')
                .order('updated_at', { ascending: false })
                .limit(5);

            if (error) {
                logger.error('Erro ao buscar distribuições recentes:', error.message);
                return [];
            }

            return (data || []).map(l => ({
                id: l.id,
                lead: l.name,
                broker: (l.brokers as any)?.name || 'N/A',
                updatedAt: l.updated_at
            }));
        } catch (error) {
            logger.error('Erro em getRecentDistributions:', (error as Error).message);
            return [];
        }
    },

    /**
     * Busca todos os leads de uma empresa
     */
    async getAllCompanyLeads(companyId: string) {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false });

            if (error) {
                logger.error('Erro ao buscar todos os leads:', error.message);
                return [];
            }

            return (data || []).map(l => ({
                ...l,
                status: l.stage
            }));
        } catch (error) {
            logger.error('Erro em getAllCompanyLeads:', (error as Error).message);
            return [];
        }
    },

    /**
     * Busca a fila de corretores (quem está a mais tempo sem receber lead)
     */
    async getBrokerQueue(companyId: string) {
        try {
            const { data, error } = await supabase
                .from('brokers')
                .select('id, name, recebeulead, leadsperdidos')
                .eq('company_id', companyId)
                .eq('active', true)
                .order('recebeulead', { ascending: true, nullsFirst: true });

            if (error) {
                logger.error('Erro ao buscar fila de corretores:', error.message);
                return [];
            }

            return (data || []).map((b, index) => ({
                id: b.id,
                name: b.name,
                position: index + 1,
                lostLeads: b.leadsperdidos || 0,
                lastLeadAt: b.recebeulead
            }));
        } catch (error) {
            logger.error('Erro em getBrokerQueue:', (error as Error).message);
            return [];
        }
    },

    /**
     * Busca todos os membros da equipe de uma empresa
     */
    async listTeam(companyId: string) {
        try {
            const { data: managers } = await supabase
                .from('managers')
                .select('*')
                .eq('company_id', companyId);

            const { data: brokers } = await supabase
                .from('brokers')
                .select('*')
                .eq('company_id', companyId);

            const combined = [
                ...(managers || []).map(m => ({ ...m, role: 'manager' })),
                ...(brokers || []).map(b => ({ ...b, role: 'broker' }))
            ];

            return combined.map(u => ({
                ...u,
                full_name: u.name,
                user_type: u.role
            }));
        } catch (error) {
            logger.error('Erro em listTeam:', (error as Error).message);
            return [];
        }
    },

    /**
     * Atualiza o estágio de um lead
     */
    async updateLeadStage(leadId: string, stage: string) {
        try {
            const { error } = await supabase
                .from('leads')
                .update({ stage })
                .eq('id', leadId);

            if (error) {
                logger.error('Erro ao atualizar estágio do lead:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            logger.error('Erro em updateLeadStage:', (error as Error).message);
            return { success: false, error: (error as Error).message };
        }
    },

    /**
     * Inicia atendimento via WhatsApp, marcando o lead como devedor de informação
     */
    async startWhatsAppLead(leadId: string, authorName: string) {
        try {
            // Primeiro buscamos o histórico atual
            const { data: lead } = await supabase
                .from('leads')
                .select('informative')
                .eq('id', leadId)
                .single();

            const history = Array.isArray(lead?.informative) ? lead.informative : [];
            const newHistory = [
                ...history,
                {
                    text: "Iniciou atendimento via WhatsApp.",
                    created_at: new Date().toISOString(),
                    author: authorName,
                    type: 'system_action'
                }
            ];

            const { error } = await supabase
                .from('leads')
                .update({
                    stage: 'em atendimento',
                    owing_information: true,
                    informative: newHistory
                })
                .eq('id', leadId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            logger.error('Erro em startWhatsAppLead:', (error as Error).message);
            return { success: false, error: (error as Error).message };
        }
    },

    /**
     * Finaliza o registro obrigatório de informações do lead
     */
    async submitLeadInformative(params: {
        leadId: string;
        stage: string;
        informativeText: string;
        authorName: string;
        closingData?: any;
        document_urls?: string[];
    }) {
        try {
            const { leadId, stage, informativeText, authorName, closingData, document_urls } = params;

            // Buscamos histórico atual
            const { data: lead } = await supabase
                .from('leads')
                .select('informative')
                .eq('id', leadId)
                .single();

            const history = Array.isArray(lead?.informative) ? lead.informative : [];
            const newHistory = [
                ...history,
                {
                    text: informativeText,
                    created_at: new Date().toISOString(),
                    author: authorName,
                    type: 'user_note',
                    next_stage: stage
                }
            ];

            const { error } = await supabase
                .from('leads')
                .update({
                    stage: stage,
                    owing_information: false,
                    informative: newHistory,
                    closing_data: closingData || {},
                    document_urls: document_urls || []
                })
                .eq('id', leadId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            logger.error('Erro em submitLeadInformative:', (error as Error).message);
            return { success: false, error: (error as Error).message };
        }
    },

    /**
     * Cria um registro de documento enviado para um lead
     */
    async createLeadDocument(params: {
        my_owner: string;
        company_id: string;
        my_manager: string;
        my_broker: string;
        lead_id: string;
        cpf: string;
        correspondent_name: string;
        income_type: 'formal' | 'informal' | 'mista';
        is_cotista: boolean;
        has_social_factor: boolean;
        file_urls: string[];
    }) {
        try {
            const { error } = await supabase
                .from('lead_documents')
                .insert([params]);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            logger.error('Erro em createLeadDocument:', (error as Error).message);
            return { success: false, error: (error as Error).message };
        }
    },

    /**
     * Busca todas as vendas de uma empresa no mês atual
     */
    async getMonthlySales(companyId: string) {
        try {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

            const { data, error } = await supabase
                .from('lead_sales')
                .select('*')
                .eq('company_id', companyId)
                .gte('created_at', firstDay)
                .lte('created_at', lastDay);

            if (error) throw error;
            return data || [];
        } catch (error) {
            logger.error('Erro em getMonthlySales:', (error as Error).message);
            return [];
        }
    },

    /**
     * Cria um registro de venda concluída para um lead
     */
    async createLeadSale(params: {
        my_owner: string;
        company_id: string;
        my_manager: string;
        my_broker: string;
        lead_id: string;
        product_type: 'apartamento' | 'casa' | 'outro';
        construction_status: 'pronto' | 'na planta';
        sale_value: number;
        payment_method?: string;
        observation?: string;
    }) {
        try {
            const { error } = await supabase
                .from('lead_sales')
                .insert([params]);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            logger.error('Erro em createLeadSale:', (error as Error).message);
            return { success: false, error: (error as Error).message };
        }
    }
};

