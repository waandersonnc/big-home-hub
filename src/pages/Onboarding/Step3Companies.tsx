import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ImageUpload';
import { viaCepService } from '@/services/viacep.service';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search, MapPin, Building } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import type { OnboardingCompanyData, CompanyData } from '@/types';

interface Step3Props {
    userId: string;
    data: OnboardingCompanyData & { company_count: number };
    onUpdate: (val: Partial<OnboardingCompanyData & { company_count: number }>) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function Step3Companies({ userId, data, onUpdate, onNext, onBack }: Step3Props) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isSearchingCep, setIsSearchingCep] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const count = data.company_count;
    const companies = data.companies;

    const currentCompany = companies[currentIdx] || {
        name: '',
        company_logo_url: '',
        address_zipcode: '',
        address_street: '',
        address_number: '',
        address_complement: '',
        address_neighborhood: '',
        address_city: '',
        address_state: '',
    };

    const updateCompany = (val: Partial<CompanyData>) => {
        const newCompanies = [...companies];
        newCompanies[currentIdx] = { ...currentCompany, ...val };
        onUpdate({ companies: newCompanies });
    };

    const handleSearchCep = async () => {
        if (currentCompany.address_zipcode.length < 8) return;
        setIsSearchingCep(true);
        try {
            const addr = await viaCepService.buscarCep(currentCompany.address_zipcode);
            updateCompany({
                address_street: addr.logradouro,
                address_neighborhood: addr.bairro,
                address_city: addr.localidade,
                address_state: addr.uf,
            });
        } catch (error) {
            const err = error as Error;
            logger.error('Erro ao buscar CEP:', err.message);
            toast({ title: "Erro no CEP", description: err.message, variant: "destructive" });
        } finally {
            setIsSearchingCep(false);
        }
    };

    const saveAndNext = async () => {
        if (!currentCompany.name) {
            toast({ title: "Obrigatório", description: "Nome da imobiliária é necessário." });
            return;
        }

        if (currentIdx < count - 1) {
            setCurrentIdx(currentIdx + 1);
        } else {
            // Final save for all companies
            setIsLoading(true);
            try {
                // Delete previous if updating to avoid duplication
                await supabase.from('real_estate_companies').delete().eq('owner_id', userId);

                const companiesToInsert = companies.map(c => ({
                    ...c,
                    owner_id: userId
                }));

                const { error: insertError } = await supabase.from('real_estate_companies').insert(companiesToInsert);
                if (insertError) throw insertError;

                const { error: ownerError } = await supabase.from('owners').update({ companies_data_completed: true }).eq('id', userId);
                if (ownerError) throw ownerError;

                onNext();
            } catch (error) {
                const err = error as Error;
                logger.error('Erro ao salvar empresas:', err.message);
                toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="space-y-8 animate-slide-in-left">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                        {currentIdx + 1}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Imobiliária {currentIdx + 1} de {count}</h3>
                        <p className="text-xs text-muted-foreground uppercase">Dados da Unidade</p>
                    </div>
                </div>
            </div>

            <Card className="p-8 space-y-8 bg-card shadow-soft">
                <div className="flex flex-col items-center gap-4">
                    <Label>Logo da Imobiliária (opcional)</Label>
                    <ImageUpload
                        type="company"
                        userId={userId}
                        companyId={currentIdx.toString()}
                        defaultImage={currentCompany.company_logo_url}
                        onUpload={(url) => updateCompany({ company_logo_url: url })}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <Label>Nome da Imobiliária</Label>
                        <Input
                            placeholder="Ex: BigHome Imóveis"
                            value={currentCompany.name}
                            onChange={(e) => updateCompany({ name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>CEP</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="00000-000"
                                value={currentCompany.address_zipcode}
                                onChange={(e) => updateCompany({ address_zipcode: e.target.value.replace(/\D/g, '') })}
                            />
                            <Button size="icon" onClick={handleSearchCep} disabled={isSearchingCep}>
                                {isSearchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Rua</Label>
                        <Input value={currentCompany.address_street} onChange={(e) => updateCompany({ address_street: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                        <Label>Número</Label>
                        <Input value={currentCompany.address_number} onChange={(e) => updateCompany({ address_number: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                        <Label>Bairro</Label>
                        <Input value={currentCompany.address_neighborhood} onChange={(e) => updateCompany({ address_neighborhood: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input value={currentCompany.address_city} onChange={(e) => updateCompany({ address_city: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                        <Label>Estado (UF)</Label>
                        <Input maxLength={2} value={currentCompany.address_state} onChange={(e) => updateCompany({ address_state: e.target.value.toUpperCase() })} />
                    </div>
                </div>
            </Card>

            <div className="flex gap-4">
                <Button variant="outline" onClick={currentIdx === 0 ? onBack : () => setCurrentIdx(currentIdx - 1)} className="w-1/3 h-12">
                    Anterior
                </Button>
                <Button onClick={saveAndNext} className="flex-1 h-12 text-lg" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : (currentIdx < count - 1 ? 'Próxima Imobiliária' : 'Salvar e Finalizar')}
                </Button>
            </div>
        </div>
    );
}
