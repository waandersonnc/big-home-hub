import React, { useMemo } from 'react';

interface HorizontalFunnelProps {
    data: {
        leads: number;
        docs: number;
        sales: number;
    };
    className?: string;
}

export const HorizontalFunnel: React.FC<HorizontalFunnelProps> = ({ data, className }) => {
    // Normalize heights based on max value (usually leads)
    const maxVal = Math.max(data.leads, 1);
    const h1 = 0.8; // Stage 1 (Leads) - 80% of height
    const h2 = (data.docs / maxVal) * 0.8; // Stage 2 (Docs)
    const h3 = (data.sales / maxVal) * 0.8; // Stage 3 (Sales)

    // Ensure minimum visual presence
    const finalH2 = Math.max(h2, 0.3);
    const finalH3 = Math.max(h3, 0.1);

    const width = 800;
    const height = 300;
    const centerY = height / 2;

    const points = useMemo(() => {
        const p1 = { x: 0, h: height * h1 };
        const p2 = { x: width * 0.5, h: height * finalH2 };
        const p3 = { x: width, h: height * finalH3 };

        const top = {
            y1: centerY - p1.h / 2,
            y2: centerY - p2.h / 2,
            y3: centerY - p3.h / 2,
        };

        const bottom = {
            y1: centerY + p1.h / 2,
            y2: centerY + p2.h / 2,
            y3: centerY + p3.h / 2,
        };

        const path = `
      M 0 ${top.y1}
      C ${width * 0.25} ${top.y1}, ${width * 0.25} ${top.y2}, ${width * 0.5} ${top.y2}
      C ${width * 0.75} ${top.y2}, ${width * 0.75} ${top.y3}, ${width} ${top.y3}
      L ${width} ${bottom.y3}
      C ${width * 0.75} ${bottom.y3}, ${width * 0.75} ${bottom.y2}, ${width * 0.5} ${bottom.y2}
      C ${width * 0.25} ${bottom.y2}, ${width * 0.25} ${bottom.y1}, 0 ${bottom.y1}
      Z
    `.replace(/\s+/g, ' ').trim();

        return { path, p1, p2, p3, top, bottom };
    }, [finalH2, finalH3, height, width, centerY]);

    return (
        <div className={`relative w-full h-full min-h-[300px] flex items-center justify-center ${className}`}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {/* Main Blue Gradient - More Vibrant */}
                    <linearGradient id="funnelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.3" />
                    </linearGradient>

                    {/* Center Boost - Extra blue in the middle */}
                    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#0061ff" stopOpacity="0.6" />
                        <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </radialGradient>

                    {/* Flow Animation Gradient - More Intense */}
                    <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0">
                            <animate attributeName="offset" values="-0.5; 1.5" dur="6s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="50%" stopColor="#0061ff" stopOpacity="0.7">
                            <animate attributeName="offset" values="0; 2" dur="6s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0">
                            <animate attributeName="offset" values="0.5; 2.5" dur="6s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>

                    {/* Shimmer Effect - More Visible */}
                    <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#60A5FA" stopOpacity="0" />
                        <stop offset="50%" stopColor="#93C5FD" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
                        <animateTransform
                            attributeName="gradientTransform"
                            type="translate"
                            from="-1 0"
                            to="1 0"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </linearGradient>

                    {/* Optimized Blur Filter for Glow */}
                    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
                        <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
                        <feMerge>
                            <feMergeNode in="blur2" />
                            <feMergeNode in="blur1" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Subtle Pulse Filter */}
                    <filter id="neonPulse" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                        <feColorMatrix in="blur" type="matrix" values="
                            0 0 0 0 0.23
                            0 0 0 0 0.51
                            0 0 0 0 0.96
                            0 0 0 0.5 0" result="glow">
                            <animate attributeName="values"
                                values="0 0 0 0 0.23 0 0 0 0 0.51 0 0 0 0 0.96 0 0 0 0.3 0;
                                        0 0 0 0 0.23 0 0 0 0 0.51 0 0 0 0 0.96 0 0 0 0.6 0;
                                        0 0 0 0 0.23 0 0 0 0 0.51 0 0 0 0 0.96 0 0 0 0.3 0"
                                dur="3s" repeatCount="indefinite" />
                        </feColorMatrix>
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Clip Path */}
                    <clipPath id="funnelClip">
                        <path d={points.path} />
                    </clipPath>
                </defs>

                {/* Layered Rendering for Smooth Neon Effect */}
                <g>
                    {/* Outer Glow - Largest blur */}
                    <path
                        d={points.path}
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="8"
                        strokeOpacity="0.25"
                        filter="url(#softGlow)"
                    />

                    {/* Middle Glow - Medium blur with pulse */}
                    <path
                        d={points.path}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="5"
                        strokeOpacity="0.45"
                        filter="url(#neonPulse)"
                    />

                    {/* Inner Glow - Tight blur */}
                    <path
                        d={points.path}
                        fill="none"
                        stroke="#60A5FA"
                        strokeWidth="3"
                        strokeOpacity="0.6"
                        filter="url(#softGlow)"
                    />

                    {/* Main Glass Body */}
                    <path
                        d={points.path}
                        fill="url(#funnelGradient)"
                        opacity="1"
                    />

                    {/* Center Radial Boost */}
                    <ellipse
                        cx={width * 0.5}
                        cy={centerY}
                        rx={width * 0.3}
                        ry={height * 0.35}
                        fill="url(#centerGlow)"
                        clipPath="url(#funnelClip)"
                    />

                    {/* Flowing Data/Energy Layer */}
                    <path
                        d={points.path}
                        fill="url(#flowGradient)"
                        clipPath="url(#funnelClip)"
                        opacity="0.9"
                    />

                    {/* Shimmer/Highlights Layer */}
                    <path
                        d={points.path}
                        fill="url(#shimmerGradient)"
                        clipPath="url(#funnelClip)"
                        opacity="0.7"
                    />

                    {/* Border Definition */}
                    <path
                        d={points.path}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        strokeOpacity="0.6"
                    />
                </g>

                {/* Labels/Values at Points */}
                <g className="font-sans">
                    {/* Point 1: Leads */}
                    <g transform={`translate(20, ${centerY})`}>
                        <text
                            fill="white"
                            fontSize="18"
                            fontWeight="bold"
                            opacity="0.95"
                            style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.8)' }}
                        >
                            {data.leads}
                        </text>
                        <text fill="white" fontSize="10" y="20" opacity="0.7">Leads</text>
                    </g>

                    {/* Point 2: Documents */}
                    <g transform={`translate(${width * 0.5}, ${centerY})`}>
                        <text
                            fill="white"
                            fontSize="16"
                            fontWeight="bold"
                            textAnchor="middle"
                            opacity="0.95"
                            style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.8)' }}
                        >
                            {data.docs}
                        </text>
                        <text fill="white" fontSize="10" y="18" textAnchor="middle" opacity="0.7">Documentos</text>
                    </g>

                    {/* Point 3: Sales */}
                    <g transform={`translate(${width - 20}, ${centerY})`}>
                        <text
                            fill="white"
                            fontSize="14"
                            fontWeight="bold"
                            textAnchor="end"
                            opacity="0.95"
                            style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.8)' }}
                        >
                            {data.sales}
                        </text>
                        <text fill="white" fontSize="9" y="16" textAnchor="end" opacity="0.7">Vendas</text>
                    </g>
                </g>

                {/* Highlight points with glow */}
                <g filter="url(#softGlow)">
                    <circle cx="0" cy={centerY} r="5" fill="#60A5FA" opacity="0.9" />
                    <circle cx={width * 0.5} cy={centerY} r="4" fill="#60A5FA" opacity="0.9" />
                    <circle cx={width} cy={centerY} r="3" fill="#60A5FA" opacity="0.9" />
                </g>
            </svg>
        </div>
    );
};
