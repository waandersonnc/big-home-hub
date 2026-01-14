import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { demoStore } from '@/lib/demoStore';
import { logger } from '@/lib/logger';
import { useAuthContext } from './AuthContext';

interface Company {
    id: string;
    name: string;
    logo_url?: string | null;
}

interface CompanyContextType {
    selectedCompanyId: string | null;
    setSelectedCompanyId: (id: string) => void;
    companies: Company[];
    selectedCompany: Company | null;
    isLoading: boolean;
    refreshCompanies: (enableLoading?: boolean) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

// Demo companies data
const DEMO_COMPANIES: Company[] = [
    { id: 'demo-1', name: 'BigHome Centro', logo_url: null },
    { id: 'demo-2', name: 'BigHome Zona Sul', logo_url: null },
    { id: 'demo-3', name: 'BigHome Jardins', logo_url: null }
];

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user, isOwner, isManager, isBroker, isDemo: authIsDemo } = useAuthContext();

    const fetchCompanies = useCallback(async (enableLoading: boolean = true) => {
        // Check demo mode from BOTH demoStore directly AND auth context
        // This ensures we catch demo mode even if auth context hasn't re-rendered yet
        if (!user && !demoStore.isActive) {
            setCompanies([]);
            setSelectedCompanyId(null);
            setIsLoading(false);
            return;
        }

        try {
            if (enableLoading) setIsLoading(true);
            let fetchedCompanies: Company[] = [];

            if (isOwner || (authIsDemo && !user?.real_estate_company_id)) {
                // Owner (ou Demo sem ID da empresa): buscar todas as empresas que possui
                const searchId = user?.id || 'f6daa179-65ad-47db-a340-0bd31b3acbf5';
                const { data, error } = await supabase
                    .from('real_estate_companies')
                    .select('id, name, logo_url')
                    .eq('owner_id', searchId)
                    .order('created_at', { ascending: true });

                if (error) {
                    logger.error('Erro ao buscar empresas do owner:', error.message);
                } else if (data && data.length > 0) {
                    fetchedCompanies = data.map(c => ({
                        id: c.id,
                        name: c.name,
                        logo_url: c.logo_url
                    }));
                } else if (authIsDemo) {
                    // Fallback para dados mockados se não houver nada no banco para o modo demo
                    fetchedCompanies = DEMO_COMPANIES;
                }
            }
            else if (isManager || isBroker) {
                // Manager/Broker: buscar empresa vinculada
                const table = isManager ? 'managers' : 'brokers';
                const { data: userData, error: userError } = await supabase
                    .from(table)
                    .select('company_id')
                    .eq('id', user.id)
                    .single();

                if (userError || !userData?.company_id) {
                    logger.error(`Erro ao buscar company_id do ${table}:`, userError?.message);
                } else {
                    const { data, error } = await supabase
                        .from('real_estate_companies')
                        .select('id, name, logo_url')
                        .eq('id', userData.company_id)
                        .single();

                    if (error) {
                        logger.error('Erro ao buscar empresa:', error.message);
                    } else if (data) {
                        fetchedCompanies = [{
                            id: data.id,
                            name: data.name,
                            logo_url: data.logo_url
                        }];
                    }
                }
            }

            setCompanies(fetchedCompanies);

            // Sempre selecionar a primeira empresa se não houver seleção válida
            if (fetchedCompanies.length > 0) {
                setSelectedCompanyId(prev => {
                    if (!prev || !fetchedCompanies.find(c => c.id === prev)) {
                        return fetchedCompanies[0].id;
                    }
                    return prev;
                });
            } else {
                setSelectedCompanyId(null);
            }
        } catch (error) {
            logger.error('Erro ao buscar empresas:', (error as Error).message);
        } finally {
            if (enableLoading) setIsLoading(false);
        }
    }, [user, isOwner, isManager, isBroker, authIsDemo]);

    // Initial fetch
    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    // Also refresh when authIsDemo changes (for demo mode activation)
    useEffect(() => {
        if (authIsDemo) {
            fetchCompanies();
        }
    }, [authIsDemo, fetchCompanies]);

    // Refresh on auth state change
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'TOKEN_REFRESHED') {
                fetchCompanies(false); // Silent refresh
            } else {
                fetchCompanies(true);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchCompanies]);

    // Derived state: selected company object
    const selectedCompany = companies.find(c => c.id === selectedCompanyId) || null;

    return (
        <CompanyContext.Provider value={{
            selectedCompanyId,
            setSelectedCompanyId,
            companies,
            selectedCompany,
            isLoading,
            refreshCompanies: fetchCompanies
        }}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
}


