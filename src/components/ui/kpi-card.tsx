import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'purple';
  className?: string;
}
const colorVariants = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  purple: 'bg-purple-500/10 text-purple-600'
};
export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  className
}: KPICardProps) {
  return (
    <div className={cn(
      'glass-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group',
      'hover:border-white/20',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground/70 leading-tight">
            {title}
          </p>
          <p className="font-semibold text-card-foreground text-xl tracking-tight">
            {value}
          </p>
          {trend && (
            <p className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}% vs mês anterior
            </p>
          )}
        </div>
        <div className={cn(
          'rounded-xl p-2.5',
          colorVariants[color]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}