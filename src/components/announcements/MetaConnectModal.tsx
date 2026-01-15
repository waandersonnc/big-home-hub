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
    access_token?: string;
}

export function MetaConnectModal({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Connect, 2: Select Account, 3: Success, 4: Disconnect Confirm
    const [loading, setLoading] = useState(false);
    const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [selectedPage, setSelectedPage] = useState<string>('');
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
        const checkStatus = async () => {
            if (selectedCompanyId && isOpen) {
                const integration = await metaService.getIntegration(selectedCompanyId);
                if (integration?.is_active) {
                    setStep(4);
                }
            }
        };
        checkStatus();
    }, [isOpen, selectedCompanyId]);

    const handleLogin = async () => {
        if (!requestMetrics && !requestLeads) {
            toast.error("Por favor, selecione pelo menos uma opção de integração.");
            return;
        }

        setLoading(true);
        try {
            const scopes = ['public_profile', 'email'];
            if (requestMetrics) scopes.push('ads_read');
            if (requestLeads) scopes.push('leads_retrieval', 'pages_show_list', 'pages_read_engagement');

            const response = await login(scopes.join(','));

            if (!response.authResponse) {
                toast.error('Login cancelado ou falhou.');
                return;
            }
            setAccessToken(response.authResponse.accessToken);

            // Fetch Data based on selection
            const promises = [];
            
            if (requestMetrics) {
                promises.push(
                    metaService.getAdAccounts(response.authResponse.accessToken)
                        .then(accounts => {
                            if (accounts.length === 0) toast.info('Nenhuma conta de anúncios encontrada.');
                            setAdAccounts(accounts);
                        })
                        .catch((accError: unknown) => {
                            const msg = accError instanceof Error ? accError.message : String(accError);
                            if (msg.includes('Unsupported get request')) {
                                toast.error('Erro de Permissão: Falha ao listar contas de anúncios. Verifique aprovação "ads_read".');
                            } else {
                                console.error(accError);
                            }
                        })
                );
            } else {
                setAdAccounts([]);
            }

            if (requestLeads) {
                promises.push(
                    metaService.getPages(response.authResponse.accessToken)
                        .then(p => {
                            if (p.length === 0) toast.info('Nenhuma página encontrada.');
                            setPages(p);
                        })
                        .catch(err => {
                            // This part of the code was added based on the user's instruction.
                            // Note: 'required' and 'perms' variables are not defined in the provided context.
                            // Assuming they would be defined in a real-world scenario or this is a partial change.
                            // For now, it's commented out to maintain syntactical correctness.
                            // const missing = required.filter(r =>
                            //     !perms.some((p: { permission: string; status: string }) => p.permission === r && p.status === 'granted')
                            // );
                            console.error('Erro Pages:', err);
                            toast.error('Falha ao listar páginas.');
                        })
                );
            } else {
                setPages([]);
            }

            await Promise.all(promises);
            setStep(2);

        } catch (error: unknown) {
            console.error('Erro no login/busca:', error);
            const msg = error instanceof Error ? error.message : String(error);
            toast.error(msg || 'Erro ao conectar com Facebook');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validation
        if (requestMetrics && !selectedAccount) {
            toast.error('Selecione uma conta de anúncios.');
            return;
        }
        if (requestLeads && !selectedPage) {
            toast.error('Selecione uma página do Facebook.');
            return;
        }
        if (!selectedCompanyId) return;

        setLoading(true);
        try {
            const account = adAccounts.find(a => a.id === selectedAccount);
            const page = pages.find(p => p.id === selectedPage);
            const ownerId = user?.role === 'owner' ? user.id : user?.my_owner;

            await metaService.saveIntegration({
                company_id: selectedCompanyId,
                meta_access_token: accessToken,
                meta_ad_account_id: account?.account_id || null, // Note: Use account_id (act_XXX) not id
                meta_ad_account_name: account?.name || null,
                meta_page_id: page?.id || null,
                meta_page_name: page?.name || null,
                is_active: true,
                my_owner: ownerId,
                scope_leads: requestLeads,
                scope_metrics: requestMetrics
            });

            setStep(3);
            toast.success('Conta Meta conectada com sucesso!');

            setTimeout(() => {
                setIsOpen(false);
                setStep(1);
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar integração');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!selectedCompanyId) return;

        setLoading(true);
        try {
            await metaService.saveIntegration({
                company_id: selectedCompanyId,
                meta_access_token: '',
                meta_ad_account_id: null,
                meta_ad_account_name: null,
                meta_page_id: null,
                meta_page_name: null,
                is_active: false,
                scope_leads: false,
                scope_metrics: false
            } as Omit<MetaIntegration, 'id' | 'created_at' | 'updated_at'>);

            toast.success('Conta desconectada com sucesso.');
            setIsOpen(false);
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao desconectar conta');
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
                    <DialogTitle>{step === 4 ? "Desconectar Conta" : "Conectar Meta Ads"}</DialogTitle>
                    <DialogDescription>
                        {step === 4
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
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5">
                            {requestMetrics && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Conta de Anúncios (Para Métricas)</label>
                                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma conta de anúncios..." />
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
                                            <p>Nenhuma conta encontrada ou permissão insuficiente para métricas.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {requestLeads && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Página do Facebook (Para Leads)</label>
                                    <Select value={selectedPage} onValueChange={setSelectedPage}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma página..." />
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
                                            <p>Nenhuma página encontrada. Você precisa ser admin da página.</p>
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
                        <>
                            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                                Não, cancelar
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
