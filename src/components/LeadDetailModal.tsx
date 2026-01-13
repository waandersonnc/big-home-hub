import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { dashboardService } from '@/services/dashboard.service';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
    Loader2,
    FileText,
    TrendingUp,
    UserMinus,
    History,
    MessageSquare,
    Phone,
    Calendar,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LeadDocumentWizard } from './LeadDocumentWizard';
import { LeadSaleWizard } from './LeadSaleWizard';

interface LeadDetailModalProps {
    lead: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

export function LeadDetailModal({ lead, isOpen, onClose, onUpdate }: LeadDetailModalProps) {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [informativeText, setInformativeText] = useState('');

    // extra fields for documentação
    const [cpf, setCpf] = useState(lead?.closing_data?.cpf || '');
    const [correspondent, setCorrespondent] = useState(lead?.closing_data?.correspondent || '');
    const [incomeType, setIncomeType] = useState(lead?.closing_data?.incomeType || 'cotista');

    // extra fields for venda
    const [productType, setProductType] = useState(lead?.closing_data?.productType || 'apartamento');
    const [constructionStatus, setConstructionStatus] = useState(lead?.closing_data?.constructionStatus || 'na planta');
    const [saleValue, setSaleValue] = useState(lead?.closing_data?.saleValue || '');

    if (!lead) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!informativeText) {
            toast({
                title: "Campo obrigatório",
                description: "Por favor, escreva um resumo da interação.",
                variant: "destructive"
            });
            return;
        }

        setSubmitting(true);
        try {
            let closingData = lead.closing_data || {};
            let targetStage = lead.rawStage; // Manter o mesmo se não trocar

            if (selectedStatus === 'em atendimento') targetStage = 'em atendimento';
            else if (selectedStatus === 'documentação') {
                targetStage = 'documentação';
                closingData = { ...closingData, cpf, correspondent, incomeType };
            } else if (selectedStatus === 'venda') {
                targetStage = 'comprou';
                closingData = { ...closingData, productType, constructionStatus, saleValue };
            } else if (selectedStatus === 'remover') {
                targetStage = 'removido';
            }

            const result = await dashboardService.submitLeadInformative({
                leadId: lead.id,
                stage: targetStage,
                informativeText,
                authorName: user?.full_name || user?.email || 'Corretor',
                closingData
            });

            if (result.success) {
                toast({
                    title: "Lead atualizado!",
                    description: "As informações foram registradas com sucesso.",
                });
                setInformativeText('');
                setSelectedStatus('');
                if (onUpdate) onUpdate();
                onClose();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível atualizar o lead.",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const history = Array.isArray(lead.informative) ? lead.informative : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <DialogTitle className="text-2xl font-bold uppercase tracking-tight">{lead.name}</DialogTitle>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> {lead.phone}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Último atendimento: {lead.lastInteractionAt ? format(new Date(lead.lastInteractionAt), 'dd/MM HH:mm', { locale: ptBR }) : 'Nenhum'}
                                </span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Column 1: History */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-primary">
                            <History className="h-4 w-4" /> Histórico de Interações
                        </div>
                        <div className="bg-muted/30 rounded-xl p-4 border space-y-4 max-h-[400px] overflow-y-auto">
                            {history.length > 0 ? (
                                history.slice().reverse().map((item: any, idx: number) => (
                                    <div key={idx} className="relative pl-4 border-l-2 border-primary/20 pb-4 last:pb-0">
                                        <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-primary" />
                                        <div className="flex flex-col">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-bold text-primary uppercase">
                                                    {item.author}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground">
                                                    {format(new Date(item.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-foreground leading-relaxed">{item.text}</p>
                                            {item.next_stage && (
                                                <div className="mt-1">
                                                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-medium">
                                                        MUDOU PARA: {item.next_stage}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-muted-foreground italic text-xs">
                                    Nenhuma interação registrada ainda.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 2: Update Form */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-success">
                            <MessageSquare className="h-4 w-4" /> Novo Registro
                        </div>

                        {selectedStatus === 'documentação' ? (
                            <LeadDocumentWizard
                                lead={lead}
                                user={user}
                                onCancel={() => setSelectedStatus('')}
                                onComplete={async (docData) => {
                                    // Após o wizard completar a inserção na tabela de documentos,
                                    // atualizamos o lead no sistema
                                    await dashboardService.submitLeadInformative({
                                        leadId: lead.id,
                                        stage: 'documentação',
                                        informativeText: `Documentos enviados: CPF ${docData.cpf}, Correspondente: ${docData.correspondent_name}`,
                                        authorName: user?.full_name || user?.email || 'Corretor',
                                        closingData: {
                                            document_id: lead.id, // Referência
                                            cpf: docData.cpf
                                        },
                                        document_urls: docData.file_urls
                                    });
                                    if (onUpdate) onUpdate();
                                    onClose();
                                }}
                            />
                        ) : selectedStatus === 'venda' ? (
                            <LeadSaleWizard
                                lead={lead}
                                user={user}
                                onCancel={() => setSelectedStatus('')}
                                onComplete={async (saleData) => {
                                    await dashboardService.submitLeadInformative({
                                        leadId: lead.id,
                                        stage: 'comprou',
                                        informativeText: `VENDA REALIZADA! 🚀 Produto: ${saleData.product_type} (${saleData.construction_status}), Valor: R$ ${saleData.sale_value.toLocaleString('pt-BR')}`,
                                        authorName: user?.full_name || user?.email || 'Corretor',
                                        closingData: {
                                            sale_value: saleData.sale_value,
                                            product_type: saleData.product_type
                                        }
                                    });
                                    if (onUpdate) onUpdate();
                                    onClose();
                                }}
                            />
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">O que aconteceu?</Label>
                                    <Textarea
                                        placeholder="Descreva a conversa ou atualização..."
                                        value={informativeText}
                                        onChange={(e) => setInformativeText(e.target.value)}
                                        className="min-h-[100px] resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Atualizar Status (Opcional)</Label>
                                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Manter status atual" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="em atendimento">Continuar em Atendimento</SelectItem>
                                            <SelectItem value="documentação">Enviou Documentação</SelectItem>
                                            <SelectItem value="venda">VIRAL VENDA! 🚀</SelectItem>
                                            <SelectItem value="remover">Remover da Base</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button type="submit" className="w-full font-bold uppercase tracking-wide gap-2" disabled={submitting}>
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Salvar Atualização
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
