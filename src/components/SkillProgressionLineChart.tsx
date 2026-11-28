import React, { useMemo, useState, useId } from 'react';
import { AuditRecord, Engineer, SkillCategory, SkillDefinition } from '../types/skills';
import { INITIAL_BENCHMARK_TARGETS, SKILL_CATEGORIES } from '../data/initialData';
import { DOMAIN_COLOR_MAP } from '../utils/domainColors';
import { Activity, ArrowDownRight, ArrowUpRight, Clock, History } from 'lucide-react';

interface SkillProgressionLineChartProps {
  engineer: Engineer;
  skills: SkillDefinition[];
  auditLogs: AuditRecord[];
}

interface TimelinePoint {
  id: string;
  label: string;
  shortDate: string;
  timestamp: string;
  value: number;
  isBaseline?: boolean;
  skillId?: string;
  skillName?: string;
  category?: SkillCategory;
  previousLevel?: number;
  newLevel?: number;
  delta?: number;
  updatedBy?: string;
  reason?: string;
}

function formatShortTimestamp(ts: string): string {
  if (!ts) return '-';
  // Expected formats: '2026-11-02 14:30' or ISO string
  const datePart = ts.slice(0, 10);
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const mIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
    return `${parts[2]} ${months[mIdx]}`;
  }
  return datePart;
}

