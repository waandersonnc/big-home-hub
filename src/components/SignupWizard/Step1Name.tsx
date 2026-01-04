import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Step1Props {
    value: string;
    onChange: (val: string) => void;
    onNext: () => void;
}

export default function Step1Name({ value, onChange, onNext }: Step1Props) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.length >= 3) onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="full_name" className="text-lg">Qual seu nome completo?</Label>
                <p className="text-sm text-muted-foreground">Use seu nome real para que seus clientes te identifiquem.</p>
                <Input
                    id="full_name"
                    placeholder="Ex: João Silva"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="text-lg h-12"
                    autoFocus
                />
                {value && value.length < 3 && (
                    <p className="text-xs text-destructive">O nome deve ter pelo menos 3 caracteres.</p>
                )}
            </div>
        </form>
    );
}
