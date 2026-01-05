import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/auth.service';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';

interface Step5VerificationProps {
    email: string;
    full_name?: string;
    phone?: string;
    onVerify: (code: string) => Promise<void>;
    isLoading: boolean;
}

export default function Step5Verification({ email, full_name, phone, onVerify, isLoading }: Step5VerificationProps) {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return; // Only allow single digit

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit if all filled
        if (index === 5 && value && newCode.every(d => d !== '')) {
            onVerify(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

        if (!pastedData) return;

        const newCode = [...code];
        for (let i = 0; i < pastedData.length; i++) {
            newCode[i] = pastedData[i];
        }
        setCode(newCode);

        // Focus the input after the pasted content or the last input
        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();

        // Auto-submit if full code is pasted
        if (pastedData.length === 6) {
            onVerify(pastedData);
        }
    };

    const handleResend = async () => {
        if (!full_name || !phone) {
            toast({
                title: "Dados incompletos",
                description: "Não foi possível reenviar o código. Tente recarregar a página.",
                variant: "destructive"
            });
            return;
        }

        setResending(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (!userId) {
                throw new Error("Usuário não identificado. Faça login novamente.");
            }

            await authService.resendCode(email, full_name, phone, userId);

            toast({
                title: "Código reenviado!",
                description: "Verifique seu e-mail.",
            });
        } catch (error) {
            const err = error as Error;
            logger.error('Erro ao reenviar código:', err.message);
            toast({
                title: "Erro ao reenviar",
                description: err.message || 'Tente novamente em instantes.',
                variant: "destructive"
            });
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Verifique seu e-mail</h2>
                <p className="text-sm text-muted-foreground">
                    Enviamos um código de 6 dígitos para <br />
                    <span className="font-medium text-foreground">{email}</span>
                </p>
            </div>

            <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        disabled={isLoading}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-input rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all disabled:opacity-50 bg-background"
                    />
                ))}
            </div>

            <div className="space-y-4">
                <Button
                    onClick={() => onVerify(code.join(''))}
                    disabled={isLoading || code.some(d => !d)}
                    className="w-full h-12 text-base"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando...
                        </>
                    ) : (
                        'Confirmar E-mail'
                    )}
                </Button>

                <Button
                    variant="ghost"
                    onClick={handleResend}
                    disabled={resending || isLoading}
                    className="w-full text-sm text-muted-foreground hover:text-primary"
                >
                    {resending ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Reenviando...
                        </span>
                    ) : (
                        'Não recebeu? Reenviar código'
                    )}
                </Button>
            </div>
        </div>
    );
}
