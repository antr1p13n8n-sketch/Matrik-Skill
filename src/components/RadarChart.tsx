import React, { useState, useId } from 'react';
import { SKILL_CATEGORIES } from '../data/initialData';
import { SkillCategory, SkillLevel, SKILL_LEVEL_LABELS } from '../types/skills';
import { DOMAIN_COLOR_MAP } from '../utils/domainColors';

export interface RadarDataPoint {
  axis: string;
  categoryKey?: SkillCategory;
  actual: number;
  target: number;
  benchmarkLabel?: string;
  subSkillsCount?: number;
}

interface RadarChartProps {
  title: string;
  subtitle?: string;
  data: RadarDataPoint[];
  size?: number;
  showBenchmark?: boolean;
  benchmarkName?: string;
  actualName?: string;
  accentColor?: 'cyan' | 'emerald' | 'indigo' | 'amber';
  onAxisClick?: (point: RadarDataPoint) => void;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  title,
  subtitle,
  data,
  size = 460,
  showBenchmark = true,
  benchmarkName = 'Target Benchmark',
  actualName = 'Skor Aktual',
  accentColor = 'cyan',
  onAxisClick,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartId = useId();

  const numAxes = data.length;
  if (numAxes < 3) {
    return <div className="p-4 text-center text-xs text-slate-500">Minimal 3 data points untuk radar chart</div>;
  }

  const center = size / 2;
  const radius = (size / 2) - 64; // generous margin for labels
  const maxScore = 5;

