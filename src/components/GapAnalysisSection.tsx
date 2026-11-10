import React, { useState, useMemo } from 'react';
import {
  Engineer,
  SkillDefinition,
  SkillCategory,
} from '../types/skills';
import {
  SKILL_CATEGORIES,
  INITIAL_BENCHMARK_TARGETS,
} from '../data/initialData';
import {
  BarChart3,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Users,
  Filter,
  UserCheck,
  FileText,
  Target,
  Award,
} from 'lucide-react';

interface GapAnalysisSectionProps {
  engineers: Engineer[];
  skills: SkillDefinition[];
  onOpenReport: (engineer: Engineer) => void;
}

export const GapAnalysisSection: React.FC<GapAnalysisSectionProps> = ({
  engineers,
  skills,
  onOpenReport,
}) => {
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const departments = useMemo(() => {
    const depts = new Set(engineers.map((e) => e.department));
    return Array.from(depts);
  }, [engineers]);

  const filteredEngineers = useMemo(() => {
    return engineers.filter((e) => {
      if (selectedEngineerId !== 'all' && e.id !== selectedEngineerId) return false;
      if (selectedDepartment !== 'all' && e.department !== selectedDepartment) return false;
      return true;
    });
  }, [engineers, selectedEngineerId, selectedDepartment]);

  const filteredSkills = useMemo(() => {
    if (selectedCategory === 'all') return skills;
    return skills.filter((s) => s.category === selectedCategory);
  }, [skills, selectedCategory]);

  // Compute Category-Level Gap Data (for the Bar Chart)
  const categoryGapStats = useMemo(() => {
    return SKILL_CATEGORIES.map((cat) => {
      const catSkills = skills.filter((s) => s.category === cat.id);
      if (catSkills.length === 0 || filteredEngineers.length === 0) {
        return {
          category: cat,
          avgActual: 0,
          avgTarget: 0,
          gap: 0,
        };
      }

      let sumActual = 0;
      let sumTarget = 0;
      let count = 0;

      filteredEngineers.forEach((eng) => {
        const benchmark =
          INITIAL_BENCHMARK_TARGETS[eng.targetBenchmark] ||
          INITIAL_BENCHMARK_TARGETS.senior_mechanical;
        catSkills.forEach((s) => {
          sumActual += eng.skills[s.id] ?? 0;
          sumTarget += benchmark[s.id] ?? 3;
          count++;
        });
      });

      const avgActual = Number((sumActual / count).toFixed(2));
      const avgTarget = Number((sumTarget / count).toFixed(2));
      const gap = Number((avgActual - avgTarget).toFixed(2));

      return {
        category: cat,
        avgActual,
        avgTarget,
        gap,
      };
    });
  }, [filteredEngineers, skills]);

  // Compute Skill-Level Gap Matrix
  const skillGapRows = useMemo(() => {
    return filteredSkills
      .map((skill) => {
        let sumActual = 0;
        let sumTarget = 0;
        const deficitEngineers: {
          engineer: Engineer;
          actual: number;
          target: number;
          deficit: number;
        }[] = [];

        filteredEngineers.forEach((eng) => {
          const benchmark =
            INITIAL_BENCHMARK_TARGETS[eng.targetBenchmark] ||
            INITIAL_BENCHMARK_TARGETS.senior_mechanical;
          const actual = eng.skills[skill.id] ?? 0;
          const target = benchmark[skill.id] ?? 3;
          sumActual += actual;
          sumTarget += target;
          if (actual < target) {
            deficitEngineers.push({
              engineer: eng,
              actual,
              target,
              deficit: target - actual,
            });
          }
        });

        const count = filteredEngineers.length || 1;
        const avgActual = Number((sumActual / count).toFixed(2));
        const avgTarget = Number((sumTarget / count).toFixed(2));
        const gap = Number((avgActual - avgTarget).toFixed(2));

        // Available internal mentors (Level >= 4 across all engineers)
        const mentors = engineers
          .filter((e) => (e.skills[skill.id] ?? 0) >= 4)
          .sort((a, b) => (b.skills[skill.id] ?? 0) - (a.skills[skill.id] ?? 0));

        const catInfo = SKILL_CATEGORIES.find((c) => c.id === skill.category);

        return {
          skill,
          categoryName: catInfo?.shortName || skill.category,
          avgActual,
          avgTarget,
          gap,
          deficitEngineers: deficitEngineers.sort((a, b) => b.deficit - a.deficit),
          mentors,
        };
      })
      .sort((a, b) => a.gap - b.gap); // Worst deficits first
  }, [filteredSkills, filteredEngineers, engineers]);

  // Overall KPIs
  const overallStats = useMemo(() => {
    let totalActual = 0;
    let totalTarget = 0;
    let totalPoints = 0;
    let metOrExceeded = 0;
    let criticalDeficits = 0;

    filteredEngineers.forEach((eng) => {
      const benchmark =
        INITIAL_BENCHMARK_TARGETS[eng.targetBenchmark] ||
        INITIAL_BENCHMARK_TARGETS.senior_mechanical;
      filteredSkills.forEach((s) => {
        const act = eng.skills[s.id] ?? 0;
        const tgt = benchmark[s.id] ?? 3;
        totalActual += act;
        totalTarget += tgt;
        totalPoints++;
        if (act >= tgt) metOrExceeded++;
        if (tgt - act >= 2) criticalDeficits++;
      });
    });

    const avgActual = totalPoints > 0 ? (totalActual / totalPoints).toFixed(2) : '0.00';
    const avgTarget = totalPoints > 0 ? (totalTarget / totalPoints).toFixed(2) : '0.00';
    const delta = totalPoints > 0 ? ((totalActual - totalTarget) / totalPoints).toFixed(2) : '0.00';
    const readinessPct = totalPoints > 0 ? Math.round((metOrExceeded / totalPoints) * 100) : 0;

    return {
      avgActual,
      avgTarget,
      delta: Number(delta),
      readinessPct,
      criticalDeficits,
      totalDeficitSkills: skillGapRows.filter((r) => r.gap < 0).length,
    };
  }, [filteredEngineers, filteredSkills, skillGapRows]);

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-600" />
            <span>Analisis Gap Kompetensi (Skill Gap Analysis)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identifikasi defisit kompetensi terhadap standar benchmark jabatan, pemetaan personil terdampak, dan rekomendasi mentor internal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedEngineerId}
            onChange={(e) => setSelectedEngineerId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Seluruh Divisi ({engineers.length} Insinyur)</option>
            {engineers.map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.name} — {eng.roleTitle}
              </option>
            ))}
          </select>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as SkillCategory | 'all')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Semua Domain (7 Kategori)</option>
            {SKILL_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Rata-rata Aktual vs Target</span>
            <Target className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
            {overallStats.avgActual}{' '}
            <span className="text-xs font-normal text-slate-400">/ {overallStats.avgTarget}</span>
          </div>
          <div
            className={`text-[11px] mt-1 font-medium ${
              overallStats.delta >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            Delta: {overallStats.delta >= 0 ? `+${overallStats.delta.toFixed(2)}` : overallStats.delta.toFixed(2)} Level
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Indeks Kesiapan Target</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1.5">
            {overallStats.readinessPct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Kompetensi memenuhi / melampaui standar</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Keahlian di Bawah Target</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums mt-1.5">
            {overallStats.totalDeficitSkills}{' '}
            <span className="text-xs font-normal text-slate-400">/ {filteredSkills.length}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Memerlukan program akselerasi</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Defisit Kritis (&ge; 2 Lvl)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums mt-1.5">
            {overallStats.criticalDeficits}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Prioritas mentoring segera</div>
        </div>
      </div>

      {/* Visual Gap Chart (With Numbers Displayed Inside the Chart Bars!) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Grafik Analisis Gap per Domain Teknik Mesin
            </h3>
            <p className="text-xs text-slate-500">
              Perbandingan Skor Aktual (batang berwarna dengan angka) vs Garis Target Benchmark (skala 0.0 – 5.0)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-cyan-600"></span>
              <span className="text-slate-600 dark:text-slate-300">Memenuhi Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-500"></span>
              <span className="text-slate-600 dark:text-slate-300">Defisit / Gap</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-0.5 h-4 bg-rose-600"></span>
              <span className="text-slate-600 dark:text-slate-300">Garis Target</span>
            </div>
          </div>
        </div>

        <div className="space-y-3.5 pt-1">
          {categoryGapStats.map(({ category, avgActual, avgTarget, gap }) => {
            const actualPct = Math.min(100, Math.max(0, (avgActual / 5) * 100));
            const targetPct = Math.min(100, Math.max(0, (avgTarget / 5) * 100));
            const isDeficit = gap < 0;

            return (
              <div key={category.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {category.nameId}
                  </span>
                  <div className="flex items-center gap-2 font-mono tabular-nums text-[11px]">
                    <span className="text-slate-500">Target: {avgTarget.toFixed(2)}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        isDeficit
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {gap >= 0 ? `+${gap.toFixed(2)}` : gap.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Bar Container with numbers rendered INSIDE the bar */}
                <div className="relative h-7 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200/70 dark:border-slate-700/70">
                  {/* Filled Actual Score Bar */}
                  <div
                    className={`h-full rounded-l-lg transition-all duration-500 flex items-center justify-between px-2.5 ${
                      isDeficit
                        ? 'bg-linear-to-r from-amber-500 to-amber-600'
                        : 'bg-linear-to-r from-cyan-600 to-emerald-500'
                    }`}
                    style={{ width: `${Math.max(actualPct, 14)}%` }}
                  >
                    <span className="text-[11px] font-mono font-bold text-white drop-shadow-xs whitespace-nowrap tabular-nums">
                      Aktual: {avgActual.toFixed(2)} / 5.0
                    </span>
                  </div>

                  {/* Target Benchmark Vertical Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-600 dark:bg-rose-400 z-10 shadow-xs"
                    style={{ left: `${targetPct}%` }}
                    title={`Target Standar: ${avgTarget.toFixed(2)}`}
                  >
                    <div className="absolute -top-0.5 -translate-x-1/2 px-1 rounded bg-rose-600 text-[9px] font-mono font-bold text-white">
                      {avgTarget.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Skill Gap Priority Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Matriks Prioritas Kesenjangan per Keahlian (Diurutkan dari Defisit Terbesar)
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan personil yang berada di bawah target beserta mentor internal (Level 4–5) yang tersedia.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {skillGapRows.length} Kompetensi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Kompetensi & Domain</th>
                <th className="px-3 py-3 font-semibold text-center">Aktual</th>
                <th className="px-3 py-3 font-semibold text-center">Target</th>
                <th className="px-3 py-3 font-semibold text-center">Gap</th>
                <th className="px-4 py-3 font-semibold">Personil Membutuhkan Akselerasi</th>
                <th className="px-4 py-3 font-semibold">Mentor Internal (L4–L5)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {skillGapRows.map((row) => (
                <tr
                  key={row.skill.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {row.skill.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{row.categoryName}</div>
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {row.avgActual.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-slate-500 tabular-nums">
                    {row.avgTarget.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-center font-mono tabular-nums">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-bold ${
                        row.gap < 0
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {row.gap >= 0 ? `+${row.gap.toFixed(2)}` : row.gap.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.deficitEngineers.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Semua Memenuhi</span>
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {row.deficitEngineers.map(({ engineer, actual, target, deficit }) => (
                          <button
                            key={engineer.id}
                            onClick={() => onOpenReport(engineer)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors text-[11px] cursor-pointer"
                            title={`Klik untuk buka Laporan IDP ${engineer.name} (L${actual} -> Target L${target})`}
                          >
                            <span className="font-medium">{engineer.name.split(' ')[0]}</span>
                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                              L{actual}/L{target} (-{deficit})
                            </span>
                            <FileText className="w-3 h-3 opacity-60" />
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.mentors.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">Pelatihan Eksternal</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {row.mentors.slice(0, 2).map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 text-cyan-800 dark:text-cyan-300 text-[11px]"
                          >
                            <UserCheck className="w-3 h-3 text-cyan-600" />
                            <span>{m.name.split(' ')[0]}</span>
                            <span className="font-mono font-bold">L{m.skills[row.skill.id]}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
