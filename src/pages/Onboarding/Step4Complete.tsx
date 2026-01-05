import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PartyPopper, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/ui/use-toast';

interface Step4Props {
    userId: string;
    data: {
        company_count: number;
    };
    onFinish: () => void;
}

export default function Step4Complete({ userId, data, onFinish }: Step4Props) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('owners')
                .update({ onboarding_completed: true })
                .eq('id', userId);

            if (error) throw error;
            onFinish();
        } catch (error) {
            const err = error as Error;
            logger.error('Erro ao finalizar onboarding:', err.message);
            toast({
                title: "Erro ao finalizar",
                description: "Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-center flex flex-col items-center">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-bounce">
                <PartyPopper size={40} />
            </div>

            <div className="space-y-2">
                <h2 className="text-3xl font-bold">🎉 Tudo pronto!</h2>
                <p className="text-muted-foreground max-w-sm">
                    Seu perfil foi configurado com sucesso. Agora você já pode acessar seu dashboard completo.
                </p>
            </div>

            <Card className="p-6 w-full max-w-sm bg-muted/30 border-none space-y-4">
                <div className="flex items-center gap-3 text-left">
                    <CheckCircle2 className="text-success h-5 w-5" />
                    <span className="text-sm">Dados pessoais confirmados</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                    <CheckCircle2 className="text-success h-5 w-5" />
                    <span className="text-sm">{data.company_count} imobiliária(s) cadastrada(s)</span>
                </div>
            </Card>

            <Button onClick={handleComplete} className="w-full h-14 text-xl font-bold" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : 'Acessar Dashboard'}
            </Button>
        </div>
    );
}
