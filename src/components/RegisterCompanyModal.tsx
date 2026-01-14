import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { Loader2, Building, Search, Upload, X } from 'lucide-react';
import { viaCepService } from '@/services/viacep.service';
import { logger } from '@/lib/logger';

interface RegisterCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ESTADOS = [
    { uf: 'AC', nome: 'Acre' },
    { uf: 'AL', nome: 'Alagoas' },
    { uf: 'AP', nome: 'Amapá' },
    { uf: 'AM', nome: 'Amazonas' },
    { uf: 'BA', nome: 'Bahia' },
    { uf: 'CE', nome: 'Ceará' },
    { uf: 'DF', nome: 'Distrito Federal' },
    { uf: 'ES', nome: 'Espírito Santo' },
    { uf: 'GO', nome: 'Goiás' },
    { uf: 'MA', nome: 'Maranhão' },
    { uf: 'MT', nome: 'Mato Grosso' },
    { uf: 'MS', nome: 'Mato Grosso do Sul' },
    { uf: 'MG', nome: 'Minas Gerais' },
    { uf: 'PA', nome: 'Pará' },
    { uf: 'PB', nome: 'Paraíba' },
    { uf: 'PR', nome: 'Paraná' },
    { uf: 'PE', nome: 'Pernambuco' },
    { uf: 'PI', nome: 'Piauí' },
    { uf: 'RJ', nome: 'Rio de Janeiro' },
    { uf: 'RN', nome: 'Rio Grande do Norte' },
    { uf: 'RS', nome: 'Rio Grande do Sul' },
    { uf: 'RO', nome: 'Rondônia' },
    { uf: 'RR', nome: 'Roraima' },
    { uf: 'SC', nome: 'Santa Catarina' },
    { uf: 'SP', nome: 'São Paulo' },
    { uf: 'SE', nome: 'Sergipe' },
    { uf: 'TO', nome: 'Tocantins' },
];

