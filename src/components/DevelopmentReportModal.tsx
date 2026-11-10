import React, { useState } from 'react';
import { Engineer, DevelopmentReport } from '../types/skills';
import { RadarChart, RadarDataPoint } from './RadarChart';
import { formatReportAsMarkdown } from '../utils/reportGenerator';
import { Printer, Download, Copy, Sparkles, Check, X, ShieldAlert, Award, UserCheck, ArrowRight, BookOpen } from 'lucide-react';

interface DevelopmentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DevelopmentReport | null;
  engineer: Engineer | null;
}

export const DevelopmentReportModal: React.FC<DevelopmentReportModalProps> = ({
  isOpen,
  onClose,
  report,
  engineer,
}) => {
  const [copied, setCopied] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  if (!isOpen || !report || !engineer) return null;

  const radarData: RadarDataPoint[] = report.radarDomainScores.map((s) => ({
    axis: s.categoryName,
    actual: s.actualScore,
    target: s.targetScore,
    categoryKey: s.category,
  }));

  const handleCopyMarkdown = () => {
    const md = formatReportAsMarkdown(report);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `IDP_${engineer.name.replace(/\s+/g, '_')}_${report.generatedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateAiCoaching = async () => {
    setAiGenerating(true);
    try {
      const strengths = report.radarDomainScores.filter((r) => r.gap >= 0).map((r) => r.categoryName);
      const res = await fetch('/api/generate-ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engineerName: report.engineerName,
          roleTitle: report.roleTitle,
          averageScore: report.summary.averageScore,
          targetScore: report.summary.targetScore,
          criticalGaps: report.criticalGaps.map((g) => ({
            skill: g.skillName,
            domain: g.categoryName,
            deficit: g.deficit,
            target: g.requiredLevel,
          })),
          strengths,
        }),
      });

      const data = await res.json();
      if (data.success && data.aiFeedback) {
        setAiSummary(data.aiFeedback);
      } else {
        setAiSummary('Gagal menghasilkan analisis AI. Silakan coba kembali.');
      }
    } catch (err) {
      console.error(err);
      setAiSummary('Gagal terhubung ke modul AI. Menampilkan analisis algoritma matriks default.');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 print:static print:inset-auto print:block print:overflow-visible print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden print:max-w-none print:w-full print:overflow-visible print:border-none print:shadow-none print:rounded-none print:bg-white">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Sistem Pelaporan Otomatis Pengembangan Insinyur (IDP)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
              title="Cetak atau Simpan sebagai PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin MD'}</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:space-y-4 text-slate-800 dark:text-slate-200 print:text-slate-900">
          {/* Engineering Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 print-break-inside-avoid">
            <div className="flex items-start gap-4">
              {engineer.avatarUrl ? (
                <img
                  src={engineer.avatarUrl}
                  alt={engineer.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border-2 border-cyan-500 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-cyan-600 flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-md">
                  {engineer.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
              )}
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  Divisi Engineering & R&D · Dokumen Evaluasi Kompetensi
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
                  {report.engineerName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1">
                  <span className="font-semibold text-cyan-700 dark:text-cyan-400">{report.roleTitle}</span>
                  <span>·</span>
                  <span>{engineer.department}</span>
                  <span>·</span>
                  <span>Pengalaman: {engineer.experienceYears} Tahun</span>
                </div>
                {engineer.certificates && engineer.certificates.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {engineer.certificates.map((cert) => (
                      <span
                        key={cert.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] font-medium"
                      >
                        <Award className="w-3 h-3 text-amber-500" />
                        <span>{cert.name}</span>
                        <span className="text-slate-400 font-normal">({cert.year})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-500 shrink-0">
              <div>Ref: IDP-{engineer.id.toUpperCase()}-{report.generatedDate.replace(/-/g, '')}</div>
              <div>Tanggal Terbit: {report.generatedDate}</div>
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                  Status: Terverifikasi Sistem
                </span>
              </div>
            </div>
          </div>

          {/* KPI Snapshot Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4 print-break-inside-avoid">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500">Skor Rata-rata</div>
              <div className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400 tabular-nums mt-1">
                {report.summary.averageScore} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500">Target Benchmark</div>
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                {report.summary.targetScore} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500">Kesenjangan (Gaps)</div>
              <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums mt-1">
                {report.summary.gapCount} <span className="text-xs text-slate-400 font-normal">skills</span>
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500">Keunggulan (L4-L5)</div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                {report.summary.strengthCount} <span className="text-xs text-slate-400 font-normal">skills</span>
              </div>
            </div>
          </div>

          {/* Section 1: Spider Chart Visual Breakdown */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 print-break-inside-avoid print:p-4">
            <div className="flex flex-col md:flex-row print:flex-row items-center gap-6">
              <div className="w-full md:w-1/2 flex justify-center">
                <RadarChart
                  title="Profil Kompetensi 7 Domain Teknik Mesin"
                  subtitle="Perbandingan Nilai Aktual vs Target Standar Jabatan"
                  data={radarData}
                  size={380}
                  accentColor="cyan"
                  benchmarkName="Target Standar"
                  actualName="Kompetensi Aktual"
                />
              </div>

              {/* Table of category gaps */}
              <div className="w-full md:w-1/2 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                      <th className="pb-2 font-semibold">Domain Rekayasa</th>
                      <th className="pb-2 font-semibold text-right">Aktual</th>
                      <th className="pb-2 font-semibold text-right">Target</th>
                      <th className="pb-2 font-semibold text-right">Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {report.radarDomainScores.map((row) => (
                      <tr key={row.category} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{row.categoryName}</td>
                        <td className="py-2 text-right font-mono tabular-nums text-cyan-600 dark:text-cyan-400 font-semibold">
                          {row.actualScore.toFixed(1)}
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums text-slate-500">{row.targetScore.toFixed(1)}</td>
                        <td className="py-2 text-right font-mono tabular-nums">
                          {row.gap >= 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{row.gap.toFixed(1)}</span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-medium">{row.gap.toFixed(1)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2: Priority Skill Gaps & Internal Mentoring Recommendation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Analisis Kesenjangan Prioritas & Rekomendasi Mentor Sebaya</span>
              </h3>
              <span className="text-xs text-slate-500">
                {report.criticalGaps.length} Area Membutuhkan Akselerasi
              </span>
            </div>

            {report.criticalGaps.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                Selamat! Seluruh kompetensi teknis saat ini telah berada pada atau di atas standar benchmark jabatan.
              </div>
            ) : (
              <div className="space-y-2.5">
                {report.criticalGaps.slice(0, 4).map((gap, idx) => (
                  <div
                    key={gap.skillId}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print-break-inside-avoid"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{idx + 1}. {gap.skillName}</span>
                        <span className="text-[11px] font-normal text-slate-500">({gap.categoryName})</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Rekomendasi Mentor Internal:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{gap.recommendedMentors[0]}</span>
                      </div>
                      {gap.certificationPath.length > 0 && (
                        <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>Standar / Jalur Uji:</span>
                          <span>{gap.certificationPath[0]}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase">Level Sekarang</div>
                        <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          L{gap.currentLevel} <ArrowRight className="w-3 h-3 inline text-slate-400" /> L{gap.requiredLevel}
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-mono font-bold text-xs">
                        -{gap.deficit} Lvl
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: 30-60-90 Day Structured Roadmap */}
          <div className="space-y-3 print-break-inside-avoid">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-600" />
              <span>Rencana Aksi Pengembangan Terstruktur (30-60-90 Hari)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2">
                <div className="font-bold text-cyan-700 dark:text-cyan-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                  Bulan 1 (Hari 1 - 30): Fondasi & Studi Standar
                </div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                  {report.actionPlan.phase30Days.map((act, i) => (
                    <li key={i} className="leading-relaxed">{act}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2">
                <div className="font-bold text-indigo-700 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                  Bulan 2 (Hari 31 - 60): Penerapan Proyek Nyata
                </div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                  {report.actionPlan.phase60Days.map((act, i) => (
                    <li key={i} className="leading-relaxed">{act}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2">
                <div className="font-bold text-emerald-700 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                  Bulan 3 (Hari 61 - 90): Validasi & Sertifikasi
                </div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                  {report.actionPlan.phase90Days.map((act, i) => (
                    <li key={i} className="leading-relaxed">{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4: AI-Enhanced Coaching Synthesis (Gemini Integration) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-50 to-cyan-50/30 dark:from-slate-850 dark:to-cyan-950/20 print-break-inside-avoid">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Ulasan Manajerial & Coaching Cerdas (AI Executive Review)
                </h4>
              </div>
              <button
                onClick={handleGenerateAiCoaching}
                disabled={aiGenerating}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 print:hidden shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiGenerating ? 'Menganalisis Kompetensi...' : 'Generate AI Coaching'}</span>
              </button>
            </div>

            {aiSummary ? (
              <div className="mt-3 p-3.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {aiSummary}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                Klik tombol di atas untuk mensintesis ringkasan manajerial komprehensif berbasis model AI Google Gemini yang disesuaikan dengan rekayasa mekanikal dan target proyek tim Anda.
              </p>
            )}
          </div>

          {/* Report Footer Sign-off Block for Print / Formal Audit */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-xs text-center print-break-inside-avoid">
            <div>
              <div className="text-slate-500 mb-12">Disiapkan & Diajukan Oleh,</div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">{report.engineerName}</div>
              <div className="text-[11px] text-slate-400">{report.roleTitle}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-12">Disetujui & Divalidasi Oleh,</div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">Dr. Ir. Hartono Wicaksono, IPU</div>
              <div className="text-[11px] text-slate-400">Head of Mechanical Engineering</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