  // Polar to Cartesian conversion
  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 / numAxes) * index - Math.PI / 2;
    const r = (Math.max(0, Math.min(value, maxScore)) / maxScore) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Generate grid concentric polygons (Levels 1 to 5)
  const levels = [1, 2, 3, 4, 5];
  const gridPolygons = levels.map((lvl) => {
    const points = Array.from({ length: numAxes }, (_, i) => {
      const { x, y } = getCoordinates(lvl, i);
      return `${x},${y}`;
    }).join(' ');
    return { level: lvl, points };
  });

  // Target points & polygon
  const targetPoints = data.map((d, i) => getCoordinates(d.target, i));
  const targetPolygonString = targetPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Actual points & polygon
  const actualPoints = data.map((d, i) => getCoordinates(d.actual, i));
  const actualPolygonString = actualPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Color mappings
  const colorMap = {
    cyan: {
      stroke: '#06b6d4',
      stop1: '#06b6d4',
      stop2: '#6366f1',
      stop3: '#d946ef',
      legendBg: 'bg-linear-to-r from-cyan-500 via-indigo-500 to-fuchsia-500',
      glow: '#6366f1',
    },
    emerald: {
      stroke: '#10b981',
      stop1: '#10b981',
      stop2: '#06b6d4',
      stop3: '#3b82f6',
      legendBg: 'bg-linear-to-r from-emerald-500 to-cyan-500',
      glow: '#10b981',
    },
    indigo: {
      stroke: '#6366f1',
      stop1: '#6366f1',
      stop2: '#8b5cf6',
      stop3: '#ec4899',
      legendBg: 'bg-linear-to-r from-indigo-500 to-pink-500',
      glow: '#6366f1',
    },
    amber: {
      stroke: '#f59e0b',
      stop1: '#f59e0b',
      stop2: '#f97316',
      stop3: '#ec4899',
      legendBg: 'bg-linear-to-r from-amber-500 to-rose-500',
      glow: '#f59e0b',
    },
  }[accentColor];

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : null;
  const gradFillId = `radar-prism-fill-${chartId}`;
  const gradStrokeId = `radar-prism-stroke-${chartId}`;

  return (
    <div className="relative flex flex-col items-center select-none w-full">
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className={`w-3.5 h-3 rounded-sm ${colorMap.legendBg}`}></span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{actualName}</span>
          </div>
          {showBenchmark && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-amber-500"></span>
              <span className="text-slate-500 dark:text-slate-400">{benchmarkName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative w-full flex justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-w-[460px] h-auto overflow-visible"
          aria-label={title}
        >
          <defs>
            <linearGradient id={gradFillId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorMap.stop1} stopOpacity="0.34" />
              <stop offset="50%" stopColor={colorMap.stop2} stopOpacity="0.28" />
              <stop offset="100%" stopColor={colorMap.stop3} stopOpacity="0.32" />
            </linearGradient>
            <linearGradient id={gradStrokeId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorMap.stop1} />
              <stop offset="50%" stopColor={colorMap.stop2} />
              <stop offset="100%" stopColor={colorMap.stop3} />
            </linearGradient>
            <filter id={`radar-glow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={colorMap.glow} floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Grid concentric rings */}
          {gridPolygons.map(({ level, points }) => (
            <g key={`grid-${level}`}>
              <polygon
                points={points}
                fill={level % 2 === 0 ? 'currentColor' : 'none'}
                className={level % 2 === 0 ? 'text-cyan-50/60 dark:text-slate-800/45' : ''}
                stroke="rgba(148, 163, 184, 0.32)"
                strokeWidth="1"
              />
              {/* Level indicator tick on the vertical upper axis */}
              <text
                x={center}
                y={center - (level / maxScore) * radius + 11}
                textAnchor="middle"
                className="text-[10px] font-mono tabular-nums fill-slate-400 dark:fill-slate-500 pointer-events-none"
              >
                L{level}
              </text>
            </g>
          ))}

          {/* Radial Axis Spokes */}
          {data.map((d, i) => {
            const { x, y } = getCoordinates(maxScore, i);
            const domainHex = d.categoryKey ? DOMAIN_COLOR_MAP[d.categoryKey]?.hex : undefined;
            return (
              <line
                key={`spoke-${i}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke={domainHex || 'rgba(148, 163, 184, 0.25)'}
                strokeOpacity="0.28"
                strokeWidth="1.2"
              />
            );
          })}

          {/* Benchmark Target Polygon */}
          {showBenchmark && (
            <polygon
              points={targetPolygonString}
              fill="rgba(245, 158, 11, 0.08)"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="5 4"
              className="transition-all duration-300"
            />
          )}

          {/* Actual Competency Polygon */}
          <polygon
            points={actualPolygonString}
            fill={`url(#${gradFillId})`}
            stroke={`url(#${gradStrokeId})`}
            strokeWidth="2.5"
            strokeLinejoin="round"
            filter={`url(#radar-glow-${chartId})`}
            className="transition-all duration-300"
          />

          {/* Actual Data Points (interactive vertices) + Numeric Values Inside Chart */}
          {actualPoints.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            const item = data[i];
            const hasGap = item.actual < item.target;
            const domainHex = (item.categoryKey && DOMAIN_COLOR_MAP[item.categoryKey]?.hex) || '#06b6d4';
            const labelOffset = item.actual >= 4.3 ? -14 : 14;
            const nx = pt.x + labelOffset * Math.cos(pt.angle);
            const ny = pt.y + labelOffset * Math.sin(pt.angle);

            return (
              <g key={`point-${i}`} className="cursor-pointer" onClick={() => onAxisClick?.(item)}>
                {/* Invisible large hit area */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="14"
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {/* Outer color halo */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 9 : 7}
                  fill={domainHex}
                  fillOpacity="0.22"
                  className="pointer-events-none transition-all duration-150"
                />
                {/* Visual Vertex point */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4.5}
                  fill={domainHex}
                  className="stroke-white dark:stroke-slate-900 transition-all duration-150"
                  strokeWidth="2"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {/* Numeric score badge rendered directly inside the chart */}
                <g className="pointer-events-none">
                  <rect
                    x={nx - 14}
                    y={ny - 8}
                    width="28"
                    height="16"
                    rx="5"
                    className={
                      hasGap
                        ? 'fill-amber-50/95 dark:fill-slate-900/95 stroke-amber-400/80'
                        : 'fill-white/95 dark:fill-slate-900/95'
                    }
                    stroke={hasGap ? undefined : domainHex}
                    strokeOpacity={hasGap ? undefined : 0.7}
                    strokeWidth="1.1"
                  />
                  <text
                    x={nx}
                    y={ny + 3.5}
                    textAnchor="middle"
                    className={`text-[9.5px] font-mono font-bold tabular-nums ${
                      hasGap
                        ? 'fill-amber-700 dark:fill-amber-300'
                        : 'fill-slate-800 dark:fill-slate-100'
                    }`}
                  >
                    {item.actual.toFixed(1)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Axis Labels around circumference */}
          {data.map((d, i) => {
            const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
            const labelDist = radius + 24;
            const lx = center + labelDist * Math.cos(angle);
            const ly = center + labelDist * Math.sin(angle);

            let anchor: 'start' | 'middle' | 'end' = 'middle';
            if (Math.cos(angle) > 0.3) anchor = 'start';
            else if (Math.cos(angle) < -0.3) anchor = 'end';

            const isHovered = hoveredIndex === i;
            const domainHex = d.categoryKey ? DOMAIN_COLOR_MAP[d.categoryKey]?.hex : '#06b6d4';

            return (
              <g
                key={`label-${i}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onAxisClick?.(d)}
              >
                <text
                  x={lx}
                  y={ly + 4}
                  textAnchor={anchor}
                  fill={isHovered ? domainHex : undefined}
                  className={`text-[11px] font-semibold transition-colors ${
                    isHovered
                      ? 'font-bold'
                      : 'fill-slate-700 dark:fill-slate-200'
                  }`}
                >
                  {d.axis}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {activePoint && (
          <div className="absolute top-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-indigo-200/80 dark:border-indigo-800/70 rounded-xl p-3 shadow-xl text-xs pointer-events-none z-20 min-w-[180px]">
            <div className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center gap-1.5">
              {activePoint.categoryKey && (
                <span className={`w-2 h-2 rounded-full ${DOMAIN_COLOR_MAP[activePoint.categoryKey]?.dot}`} />
              )}
              <span>{activePoint.axis}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Skor Aktual:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {activePoint.actual.toFixed(1)} / 5.0
                </span>
              </div>
              {showBenchmark && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Target Role:</span>
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                    {activePoint.target.toFixed(1)} / 5.0
                  </span>
                </div>
              )}
              {showBenchmark && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-500">Status Gap:</span>
                  {activePoint.actual >= activePoint.target ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Memenuhi (+{(activePoint.actual - activePoint.target).toFixed(1)})
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      Defisit ({(activePoint.actual - activePoint.target).toFixed(1)})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend / Level Guide below radar */}
      <div className="w-full mt-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px]">
        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-medium">L1: Dasar</span>
        <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 font-medium">L2: Berkembang</span>
        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-medium">L3: Mandiri</span>
        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-medium">L4: Mahir</span>
        <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-medium">L5: Ahli/Mentor</span>
      </div>
    </div>
  );
};
