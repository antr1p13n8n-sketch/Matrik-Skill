import { Engineer, SkillDefinition, DevelopmentReport, SkillCategory } from '../types/skills';
import { SKILL_CATEGORIES, SKILL_DEFINITIONS, INITIAL_BENCHMARK_TARGETS } from '../data/initialData';

export function generateAutomatedReport(
  engineer: Engineer,
  allEngineers: Engineer[],
  allSkills: SkillDefinition[] = SKILL_DEFINITIONS,
  customTargets?: Record<string, number>
): DevelopmentReport {
  const benchmarkTargets = customTargets || INITIAL_BENCHMARK_TARGETS[engineer.targetBenchmark] || INITIAL_BENCHMARK_TARGETS.senior_mechanical;

  // 1. Calculate domain category scores
  const categoryScores: Record<SkillCategory, { totalActual: number; totalTarget: number; count: number }> = {
    cad_design: { totalActual: 0, totalTarget: 0, count: 0 },
    structural_fea: { totalActual: 0, totalTarget: 0, count: 0 },
    thermal_cfd: { totalActual: 0, totalTarget: 0, count: 0 },
    materials_mfg: { totalActual: 0, totalTarget: 0, count: 0 },
    mechatronics: { totalActual: 0, totalTarget: 0, count: 0 },
    quality_reliability: { totalActual: 0, totalTarget: 0, count: 0 },
    standards_compliance: { totalActual: 0, totalTarget: 0, count: 0 },
  };

  let totalActualSum = 0;
  let totalTargetSum = 0;
  let gapCount = 0;
  let strengthCount = 0;

  const criticalGaps: DevelopmentReport['criticalGaps'] = [];

  allSkills.forEach((skill) => {
    const actual = engineer.skills[skill.id] ?? 0;
    const target = benchmarkTargets[skill.id] ?? 3;

    if (categoryScores[skill.category]) {
      categoryScores[skill.category].totalActual += actual;
      categoryScores[skill.category].totalTarget += target;
      categoryScores[skill.category].count += 1;
    }

    totalActualSum += actual;
    totalTargetSum += target;

    if (actual < target) {
      gapCount += 1;
      const deficit = target - actual;

      // Find peers who are Level 4 or 5 in this skill
      const mentors = allEngineers
        .filter((peer) => peer.id !== engineer.id && (peer.skills[skill.id] ?? 0) >= 4)
        .map((peer) => `${peer.name} (${peer.roleTitle})`);

      criticalGaps.push({
        skillId: skill.id,
        skillName: skill.name,
        categoryName: SKILL_CATEGORIES.find((c) => c.id === skill.category)?.shortName || skill.category,
        currentLevel: actual,
        requiredLevel: target,
        deficit,
        recommendedMentors: mentors.length > 0 ? mentors : ['External Industry Training / Specialist Consultant'],
        certificationPath: skill.certifications || [],
      });
    } else if (actual >= 4) {
      strengthCount += 1;
    }
  });

  // Sort critical gaps by deficit descending
  criticalGaps.sort((a, b) => b.deficit - a.deficit);

  const radarDomainScores = SKILL_CATEGORIES.map((cat) => {
    const stat = categoryScores[cat.id];
    const avgActual = stat.count > 0 ? Number((stat.totalActual / stat.count).toFixed(2)) : 0;
    const avgTarget = stat.count > 0 ? Number((stat.totalTarget / stat.count).toFixed(2)) : 0;
    return {
      category: cat.id,
      categoryName: cat.shortName,
      actualScore: avgActual,
      targetScore: avgTarget,
      gap: Number((avgActual - avgTarget).toFixed(2)),
    };
  });

  const averageScore = allSkills.length > 0 ? Number((totalActualSum / allSkills.length).toFixed(2)) : 0;
  const targetScore = allSkills.length > 0 ? Number((totalTargetSum / allSkills.length).toFixed(2)) : 0;

  // Generate 30-60-90 day milestone recommendations
  const topGaps = criticalGaps.slice(0, 3);
  const phase30Days: string[] = [];
  const phase60Days: string[] = [];
  const phase90Days: string[] = [];

  if (topGaps.length === 0) {
    phase30Days.push('Pertahankan keunggulan teknis melalui technical peer-review untuk proyek berjalan.');
    phase60Days.push('Ambil peran sebagai Lead Mentor untuk mendampingi Junior & Mid Engineers.');
    phase90Days.push('Presentasikan technical whitepaper internal atau standarisasi best practice divisi.');
  } else {
    topGaps.forEach((gap, idx) => {
      if (idx === 0) {
        phase30Days.push(`Pelajari modul fundamental & standar referensi untuk "${gap.skillName}" (Defisit: ${gap.deficit} level).`);
        phase30Days.push(`Jadwalkan sesi onboarding & mentoring bersama mentor pendamping: ${gap.recommendedMentors[0]}.`);
        phase60Days.push(`Eksekusi studi kasus riil proyek CAD/FEA/CFD yang menerapkan "${gap.skillName}" di bawah supervisi.`);
        phase90Days.push(`Ajukan sertifikasi kompetensi formal atau evaluasi mandiri level ${gap.requiredLevel}: ${gap.certificationPath[0] || 'Internal Audit'}.`);
      } else if (idx === 1) {
        phase30Days.push(`Review dokumentasi prosedur standar (SOP/Work Instruction) untuk ${gap.skillName}.`);
        phase60Days.push(`Selesaikan 2 tugas kalkulasi teknis atau simulasi independen dengan validasi mentor.`);
        phase90Days.push(`Presentasikan hasil verifikasi desain pada forum Technical Review tim mingguan.`);
      } else {
        phase60Days.push(`Ikuti lokakarya intensif atau pelatihan online pendukung untuk ${gap.skillName}.`);
        phase90Days.push(`Lakukan evaluasi ulang matriks kompetensi bersama Engineering Manager.`);
      }
    });
  }

  return {
    engineerId: engineer.id,
    engineerName: engineer.name,
    roleTitle: engineer.roleTitle,
    generatedDate: new Date().toISOString().split('T')[0],
    summary: {
      totalSkillsTracked: allSkills.length,
      averageScore,
      targetScore,
      gapCount,
      strengthCount,
    },
    radarDomainScores,
    criticalGaps,
    actionPlan: {
      phase30Days,
      phase60Days,
      phase90Days,
    },
  };
}

