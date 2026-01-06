import { useState, useMemo, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Target, Phone, Calendar, Clock, Loader2 } from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { leads as mockLeads, teamMembers } from '@/data/mockData';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { dashboardService, DashboardStats } from '@/services/dashboard.service';
import { CHART_CONFIG, UI_TEXT } from '@/lib/constants';
import { HorizontalFunnel } from '@/components/HorizontalFunnel';

// Demo activities
const demoActivities = [
  { id: 1, type: 'Visita', title: 'Visita Apartamento Garden', time: '14:00', client: 'Roberto Almeida' },
  { id: 2, type: 'Ligação', title: 'Follow-up Cliente', time: '15:30', client: 'Fernanda Lima' },
  { id: 3, type: 'Reunião', title: 'Reunião de Equipe', time: '17:00', client: 'Equipe Vendas' },
];

// Lead interface for display
interface DisplayLead {
  id: string;
  name: string;
  phone: string;
  source?: string;
  origin?: string;
}

// Agent interface for display
interface DisplayAgent {
  id: string;
  name: string;
  role: string;
  sales: number;
  avatar: string;
}

// Função para gerar dados do gráfico baseados no período
const generateChartData = (period: '30d' | '90d' | 'total', stats: DashboardStats) => {
  const today = new Date();
  const data = [];

  const days = CHART_CONFIG.PERIOD_DAYS[period];
  const interval = Math.ceil(days / CHART_CONFIG.DATA_POINTS);

  for (let i = 0; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - (i * interval)));

    // Use real stats as base, with variations
    const baseLeads = Math.max(1, stats.totalLeads - (i * Math.floor(stats.totalLeads / 10)) + Math.floor(Math.random() * 5));
    const baseDocs = Math.max(0, stats.totalDocs - (i * Math.floor(stats.totalDocs / 15)) + Math.floor(Math.random() * 2));
    const baseSales = Math.max(0, stats.totalSales - Math.floor(i * 0.3) + Math.floor(Math.random() * 1));

    // Revenue variations
    const revenueBase = stats.totalRevenue / 8;
    const revenueVariation = revenueBase * (0.5 + Math.random());

    data.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      fullDate: date.toLocaleDateString('pt-BR'),
      leads: baseLeads,
      docs: baseDocs,
      sales: baseSales,
      revenue: Math.floor(revenueVariation),
    });
  }

  return data;
};

