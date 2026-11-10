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
        return 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-bold';
      case 4:
        return 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-bold';
      case 3:
        return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold';
      case 2:
        return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900 font-medium';
      case 1:
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700';
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
        <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Deteksi Risiko Bottleneck Rekayasa (Single Point of Failure):
              </span>{' '}
              <span className="text-amber-800 dark:text-amber-300">
                Ditemukan <strong>{spofSkillIds.size} kompetensi</strong> di mana hanya ada $\le$ 1 insinyur mandiri (Level $\ge$ 3). Risiko ketergantungan personil tinggi.
              </span>
            </div>
          </div>
          <button
            onClick={() => setFilterBottlenecksOnly(!filterBottlenecksOnly)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterBottlenecksOnly
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100'
            }`}
          >
            {filterBottlenecksOnly ? 'Tampilkan Semua Kompetensi' : 'Filter Kritis (SPOF Saja)'}
          </button>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari keahlian teknis (GD&T, FEA, CFD, PLC)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Semua ({skills.length})
          </button>
          {SKILL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {cat.shortName}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {currentUser.roleType === 'manager' && onAddStaff && (
            <button
              onClick={onAddStaff}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Input Staff Baru</span>
            </button>
          )}

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* High-Density Matrix Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
                {/* Fixed column: Engineer info */}
                <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 sticky left-0 bg-slate-50 dark:bg-slate-850 z-10 min-w-[240px] shadow-xs">
                  Insinyur & Peran Jabatan
                </th>
                <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 text-center min-w-[120px]">
                  Laporan IDP
                </th>

                {/* Skill Columns */}
                {displayedSkills.map((skill) => {
                  const isSPOF = spofSkillIds.has(skill.id);
                  return (
                    <th
                      key={skill.id}
                      className={`p-2.5 font-medium border-l border-slate-200 dark:border-slate-800 min-w-[130px] max-w-[160px] ${
                        isSPOF ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          {isSPOF && (
                            <span title="Kritis: Single point of failure (SPOF)">
                              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                            </span>
                          )}
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={skill.name}>
                            {skill.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
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
                          <div className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-700 dark:text-cyan-300 font-bold shrink-0 text-xs">
                            {engineer.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                        )}
                        <div className="truncate flex-1">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-1.5 truncate">
                            <span className="truncate">{engineer.name}</span>
                            {(currentUser.roleType === 'manager' || currentUser.roleType === 'supervisor') && onEditStaff && (
                              <button
                                onClick={() => onEditStaff(engineer)}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-cyan-600 transition-colors shrink-0"
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
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-medium shrink-0" 
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
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-cyan-950/50 dark:hover:text-cyan-300 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap"
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
                            className={`w-full py-1.5 px-2 rounded-md border text-xs transition-all flex items-center justify-center gap-1 relative ${badgeStyle} ${
                              canEditThis ? 'hover:scale-105 cursor-pointer shadow-2xs' : 'cursor-pointer hover:opacity-85'
                            }`}
                          >
                            <span className="font-mono">L{level}</span>
                            {hasPendingSelf && (
                              <span
                                className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5 ring-2 ring-white dark:ring-slate-900 animate-pulse"
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
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Skala Kompetensi:</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200">L0 Belum Ada</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 border border-amber-200">L1 Dasar</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 border border-blue-200">L2 Berkembang</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border border-emerald-200">L3 Mandiri</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 border border-indigo-200">L4 Mahir</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 border border-purple-200">L5 Ahli/Mentor</span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Ikon Segitiga = Single Point of Failure (SPOF)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
