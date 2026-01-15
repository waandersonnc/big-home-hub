import React, { useState, useEffect } from 'react';
import { Phone, Calendar, Clock } from 'lucide-react';
import { differenceInSeconds } from 'date-fns';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { AgingIndicator } from './AgingIndicator';
import { calculateLeadAging, AgingResult } from '@/utils/leadAging';
import { FollowupModal } from './FollowupModal';
import { dashboardService } from '@/services/dashboard.service';
import { useAuthContext } from '@/contexts/AuthContext';

interface PipelineLeadCardProps {
    lead: any;
    onCardClick: (lead: any) => void;
    onWhatsAppClick: (lead: any) => void;
    onUpdate: () => void;
    startLongPress: (lead: any) => void;
    cancelLongPress: () => void;
}

export const PipelineLeadCard: React.FC<PipelineLeadCardProps> = ({
    lead,
    onCardClick,
    onWhatsAppClick,
    onUpdate,
    startLongPress,
    cancelLongPress
}) => {
    const { user } = useAuthContext();
    const [aging, setAging] = useState<AgingResult>(
        calculateLeadAging(lead.lastInteractionAt || lead.created_at, lead.followupAt, lead.rawStage || lead.status)
    );
    const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);

    const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

    // Recalcular aging a cada minuto
    useEffect(() => {
        const timer = setInterval(() => {
            setAging(calculateLeadAging(lead.lastInteractionAt || lead.created_at, lead.followupAt, lead.rawStage || lead.status));
        }, 60000);

        return () => clearInterval(timer);
    }, [lead]);

    // Timer regressivo para estágio "Em Espera"
    useEffect(() => {
        if ((lead.status === 'Em Espera' || lead.rawStage === 'em espera') && lead.fimDaEspera) {
            const updateTimer = () => {
                const now = new Date();
                const end = new Date(lead.fimDaEspera);
                const diffValues = differenceInSeconds(end, now);

                if (diffValues <= 0) {
                    setTimeRemaining("00:00:00");
                    return;
                }

                const hours = Math.floor(diffValues / 3600);
                const minutes = Math.floor((diffValues % 3600) / 60);
                const seconds = diffValues % 60;

                const formatted = `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                setTimeRemaining(formatted);
            };

            updateTimer(); // Initial call
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        } else {
            setTimeRemaining(null);
        }
    }, [lead.status, lead.rawStage, lead.fimDaEspera]);

    const handleInteraction = () => {
        onCardClick(lead);
    };

    return (
        <>
            <div
                onMouseDown={() => startLongPress(lead)}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onTouchStart={() => startLongPress(lead)}
                onTouchEnd={cancelLongPress}
                onClick={handleInteraction}
                className={cn(
                    'bg-card rounded-lg p-2.5 shadow-card border cursor-pointer transition-all relative overflow-hidden',
                    'hover:shadow-soft animate-fade-in group select-none active:scale-[0.98]',
                    aging.percentage > 80 && aging.isOverdue && 'ring-1 ring-destructive ring-opacity-50'
                )}
                style={{
                    borderLeft: `4px solid ${aging.color}`,
                    backgroundColor: aging.percentage > 40 ? `${aging.color}08` : undefined
                }}
                title="Segure o clique para ver detalhes e histórico"
            >
                {/* Background Pulse for high aging */}
                {aging.percentage > 80 && aging.isOverdue && (
                    <div className="absolute inset-0 bg-destructive/5 animate-pulse pointer-events-none" />
                )}

                {/* Timer Banner for 'Em Espera' */}
                {timeRemaining && (
                    <div className={cn(
                        "mb-2.5 rounded-md px-2 py-1.5 flex items-center justify-center gap-1.5 font-bold text-xs border animate-in slide-in-from-top-1 fade-in duration-300",
                        "bg-orange-500/10 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30"
                    )}>
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        <span className="font-mono tracking-wide">{timeRemaining}</span>
                        <span className="text-[10px] font-normal opacity-80 uppercase ml-1">para atendimento</span>
                    </div>
                )}

                <div className="flex items-start justify-between mb-1 relative z-10">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-card-foreground truncate uppercase">{lead.name}</h4>
                        <div
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                if (!lead.phone) return;
                                const url = `https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Oi ${lead.name.split(' ')[0]} tudo joia?`)}`;
                                window.open(url, '_blank');
                                onWhatsAppClick(lead);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-[10px] text-primary hover:underline opacity-90 relative z-20 cursor-pointer select-none"
                            title="Clique duplo para abrir WhatsApp"
                        >
                            <Phone className="h-2.5 w-2.5" />
                            {lead.phone}
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFollowupModalOpen(true);
                        }}
                        className={cn(
                            "p-1 rounded-md transition-colors relative z-20",
                            lead.followupAt ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
                        )}
                        title={lead.followupAt ? "Editar Follow-up" : "Agendar Follow-up"}
                    >
                        <Calendar className="h-3.5 w-3.5" />
                    </button>
                </div>

                {lead.propertyInterest && (
                    <p className="text-[10px] text-muted-foreground mb-1 truncate relative z-10">
                        🏠 {lead.propertyInterest}
                    </p>
                )}

                <div className="flex items-center gap-2 mb-2 relative z-10">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {lead.agentAvatar}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium truncate">
                        👤 {lead.agent}
                    </span>
                </div>

                <div className="flex items-center justify-between relative z-10 pt-1">
                    <StatusBadge status={lead.origin} />
                </div>

                {/* Aging System Indicator */}
                <AgingIndicator aging={aging} followupAt={lead.followupAt} />
            </div>

            <FollowupModal
                leadId={lead.id}
                leadName={lead.name}
                currentFollowupAt={lead.followupAt}
                currentNote={lead.followupNote}
                isOpen={isFollowupModalOpen}
                onClose={() => setIsFollowupModalOpen(false)}
                onSuccess={onUpdate}
            />
        </>
    );
};
