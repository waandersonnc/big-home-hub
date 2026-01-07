import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { dashboardService } from '@/services/dashboard.service';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { Loader2, AlertCircle, FileText, TrendingUp, UserMinus } from 'lucide-react';
import { LeadDocumentWizard } from './LeadDocumentWizard';
import { LeadSaleWizard } from './LeadSaleWizard';

export function LeadInformativeBlocker() {
    const { user, isDemo } = useAuthContext();
    const { toast } = useToast();
    const [owingLead, setOwingLead] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [selectedStatus, setSelectedStatus] = useState<string>('em atendimento');
    const [informativeText, setInformativeText] = useState('');

    // extra fields for documentação
    const [cpf, setCpf] = useState('');
    const [correspondent, setCorrespondent] = useState('');
    const [incomeType, setIncomeType] = useState('cotista'); // cotista, informal, mista

    // extra fields for venda
    const [productType, setProductType] = useState('apartamento');
    const [constructionStatus, setConstructionStatus] = useState('na planta');
    const [saleValue, setSaleValue] = useState('');

    const checkOwingLeads = async () => {
        if (!user || isDemo) return;

        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('my_broker', user.id)
                .eq('owing_information', true)
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            setOwingLead(data);
        } catch (error) {
            console.error('Error checking owing leads:', error);
        }
    };

    useEffect(() => {
        checkOwingLeads();

        // Subscribe to changes to handle real-time locking
        if (user && !isDemo) {
            const channel = supabase
                .channel('owing-leads')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'leads',
                        filter: `my_broker=eq.${user.id}`
                    },
                    (payload) => {
                        if (payload.new && (payload.new as any).owing_information) {
                            setOwingLead(payload.new);
                        } else if (payload.new && !(payload.new as any).owing_information) {
                            if (owingLead?.id === (payload.new as any).id) {
                                setOwingLead(null);
                            }
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, isDemo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!owingLead || !informativeText) return;

        setSubmitting(true);
        try {
            let closingData: any = {};
            let targetStage = '';

            switch (selectedStatus) {
                case 'em atendimento':
                    targetStage = 'em atendimento';
                    break;
                case 'documentação':
                    targetStage = 'documentação';
                    closingData = {
                        cpf,
                        correspondent,
                        incomeType
                    };
                    break;
                case 'venda':
                    targetStage = 'comprou';
                    closingData = {
                        productType,
                        constructionStatus,
                        saleValue
                    };
                    break;
                case 'remover':
                    targetStage = 'removido';
                    break;
                default:
                    targetStage = 'em atendimento';
            }

            const result = await dashboardService.submitLeadInformative({
                leadId: owingLead.id,
                stage: targetStage,
                informativeText,
                authorName: user?.full_name || user?.email || 'Corretor',
                closingData
            });

            if (result.success) {
                toast({
                    title: "Informações registradas",
                    description: "Obrigado por manter o sistema atualizado!",
                });
                setOwingLead(null);
                // Reset form
                setInformativeText('');
                setCpf('');
                setCorrespondent('');
                setSaleValue('');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível registrar as informações.",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!owingLead) return null;

    return (
        <Dialog open={!!owingLead} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="flex items-center gap-2 text-warning mb-2">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Ação Obrigatória</span>
                    </div>
                    <DialogTitle className="text-2xl font-bold">Registro de Atendimento</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Você acabou de contatar <strong>{owingLead.name}</strong>. Por favor, registre o que foi conversado para liberar o sistema.
                    </p>
                </DialogHeader>

                {selectedStatus === 'documentação' ? (
                    <div className="py-4">
                        <LeadDocumentWizard
                            lead={owingLead}
                            user={user}
                            onCancel={() => setSelectedStatus('em atendimento')}
                            onComplete={async (docData) => {
                                await dashboardService.submitLeadInformative({
                                    leadId: owingLead.id,
                                    stage: 'documentação',
                                    informativeText: `Documentos enviados (Bloqueador): CPF ${docData.cpf}, Correspondente: ${docData.correspondent_name}`,
                                    authorName: user?.full_name || user?.email || 'Corretor',
                                    closingData: {
                                        document_id: owingLead.id,
                                        cpf: docData.cpf
                                    },
                                    document_urls: docData.file_urls
                                });
                                setOwingLead(null);
                                setInformativeText('');
                                setSelectedStatus('em atendimento');
                            }}
                        />
                    </div>
                ) : selectedStatus === 'venda' ? (
                    <div className="py-4">
                        <LeadSaleWizard
                            lead={owingLead}
                            user={user}
                            onCancel={() => setSelectedStatus('em atendimento')}
                            onComplete={async (saleData) => {
                                await dashboardService.submitLeadInformative({
                                    leadId: owingLead.id,
                                    stage: 'comprou',
                                    informativeText: `VENDA REALIZADA (Bloqueador)! 🚀 Produto: ${saleData.product_type} (${saleData.construction_status}), Valor: R$ ${saleData.sale_value.toLocaleString('pt-BR')}`,
                                    authorName: user?.full_name || user?.email || 'Corretor',
                                    closingData: {
                                        sale_value: saleData.sale_value,
                                        product_type: saleData.product_type
                                    }
                                });
                                setOwingLead(null);
                                setInformativeText('');
                                setSelectedStatus('em atendimento');
                            }}
                        />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>O que aconteceu nesse contato?</Label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione o resultado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="em atendimento">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-primary" />
                                            <span>Continuar em Atendimento</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="documentação">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-warning" />
                                            <span>Enviou Documentação</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="venda">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-success" />
                                            <span>VIRAL VENDA! 🚀</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="remover">
                                        <div className="flex items-center gap-2">
                                            <UserMinus className="h-4 w-4 text-destructive" />
                                            <span>Remover da Base</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="informative">Resumo da conversa</Label>
                            <Textarea
                                id="informative"
                                placeholder="Descreva detalhes importantes..."
                                required
                                value={informativeText}
                                onChange={(e) => setInformativeText(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>

                        {selectedStatus === 'remover' && (
                            <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20">
                                <strong>Atenção:</strong> Esta ação moverá o lead para a lixeira. Justifique o motivo no campo acima.
                            </div>
                        )}

                        <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                "Finalizar e Liberar Sistema"
                            )}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
