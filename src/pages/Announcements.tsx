import { useState } from 'react';
import { Eye, MousePointer, Target, DollarSign, Users, TrendingUp } from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { campaigns, campaignPerformance } from '@/data/mockData';
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
  const [period, setPeriod] = useState('30');

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
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Impressões" value="45.280" icon={Eye} color="primary" />
        <KPICard title="Cliques" value="1.847" icon={MousePointer} color="primary" />
        <KPICard title="CTR" value="4.08%" icon={Target} color="success" />
        <KPICard title="Custo por Lead" value="R$ 18,50" icon={DollarSign} color="warning" />
        <KPICard title="Leads Gerados" value="234" icon={Users} color="success" />
        <KPICard title="Investimento" value="R$ 4.329" icon={TrendingUp} color="purple" />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl p-5 shadow-card border animate-fade-in">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Performance por Campanha</h2>
        <div className="h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={campaignPerformance} layout="vertical">
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
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-card rounded-xl shadow-card border animate-fade-in overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold text-card-foreground">Campanhas</h2>
        </div>
        <div className="overflow-x-auto">
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
              {campaigns.map((campaign, index) => (
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
                    R$ {campaign.cpl.toFixed(2)}
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
