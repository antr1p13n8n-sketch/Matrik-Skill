import React, { useState, useMemo, useEffect } from 'react';
import { Engineer, SkillDefinition, SkillLevel } from '../types/skills';
import {
  Send,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  Plus,
  Trash2,
  SlidersHorizontal,
  ShieldCheck,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export interface DispatchRequirement {
  skillId: string;
  minLevel: SkillLevel;
}

export interface DispatchAssignment {
  id: string;
  taskTitle: string;
  priority: 'critical' | 'high' | 'normal';
  department: string;
  engineerId: string;
  engineerName: string;
  engineerRole: string;
  matchScore: number;
  requirements: DispatchRequirement[];
  status: 'assigned' | 'in_progress' | 'completed';
  dispatchedAt: string;
  notes?: string;
}

interface SmartDispatchSectionProps {
  engineers: Engineer[];
  skills: SkillDefinition[];
  onOpenReport: (engineer: Engineer) => void;
}

interface PresetScenario {
  id: string;
  label: string;
  taskTitle: string;
  priority: 'critical' | 'high' | 'normal';
  department: string;
  requirements: DispatchRequirement[];
}

export const SmartDispatchSection: React.FC<SmartDispatchSectionProps> = ({
  engineers,
  skills,
  onOpenReport,
}) => {
  const presets: PresetScenario[] = useMemo(() => {
    const findSkill = (keywords: string[], fallbackIdx: number) => {
      const found = skills.find((s) =>
        keywords.some((k) => s.id.toLowerCase().includes(k) || s.name.toLowerCase().includes(k))
      );
      return found?.id || skills[fallbackIdx % skills.length]?.id || '';
    };

    return [
      {
        id: 'fea_audit',
        label: 'Audit Struktur FEA',
        taskTitle: 'Audit Kegagalan Fatik & Analisis Tegangan Struktur Utama',
        priority: 'critical',
        department: 'Structures & Dynamics',
        requirements: [
          { skillId: findSkill(['fea', 'stress', 'struct'], 1), minLevel: 4 as SkillLevel },
          { skillId: findSkill(['cad', 'gdt', 'solid'], 0), minLevel: 3 as SkillLevel },
          { skillId: findSkill(['asme', 'iso', 'stand'], 6), minLevel: 3 as SkillLevel },
        ].filter((r) => r.skillId),
      },
      {
        id: 'cfd_thermal',
        label: 'Optimasi Termal & CFD',
        taskTitle: 'Simulasi Pendinginan Konjugat & Aliran Fluida Manifold',
        priority: 'high',
        department: 'Propulsion & Aerodynamics',
        requirements: [
          { skillId: findSkill(['cfd', 'thermal', 'heat', 'fluid'], 2), minLevel: 4 as SkillLevel },
          { skillId: findSkill(['cad', 'model'], 0), minLevel: 3 as SkillLevel },
        ].filter((r) => r.skillId),
      },
      {
        id: 'mechatronics_int',
        label: 'Integrasi Mekatronika',
        taskTitle: 'Kalibrasi Aktuator Servo & Kontrol Loop Tertutup',
        priority: 'high',
        department: 'Robotics & Control',
        requirements: [
          { skillId: findSkill(['mecha', 'actuator', 'plc', 'control'], 4), minLevel: 4 as SkillLevel },
          { skillId: findSkill(['dfmea', 'rams', 'qual'], 5), minLevel: 3 as SkillLevel },
        ].filter((r) => r.skillId),
      },
      {
        id: 'dfm_review',
        label: 'Review GD&T & Manufaktur',
        taskTitle: 'Validasi Stack-up Toleransi GD&T & Kesiapan Produksi CNC',
        priority: 'normal',
        department: 'Manufacturing Engineering',
        requirements: [
          { skillId: findSkill(['gdt', 'cad', 'toler'], 0), minLevel: 4 as SkillLevel },
          { skillId: findSkill(['mfg', 'cnc', 'mat'], 3), minLevel: 3 as SkillLevel },
        ].filter((r) => r.skillId),
      },
    ];
  }, [skills]);

  const [taskTitle, setTaskTitle] = useState(presets[0]?.taskTitle || 'Proyek Audit Teknik Mekanikal');
  const [priority, setPriority] = useState<'critical' | 'high' | 'normal'>(presets[0]?.priority || 'critical');
  const [department, setDepartment] = useState(presets[0]?.department || 'Engineering');
  const [requirements, setRequirements] = useState<DispatchRequirement[]>(presets[0]?.requirements || []);
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [selectedSkillToAdd, setSelectedSkillToAdd] = useState(skills[0]?.id || '');
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);

  const [dispatches, setDispatches] = useState<DispatchAssignment[]>(() => {
    try {
      const saved = localStorage.getItem('mechmatrix_dispatches');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem('mechmatrix_dispatches', JSON.stringify(dispatches));
  }, [dispatches]);

  const applyPreset = (p: PresetScenario) => {
    setTaskTitle(p.taskTitle);
    setPriority(p.priority);
    setDepartment(p.department);
    setRequirements(p.requirements);
    setDispatchFeedback(null);
  };

  const handleAddRequirement = () => {
    if (!selectedSkillToAdd) return;
    if (requirements.some((r) => r.skillId === selectedSkillToAdd)) return;
    setRequirements((prev) => [...prev, { skillId: selectedSkillToAdd, minLevel: 3 }]);
  };

  const handleUpdateReqLevel = (skillId: string, minLevel: SkillLevel) => {
    setRequirements((prev) =>
      prev.map((r) => (r.skillId === skillId ? { ...r, minLevel } : r))
    );
  };

  const handleRemoveReq = (skillId: string) => {
    setRequirements((prev) => prev.filter((r) => r.skillId !== skillId));
  };

  // Smart Matching Algorithm
  const rankedCandidates = useMemo(() => {
    return engineers
      .map((eng) => {
        if (requirements.length === 0) {
          return {
            engineer: eng,
            matchScore: 100,
            metCount: 0,
            totalReq: 0,
            readiness: 'ready' as const,
            breakdown: [],
            activeTasksCount: dispatches.filter(
              (d) => d.engineerId === eng.id && d.status !== 'completed'
            ).length,
          };
        }

        let earnedPoints = 0;
        let maxPoints = 0;
        let metCount = 0;

        const breakdown = requirements.map((req) => {
          const skillDef = skills.find((s) => s.id === req.skillId);
          const actual = eng.skills[req.skillId] ?? 0;
          const required = req.minLevel;
          maxPoints += 100;

          if (actual >= required) {
            metCount++;
            // Bonus up to +5% per extra level capped at 100 per skill
            earnedPoints += 100;
          } else {
            const ratio = Math.max(0, actual / Math.max(1, required));
            earnedPoints += ratio * 70; // Partial credit
          }

          return {
            skillId: req.skillId,
            skillName: skillDef?.name || req.skillId,
            actual,
            required,
            met: actual >= required,
            deficit: Math.max(0, required - actual),
          };
        });

        // Subtle tie-breaker bonus for verified certificates & active workload penalty
        const certBonus = Math.min(4, (eng.certificates?.length || 0) * 1.5);
        const activeTasksCount = dispatches.filter(
          (d) => d.engineerId === eng.id && d.status !== 'completed'
        ).length;
        const workloadPenalty = activeTasksCount * 4;

        const basePct = (earnedPoints / Math.max(1, maxPoints)) * 100;
        const finalScore = Math.max(
          0,
          Math.min(100, Math.round(basePct + (metCount === requirements.length ? certBonus : 0) - workloadPenalty))
        );

        let readiness: 'ready' | 'assisted' | 'deficit' = 'deficit';
        if (metCount === requirements.length) readiness = 'ready';
        else if (finalScore >= 65) readiness = 'assisted';

        return {
          engineer: eng,
          matchScore: finalScore,
          metCount,
          totalReq: requirements.length,
          readiness,
          breakdown,
          activeTasksCount,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [engineers, requirements, skills, dispatches]);

  const handleDispatchEngineer = (candidate: (typeof rankedCandidates)[0]) => {
    if (!taskTitle.trim()) return;
    const newDispatch: DispatchAssignment = {
      id: `dsp_${Date.now()}`,
      taskTitle: taskTitle.trim(),
      priority,
      department,
      engineerId: candidate.engineer.id,
      engineerName: candidate.engineer.name,
      engineerRole: candidate.engineer.roleTitle,
      matchScore: candidate.matchScore,
      requirements: [...requirements],
      status: 'assigned',
      dispatchedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: dispatchNotes.trim() || undefined,
    };

    setDispatches((prev) => [newDispatch, ...prev]);
    setDispatchFeedback(
      `Berhasil menugaskan ${candidate.engineer.name} (Skor Kecocokan ${candidate.matchScore}%) untuk "${taskTitle.trim()}"`
    );
    setDispatchNotes('');
  };

  const handleToggleStatus = (id: string) => {
    setDispatches((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const nextStatus =
          d.status === 'assigned'
            ? 'in_progress'
            : d.status === 'in_progress'
            ? 'completed'
            : 'assigned';
        return { ...d, status: nextStatus };
      })
    );
  };

  const handleDeleteDispatch = (id: string) => {
    setDispatches((prev) => prev.filter((d) => d.id !== id));
  };

  const topCandidate = rankedCandidates[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>Smart Dispatch — Penugasan Insinyur Berbasis Kompetensi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cocokkan kebutuhan proyek/tugas teknis secara otomatis dengan level kompetensi, sertifikasi, dan beban kerja insinyur terbaik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1">Template Cepat:</span>
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 hover:border-cyan-400 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {dispatchFeedback && (
        <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{dispatchFeedback}</span>
          </div>
          <button
            onClick={() => setDispatchFeedback(null)}
            className="text-emerald-600 hover:underline text-[11px] font-semibold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Grid: Left (Request Builder) + Right (Matching Chart & Candidates) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Task & Requirement Builder */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
              <span>Parameter Tugas & Syarat Keahlian</span>
            </h3>
            {topCandidate && (
              <button
                onClick={() => handleDispatchEngineer(topCandidate)}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title={`Langsung tugaskan rekomendasi #1: ${topCandidate.engineer.name}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Dispatch #1</span>
              </button>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Judul Proyek / Work Order
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                placeholder="Contoh: Analisis Tegangan Turbin..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Prioritas
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'critical' | 'high' | 'normal')}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="critical">Kritis (Urgent)</option>
                  <option value="high">Tinggi</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Departemen Pemohon
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Required Skills List */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Kompetensi Wajib & Level Minimum (L1–L5)
              </label>

              <div className="flex gap-2">
                <select
                  value={selectedSkillToAdd}
                  onChange={(e) => setSelectedSkillToAdd(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddRequirement}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {requirements.length === 0 ? (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-center italic">
                    Belum ada syarat keahlian dipilih. Tambahkan keahlian di atas.
                  </div>
                ) : (
                  requirements.map((req) => {
                    const skillDef = skills.find((s) => s.id === req.skillId);
                    return (
                      <div
                        key={req.skillId}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                      >
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {skillDef?.name || req.skillId}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={req.minLevel}
                            onChange={(e) =>
                              handleUpdateReqLevel(req.skillId, Number(e.target.value) as SkillLevel)
                            }
                            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-cyan-600 dark:text-cyan-400 text-xs"
                          >
                            {[1, 2, 3, 4, 5].map((lvl) => (
                              <option key={lvl} value={lvl}>
                                Min L{lvl}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRemoveReq(req.skillId)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Hapus syarat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Penugasan (Opsional)
              </label>
              <input
                type="text"
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="Misal: Tenggat laporan hari Jumat pukul 17.00..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Right: Visual Candidate Match Chart (Numbers Inside Bars) + Ranked Candidates */}
        <div className="lg:col-span-7 space-y-5">
          {/* Candidate Match Bar Chart with Numbers Inside Bars */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Grafik Skor Kecocokan Kandidat (Match Score %)
                </h3>
                <p className="text-xs text-slate-500">
                  Angka kecocokan dan pemenuhan syarat ditampilkan langsung di dalam grafik batang
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {rankedCandidates.length} Insinyur
              </span>
            </div>

            <div className="space-y-2.5">
              {rankedCandidates.map((c, idx) => {
                const barColor =
                  c.readiness === 'ready'
                    ? 'from-emerald-600 to-cyan-600'
                    : c.readiness === 'assisted'
                    ? 'from-amber-500 to-amber-600'
                    : 'from-rose-500 to-rose-600';

                return (
                  <div key={c.engineer.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {c.engineer.name}
                        </span>
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          ({c.engineer.roleTitle})
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {c.metCount}/{c.totalReq} Syarat Terpenuhi
                      </span>
                    </div>

                    <div className="relative h-7 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200/70 dark:border-slate-700/70">
                      <div
                        className={`h-full rounded-l-lg bg-linear-to-r ${barColor} transition-all duration-500 flex items-center px-3`}
                        style={{ width: `${Math.max(c.matchScore, 18)}%` }}
                      >
                        <span className="text-[11px] font-mono font-bold text-white drop-shadow-xs whitespace-nowrap tabular-nums">
                          {c.matchScore}% Match ({c.metCount}/{c.totalReq} Skill)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Candidate Cards */}
          <div className="space-y-3">
            {rankedCandidates.map((c, idx) => (
              <div
                key={c.engineer.id}
                className={`p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-2xs transition-all ${
                  idx === 0
                    ? 'border-cyan-500/60 ring-1 ring-cyan-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                        c.readiness === 'ready'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : c.readiness === 'assisted'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {c.matchScore}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {c.engineer.name}
                        </h4>
                        {idx === 0 && (
                          <span className="px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold">
                            Rekomendasi Terbaik
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            c.readiness === 'ready'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : c.readiness === 'assisted'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {c.readiness === 'ready'
                            ? 'Siap Ditugaskan'
                            : c.readiness === 'assisted'
                            ? 'Butuh Pendampingan'
                            : 'Belum Memenuhi'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{c.engineer.roleTitle}</span>
                        <span>·</span>
                        <span>{c.engineer.experienceYears} Thn Pengalaman</span>
                        {c.activeTasksCount > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              {c.activeTasksCount} Tugas Aktif
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenReport(c.engineer)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Profil IDP
                    </button>
                    <button
                      onClick={() => handleDispatchEngineer(c)}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Tugaskan</span>
                    </button>
                  </div>
                </div>

                {/* Skill breakdown pills */}
                {c.breakdown.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                    {c.breakdown.map((b) => (
                      <span
                        key={b.skillId}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                          b.met
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60'
                        }`}
                      >
                        <span className="font-sans font-medium">{b.skillName}:</span>
                        <span className="font-bold">
                          L{b.actual}/L{b.required}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Dispatch Board / History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Papan Penugasan Aktif (Active Smart Dispatch Board)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {dispatches.length} Penugasan Tercatat
          </span>
        </div>

        {dispatches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Belum ada tugas yang di-dispatch. Pilih kandidat di atas dan klik <strong>"Tugaskan"</strong> atau <strong>"Auto-Dispatch #1"</strong>.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {dispatches.map((d) => (
              <div
                key={d.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        d.priority === 'critical'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : d.priority === 'high'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {d.priority}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {d.taskTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-semibold text-cyan-700 dark:text-cyan-400">
                      <UserCheck className="w-3.5 h-3.5" />
                      {d.engineerName}
                    </span>
                    <span>·</span>
                    <span>{d.department}</span>
                    <span>·</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Match {d.matchScore}%
                    </span>
                    <span>·</span>
                    <span className="font-mono text-[11px]">{d.dispatchedAt}</span>
                  </div>
                  {d.notes && (
                    <div className="text-[11px] text-slate-500 italic">Catatan: {d.notes}</div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleStatus(d.id)}
                    className={`px-3 py-1 rounded-lg font-semibold text-xs border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      d.status === 'completed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : d.status === 'in_progress'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                        : 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300'
                    }`}
                    title="Klik untuk ubah status penugasan"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {d.status === 'completed'
                        ? 'Selesai'
                        : d.status === 'in_progress'
                        ? 'Dalam Proses'
                        : 'Ditugaskan'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteDispatch(d.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Hapus penugasan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
