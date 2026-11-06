import React, { useState } from 'react';
import { X, Flame, ExternalLink, CheckCircle2, RefreshCw, Database, Shield, Layers, FileText } from 'lucide-react';
import { firebaseConfig, seedInitialFirestoreData } from '../services/firebase';
import { Engineer, AuditRecord } from '../types/skills';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineersCount: number;
  auditLogsCount: number;
  engineers: Engineer[];
  auditLogs: AuditRecord[];
  isOnline: boolean;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  engineersCount,
  auditLogsCount,
  engineers,
  auditLogs,
  isOnline
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDefaultDb = !firebaseConfig.firestoreDatabaseId || firebaseConfig.firestoreDatabaseId === '(default)';
  const consoleUrl = isDefaultDb
    ? `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`
    : `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatusMessage(null);
    try {
      const ok = await seedInitialFirestoreData(engineers, auditLogs);
      if (ok) {
        setSyncStatusMessage('Berhasil menyinkronkan data master ke Google Firebase Console!');
      } else {
        setSyncStatusMessage('Sinkronisasi selesai (data sudah ada di server).');
      }
    } catch (err) {
      setSyncStatusMessage('Gagal menyinkronkan: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-amber-500/5 dark:bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Google Firebase Console Database</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                  {isOnline ? 'Online • Real-time' : 'Menghubungkan...'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penyimpanan cloud terdistribusi dengan Firestore Database & Security Rules ABAC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-xs space-y-4 flex-1">
          {/* Connection Status Card */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100">Kredensial Firebase Cloud:</span>
              </div>
              <a
                href={consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <span>Buka Firebase Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
              <div className="flex justify-between p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-sans">Firebase Project ID:</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">{firebaseConfig.projectId}</span>
              </div>
              <div className="flex justify-between p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-sans">Firestore Database ID:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">{firebaseConfig.firestoreDatabaseId}</span>
              </div>
              <div className="flex justify-between p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-sans">Auth Domain:</span>
                <span className="text-slate-600 dark:text-slate-400">{firebaseConfig.authDomain}</span>
              </div>
            </div>
          </div>

          {/* Collections Grid */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-600" />
              <span>Koleksi Cloud Firestore Terkonfigurasi:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">/engineers</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 font-bold">
                    {engineersCount} Dokumen
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Profil personil, nilai 19 kompetensi (L0-L5), foto, multi-sertifikat, dan evaluasi mandiri.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">/auditLogs</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold">
                    {auditLogsCount} Log
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Log audit akuntabilitas ISO 9001 Clause 7.2 (*append-only*, tidak dapat diubah/dihapus).
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">/config</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold">
                    1 Pengaturan
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Identitas brand MechMatrix, subtitle departemen, dan logo perusahaan kustom.
                </p>
              </div>
            </div>
          </div>

          {/* Security Rules Card */}
          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
              <Shield className="w-4 h-4" />
              <span>Aturan Keamanan (Firestore Security Rules Deployed)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Aturan keamanan telah dideploy langsung ke cloud dengan validasi ketat (*Zero-Trust* &amp; *Anti-Update-Gap*). Kolom ID terlindungi dari *poisoning*, batas ukuran string (*anti denial of wallet*), serta proteksi data integritas level kompetensi teknis (rentang 0-5).
            </p>
          </div>

          {/* Sync status alert if any */}
          {syncStatusMessage && (
            <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200 font-medium">
              {syncStatusMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Inisialisasi / Sinkronkan Data'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
