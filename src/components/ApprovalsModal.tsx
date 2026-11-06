import React from 'react';
import { Engineer, SkillDefinition } from '../types/skills';
import { X, Check, ArrowRight, UserCheck } from 'lucide-react';

interface PendingApprovalItem {
  engineerId: string;
  engineerName: string;
  skillId: string;
  skillName: string;
  currentLevel: number;
  proposedLevel: number;
  notes: string;
  submittedAt: string;
}

interface ApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingItems: PendingApprovalItem[];
  onApprove: (engineerId: string, skillId: string, level: number, notes: string) => void;
  onReject: (engineerId: string, skillId: string) => void;
}

export const ApprovalsModal: React.FC<ApprovalsModalProps> = ({
  isOpen,
  onClose,
  pendingItems,
  onApprove,
  onReject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 text-slate-800 dark:text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-[11px] font-mono uppercase text-amber-600 dark:text-amber-400">
              Verifikasi Kompetensi
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-500" />
              <span>Daftar Pengajuan Penilaian Mandiri Insinyur</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3">
          {pendingItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Tidak ada pengajuan penilaian mandiri yang menunggu verifikasi saat ini.
            </div>
          ) : (
            pendingItems.map((item) => (
              <div
                key={`${item.engineerId}-${item.skillId}`}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.engineerName}</span>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="font-medium text-cyan-700 dark:text-cyan-400">{item.skillName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500">L{item.currentLevel}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      L{item.proposedLevel}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300">
                  <div className="text-[10px] text-slate-400 mb-0.5">Bukti Proyek / Catatan Insinyur:</div>
                  <div className="italic">"{item.notes}"</div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Diajukan pada: {item.submittedAt}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onReject(item.engineerId, item.skillId)}
                      className="px-2.5 py-1 rounded text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => onApprove(item.engineerId, item.skillId, item.proposedLevel, item.notes)}
                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3 h-3" />
                      <span>Setujui Perubahan</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
