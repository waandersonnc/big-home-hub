import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { demoStore } from '@/lib/demoStore';
import { logger } from '@/lib/logger';
import type { User } from '@supabase/supabase-js';
import type { UserType, AuthUser } from '@/types';

interface AuthContextType {
    user: AuthUser | null;
    supabaseUser: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isOwner: boolean;
    isManager: boolean;
    isBroker: boolean;
    isDemo: boolean;
    canViewAllData: boolean;
    canManageTeam: boolean;
    canViewOwnDataOnly: boolean;
    refreshUser: (enableLoading?: boolean) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getPermissions = (role: UserType) => ({
    canViewAllData: role === 'owner' || role === 'manager',
    canManageTeam: role === 'owner' || role === 'manager',
    canViewOwnDataOnly: role === 'broker'
});

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(() => demoStore.isActive);

    const fetchUserData = async (authUser: User): Promise<AuthUser | null> => {
        try {
            logger.debug('AuthContext: Fetching data for user:', authUser.id);

            // 1. Try Owners
            const { data: owner, error: ownerError } = await supabase
                .from('owners')
                .select('id, email, name, phone, validoutoken, avatar_url, document, settings')
                .eq('id', authUser.id)
                .maybeSingle();

            if (ownerError) logger.error('AuthContext: Error fetching owner:', ownerError.message);
            if (owner) {
                return {
                    id: owner.id,
                    email: owner.email,
                    full_name: owner.name,
                    phone: owner.phone,
                    role: 'owner',
                    validoutoken: owner.validoutoken,
                    avatar_url: owner.avatar_url,
                    document: owner.document,
                    settings: owner.settings
                };
            }

            // 2. Try Managers
            const { data: manager, error: managerError } = await supabase
                .from('managers')
                .select('id, email, name, phone, company_id, my_owner')
                .eq('id', authUser.id)
                .maybeSingle();

            if (managerError) logger.error('AuthContext: Error fetching manager:', managerError.message);
            if (manager) {
                return {
                    id: manager.id,
                    email: manager.email,
                    full_name: manager.name,
                    phone: manager.phone,
                    role: 'manager',
                    real_estate_company_id: manager.company_id,
                    my_owner: manager.my_owner
                };
            }

            // 3. Try Brokers
            const { data: broker, error: brokerError } = await supabase
                .from('brokers')
                .select('id, email, name, phone, company_id, my_manager, my_owner')
                .eq('id', authUser.id)
                .maybeSingle();

            if (brokerError) logger.error('AuthContext: Error fetching broker:', brokerError.message);
            if (broker) {
                return {
                    id: broker.id,
                    email: broker.email,
                    full_name: broker.name,
                    phone: broker.phone,
                    role: 'broker',
                    real_estate_company_id: broker.company_id,
                    manager_id: broker.my_manager,
                    my_owner: broker.my_owner
                };
            }

            return null;
        } catch (error) {
            logger.error('AuthContext: Catastrophic error in fetchUserData:', (error as Error).message);
            return null;
        }
    };

    const isRefreshingRef = useRef(false);

    const refreshUser = async (enableLoading: boolean = true) => {
        if (isRefreshingRef.current) return;
        isRefreshingRef.current = true;

        if (enableLoading) setIsLoading(true);
        try {
            logger.debug('AuthContext: refreshUser starting');
            // Alterado de getUser() para getSession() para evitar deslogue ao recarregar (F5)
            // getSession recupera a sessão do armazenamento local e lida melhor com refresh tokens
            const { data: { session } } = await supabase.auth.getSession();
            const authUser = session?.user;

            if (authUser) {
                const userData = await fetchUserData(authUser);
                setUser(userData);
                setSupabaseUser(authUser);
            } else {
                setUser(null);
                setSupabaseUser(null);
            }
        } catch (err) {
            logger.error('AuthContext: Error refreshing user:', err);
        } finally {
            if (enableLoading) setIsLoading(false);
            isRefreshingRef.current = false;
            logger.debug('AuthContext: refreshUser finished');
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSupabaseUser(null);
        demoStore.deactivate();
        window.location.href = '/login';
    };

    useEffect(() => {
        refreshUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await refreshUser();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setSupabaseUser(null);
            }
        });

        const unsubscribeDemo = demoStore.subscribe((active) => {
            setIsDemo(active);
        });

        return () => {
            subscription.unsubscribe();
            unsubscribeDemo();
        };
    }, []);

    const demoOwner: AuthUser = {
        id: 'f6daa179-65ad-47db-a340-0bd31b3acbf5',
        email: 'demo@bighome.com.br',
        full_name: 'Usuário Demo',
        role: 'owner',
        validoutoken: true
    };

    const effectiveUser = isDemo ? demoOwner : user;
    const role = effectiveUser?.role || null;
    const permissions = getPermissions(role || 'broker');

    const contextValue = useMemo(() => ({
        user: effectiveUser,
        supabaseUser: isDemo ? null : supabaseUser,
        isLoading: isDemo ? false : (isLoading && !effectiveUser),
        isAuthenticated: !!effectiveUser || isDemo,
        isOwner: role === 'owner',
        isManager: role === 'manager',
        isBroker: role === 'broker',
        isDemo,
        canViewAllData: permissions.canViewAllData,
        canManageTeam: permissions.canManageTeam,
        canViewOwnDataOnly: permissions.canViewOwnDataOnly,
        refreshUser,
        signOut
    }), [effectiveUser, supabaseUser, isLoading, isDemo, role, permissions]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}

export function useUserRole(): UserType | null {
    const { user } = useAuthContext();
    return user?.role || null;
}

export function usePermission(permission: 'viewAllData' | 'manageTeam' | 'viewOwnDataOnly'): boolean {
    const context = useAuthContext();
    switch (permission) {
        case 'viewAllData': return context.canViewAllData;
        case 'manageTeam': return context.canManageTeam;
        case 'viewOwnDataOnly': return context.canViewOwnDataOnly;
        default: return false;
    }
}

export function useCompanyFilter(): string | null {
    const { user } = useAuthContext();
    if (!user) return null;
    if (user.role === 'owner') return null;
    return user.real_estate_company_id || null;
}

export function useUserFilter(): string | null {
    const { user, isOwner, isManager } = useAuthContext();
    if (!user) return null;
    if (isOwner || isManager) return null;
    return user.id;
}
