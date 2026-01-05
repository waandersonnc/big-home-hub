import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { demoStore } from '@/lib/demoStore';
import { logger } from '@/lib/logger';

interface Company {
    id: string;
    name: string;
}

interface CompanyContextType {
    selectedCompanyId: string | null;
    setSelectedCompanyId: (id: string) => void;
    companies: Company[];
    isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchCompanies() {
            const isDemo = demoStore.isActive;

            if (isDemo) {
                const demoCompanies = [{ id: 'demo-1', name: 'BigHome Imobiliária (Demo)' }];
                if (isMounted) {
                    setCompanies(demoCompanies);
                    setSelectedCompanyId(prev => prev || demoCompanies[0].id);
                    setIsLoading(false);
                }
                return;
            }

            try {
                const { data } = await supabase.auth.getUser();
                const user = data?.user;

                if (!user) {
                    if (isMounted) {
                        setCompanies([]);
                        setSelectedCompanyId(null);
                        setIsLoading(false);
                    }
                    return;
                }

                const { data: ownerCompanies } = await supabase
                    .from('real_estate_companies')
                    .select('id, name')
                    .eq('owner_id', user.id);

                if (isMounted) {
                    if (ownerCompanies && ownerCompanies.length > 0) {
                        setCompanies(ownerCompanies);
                        setSelectedCompanyId(prev => {
                            if (!prev || !ownerCompanies.find(c => c.id === prev)) {
                                return ownerCompanies[0].id;
                            }
                            return prev;
                        });
                    } else {
                        const { data: userData } = await supabase
                            .from('users')
                            .select('real_estate_company_id, real_estate_companies(name)')
                            .eq('id', user.id)
                            .maybeSingle();

                        if (userData?.real_estate_company_id) {
                            const comp = {
                                id: userData.real_estate_company_id,
                                name: (userData.real_estate_companies as any)?.name || 'Sua Imobiliária'
                            };
                            setCompanies([comp]);
                            setSelectedCompanyId(comp.id);
                        }
                    }
                }
            } catch (error) {
                const err = error as Error;
                logger.error('Erro ao buscar empresas:', err.message);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchCompanies();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchCompanies();
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <CompanyContext.Provider value={{ selectedCompanyId, setSelectedCompanyId, companies, isLoading }}>
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
