import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadDistributionTimerProps {
    targetDate: string;
    className?: string; // Permit customization
}

export const LeadDistributionTimer = ({ targetDate, className }: LeadDistributionTimerProps) => {
    const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

    useEffect(() => {
        if (!targetDate) return;

        const updateTimer = () => {
            const now = new Date();
            const end = new Date(targetDate);
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

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    if (!timeRemaining) return null;

    return (
        <div className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-[10px]",
            "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200/50",
            className
        )}>
            <Clock className="w-3 h-3 animate-pulse" />
            <span className="font-mono">{timeRemaining}</span>
        </div>
    );
};
