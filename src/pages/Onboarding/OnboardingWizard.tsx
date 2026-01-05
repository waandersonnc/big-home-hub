import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import Step1Personal from './Step1Personal';
import Step2Quantity from './Step2Quantity';
import Step3Companies from './Step3Companies';
import Step4Complete from './Step4Complete';
import { Progress } from '@/components/ui/progress';
import type { User } from '@supabase/supabase-js';
import type { CompanyData } from '@/types';

export default function OnboardingWizard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const [onboardingData, setOnboardingData] = useState({
        // Personal data
        full_name: '',
        phone: '',
        profile_photo_url: '',
        cpf_cnpj: '',

        // Quantity data
        num_brokers: 0,
        num_properties: 0,
        company_count: 1,

        // Company data
        companies: [] as CompanyData[],

        // Progress tracking
        personal_data_completed: false,
        companies_data_completed: false,
    });

    useEffect(() => {
        async function fetchUserData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }
            setUser(user);

            const { data: owner } = await supabase
                .from('owners')
                .select('*, real_estate_companies(*)')
                .eq('id', user.id)
                .single();

            if (owner) {
                setOnboardingData(prev => ({
                    ...prev,
                    profile_photo_url: owner.profile_photo_url || '',
                    cpf_cnpj: owner.cpf_cnpj || '',
                    personal_data_completed: owner.personal_data_completed || false,
                    companies_data_completed: owner.companies_data_completed || false,
                    companies: owner.real_estate_companies || [],
                    company_count: owner.real_estate_companies?.length || 1,
                }));

                // Restore progress
                if (owner.personal_data_completed && !owner.companies_data_completed) {
                    setCurrentStep(2);
                } else if (owner.companies_data_completed) {
                    setCurrentStep(4);
                }
            }
            setLoading(false);
        }
        fetchUserData();
    }, [navigate]);

    const totalSteps = 4;
    const progress = (currentStep / totalSteps) * 100;

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-10 px-6">
            <div className="w-full max-w-2xl space-y-8 animate-fade-in">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold">Configurando sua conta</h1>
                    <p className="text-muted-foreground">Conte-nos um pouco mais sobre você e seu negócio.</p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <span>Passo {currentStep} de {totalSteps}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                </div>

                <div className="mt-8">
                    {currentStep === 1 && (
                        <Step1Personal
                            userId={user.id}
                            data={onboardingData}
                            onUpdate={(val) => setOnboardingData(prev => ({ ...prev, ...val }))}
                            onNext={handleNext}
                        />
                    )}
                    {currentStep === 2 && (
                        <Step2Quantity
                            data={onboardingData}
                            onUpdate={(val) => setOnboardingData(prev => ({ ...prev, ...val }))}
                            onNext={handleNext}
                            onBack={handleBack}
                        />
                    )}
                    {currentStep === 3 && (
                        <Step3Companies
                            userId={user.id}
                            data={onboardingData}
                            onUpdate={(val) => setOnboardingData(prev => ({ ...prev, ...val }))}
                            onNext={handleNext}
                            onBack={handleBack}
                        />
                    )}
                    {currentStep === 4 && (
                        <Step4Complete
                            userId={user.id}
                            data={onboardingData}
                            onFinish={() => navigate('/painel')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
