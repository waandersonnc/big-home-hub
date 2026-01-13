import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { dashboardService } from '@/services/dashboard.service';
import { useAuthContext } from '@/contexts/AuthContext';

interface FollowupModalProps {
    leadId: string;
    leadName: string;
    currentFollowupAt?: string | null;
    currentNote?: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const FollowupModal: React.FC<FollowupModalProps> = ({
    leadId,
    leadName,
    currentFollowupAt,
    currentNote,
    isOpen,
    onClose,
    onSuccess
}) => {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const authorName = user?.full_name || user?.email || 'Sistema';

    // Parse current date/time if exists
    const initialDate = currentFollowupAt ? format(new Date(currentFollowupAt), 'yyyy-MM-dd') : '';
    const initialTime = currentFollowupAt ? format(new Date(currentFollowupAt), 'HH:mm') : '';

    const [date, setDate] = useState(initialDate);
    const [time, setTime] = useState(initialTime);
    const [note, setNote] = useState(currentNote || '');

    const handleSave = async () => {
        if (!date || !time) {
            toast({ title: "Erro", description: "Data e hora são obrigatórios para agendar um follow-up.", variant: "destructive" });
            return;
        }

        const scheduledAt = new Date(`${date}T${time}:00`);
        const now = new Date();

        if (isBefore(scheduledAt, now)) {
            toast({ title: "Erro", description: "A data do follow-up não pode ser no passado.", variant: "destructive" });
            return;
        }

        if (isAfter(scheduledAt, addDays(now, 60))) {
            toast({ title: "Erro", description: "O follow-up pode ser agendado no máximo com 60 dias de antecedência.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const result = await dashboardService.updateLeadFollowup(leadId, scheduledAt.toISOString(), note, authorName);
            if (result.success) {
                toast({ title: "Sucesso!", description: `Follow-up agendado para ${format(scheduledAt, 'dd/MM/yyyy HH:mm')}` });
                onSuccess();
                onClose();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        setLoading(true);
        try {
            const result = await dashboardService.removeLeadFollowup(leadId, authorName);
            if (result.success) {
                toast({ title: "Sucesso!", description: "Follow-up removido." });
                onSuccess();
                onClose();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="p-6 space-y-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Agendar Follow-up
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">Lead: <span className="font-semibold text-foreground uppercase">{leadName}</span></p>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="followup-date">Data</Label>
                                <Input
                                    id="followup-date"
                                    type="date"
                                    value={date}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    max={format(addDays(new Date(), 60), 'yyyy-MM-dd')}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="followup-time">Hora</Label>
                                <Input
                                    id="followup-time"
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="followup-note">Nota/Lembrete (Opcional)</Label>
                            <Textarea
                                id="followup-note"
                                placeholder="Ex: Ligar para confirmar proposta..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                maxLength={500}
                                className="resize-none h-24"
                            />
                            <div className="text-[10px] text-right text-muted-foreground">
                                {note.length}/500 caracteres
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        {currentFollowupAt && (
                            <Button
                                type="button"
                                variant="outline"
                                className="text-destructive border-destructive hover:bg-destructive/10"
                                onClick={handleRemove}
                                disabled={loading}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                            </Button>
                        )}
                        <div className="flex-1" />
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleSave} disabled={loading}>
                            {loading ? "Salvando..." : "Salvar Follow-up"}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

function isAfter(date: Date, dateToCompare: Date) {
    return date.getTime() > dateToCompare.getTime();
}
