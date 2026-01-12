import { useState, useEffect } from 'react';
import { Eye, MousePointer, Target, DollarSign, Users, TrendingUp, Loader2 } from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { campaigns as initialCampaigns, campaignPerformance as initialPerformance } from '@/data/mockData';
import { demoStore } from '@/lib/demoStore';
import { useCompany } from '@/contexts/CompanyContext';
import { campaignService } from '@/services/campaign.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

export default function Announcements() {
  const isDemo = demoStore.isActive;
  const { selectedCompanyId } = useCompany();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchData = async () => {
    if (!selectedCompanyId && !isDemo) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const companyId = selectedCompanyId || (isDemo ? '42c4a6ab-5b49-45f0-a344-fad80e7ac9d2' : null);
      if (companyId) {
        const data = await campaignService.listCampaigns(companyId);
        setCampaigns(data || []);
      } else {
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Erro ao buscar campanhas do Supabase:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompanyId, isDemo]);

  const displayCampaigns = campaigns;

  // Map campaigns to performance data for chart
  const displayPerformance = displayCampaigns.map(c => ({
    name: c.name.split(' ')[0], // Shorten name for chart
    fullName: c.name,
    leads: c.leads,
    cost: c.cost
  }));

  // Calculate KPIs from real data
  const totalImpressions = displayCampaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
  const totalClicks = displayCampaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const totalLeads = displayCampaigns.reduce((acc, c) => acc + (c.leads || 0), 0);
  const totalInvestment = displayCampaigns.reduce((acc, c) => acc + (Number(c.cost) || 0), 0);
  const avgCPL = totalLeads > 0 ? (totalInvestment / totalLeads) : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;

  const kpis = {
    impressions: totalImpressions > 0 ? totalImpressions.toLocaleString('pt-BR') : (isDemo ? "45.280" : "0"),
    clicks: totalClicks > 0 ? totalClicks.toLocaleString('pt-BR') : (isDemo ? "1.847" : "0"),
    ctr: ctr > 0 ? `${ctr.toFixed(2)}%` : (isDemo ? "4.08%" : "0.00%"),
    cpl: avgCPL > 0 ? `R$ ${avgCPL.toFixed(2)}` : (isDemo ? "R$ 18,50" : "R$ 0,00"),
    leads: totalLeads > 0 ? totalLeads.toString() : (isDemo ? "234" : "0"),
    investment: totalInvestment > 0 ? totalInvestment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : (isDemo ? "R$ 4.329" : "R$ 0")
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Métricas de Anúncios</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho das suas campanhas</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Meta Ads
          </span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard title="Impressões" value={kpis.impressions} icon={Eye} color="primary" />
        <KPICard title="Cliques" value={kpis.clicks} icon={MousePointer} color="primary" />
        <KPICard title="Custo por Lead" value={kpis.cpl} icon={DollarSign} color="warning" />
        <KPICard title="Leads Gerados" value={kpis.leads} icon={Users} color="success" />
        <KPICard title="Investimento" value={kpis.investment} icon={TrendingUp} color="purple" />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl p-5 shadow-card border animate-fade-in">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Performance por Campanha</h2>
        <div className="h-64 lg:h-80">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {displayPerformance.length > 0 ? (
                <BarChart data={displayPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="cost" name="Custo (R$)" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
                </BarChart>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic">
                  Sem dados de performance para o período.
                </div>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-card rounded-xl shadow-card border animate-fade-in overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold text-card-foreground">Campanhas</h2>
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
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Nome</th>
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-sm">Impressões</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-sm">Cliques</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-sm">Leads</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-sm">Custo</th>
                  <th className="text-right p-4 font-medium text-muted-foreground text-sm">CPL</th>
                </tr>
              </thead>
              <tbody>
                {displayCampaigns.length > 0 ? (
                  displayCampaigns.map((campaign, index) => (
                    <tr
                      key={campaign.id}
                      className={cn(
                        'border-b last:border-0 hover:bg-muted/30 transition-colors',
                        index % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'
                      )}
                    >
                      <td className="p-4">
                        <span className="font-medium text-card-foreground">{campaign.name}</span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="p-4 text-right text-muted-foreground">
                        {campaign.impressions.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4 text-right text-muted-foreground">
                        {campaign.clicks.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4 text-right font-medium text-card-foreground">{campaign.leads}</td>
                      <td className="p-4 text-right text-muted-foreground">
                        R$ {campaign.cost.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4 text-right font-medium text-card-foreground">
                        R$ {Number(campaign.cpl).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-muted-foreground animate-pulse">
                      Nenhuma campanha ativa no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
