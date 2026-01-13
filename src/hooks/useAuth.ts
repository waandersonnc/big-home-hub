import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { demoStore } from '@/lib/demoStore';
import { logger } from '@/lib/logger';
import type { User } from '@supabase/supabase-js';
import type { UserType, SupabaseOwner, SupabaseUser } from '@/types';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
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
        // AbortController para evitar race conditions
        const abortController = new AbortController();
        let isMounted = true;

        async function fetchRole() {
            const isDemo = demoStore.isActive;

            if (isDemo && !user) {
                if (isMounted) {
                    setRole('owner');
                    setLoading(false);
                }
                return;
            }

            if (!user) {
                if (isMounted) {
                    setRole(null);
                    setLoading(false);
                }
                return;
            }

            try {
                // Check owners table first
                const { data: owner, error: ownerError } = await supabase
                    .from('owners')
                    .select('id')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!isMounted || abortController.signal.aborted) return;

                if (owner) {
                    setRole('owner');
                    setLoading(false);
                    return;
                }

                // Check managers table
                const { data: manager, error: managerError } = await supabase
                    .from('managers')
                    .select('id, my_owner')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!isMounted || abortController.signal.aborted) return;

                if (manager) {
                    setRole('manager');
                    setLoading(false);
                    return;
                }

                // Check brokers table
                const { data: broker, error: brokerError } = await supabase
                    .from('brokers')
                    .select('id, my_owner')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!isMounted || abortController.signal.aborted) return;

                if (broker) {
                    setRole('broker');
                    setLoading(false);
                } else {
                    setRole(null);
                    setLoading(false);
                }
            } catch (error) {
                if (isMounted) {
                    const err = error as Error;
                    logger.error('Error in fetchRole:', err.message);
                    setLoading(false);
                }
            }
        }

        fetchRole();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [user]);

    return { role, user, loading };
}

export type { UserType };
