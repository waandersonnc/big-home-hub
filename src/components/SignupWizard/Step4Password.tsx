import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { SignupFormData } from '@/types';

interface Step4Props {
    formData: SignupFormData;
    onChange: (data: Partial<SignupFormData>) => void;
    onSubmit: () => void;
    isLoading: boolean;
}

export default function Step4Password({ formData, onChange, onSubmit, isLoading }: Step4Props) {
    const [showPassword, setShowPassword] = useState(false);

    const hasLength = formData.password.length >= 8;
    const hasUpper = /[A-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const matches = formData.password && formData.password === formData.confirmPassword;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (hasLength && hasUpper && hasNumber && matches) onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">Crie uma senha forte</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => onChange({ password: e.target.value })}
                            className="h-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirme sua senha</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword || ''}
                        onChange={(e) => onChange({ confirmPassword: e.target.value })}
                        className={`h-12 ${formData.confirmPassword && !matches ? 'border-destructive' : ''}`}
                    />
                </div>

                <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Requisitos de segurança:</span>
                    </div>
                    <ul className="grid grid-cols-2 gap-2 text-xs">
                        <li className={`flex items-center gap-2 ${hasLength ? 'text-success' : 'text-muted-foreground'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${hasLength ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                            Mínimo 8 caracteres
                        </li>
                        <li className={`flex items-center gap-2 ${hasUpper ? 'text-success' : 'text-muted-foreground'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${hasUpper ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                            Uma letra maiúscula
                        </li>
                        <li className={`flex items-center gap-2 ${hasNumber ? 'text-success' : 'text-muted-foreground'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${hasNumber ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                            Ao menos um número
                        </li>
                        <li className={`flex items-center gap-2 ${matches ? 'text-success' : 'text-muted-foreground'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${matches ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                            Senhas coincidem
                        </li>
                    </ul>
                </div>
            </div>
        </form>
    );
}
