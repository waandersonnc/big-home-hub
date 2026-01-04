import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from 'react';
import { authService } from '@/services/auth.service';
import { Loader2 } from 'lucide-react';

interface Step3Props {
    value: string;
    onChange: (val: string) => void;
    onNext: () => void;
}

export default function Step3Email({ value, onChange, onNext }: Step3Props) {
    const [error, setError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(value)) {
            setError("Por favor, insira um e-mail válido.");
            return;
        }

        setIsValidating(true);
        setError(null);
        try {
            const exists = await authService.checkEmailExists(value);
            if (exists) {
                setError("Este e-mail já está em uso.");
            } else {
                onNext();
            }
        } catch (err) {
            // If we can't check (e.g. table doesn't exist yet), let them proceed to next step
            // but the final signup will fail if it's actually invalid.
            onNext();
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-lg">E-mail corporativo</Label>
                <p className="text-sm text-muted-foreground">Seu e-mail será o seu login principal no BigHome Hub.</p>
                <div className="relative">
                    <Input
                        id="email"
                        type="email"
                        placeholder="nome@imobiliaria.com"
                        value={value}
                        onChange={(e) => {
                            onChange(e.target.value);
                            setError(null);
                        }}
                        className={`text-lg h-12 pr-10 ${error ? 'border-destructive' : ''}`}
                        autoFocus
                    />
                    {isValidating && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        </form>
    );
}
