import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Step2Props {
    value: string;
    onChange: (val: string) => void;
    onNext: () => void;
}

export default function Step2Phone({ value, onChange, onNext }: Step2Props) {
    const formatPhone = (val: string) => {
        const cleaned = val.replace(/\D/g, '');
        let formatted = cleaned;
        if (cleaned.length > 0) {
            formatted = '(' + cleaned.substring(0, 2);
            if (cleaned.length > 2) {
                formatted += ') ' + cleaned.substring(2, 7);
                if (cleaned.length > 7) {
                    formatted += '-' + cleaned.substring(7, 11);
                }
            }
        }
        return formatted.substring(0, 15);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        onChange(formatted);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.length >= 14) onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="phone" className="text-lg">Número de Telefone</Label>
                <p className="text-sm text-muted-foreground">Utilizaremos este número para contatos importantes e segurança.</p>
                <Input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={value}
                    onChange={handleInputChange}
                    className="text-lg h-12"
                    autoFocus
                />
                <p className="text-xs text-muted-foreground">Formato: (99) 99999-9999</p>
            </div>
        </form>
    );
}
