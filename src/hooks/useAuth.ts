import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { demoStore } from '@/lib/demoStore';

export type UserType = 'owner' | 'manager' | 'broker';

export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            const session = data?.session;
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    return { user, loading };
}

export function useRole() {
    const { user } = useAuth();
    const [role, setRole] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ... (in useRole)
        async function fetchRole() {
            const isDemo = demoStore.isActive;

            if (isDemo && !user) {
                setRole('owner');
                setLoading(false);
                return;
            }

            if (!user) {
                setLoading(false);
                return;
            }

            // Check owners table first
            const { data: owner } = await supabase
                .from('owners')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (owner) {
                setRole('owner');
            } else {
                // Check users table for manager/broker
                const { data: staff } = await supabase
                    .from('users')
                    .select('user_type')
                    .eq('id', user.id)
                    .maybeSingle();

                if (staff) {
                    setRole(staff.user_type as UserType);
                }
            }
            setLoading(false);
        }

        fetchRole();
    }, [user]);

    return { role, user, loading };
}