// Demo chart data generator
const generateDemoChartData = (period: '30d' | '90d' | 'total') => {
  const today = new Date();
  const data = [];

  const days = CHART_CONFIG.PERIOD_DAYS[period];
  const interval = Math.ceil(days / CHART_CONFIG.DATA_POINTS);

  for (let i = 0; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - (i * interval)));

    const baseLeads = 247 - (i * 25) + Math.floor(Math.random() * 20);
    const baseDocs = 30 - (i * 2) + Math.floor(Math.random() * 3);
    const baseSales = 12 - Math.floor(i * 0.5) + Math.floor(Math.random() * 2);

    const revenueVariations = [0, 120000, 350000, 500000, 180000, 420000, 50000, 485000];
    const baseRevenue = revenueVariations[i] + Math.floor(Math.random() * 30000);

    data.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      fullDate: date.toLocaleDateString('pt-BR'),
      leads: Math.max(12, baseLeads),
      docs: Math.max(5, baseDocs),
      sales: Math.max(3, baseSales),
      revenue: baseRevenue,
    });
  }

  return data;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export default function Dashboard() {
  const [periodFilter, setPeriodFilter] = useState<'30d' | '90d' | 'total'>('30d');
  const { user, isDemo: authIsDemo } = useAuthContext();
  const { selectedCompanyId, selectedCompany } = useCompany();

  // Check demo from both sources
  const isDemo = authIsDemo || (typeof window !== 'undefined' && sessionStorage.getItem('bighome_demo_active') === 'true');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<DisplayLead[]>([]);
  const [topAgents, setTopAgents] = useState<DisplayAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data when company is selected
  useEffect(() => {
    async function fetchData() {
      // Se não houver empresa selecionada e não for demo, reseta
      if (!selectedCompanyId && !isDemo) {
        setStats({ totalLeads: 0, totalDocs: 0, totalSales: 0, totalRevenue: 0, teamCount: 0 });
        setRecentLeads([]);
        setTopAgents([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Se houver uma empresa selecionada (mesmo que seja uma do fallback demo), tenta buscar no banco
        if (selectedCompanyId && !selectedCompanyId.startsWith('demo-')) {
          const [companyStats, leads, agents] = await Promise.all([
            dashboardService.getCompanyStats(selectedCompanyId),
            dashboardService.getRecentLeads(selectedCompanyId, 5),
            dashboardService.getTopAgents(selectedCompanyId, 3)
          ]);

          // Se encontramos dados reais no banco para esta empresa
          if (companyStats.totalLeads > 0 || leads.length > 0) {
            setStats(companyStats);
            setRecentLeads(leads.map((l: any) => ({
              id: l.id,
              name: l.name,
              phone: l.phone || 'Sem telefone',
              origin: l.source || 'Desconhecido'
            })));
            setTopAgents(agents.map((a: any) => ({
              id: a.id,
              name: a.full_name,
              role: a.user_type === 'manager' ? 'Gerente' : 'Corretor',
              sales: a.sales,
              avatar: a.full_name?.charAt(0).toUpperCase() || 'U'
            })));
            setIsLoading(false);
            return;
          }
        }

        // Se chegou aqui, ou é demo com empresa ID "demo-x", ou o banco está vazio
        if (isDemo) {
          setStats({
            totalLeads: 247,
            totalDocs: 30,
            totalSales: 12,
            totalRevenue: 485000,
            teamCount: 50
          });
          setRecentLeads(mockLeads.slice(0, 5).map(l => ({
            id: l.id,
            name: l.name,
            phone: l.phone,
            origin: l.origin
          })));
          setTopAgents(teamMembers
            .filter(m => m.status === 'active')
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 3)
            .map(m => ({
              id: m.id,
              name: m.name,
              role: m.role,
              sales: m.sales,
              avatar: m.avatar
            }))
          );
        } else {
          // Não é demo e não tem dados ou empresa
          setStats({ totalLeads: 0, totalDocs: 0, totalSales: 0, totalRevenue: 0, teamCount: 0 });
          setRecentLeads([]);
          setTopAgents([]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        // Em caso de erro no modo demo, garante que os dados mockados sejam exibidos
        if (isDemo) {
          setStats({ totalLeads: 247, totalDocs: 30, totalSales: 12, totalRevenue: 485000, teamCount: 50 });
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [selectedCompanyId, isDemo, selectedCompany]);

  // Memoize chart data
  const displayChartData = useMemo(() => {
    if (isDemo) {
      return generateDemoChartData(periodFilter);
    }
    if (!stats) return [];
    return generateChartData(periodFilter, stats);
  }, [isDemo, periodFilter, stats]);

  const kpiData = {
    leads: stats?.totalLeads.toString() || '0',
    docs: stats?.totalDocs.toString() || '0',
    sales: stats?.totalSales.toString() || '0',
    revenue: formatCurrency(stats?.totalRevenue || 0)
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Painel</h1>
        <p className="text-muted-foreground">
          {selectedCompany ? `${selectedCompany.name} - Visão geral` : 'Visão geral do seu negócio'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Leads"
          value={kpiData.leads}
          icon={Users}
          color="primary"
          trend={isDemo ? { value: 12, isPositive: true } : undefined}
        />
        <KPICard
          title="Documentos"
          value={kpiData.docs}
          icon={Target}
          color="purple"
          trend={isDemo ? { value: 0.3, isPositive: true } : undefined}
        />
        <KPICard
          title="Vendas"
          value={kpiData.sales}
          icon={TrendingUp}
          color="success"
          trend={isDemo ? { value: 8, isPositive: true } : undefined}
        />
        <KPICard
          title="Faturamento"
          value={kpiData.revenue}
          icon={DollarSign}
          color="warning"
        />
      </div>

      {/* Liquid Glass Wave Chart - Enhanced */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 -mx-4 lg:mx-0 rounded-none lg:rounded-[2.5rem] overflow-hidden relative h-[300px] flex flex-col mb-8 group/funnel animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {/* Simplified Atmospheric Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10 px-8">
          <div>
            <h2 className="text-xl font-bold text-card-foreground/90 tracking-tight">Fluxo de Conversão</h2>
            <p className="text-xs text-muted-foreground/70 mt-1">Jornada do lead até a venda</p>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1">
              {(['30d', '90d', 'total'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setPeriodFilter(period)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${periodFilter === period
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                >
                  {period === 'total' ? 'Total' : period.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary/80" />
            </div>
          </div>
        </div>

        <div className="flex-1 w-full relative z-10 px-6 py-4">
          <HorizontalFunnel data={displayChartData} />
        </div>

        {/* Simplified Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
      </div>

      {/* Secondary Cards */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent Leads */}
        <div className="glass-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Oportunidades Recentes
          </h2>
          <div className="space-y-3">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/5 -mx-2 px-2 rounded-lg transition-all duration-200">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-card-foreground truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </p>
                  </div>
                  <StatusBadge status={lead.origin || 'Desconhecido'} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-10 text-center">{UI_TEXT.MESSAGES.NO_LEADS_FOUND}</p>
            )}
          </div>
        </div>

        {/* Top Agents */}
        <div className="glass-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Top Corretores
          </h2>
          <div className="space-y-4">
            {topAgents.length > 0 ? (
              topAgents.map((agent, index) => (
                <div key={agent.id} className="flex items-center gap-3 hover:bg-white/5 -mx-2 px-2 py-2 rounded-lg transition-all duration-200">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {agent.avatar}
                    </div>
                    {index === 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning text-warning-foreground text-xs">
                        🏆
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-card-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-card-foreground">{agent.sales}</p>
                    <p className="text-xs text-muted-foreground">vendas</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-10 text-center">{UI_TEXT.MESSAGES.NO_SALES_REGISTERED}</p>
            )}
          </div>
        </div>

        {/* Upcoming Activities */}
        <div className="glass-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Próximas Atividades
          </h2>
          <div className="space-y-3">
            {isDemo ? (
              demoActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0 hover:bg-white/5 -mx-2 px-2 rounded-lg transition-all duration-200">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground flex-shrink-0">
                    {activity.type === 'Visita' && <Calendar className="h-4 w-4" />}
                    {activity.type === 'Ligação' && <Phone className="h-4 w-4" />}
                    {activity.type === 'Reunião' && <Users className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-card-foreground">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.client}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {activity.time}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-10 text-center">{UI_TEXT.MESSAGES.NO_ACTIVITIES_SCHEDULED}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
