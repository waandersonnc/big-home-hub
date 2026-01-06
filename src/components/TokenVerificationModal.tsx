import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/auth.service';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { WEBHOOK_URLS } from '@/lib/constants';

interface OwnerData {
    id: string;
    full_name: string;
    phone: string;
    email: string;
}

interface TokenVerificationModalProps {
    isOpen: boolean;
    ownerData: OwnerData;
    onClose?: () => void;
    onSuccess: () => void;
}

export default function TokenVerificationModal({
    isOpen,
    ownerData,
    onClose,
    onSuccess
}: TokenVerificationModalProps) {
    const navigate = useNavigate();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [initialSending, setInitialSending] = useState(true);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const { toast } = useToast();
    const hasSentInitialRef = useRef(false);

    // Send initial webhook on mount
    useEffect(() => {
        if (!isOpen || hasSentInitialRef.current) return;

        const sendInitialWebhook = async () => {
            try {
                logger.debug('Enviando webhook inicial para verificação de token');

                const response = await fetch(WEBHOOK_URLS.CREATE_OWNER_ACCOUNT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: ownerData.id,
                        full_name: ownerData.full_name,
                        phone: ownerData.phone,
                        email: ownerData.email,
                        role: 'owner'
                    })
                });

                if (!response.ok) {
                    logger.error('Webhook inicial falhou:', response.status);
                } else {
                    logger.debug('Webhook inicial enviado com sucesso');
                }
            } catch (error) {
                logger.error('Erro ao enviar webhook inicial:', (error as Error).message);
            } finally {
                setInitialSending(false);
                hasSentInitialRef.current = true;
                // Focus first input after initial send
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
            }
        };

        sendInitialWebhook();
    }, [isOpen, ownerData]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (index === 5 && value && newCode.every(d => d !== '')) {
            handleVerify(newCode.join(''));
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

        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();

        if (pastedData.length === 6) {
            handleVerify(pastedData);
        }
    };

    const handleVerify = async (token: string) => {
        setIsLoading(true);
        try {
            await authService.verifyOwnerToken(ownerData.id, token);

            toast({
                title: "Conta verificada!",
                description: "Seja bem-vindo ao BigHome Hub.",
            });

            onSuccess();

        } catch (error) {
            const err = error as Error;
            logger.error('Erro ao verificar código:', err.message);
            toast({
                title: "Código inválido",
                description: "O código digitado está incorreto ou expirou.",
                variant: "destructive",
            });
            // Clear code on error
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await authService.resendCode(
                ownerData.email,
                ownerData.full_name,
                ownerData.phone,
                ownerData.id
            );

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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-2xl p-8 shadow-2xl animate-fade-in">
                {/* Optional close button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}

                {initialSending ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground text-center">
                            Preparando verificação...
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-semibold">Verificação Pendente</h2>
                            <p className="text-sm text-muted-foreground">
                                Sua conta ainda não foi verificada.<br />
                                Enviamos um código de 6 dígitos para<br />
                                <span className="font-medium text-foreground">{ownerData.email}</span>
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

                        <div className="space-y-3">
                            <Button
                                onClick={() => handleVerify(code.join(''))}
                                disabled={isLoading || code.some(d => !d)}
                                className="w-full h-12 text-base"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    'Confirmar Código'
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

                            <div className="pt-2 border-t">
                                <Button
                                    variant="outline"
                                    onClick={handleLogout}
                                    className="w-full text-sm"
                                >
                                    Sair e usar outra conta
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
