import { useState } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logger } from '@/lib/logger';
import type { TeamMemberDisplay } from '@/types';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    managers: TeamMemberDisplay[];
}

export default function AddMemberModal({ isOpen, onClose, onSuccess, managers }: AddMemberModalProps) {
    const { selectedCompanyId } = useCompany();
    const { user: owner } = useAuth();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        user_type: 'manager' as 'manager' | 'broker',
        manager_id: '',
    });

    const handleCreate = async () => {
        if (!owner) {
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
            await teamService.createMember({
                ...formData,
                company_id: selectedCompanyId!,
                owner_id: owner.id
            });

            toast({
                title: "Membro adicionado!",
                description: `Um e-mail foi enviado para ${formData.email} com a senha padrão BIG123456.`
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-elevated">
                <DialogHeader className="p-8 bg-muted/20 border-b">
                    <DialogTitle className="text-2xl font-bold">Adicionar Membro à Equipe</DialogTitle>
                    <DialogDescription>
                        Cadastre um novo gerente ou corretor para sua imobiliária.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipo de Membro</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant={formData.user_type === 'manager' ? 'default' : 'outline'}
                                    className="h-12 text-sm font-semibold"
                                    onClick={() => setFormData(prev => ({ ...prev, user_type: 'manager', manager_id: '' }))}
                                >
                                    Gerente
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.user_type === 'broker' ? 'default' : 'outline'}
                                    className="h-12 text-sm font-semibold"
                                    onClick={() => setFormData(prev => ({ ...prev, user_type: 'broker' }))}
                                >
                                    Corretor
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Pedro Alvares"
                                className="h-12"
                                value={formData.full_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="pedro@email.com"
                                    className="h-12"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    placeholder="(11) 99999-9999"
                                    className="h-12"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>
                        </div>

                        {formData.user_type === 'broker' && (
                            <div className="space-y-2 animate-slide-in-left">
                                <Label>Gerente Responsável</Label>
                                {noManagers ? (
                                    <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle className="font-bold">Atenção</AlertTitle>
                                        <AlertDescription className="text-xs">
                                            Você precisa cadastrar pelo menos um GERENTE antes de adicionar corretores.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Select
                                        value={formData.manager_id}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, manager_id: val }))}
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Selecione o gerente..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {managers.map(m => (
                                                <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-primary/5 p-4 rounded-xl flex items-start gap-4 border border-primary/10">
                        <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center text-primary shrink-0">
                            <AlertCircle size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Acesso Temporário</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                A senha padrão para o primeiro acesso será <span className="font-bold text-foreground">BIG123456</span>.
                                O usuário será obrigado a alterá-la no primeiro login.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-muted/10 border-t flex gap-4">
                    <Button variant="ghost" className="h-12 px-6" onClick={onClose}>Cancelar</Button>
                    <Button
                        className="flex-1 h-12 text-lg font-bold"
                        onClick={handleCreate}
                        disabled={isLoading || (formData.user_type === 'broker' && noManagers)}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Criar Usuário'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
