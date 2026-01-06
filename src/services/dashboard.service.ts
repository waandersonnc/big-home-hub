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
     * Busca a empresa do user (manager/realtor) pelo company_id
     */
    async getUserCompany(userId: string): Promise<RealEstateCompany | null> {
        try {
            // No banco real, a tabela users tem a coluna company_id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('company_id')
                .eq('id', userId)
                .single();

            if (userError || !userData?.company_id) {
                logger.error('Erro ao buscar company_id do user:', userError?.message);
                return null;
            }

            // Depois buscar a empresa
            const { data, error } = await supabase
                .from('real_estate_companies')
                .select('*')
                .eq('id', userData.company_id)
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
     * Busca estatísticas de uma empresa específica
     */
    async getCompanyStats(companyId: string): Promise<DashboardStats> {
        try {
            // Buscar leads da empresa (usando 'stage' em vez de 'status')
            const { data: leads, error: leadsError } = await supabase
                .from('leads')
                .select('id, stage')
                .eq('company_id', companyId);

            if (leadsError) {
                logger.error('Erro ao buscar leads:', leadsError.message);
            }

            const allLeads = leads || [];
            const docsLeads = allLeads.filter(l => l.stage === 'proposal');
            const salesLeads = allLeads.filter(l => l.stage === 'won');

            // Buscar equipe da empresa (usando 'role' em vez de 'user_type')
            const { data: team, error: teamError } = await supabase
                .from('users')
                .select('id, role')
                .eq('company_id', companyId)
                .in('role', ['manager', 'realtor']);

            if (teamError) {
                logger.error('Erro ao buscar equipe:', teamError.message);
            }

            const teamCount = team?.length || 0;

            // Calcular faturamento (ticket médio de R$ 450.000 para refletir o mercado luxo do demo)
            const averageTicket = 450000;
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
     */
    async getOwnerOverviewStats(ownerId: string): Promise<OverviewStats> {
        try {
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
                .select('id, stage, company_id')
                .in('company_id', companyIds);

            if (leadsError) {
                logger.error('Erro ao buscar leads overview:', leadsError.message);
            }

            const allLeads = leads || [];
            const salesLeads = allLeads.filter(l => l.stage === 'won');

            // Buscar toda equipe de todas as empresas
            const { data: team, error: teamError } = await supabase
                .from('users')
                .select('id')
                .in('company_id', companyIds)
                .in('role', ['manager', 'realtor']);

            if (teamError) {
                logger.error('Erro ao buscar equipe overview:', teamError.message);
            }

            const teamCount = team?.length || 0;

            const averageTicket = 450000;
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

            // Mapear 'stage' para 'status' se o componente esperar 'status'
            return (data || []).map(l => ({
                ...l,
                status: l.stage
            }));
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
            const { data: agents, error } = await supabase
                .from('users')
                .select('id, name, role, phone')
                .eq('company_id', companyId)
                .in('role', ['manager', 'realtor'])
                .eq('active', true);

            if (error) {
                logger.error('Erro ao buscar agentes:', error.message);
                return [];
            }

            if (!agents || agents.length === 0) {
                return [];
            }

            const agentsWithSales = await Promise.all(
                agents.map(async (agent) => {
                    const { count } = await supabase
                        .from('leads')
                        .select('id', { count: 'exact', head: true })
                        .eq('company_id', companyId)
                        .eq('assigned_to', agent.id)
                        .eq('stage', 'won');

                    return {
                        ...agent,
                        full_name: agent.name, // mapeia name para full_name
                        user_type: agent.role === 'realtor' ? 'broker' : agent.role, // mapeia realtor para broker
                        sales: count || 0
                    };
                })
            );

            return agentsWithSales
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
                .is('assigned_to', null)
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
     * Busca todos os membros da equipe de uma empresa
     */
    async listTeam(companyId: string) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('company_id', companyId)
                .in('role', ['manager', 'realtor']);

            if (error) {
                logger.error('Erro ao buscar equipe:', error.message);
                return [];
            }

            return (data || []).map(u => ({
                ...u,
                full_name: u.name,
                user_type: u.role === 'realtor' ? 'broker' : u.role
            }));
        } catch (error) {
            logger.error('Erro em listTeam:', (error as Error).message);
            return [];
        }
    }
};

