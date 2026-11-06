import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  BookOpen, 
  ShieldCheck, 
  Sliders, 
  Award, 
  FileText, 
  Cpu, 
  Layers, 
  Wrench, 
  CheckCircle2, 
  HelpCircle,
  Calculator,
  ChevronRight
} from 'lucide-react';
import { SKILL_LEVEL_LABELS, SkillLevel } from '../types/skills';

interface AssessmentStandardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssessmentStandardModal: React.FC<AssessmentStandardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'rubric' | 'pillars' | 'sop' | 'calculator'>('pillars');
  const [copied, setCopied] = useState(false);

  // Interactive Scoring Simulation State
  const [calcScores, setCalcScores] = useState({
    theory: 4,
    software: 4,
    problemSolving: 3,
    dfm: 4,
    cert: 3,
  });

  const [weights, setWeights] = useState({
    theory: 20,
    software: 25,
    problemSolving: 25,
    dfm: 15,
    cert: 15,
  });

  if (!isOpen) return null;

  const totalWeightedScore = Number((
    (calcScores.theory * weights.theory +
      calcScores.software * weights.software +
      calcScores.problemSolving * weights.problemSolving +
      calcScores.dfm * weights.dfm +
      calcScores.cert * weights.cert) / 100
  ).toFixed(2));

  const getRecommendedLevel = (score: number): { level: SkillLevel; title: string; color: string } => {
    if (score >= 4.5) return { level: 5, title: 'L5 - Ahli / Mentor (Principal Specialist)', color: 'text-purple-600 dark:text-purple-400' };
    if (score >= 3.6) return { level: 4, title: 'L4 - Mahir (Advanced Engineer)', color: 'text-indigo-600 dark:text-indigo-400' };
    if (score >= 2.6) return { level: 3, title: 'L3 - Mandiri (Competent Engineer)', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 1.6) return { level: 2, title: 'L2 - Berkembang (Developing Engineer)', color: 'text-blue-600 dark:text-blue-400' };
    if (score >= 0.8) return { level: 1, title: 'L1 - Dasar (Novice / Junior Trainee)', color: 'text-amber-600 dark:text-amber-400' };
    return { level: 0, title: 'L0 - Belum Terpapar (No Exposure)', color: 'text-slate-500' };
  };

  const recommendedLevel = getRecommendedLevel(totalWeightedScore);

  const copySopText = () => {
    const text = `
STANDAR OPERASIONAL PROSEDUR (SOP) PENILAIAN KOMPETENSI TEKNIS INSINYUR MESIN
Dokumen No: SOP-ENG-MAT-001 | Revisi: 2.1 | Standar: ISO 9001:2015 Clause 7.2 & AS9100D

1. TUJUAN
Memastikan setiap personil divisi Rekayasa Mekanikal dievaluasi secara objektif, terstandarisasi, dan terukur berdasarkan 5 pilar kompetensi teknis sebelum diberikan kewenangan rilis dokumen rekayasa.

2. PILAR PENILAIAN KOMPETENSI (5 DIMENSI):
1) Teori & Fondasi Rekayasa (20%): Penguasaan kode ASME (BPVC/B31.3), ASME Y14.5 GD&T, ISO 13849.
2) Penguasaan Software & Simulasi (25%): CAD parametrik 3D, FEA Ansys non-linear, CFD Fluent turbulensi.
3) Kemandirian & Problem Solving (25%): Investigasi kegagalan fatik/getaran, metodologi RCA 8D, DFMEA.
4) Manufakturabilitas & Realisasi (15%): DFM/DFA, toleransi stackup Monte Carlo, CNC tooling & cetakan.
5) Kredensial & Validasi Uji (15%): Sertifikasi resmi (CSWP, ASME GDTP, IPU PII), uji fisik korelasi deviasi <= 5%.

3. TINGKATAN LEVEL KOMPETENSI (L0 - L5):
- L0 (None): Belum ada eksposur / belum terlatih.
- L1 (Novice): Memahami konsep dasar; wajib supervisi langsung 100%.
- L2 (Developing): Mampu mengerjakan tugas rutin; membutuhkan bimbingan review desain.
- L3 (Competent): Mandiri tanpa supervisi teknis harian; wewenang rilis sub-assembly.
- L4 (Advanced): Menguasai anomali kompleks; bertindak sebagai Lead Reviewer dan mentor.
- L5 (Principal): Otoritas teknis tertinggi; merumuskan standar internal & memimpin inovasi.

4. ALUR EVALUASI BERKALA (QUARTERLY):
Tahap 1: Insinyur mengajukan Self-Assessment disertai portofolio & bukti uji.
Tahap 2: Supervisor melakukan verifikasi kelayakan teknis dan simulasi.
Tahap 3: Manajer melakukan wawancara teknis, menginput skor L0-L5, dan mengisi justifikasi audit ISO 9001.
Tahap 4: Sistem menerbitkan laporan otomatis IDP (Individual Development Plan) 30-60-90 hari.
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 print:p-0">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden print:border-none print:shadow-none flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Standar & Panduan Penilaian Keahlian Teknis
                </h3>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                  Khusus Manager
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rubrik penetapan kompetensi insinyur mesin berstandar ISO 9001:2015 Clause 7.2 & AS9100D.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak SOP</span>
            </button>
            <button
              onClick={copySopText}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin SOP'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-6 text-xs font-semibold shrink-0 no-print">
          <button
            onClick={() => setActiveTab('pillars')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'pillars'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>5 Pilar Penilaian Teknis</span>
          </button>
          <button
            onClick={() => setActiveTab('rubric')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'rubric'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Matriks Rubrik Level L0–L5</span>
          </button>
          <button
            onClick={() => setActiveTab('sop')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'sop'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Prosedur SOP & Alur 4 Tahap</span>
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'calculator'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Simulasi Pembobotan Skor</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 text-xs">
          {/* TAB 1: 5 PILAR PENILAIAN */}
          {activeTab === 'pillars' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Kerangka Dasar: Apa Saja yang Dinilai?
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Penetapan skor kompetensi staf insinyur mesin tidak semata-mata diukur dari lama masa kerja, melainkan diuji melalui integrasi 5 dimensi teknis terukur berikut ini:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pilar 1 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold flex items-center justify-center text-xs">
                      1
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Fondasi Teori Rekayasa & Standar Industri
                    </h5>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Pemahaman fundamental matematika rekayasa, termodinamika, mekanika fluida, mekanika bahan, serta kepatuhan standar internasional.
                  </p>
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Cakupan Penilaian:</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                      <li>ASME BPVC Section VIII (Bejana Tekan) & ASME B31.3 (Perpipaan Proses)</li>
                      <li>ASME Y14.5 / ISO 1101 untuk Geometric Dimensioning & Tolerancing (GD&T)</li>
                      <li>ISO 13849-1 (Keselamatan Mesin & Safety Integrity Level)</li>
                      <li>Kalkulasi analitis manual sebagai verifikasi awal (*sanity check*).</li>
                    </ul>
                  </div>
                </div>

                {/* Pilar 2 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                      2
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Kemahiran Software & Tooling Komputasi
                    </h5>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Kecakapan teknis dalam mengoperasikan perangkat lunak desain 3D, simulasi elemen hingga (FEA), dan dinamika fluida (CFD).
                  </p>
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Cakupan Penilaian:</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                      <li>CAD: SolidWorks / PTC Creo / Siemens NX (Master Model & Top-Down Assembly)</li>
                      <li>FEA: Ansys Mechanical (Mesh convergence, kontak nonlinier, dinamika getaran)</li>
                      <li>CFD: Ansys Fluent (Boundary layer y+, model turbulensi k-omega SST)</li>
                      <li>Otomasi: PLC Siemens TIA Portal & MATLAB / Simulink.</li>
                    </ul>
                  </div>
                </div>

                {/* Pilar 3 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                      3
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Kemandirian, Problem Solving & Investigasi Lapangan
                    </h5>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Tingkat kemandirian dalam mendiagnosis masalah rekayasa kompleks tanpa harus diarahkan langkah demi langkah oleh atasan.
                  </p>
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Cakupan Penilaian:</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                      <li>Root Cause Analysis (RCA) menggunakan metodologi 8D & Fishbone Diagram</li>
                      <li>Penyelidikan kegagalan fatik, getaran resonansi, kebocoran hidrolik</li>
                      <li>Kecepatan dan ketepatan mitigasi problem pada jalur perakitan atau lapangan.</li>
                    </ul>
                  </div>
                </div>

                {/* Pilar 4 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-xs">
                      4
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Manufakturabilitas & Realisasi Produk (DFM/DFA/RAMS)
                    </h5>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Kemampuan menghasilkan desain yang siap dibuat secara efisien di bengkel permesinan, cetakan, dan lini perakitan.
                  </p>
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Cakupan Penilaian:</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                      <li>Design for Manufacturing & Assembly (Boothroyd Dewhurst DFM/DFA)</li>
                      <li>Analisis akumulasi toleransi 1D & 3D Monte Carlo Stack-up</li>
                      <li>Penyusunan DFMEA/PFMEA dan perhitungan keandalan MTBF & RAMS.</li>
                    </ul>
                  </div>
                </div>

                {/* Pilar 5 */}
                <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs">
                      5
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Kredensial Resmi, Sertifikasi Profesi & Validasi Uji Fisik
                    </h5>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Bukti formal legalitas keahlian dan korelasi hasil simulasi terhadap data pengujian fisik riil di laboratorium rekayasa.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Sertifikasi yang Diakui:
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                        <li>Dassault Systèmes CSWP / CSWE</li>
                        <li>ASME GDTP Senior Technologist</li>
                        <li>Ansys Mechanical / Fluids Certified</li>
                        <li>PII Insinyur Profesional Madya/Utama (IPM/IPU)</li>
                      </ul>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Kriteria Validasi Eksperimental:
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                        <li>Korelasi strain gauge / load cell vs FEA dengan simpangan error $\le 5\%$</li>
                        <li>Pengujian chamber termal & shaker table getaran ISO 10816</li>
                        <li>Kemampuan kalibrasi DAQ (LabVIEW / Dewesoft).</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATRIKS RUBRIK LEVEL L0 - L5 */}
          {activeTab === 'rubric' && (
            <div className="space-y-4">
              <div className="text-slate-600 dark:text-slate-400 text-xs">
                Rubrik berikut merupakan kriteria baku yang wajib digunakan oleh Manajer dan Supervisor saat mengklik sel penilaian pada tabel matriks:
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100">
                      <th className="p-3 w-28">Level Skor</th>
                      <th className="p-3 w-40">Tingkat Kemandirian</th>
                      <th className="p-3">Kriteria Penilaian & Tanggung Jawab</th>
                      <th className="p-3 w-56">Bukti Kerja Wajib (Artifacts)</th>
                      <th className="p-3 w-36">Wewenang Tanda Tangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-400 bg-slate-50/80 dark:bg-slate-900/50">
                        L0 - None
                      </td>
                      <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">Belum Ada Eksposur</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        Belum pernah menerima pelatihan, sertifikasi, atau penugasan riil pada modul keahlian ini.
                      </td>
                      <td className="p-3 text-slate-500 italic">Tidak ada bukti kerja.</td>
                      <td className="p-3 text-rose-600 font-medium">Dilarang Rilis</td>
                    </tr>

                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20">
                        L1 - Novice
                      </td>
                      <td className="p-3 font-semibold text-amber-800 dark:text-amber-300">Dasar (Supervisi 100%)</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        Memahami konsep dasar teoritis; mampu mengerjakan tugas terstruktur di bawah bimbingan instruksional langkah demi langkah dari insinyur senior.
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        Logbook pelatihan internal, file latihan CAD dasar, atau laporan modul tutorial.
                      </td>
                      <td className="p-3 text-slate-500">Draf internal (non-release)</td>
                    </tr>

                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20">
                        L2 - Developing
                      </td>
                      <td className="p-3 font-semibold text-blue-800 dark:text-blue-300">Berkembang (Bimbingan Ringan)</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        Mampu menyelesaikan kalkulasi desain standar atau pemodelan komponen tunggal; memerlukan asistensi pada kondisi batas (boundary conditions) non-rutin.
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        Gambar kerja 2D detail dengan toleransi standar, file simulasi statis sederhana, sertifikat CSWA.
                      </td>
                      <td className="p-3 text-slate-500">Wajib paraf Lead Engineer</td>
                    </tr>

                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                        L3 - Competent
                      </td>
                      <td className="p-3 font-semibold text-emerald-800 dark:text-emerald-300">Mandiri (Autonomous)</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        Mampu mengeksekusi proyek rekayasa lengkap secara mandiri; menguasai pemodelan master assembly, validasi mesh FEA, atau CFD tanpa supervisi teknis harian.
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        Laporan teknis lengkap (FEA/CFD report), model CAD assembly kompleks bebas interference, sertifikat CSWP/ASME.
                      </td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">Rilis Komponen & Sub-Assembly</td>
                    </tr>

                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20">
                        L4 - Advanced
                      </td>
                      <td className="p-3 font-semibold text-indigo-800 dark:text-indigo-300">Mahir & Reviewer Tim</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        Menangani anomali non-standar (kegagalan fatik, kontak nonlinier, turbulensi ekstrem); bertindak sebagai Lead Reviewer dan mentor bagi insinyur L1–L3.
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        Dokumen DFMEA/PFMEA yang divalidasi, laporan audit GD&T, sertifikat CSWE / ASME Senior GDTP / Ansys Professional.
                      </td>
                      <td className="p-3 text-indigo-600 dark:text-indigo-400 font-semibold">Rilis Dokumen Produksi Final</td>
                    </tr>

                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-50/40 dark:bg-purple-950/20">
                        L5 - Expert
                      </td>
                      <td className="p-3 font-semibold text-purple-800 dark:text-purple-300">Pakar / Principal Specialist</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        Otoritas teknis tertinggi perusahaan; merumuskan metodologi SOP baku, memimpin inovasi paten/R&D, mewakili perusahaan pada audit sertifikasi atau klien multinasional.
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        Pedoman SOP desain internal, paten rekayasa terdaftar, korelasi uji fisik multi-proyek, sertifikat IPU / PII / Chartered.
                      </td>
                      <td className="p-3 text-purple-600 dark:text-purple-400 font-bold">Otoritas Desain Tertinggi (Chief)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PROSEDUR SOP & 4 TAHAP */}
          {activeTab === 'sop' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    SOP Penilaian Berkala Kompetensi (Quarterly Review Workflow)
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Setiap kuartal atau setelah proyek utama selesai, manajemen rekayasa menjalankan 4 tahap peninjauan terstruktur berikut untuk memastikan kepatuhan ISO 9001:2015 Clause 7.2 (Competence):
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Langkah 1 */}
                <div className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Tahap 1: Pengajuan Mandiri (Self-Assessment) oleh Insinyur
                    </h5>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Insinyur memilih kompetensi pada matriks, mengusulkan level baru (maksimal +1 dari level saat ini), menyertakan catatan justifikasi proyek riil, serta mengunggah salinan sertifikat atau laporan pengujian yang relevan.
                    </p>
                  </div>
                </div>

                {/* Langkah 2 */}
                <div className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Tahap 2: Peer Review & Verifikasi Teknis oleh Supervisor
                    </h5>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Supervisor memeriksa file desain (tree hierarchy, model assembly, setup boundary condition FEA/CFD). Supervisor memastikan data eksperimental valid dan bebas dari distorsi data sebelum diajukan ke Manajer.
                    </p>
                  </div>
                </div>

                {/* Langkah 3 */}
                <div className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Tahap 3: Wawancara Evaluasi & Pemberian Skor Resmi oleh Manajer
                    </h5>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Manajer (dengan otorisasi password <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-cyan-600">Eng159</code>) menetapkan skor final L0–L5. Manajer <strong>wajib mengisi alasan audit tertulis</strong> yang secara otomatis tercatat di Audit Trail kepatuhan AS9100.
                    </p>
                  </div>
                </div>

                {/* Langkah 4 */}
                <div className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Tahap 4: Penerbitan Dokumen IDP & Kurikulum Pelatihan 30-60-90 Hari
                    </h5>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Sistem secara otomatis mengidentifikasi gap terhadap target benchmark jabatan (Junior/Mid/Senior/Lead), menugaskan mentor internal, dan menyusun roadmap pelatihan 30-60-90 hari yang dapat dicetak atau diekspor ke PDF.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SIMULASI PEMBOBOTAN SKOR */}
          {activeTab === 'calculator' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Kalkulator Simulasi Skor Kompetensi Komposit
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Gunakan simulator ini untuk menguji bagaimana nilai dari kelima pilar dikonversikan menjadi skor rata-rata komposit dan rekomendasi level jabatan akhir:
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sliders Input */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Pilar 1 */}
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">1. Teori & Standar (Bobot: {weights.theory}%)</span>
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">L{calcScores.theory}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={calcScores.theory}
                      onChange={(e) => setCalcScores({ ...calcScores, theory: Number(e.target.value) })}
                      className="w-full accent-cyan-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>L0 (None)</span>
                      <span>L3 (Mandiri)</span>
                      <span>L5 (Pakar)</span>
                    </div>
                  </div>

                  {/* Pilar 2 */}
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">2. Software & Simulasi CAD/FEA/CFD (Bobot: {weights.software}%)</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">L{calcScores.software}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={calcScores.software}
                      onChange={(e) => setCalcScores({ ...calcScores, software: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>L0 (None)</span>
                      <span>L3 (Mandiri)</span>
                      <span>L5 (Pakar)</span>
                    </div>
                  </div>

                  {/* Pilar 3 */}
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">3. Problem Solving & Analisis Anomali (Bobot: {weights.problemSolving}%)</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">L{calcScores.problemSolving}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={calcScores.problemSolving}
                      onChange={(e) => setCalcScores({ ...calcScores, problemSolving: Number(e.target.value) })}
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>L0 (None)</span>
                      <span>L3 (Mandiri)</span>
                      <span>L5 (Pakar)</span>
                    </div>
                  </div>

                  {/* Pilar 4 */}
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">4. DFM / DFA & Keandalan RAMS (Bobot: {weights.dfm}%)</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">L{calcScores.dfm}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={calcScores.dfm}
                      onChange={(e) => setCalcScores({ ...calcScores, dfm: Number(e.target.value) })}
                      className="w-full accent-amber-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>L0 (None)</span>
                      <span>L3 (Mandiri)</span>
                      <span>L5 (Pakar)</span>
                    </div>
                  </div>

                  {/* Pilar 5 */}
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">5. Sertifikasi & Validasi Uji Lab (Bobot: {weights.cert}%)</span>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">L{calcScores.cert}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={calcScores.cert}
                      onChange={(e) => setCalcScores({ ...calcScores, cert: Number(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>L0 (None)</span>
                      <span>L3 (Mandiri)</span>
                      <span>L5 (Pakar)</span>
                    </div>
                  </div>
                </div>

                {/* Score Summary Card */}
                <div className="lg:col-span-5 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Hasil Kalkulasi Skor Komposit
                    </span>
                    <div className="text-3xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400 mt-2">
                      {totalWeightedScore} <span className="text-sm font-normal text-slate-400">/ 5.00</span>
                    </div>
                    <div className="text-xs font-bold mt-2 flex items-center gap-1.5">
                      <span>Rekomendasi Level:</span>
                      <span className={recommendedLevel.color}>{recommendedLevel.title}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1.5">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      Rekomendasi Wewenang Rilis:
                    </div>
                    <p>
                      {totalWeightedScore >= 4.5
                        ? 'Memiliki wewenang mutlak untuk menandatangani gambar produksi final, merilis dokumen DFMEA tingkat master, dan mengesahkan revisi engineering.'
                        : totalWeightedScore >= 3.6
                        ? 'Berwenang merilis dokumen produksi dan sub-assembly, serta bertindak sebagai checker/reviewer resmi gambar teknik.'
                        : totalWeightedScore >= 2.6
                        ? 'Berwenang merilis komponen tunggal dan gambar manufaktur dengan paraf review dari Lead Insinyur.'
                        : 'Hasil kerja harus selalu melalui supervisi dan verifikasi menyeluruh sebelum masuk ke jalur produksi.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            SOP-ENG-MAT-001 Rev 2.1 · Dokumen Rahasia Manajerial
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
