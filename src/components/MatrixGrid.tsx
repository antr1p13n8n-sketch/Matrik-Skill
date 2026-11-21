import React, { useState } from 'react';
import { 
  Engineer, 
  SkillDefinition, 
  SkillCategory, 
  CurrentUser, 
  SkillLevel,
  SKILL_LEVEL_LABELS 
} from '../types/skills';
import { SKILL_CATEGORIES } from '../data/initialData';
import { DOMAIN_COLOR_MAP, getAvatarGradient } from '../utils/domainColors';
import { Search, AlertTriangle, Download, Filter, HelpCircle, Sparkles, CheckCircle2, UserPlus, Edit3, Settings, Award } from 'lucide-react';

interface MatrixGridProps {
  engineers: Engineer[];
  skills: SkillDefinition[];
  currentUser: CurrentUser;
  onSelectCell: (engineer: Engineer, skill: SkillDefinition) => void;
  onOpenReport: (engineer: Engineer) => void;
  onAddStaff?: () => void;
  onEditStaff?: (engineer: Engineer) => void;
}

export const MatrixGrid: React.FC<MatrixGridProps> = ({
  engineers,
  skills,
  currentUser,
  onSelectCell,
  onOpenReport,
  onAddStaff,
  onEditStaff,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBottlenecksOnly, setFilterBottlenecksOnly] = useState(false);

  // Filter skills based on category and search
  const filteredSkills = skills.filter((skill) => {
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    const matchesSearch = 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.unitOrStandard?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate single point of failure (SPOF): skills where only 0 or 1 engineer has Level >= 3
  const spofSkillIds = new Set<string>();
  skills.forEach((skill) => {
    const competentCount = engineers.filter((eng) => (eng.skills[skill.id] ?? 0) >= 3).length;
    if (competentCount <= 1) {
      spofSkillIds.add(skill.id);
    }
  });

  const displayedSkills = filterBottlenecksOnly 
    ? filteredSkills.filter((s) => spofSkillIds.has(s.id))
    : filteredSkills;

  // Level cell style helper
  const getLevelBadgeStyle = (level: SkillLevel) => {
    switch (level) {
      case 5:
        return 'bg-linear-to-br from-fuchsia-500/20 via-purple-500/20 to-indigo-500/20 dark:from-fuchsia-600/35 dark:to-purple-600/35 text-purple-800 dark:text-purple-200 border-purple-300/90 dark:border-purple-600/70 font-bold';
      case 4:
        return 'bg-linear-to-br from-indigo-500/15 to-blue-500/20 dark:from-indigo-600/30 dark:to-blue-600/30 text-indigo-800 dark:text-indigo-200 border-indigo-300/80 dark:border-indigo-600/60 font-bold';
      case 3:
        return 'bg-linear-to-br from-emerald-500/15 to-teal-500/20 dark:from-emerald-600/30 dark:to-teal-600/30 text-emerald-800 dark:text-emerald-200 border-emerald-300/80 dark:border-emerald-600/60 font-semibold';
      case 2:
        return 'bg-linear-to-br from-sky-500/15 to-cyan-500/15 dark:from-sky-600/25 dark:to-cyan-600/25 text-sky-800 dark:text-sky-200 border-sky-300/80 dark:border-sky-700/60 font-medium';
      case 1:
        return 'bg-linear-to-br from-amber-500/15 to-orange-500/15 dark:from-amber-600/25 dark:to-orange-600/25 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/60 font-medium';
      default:
        return 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-slate-700';
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID Insinyur', 'Nama Lengkap', 'Jabatan', 'Departemen', ...skills.map((s) => `"${s.name}"`)];
    const rows = engineers.map((eng) => [
      eng.id,
      `"${eng.name}"`,
      `"${eng.roleTitle}"`,
      `"${eng.department}"`,
      ...skills.map((s) => eng.skills[s.id] ?? 0),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MechMatrix_Kompetensi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4">
      {/* Bottleneck Warning Banner */}
      {spofSkillIds.size > 0 && (
        <div className="p-3.5 rounded-xl border border-amber-300/80 dark:border-amber-700/70 bg-linear-to-r from-amber-50 via-orange-50/70 to-rose-50/60 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/20 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-linear-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Deteksi Risiko Bottleneck Rekayasa (Single Point of Failure):
              </span>{' '}
              <span className="text-amber-800 dark:text-amber-300">
                Ditemukan <strong>{spofSkillIds.size} kompetensi</strong> di mana hanya ada &le; 1 insinyur mandiri (Level &ge; 3). Risiko ketergantungan personil tinggi.
              </span>
            </div>
          </div>
          <button
            onClick={() => setFilterBottlenecksOnly(!filterBottlenecksOnly)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterBottlenecksOnly
                ? 'bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-sm'
                : 'bg-white/90 dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100/70'
            }`}
          >
            {filterBottlenecksOnly ? 'Tampilkan Semua Kompetensi' : 'Filter Kritis (SPOF Saja)'}
          </button>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-cyan-600 dark:text-cyan-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari keahlian teknis (GD&T, FEA, CFD, PLC)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer border ${
              selectedCategory === 'all'
                ? 'bg-linear-to-r from-cyan-500 via-sky-500 to-indigo-600 text-white border-transparent shadow-sm shadow-cyan-500/25'
                : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200/70'
            }`}
          >
            Semua ({skills.length})
          </button>
          {SKILL_CATEGORIES.map((cat) => {
            const theme = DOMAIN_COLOR_MAP[cat.id];
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1.5 text-xs rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                  isSelected ? theme.pillActive : theme.pillIdle
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : theme.dot}`} />
                <span>{cat.shortName}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {currentUser.roleType === 'manager' && onAddStaff && (
            <button
              onClick={onAddStaff}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-linear-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white text-xs font-semibold transition-all whitespace-nowrap shadow-sm shadow-cyan-500/25 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Input Staff Baru</span>
            </button>
          )}

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300/80 dark:border-emerald-700/70 bg-emerald-50/70 dark:bg-emerald-950/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* High-Density Matrix Table */}
      <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-linear-to-r from-slate-50 via-cyan-50/40 to-indigo-50/40 dark:from-slate-850 dark:via-slate-900 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
                {/* Fixed column: Engineer info */}
                <th className="p-3 font-bold text-slate-800 dark:text-slate-200 sticky left-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 min-w-[240px] shadow-xs">
                  Insinyur & Peran Jabatan
                </th>
                <th className="p-3 font-bold text-slate-800 dark:text-slate-200 text-center min-w-[120px]">
                  Laporan IDP
                </th>

                {/* Skill Columns */}
                {displayedSkills.map((skill) => {
                  const isSPOF = spofSkillIds.has(skill.id);
                  const catTheme = DOMAIN_COLOR_MAP[skill.category];
                  return (
                    <th
                      key={skill.id}
                      className={`p-2.5 font-medium border-l border-slate-200/80 dark:border-slate-800 min-w-[132px] max-w-[162px] ${
                        isSPOF ? 'bg-amber-50/70 dark:bg-amber-950/25' : catTheme.headerTint
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${catTheme.dot}`} />
                          {isSPOF && (
                            <span title="Kritis: Single point of failure (SPOF)">
                              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                            </span>
                          )}
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate" title={skill.name}>
                            {skill.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate pl-3.5">
                          {skill.unitOrStandard || skill.category}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {engineers.map((engineer) => {
                const isCurrentSelf = currentUser.engineerId === engineer.id;

                return (
                  <tr
                    key={engineer.id}
                    className={`transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                      isCurrentSelf ? 'bg-cyan-50/30 dark:bg-cyan-950/10' : ''
                    }`}
                  >
                    {/* Engineer Row Header */}
                    <td className="p-3 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-xs border-r border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        {engineer.avatarUrl ? (
                          <img
                            src={engineer.avatarUrl}
                            alt={engineer.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-full bg-linear-to-br ${getAvatarGradient(engineer.name)} flex items-center justify-center text-white font-bold shrink-0 text-xs shadow-xs`}>
                            {engineer.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                        )}
                        <div className="truncate flex-1">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-1.5 truncate">
                            <span className="truncate">{engineer.name}</span>
                            {(currentUser.roleType === 'manager' || currentUser.roleType === 'supervisor') && onEditStaff && (
                              <button
                                onClick={() => onEditStaff(engineer)}
                                className="p-1 rounded-md hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-400 hover:text-cyan-600 transition-colors shrink-0 cursor-pointer"
                                title={currentUser.roleType === 'supervisor' ? 'Ajukan Edit Data Staff (Perlu Persetujuan Manager)' : 'Edit Data Staff Insinyur'}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            <span className="truncate">{engineer.roleTitle}</span>
                            {engineer.certificates && engineer.certificates.length > 0 && (
                              <span 
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[9px] font-semibold shrink-0" 
                                title={`${engineer.certificates.length} Sertifikat Terverifikasi`}
                              >
                                <Award className="w-2.5 h-2.5" />
                                <span>{engineer.certificates.length}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Report Trigger Button */}
                    <td className="p-2 text-center border-r border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => onOpenReport(engineer)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-linear-to-r from-cyan-50 to-indigo-50 dark:from-cyan-950/40 dark:to-indigo-950/40 hover:from-cyan-500 hover:to-indigo-600 hover:text-white text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/60 transition-all whitespace-nowrap cursor-pointer"
                        title="Buka Laporan Pengembangan Otomatis"
                      >
                        Lihat IDP
                      </button>
                    </td>

                    {/* Skill Matrix Cells */}
                    {displayedSkills.map((skill) => {
                      const level = (engineer.skills[skill.id] ?? 0) as SkillLevel;
                      const hasPendingSelf = engineer.selfAssessments?.[skill.id]?.status === 'pending';
                      const badgeStyle = getLevelBadgeStyle(level);
                      const isManager = currentUser.roleType === 'manager';
                      const isSupervisor = currentUser.roleType === 'supervisor';
                      const canEditThis = isManager || isSupervisor;

                      return (
                        <td
                          key={skill.id}
                          className="p-1.5 text-center border-l border-slate-100 dark:border-slate-800/60"
                        >
                          <button
                            onClick={() => onSelectCell(engineer, skill)}
                            title={
                              canEditThis
                                ? `Klik untuk evaluasi kompetensi (${isManager ? 'Manager' : 'Supervisor'})`
                                : `Lihat rincian keahlian ${skill.name}`
                            }
                            className={`w-full py-1.5 px-2 rounded-lg border text-xs transition-all flex items-center justify-center gap-1 relative ${badgeStyle} ${
                              canEditThis ? 'hover:scale-105 cursor-pointer shadow-2xs' : 'cursor-pointer hover:opacity-85'
                            }`}
                          >
                            <span className="font-mono tabular-nums">L{level}</span>
                            {hasPendingSelf && (
                              <span
                                className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-rose-500 to-amber-500 absolute -top-1 -right-1 ring-2 ring-white dark:ring-slate-900"
                                title="Pengajuan mandiri menunggu review"
                              />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Matrix Legend Footer */}
        <div className="p-3.5 bg-linear-to-r from-slate-50 via-cyan-50/30 to-violet-50/30 dark:from-slate-850 dark:via-slate-900 dark:to-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Skala Kompetensi:</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 font-medium">L0 Belum Ada</span>
            <span className="px-2 py-0.5 rounded-md bg-linear-to-r from-amber-500/15 to-orange-500/15 text-amber-800 dark:text-amber-300 border border-amber-300/70 font-medium">L1 Dasar</span>
            <span className="px-2 py-0.5 rounded-md bg-linear-to-r from-sky-500/15 to-cyan-500/15 text-sky-800 dark:text-sky-300 border border-sky-300/70 font-medium">L2 Berkembang</span>
            <span className="px-2 py-0.5 rounded-md bg-linear-to-r from-emerald-500/15 to-teal-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300/70 font-semibold">L3 Mandiri</span>
            <span className="px-2 py-0.5 rounded-md bg-linear-to-r from-indigo-500/15 to-blue-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-300/70 font-semibold">L4 Mahir</span>
            <span className="px-2 py-0.5 rounded-md bg-linear-to-r from-fuchsia-500/20 to-purple-500/20 text-purple-800 dark:text-purple-200 border border-purple-300/80 font-bold">L5 Ahli/Mentor</span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Ikon Segitiga = Single Point of Failure (SPOF)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