export function RegisterCompanyModal({ isOpen, onClose }: RegisterCompanyModalProps) {
    const { user } = useAuthContext();
    const { refreshCompanies } = useCompany();
    const [loading, setLoading] = useState(false);
    const [isSearchingCep, setIsSearchingCep] = useState(false);
    const [cities, setCities] = useState<string[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        zip_code: '',
        address: '',
        city: '',
        state: '',
        logo_url: ''
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const handlePhoneMask = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .substring(0, 15);
    };

    const handleCnpjMask = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .substring(0, 18);
    };

    const handleCepMask = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{5})(\d)/, '$1-$2')
            .substring(0, 9);
    };

    const fetchCities = async (uf: string) => {
        if (!uf) return;
        setLoadingCities(true);
        try {
            const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
            const data = await response.json();
            const cityNames = data.map((city: any) => city.nome).sort();
            setCities(cityNames);
        } catch (error) {
            console.error('Erro ao buscar cidades:', error);
            toast.error('Erro ao buscar lista de cidades.');
        } finally {
            setLoadingCities(false);
        }
    };

    useEffect(() => {
        if (formData.state) {
            fetchCities(formData.state);
        }
    }, [formData.state]);

    const handleSearchCep = async () => {
        const rawCep = formData.zip_code.replace(/\D/g, '');
        if (rawCep.length < 8) return;

        setIsSearchingCep(true);
        try {
            const addr = await viaCepService.buscarCep(rawCep);
            setFormData(prev => ({
                ...prev,
                address: `${addr.logradouro}, ${addr.bairro}`,
                city: addr.localidade,
                state: addr.uf,
            }));
        } catch (error) {
            const err = error as Error;
            logger.error('Erro ao buscar CEP:', err.message);
            toast.error('CEP não encontrado ou erro na busca.');
        } finally {
            setIsSearchingCep(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Logo deve ter no máximo 2MB');
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.name || !formData.cnpj || !formData.phone || !formData.email || !formData.address || !formData.city || !formData.state) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }

        setLoading(true);
        try {
            let finalLogoUrl = '';

            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `${user.id}/${Math.random()}.${fileExt}`;
                const filePath = `company-logos/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('profile-photos')
                    .upload(filePath, logoFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('profile-photos')
                    .getPublicUrl(filePath);

                finalLogoUrl = publicUrl;
            }

            const { data: company, error } = await supabase
                .from('real_estate_companies')
                .insert({
                    name: formData.name,
                    trading_name: formData.name, // Usando o nome como fantasia por padrão
                    document: formData.cnpj,
                    email: formData.email,
                    phone: formData.phone,
                    zip_code: formData.zip_code,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    logo_url: finalLogoUrl,
                    owner_id: user.id // O ID do dono logado é salvo no campo owner_id conforme schema do banco
                })
                .select()
                .single();

            if (error) throw error;

            toast.success('Imobiliária cadastrada com sucesso!');
            await refreshCompanies(false); // Silent refresh para não travar a tela
            onClose();
        } catch (error: any) {
            console.error('Erro ao cadastrar imobiliária:', error);
            toast.error('Erro ao cadastrar imobiliária: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Building className="text-primary" />
                        Cadastrar Imobiliária
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="flex flex-col items-center gap-4">
                        <Label>Logo da Imobiliária (Opcional)</Label>
                        <div className="relative group">
                            <div className="h-24 w-24 rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center overflow-hidden bg-muted/5">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <Building size={32} className="text-muted-foreground/30" />
                                )}
                            </div>
                            <Label
                                htmlFor="logo-upload"
                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl"
                            >
                                <Upload size={20} className="text-white" />
                            </Label>
                            <input
                                id="logo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoChange}
                            />
                            {logoPreview && (
                                <button
                                    type="button"
                                    onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="comp-name">Nome da Imobiliária *</Label>
                            <Input
                                id="comp-name"
                                placeholder="Ex: BigHome Imóveis"
                                value={formData.name}
                                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="comp-cnpj">CNPJ *</Label>
                            <Input
                                id="comp-cnpj"
                                placeholder="00.000.000/0000-00"
                                value={formData.cnpj}
                                onChange={(e) => setFormData(p => ({ ...p, cnpj: handleCnpjMask(e.target.value) }))}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="comp-email">E-mail de Contato *</Label>
                            <Input
                                id="comp-email"
                                type="email"
                                placeholder="contato@imobiliaria.com"
                                value={formData.email}
                                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="comp-phone">Telefone *</Label>
                            <Input
                                id="comp-phone"
                                placeholder="(00) 00000-0000"
                                value={formData.phone}
                                onChange={(e) => setFormData(p => ({ ...p, phone: handlePhoneMask(e.target.value) }))}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Endereço</h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="comp-zip">CEP *</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="comp-zip"
                                        placeholder="00000-000"
                                        value={formData.zip_code}
                                        onChange={(e) => setFormData(p => ({ ...p, zip_code: handleCepMask(e.target.value) }))}
                                        onBlur={handleSearchCep}
                                        required
                                    />
                                    <Button type="button" size="icon" variant="outline" onClick={handleSearchCep} disabled={isSearchingCep}>
                                        {isSearchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="comp-addr">Rua e Número *</Label>
                                <Input
                                    id="comp-addr"
                                    placeholder="Rua das Flores, 123"
                                    value={formData.address}
                                    onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="comp-state">Estado *</Label>
                                <select
                                    id="comp-state"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.state}
                                    onChange={(e) => setFormData(p => ({ ...p, state: e.target.value, city: '' }))}
                                    required
                                >
                                    <option value="">Selecione o Estado</option>
                                    {ESTADOS.map(uf => (
                                        <option key={uf.uf} value={uf.uf}>{uf.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="comp-city">Cidade *</Label>
                                <select
                                    id="comp-city"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.city}
                                    onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                                    required
                                    disabled={!formData.state || loadingCities}
                                >
                                    <option value="">{loadingCities ? 'Carregando cidades...' : 'Selecione a Cidade'}</option>
                                    {cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="px-8">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cadastrando...
                                </>
                            ) : (
                                'Cadastrar Imobiliária'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