export function formatReportAsMarkdown(report: DevelopmentReport): string {
  return `# LAPORAN PENGEMBANGAN TEKNIS INDIVIDUAL (IDP)
**PT AEROTECH ENGINEERING INDONESIA**
*Divisi Rekayasa Mekanikal & Otomasi*

---

### Informasi Rekayasa
- **Nama Insinyur**: ${report.engineerName}
- **Posisi / Jabatan**: ${report.roleTitle}
- **Tanggal Diterbitkan**: ${report.generatedDate}
- **Rata-rata Skor Aktual**: ${report.summary.averageScore} / 5.0
- **Target Benchmark**: ${report.summary.targetScore} / 5.0
- **Jumlah Kesenjangan Kompetensi**: ${report.summary.gapCount} dari ${report.summary.totalSkillsTracked} kompetensi
- **Area Keunggulan (Level 4-5)**: ${report.summary.strengthCount} kompetensi

---

### Ringkasan Domain Teknik (Radar Matrix)
| Domain Rekayasa | Skor Aktual | Target Benchmark | Status Gap |
|---|---|---|---|
${report.radarDomainScores
  .map(
    (r) =>
      `| ${r.categoryName} | ${r.actualScore} / 5.0 | ${r.targetScore} / 5.0 | ${
        r.gap >= 0 ? `+${r.gap} (Memenuhi)` : `${r.gap} (Kesenjangan)`
      } |`
  )
  .join('\n')}

---

### Daftar Prioritas Kesenjangan Kompetensi (Actionable Gaps)
${
  report.criticalGaps.length === 0
    ? '*Semua kompetensi teknis telah memenuhi atau melampaui benchmark jabatan.*'
    : report.criticalGaps
        .map(
          (g, idx) => `
#### ${idx + 1}. ${g.skillName} (${g.categoryName})
- **Level Saat Ini**: Level ${g.currentLevel} $\\rightarrow$ **Target**: Level ${g.requiredLevel} (Defisit: ${g.deficit} level)
- **Rekomendasi Mentor Internal**: ${g.recommendedMentors.join(', ')}
- **Jalur Sertifikasi / Standar**: ${g.certificationPath.join(' / ')}
`
        )
        .join('\n')
}

---

### Rencana Aksi Pengembangan Terstruktur (30-60-90 Hari)
#### Fase 30 Hari Pertama (Fondasi & Teori)
${report.actionPlan.phase30Days.map((a) => `- [ ] ${a}`).join('\n')}

#### Fase 60 Hari Kedua (Penerapan Proyek Nyata)
${report.actionPlan.phase60Days.map((a) => `- [ ] ${a}`).join('\n')}

#### Fase 90 Hari Ketiga (Validasi, Sertifikasi & Review Akhir)
${report.actionPlan.phase90Days.map((a) => `- [ ] ${a}`).join('\n')}

---
*Laporan ini dihasilkan secara otomatis oleh MechMatrix Competency Management System.*
`;
}
