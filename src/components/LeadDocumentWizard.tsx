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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
    FileText,
    Upload,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Loader2,
    X
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { dashboardService } from '@/services/dashboard.service';

interface LeadDocumentWizardProps {
    lead: any;
    user: any;
    onComplete: (data: any) => void;
    onCancel: () => void;
}

export function LeadDocumentWizard({ lead, user, onComplete, onCancel }: LeadDocumentWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Form states
    const [cpf, setCpf] = useState('');
    const [correspondent, setCorrespondent] = useState('');
    const [incomeType, setIncomeType] = useState<'formal' | 'informal' | 'mista'>('formal');
    const [isCotista, setIsCotista] = useState(false);
    const [hasSocialFactor, setHasSocialFactor] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const maskCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length > 11) return cpf;

        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async (): Promise<string[]> => {
        const urls: string[] = [];
        setUploading(true);

        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${lead.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('documents')
                .upload(fileName, file);

            if (error) {
                console.error('Error uploading file:', error);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            urls.push(publicUrl);
        }

        setUploading(false);
        return urls;
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const fileUrls = await uploadFiles();

            const documentData = {
                my_owner: lead.my_owner || lead.owner_id, // depends on how it's mapped
                company_id: lead.company_id,
                my_manager: lead.my_manager || lead.manager_id,
                my_broker: user.id,
                lead_id: lead.id,
                cpf,
                correspondent_name: correspondent,
                income_type: incomeType,
                is_cotista: isCotista,
                has_social_factor: hasSocialFactor,
                file_urls: fileUrls
            };

            const result = await dashboardService.createLeadDocument(documentData);

            if (result.success) {
                onComplete(documentData);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível registrar os documentos.",
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
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                            }`}>
                            {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                        </div>
                        {s < 3 && (
                            <div className={`h-[2px] flex-1 mx-2 transition-colors ${step > s ? 'bg-primary' : 'bg-muted'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Identification */}
            {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-2 text-primary mb-4 font-bold uppercase tracking-wider text-xs">
                        <FileText className="h-4 w-4" /> Etapa 1: Identificação
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>CPF do Lead</Label>
                            <Input
                                placeholder="000.000.000-00"
                                value={cpf}
                                onChange={(e) => setCpf(maskCPF(e.target.value))}
                                className="text-lg font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nome do Correspondente Bancário</Label>
                            <Input
                                placeholder="Digite o nome completo"
                                value={correspondent}
                                onChange={(e) => setCorrespondent(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between mt-8">
                        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                        <Button
                            disabled={!cpf || !correspondent}
                            onClick={() => setStep(2)}
                            className="gap-2"
                        >
                            Próximo <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: Financial Details */}
            {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-2 text-primary mb-4 font-bold uppercase tracking-wider text-xs">
                        <FileText className="h-4 w-4" /> Etapa 2: Dados Financeiros
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Tipo de Renda</Label>
                            <Select value={incomeType} onValueChange={(v: any) => setIncomeType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="formal">Renda Formal</SelectItem>
                                    <SelectItem value="informal">Renda Informal</SelectItem>
                                    <SelectItem value="mista">Renda Mista</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">O Lead é Cotista?</Label>
                                <RadioGroup
                                    value={isCotista ? 'sim' : 'nao'}
                                    onValueChange={(v) => setIsCotista(v === 'sim')}
                                    className="flex gap-4 mt-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="sim" id="c-sim" />
                                        <Label htmlFor="c-sim">Sim</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="nao" id="c-nao" />
                                        <Label htmlFor="c-nao">Não</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Tem Fator Social?</Label>
                                <RadioGroup
                                    value={hasSocialFactor ? 'sim' : 'nao'}
                                    onValueChange={(v) => setHasSocialFactor(v === 'sim')}
                                    className="flex gap-4 mt-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="sim" id="s-sim" />
                                        <Label htmlFor="s-sim">Sim</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="nao" id="s-nao" />
                                        <Label htmlFor="s-nao">Não</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-8">
                        <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                            <ChevronLeft className="h-4 w-4" /> Voltar
                        </Button>
                        <Button onClick={() => setStep(3)} className="gap-2">
                            Próximo <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: File Upload */}
            {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-2 text-primary mb-4 font-bold uppercase tracking-wider text-xs">
                        <Upload className="h-4 w-4" /> Etapa 3: Anexar Documentos (Opcional)
                    </div>
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*,application/pdf"
                            />
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Upload className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold">Clique ou arraste os arquivos</p>
                                    <p className="text-xs text-muted-foreground">PDF, JPEG, PNG (Até 10MB por arquivo)</p>
                                </div>
                            </div>
                        </div>

                        {files.length > 0 && (
                            <div className="grid grid-cols-1 gap-2 mt-4">
                                {files.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border text-xs">
                                        <div className="flex items-center gap-2 truncate">
                                            <FileText className="h-4 w-4 text-primary" />
                                            <span className="truncate">{file.name}</span>
                                            <span className="text-[10px] text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFile(idx)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between mt-8">
                        <Button variant="outline" onClick={() => setStep(2)} className="gap-2" disabled={loading}>
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
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    Concluir <CheckCircle2 className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
