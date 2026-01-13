import { useAuthContext } from '@/contexts/AuthContext';
import type { UserType } from '@/types';

export function useAuth() {
    const { supabaseUser, isLoading } = useAuthContext();
    return { user: supabaseUser, loading: isLoading };
}

export function useRole() {
    const { user, isLoading } = useAuthContext();
    return {
        role: user?.role || null,
        user: user,
        loading: isLoading
    };
}

export type { UserType };
