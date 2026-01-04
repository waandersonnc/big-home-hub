import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { authService } from '@/services/auth.service';
import { useToast } from '@/components/ui/use-toast';

// Steps
import Step1Name from '@/components/SignupWizard/Step1Name';
import Step2Phone from '@/components/SignupWizard/Step2Phone';
import Step3Email from '@/components/SignupWizard/Step3Email';
import Step4Password from '@/components/SignupWizard/Step4Password';

export default function SignupOwner() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const totalSteps = 4;
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

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await authService.signUp(formData.email, formData.password, {
                full_name: formData.full_name,
                phone: formData.phone,
                email: formData.email,
            });

            toast({
                title: "Conta criada com sucesso!",
                description: "Enviamos um código de confirmação para seu e-mail.",
            });

            navigate('/confirm-email', { state: { email: formData.email } });
        } catch (error: any) {
            toast({
                title: "Erro ao criar conta",
                description: error.message || "Verifique seus dados e tente novamente.",
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
                        onClick={currentStep === 1 ? () => navigate('/signup') : prevStep}
                        className="p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
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
                                onSubmit={handleSubmit}
                                isLoading={isLoading}
                            />
                        )}
                    </div>

                    <div className="flex justify-between pt-8 border-t mt-8">
                        <Button
                            variant="outline"
                            onClick={currentStep === 1 ? () => navigate('/signup') : prevStep}
                            disabled={isLoading}
                        >
                            Anterior
                        </Button>

                        {currentStep < totalSteps ? (
                            <Button
                                onClick={nextStep}
                                disabled={!isStepValid(currentStep, formData)}
                            >
                                Próximo
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading || !isStepValid(4, formData)}
                                className="bg-primary hover:bg-primary-dark text-white gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4" />
                                )}
                                Finalizar Cadastro
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function isStepValid(step: number, data: any) {
    switch (step) {
        case 1: return data.full_name.length >= 3;
        case 2: return data.phone.length >= 14; // (XX) XXXXX-XXXX
        case 3: return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
        case 4: return data.password.length >= 8 && data.password === data.password_confirmation;
        default: return false;
    }
}
