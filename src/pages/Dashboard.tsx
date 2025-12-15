import { Users, TrendingUp, DollarSign, Target, Phone, Calendar, Clock } from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { leadsVsSalesData, leads, teamMembers } from '@/data/mockData';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const recentLeads = leads.slice(0, 5);
const topAgents = teamMembers
  .filter(m => m.status === 'active')
  .sort((a, b) => b.sales - a.sales)
  .slice(0, 3);

const upcomingActivities = [
  { id: 1, type: 'Visita', title: 'Visita Apartamento Garden', time: '14:00', client: 'Roberto Almeida' },
  { id: 2, type: 'Ligação', title: 'Follow-up Cliente', time: '15:30', client: 'Fernanda Lima' },
  { id: 3, type: 'Reunião', title: 'Reunião de Equipe', time: '17:00', client: 'Equipe Vendas' },
];

export default function Dashboard() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Leads Ativos"
          value="247"
          icon={Users}
          color="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Vendas do Mês"
          value="12"
          icon={TrendingUp}
          color="success"
          trend={{ value: 8, isPositive: true }}
        />
        <KPICard
          title="Ticket Médio"
          value="R$ 485.000"
          icon={DollarSign}
          color="warning"
        />
        <KPICard
          title="Taxa de Conversão"
          value="4.8%"
          icon={Target}
          color="purple"
          trend={{ value: 0.3, isPositive: true }}
        />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl p-5 shadow-card border animate-fade-in -mx-4 lg:mx-0 rounded-none lg:rounded-xl">
        <h2 className="text-lg font-semibold text-card-foreground mb-4 px-4 lg:px-0">Leads vs Vendas</h2>
        <div className="h-64 lg:h-80 -mx-2 lg:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={leadsVsSalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="leads"
                name="Leads"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sales"
                name="Vendas"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--success))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Cards */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent Leads */}
        <div className="bg-card rounded-xl p-5 shadow-card border animate-fade-in">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Leads Recentes</h2>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-card-foreground truncate">{lead.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {lead.phone}
                  </p>
                </div>
                <StatusBadge status={lead.origin} />
              </div>
            ))}
          </div>
        </div>

        {/* Top Agents */}
        <div className="bg-card rounded-xl p-5 shadow-card border animate-fade-in">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Top Corretores</h2>
          <div className="space-y-4">
            {topAgents.map((agent, index) => (
              <div key={agent.id} className="flex items-center gap-3">
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
            ))}
          </div>
        </div>

        {/* Upcoming Activities */}
        <div className="bg-card rounded-xl p-5 shadow-card border animate-fade-in">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Próximas Atividades</h2>
          <div className="space-y-3">
            {upcomingActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-2 border-b last:border-0">
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
