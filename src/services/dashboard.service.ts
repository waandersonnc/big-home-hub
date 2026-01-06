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
    teamCount: number; // managers + brokers
}

export interface OverviewStats {
    totalLeads: number;
    totalRevenue: number;
    totalCompanies: number;
    teamCount: number;
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
     * Se não tiver nenhuma, retorna null
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

            return data;
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

            return data || [];
        } catch (error) {
            logger.error('Erro em getOwnerCompanies:', (error as Error).message);
            return [];
        }
    },

    /**
     * Busca a empresa do user (manager/broker) pelo company_id
     */
    async getUserCompany(userId: string): Promise<RealEstateCompany | null> {
        try {
            // Primeiro buscar o user para pegar company_id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('real_estate_company_id')
                .eq('id', userId)
                .single();

            if (userError || !userData?.real_estate_company_id) {
                logger.error('Erro ao buscar company_id do user:', userError?.message);
                return null;
            }

            // Depois buscar a empresa
            const { data, error } = await supabase
                .from('real_estate_companies')
                .select('*')
                .eq('id', userData.real_estate_company_id)
                .single();

            if (error) {
                logger.error('Erro ao buscar empresa:', error.message);
                return null;
            }

            return data;
        } catch (error) {
            logger.error('Erro em getUserCompany:', (error as Error).message);
            return null;
        }
    },

    /**
     * Busca estatísticas de uma empresa específica
     */
    async getCompanyStats(companyId: string): Promise<DashboardStats> {
        try {
            // Buscar leads da empresa
            const { data: leads, error: leadsError } = await supabase
                .from('leads')
                .select('id, status')
                .eq('company_id', companyId);

            if (leadsError) {
                logger.error('Erro ao buscar leads:', leadsError.message);
            }

            const allLeads = leads || [];
            const docsLeads = allLeads.filter(l => l.status === 'proposal');
            const salesLeads = allLeads.filter(l => l.status === 'closed');

            // Buscar equipe da empresa (managers + brokers)
            const { data: team, error: teamError } = await supabase
                .from('users')
                .select('id, user_type')
                .eq('real_estate_company_id', companyId)
                .in('user_type', ['manager', 'broker']);

            if (teamError) {
                logger.error('Erro ao buscar equipe:', teamError.message);
            }

            const teamCount = team?.length || 0;

            // Calcular faturamento (por enquanto estimativa baseada em vendas)
            // Em produção, isso viria de uma tabela de transações
            const averageTicket = 45000; // ticket médio estimado
            const totalRevenue = salesLeads.length * averageTicket;

            return {
                totalLeads: allLeads.length,
                totalDocs: docsLeads.length,
                totalSales: salesLeads.length,
                totalRevenue,
                teamCount
            };
        } catch (error) {
            logger.error('Erro em getCompanyStats:', (error as Error).message);
            return {
                totalLeads: 0,
                totalDocs: 0,
                totalSales: 0,
                totalRevenue: 0,
                teamCount: 0
            };
        }
    },

    /**
     * Busca estatísticas consolidadas de todas as empresas do owner
     * Para a página "Visão Geral"
     */
    async getOwnerOverviewStats(ownerId: string): Promise<OverviewStats> {
        try {
            // Buscar todas as empresas do owner
            const companies = await this.getOwnerCompanies(ownerId);

            if (companies.length === 0) {
                return {
                    totalLeads: 0,
                    totalRevenue: 0,
                    totalCompanies: 0,
                    teamCount: 0
                };
            }

            const companyIds = companies.map(c => c.id);

            // Buscar todos os leads de todas as empresas
            const { data: leads, error: leadsError } = await supabase
                .from('leads')
                .select('id, status, company_id')
                .in('company_id', companyIds);

            if (leadsError) {
                logger.error('Erro ao buscar leads overview:', leadsError.message);
            }

            const allLeads = leads || [];
            const salesLeads = allLeads.filter(l => l.status === 'closed');

            // Buscar toda equipe de todas as empresas
            const { data: team, error: teamError } = await supabase
                .from('users')
                .select('id')
                .in('real_estate_company_id', companyIds)
                .in('user_type', ['manager', 'broker']);

            if (teamError) {
                logger.error('Erro ao buscar equipe overview:', teamError.message);
            }

            const teamCount = team?.length || 0;

            // Calcular faturamento
            const averageTicket = 45000;
            const totalRevenue = salesLeads.length * averageTicket;

            return {
                totalLeads: allLeads.length,
                totalRevenue,
                totalCompanies: companies.length,
                teamCount
            };
        } catch (error) {
            logger.error('Erro em getOwnerOverviewStats:', (error as Error).message);
            return {
                totalLeads: 0,
                totalRevenue: 0,
                totalCompanies: 0,
                teamCount: 0
            };
        }
    },

    /**
     * Busca estatísticas por empresa para gráficos da Visão Geral
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

    /**
     * Busca leads recentes de uma empresa
     */
    async getRecentLeads(companyId: string, limit: number = 5) {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('company_id', companyId)
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

    /**
     * Busca top corretores de uma empresa
     */
    async getTopAgents(companyId: string, limit: number = 3) {
        try {
            // Buscar corretores e gerentes ativos
            const { data: agents, error } = await supabase
                .from('users')
                .select('id, full_name, user_type, phone')
                .eq('real_estate_company_id', companyId)
                .in('user_type', ['manager', 'broker'])
                .eq('active', true);

            if (error) {
                logger.error('Erro ao buscar agentes:', error.message);
                return [];
            }

            if (!agents || agents.length === 0) {
                return [];
            }

            // Para cada agente, contar suas vendas
            const agentsWithSales = await Promise.all(
                agents.map(async (agent) => {
                    const { count } = await supabase
                        .from('leads')
                        .select('id', { count: 'exact', head: true })
                        .eq('company_id', companyId)
                        .eq('broker_id', agent.id)
                        .eq('status', 'closed');

                    return {
                        ...agent,
                        sales: count || 0
                    };
                })
            );

            // Ordenar por vendas e limitar
            return agentsWithSales
                .sort((a, b) => b.sales - a.sales)
                .slice(0, limit);
        } catch (error) {
            logger.error('Erro em getTopAgents:', (error as Error).message);
            return [];
        }
    }
};
