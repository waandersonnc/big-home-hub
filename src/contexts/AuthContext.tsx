import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { demoStore } from '@/lib/demoStore';
import { logger } from '@/lib/logger';
import type { User } from '@supabase/supabase-js';
import type { UserType } from '@/types';

// ============================================
// TYPES
// ============================================

export interface AuthUser {
    id: string;
    email: string;
    full_name?: string;
    phone?: string;
    role: UserType;
    real_estate_company_id?: string;
    manager_id?: string; // For brokers - their manager
    validoutoken?: boolean; // For owners
    onboarding_completed?: boolean; // For owners
    avatar_url?: string;
    document?: string;
    settings?: any;
}

interface AuthContextType {
    user: AuthUser | null;
    supabaseUser: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isOwner: boolean;
    isManager: boolean;
    isBroker: boolean;
    isDemo: boolean;
    canViewAllData: boolean; // Owner or Manager
    canManageTeam: boolean; // Owner or Manager
    canViewOwnDataOnly: boolean; // Broker
    refreshUser: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PERMISSION HELPERS
// ============================================

const getPermissions = (role: UserType) => ({
    canViewAllData: role === 'owner' || role === 'manager',
    canManageTeam: role === 'owner' || role === 'manager',
    canViewOwnDataOnly: role === 'broker'
});

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserData = async (authUser: User): Promise<AuthUser | null> => {
        try {
            // 1. Check if owner
            const { data: owner, error: ownerError } = await supabase
                .from('owners')
                .select('id, email, name, phone, validoutoken, avatar_url, document, settings')
                .eq('id', authUser.id)
                .maybeSingle();

            if (ownerError) {
                logger.error('Error fetching owner:', ownerError.message);
            }

            if (owner) {
                return {
                    id: owner.id,
                    email: owner.email,
                    full_name: owner.name,
                    phone: owner.phone,
                    role: 'owner',
                    validoutoken: owner.validoutoken,
                    onboarding_completed: true,
                    avatar_url: owner.avatar_url,
                    document: owner.document,
                    settings: owner.settings
                };
            }

            // 2. Check if manager
            const { data: manager, error: managerError } = await supabase
                .from('managers')
                .select('id, email, name, phone, company_id')
                .eq('id', authUser.id)
                .maybeSingle();

            if (managerError) {
                logger.error('Error fetching manager:', managerError.message);
            }

            if (manager) {
                return {
                    id: manager.id,
                    email: manager.email,
                    full_name: manager.name,
                    phone: manager.phone,
                    role: 'manager',
                    real_estate_company_id: manager.company_id
                };
            }

            // 3. Check if broker
            const { data: broker, error: brokerError } = await supabase
                .from('brokers')
                .select('id, email, name, phone, company_id, my_manager')
                .eq('id', authUser.id)
                .maybeSingle();

            if (brokerError) {
                logger.error('Error fetching broker:', brokerError.message);
            }

            if (broker) {
                return {
                    id: broker.id,
                    email: broker.email,
                    full_name: broker.name,
                    phone: broker.phone,
                    role: 'broker',
                    real_estate_company_id: broker.company_id,
                    manager_id: broker.my_manager
                };
            }

            // User not found in any table
            logger.error('User not found in owners, managers or brokers table:', authUser.id);
            return null;

        } catch (error) {
            logger.error('Error in fetchUserData:', (error as Error).message);
            return null;
        }
    };

    const refreshUser = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                const userData = await fetchUserData(authUser);
                setUser(userData);
                setSupabaseUser(authUser);
            } else {
                setUser(null);
                setSupabaseUser(null);
            }
        } catch (error) {
            logger.error('Error refreshing user:', (error as Error).message);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSupabaseUser(null);
        demoStore.deactivate();
    };

    useEffect(() => {
        async function initAuth() {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    const userData = await fetchUserData(session.user);

                    if (!userData) {
                        // User authenticated but not in our tables - sign out
                        await signOut();
                    } else {
                        setUser(userData);
                        setSupabaseUser(session.user);
                    }
                }
            } catch (error) {
                logger.error('Error initializing auth:', (error as Error).message);
            } finally {
                setIsLoading(false);
            }
        }

        initAuth();

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const userData = await fetchUserData(session.user);
                if (!userData) {
                    await signOut();
                } else {
                    setUser(userData);
                    setSupabaseUser(session.user);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setSupabaseUser(null);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // Demo mode handling
    const [isDemo, setIsDemo] = useState(demoStore.isActive);

    // Sync isDemo state with demoStore
    useEffect(() => {
        const unsubscribe = demoStore.subscribe((active) => {
            setIsDemo(active);
        });

        // Initial check
        if (demoStore.isActive !== isDemo) {
            setIsDemo(demoStore.isActive);
        }

        // Listen for storage events (for other tabs)
        const checkStorage = () => setIsDemo(demoStore.isActive);
        window.addEventListener('storage', checkStorage);

        return () => {
            unsubscribe();
            window.removeEventListener('storage', checkStorage);
        };
    }, [isDemo]);

    // Demo owner data - used when demo mode is active
    const demoOwner: AuthUser = {
        id: 'f6daa179-65ad-47db-a340-0bd31b3acbf5',
        email: 'demo@bighome.com.br',
        full_name: 'Usuário Demo',
        role: 'owner',
        validoutoken: true,
        onboarding_completed: true
    };

    // In demo mode, ALWAYS use demo owner to show full experience
    // In real mode, use the actual user
    const effectiveUser: AuthUser | null = isDemo ? demoOwner : user;

    const role = effectiveUser?.role || 'broker';
    const permissions = getPermissions(role);

    const value: AuthContextType = {
        user: effectiveUser,
        supabaseUser: isDemo ? null : supabaseUser, // No supabase user in demo
        isLoading: isDemo ? false : isLoading, // Never loading in demo mode
        isAuthenticated: !!effectiveUser || isDemo,
        isOwner: role === 'owner',
        isManager: role === 'manager',
        isBroker: role === 'broker',
        isDemo,
        ...permissions,
        refreshUser,
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================
// HOOK
// ============================================

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Returns the current user's role
 */
export function useUserRole(): UserType | null {
    const { user } = useAuthContext();
    return user?.role || null;
}

/**
 * Returns true if the current user can perform the given action
 */
export function usePermission(permission: 'viewAllData' | 'manageTeam' | 'viewOwnDataOnly'): boolean {
    const context = useAuthContext();

    switch (permission) {
        case 'viewAllData':
            return context.canViewAllData;
        case 'manageTeam':
            return context.canManageTeam;
        case 'viewOwnDataOnly':
            return context.canViewOwnDataOnly;
        default:
            return false;
    }
}

/**
 * Returns the company ID filter based on user role
 * - Owner: all companies they own
 * - Manager/Broker: their assigned company
 */
export function useCompanyFilter(): string | null {
    const { user } = useAuthContext();

    if (!user) return null;

    if (user.role === 'owner') {
        // Owners can see all their companies - return null to indicate no filter needed
        // The actual filtering should be done at the query level with owner_id
        return null;
    }

    return user.real_estate_company_id || null;
}

/**
 * Returns the user ID to filter data by
 * - Owner/Manager: null (can see all)
 * - Broker: their own ID
 */
export function useUserFilter(): string | null {
    const { user, isOwner, isManager } = useAuthContext();

    if (!user) return null;

    if (isOwner || isManager) {
        // Can see all data
        return null;
    }

    // Broker - only their own data
    return user.id;
}
