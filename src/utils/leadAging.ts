import { differenceInCalendarDays, isAfter, parseISO, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export type AgingResult = {
    color: string;
    percentage: number;
    label: string;
    daysDiff: number;
    isOverdue: boolean;
};

const BRAZIL_TZ = 'America/Sao_Paulo';
export const AGING_STAGES = ['atendimento', 'documentação', 'em atendimento'];

/**
 * Calcula o envelhecimento do lead (Lógica de Proximidade).
 * Se o follow-up é hoje -> 100% (Vencido)
 * Se o follow-up é amanhã -> 80% (Crítico/Vermelho) para alertar que o prazo está no fim.
 */
export const calculateLeadAging = (
    lastInteractionAt: string | Date | null | undefined,
    followupScheduledAt: string | Date | null | undefined,
    stage: string | null | undefined
): AgingResult => {
    const now = toZonedTime(new Date(), BRAZIL_TZ);
    const today = startOfDay(now);

    const lastInteractionRaw = !lastInteractionAt
        ? now
        : (typeof lastInteractionAt === 'string' ? parseISO(lastInteractionAt) : lastInteractionAt);

    const lastInteraction = toZonedTime(lastInteractionRaw, BRAZIL_TZ);
    const interactionDay = startOfDay(lastInteraction);

    const normalizedStage = stage?.toLowerCase() || '';

    if (!AGING_STAGES.includes(normalizedStage)) {
        return {
            color: '#10b981',
            percentage: 0,
            label: 'Novo',
            daysDiff: 0,
            isOverdue: false
        };
    }

    const daysSinceInteraction = differenceInCalendarDays(today, interactionDay);
    let percentage = 0;
    let isOverdue = false;

    if (followupScheduledAt) {
        const followupRaw = typeof followupScheduledAt === 'string' ? parseISO(followupScheduledAt) : followupScheduledAt;
        const followupDate = toZonedTime(followupRaw, BRAZIL_TZ);
        const followupDay = startOfDay(followupDate);

        // DIFERENÇA PARA O PRAZO FINAL (Em dias)
        const daysUntilFollowup = differenceInCalendarDays(followupDay, today);

        if (daysUntilFollowup <= 0) {
            // É HOJE OU JÁ PASSOU
            percentage = 100;
            isOverdue = isAfter(now, followupDate) || today.getTime() > followupDay.getTime();
        } else if (daysUntilFollowup === 1) {
            // É AMANHÃ: Já entra em estado Crítico (80%) para alertar
            percentage = 80;
        } else {
            // MAIS DE 1 DIA: Calcula proporcionalmente ao tempo total desde o atendimento
            const totalDaysWindow = differenceInCalendarDays(followupDay, interactionDay);
            if (totalDaysWindow <= 0) {
                percentage = 80; // Fallback se o atendimento foi "no futuro"
            } else {
                percentage = (daysSinceInteraction / totalDaysWindow) * 100;
                // Garante que se falta mais de 1 dia, não fique colado no 100%
                if (percentage > 70) percentage = 70;
            }
        }
    } else {
        // SEM FOLLOW-UP: Limite padrão de 5 dias
        const totalDaysLimit = 5;
        if (daysSinceInteraction >= totalDaysLimit) {
            percentage = 100;
            isOverdue = true;
        } else {
            percentage = (daysSinceInteraction / totalDaysLimit) * 100;
        }
    }

    // Normalização
    if (isNaN(percentage) || percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;

    // PALETA DE CORES COM ALERTA ANTECIPADO
    let color = '#10b981'; // Verde (Novo)
    let label = 'No Prazo';

    if (percentage >= 100) {
        color = '#991b1b'; // Vermelho Sangue (DIA D / VENCIDO)
        label = 'Vencido';
    } else if (percentage >= 80) {
        color = '#dc2626'; // Vermelho Vivo (AMANHÃ!)
        label = 'Crítico';
    } else if (percentage > 50) {
        color = '#f97316'; // Laranja (Urgente)
        label = 'Urgente';
    } else if (percentage > 25) {
        color = '#fbbf24'; // Amarelo (Atenção)
        label = 'Atenção';
    } else if (percentage > 0) {
        color = '#34d399'; // Verde Esmeralda (Ativo)
        label = 'Ativo';
    }

    return {
        color,
        percentage: Math.round(percentage),
        label,
        daysDiff: Math.max(0, daysSinceInteraction),
        isOverdue
    };
};
