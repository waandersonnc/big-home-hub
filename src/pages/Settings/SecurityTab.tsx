import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export const SecurityTab: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    const getPasswordStrength = (pwd: string) => {
        if (!pwd) return { label: '', color: 'bg-slate-200', percent: 0 };
        let strength = 0;
        if (pwd.length >= 8) strength += 25;
        if (/[A-Z]/.test(pwd)) strength += 25;
        if (/[0-9]/.test(pwd)) strength += 25;
        if (/[^A-Za-z0-9]/.test(pwd)) strength += 25;

        if (strength <= 25) return { label: 'Fraca', color: 'bg-red-500', percent: 25 };
        if (strength <= 75) return { label: 'Média', color: 'bg-yellow-500', percent: 50 };
        return { label: 'Forte', color: 'bg-green-500', percent: 100 };
    };

    const strength = getPasswordStrength(formData.password);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password.length < 8) {
            toast.error('A senha deve ter pelo menos 8 caracteres.');
            return;
        }

        if (!/[A-Z]/.test(formData.password)) {
            toast.error('A senha deve conter pelo menos uma letra maiúscula.');
            return;
        }

        if (!/[0-9]/.test(formData.password)) {
            toast.error('A senha deve conter pelo menos um número.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: formData.password
            });

            if (error) throw error;

            setFormData({ password: '', confirmPassword: '' });
            toast.success('Senha atualizada com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao atualizar senha: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-md">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                    Recomendamos o uso de uma senha forte com letras maiúsculas, números e símbolos.
                </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <div className="relative">
                        <Input
                            id="new-password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Min. 8 caracteres"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {formData.password && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span>Força: <strong>{strength.label}</strong></span>
                            </div>
                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${strength.color}`}
                                    style={{ width: `${strength.percent}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Repita a nova senha"
                    />
                </div>

                <div className="pt-2">
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Atualizando...
                            </>
                        ) : (
                            'Atualizar Senha'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};
