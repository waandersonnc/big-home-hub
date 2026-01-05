import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { OnboardingQuantityData } from '@/types';

interface Step2Props {
    data: OnboardingQuantityData & { company_count?: number };
    onUpdate: (val: Partial<OnboardingQuantityData & { company_count?: number }>) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function Step2Quantity({ data, onUpdate, onNext, onBack }: Step2Props) {
    const options = [1, 2, 3, 4];

    return (
        <div className="space-y-8 animate-slide-in-left">
            <div className="space-y-4 text-center">
                <Label className="text-2xl font-bold">Quantas imobiliárias você possui?</Label>
                <p className="text-muted-foreground">Vamos configurar os perfis para cada uma delas.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {options.map((opt) => (
                    <Card
                        key={opt}
                        onClick={() => onUpdate({ company_count: opt })}
                        className={`p-6 cursor-pointer border-2 transition-all flex flex-col items-center justify-center gap-2 hover:border-primary ${data.company_count === opt ? 'border-primary bg-primary/5' : ''}`}
                    >
                        <span className="text-3xl font-bold">{opt === 4 ? '4+' : opt}</span>
                        <span className="text-xs uppercase font-medium text-muted-foreground">{opt === 1 ? 'Unidade' : 'Unidades'}</span>
                    </Card>
                ))}
            </div>

            <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={onBack} className="w-1/3 h-12">Anterior</Button>
                <Button onClick={onNext} className="flex-1 h-12 text-lg">Continuar</Button>
            </div>
        </div>
    );
}
