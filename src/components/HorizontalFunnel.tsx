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

    // Path coordinates (viewBox 800 300)
    // Top curve: Starts top-left, curves through middle, ends top-right
    // Bottom curve: Starts bottom-left, curves through middle, ends bottom-right

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

        // Construct path: Move to p1-top, Bezier to p2-top, Bezier to p3-top,
        // Line to p3-bottom, Bezier to p2-bottom, Bezier to p1-bottom, close.
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
            {/* Main Funnel SVG */}
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {/* Main Blue Gradient */}
                    <linearGradient id="funnelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                        <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.1" />
                    </linearGradient>

                    {/* Flow Animation Gradient */}
                    <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0">
                            <animate attributeName="offset" values="-1; 1" dur="7s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="0.5" stopColor="#0061ff" stopOpacity="0.6">
                            <animate attributeName="offset" values="-0.5; 1.5" dur="7s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="1" stopColor="#3B82F6" stopOpacity="0">
                            <animate attributeName="offset" values="0; 2" dur="7s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>

                    {/* Shimmer Effect */}
                    <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="white" stopOpacity="0" />
                        <stop offset="50%" stopColor="white" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                        <animateTransform
                            attributeName="gradientTransform"
                            type="translate"
                            from="-1 0"
                            to="1 0"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </linearGradient>

                    {/* Glow Filter */}
                    <filter id="glassGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>

                    {/* Clip Path to keep effects inside funnel */}
                    <clipPath id="funnelClip">
                        <path d={points.path} />
                    </clipPath>
                </defs>

                {/* Backdrop Blur Layer (using a group with filter if supported, or CSS) */}
                {/* Optimized Layer Group */}
                <g>
                    {/* Glow Layer (Performant Opacity Pulse) */}
                    <path
                        d={points.path}
                        fill="transparent"
                        stroke="#3B82F6"
                        strokeWidth="15"
                        strokeOpacity="0.4"
                        style={{ filter: 'blur(8px)' }}
                    />

                    {/* Main Glass Body */}
                    <path
                        d={points.path}
                        fill="url(#funnelGradient)"
                        className="backdrop-blur-sm"
                    />

                    {/* Flowing Data/Energy Layer */}
                    <path
                        d={points.path}
                        fill="url(#flowGradient)"
                        clipPath="url(#funnelClip)"
                    />

                    {/* Shimmer/Highlights Layer */}
                    <path
                        d={points.path}
                        fill="url(#shimmerGradient)"
                        clipPath="url(#funnelClip)"
                    />
                </g>

                {/* Labels/Values at Points */}
                <g className="font-sans">
                    {/* Point 1: Leads */}
                    <g transform={`translate(20, ${centerY})`}>
                        <text fill="white" fontSize="18" fontWeight="bold" opacity="0.9">{data.leads}</text>
                        <text fill="white" fontSize="10" y="20" opacity="0.6">Leads</text>
                    </g>

                    {/* Point 2: Documents */}
                    <g transform={`translate(${width * 0.5}, ${centerY})`}>
                        <text fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" opacity="0.9">{data.docs}</text>
                        <text fill="white" fontSize="10" y="18" textAnchor="middle" opacity="0.6">Documentos</text>
                    </g>

                    {/* Point 3: Sales */}
                    <g transform={`translate(${width - 20}, ${centerY})`}>
                        <text fill="white" fontSize="14" fontWeight="bold" textAnchor="end" opacity="0.9">{data.sales}</text>
                        <text fill="white" fontSize="9" y="16" textAnchor="end" opacity="0.6">Vendas</text>
                    </g>
                </g>

                {/* Highlight points */}
                {/* Highlight points */}
                <circle cx="0" cy={centerY} r="4" fill="#60A5FA" opacity="0.8" />
                <circle cx={width * 0.5} cy={centerY} r="3" fill="#60A5FA" opacity="0.8" />
                <circle cx={width} cy={centerY} r="2" fill="#60A5FA" opacity="0.8" />
            </svg>

            {/* CSS-based animations for extra liquid feel if needed */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-flow {
          animation: flow 3s linear infinite;
        }
      `}} />
        </div>
    );
};
