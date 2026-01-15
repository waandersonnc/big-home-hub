import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useFacebookSDK } from '@/hooks/useFacebookSDK';
import { metaService, type MetaIntegration } from '@/services/meta.service';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, Facebook, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Interfaces
interface AdAccount {
    id: string;
    account_id: string;
    name: string;
}

interface FacebookPage {
    id: string;
    name: string;
    access_token: string;
}

interface FacebookBusiness {
    id: string;
    name: string;
}

interface FacebookPermission {
    permission: string;
    status: string;
}

export function MetaConnectModal({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Connect, 2: Select Account, 3: Success, 4: Disconnect Confirm
    const [loading, setLoading] = useState(false);
    const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [businesses, setBusinesses] = useState<FacebookBusiness[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [selectedPage, setSelectedPage] = useState<string>('');
    const [selectedBusiness, setSelectedBusiness] = useState<string>('');
    const [accessToken, setAccessToken] = useState('');
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    // Permission Selection State
    const [requestMetrics, setRequestMetrics] = useState(true);
    const [requestLeads, setRequestLeads] = useState(true);

    const { isLoaded, login } = useFacebookSDK();
    const { selectedCompanyId } = useCompany();
    const { user } = useAuthContext();

    // Check initial status
    useEffect(() => {
        let isMounted = true;
        const checkStatus = async () => {
            if (selectedCompanyId && isOpen && step === 1) {
                try {
                    const integration = await metaService.getIntegration(selectedCompanyId);
                    if (isMounted && integration?.is_active) {
                        setStep(4);
                    }
                } catch (err) {
                    console.error('Erro ao verificar status inicial:', err);
                }
            }
        };
        checkStatus();
        return () => { isMounted = false; };
    }, [isOpen, selectedCompanyId, step]);

    const handleLogin = async () => {
        if (!requestMetrics && !requestLeads) {
            toast.error("Por favor, selecione pelo menos uma opção de integração.");
            return;
        }

        setLoading(true);
        try {
            // Escopos melhorados para Gerenciamento de Negócios e Leads Offline
            const scopes = ['public_profile', 'email', 'business_management'];
            if (requestMetrics) scopes.push('ads_read');
            if (requestLeads) scopes.push('leads_retrieval', 'pages_show_list', 'pages_read_engagement');

            const response = await login(scopes.join(','));

            if (!response.authResponse) {
                toast.error('Login cancelado ou falhou.');
                return;
            }
            setAccessToken(response.authResponse.accessToken);

            // 1. Verify Permissions explicitly
            try {
                const dataPerms = await metaService.verifyPermissions(response.authResponse.accessToken);
                const warnings: string[] = [];
                
                if (requestLeads) {
                    const hasPagesShow = dataPerms.some((p: FacebookPermission) => p.permission === 'pages_show_list' && p.status === 'granted');
                    const hasLeadsRet = dataPerms.some((p: FacebookPermission) => p.permission === 'leads_retrieval' && p.status === 'granted');
                    const hasBiz = dataPerms.some((p: FacebookPermission) => p.permission === 'business_management' && p.status === 'granted');
                    
                    if (!hasPagesShow) warnings.push('Permissão "pages_show_list" não concedida.');
                    if (!hasLeadsRet) warnings.push('Permissão "leads_retrieval" não concedida.');
                    if (!hasBiz) warnings.push('Permissão "business_management" não concedida.');
                }
                
                if (requestMetrics) {
                    const hasAdsRead = dataPerms.some((p: FacebookPermission) => p.permission === 'ads_read' && p.status === 'granted');
                    if (!hasAdsRead) warnings.push('Permissão "ads_read" não concedida.');
                }

                if (warnings.length > 0) {
                    toast.warning("Atenção com as permissões:", {
                        description: warnings.join(" "),
                        duration: Infinity // Keep warnings visible
                    });
                }
            } catch (permErr) {
                console.error('Erro ao verificar permissões:', permErr);
            }

            // Fetch Data based on selection
            const promises = [];
            
            // Sempre buscamos BMs para contexto
            promises.push(
                metaService.getBusinesses(response.authResponse.accessToken)
                    .then(b => {
                        // Filtra duplicatas por ID para evitar que a BM apareça duas vezes
                        const uniqueBusinesses = (b || []).reduce((acc: FacebookBusiness[], current: FacebookBusiness) => {
                            if (!acc.find(item => item.id === current.id)) {
                                acc.push(current);
                            }
                            return acc;
                        }, []);
                        setBusinesses(uniqueBusinesses);
                    })
                    .catch(e => console.error('Erro BMs:', e))
            );

            if (requestMetrics) {
                promises.push(
                    metaService.getAdAccounts(response.authResponse.accessToken)
                        .then(accounts => {
                            if (accounts.length === 0) toast.info('Nenhuma conta de anúncios encontrada.');
                            setAdAccounts(accounts);
                        })
                        .catch((accError: unknown) => {
                            console.error('Erro AdAccounts:', accError);
                            toast.error(`Falha ao buscar anúncios. Verifique as permissões.`, { duration: Infinity });
                        })
                );
            }

            if (requestLeads) {
                promises.push(
                    metaService.getPages(response.authResponse.accessToken)
                        .then(p => {
                            if (p.length === 0) toast.info('Nenhuma página encontrada. Verifique se você é Admin.');
                            setPages(p);
                        })
                        .catch((err: unknown) => {
                            console.error('Erro Pages:', err);
                            toast.error(`Erro ao buscar páginas.`, { duration: Infinity });
                        })
                );
            }

            await Promise.all(promises);
            setStep(2);

        } catch (error: unknown) {
            console.error('Erro no login/busca:', error);
            const msg = error instanceof Error ? error.message : String(error);
            toast.error(msg || 'Erro ao conectar com Facebook', { duration: Infinity });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (requestMetrics && !selectedAccount) {
            toast.error('Selecione uma conta de anúncios.', { duration: Infinity });
            return;
        }
        if (requestLeads && !selectedPage) {
            toast.error('Selecione uma página do Facebook.', { duration: Infinity });
            return;
        }
        if (!selectedCompanyId) {
            toast.error('Nenhuma imobiliária selecionada.', { duration: Infinity });
            return;
        }

        setLoading(true);
        try {
            const account = adAccounts.find(a => a.id === selectedAccount);
            const page = pages.find(p => p.id === selectedPage);
            const business = businesses.find(b => b.id === selectedBusiness);
            const ownerId = user?.role === 'owner' ? user.id : (user?.my_owner || user?.id);

            // Verificação de segurança: garantir que temos os dados necessários
            const payload = {
                company_id: selectedCompanyId,
                meta_access_token: accessToken,
                meta_ad_account_id: account?.id || account?.account_id || null, // Preferencialmente o ID no formato act_...
                meta_ad_account_name: account?.name || null,
                meta_page_id: page?.id || null,
                meta_page_name: page?.name || null,
                meta_page_access_token: page?.access_token || null, // TOKEN DA PÁGINA PARA O N8N (CRUCIAL PARA LEADS)
                meta_business_id: business?.id || null,
                meta_business_name: business?.name || null,
                is_active: true,
                my_owner: ownerId,
                scope_leads: requestLeads,
                scope_metrics: requestMetrics
            };

            await metaService.saveIntegration(payload);

            setStep(3);
            toast.success('Conta Meta conectada com sucesso!');

            // Aguarda um pouco para mostrar o sucesso antes de recarregar
            setTimeout(() => {
                setIsOpen(false);
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error('Erro ao salvar integração:', error);
            toast.error('Erro ao salvar integração no banco de dados.', { duration: Infinity });
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!selectedCompanyId) return;

        setLoading(true);
        try {
            await metaService.deleteIntegration(selectedCompanyId);
            toast.success('Conta removida e dados limpos com sucesso.');
            setIsOpen(false);
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao remover conexão', { duration: Infinity });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{step === 5 ? "Desconectar Conta" : step === 4 ? "Gerenciar Conexão" : "Conectar Meta Ads"}</DialogTitle>
                    <DialogDescription>
                        {step === 5
                            ? "Tem certeza que deseja remover esta conexão?"
                            : step === 4
                            ? "Gerencie a conexão da sua conta de anúncios."
                            : "Escolha quais recursos deseja integrar com o sistema."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {step === 1 && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="bg-blue-50 p-4 rounded-full">
                                <Facebook className="h-12 w-12 text-blue-600" />
                            </div>

                            <div className="w-full space-y-4 px-2">
                                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                                    <Checkbox
                                        id="metrics"
                                        checked={requestMetrics}
                                        onCheckedChange={(c) => setRequestMetrics(c as boolean)}
                                        className="mt-1"
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="metrics" className="font-medium cursor-pointer">
                                            Quero ver minhas métricas
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Importa dados de impressões, cliques e custos. Requer permissão <b>ads_read</b> (pode exigir aprovação da Meta).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                                    <Checkbox
                                        id="leads"
                                        checked={requestLeads}
                                        onCheckedChange={(c) => setRequestLeads(c as boolean)}
                                        className="mt-1"
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="leads" className="font-medium cursor-pointer">
                                            Quero gerenciar meus leads
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Importa leads dos formulários automaticamente. Requer permissão <b>leads_retrieval</b> (Geralmente pré-aprovado).
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleLogin} disabled={!isLoaded || loading} className="w-full bg-[#1877F2] hover:bg-[#1864D1]">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Facebook className="mr-2 h-4 w-4" />}
                                Continuar com Facebook
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 max-h-[400px] overflow-y-auto px-1">
                            {businesses.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Empresa (Business Manager)</label>
                                    <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a BM (Opcional)..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {businesses.map((biz) => (
                                                <SelectItem key={biz.id} value={biz.id}>
                                                    {biz.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {requestMetrics && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Conta de Anúncios (Métricas)</label>
                                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a conta de anúncios..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {adAccounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    {account.name} ({account.account_id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {adAccounts.length === 0 && (
                                        <div className="p-3 bg-amber-50 text-amber-600 rounded-md text-sm flex gap-2">
                                            <AlertCircle className="h-4 w-4 mt-0.5" />
                                            <p>Nenhuma conta de anúncios encontrada.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {requestLeads && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Página do Facebook (Leads)</label>
                                    <Select value={selectedPage} onValueChange={setSelectedPage}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a página..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pages.map((page) => (
                                                <SelectItem key={page.id} value={page.id}>
                                                    {page.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {pages.length === 0 && (
                                        <div className="p-3 bg-amber-50 text-amber-600 rounded-md text-sm flex gap-2">
                                            <AlertCircle className="h-4 w-4 mt-0.5" />
                                            <p>Nenhuma página encontrada. Verifique se é Admin.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!requestMetrics && !requestLeads && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                                    Erro: Nenhuma opção selecionada.
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-4">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                            <p className="font-medium text-lg">Conectado com Sucesso</p>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-2">
                            <div className="bg-green-50 p-4 rounded-full mb-2">
                                <CheckCircle className="h-10 w-10 text-green-500" />
                            </div>
                            <p className="text-center font-medium text-lg">
                                Conta Conectada
                            </p>
                            <p className="text-center text-sm text-muted-foreground px-4">
                                Sua conta do Facebook está conectada. Os leads e métricas estão sendo sincronizados automaticamente.
                            </p>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-2">
                            <div className="bg-red-50 p-4 rounded-full mb-2">
                                <AlertCircle className="h-10 w-10 text-red-500" />
                            </div>
                            <p className="text-center font-medium">
                                Tem certeza que deseja desconectar sua conta?
                            </p>
                            <p className="text-center text-sm text-muted-foreground px-4">
                                Ao desconectar, pararemos de importar seus leads e atualizar as métricas automaticamente.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {step === 2 && (
                        <Button
                            onClick={handleSave}
                            disabled={loading || (requestMetrics && !selectedAccount) || (requestLeads && !selectedPage)}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {requestMetrics ? 'Salvar e Sincronizar' : 'Confirmar Conexão'}
                        </Button>
                    )}

                    {step === 4 && (
                        <div className="flex w-full gap-2">
                            <Button 
                                variant="destructive" 
                                onClick={() => setStep(5)} 
                                disabled={loading}
                                className="flex-1"
                            >
                                Desconectar
                            </Button>
                            <Button 
                                variant="default" 
                                onClick={() => setStep(1)} 
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                Reconectar
                            </Button>
                        </div>
                    )}

                    {step === 5 && (
                        <>
                            <Button variant="outline" onClick={() => setStep(4)} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleDisconnect} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sim, desconectar
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
