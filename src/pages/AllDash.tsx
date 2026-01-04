import { BarChart3, TrendingUp, Users, Building2, AlertCircle } from 'lucide-react';
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

const data = [
    { name: 'Unidade Centro', leads: 400, revenue: 124000 },
    { name: 'Unidade Jardins', leads: 300, revenue: 98000 },
    { name: 'Unidade Barra', leads: 200, revenue: 45000 },
];

export default function AllDash() {
    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Visão Consolidada</h1>
                <p className="text-muted-foreground">Métricas agregadas de todas as suas imobiliárias.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 space-y-2 border-none shadow-soft">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">Total de Leads</span>
                        <Users size={16} />
                    </div>
                    <div className="text-2xl font-bold">900</div>
                    <div className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                        <TrendingUp size={12} />
                        +12% este mês
                    </div>
                </Card>

                <Card className="p-6 space-y-2 border-none shadow-soft">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">Faturamento Total</span>
                        <TrendingUp size={16} />
                    </div>
                    <div className="text-2xl font-bold">R$ 267.000</div>
                    <div className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                        <TrendingUp size={12} />
                        +8% este mês
                    </div>
                </Card>

                <Card className="p-6 space-y-2 border-none shadow-soft">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">Imobiliárias Ativas</span>
                        <Building2 size={16} />
                    </div>
                    <div className="text-2xl font-bold">3</div>
                </Card>

                <Card className="p-6 space-y-2 border-none shadow-soft">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">Alerta de Ociosidade</span>
                        <AlertCircle size={16} />
                    </div>
                    <div className="text-2xl font-bold">2 Unidades</div>
                    <div className="text-xs text-amber-500">Abaixo da média esperada</div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8 border-none shadow-soft space-y-6">
                    <h3 className="font-bold text-lg">Leads por Unidade</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="leads" radius={[4, 4, 0, 0]} barSize={40}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#0ea5e9' : '#94a3b8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-8 border-none shadow-soft space-y-6">
                    <h3 className="font-bold text-lg">Faturamento por Unidade</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={40} fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
