import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { demoStore } from '@/lib/demoStore';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from '@/components/ui/use-toast';
import TokenVerificationModal from '@/components/TokenVerificationModal';

interface UserData {
    id: string;
    email: string;
    full_name?: string;
    phone?: string;
    role: 'owner' | 'manager' | 'broker';
    validoutoken?: boolean;
    onboarding_completed?: boolean;
    real_estate_company_id?: string;
}

export function OnboardingGuard() {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const fetchUserData = async (userId: string, userEmail: string): Promise<UserData | null> => {
        try {
            // 1. Check if user is an owner
            const { data: owner, error: ownerError } = await supabase
                .from('owners')
                .select('id, email, full_name, phone, validoutoken, onboarding_completed')
                .eq('id', userId)
                .maybeSingle();

            if (ownerError) {
                logger.error('Error fetching owner:', ownerError.message);
            }

            if (owner) {
                return {
                    id: owner.id,
                    email: owner.email || userEmail,
                    full_name: owner.full_name,
                    phone: owner.phone,
                    role: 'owner',
                    validoutoken: owner.validoutoken,
                    onboarding_completed: owner.onboarding_completed
                };
            }

            // 2. Check if user is staff (manager/broker)
            const { data: staff, error: staffError } = await supabase
                .from('users')
                .select('id, email, full_name, phone, user_type, real_estate_company_id')
                .eq('id', userId)
                .maybeSingle();

            if (staffError) {
                logger.error('Error fetching staff:', staffError.message);
            }

            if (staff) {
                // Validate user_type
                if (staff.user_type !== 'manager' && staff.user_type !== 'broker') {
                    logger.error('Invalid user_type:', staff.user_type);
                    return null;
                }

                return {
                    id: staff.id,
                    email: staff.email || userEmail,
                    full_name: staff.full_name,
                    phone: staff.phone,
                    role: staff.user_type as 'manager' | 'broker',
                    real_estate_company_id: staff.real_estate_company_id
                };
            }

            // User not found
            return null;

        } catch (error) {
            logger.error('Error in fetchUserData:', (error as Error).message);
            return null;
        }
    };

    useEffect(() => {
        async function checkAuth() {
            try {
                const { data } = await supabase.auth.getSession();
                const currentSession = data?.session ?? null;
                setSession(currentSession);

                const isDemo = demoStore.isActive;

                if (currentSession && !isDemo) {
                    const user = await fetchUserData(currentSession.user.id, currentSession.user.email || '');

                    if (!user) {
                        // User not found in any table - sign out
                        logger.error('User not found in owners or users table');
                        toast({
                            title: "Sessão inválida",
                            description: "Sua conta não foi encontrada. Faça login novamente.",
                            variant: "destructive"
                        });
                        await supabase.auth.signOut();
                        return;
                    }

                    setUserData(user);

                    // Check if owner needs token verification
                    if (user.role === 'owner' && user.validoutoken === false) {
                        setShowVerificationModal(true);
                    }
                }
            } catch (error) {
                logger.error('Error checking auth:', (error as Error).message);
            } finally {
                setLoading(false);
            }
        }

        checkAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);

            if (session) {
                const user = await fetchUserData(session.user.id, session.user.email || '');

                if (!user) {
                    await supabase.auth.signOut();
                    return;
                }

                setUserData(user);

                if (user.role === 'owner' && user.validoutoken === false) {
                    setShowVerificationModal(true);
                } else {
                    setShowVerificationModal(false);
                }
            } else {
                setUserData(null);
                setShowVerificationModal(false);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const isDemo = demoStore.isActive;

    const handleVerificationSuccess = () => {
        setShowVerificationModal(false);
        // Update local state
        if (userData) {
            setUserData({ ...userData, validoutoken: true });
        }
        toast({
            title: "Conta verificada!",
            description: "Seja bem-vindo ao BigHome Hub.",
        });
    };

    // Loading state with blur
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    // Not logged in and not demo mode - redirect to login
    if (!session && !isDemo) {
        return <Navigate to="/login" replace />;
    }

    // Show verification modal if owner token not validated
    if (showVerificationModal && userData && userData.role === 'owner' && userData.validoutoken === false) {
        return (
            <>
                <div className="min-h-screen bg-background" />
                <TokenVerificationModal
                    isOpen={true}
                    ownerData={{
                        id: userData.id,
                        full_name: userData.full_name || '',
                        phone: userData.phone || '',
                        email: userData.email || ''
                    }}
                    onSuccess={handleVerificationSuccess}
                />
            </>
        );
    }

    // Owner not completed onboarding - redirect to onboarding
    if (!isDemo && userData && userData.role === 'owner' && !userData.onboarding_completed) {
        return <Navigate to="/onboarding" replace />;
    }

    // All checks passed - render protected routes
    // The userData is available for role-based rendering in child components
    return <Outlet context={{ user: userData, isDemo }} />;
}

// Export type for useOutletContext
export type OnboardingGuardContext = {
    user: UserData | null;
    isDemo: boolean;
};
