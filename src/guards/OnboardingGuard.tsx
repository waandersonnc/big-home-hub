import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { demoStore } from '@/lib/demoStore';
import { Loader2 } from 'lucide-react';

export function OnboardingGuard() {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function checkAuth() {
            try {
                const { data } = await supabase.auth.getSession();
                const currentSession = data?.session ?? null;
                setSession(currentSession);

                const isDemo = demoStore.isActive;

                if (currentSession) {
                    const { data: owner } = await supabase
                        .from('owners')
                        .select('onboarding_completed, email_confirmed')
                        .eq('id', currentSession.user.id)
                        .single();

                    setOnboardingStatus(owner);
                }
            } catch (error) {
                console.error('Error checking auth:', error);
            } finally {
                setLoading(false);
            }
        }

        checkAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            if (session) {
                const { data: owner } = await supabase
                    .from('owners')
                    .select('onboarding_completed')
                    .eq('id', session.user.id)
                    .single();
                setOnboardingStatus(owner);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const isDemo = demoStore.isActive;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session && !isDemo) {
        return <Navigate to="/login" replace />;
    }

    if (!isDemo && onboardingStatus && !onboardingStatus.onboarding_completed) {
        return <Navigate to="/onboarding" replace />;
    }

    return <Outlet />;
}
