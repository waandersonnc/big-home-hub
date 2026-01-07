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
import { LoadingScreen } from '@/components/LoadingScreen';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Demo distributions
const demoDistributions = [
  { id: 1, broker: 'Ricardo Silva', lead: 'Ana Paula Souza', date: '07/01', time: '14:20' },
  { id: 2, broker: 'Carla Mendes', lead: 'Marcos Oliveira', date: '07/01', time: '15:15' },
  { id: 3, broker: 'João Paulo', lead: 'Lucia Ferreira', date: '06/01', time: '09:30' },
  { id: 4, broker: 'Beatriz Costa', lead: 'Fernando Santos', date: '06/01', time: '11:45' },
];

// Lead interface for display
interface DisplayLead {
  id: string;
  name: string;
  phone: string;
  interest?: string;
  createdAt: string;
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
const generateChartData = (period: 'month' | 'lastMonth' | 'year', stats: DashboardStats) => {
  const data = [];
  const points = 7;

  for (let i = 0; i < points; i++) {
    const baseLeads = Math.max(1, stats.totalLeads - (i * 2) + Math.floor(Math.random() * 5));
    const baseDocs = Math.max(0, stats.totalDocs - (i * 1) + Math.floor(Math.random() * 2));
    const baseSales = Math.max(0, stats.totalSales - Math.floor(i * 0.2));

    data.push({
      date: `Ponto ${i + 1}`,
      leads: baseLeads,
      docs: baseDocs,
      sales: baseSales,
      revenue: Math.floor(stats.totalRevenue / points),
    });
  }

  return data;
};

// Demo chart data generator
const generateDemoChartData = (period: 'month' | 'lastMonth' | 'year') => {
  const data = [];
  const points = 7;

  for (let i = 0; i < points; i++) {
    const revenueVariations = [350000, 120000, 485000, 350000, 180000, 420000, 50000];
    data.push({
      date: `Ponto ${i + 1}`,
      leads: 247 - (i * 20),
      docs: 30 - (i * 3),
      sales: 12 - i,
      revenue: revenueVariations[i] || 0,
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
  const [periodFilter, setPeriodFilter] = useState<'month' | 'lastMonth' | 'year'>('month');
  const { user, isDemo: authIsDemo } = useAuthContext();
  const { selectedCompanyId, selectedCompany } = useCompany();

  // Check demo from both sources
  const isDemo = authIsDemo || (typeof window !== 'undefined' && sessionStorage.getItem('bighome_demo_active') === 'true');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<DisplayLead[]>([]);
  const [topAgents, setTopAgents] = useState<DisplayAgent[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data when company is selected
  useEffect(() => {
    async function fetchData() {
      // Determine company ID
      const companyId = selectedCompanyId || (isDemo ? '42c4a6ab-5b49-45f0-a344-fad80e7ac9d2' : null);

      try {
        setIsLoading(true);
        if (companyId) {
          const [companyStats, leads, agents, cData, dists, queueData] = await Promise.all([
            dashboardService.getCompanyStats(companyId, periodFilter),
            dashboardService.getRecentLeads(companyId, 10),
            dashboardService.getTopAgents(companyId, 5, periodFilter),
            dashboardService.getChartData(companyId, periodFilter),
            dashboardService.getRecentDistributions(companyId),
            dashboardService.getBrokerQueue(companyId)
          ]);

          // Se temos uma empresa, usamos os dados do banco (mesmo que sejam 0 no período)
          if (companyId) {
            setStats(companyStats);
            setRecentLeads(leads.map((l: any) => ({
              id: l.id,
              name: l.name,
              phone: l.phone || 'Sem telefone',
              interest: l.interest || l.project_name || l.interest_area || 'Interesse Geral',
              createdAt: l.created_at,
              origin: l.source || 'Desconhecido'
            })));
            setTopAgents(agents.map((a: any) => ({
              id: a.id,
              name: a.full_name,
              role: a.user_type === 'manager' ? 'Gerente' : 'Corretor',
              sales: a.sales,
              avatar: a.full_name?.charAt(0).toUpperCase() || 'U'
            })));
            setQueue(queueData);
            setDistributions(dists);
            setChartData(cData);
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
            teamCount: 50,
            managersCount: 5,
            brokersCount: 45,
            totalProperties: 120
          });
          setRecentLeads(mockLeads.slice(0, 4).map(l => ({
            id: l.id,
            name: l.name,
            phone: l.phone,
            interest: 'Apartamento Garden',
            createdAt: new Date().toISOString(),
            origin: l.origin
          })));
          setTopAgents(teamMembers
            .filter(m => m.status === 'active' && m.role === 'Corretor')
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5)
            .map(m => ({
              id: m.id,
              name: m.name,
              role: m.role,
              sales: m.sales,
              avatar: m.avatar
            }))
          );
          setQueue(teamMembers
            .filter(m => m.status === 'active' && m.role === 'Corretor')
            .slice(0, 4)
            .map(m => ({
              id: m.id,
              name: m.name,
              avatar: m.avatar
            }))
          );
          setChartData(generateDemoChartData(periodFilter));
        } else {
          // Não é demo e não tem dados ou empresa
          setStats({
            totalLeads: 0,
            totalDocs: 0,
            totalSales: 0,
            totalRevenue: 0,
            teamCount: 0,
            managersCount: 0,
            brokersCount: 0,
            totalProperties: 0
          });
          setRecentLeads([]);
          setTopAgents([]);
          setChartData([]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        // Em caso de erro no modo demo, garante que os dados mockados sejam exibidos
        if (isDemo) {
          setStats({
            totalLeads: 247,
            totalDocs: 30,
            totalSales: 12,
            totalRevenue: 485000,
            teamCount: 50,
            managersCount: 5,
            brokersCount: 45,
            totalProperties: 120
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [selectedCompanyId, isDemo, selectedCompany, periodFilter]);

  // Memoize chart data
  const displayChartData = useMemo(() => {
    if (isDemo && !selectedCompanyId) {
      return generateDemoChartData(periodFilter);
    }
    return chartData;
  }, [isDemo, periodFilter, chartData, selectedCompanyId]);

  const kpiData = {
    leads: stats?.totalLeads.toString() || '0',
    docs: stats?.totalDocs.toString() || '0',
    sales: stats?.totalSales.toString() || '0',
    revenue: formatCurrency(stats?.totalRevenue || 0),
    managers: stats?.managersCount.toString() || '0',
    brokers: stats?.brokersCount.toString() || '0'
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando estatísticas do painel..." />;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.9; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite ease-in-out;
        }

        /* Custom scrollbar for leads */
        .leads-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .leads-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .leads-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .leads-scroll:hover::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">Painel</h1>
          <p className="text-muted-foreground">
            {selectedCompany ? `${selectedCompany.name} - Visão geral` : 'Visão geral do seu negócio'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodFilter} onValueChange={(v: any) => setPeriodFilter(v)}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-foreground">
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
          title="Leads"
          value={kpiData.leads}
          icon={Users}
          color="primary"
          trend={isDemo ? { value: 12, isPositive: true } : undefined}
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
        <KPICard
          title="Documentos"
          value={kpiData.docs}
          icon={Target}
          color="purple"
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

          {/* Period Filter removed from here */}
          <div className="flex items-center gap-2">
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

      {/* Secondary Cards - 4-Column Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recent Leads */}
        <div className="glass-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="text-[15px] font-bold text-card-foreground">
              Oportunidades
            </h2>
            <div className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
              Novos
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 leads-scroll">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="group relative bg-white/5 border border-primary/20 p-2.5 rounded-xl hover:bg-white/10 hover:border-white/5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[13px] text-card-foreground group-hover:text-primary transition-colors truncate">
                        {lead.name}
                      </p>
                      <div className="flex flex-col gap-1 mt-1.5">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 leading-none truncate">
                          <Phone className="h-2.5 w-2.5 text-primary/70" />
                          {lead.phone}
                        </p>
                        {lead.interest && (
                          <p className="text-[10px] text-primary font-semibold truncate flex items-center gap-1 leading-none bg-primary/5 p-1 -ml-1 rounded">
                            <Target className="h-2.5 w-2.5 text-primary/70" />
                            {lead.interest}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-[9px] font-bold text-card-foreground/80">
                        {new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </p>
                      <p className="text-[8px] text-muted-foreground mt-0.5">
                        {new Date(lead.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                <Users className="h-10 w-10 mb-2" />
                <p className="text-xs text-center">{UI_TEXT.MESSAGES.NO_LEADS_FOUND}</p>
              </div>
            )}
          </div>
        </div>

        {/* Distribuição */}
        <div className="glass-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="text-[15px] font-bold text-card-foreground">
              Distribuição
            </h2>
            <div className="bg-warning/10 text-warning text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
              em espera
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 leads-scroll">
            {distributions.length > 0 ? (
              distributions.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all duration-200">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[12px] text-card-foreground truncate leading-tight">
                      {item.broker}
                    </p>
                    <p className="text-[11px] text-primary/70 truncate leading-none mt-1">
                      {item.lead}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[9px] font-bold text-card-foreground/80">
                      {new Date(item.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </p>
                    <p className="text-[8px] text-muted-foreground mt-0.5">
                      {new Date(item.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                <Clock className="h-10 w-10 mb-2" />
                <p className="text-xs text-center">Nenhuma distribuição recente</p>
              </div>
            )}
          </div>
        </div>

        {/* Fila */}
        <div className="glass-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="text-[15px] font-bold text-card-foreground">
              Fila
            </h2>
            <div className="bg-success/10 text-success text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
              rodízio
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 leads-scroll">
            {queue.length > 0 ? (
              queue.map((agent, index) => (
                <div
                  key={agent.id}
                  className={`flex items-center gap-2.5 p-2 rounded-xl transition-all duration-200 border ${index < 2
                    ? 'bg-success/15 border-success/20'
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center text-[11px] font-bold">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[12px] text-card-foreground truncate leading-tight">
                      {agent.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate leading-none mt-1">
                      {agent.position}º da Fila
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[9px] font-bold text-destructive/80">
                      {agent.lostLeads} Perdidos
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                <Users className="h-10 w-10 mb-2" />
                <p className="text-xs text-center">Nenhum corretor na fila</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Agents */}
        <div className="glass-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-[380px]">
          <h2 className="text-[15px] font-bold text-card-foreground mb-3">
            Top Corretores
          </h2>
          <div className="flex-1 space-y-2 overflow-y-auto pr-1 leads-scroll">
            {topAgents.length > 0 ? (
              topAgents.map((agent, index) => (
                <div key={agent.id} className="flex items-center gap-2.5 bg-white/5 p-2 rounded-xl hover:bg-white/10 transition-all duration-200 border border-white/5">
                  <div className="relative flex-shrink-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                      {agent.avatar}
                    </div>
                    {index === 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center text-sm animate-pulse-subtle pointer-events-none">
                        🏆
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[12px] text-card-foreground truncate">{agent.name}</p>
                    <p className="text-[9px] uppercase font-bold text-success/80">{agent.sales} vendas</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-muted-foreground py-10 text-center">{UI_TEXT.MESSAGES.NO_SALES_REGISTERED}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