export const SkillProgressionLineChart: React.FC<SkillProgressionLineChartProps> = ({
  engineer,
  skills,
  auditLogs,
}) => {
  const [selectedScope, setSelectedScope] = useState<'overall' | SkillCategory>('overall');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const chartId = useId();

  const skillMap = useMemo(() => {
    const map = new Map<string, SkillDefinition>();
    skills.forEach((s) => map.set(s.id, s));
    return map;
  }, [skills]);

  const benchmark =
    INITIAL_BENCHMARK_TARGETS[engineer.targetBenchmark] ||
    INITIAL_BENCHMARK_TARGETS.senior_mechanical;

  // Target line score for selected scope
  const targetScore = useMemo(() => {
    const scopedSkills =
      selectedScope === 'overall'
        ? skills
        : skills.filter((s) => s.category === selectedScope);
    if (scopedSkills.length === 0) return 3;
    const sum = scopedSkills.reduce((acc, s) => acc + (benchmark[s.id] ?? 3), 0);
    return Number((sum / scopedSkills.length).toFixed(2));
  }, [skills, benchmark, selectedScope]);

  // Filter audit logs relevant to this engineer's tracked technical skills
  const engineerSkillLogs = useMemo(() => {
    return auditLogs
      .filter((log) => log.engineerId === engineer.id && skillMap.has(log.skillId))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [auditLogs, engineer.id, skillMap]);

  // Categories that have at least 1 audit log or skill
  const availableCategories = useMemo(() => {
    const loggedCats = new Set<SkillCategory>();
    engineerSkillLogs.forEach((log) => {
      const def = skillMap.get(log.skillId);
      if (def) loggedCats.add(def.category);
    });
    return SKILL_CATEGORIES.map((cat) => ({
      ...cat,
      hasLogs: loggedCats.has(cat.id),
    }));
  }, [engineerSkillLogs, skillMap]);

  // Reconstruct chronological skill snapshot timeline from current skills + auditLogs
  const timelinePoints = useMemo<TimelinePoint[]>(() => {
    const scopedSkills =
      selectedScope === 'overall'
        ? skills
        : skills.filter((s) => s.category === selectedScope);

    const calcScopedAvg = (snapshot: Record<string, number>) => {
      if (scopedSkills.length === 0) return 0;
      const total = scopedSkills.reduce((sum, s) => sum + (snapshot[s.id] ?? 0), 0);
      return Number((total / scopedSkills.length).toFixed(2));
    };

    const relevantLogs =
      selectedScope === 'overall'
        ? engineerSkillLogs
        : engineerSkillLogs.filter((log) => skillMap.get(log.skillId)?.category === selectedScope);

    // Rewind backwards from current state to derive the initial baseline before first audit log
    const baselineSnapshot: Record<string, number> = { ...engineer.skills };
    for (let i = relevantLogs.length - 1; i >= 0; i--) {
      const log = relevantLogs[i];
      baselineSnapshot[log.skillId] = log.previousLevel;
    }

    if (relevantLogs.length === 0) {
      return [
        {
          id: 'current-only',
          label: 'Saat Ini',
          shortDate: 'Saat Ini',
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
          value: calcScopedAvg(engineer.skills),
          isBaseline: true,
        },
      ];
    }

    const points: TimelinePoint[] = [
      {
        id: 'baseline',
        label: 'Baseline Awal',
        shortDate: 'Awal',
        timestamp: 'Sebelum log pertama',
        value: calcScopedAvg(baselineSnapshot),
        isBaseline: true,
      },
    ];

    const forwardSnapshot: Record<string, number> = { ...baselineSnapshot };
    relevantLogs.forEach((log, idx) => {
      forwardSnapshot[log.skillId] = log.newLevel;
      const def = skillMap.get(log.skillId);
      points.push({
        id: log.id || `evt-${idx}`,
        label: def?.nameId || log.skillName,
        shortDate: formatShortTimestamp(log.timestamp),
        timestamp: log.timestamp,
        value: calcScopedAvg(forwardSnapshot),
        skillId: log.skillId,
        skillName: log.skillName,
        category: def?.category,
        previousLevel: log.previousLevel,
        newLevel: log.newLevel,
        delta: log.newLevel - log.previousLevel,
        updatedBy: log.updatedBy,
        reason: log.reason,
      });
    });

    return points;
  }, [engineer.skills, engineerSkillLogs, selectedScope, skills, skillMap]);

  const hasHistory = timelinePoints.length > 1;
  const startValue = timelinePoints[0]?.value ?? 0;
  const latestValue = timelinePoints[timelinePoints.length - 1]?.value ?? 0;
  const netChange = Number((latestValue - startValue).toFixed(2));

  const activeCategoryTheme =
    selectedScope === 'overall' ? null : DOMAIN_COLOR_MAP[selectedScope];

  const strokePrimary = activeCategoryTheme?.hex || '#06b6d4';
  const strokeSecondary = activeCategoryTheme ? activeCategoryTheme.hex : '#6366f1';

  // SVG Geometry
  const width = 760;
  const height = 240;
  const padLeft = 44;
  const padRight = 56;
  const padTop = 22;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (index: number, count: number) => {
    if (count <= 1) return padLeft + plotW / 2;
    return padLeft + (index / (count - 1)) * plotW;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(5, val));
    return padTop + plotH - (clamped / 5) * plotH;
  };

  const coords = timelinePoints.map((pt, idx) => ({
    x: getX(idx, timelinePoints.length),
    y: getY(pt.value),
    pt,
  }));

  const linePath = coords
    .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    coords.length > 1
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  const targetY = getY(targetScore);
  const activePoint = hoveredIdx !== null ? coords[hoveredIdx] : null;
  const lineGradId = `prog-line-${chartId}`;
  const areaGradId = `prog-area-${chartId}`;

  return (
    <div className="pt-5 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <History className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Riwayat Audit Kompetensi</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{engineerSkillLogs.length} catatan perubahan</span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Progresi Historis Kompetensi — {engineer.name}
          </h4>
        </div>

        {/* Interactive Scope Selector & Net Delta Readout */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
            <span className="text-slate-500 dark:text-slate-400">
              Skor Kini:{' '}
              <strong className="text-slate-900 dark:text-slate-100">{latestValue.toFixed(2)}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">|</span>
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                netChange > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : netChange < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {netChange > 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
              {netChange < 0 && <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>
                {netChange > 0 ? `+${netChange.toFixed(2)}` : netChange.toFixed(2)} tren
              </span>
            </span>
          </div>

          <select
            aria-label="Filter Domain Progresi"
            value={selectedScope}
            onChange={(e) => {
              setSelectedScope(e.target.value as 'overall' | SkillCategory);
              setHoveredIdx(null);
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          >
            <option value="overall">Semua Domain (Rata-rata)</option>
            {availableCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.shortName} {cat.hasLogs ? '• Ada Riwayat' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Area or Clean Empty State */}
      {!hasHistory ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>Belum Ada Riwayat Perubahan Nilai pada Scope Ini</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Setiap pembaruan skor kompetensi oleh Manajer atau persetujuan penilaian mandiri pada Matriks Kompetensi akan tercatat otomatis di log audit dan membentuk grafik tren progresi di sini.
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right font-mono tabular-nums">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Baseline Saat Ini vs Target</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {latestValue.toFixed(2)}{' '}
              <span className="text-slate-400 font-normal">/</span>{' '}
              <span className="text-amber-600 dark:text-amber-400">{targetScore.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3 sm:p-4">
          {/* Legend row */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] mb-2 px-1">
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                <span
                  className="w-3 h-0.5 rounded-full"
                  style={{ backgroundColor: strokePrimary }}
                />
                <span>
                  {selectedScope === 'overall'
                    ? 'Rata-rata Kompetensi (0–5)'
                    : SKILL_CATEGORIES.find((c) => c.id === selectedScope)?.shortName}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-0 border-t-2 border-dashed border-amber-500" />
                <span>Target Benchmark ({targetScore.toFixed(2)})</span>
              </span>
            </div>
            <span className="text-slate-400 dark:text-slate-500 font-mono tabular-nums">
              {timelinePoints.length - 1} perubahan tercatat
            </span>
          </div>

          <div className="relative w-full">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto overflow-visible select-none"
              role="img"
              aria-label={`Grafik progresi historis kompetensi ${engineer.name}`}
            >
              <defs>
                <linearGradient id={lineGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={strokePrimary} />
                  <stop offset="55%" stopColor={strokeSecondary} />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
                <linearGradient id={areaGradId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={strokePrimary} stopOpacity="0.24" />
                  <stop offset="100%" stopColor={strokeSecondary} stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines (L0 to L5) */}
              {[0, 1, 2, 3, 4, 5].map((lvl) => {
                const y = getY(lvl);
                return (
                  <g key={`y-${lvl}`}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + plotW}
                      y2={y}
                      stroke="rgba(148, 163, 184, 0.24)"
                      strokeDasharray={lvl === 0 ? undefined : '3 3'}
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className="text-[10px] font-mono tabular-nums fill-slate-400 dark:fill-slate-500"
                    >
                      L{lvl}
                    </text>
                  </g>
                );
              })}

              {/* Target Benchmark Horizontal Reference Line */}
              <line
                x1={padLeft}
                y1={targetY}
                x2={padLeft + plotW}
                y2={targetY}
                stroke="#f59e0b"
                strokeWidth="1.75"
                strokeDasharray="6 4"
              />
              <text
                x={padLeft + plotW + 6}
                y={targetY + 3.5}
                textAnchor="start"
                className="text-[10px] font-mono font-semibold tabular-nums fill-amber-600 dark:fill-amber-400"
              >
                {targetScore.toFixed(1)}
              </text>

              {/* Vertical hover guide */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1={padTop}
                  x2={activePoint.x}
                  y2={padTop + plotH}
                  stroke={strokePrimary}
                  strokeOpacity="0.35"
                  strokeDasharray="3 3"
                  strokeWidth="1.2"
                />
              )}

              {/* Area fill under line */}
              {areaPath && <path d={areaPath} fill={`url(#${areaGradId})`} />}

              {/* Progression Line */}
              <path
                d={linePath}
                fill="none"
                stroke={selectedScope === 'overall' ? `url(#${lineGradId})` : strokePrimary}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points + X-Axis Labels */}
              {coords.map(({ x, y, pt }, idx) => {
                const isHovered = hoveredIdx === idx;
                const isPositive = (pt.delta ?? 0) > 0;
                const isNegative = (pt.delta ?? 0) < 0;
                const dotColor = pt.isBaseline
                  ? '#64748b'
                  : isPositive
                  ? '#10b981'
                  : isNegative
                  ? '#f43f5e'
                  : strokePrimary;

                // Show X labels cleanly without overlapping when many points exist
                const step = coords.length > 8 ? Math.ceil(coords.length / 6) : 1;
                const showXLabel = idx === 0 || idx === coords.length - 1 || idx % step === 0;

                return (
                  <g key={pt.id}>
                    {showXLabel && (
                      <text
                        x={x}
                        y={padTop + plotH + 18}
                        textAnchor={
                          idx === 0
                            ? 'start'
                            : idx === coords.length - 1
                            ? 'end'
                            : 'middle'
                        }
                        className="text-[10px] font-mono tabular-nums fill-slate-500 dark:fill-slate-400"
                      >
                        {pt.shortDate}
                      </text>
                    )}

                    {/* Hover halo */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 9 : 6.5}
                      fill={dotColor}
                      fillOpacity={isHovered ? 0.25 : 0.14}
                      className="pointer-events-none transition-all duration-150"
                    />

                    {/* Point marker */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 5.5 : 4}
                      fill={dotColor}
                      strokeWidth="2"
                      className="stroke-white dark:stroke-slate-900 pointer-events-none transition-all duration-150"
                    />

                    {/* Numeric label above point */}
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      className="text-[10px] font-mono font-bold tabular-nums fill-slate-700 dark:fill-slate-200 pointer-events-none"
                    >
                      {pt.value.toFixed(2)}
                    </text>

                    {/* Invisible large hit area */}
                    <circle
                      cx={x}
                      cy={y}
                      r="16"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {activePoint && (
              <div className="mt-2 sm:mt-0 sm:absolute sm:top-2 sm:right-2 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-xs max-w-xs pointer-events-none">
                <div className="flex items-center justify-between gap-3 pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {activePoint.pt.isBaseline ? 'Baseline Awal' : activePoint.pt.label}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 tabular-nums shrink-0">
                    {activePoint.pt.timestamp}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Skor Grafik:</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                      {activePoint.pt.value.toFixed(2)} / 5.00
                    </span>
                  </div>
                  {!activePoint.pt.isBaseline && activePoint.pt.previousLevel !== undefined && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Perubahan Skill:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        L{activePoint.pt.previousLevel} → L{activePoint.pt.newLevel}
                      </span>
                    </div>
                  )}
                  {activePoint.pt.updatedBy && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 truncate">
                      Oleh: <span className="text-slate-700 dark:text-slate-200">{activePoint.pt.updatedBy}</span>
                    </div>
                  )}
                  {activePoint.pt.reason && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                      "{activePoint.pt.reason}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recent Chronological Events Strip */}
          <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Jejak Perubahan Terbaru</span>
            </div>
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800/80">
              {timelinePoints
                .filter((p) => !p.isBaseline)
                .slice(-3)
                .reverse()
                .map((evt) => {
                  const delta = evt.delta ?? 0;
                  return (
                    <div
                      key={evt.id}
                      className="py-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                          {evt.timestamp}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="font-semibold truncate text-slate-800 dark:text-slate-200">
                          {evt.label}
                        </span>
                        {evt.reason && (
                          <>
                            <span aria-hidden="true" className="hidden md:inline text-slate-300 dark:text-slate-700">·</span>
                            <span className="hidden md:inline text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {evt.reason}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] shrink-0">
                        <span className="text-slate-500">
                          L{evt.previousLevel} → <strong className="text-slate-900 dark:text-slate-100">L{evt.newLevel}</strong>
                        </span>
                        <span
                          className={`font-bold ${
                            delta > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : delta < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-500'
                          }`}
                        >
                          ({delta > 0 ? `+${delta}` : delta})
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
