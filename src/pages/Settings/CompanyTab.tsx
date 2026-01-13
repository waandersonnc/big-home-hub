import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { LogoUpload } from '@/components/Settings/LogoUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Building2, PlusCircle } from 'lucide-react';
import { RegisterCompanyModal } from '@/components/RegisterCompanyModal';


export const CompanyTab: React.FC = () => {
    const { isDemo } = useAuthContext();
    const { selectedCompanyId, refreshCompanies, companies } = useCompany();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        trading_name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        logo_url: ''
    });

    useEffect(() => {
        if (selectedCompanyId) {
            loadCompanyData();
        } else {
            setFetching(false);
        }
    }, [selectedCompanyId, companies.length]);


    const loadCompanyData = async () => {
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('real_estate_companies')
                .select('*')
                .eq('id', selectedCompanyId)
                .single();

            if (error) throw error;

            if (data) {
                setFormData({
                    name: data.name || '',
                    trading_name: data.trading_name || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    city: data.city || '',
                    state: data.state || '',
                    zip_code: data.zip_code || '',
                    logo_url: data.logo_url || ''
                });
            }
        } catch (error: any) {
            console.error('Error loading company:', error);
            toast.error('Erro ao carregar dados da imobiliária.');
        } finally {
            setFetching(false);
        }
    };

    const handlePhoneMask = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .substring(0, 15);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isDemo) {
            toast.error('Modo demonstração: alterações não permitidas.');
            return;
        }

        if (formData.name.trim().length < 3) {
            toast.error('O nome deve ter pelo menos 3 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('real_estate_companies')
                .update({
                    name: formData.name,
                    trading_name: formData.trading_name,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zip_code: formData.zip_code,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedCompanyId);

            if (error) throw error;

            toast.success('Dados da imobiliária atualizados!');
            await refreshCompanies();
        } catch (error: any) {
            toast.error('Erro ao atualizar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!selectedCompanyId) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-6 text-center animate-fade-in">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Building2 size={40} />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold italic tracking-tight">Nenhuma Imobiliária Ativa</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Parece que você ainda não cadastrou nenhuma unidade. Para começar a gerenciar seus leads, cadastre sua primeira imobiliária.
                    </p>
                </div>
                <Button onClick={() => setIsRegisterModalOpen(true)} className="gap-2 h-12 px-8 font-bold text-lg">
                    <PlusCircle size={20} />
                    Cadastrar Imob
                </Button>

                <RegisterCompanyModal
                    isOpen={isRegisterModalOpen}
                    onClose={() => setIsRegisterModalOpen(false)}
                />
            </div>
        );
    }


    return (
        <div className="space-y-8 max-w-2xl">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
                <Building2 className="w-10 h-10 text-primary" />
                <div>
                    <h3 className="font-semibold text-lg">Configurar Imobiliária</h3>
                    <p className="text-sm text-muted-foreground">
                        Alterando as informações da unidade selecionada no topo do sistema.
                    </p>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium mb-4 uppercase tracking-wider text-muted-foreground">Logo da Empresa</h4>
                <LogoUpload
                    companyId={selectedCompanyId!}
                    currentUrl={formData.logo_url}
                    onUploadSuccess={(url) => {
                        setFormData(prev => ({ ...prev, logo_url: url }));
                        refreshCompanies();
                    }}
                    onRemoveSuccess={() => {
                        setFormData(prev => ({ ...prev, logo_url: '' }));
                        refreshCompanies();
                    }}
                />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="company-name">Razão Social</Label>
                        <Input
                            id="company-name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: BigHome Imóveis LTDA"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="trading-name">Nome Fantasia</Label>
                        <Input
                            id="trading-name"
                            value={formData.trading_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, trading_name: e.target.value }))}
                            placeholder="Ex: BigHome Oficial"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="company-phone">Telefone</Label>
                        <Input
                            id="company-phone"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: handlePhoneMask(e.target.value) }))}
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="zip-code">CEP</Label>
                        <Input
                            id="zip-code"
                            value={formData.zip_code}
                            onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                            placeholder="00000-000"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Rua, Número, Bairro"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="Cidade"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="state">Estado (UF)</Label>
                        <Input
                            id="state"
                            value={formData.state}
                            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                            placeholder="SP"
                            maxLength={2}
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <Button type="submit" disabled={loading} className="w-full md:w-auto">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Salvar Dados da Unidade'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};
