import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { teamService } from '@/services/team.service';
import { useCompany } from '@/contexts/CompanyContext';
import { useRole } from '@/hooks/useAuth';
import { Loader2, AlertCircle, UserPlus, Shield, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import type { TeamMemberDisplay } from '@/types';
import { cn } from '@/lib/utils';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    managers: TeamMemberDisplay[];
}

export default function AddMemberModal({ isOpen, onClose, onSuccess, managers }: AddMemberModalProps) {
    const { selectedCompanyId } = useCompany();
    const { role, user: currentUser } = useRole();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [ownerId, setOwnerId] = useState<string>('');
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        user_type: 'manager' as 'manager' | 'broker',
        manager_id: '',
    });

    // Buscar o owner_id se necessário
    useEffect(() => {
        async function fetchOwnerId() {
            if (!currentUser) return;

            if (role === 'owner') {
                setOwnerId(currentUser.id);
            } else if (role === 'manager') {
                const { data } = await supabase
                    .from('managers')
                    .select('my_owner')
                    .eq('id', currentUser.id)
                    .maybeSingle();

                if (data?.my_owner) {
                    setOwnerId(data.my_owner);
                }
            }
        }
        fetchOwnerId();
    }, [role, currentUser]);

    // Se o usuário logado for gerente, ele só pode adicionar corretores para ele mesmo
    useEffect(() => {
        if (role === 'manager') {
            setFormData(prev => ({
                ...prev,
                user_type: 'broker',
                manager_id: currentUser?.id || ''
            }));
        }
    }, [role, currentUser]);

    const handleCreate = async () => {
        if (!currentUser) {
            toast({ title: "Sessão inválida", description: "Por favor faça login novamente.", variant: "destructive" });
            return;
        }

        if (!formData.full_name || !formData.email || !formData.phone) {
            toast({ title: "Preencha todos os campos", variant: "destructive" });
            return;
        }

        if (formData.user_type === 'broker' && !formData.manager_id) {
            toast({ title: "Selecione um gerente", description: "Corretores devem estar vinculados a um gerente.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            // Se for owner, o owner_id é o id dele. Se for gerente, precisamos do owner_id da empresa ou do gerente.
            // No entanto, o service-role na edge function pode tratar isso se passarmos os dados certos.
            // Para garantir, vamos passar o owner_id. Se o currentUser for Gerente, precisamos descobrir quem é o owner dele.
            // Mas o teamService.createMember no service pode lidar com isso se a edge function for inteligente.
            // Vamos assumir que passamos o ID do usuário que está criando e a edge function resolve.

            await teamService.createMember({
                ...formData,
                company_id: selectedCompanyId!,
                owner_id: ownerId
            });

            toast({
                title: "Membro adicionado!",
                description: `O usuário ${formData.full_name} foi criado com a senha @Bighome123.`
            });
            onSuccess();
            onClose();
            setFormData({ full_name: '', email: '', phone: '', user_type: 'manager', manager_id: '' });
        } catch (error) {
            const err = error as Error;
            logger.error('Erro ao criar membro da equipe:', err.message);
            toast({
                title: "Erro ao criar membro",
                description: err.message || "Verifique se o e-mail já está em uso.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const noManagers = managers.length === 0;
    const isOwner = role === 'owner';
    const isManager = role === 'manager';

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

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setFormData(prev => ({ ...prev, phone: formatted }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl border-none shadow-elevated bg-card">
                <DialogHeader className="p-5 bg-primary/5 border-b border-primary/10 relative">
                    <div className="absolute top-5 right-5 h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <UserPlus size={18} />
                    </div>
                    <DialogTitle className="text-xl font-bold text-foreground">Novo Membro</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                        {isOwner
                            ? "Cadastre um novo gerente ou corretor."
                            : "Cadastre um novo corretor para sua equipe."}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-5 space-y-4">
                    <div className="space-y-3">
                        {isOwner && (
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Cargo / Função</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, user_type: 'manager', manager_id: '' }))}
                                        className={cn(
                                            "flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all duration-200",
                                            formData.user_type === 'manager'
                                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                : "border-muted bg-muted/20 text-muted-foreground hover:bg-muted/30"
                                        )}
                                    >
                                        <Shield size={14} />
                                        <span className="text-sm font-bold">Gerente</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, user_type: 'broker' }))}
                                        className={cn(
                                            "flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all duration-200",
                                            formData.user_type === 'broker'
                                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                : "border-muted bg-muted/20 text-muted-foreground hover:bg-muted/30"
                                        )}
                                    >
                                        <User size={14} />
                                        <span className="text-sm font-bold">Corretor</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="full_name" className="text-xs font-bold">Nome Completo</Label>
                            <Input
                                id="full_name"
                                placeholder="Nome do membro"
                                className="h-10 bg-muted/20 border-muted-foreground/10 focus:border-primary transition-all rounded-lg text-sm"
                                value={formData.full_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs font-bold">E-mail Profissional</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="exemplo@email.com"
                                className="h-10 bg-muted/20 border-muted-foreground/10 focus:border-primary transition-all rounded-lg text-sm"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-xs font-bold">WhatsApp / Telefone</Label>
                            <Input
                                id="phone"
                                placeholder="(00) 00000-0000"
                                className="h-10 bg-muted/20 border-muted-foreground/10 focus:border-primary transition-all rounded-lg text-sm"
                                value={formData.phone}
                                onChange={handlePhoneChange}
                            />
                        </div>

                        {formData.user_type === 'broker' && isOwner && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                <Label className="text-xs font-bold">Gerente Responsável</Label>
                                {noManagers ? (
                                    <Alert variant="destructive" className="py-2 bg-destructive/5 text-destructive border-destructive/20 rounded-lg">
                                        <AlertDescription className="text-[10px] font-semibold">
                                            Não há gerentes cadastrados.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Select
                                        value={formData.manager_id}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, manager_id: val }))}
                                    >
                                        <SelectTrigger className="h-10 bg-muted/20 border-muted-foreground/10 rounded-lg text-sm">
                                            <SelectValue placeholder="Selecione o gerente..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg shadow-elevated border-muted-foreground/10">
                                            {managers.map(m => (
                                                <SelectItem key={m.id} value={m.id} className="text-xs">{m.full_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-primary/5 p-3 rounded-xl flex items-start gap-3 border border-primary/10">
                        <AlertCircle size={14} className="text-primary mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Acesso Temporário</p>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                                Senha: <span className="font-bold text-primary">@Bighome123</span>.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-5 bg-muted/10 border-t border-muted/20 flex flex-row gap-3">
                    <Button variant="ghost" className="h-10 flex-1 rounded-lg font-bold text-xs" onClick={onClose}>Cancelar</Button>
                    <Button
                        className="h-10 flex-[2] text-xs font-bold rounded-lg shadow-soft"
                        onClick={handleCreate}
                        disabled={isLoading || (formData.user_type === 'broker' && isOwner && noManagers)}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Criar Membro'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
