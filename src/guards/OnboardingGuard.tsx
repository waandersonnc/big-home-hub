import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { demoStore } from '@/lib/demoStore';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from '@/components/ui/use-toast';
import { useAuthContext, AuthUser } from '@/contexts/AuthContext';
import TokenVerificationModal from '@/components/TokenVerificationModal';

export function OnboardingGuard() {
    const { user, isLoading, isDemo, refreshUser } = useAuthContext();
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Check if owner needs token verification
    useEffect(() => {
        if (user?.role === 'owner' && user.validoutoken === false) {
            setShowVerificationModal(true);
        } else {
            setShowVerificationModal(false);
        }
    }, [user]);

    const handleVerificationSuccess = async () => {
        await refreshUser();
        setShowVerificationModal(false);
        toast({
            title: "Conta verificada!",
            description: "Seja bem-vindo ao BigHome Hub.",
        });
    };

    // Loading state with blur
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Carregando ambiente...</p>
                </div>
            </div>
        );
    }

    // Not logged in and not demo mode - redirect to login
    if (!user && !isDemo) {
        return <Navigate to="/login" replace />;
    }

    // Show verification modal if owner token not validated
    if (showVerificationModal && user && user.role === 'owner' && user.validoutoken === false) {
        return (
            <>
                <div className="min-h-screen bg-background" />
                <TokenVerificationModal
                    isOpen={true}
                    ownerData={{
                        id: user.id,
                        full_name: user.full_name || '',
                        phone: user.phone || '',
                        email: user.email || ''
                    }}
                    onSuccess={handleVerificationSuccess}
                />
            </>
        );
    }

    // Owner not completed onboarding - redirect to onboarding
    if (!isDemo && user && user.role === 'owner' && !user.onboarding_completed) {
        return <Navigate to="/onboarding" replace />;
    }

    // All checks passed - render protected routes
    return <Outlet context={{ user, isDemo }} />;
}

// Export type for useOutletContext
export type OnboardingGuardContext = {
    user: AuthUser | null;
    isDemo: boolean;
};
