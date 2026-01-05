import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({ title: "Senhas não coincidem", variant: "destructive" });
            return;
        }
        if (password.length < 8) {
            toast({ title: "Senha muito curta", description: "Mínimo 8 caracteres.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            // Update needs_password_reset flag in users table
            const { data } = await supabase.auth.getUser();
            const user = data?.user;
            if (user) {
                await supabase
                    .from('users')
                    .update({ needs_password_reset: false })
                    .eq('id', user.id);
            }

            toast({ title: "Senha definida!", description: "Sua conta agora está segura." });
            navigate('/painel');
        } catch (error) {
            const err = error as Error;
            logger.error('Erro ao redefinir senha:', err.message);
            toast({ title: "Erro ao definir senha", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/20">
            <div className="w-full max-w-md space-y-8 animate-fade-in bg-card p-8 border rounded-2xl shadow-soft">
                <div className="flex flex-col items-center text-center space-y-2">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-2xl font-bold">Defina sua nova senha</h1>
                    <p className="text-muted-foreground">
                        Sua conta foi criada com uma senha temporária. Por segurança, crie uma senha pessoal agora.
                    </p>
                </div>

                <form onSubmit={handleReset} className="space-y-6">
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
                                    placeholder="********"
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
                                    placeholder="********"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Salvar e Acessar Conta'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
