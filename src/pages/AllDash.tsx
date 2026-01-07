import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { useAuthContext } from '@/contexts/AuthContext';
import { dashboardService, OverviewStats, CompanyStats } from '@/services/dashboard.service';
import { Loader2 } from 'lucide-react';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

export default function AllDash() {
    const { user, isDemo: authIsDemo } = useAuthContext();
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [companiesData, setCompaniesData] = useState<CompanyStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Check demo from both sources
    const isDemo = authIsDemo || (typeof window !== 'undefined' && sessionStorage.getItem('bighome_demo_active') === 'true');

    useEffect(() => {
        async function fetchData() {
            // Se não houver usuário e não estiver em modo demo, para
            if (!user && !isDemo) {
                setIsLoading(false);
                return;
            }

            try {
                // No modo demo, o ID do usuário já deve ser o do owner demo (definido no AuthContext)
                // Usamos o ID do user ou o fallback fixo do demo se por algum motivo o user for null
                const ownerId = user?.id || 'f6daa179-65ad-47db-a340-0bd31b3acbf5';

                const [overviewStats, chartData] = await Promise.all([
                    dashboardService.getOwnerOverviewStats(ownerId),
                    dashboardService.getCompaniesStatsForCharts(ownerId)
                ]);

                // Sempre usa o que vem do banco (ou zeros se o banco estiver vazio)
                setStats(overviewStats);
                setCompaniesData(chartData);
            } catch (error) {
                console.error('Erro ao buscar dados do Supabase:', error);
                // Em caso de erro, garante que o estado não fique nulo, mostrando 0
                setStats({
                    totalLeads: 0,
                    totalSales: 0,
                    totalRevenue: 0,
                    totalCompanies: 0,
                    managersCount: 0,
                    brokersCount: 0,
                    totalProperties: 0
                });
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [user, isDemo]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const displayStats: OverviewStats = stats || {
        totalLeads: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalCompanies: 0,
        managersCount: 0,
        brokersCount: 0,
        totalProperties: 0
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Visão Consolidada</h1>
                <p className="text-muted-foreground">Métricas agregadas de todas as suas imobiliárias.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <Card className="p-6 space-y-2 border-none shadow-soft">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">Total de Leads</span>
                        <Users size={16} />
                    </div>
                    <div className="text-2xl font-bold">{displayStats.totalLeads.toLocaleString('pt-BR')}</div>
                </Card>

                <Card className="p-6 space-y-2 border-none shadow-soft">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">Faturamento Total</span>
                        <TrendingUp size={16} />
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(displayStats.totalRevenue)}</div>
                </Card>

                <Card className="p-6 space-y-2 border-none shadow-soft">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">Vendas Totais</span>
                        <TrendingUp size={16} />
                    </div>
                    <div className="text-2xl font-bold">{displayStats.totalSales}</div>
                </Card>

                <Card className="p-6 space-y-2 border-none shadow-soft">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">Imóveis Totais</span>
                        <Building2 size={16} />
                    </div>
                    <div className="text-2xl font-bold">{displayStats.totalProperties}</div>
                </Card>

                <Card className="p-6 space-y-2 border-none shadow-soft">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">Gerentes</span>
                        <Users size={16} />
                    </div>
                    <div className="text-2xl font-bold">{displayStats.managersCount}</div>
                </Card>

                <Card className="p-6 space-y-2 border-none shadow-soft">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">Corretores</span>
                        <Users size={16} />
                    </div>
                    <div className="text-2xl font-bold">{displayStats.brokersCount}</div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8 border-none shadow-soft space-y-6">
                    <h3 className="font-bold text-lg">Leads por Unidade</h3>
                    <div className="h-[300px]">
                        {companiesData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={companiesData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        dy={10}
                                        interval={0}
                                        angle={-15}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Leads']}
                                    />
                                    <Bar dataKey="leads" radius={[4, 4, 0, 0]} barSize={40}>
                                        {companiesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#0ea5e9' : '#94a3b8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Nenhuma imobiliária cadastrada
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-8 border-none shadow-soft space-y-6">
                    <h3 className="font-bold text-lg">Faturamento por Unidade</h3>
                    <div className="h-[300px]">
                        {companiesData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={companiesData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        dy={10}
                                        interval={0}
                                        angle={-15}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                                    />
                                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={40} fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Nenhuma imobiliária cadastrada
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

