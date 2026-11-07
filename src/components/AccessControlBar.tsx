import React, { useState } from 'react';
import { CurrentUser, UserRoleType } from '../types/skills';
import { INITIAL_USERS } from '../data/initialData';
import { ShieldCheck, UserCheck, Eye, ChevronDown, Check, BookOpen, Lock, Unlock, Flame, Database } from 'lucide-react';

interface AccessControlBarProps {
  currentUser: CurrentUser;
  onUserChangeRequest: (user: CurrentUser) => void;
  pendingApprovalsCount: number;
  onOpenApprovals: () => void;
  onOpenAuditLogs: () => void;
  onOpenAssessmentStandard: () => void;
  onLockRole: () => void;
  isManagerUnlocked: boolean;
  isSupervisorUnlocked: boolean;
  onOpenFirebaseConfig?: () => void;
  onOpenSqlDatabase?: () => void;
}

export const AccessControlBar: React.FC<AccessControlBarProps> = ({
  currentUser,
  onUserChangeRequest,
  pendingApprovalsCount,
  onOpenApprovals,
  onOpenAuditLogs,
  onOpenAssessmentStandard,
  onLockRole,
  isManagerUnlocked,
  isSupervisorUnlocked,
  onOpenFirebaseConfig,
  onOpenSqlDatabase,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadge = (role: UserRoleType) => {
    switch (role) {
      case 'manager':
        return {
          label: 'Manager (Akses Penuh)',
          desc: 'Akses penuh: input staff baru, edit profil & sertifikat, evaluasi skor, persetujuan mandiri, dan standar penilaian teknis.',
          color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        };
      case 'supervisor':
        return {
          label: 'Supervisor (Penyelia Teknis)',
          desc: 'Akses evaluasi kompetensi staff L0-L5, review penilaian mandiri, dan verifikasi teknis.',
          color: 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
        };
      case 'viewer':
      default:
        return {
          label: 'Viewer (Hanya Lihat)',
          desc: 'Akses read-only untuk melihat matriks, spider chart, dan laporan tanpa hak modifikasi.',
          color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const currentBadge = getRoleBadge(currentUser.roleType);

  const ROLE_OPTIONS: {
    roleType: UserRoleType;
    label: string;
    desc: string;
    colorDot: string;
  }[] = [
    {
      roleType: 'viewer',
      label: 'Viewer',
      desc: 'Mode Hanya Lihat (Tanpa Sandi)',
      colorDot: 'bg-emerald-500',
    },
    {
      roleType: 'supervisor',
      label: 'Supervisor',
      desc: 'Penyelia Teknis (Dilindungi Sandi)',
      colorDot: 'bg-cyan-500',
    },
    {
      roleType: 'manager',
      label: 'Manager',
      desc: 'Akses Penuh Manajerial (Dilindungi Sandi)',
      colorDot: 'bg-amber-500',
    },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 text-xs no-print">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Role indicator & User Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400">Mode Akses:</span>
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold hover:border-slate-400 transition-colors shadow-2xs"
            >
              <span className={`w-2 h-2 rounded-full ${
                currentUser.roleType === 'manager'
                  ? 'bg-amber-500'
                  : currentUser.roleType === 'supervisor'
                  ? 'bg-cyan-500'
                  : 'bg-emerald-500'
              }`}></span>
              <span className="font-bold capitalize">
                {currentUser.roleType === 'manager'
                  ? 'Manager'
                  : currentUser.roleType === 'supervisor'
                  ? 'Supervisor'
                  : 'Viewer'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown for Role Switching (Role Only - No Names) */}
            {isOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)}></div>
                <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-40 py-1 overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Pilih Mode Akses</span>
                    <span className="text-[10px] text-slate-400 font-normal">Dilindungi Sandi</span>
                  </div>
                  {ROLE_OPTIONS.map((opt) => {
                    const isSelected = opt.roleType === currentUser.roleType;
                    const requiresPassword = opt.roleType !== 'viewer';
                    const isUnlocked = opt.roleType === 'manager' ? isManagerUnlocked : opt.roleType === 'supervisor' ? isSupervisorUnlocked : true;
                    const targetUser = INITIAL_USERS.find((u) => u.roleType === opt.roleType) || INITIAL_USERS[0];

                    return (
                      <button
                        key={opt.roleType}
                        onClick={() => {
                          onUserChangeRequest(targetUser);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? 'bg-slate-100 dark:bg-slate-700/60'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full ${opt.colorDot}`}></span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{opt.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline" />}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{opt.desc}</div>
                          </div>
                        </div>

                        {requiresPassword && !isUnlocked && (
                          <span title="Memerlukan kata sandi" className="shrink-0 p-1 rounded bg-amber-500/10 text-amber-600">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden sm:inline text-slate-600 dark:text-slate-400 font-mono text-[11px]">
            {currentBadge.label}
          </span>

          {currentUser.roleType !== 'viewer' && (
            <button
              onClick={onLockRole}
              title="Kunci Akses kembali ke mode Viewer"
              className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-300"
            >
              <Lock className="w-3 h-3" />
              <span>Kunci Akses</span>
            </button>
          )}
        </div>

        {/* Right: Actions (Firebase DB, Standar Penilaian Teknis, Approvals, Audit) */}
        <div className="flex items-center gap-2">
          {onOpenFirebaseConfig && (
            <button
              onClick={onOpenFirebaseConfig}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors shadow-2xs text-xs font-medium cursor-pointer"
              title="Status & Konfigurasi Google Firebase Console Database"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
              <span className="font-semibold">Firebase DB</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          )}

          {onOpenSqlDatabase && (
            <button
              onClick={onOpenSqlDatabase}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors shadow-2xs text-xs font-medium cursor-pointer"
              title="Database SQL (database: MechMatrix Engineering • User: Engineering)"
            >
              <Database className="w-3.5 h-3.5 text-sky-500" />
              <span className="font-semibold">SQL DB</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          )}

          {/* STANDAR PENILAIAN TEKNIS (KHUSUS MANAGER) */}
          <button
            onClick={onOpenAssessmentStandard}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium text-xs transition-colors shadow-2xs ${
              currentUser.roleType === 'manager'
                ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-slate-900'
            }`}
            title={currentUser.roleType === 'manager' ? 'Buka Panduan & Standar Penilaian Teknis' : 'Hanya Manager yang dapat mengakses (Memerlukan Sandi Manager)'}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Standar Penilaian Teknis</span>
            {currentUser.roleType !== 'manager' && (
              <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
            )}
          </button>

          {(currentUser.roleType === 'manager' || currentUser.roleType === 'supervisor') && pendingApprovalsCount > 0 && (
            <button
              onClick={onOpenApprovals}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-medium hover:bg-amber-200 transition-colors animate-pulse"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{pendingApprovalsCount} Pengajuan Mandiri</span>
            </button>
          )}

          <button
            onClick={onOpenAuditLogs}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Audit Trail</span>
          </button>
        </div>
      </div>
    </div>
  );
};
