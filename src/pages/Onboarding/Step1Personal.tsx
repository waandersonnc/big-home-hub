import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ImageUpload';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface Step1Props {
    userId: string;
    data: any;
    onUpdate: (val: any) => void;
    onNext: () => void;
}

export default function Step1Personal({ userId, data, onUpdate, onNext }: Step1Props) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const formatCpfCnpj = (val: string) => {
        const cleaned = val.replace(/\D/g, '');
        if (cleaned.length <= 11) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    };

    const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').substring(0, 14);
        onUpdate({ cpf_cnpj: value }); // store cleaned
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('owners')
                .update({
                    profile_photo_url: data.profile_photo_url || '',
                    cpf_cnpj: data.cpf_cnpj,
                    personal_data_completed: true
                })
                .eq('id', userId);

            if (error) throw error;
            onNext();
        } catch (error: any) {
            toast({
                title: "Erro ao salvar",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-slide-in-left">
            <div className="flex flex-col items-center gap-6">
                <Label className="text-xl font-semibold">Foto de Perfil</Label>
                <ImageUpload
                    type="profile"
                    userId={userId}
                    defaultImage={data.profile_photo_url}
                    onUpload={(url) => onUpdate({ profile_photo_url: url })}
                />
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                    Uma foto profissional ajuda a passar mais confiança para seus clientes.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="cpf_cnpj" className="text-lg">CPF ou CNPJ</Label>
                <Input
                    id="cpf_cnpj"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={formatCpfCnpj(data.cpf_cnpj)}
                    onChange={handleCpfCnpjChange}
                    className="text-lg h-12"
                />
            </div>

            <Button
                onClick={handleSubmit}
                className="w-full h-12 text-lg"
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : 'Próximo passo'}
            </Button>
        </div>
    );
}
