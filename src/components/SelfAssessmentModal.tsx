import React, { useState } from 'react';
import { Engineer, SkillDefinition, SkillLevel, SKILL_LEVEL_LABELS } from '../types/skills';
import { X, Send, Award, FileText } from 'lucide-react';

interface SelfAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineer: Engineer | null;
  skill: SkillDefinition | null;
  onSubmitSelfAssessment: (engineerId: string, skillId: string, proposedLevel: SkillLevel, notes: string) => void;
}

export const SelfAssessmentModal: React.FC<SelfAssessmentModalProps> = ({
  isOpen,
  onClose,
  engineer,
  skill,
  onSubmitSelfAssessment,
}) => {
  if (!isOpen || !engineer || !skill) return null;

  const currentLevel = (engineer.skills[skill.id] ?? 0) as SkillLevel;
  const existingAssessment = engineer.selfAssessments?.[skill.id];

  const [proposedLevel, setProposedLevel] = useState<SkillLevel>(
    existingAssessment ? existingAssessment.proposedLevel : Math.min(5, currentLevel + 1) as SkillLevel
  );
  const [notes, setNotes] = useState(existingAssessment ? existingAssessment.notes : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      alert('Mohon cantumkan bukti proyek atau sertifikasi untuk diajukan ke manajer.');
      return;
    }
    onSubmitSelfAssessment(engineer.id, skill.id, proposedLevel, notes);
    onClose();
  };

  const levels: SkillLevel[] = [1, 2, 3, 4, 5];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 text-slate-800 dark:text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-[11px] font-mono uppercase text-cyan-600 dark:text-cyan-400">
              Formulir Penilaian Mandiri Insinyur
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Ajukan Peningkatan Level Kompetensi
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
          <div className="p-3.5 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 text-xs">
            <div className="font-semibold text-slate-900 dark:text-slate-100">{skill.name}</div>
            <div className="text-slate-600 dark:text-slate-400 mt-1">{skill.description}</div>
            <div className="flex items-center gap-3 mt-2 text-[11px] font-mono">
              <span className="text-slate-500">Level Saat Ini: L{currentLevel}</span>
              <span>·</span>
              <span className="text-amber-600 dark:text-amber-400">Target Role: L{skill.targetByRole.senior}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Tingkat yang Anda Ajukan:
            </label>
            <div className="grid grid-cols-5 gap-2">
              {levels.map((lvl) => {
                const isSelected = proposedLevel === lvl;
                return (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setProposedLevel(lvl)}
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-cyan-600 bg-cyan-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold">L{lvl}</div>
                    <div className="text-[10px] opacity-80 truncate">{SKILL_LEVEL_LABELS[lvl].label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Portofolio Proyek, Hasil Pengujian, atau Sertifikat Pendukung
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jelaskan kontribusi teknis terbaru Anda (misal: Selesai simulasi thermal housing baterai 200W, lulus validasi suhu operasional < 65°C, nomor proyek AE-2026-04)."
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-start gap-2">
            <Award className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <span>
              Pengajuan ini akan dikirimkan secara real-time ke antrean verifikasi Engineering Manager untuk di-review dan divalidasi ke dalam matriks resmi tim.
            </span>
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
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Pengajuan Mandiri</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
