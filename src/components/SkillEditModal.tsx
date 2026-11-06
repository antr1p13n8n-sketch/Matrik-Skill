import React, { useState } from 'react';
import { Engineer, SkillDefinition, SkillLevel, SKILL_LEVEL_LABELS } from '../types/skills';
import { X, Check, ShieldAlert } from 'lucide-react';

interface SkillEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineer: Engineer | null;
  skill: SkillDefinition | null;
  onSave: (engineerId: string, skillId: string, newLevel: SkillLevel, reason: string) => void;
}

export const SkillEditModal: React.FC<SkillEditModalProps> = ({
  isOpen,
  onClose,
  engineer,
  skill,
  onSave,
}) => {
  if (!isOpen || !engineer || !skill) return null;

  const currentLevel = (engineer.skills[skill.id] ?? 0) as SkillLevel;
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>(currentLevel);
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(engineer.id, skill.id, selectedLevel, reason || 'Penyesuaian evaluasi manajerial berkala');
    onClose();
  };

  const levels: SkillLevel[] = [0, 1, 2, 3, 4, 5];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 text-slate-800 dark:text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-500">Evaluasi Manajerial</div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Ubah Tingkat Kompetensi Teknis
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Insinyur:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{engineer.name}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-slate-500">Kompetensi:</span>
              <span className="font-medium text-cyan-700 dark:text-cyan-400">{skill.name}</span>
            </div>
            {skill.unitOrStandard && (
              <div className="flex justify-between items-center mt-1 text-[11px]">
                <span className="text-slate-500">Standar / Acuan:</span>
                <span className="text-slate-600 dark:text-slate-400 font-mono">{skill.unitOrStandard}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Pilih Skala Penguasaan (Rubrik 0 - 5)
            </label>
            <div className="space-y-2">
              {levels.map((lvl) => {
                const info = SKILL_LEVEL_LABELS[lvl];
                const isSelected = selectedLevel === lvl;
                return (
                  <div
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="mt-0.5">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                          isSelected
                            ? 'border-cyan-600 bg-cyan-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 text-slate-500'
                        }`}
                      >
                        {lvl}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                        <span>{info.labelId}</span>
                        {currentLevel === lvl && (
                          <span className="text-[10px] text-slate-400 font-normal">Level Saat Ini</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {info.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alasan Perubahan / Catatan Audit
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Selesai sertifikasi ASME GDTP Senior / Telah memimpin validasi FEA turbin independen."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Evaluasi & Catat Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
