import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps,
} from 'recharts';

interface FunnelDataPoint {
    date: string;
    fullDate?: string;
    leads: number;
    docs: number;
    sales: number;
    revenue?: number;
}

interface HorizontalFunnelProps {
    data: FunnelDataPoint[];
    className?: string;
}

// Custom Tooltip Component - Clean and minimal
const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const formatValue = (name: string, value: number) => {
        if (name === 'Faturamento') {
            return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        return value;
    };

    return (
        <div className="funnel-tooltip bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 shadow-2xl">
            <p className="text-xs text-white/60 mb-2 font-medium">{label}</p>
            <div className="space-y-1.5">
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{
                                backgroundColor: entry.color,
                            }}
                        />
                        <span className="text-xs text-white/80 capitalize">{entry.name}</span>
                        <span className="text-xs text-white font-semibold ml-auto">
                            {formatValue(entry.name || '', entry.value as number)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const HorizontalFunnel: React.FC<HorizontalFunnelProps> = ({ data, className }) => {
    // Fallback data if none provided
    const chartData = useMemo(() => {
        if (data && data.length > 0) return data;

        // Generate minimal fallback
        return [
            { date: 'Sem. 1', leads: 200, docs: 25, sales: 8 },
            { date: 'Sem. 2', leads: 180, docs: 28, sales: 10 },
            { date: 'Sem. 3', leads: 220, docs: 30, sales: 11 },
            { date: 'Sem. 4', leads: 247, docs: 32, sales: 12 },
        ];
    }, [data]);

    return (
        <div className={`funnel-chart-container w-full h-full min-h-[160px] ${className || ''}`}>
            {/* CSS for neon effects - uses CSS animations instead of SVG filters for performance */}
            <style>{`
        .funnel-chart-container {
          --neon-blue: #3B82F6;
          --neon-purple: #A855F7;
          --neon-cyan: #22D3EE;
        }
        
        /* Subtle pulse animation on the chart area - REMOVED shadows */
        .funnel-chart-container .recharts-area-area {
          /* No shadow effects */
        }
        
        /* Lines without shadow */
        .funnel-chart-container .recharts-area-curve {
          transition: opacity 0.3s ease;
        }
        
        /* Hover state - no shadows */
        .funnel-chart-container:hover .recharts-area-curve {
          /* No shadow effects */
        }
        
        .funnel-chart-container:hover .recharts-area-area {
          /* No shadow effects */
        }
        
        /* Smooth dots appearance on hover */
        .funnel-chart-container .recharts-dot {
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.2s ease;
        }
        
        .funnel-chart-container:hover .recharts-dot {
          opacity: 1;
        }
        
        .funnel-chart-container .recharts-active-dot {
          /* No shadow effects */
        }
        
        /* Tooltip styling */
        .funnel-tooltip {
          animation: tooltip-fade-in 0.2s ease-out;
        }
        
        @keyframes tooltip-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Grid lines subtle glow */
        .funnel-chart-container .recharts-cartesian-grid-horizontal line,
        .funnel-chart-container .recharts-cartesian-grid-vertical line {
          stroke-opacity: 0.08;
        }
      `}</style>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                >
                    <defs>
                        {/* Leads Gradient - Blue */}
                        <linearGradient id="gradientLeads" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                            <stop offset="50%" stopColor="#2563EB" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.02} />
                        </linearGradient>

                        {/* Docs Gradient - Purple */}
                        <linearGradient id="gradientDocs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#A855F7" stopOpacity={0.35} />
                            <stop offset="50%" stopColor="#9333EA" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.02} />
                        </linearGradient>

                        {/* Sales Gradient - Cyan/Teal */}
                        <linearGradient id="gradientSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.4} />
                            <stop offset="50%" stopColor="#06B6D4" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#0891B2" stopOpacity={0.02} />
                        </linearGradient>

                        {/* Revenue Gradient - Warning/Amber (same as Faturamento icon) */}
                        <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4} />
                            <stop offset="50%" stopColor="#D97706" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#B45309" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255, 255, 255, 0.06)"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="date"
                        stroke="rgba(255, 255, 255, 0.4)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                        dy={10}
                    />

                    <YAxis
                        yAxisId="left"
                        stroke="rgba(255, 255, 255, 0.4)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                    />

                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="rgba(255, 255, 255, 0.3)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />

                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{
                            stroke: 'rgba(255, 255, 255, 0.1)',
                            strokeWidth: 1,
                            strokeDasharray: '4 4'
                        }}
                    />

                    {/* Revenue Area - With dramatic waves, at the back */}
                    <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        name="Faturamento"
                        stroke="#F59E0B"
                        strokeWidth={2.5}
                        fill="url(#gradientRevenue)"
                        dot={false}
                        activeDot={{
                            r: 5,
                            fill: '#F59E0B',
                            stroke: '#fff',
                            strokeWidth: 2
                        }}
                    />

                    {/* Leads Area - Largest */}
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="leads"
                        name="Leads"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        fill="url(#gradientLeads)"
                        dot={false}
                        activeDot={{
                            r: 5,
                            fill: '#3B82F6',
                            stroke: '#fff',
                            strokeWidth: 2
                        }}
                    />

                    {/* Docs Area - Medium */}
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="docs"
                        name="Documentos"
                        stroke="#A855F7"
                        strokeWidth={2.5}
                        fill="url(#gradientDocs)"
                        dot={false}
                        activeDot={{
                            r: 5,
                            fill: '#A855F7',
                            stroke: '#fff',
                            strokeWidth: 2
                        }}
                    />

                    {/* Sales Area - Smallest, on top */}
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="sales"
                        name="Vendas"
                        stroke="#22D3EE"
                        strokeWidth={2.5}
                        fill="url(#gradientSales)"
                        dot={false}
                        activeDot={{
                            r: 5,
                            fill: '#22D3EE',
                            stroke: '#fff',
                            strokeWidth: 2
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default HorizontalFunnel;
