import React, { useState } from 'react';
import { Engineer, SkillDefinition, SkillCategory } from '../types/skills';
import { SKILL_CATEGORIES, INITIAL_BENCHMARK_TARGETS } from '../data/initialData';
import { DOMAIN_COLOR_MAP } from '../utils/domainColors';
import { RadarChart, RadarDataPoint } from './RadarChart';
import { FileText, Sparkles, TrendingUp } from 'lucide-react';

interface SpiderOverviewSectionProps {
  engineers: Engineer[];
  skills: SkillDefinition[];
  selectedEngineerId: string;
  onSelectEngineerId: (id: string) => void;
  onOpenReport: (engineer: Engineer) => void;
}

export const SpiderOverviewSection: React.FC<SpiderOverviewSectionProps> = ({
  engineers,
  skills,
  selectedEngineerId,
  onSelectEngineerId,
  onOpenReport,
}) => {
  const [compareMode, setCompareMode] = useState<'target' | 'team_avg' | 'peer'>('target');
  const [peerEngineerId, setPeerEngineerId] = useState<string>(
    engineers.find((e) => e.id !== selectedEngineerId)?.id || engineers[0].id
  );

  const currentEngineer = engineers.find((e) => e.id === selectedEngineerId) || engineers[0];
  const peerEngineer = engineers.find((e) => e.id === peerEngineerId) || engineers[1] || engineers[0];

  // Calculate team averages for each category
  const teamCategoryAverages: Record<SkillCategory, number> = {} as any;
  const targetCategoryScores: Record<SkillCategory, number> = {} as any;
  const currentCategoryScores: Record<SkillCategory, number> = {} as any;
  const peerCategoryScores: Record<SkillCategory, number> = {} as any;

  SKILL_CATEGORIES.forEach((cat) => {
    const catSkills = skills.filter((s) => s.category === cat.id);
    if (catSkills.length === 0) return;

    let teamSum = 0;
    engineers.forEach((eng) => {
      catSkills.forEach((s) => {
        teamSum += eng.skills[s.id] ?? 0;
      });
    });
    teamCategoryAverages[cat.id] = Number((teamSum / (engineers.length * catSkills.length)).toFixed(2));

    const benchmark = INITIAL_BENCHMARK_TARGETS[currentEngineer.targetBenchmark] || INITIAL_BENCHMARK_TARGETS.senior_mechanical;
    let targetSum = 0;
    catSkills.forEach((s) => {
      targetSum += benchmark[s.id] ?? 3;
    });
    targetCategoryScores[cat.id] = Number((targetSum / catSkills.length).toFixed(2));

    let currentSum = 0;
    catSkills.forEach((s) => {
      currentSum += currentEngineer.skills[s.id] ?? 0;
    });
    currentCategoryScores[cat.id] = Number((currentSum / catSkills.length).toFixed(2));

    let peerSum = 0;
    catSkills.forEach((s) => {
      peerSum += peerEngineer.skills[s.id] ?? 0;
    });
    peerCategoryScores[cat.id] = Number((peerSum / catSkills.length).toFixed(2));
  });

  const radarData: RadarDataPoint[] = SKILL_CATEGORIES.map((cat) => {
    const actual = currentCategoryScores[cat.id] || 0;
    let target = targetCategoryScores[cat.id] || 3;
    let benchmarkLabel = 'Target Standar';

    if (compareMode === 'team_avg') {
      target = teamCategoryAverages[cat.id] || 2.5;
      benchmarkLabel = 'Rata-rata Tim';
    } else if (compareMode === 'peer') {
      target = peerCategoryScores[cat.id] || 0;
      benchmarkLabel = peerEngineer.name.split(' ')[0];
    }

    return {
      axis: cat.shortName,
      categoryKey: cat.id,
      actual,
      target,
      benchmarkLabel,
    };
  });

  const totalSkills = skills.length;
  let masteredCount = 0;
  let gapsCount = 0;
  const benchmark = INITIAL_BENCHMARK_TARGETS[currentEngineer.targetBenchmark] || INITIAL_BENCHMARK_TARGETS.senior_mechanical;

  skills.forEach((s) => {
    const val = currentEngineer.skills[s.id] ?? 0;
    const tgt = benchmark[s.id] ?? 3;
    if (val >= tgt) masteredCount++;
    else gapsCount++;
  });

  const coveragePct = Math.round((masteredCount / totalSkills) * 100);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Top Header: Engineer selection and Mode switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Pilih Insinyur:
          </label>
          <select
            value={selectedEngineerId}
            onChange={(e) => onSelectEngineerId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50/40 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {engineers.map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.name} — {eng.roleTitle}
              </option>
            ))}
          </select>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <button
              onClick={() => setCompareMode('target')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                compareMode === 'target'
                  ? 'bg-linear-to-r from-cyan-500 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              vs Target Benchmark
            </button>
            <button
              onClick={() => setCompareMode('team_avg')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                compareMode === 'team_avg'
                  ? 'bg-linear-to-r from-violet-500 to-fuchsia-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              vs Rata-rata Tim
            </button>
            <button
              onClick={() => setCompareMode('peer')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                compareMode === 'peer'
                  ? 'bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              vs Rekan Kerja (Head-to-Head)
            </button>
          </div>

          {compareMode === 'peer' && (
            <select
              value={peerEngineerId}
              onChange={(e) => setPeerEngineerId(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {engineers
                .filter((e) => e.id !== selectedEngineerId)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    Bandingkan: {e.name}
                  </option>
                ))}
            </select>
          )}
        </div>

        {/* Primary CTA: Automated Report for Developer */}
        <button
          onClick={() => onOpenReport(currentEngineer)}
          className="px-4 py-2 text-xs font-semibold text-white bg-linear-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:brightness-110 rounded-xl transition-all flex items-center gap-2 shadow-sm shadow-indigo-500/25 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Buat Laporan Otomatis Pengembang (IDP)</span>
        </button>
      </div>

      {/* Spider Chart + Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Spider Chart */}
        <div className="lg:col-span-7 flex justify-center">
          <RadarChart
            title={`Radar Kompetensi: ${currentEngineer.name}`}
            subtitle={
              compareMode === 'target'
                ? `Dibandingkan terhadap target standar: ${currentEngineer.targetBenchmark.replace('_', ' ').toUpperCase()}`
                : compareMode === 'team_avg'
                ? 'Dibandingkan terhadap rata-rata kompetensi divisi teknik mekanikal'
                : `Perbandingan langsung terhadap profil: ${peerEngineer.name}`
            }
            data={radarData}
            size={430}
            accentColor="cyan"
            benchmarkName={
              compareMode === 'target'
                ? 'Target Benchmark'
                : compareMode === 'team_avg'
                ? 'Rata-rata Tim'
                : peerEngineer.name.split(' ')[0]
            }
            actualName={currentEngineer.name.split(' ')[0]}
          />
        </div>

        {/* Right Column: Live Metrics & Gap Analysis */}
        <div className="lg:col-span-5 space-y-4">
          {/* Coverage Summary Box */}
          <div className="p-4 rounded-2xl border border-cyan-200/80 dark:border-cyan-800/60 bg-linear-to-br from-cyan-50/70 via-indigo-50/40 to-fuchsia-50/40 dark:from-cyan-950/30 dark:via-indigo-950/20 dark:to-fuchsia-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Indeks Cakupan Target Jabatan
              </span>
              <span className="font-mono text-base font-extrabold text-transparent bg-clip-text bg-linear-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400 tabular-nums">
                {coveragePct}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-linear-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${coveragePct}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-xs pt-0.5">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{masteredCount} Memenuhi / Melebihi Standar</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{gapsCount} Perlu Akselerasi</span>
            </div>
          </div>

          {/* Quick Domain Gap List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Prioritas Pengembangan Domain Utama:</span>
            </div>

            <div className="space-y-2">
              {radarData
                .map((r) => ({ ...r, delta: r.actual - r.target }))
                .sort((a, b) => a.delta - b.delta)
                .slice(0, 3)
                .map((item) => {
                  const domainTheme = item.categoryKey ? DOMAIN_COLOR_MAP[item.categoryKey] : null;
                  return (
                    <div
                      key={item.axis}
                      className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {domainTheme && <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${domainTheme.dot}`} />}
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{item.axis}</div>
                          <div className="text-[11px] text-slate-500">
                            Aktual: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{item.actual.toFixed(1)}</span> / Target: <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{item.target.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        {item.delta < 0 ? (
                          <span className="px-2.5 py-1 rounded-lg bg-linear-to-r from-rose-500/15 to-amber-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-mono font-bold text-[11px]">
                            {item.delta.toFixed(1)}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-linear-to-r from-emerald-500/15 to-teal-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono font-bold text-[11px]">
                            +{item.delta.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Quick Info Tip */}
          <div className="p-3 rounded-xl bg-linear-to-r from-indigo-50/70 to-cyan-50/70 dark:from-indigo-950/30 dark:to-cyan-950/30 border border-indigo-200/70 dark:border-indigo-800/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5 leading-relaxed">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Grafik spider chart memperlihatkan keseimbangan kompetensi mekanikal dengan kode warna tiap domain. Sorot simpul (vertex) untuk melihat rincian delta.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
