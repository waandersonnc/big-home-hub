import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

export default function EmailConfirmation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const email = location.state?.email || '';

    useEffect(() => {
        if (!email) {
            navigate('/login');
        }
    }, [email, navigate]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) value = value[0];
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleConfirm = async () => {
        const token = otp.join('');
        if (token.length < 6) return;

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'signup'
            });

            if (error) throw error;

            toast({
                title: "E-mail confirmado!",
                description: "Agora vamos completar seu perfil.",
            });

            navigate('/onboarding');
        } catch (error: any) {
            toast({
                title: "Código inválido",
                description: error.message || "Por favor, verifique o código enviado no seu e-mail.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            });

            if (error) throw error;

            toast({
                title: "Código reenviado",
                description: "Verifique sua caixa de entrada.",
            });
            setCooldown(60);
        } catch (error: any) {
            toast({
                title: "Erro ao reenviar",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 animate-fade-in text-center">
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold">Confirme seu e-mail</h1>
                    <p className="text-muted-foreground">
                        Enviamos um código de 6 dígitos para:<br />
                        <span className="font-semibold text-foreground">{email}</span>
                    </p>
                </div>

                <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                        <Input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 focus:border-primary transition-all"
                            autoFocus={index === 0}
                        />
                    ))}
                </div>

                <div className="space-y-4">
                    <Button
                        className="w-full h-12 text-lg"
                        onClick={handleConfirm}
                        disabled={otp.join('').length < 6 || isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Confirmar e-mail'}
                    </Button>

                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={handleResend}
                            disabled={cooldown > 0}
                            className={`text-sm flex items-center gap-1 transition-colors ${cooldown > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-primary hover:text-primary-dark font-medium'}`}
                        >
                            <RefreshCw className={`h-3 w-3 ${cooldown > 0 ? '' : 'animate-hover'}`} />
                            Reenviar código {cooldown > 0 && `(${cooldown}s)`}
                        </button>

                        <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate('/login')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Usar outro e-mail
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
