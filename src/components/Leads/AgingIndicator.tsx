import React from 'react';
import { Clock, Calendar } from 'lucide-react';
import { AgingResult } from '@/utils/leadAging';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AgingIndicatorProps {
    aging: AgingResult;
    followupAt?: string | null;
}

export const AgingIndicator: React.FC<AgingIndicatorProps> = ({ aging, followupAt }) => {
    const { color, percentage, label, daysDiff, isOverdue } = aging;

    return (
        <div className="space-y-2 mt-2 pt-2 border-t border-dashed border-muted-foreground/15">
            <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div
                        className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1 flex-shrink-0"
                        style={{
                            backgroundColor: color,
                            boxShadow: `0 2px 4px ${color}40`
                        }}
                    >
                        <Clock className="h-2.5 w-2.5" />
                        <span>{label}</span>
                    </div>
                </div>

                {followupAt && (
                    <div className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 font-semibold border border-muted",
                        isOverdue ? 'text-destructive border-destructive/20 animate-pulse' : 'text-primary border-primary/10'
                    )}>
                        <Calendar className="h-2.5 w-2.5" />
                        <span className="whitespace-nowrap">{format(parseISO(followupAt), 'dd/MM HH:mm', { locale: ptBR })}</span>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden border border-muted/20">
                    <div
                        className="h-full transition-all duration-1000 ease-out"
                        style={{
                            width: `${percentage}%`,
                            backgroundColor: color,
                            boxShadow: percentage > 80 ? `0 0 6px ${color}` : 'none'
                        }}
                    />
                </div>

                <div className="flex justify-between items-center text-[9px] font-medium text-muted-foreground/70">
                    <span>{daysDiff === 0 ? 'Hoje' : `${daysDiff} dias`}</span>
                    {followupAt && !isOverdue && (
                        <span className="italic">Prazo encerra em {percentage.toFixed(0)}%</span>
                    )}
                </div>
            </div>
        </div>
    );
};

