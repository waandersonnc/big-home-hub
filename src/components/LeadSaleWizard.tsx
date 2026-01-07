import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    TrendingUp,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Building2,
    DollarSign,
    Info
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { dashboardService } from '@/services/dashboard.service';

interface LeadSaleWizardProps {
    lead: any;
    user: any;
    onComplete: (data: any) => void;
    onCancel: () => void;
}

export function LeadSaleWizard({ lead, user, onComplete, onCancel }: LeadSaleWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Form states
    const [productType, setProductType] = useState<'apartamento' | 'casa' | 'outro'>('apartamento');
    const [constructionStatus, setConstructionStatus] = useState<'pronto' | 'na planta'>('na planta');
    const [saleValue, setSaleValue] = useState(''); // Valor mascarado para exibição
    const [paymentMethod, setPaymentMethod] = useState('');
    const [observation, setObservation] = useState('');

    // Função para formatar moeda em tempo real (Padrão BR)
    const formatCurrency = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (!digits) return '';

        const amount = (parseInt(digits) / 100).toFixed(2);
        const [integral, decimal] = amount.split('.');
        const formattedIntegral = integral.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        return `${formattedIntegral},${decimal}`;
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        setSaleValue(formatCurrency(rawValue));
    };

    const handleFinish = async () => {
        if (!saleValue) {
            toast({
                title: "Valor obrigatório",
                description: "Por favor, informe o valor da venda.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            // Converter o valor mascarado (1.500,00) de volta para número (1500.00)
            const numericValue = parseFloat(saleValue.replace(/\./g, '').replace(',', '.'));

            const saleData = {
                my_owner: lead.my_owner || lead.owner_id,
                company_id: lead.company_id,
                my_manager: lead.my_manager || lead.manager_id,
                my_broker: user.id,
                lead_id: lead.id,
                product_type: productType,
                construction_status: constructionStatus,
                sale_value: numericValue,
                payment_method: paymentMethod,
                observation: observation
            };

            const result = await dashboardService.createLeadSale(saleData);

            if (result.success) {
                onComplete(saleData);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível registrar a venda.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-8">
                {[1, 2].map((s) => (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                            }`}>
                            {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                        </div>
                        {s < 2 && (
                            <div className={`h-[2px] flex-1 mx-2 transition-colors ${step > s ? 'bg-success' : 'bg-muted'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Product details */}
            {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-2 text-success mb-4 font-bold uppercase tracking-wider text-xs">
                        <Building2 className="h-4 w-4" /> Etapa 1: O Produto
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label>O que foi vendido?</Label>
                            <Select value={productType} onValueChange={(v: any) => setProductType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="apartamento">Apartamento</SelectItem>
                                    <SelectItem value="casa">Casa</SelectItem>
                                    <SelectItem value="outro">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Status do Imóvel</Label>
                            <Select value={constructionStatus} onValueChange={(v: any) => setConstructionStatus(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="na planta">Na Planta</SelectItem>
                                    <SelectItem value="pronto">Pronto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Valor da Venda (R$)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0,00"
                                    value={saleValue}
                                    onChange={handleValueChange}
                                    className="pl-10 text-lg font-bold text-success"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-8">
                        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                        <Button
                            disabled={!saleValue}
                            onClick={() => setStep(2)}
                            className="bg-success hover:bg-success/90 text-white gap-2"
                        >
                            Próximo <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: Final Details */}
            {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-2 text-success mb-4 font-bold uppercase tracking-wider text-xs">
                        <Info className="h-4 w-4" /> Etapa 2: Fechamento
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Forma de Pagamento (Opcional)</Label>
                            <Input
                                placeholder="Ex: Financiamento, À vista, etc."
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Observações Adicionais</Label>
                            <Input
                                placeholder="Algum detalhe relevante sobre a venda?"
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between mt-8">
                        <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                            <ChevronLeft className="h-4 w-4" /> Voltar
                        </Button>
                        <Button
                            onClick={handleFinish}
                            disabled={loading}
                            className="bg-success hover:bg-success/90 text-white font-bold gap-2 min-w-[120px]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    VIRAL VENDA! 🚀 <CheckCircle2 className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
