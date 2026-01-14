import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Lock, ShieldCheck, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { User } from '@supabase/supabase-js';

export default function ResetPassword() {
    const [user, setUser] = useState<User | null>(null);
    const [loadingSession, setLoadingSession] = useState(true);

    // Request Recovery Form State
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    // Update Password Form State
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // General State
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        // Check initial session
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
            } catch (error: any) {
                logger.error('Erro ao verificar sessão:', error);
            } finally {
                setLoadingSession(false);
            }
        };

        checkSession();

        // Listen for auth changes (e.g. from magic link redirect)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            // If we gain a user session, we are no longer loading
            setLoadingSession(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // 1. Handle "Send Recovery Email"
    const handleSendRecoveryEmail = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast({ title: "Informe o email", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Redirect back to this page after clicking the email link
            // Supabase will handle the token hash and log the user in
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/recuperar-senha`,
            });

            if (error) throw error;

            setEmailSent(true);
            toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada." });
        } catch (error) {
            const err = error as Error;
            logger.error('Erro ao enviar email de recuperação:', err.message);
            toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 2. Handle "Update Password"
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({ title: "Senhas não coincidem", variant: "destructive" });
            return;
        }
        if (password.length < 8) {
            toast({ title: "Senha muito curta", description: "Mínimo 8 caracteres.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            // Attempt to update 'needs_password_reset' flag if applicable
            // This is "best effort" - if the user is an owner, this might fail or not exist,
            // but for managers/brokers it does
            if (user) {
                const { error: managerError } = await supabase
                    .from('managers')
                    .update({ needs_password_reset: false })
                    .eq('id', user.id);

                if (managerError) {
                    // If not found in managers, try brokers
                    await supabase
                        .from('brokers')
                        .update({ needs_password_reset: false })
                        .eq('id', user.id);
                }
            }

            toast({ title: "Senha atualizada!", description: "Você já pode acessar sua conta normalmente." });
            navigate('/painel');
        } catch (error) {
            const err = error as Error;
            logger.error('Erro ao redefinir senha:', err.message);
            toast({ title: "Erro ao definir senha", description: err.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // --- VIEW: REQUEST RECOVERY (Not Logged In) ---
    if (!user) {

        // Sub-View: Email Sent Success
        if (emailSent) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/20">
                    <div className="w-full max-w-md space-y-8 animate-fade-in bg-card p-8 border rounded-2xl shadow-soft text-center">
                        <div className="flex justify-center mb-4">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <CheckCircle2 size={32} />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold">Verifique seu email</h1>
                        <p className="text-muted-foreground">
                            Enviamos um link de recuperação para <strong className="text-foreground">{email}</strong>.
                            <br className="mb-2" />
                            Clique no link para redefinir sua senha. Não esqueça de verificar a caixa de spam.
                        </p>
                        <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                            Voltar para o Login
                        </Button>
                    </div>
                </div>
            );
        }

        // Sub-View: Enter Email
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/20">
                <div className="w-full max-w-md space-y-8 animate-fade-in bg-card p-8 border rounded-2xl shadow-soft">
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                            <Mail size={24} />
                        </div>
                        <h1 className="text-2xl font-bold">Recuperar Senha</h1>
                        <p className="text-muted-foreground">
                            Informe seu e-mail cadastrado para receber as instruções de recuperação.
                        </p>
                    </div>

                    <form onSubmit={handleSendRecoveryEmail} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    className="pl-10 h-12"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Enviar Link de Recuperação'}
                        </Button>
                    </form>

                    <div className="text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <ArrowLeft size={14} /> Voltar para o Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: UPDATE PASSWORD (Logged In) ---
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/20">
            <div className="w-full max-w-md space-y-8 animate-fade-in bg-card p-8 border rounded-2xl shadow-soft">
                <div className="flex flex-col items-center text-center space-y-2">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-2xl font-bold">Criar Nova Senha</h1>
                    <p className="text-muted-foreground">
                        Sua identidade foi confirmada. Agora, defina uma nova senha segura para sua conta.
                    </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="pl-10 h-12"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="No mínimo 8 caracteres"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm">Confirmar Nova Senha</Label>
                            <div className="relative">
                                <ShieldCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="confirm"
                                    type="password"
                                    className="pl-10 h-12"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repita a senha"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Atualizar Senha e Entrar'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
