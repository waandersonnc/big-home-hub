import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFacebookSDK } from '@/hooks/useFacebookSDK';
import { metaService } from '@/services/meta.service';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, Facebook, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function MetaConnectModal({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Connect, 2: Select Account, 3: Success, 4: Disconnect Confirm
    const [loading, setLoading] = useState(false);
    const [adAccounts, setAdAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [accessToken, setAccessToken] = useState('');
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const { isLoaded, login, getAdAccounts, verifyPermissions } = useFacebookSDK();
    const { selectedCompanyId } = useCompany();
    const { user } = useAuthContext();

    // Check initial status
    useEffect(() => {
        const checkStatus = async () => {
            if (selectedCompanyId && isOpen) {
                const integration = await metaService.getIntegration(selectedCompanyId);
                if (integration?.is_active) {
                    setStep(4); // Go directly to disconnect confirmation if already connected
                }
            }
        };
        checkStatus();
    }, [isOpen, selectedCompanyId]);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const response = await login();
            if (!response.authResponse) {
                toast.error('Login cancelado ou falhou.');
                return;
            }
            setAccessToken(response.authResponse.accessToken);

            // Verificar permissões
            try {
                const perms = await verifyPermissions();
                const required = ['ads_read', 'leads_retrieval'];
                const missing = required.filter(r =>
                    !perms.find((p: any) => p.permission === r && p.status === 'granted')
                );

                if (missing.length > 0) {
                    console.warn('Permissões faltando:', missing);
                    toast.warning(`Atenção: Algumas permissões importantes não foram concedidas (${missing.join(', ')}). A integração pode não funcionar corretamente.`);
                }
            } catch (permErr) {
                console.error('Erro ao verificar permissões:', permErr);
            }

            // Busca segura via Backend (Edge Function)
            const accounts = await metaService.getAdAccounts(response.authResponse.accessToken);

            if (accounts.length === 0) {
                toast.info('Nenhuma conta de anúncios foi encontrada para este usuário. Verifique se você tem acesso administrativo.');
            }
            setAdAccounts(accounts);
            setStep(2);
        } catch (error: any) {
            console.error('Erro no login/busca:', error);
            // Mostra o erro exato retornado pelo SDK para o usuário
            toast.error(typeof error === 'string' ? error : (error.message || 'Erro ao conectar com Facebook'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedAccount || !selectedCompanyId) return;

        setLoading(true);
        try {
            const { user } = useAuthContext();

            // ... inside handleSave
            const account = adAccounts.find(a => a.id === selectedAccount);
            const ownerId = user?.role === 'owner' ? user.id : user?.my_owner;

            await metaService.saveIntegration({
                company_id: selectedCompanyId,
                meta_access_token: accessToken,
                meta_ad_account_id: account.account_id,
                meta_ad_account_name: account.name,
                is_active: true,
                my_owner: ownerId
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
                is_active: false
            } as any); // Type assertion needed because we're clearing required fields

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
                            : "Conecte sua conta de anúncios para importar leads e métricas automaticamente."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {step === 1 && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-blue-50 p-4 rounded-full">
                                <Facebook className="h-12 w-12 text-blue-600" />
                            </div>
                            <p className="text-center text-muted-foreground text-sm">
                                Será necessário conceder permissões para leitura de anúncios e leads.
                            </p>
                            <Button onClick={handleLogin} disabled={!isLoaded || loading} className="w-full bg-[#1877F2] hover:bg-[#1864D1]">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Facebook className="mr-2 h-4 w-4" />}
                                Continuar com Facebook
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Selecione a Conta de Anúncios</label>
                                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma conta..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {adAccounts.map((account) => (
                                            <SelectItem key={account.id} value={account.id}>
                                                {account.name} ({account.account_id})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {adAccounts.length === 0 && (
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-md text-sm flex gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5" />
                                    <p>Nenhuma conta de anúncios encontrada para este usuário.</p>
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
                        <Button onClick={handleSave} disabled={!selectedAccount || loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar e Sincronizar
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
