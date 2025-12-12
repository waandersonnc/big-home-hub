import { useState } from 'react';
import { DollarSign, TrendingUp, Target, Wallet, Calendar } from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { transactions, revenueData } from '@/data/mockData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

type TransactionType = 'all' | 'Venda' | 'Comissão' | 'Despesa';
type TransactionStatus = 'all' | 'Pago' | 'Pendente' | 'Atrasado';

export default function Financial() {
  const [typeFilter, setTypeFilter] = useState<TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>('all');

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Venda':
        return 'text-success';
      case 'Comissão':
        return 'text-warning';
      case 'Despesa':
        return 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe receitas e despesas</p>
        </div>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Jan 2024
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Receita do Mês"
          value="R$ 45.800"
          icon={DollarSign}
          color="success"
          trend={{ value: 15, isPositive: true }}
        />
        <KPICard
          title="Comissões a Pagar"
          value="R$ 12.450"
          icon={Wallet}
          color="warning"
        />
        <KPICard
          title="Ticket Médio"
          value="R$ 485.000"
          icon={TrendingUp}
          color="primary"
        />
        <div className="bg-card rounded-xl p-5 shadow-card border animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Meta do Mês</p>
            <div className="rounded-lg p-2 bg-purple-500/10">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-card-foreground mb-2">65%</p>
          <Progress value={65} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">R$ 45.800 de R$ 70.000</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl p-5 shadow-card border animate-fade-in">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Receita Mensal</h2>
        <div className="h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-card rounded-xl shadow-card border animate-fade-in overflow-hidden">
        <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-card-foreground">Transações</h2>
          <div className="flex gap-3">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TransactionType)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Venda">Venda</SelectItem>
                <SelectItem value="Comissão">Comissão</SelectItem>
                <SelectItem value="Despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TransactionStatus)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Data</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Descrição</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Tipo</th>
                <th className="text-right p-4 font-medium text-muted-foreground text-sm">Valor</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, index) => (
                <tr
                  key={tx.id}
                  className={cn(
                    'border-b last:border-0 hover:bg-muted/30 transition-colors',
                    index % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'
                  )}
                >
                  <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-card-foreground text-sm">{tx.description}</span>
                  </td>
                  <td className="p-4">
                    <span className={cn('text-sm font-medium', getTypeColor(tx.type))}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={cn(
                      'font-semibold',
                      tx.type === 'Despesa' ? 'text-destructive' : 'text-success'
                    )}>
                      {tx.type === 'Despesa' ? '-' : '+'}{formatCurrency(tx.value)}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
