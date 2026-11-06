import React, { useState, useId } from 'react';
import { SKILL_CATEGORIES } from '../data/initialData';
import { SkillCategory, SkillLevel, SKILL_LEVEL_LABELS } from '../types/skills';

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
      fill: 'fill-cyan-500/25 dark:fill-cyan-400/20',
      stroke: 'stroke-cyan-600 dark:stroke-cyan-400',
      point: 'fill-cyan-600 dark:fill-cyan-400 stroke-white dark:stroke-slate-900',
      glow: '#06b6d4',
    },
    emerald: {
      fill: 'fill-emerald-500/25 dark:fill-emerald-400/20',
      stroke: 'stroke-emerald-600 dark:stroke-emerald-400',
      point: 'fill-emerald-600 dark:fill-emerald-400 stroke-white dark:stroke-slate-900',
      glow: '#10b981',
    },
    indigo: {
      fill: 'fill-indigo-500/25 dark:fill-indigo-400/20',
      stroke: 'stroke-indigo-600 dark:stroke-indigo-400',
      point: 'fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900',
      glow: '#6366f1',
    },
    amber: {
      fill: 'fill-amber-500/25 dark:fill-amber-400/20',
      stroke: 'stroke-amber-600 dark:stroke-amber-400',
      point: 'fill-amber-600 dark:fill-amber-400 stroke-white dark:stroke-slate-900',
      glow: '#f59e0b',
    },
  }[accentColor];

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="relative flex flex-col items-center select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm ${colorMap.stroke.replace('stroke-', 'bg-')}`}></span>
            <span className="text-slate-700 dark:text-slate-300">{actualName}</span>
          </div>
          {showBenchmark && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500"></span>
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
            <filter id={`radar-glow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={colorMap.glow} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid concentric rings */}
          {gridPolygons.map(({ level, points }) => (
            <g key={`grid-${level}`}>
              <polygon
                points={points}
                fill={level % 2 === 0 ? 'currentColor' : 'none'}
                className={level % 2 === 0 ? 'text-slate-100/60 dark:text-slate-800/40' : ''}
                stroke="rgba(148, 163, 184, 0.35)"
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
          {data.map((_, i) => {
            const { x, y } = getCoordinates(maxScore, i);
            return (
              <line
                key={`spoke-${i}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="1"
              />
            );
          })}

          {/* Benchmark Target Polygon */}
          {showBenchmark && (
            <polygon
              points={targetPolygonString}
              fill="rgba(245, 158, 11, 0.05)"
              stroke="#f59e0b"
              strokeWidth="1.8"
              strokeDasharray="4 4"
              className="transition-all duration-300"
            />
          )}

          {/* Actual Competency Polygon */}
          <polygon
            points={actualPolygonString}
            className={`${colorMap.fill} ${colorMap.stroke} transition-all duration-300`}
            strokeWidth="2.2"
            filter={`url(#radar-glow-${chartId})`}
          />

          {/* Actual Data Points (interactive vertices) */}
          {actualPoints.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            const item = data[i];
            const hasGap = item.actual < item.target;

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
                {/* Visual Vertex point */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  className={`${colorMap.point} transition-all duration-150 ${
                    hasGap ? 'ring-2 ring-amber-500/50' : ''
                  }`}
                  strokeWidth="2"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* Axis Labels around circumference */}
          {data.map((d, i) => {
            const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
            const labelDist = radius + 22;
            const lx = center + labelDist * Math.cos(angle);
            const ly = center + labelDist * Math.sin(angle);

            // Anchor determination based on quadrant
            let anchor: 'start' | 'middle' | 'end' = 'middle';
            if (Math.cos(angle) > 0.3) anchor = 'start';
            else if (Math.cos(angle) < -0.3) anchor = 'end';

            const isHovered = hoveredIndex === i;

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
                  className={`text-[11px] font-medium transition-colors ${
                    isHovered
                      ? 'fill-cyan-600 dark:fill-cyan-400 font-bold'
                      : 'fill-slate-600 dark:fill-slate-300'
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
          <div className="absolute top-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-lg text-xs pointer-events-none z-20 min-w-[170px] animate-fadeIn">
            <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1 border-b border-slate-100 dark:border-slate-800 pb-1">
              {activePoint.axis}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Skor Aktual:</span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                  {activePoint.actual.toFixed(1)} / 5.0
                </span>
              </div>
              {showBenchmark && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Target Role:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                    {activePoint.target.toFixed(1)} / 5.0
                  </span>
                </div>
              )}
              {showBenchmark && (
                <div className="flex justify-between items-center pt-0.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-500">Status Gap:</span>
                  {activePoint.actual >= activePoint.target ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Memenuhi (+{(activePoint.actual - activePoint.target).toFixed(1)})
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-medium">
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
      <div className="w-full mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span>L1: Dasar</span>
        <span>·</span>
        <span>L2: Berkembang</span>
        <span>·</span>
        <span>L3: Mandiri</span>
        <span>·</span>
        <span>L4: Mahir</span>
        <span>·</span>
        <span>L5: Ahli / Mentor</span>
      </div>
    </div>
  );
};
