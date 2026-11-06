import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ShieldCheck, X } from 'lucide-react';
import { UserRoleType } from '../types/skills';

interface PasswordAuthModalProps {
  isOpen: boolean;
  targetRole: UserRoleType;
  onSuccess: (role: UserRoleType) => void;
  onCancel: () => void;
  actionDescription?: string;
}

export const PasswordAuthModal: React.FC<PasswordAuthModalProps> = ({
  isOpen,
  targetRole,
  onSuccess,
  onCancel,
  actionDescription,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const expectedPassword = targetRole === 'manager' ? 'Eng159' : 'Eng567';
  const roleName = targetRole === 'manager' ? 'Manager (Akses Penuh)' : 'Supervisor (Penyelia Teknis)';

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.trim() === expectedPassword) {
      setPassword('');
      onSuccess(targetRole);
    } else {
      setError(`Password salah untuk otorisasi ${targetRole.toUpperCase()}! Silakan masukkan password yang valid.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Verifikasi Akses {roleName}</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {actionDescription || 'Masukkan kode sandi otorisasi peran untuk melanjutkan.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="mt-4 space-y-4">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Peran yang dituju:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-200 uppercase">{targetRole}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {targetRole === 'manager' ? (
                <span>Otoritas penuh untuk mengelola staff, menetapkan standar penilaian, dan mengevaluasi seluruh tim.</span>
              ) : (
                <span>Otoritas penyelia untuk mengevaluasi skor kompetensi teknis dan meninjau penilaian mandiri.</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-600" />
              <span>Kata Sandi Otorisasi</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={targetRole === 'manager' ? 'Masukkan password manager...' : 'Masukkan password supervisor...'}
              autoFocus
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-mono tracking-wider"
              required
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              Kunci akses aman
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Buka Akses</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
