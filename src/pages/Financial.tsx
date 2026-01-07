import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Target, Wallet, Calendar, Loader2, Plus } from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { transactions as initialTransactions, revenueData as initialRevenue } from '@/data/mockData';
import { demoStore } from '@/lib/demoStore';
import { useCompany } from '@/contexts/CompanyContext';
import { financialService } from '@/services/financial.service';
import { dashboardService } from '@/services/dashboard.service';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

type TransactionType = 'all' | 'Venda' | 'Comissão' | 'Despesa' | 'Receita';
type TransactionStatus = 'all' | 'Pago' | 'Pendente' | 'Atrasado' | 'paid' | 'pending' | 'overdue';

export default function Financial() {
  const isDemo = demoStore.isActive;
  const { selectedCompanyId } = useCompany();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>('all');
  const [periodFilter, setPeriodFilter] = useState<'month' | 'lastMonth' | 'year'>('month');
  const [companyMeta, setCompanyMeta] = useState(0);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newMeta, setNewMeta] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Função para formatar moeda (Padrão BR)
  const formatCurrencyBR = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';

    const amount = (parseInt(digits) / 100).toFixed(2);
    const [integral, decimal] = amount.split('.');
    const formattedIntegral = integral.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formattedIntegral},${decimal}`;
  };

  const handleMetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setNewMeta(formatCurrencyBR(rawValue));
  };

  const fetchData = async () => {
    setLoading(true);
    // Reset data before fetching new ones
    setTransactions([]);
    setCompanyMeta(0);
    setNewMeta('');

    try {
      // If we have a selectedCompanyId, we use it. 
      // Falling back to demo ID only if literally nothing is selected.
      const companyId = selectedCompanyId || (isDemo ? '42c4a6ab-5b49-45f0-a344-fad80e7ac9d2' : null);

      if (companyId) {
        const [data, companyInfo] = await Promise.all([
          financialService.listTransactions(companyId),
          dashboardService.getCompanyInfo(companyId)
        ]);

        if (companyInfo) {
          setCompanyMeta(companyInfo.meta || 0);
          setNewMeta(companyInfo.meta?.toString() || '');
        }

        if (data && data.length > 0) {
          const normalized = data.map(tx => ({
            ...tx,
            date: tx.due_date || tx.created_at,
            value: Number(tx.total_amount) || 0,
            type: tx.type === 'sale' ? 'Venda' :
              tx.type === 'commission' ? 'Comissão' :
                tx.type === 'expense' ? 'Despesa' : tx.type,
            status: tx.status === 'paid' ? 'Pago' :
              tx.status === 'pending' ? 'Pendente' :
                tx.status === 'overdue' ? 'Atrasado' : tx.status
          }));
          setTransactions(normalized);
        } else if (isDemo && !selectedCompanyId) {
          setTransactions(initialTransactions);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar financeiro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMeta = async () => {
    if (!selectedCompanyId || !newMeta) return;

    setSubmitting(true);
    try {
      const numericMeta = parseFloat(newMeta.replace(/\./g, '').replace(',', '.'));
      const result = await dashboardService.updateCompanyMeta(selectedCompanyId, numericMeta);

      if (result.success) {
        toast({
          title: "Meta atualizada",
          description: "A meta mensal da imobiliária foi salva com sucesso.",
        });
        setCompanyMeta(numericMeta);
        setIsGoalModalOpen(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar a meta.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompanyId, isDemo]);

  const displayTransactions = transactions;

  // Agrupar transações conforme o período selecionado para o gráfico
  const chartData = (() => {
    const now = new Date();
    const data: any[] = [];

    if (periodFilter === 'month' || periodFilter === 'lastMonth') {
      const targetDate = periodFilter === 'month'
        ? now
        : new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();

      for (let i = 1; i <= daysInMonth; i++) {
        data.push({
          label: i.toString().padStart(2, '0'),
          revenue: 0,
          day: i,
          month: targetDate.getMonth(),
          year: targetDate.getFullYear()
        });
      }

      transactions.forEach(tx => {
        if (tx.type === 'Venda') {
          const txDate = new Date(tx.date);
          // Usamos UTC para evitar que o fuso horário mude o dia (ex: 15 vira 14)
          const isISO = tx.date.includes('T');
          const txDay = isISO ? txDate.getDate() : txDate.getUTCDate();
          const txMonth = isISO ? txDate.getMonth() : txDate.getUTCMonth();
          const txYear = isISO ? txDate.getFullYear() : txDate.getUTCFullYear();

          if (txMonth === targetDate.getMonth() && txYear === targetDate.getFullYear()) {
            const entry = data.find(item => item.day === txDay);
            if (entry) entry.revenue += Number(tx.value) || 0;
          }
        }
      });
    } else {
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), i, 1);
        const label = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        data.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          revenue: 0,
          monthNum: i,
          year: now.getFullYear()
        });
      }

      transactions.forEach(tx => {
        if (tx.type === 'Venda') {
          const txDate = new Date(tx.date);
          if (txDate.getFullYear() === now.getFullYear()) {
            const entry = data.find(item => item.monthNum === txDate.getMonth());
            if (entry) entry.revenue += Number(tx.value) || 0;
          }
        }
      });
    }
    return data;
  })();

  const displayRevenue = selectedCompanyId ? chartData : (isDemo ? initialRevenue.map(i => ({ ...i, label: i.month })) : chartData);

  // Filtragem e cálculos baseados no período selecionado
  const now = new Date();
  const periodTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const isISO = tx.date.includes('T');
    const txMonth = isISO ? txDate.getMonth() : txDate.getUTCMonth();
    const txYear = isISO ? txDate.getFullYear() : txDate.getUTCFullYear();

    if (periodFilter === 'month') {
      return txMonth === now.getMonth() && txYear === now.getFullYear();
    } else if (periodFilter === 'lastMonth') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return txMonth === lastMonth.getMonth() && txYear === lastMonth.getFullYear();
    } else if (periodFilter === 'year') {
      return txYear === now.getFullYear();
    }
    return true;
  });

  const filteredTransactions = periodTransactions.filter((tx) => {
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const periodRevenue = periodTransactions
    .filter(tx => tx.type === 'Venda')
    .reduce((acc, curr) => acc + (curr.value || 0), 0);

  const periodSalesCount = periodTransactions.filter(tx => tx.type === 'Venda').length;
  const commissionsValue = periodRevenue * 0.05;
  const avgTicketValue = periodSalesCount > 0 ? periodRevenue / periodSalesCount : 0;

  const kpis = {
    revenue: (selectedCompanyId || periodRevenue > 0)
      ? periodRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : (isDemo ? "R$ 45.800" : "R$ 0,00"),
    commissions: (selectedCompanyId || commissionsValue > 0)
      ? commissionsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : (isDemo ? "R$ 12.450" : "R$ 0,00"),
    avgTicket: (selectedCompanyId || avgTicketValue > 0)
      ? avgTicketValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : (isDemo ? "R$ 485.000" : "R$ 0,00"),
    goalProgress: companyMeta > 0 ? Math.min(Math.round((periodRevenue / companyMeta) * 100), 100) : (isDemo && !selectedCompanyId ? 65 : 0),
    goalDetail: companyMeta > 0
      ? `${periodRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de ${companyMeta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      : (isDemo && !selectedCompanyId ? "R$ 45.800 de R$ 70.000" : "R$ 0,00 de R$ 0,00")
  };

  const periodLabels = {
    month: { card: "Receita Mensal", chart: "Receita Mensal", meta: "Meta do Mês" },
    lastMonth: { card: "Receita (Mês Anterior)", chart: "Receita (Mês Anterior)", meta: "Meta do Mês Anterior" },
    year: { card: "Receita Anual", chart: "Receita Anual", meta: "Meta Anual" }
  };

  const currentLabels = periodLabels[periodFilter];

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
        <div className="flex items-center gap-2">
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => setIsGoalModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Meta
          </Button>
          <Select value={periodFilter} onValueChange={(v: any) => setPeriodFilter(v)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="lastMonth">Mês Passado</SelectItem>
              <SelectItem value="year">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={currentLabels.card}
          value={kpis.revenue}
          icon={DollarSign}
          color="success"
          trend={isDemo ? { value: 15, isPositive: true } : undefined}
        />
        <KPICard
          title="Comissões a Pagar"
          value={kpis.commissions}
          icon={Wallet}
          color="warning"
        />
        <KPICard
          title="Ticket Médio"
          value={kpis.avgTicket}
          icon={TrendingUp}
          color="primary"
        />
        <div className="bg-card rounded-xl p-5 shadow-card border animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">{currentLabels.meta}</p>
            <div className={cn(
              "rounded-lg p-2 transition-colors",
              kpis.goalProgress >= 100 ? "bg-success/10" : "bg-purple-500/10"
            )}>
              <Target className={cn(
                "h-5 w-5 transition-colors",
                kpis.goalProgress >= 100 ? "text-success" : "text-purple-600"
              )} />
            </div>
          </div>
          <p className={cn(
            "text-2xl font-bold mb-2 transition-colors",
            kpis.goalProgress >= 100 ? "text-success" : "text-card-foreground"
          )}>{kpis.goalProgress}%</p>
          <Progress
            value={kpis.goalProgress}
            className={cn("h-2", kpis.goalProgress >= 100 && "[&>div]:bg-success")}
          />
          <p className="text-xs text-muted-foreground mt-2">{kpis.goalDetail}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl p-5 shadow-card border animate-fade-in">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">{currentLabels.chart}</h2>
        <div className="h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {displayRevenue.length > 0 ? (
              <AreaChart data={displayRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground italic">
                Sem dados financeiros para o período.
              </div>
            )}
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
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
          ) : (
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
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted-foreground italic">
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Goal Modal */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Definir Meta Mensal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor da Meta (R$)</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={newMeta}
                onChange={handleMetaChange}
                className="text-lg font-bold text-primary"
              />
              <p className="text-xs text-muted-foreground">
                Este valor será usado para calcular o progresso no dashboard financeiro.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGoalModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateMeta}
              disabled={submitting || !newMeta}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Meta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
