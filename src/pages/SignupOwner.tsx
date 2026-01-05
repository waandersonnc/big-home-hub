import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { authService } from '@/services/auth.service';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { SignupFormData } from '@/types';

// Steps
import Step1Name from '@/components/SignupWizard/Step1Name';
import Step2Phone from '@/components/SignupWizard/Step2Phone';
import Step3Email from '@/components/SignupWizard/Step3Email';
import Step4Password from '@/components/SignupWizard/Step4Password';
import Step5Verification from '@/components/SignupWizard/Step5Verification';

export default function SignupOwner() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<SignupFormData>({
        full_name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [userId, setUserId] = useState<string | null>(null);

    const totalSteps = 5;
    const progress = (currentStep / totalSteps) * 100;

    const updateFormData = (data: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleCreateAccount = async () => {
        setIsLoading(true);
        logger.debug("Criando conta para owner");
        try {
            const user = await authService.signUp(formData.email, formData.password, {
                full_name: formData.full_name,
                phone: formData.phone,
                email: formData.email,
            });

            if (user?.id) {
                setUserId(user.id);
            }

            toast({
                title: "Conta criada com sucesso!",
                description: "Verifique seu e-mail para continuar.",
            });

            // Avançar para etapa de verificação
            setCurrentStep(5);
        } catch (error) {
            const err = error as Error;
            toast({
                title: "Erro ao criar conta",
                description: err.message || "Verifique seus dados e tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (code: string) => {
        setIsLoading(true);
        try {
            // Use stored userId or fetch from session fallback
            let idToVerify = userId;
            if (!idToVerify) {
                const { data: { user } } = await supabase.auth.getUser();
                idToVerify = user?.id || null;
            }

            if (!idToVerify) {
                throw new Error("Usuário não identificado. Tente fazer login novamente.");
            }

            await authService.verifyOwnerToken(idToVerify, code);

            toast({
                title: "Conta verificada!",
                description: "Seja bem-vindo ao BigHome Hub.",
            });

            // Redirecionar para dashboard ou onboarding posterior
            navigate('/painel');

        } catch (error) {
            const err = error as Error;
            logger.error('Erro ao verificar código:', err.message);
            toast({
                title: "Código inválido",
                description: "O código digitado está incorreto ou expirou.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-12 px-6">
            <div className="w-full max-w-lg space-y-8 animate-fade-in">
                {/* Header */}
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        onClick={currentStep === 1 ? () => navigate('/cadastro') : prevStep}
                        className="p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                        disabled={currentStep === 5} // Não voltar da etapa de verificação
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {currentStep === 1 ? 'Voltar para perfis' : 'Etapa anterior'}
                    </Button>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">Dono de Imobiliária</h1>
                        <p className="text-muted-foreground">Preencha os dados abaixo para criar sua conta.</p>
                    </div>
                </div>

                {/* Progress */}
                <div className="space-y-4">
                    <div className="flex justify-between text-sm font-medium">
                        <span>Etapa {currentStep} de {totalSteps}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Steps Container */}
                <div className="bg-card border rounded-2xl p-8 shadow-soft min-h-[400px] flex flex-col justify-between">
                    <div className="animate-slide-in-left">
                        {currentStep === 1 && (
                            <Step1Name
                                value={formData.full_name}
                                onChange={(val) => updateFormData({ full_name: val })}
                                onNext={nextStep}
                            />
                        )}
                        {currentStep === 2 && (
                            <Step2Phone
                                value={formData.phone}
                                onChange={(val) => updateFormData({ phone: val })}
                                onNext={nextStep}
                            />
                        )}
                        {currentStep === 3 && (
                            <Step3Email
                                value={formData.email}
                                onChange={(val) => updateFormData({ email: val })}
                                onNext={nextStep}
                            />
                        )}
                        {currentStep === 4 && (
                            <Step4Password
                                formData={formData}
                                onChange={updateFormData}
                                onSubmit={handleCreateAccount} // Trigger account creation
                                isLoading={isLoading}
                            />
                        )}
                        {currentStep === 5 && (
                            <Step5Verification
                                email={formData.email}
                                full_name={formData.full_name}
                                phone={formData.phone}
                                onVerify={handleVerifyCode}
                                isLoading={isLoading}
                            />
                        )}
                    </div>

                    {/* Navigation Buttons (Hide on Step 5 as it has its own buttons) */}
                    {currentStep < 5 && (
                        <div className="flex justify-between pt-8 border-t mt-8">
                            <Button
                                variant="outline"
                                onClick={currentStep === 1 ? () => navigate('/cadastro') : prevStep}
                                disabled={isLoading}
                            >
                                Anterior
                            </Button>

                            {currentStep < 4 ? (
                                <Button
                                    onClick={nextStep}
                                    disabled={!isStepValid(currentStep, formData)}
                                >
                                    Próximo
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleCreateAccount}
                                    disabled={isLoading || !isStepValid(4, formData)}
                                    className="bg-primary hover:bg-primary-dark text-white gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    Criar Conta
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function isStepValid(step: number, data: SignupFormData): boolean {
    switch (step) {
        case 1: return data.full_name.length >= 3;
        case 2: return data.phone.length >= 14; // (XX) XXXXX-XXXX
        case 3: return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
        case 4: return data.password.length >= 8 && data.password === data.confirmPassword;
        default: return false;
    }
}
