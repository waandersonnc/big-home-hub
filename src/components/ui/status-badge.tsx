import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'outline';
  className?: string;
}

const statusColors: Record<string, string> = {
  // Lead status
  'Novo': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  'Em Espera': 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
  'Em Atendimento': 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  'Documentação': 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
  'Comprou': 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
  'Atribuído': 'bg-primary/10 text-primary border-primary/20',
  'Removido': 'bg-destructive/10 text-destructive border-destructive/20',
  'Desconhecido': 'bg-muted text-muted-foreground border-muted',
  // Property status
  'Disponível': 'bg-success/10 text-success border-success/20',
  'Reservado': 'bg-warning/10 text-warning border-warning/20',
  'Vendido': 'bg-muted text-muted-foreground border-muted',
  // Campaign status
  'Ativo': 'bg-success/10 text-success border-success/20',
  'Pausado': 'bg-warning/10 text-warning border-warning/20',
  'Encerrado': 'bg-muted text-muted-foreground border-muted',
  // Transaction status
  'Pago': 'bg-success/10 text-success border-success/20',
  'Pendente': 'bg-warning/10 text-warning border-warning/20',
  'Atrasado': 'bg-destructive/10 text-destructive border-destructive/20',
  // Lead origins
  'WhatsApp': 'bg-success/10 text-success border-success/20',
  'Site': 'bg-primary/10 text-primary border-primary/20',
  'Indicação': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Instagram': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  // Team roles
  'Gerente': 'bg-primary-dark text-primary-foreground',
  'Corretor': 'bg-primary/10 text-primary',
};

export function StatusBadge({ status, variant = 'default', className }: StatusBadgeProps) {
  // Encontrar a cor de forma case-insensitive
  const statusKey = Object.keys(statusColors).find(
    key => key.toLowerCase() === status?.toLowerCase()
  ) || status;

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      statusColors[statusKey] || 'bg-muted text-muted-foreground',
      className
    )}>
      {statusKey}
    </span>
  );
}
