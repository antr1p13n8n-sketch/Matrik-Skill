import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Terminal, 
  FileCode, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  Play, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  Table,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Engineer, AuditRecord } from '../types/skills';
import { 
  SQL_CONFIG, 
  generateFullSqlDdlScript, 
  executeSqlQuery, 
  syncDataToSql, 
  fetchSqlInfo,
  SqlConfigInfo,
  SqlQueryResult
} from '../services/sqlDatabase';

interface SqlDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineers: Engineer[];
  auditLogs: AuditRecord[];
}

export const SqlDatabaseModal: React.FC<SqlDatabaseModalProps> = ({
  isOpen,
  onClose,
  engineers,
  auditLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'console' | 'ddl'>('overview');
  const [sqlInfo, setSqlInfo] = useState<SqlConfigInfo>(SQL_CONFIG);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // SQL Console State
  const defaultQuery = `SELECT id, name, role_title, department FROM engineers ORDER BY name ASC;`;
  const [queryInput, setQueryInput] = useState(defaultQuery);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null);

  // Copy feedback
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInfo();
    }
  }, [isOpen]);

  const loadInfo = async () => {
    const info = await fetchSqlInfo();
    setSqlInfo(info);
  };

  if (!isOpen) return null;

  const ddlScript = generateFullSqlDdlScript(engineers, auditLogs);

  const handleCopyDdl = async () => {
    try {
      await navigator.clipboard.writeText(ddlScript);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy DDL:', err);
    }
  };

  const handleDownloadDdl = () => {
    const blob = new Blob([ddlScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mechmatrix_engineering.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExecuteQuery = async (queryToRun?: string) => {
    const q = queryToRun || queryInput;
    setIsExecuting(true);
    setQueryResult(null);
    try {
      const res = await executeSqlQuery(q);
      setQueryResult(res);
      loadInfo();
    } catch (err) {
      setQueryResult({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSyncToSql = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncDataToSql(engineers, auditLogs);
      setSyncStatus(res);
      await loadInfo();
    } catch (err) {
      setSyncStatus({
        success: false,
        message: err instanceof Error ? err.message : 'Terjadi kegagalan sinkronisasi',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const PRESET_QUERIES = [
    {
      label: 'Daftar Semua Insinyur',
      query: `SELECT id, name, role_title, department FROM engineers ORDER BY name;`,
    },
    {
      label: 'Rata-rata Skor per Keahlian',
      query: `SELECT skill_name, COUNT(*) as assessed_staff, ROUND(AVG(level), 2) as avg_score FROM engineer_skills GROUP BY skill_name ORDER BY avg_score DESC;`,
    },
    {
      label: 'Riwayat 5 Audit Trail Terakhir',
      query: `SELECT id, timestamp, engineer_name, skill_name, previous_level, new_level, updated_by FROM audit_logs ORDER BY timestamp DESC LIMIT 5;`,
    },
    {
      label: 'Daftar Pemegang Sertifikasi',
      query: `SELECT e.name, e.role_title, c.certification_name FROM engineers e JOIN certifications c ON e.id = c.engineer_id ORDER BY e.name;`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-sky-500/5 dark:bg-sky-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Database className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Database SQL Engine
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                  database: {sqlInfo.database}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  User: {sqlInfo.user}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penyimpanan relasional terstruktur dengan dukungan query SQL, ACID transaction, dan skrip DDL master
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kredensial & Status</span>
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'console'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>SQL Query Console</span>
          </button>
          <button
            onClick={() => setActiveTab('ddl')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ddl'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Skrip DDL & Unduh .SQL</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto text-xs space-y-5 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Database Credentials Summary Card */}
              <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/40 dark:bg-sky-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Spesifikasi Relasional Database
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Database Aktif (Online)</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400">Nama Database (Database Name):</span>
                    <div className="font-mono font-bold text-sm text-sky-600 dark:text-sky-400">
                      {sqlInfo.database}
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400">Nama Pengguna (Database User):</span>
                    <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      {sqlInfo.user}
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400">Dialek & Engine SQL:</span>
                    <div className="font-mono font-medium text-xs text-slate-800 dark:text-slate-200">
                      {sqlInfo.dialect}
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400">Host / Port Default:</span>
                    <div className="font-mono font-medium text-xs text-slate-800 dark:text-slate-200">
                      {sqlInfo.host} : {sqlInfo.port}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Strip: Sync to SQL */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Sinkronisasi Data ke SQL Engine
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Tulis atau perbarui seluruh data insinyur ({engineers.length} personil) dan riwayat audit ke tabel SQL
                  </p>
                </div>
                <button
                  onClick={handleSyncToSql}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                </button>
              </div>

              {syncStatus && (
                <div
                  className={`p-3 rounded-lg border flex items-center gap-2.5 text-xs ${
                    syncStatus.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {syncStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{syncStatus.message}</span>
                </div>
              )}

              {/* Relational Table Architecture */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs mb-2 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-sky-500" />
                  <span>Daftar Tabel Database ({sqlInfo.tables.length} Relasional Tabel):</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {[
                    { name: 'engineers', desc: 'Master data insinyur & profil karyawan' },
                    { name: 'engineer_skills', desc: 'Matriks level kompetensi L0-L5' },
                    { name: 'certifications', desc: 'Daftar lisensi dan sertifikat resmi' },
                    { name: 'self_assessments', desc: 'Pengajuan evaluasi mandiri staff' },
                    { name: 'audit_logs', desc: 'Catatan audit mutasi skor kompetensi' },
                    { name: 'assessment_standards', desc: 'Rubrik dan standar penilaian teknik' },
                    { name: 'users', desc: 'Akun dan otorisasi peran akses sistem' },
                  ].map((tbl) => (
                    <div
                      key={tbl.name}
                      className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                    >
                      <div className="font-mono font-bold text-sky-600 dark:text-sky-400 text-xs">
                        {tbl.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {tbl.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SQL QUERY CONSOLE */}
          {activeTab === 'console' && (
            <div className="space-y-4">
              {/* Preset Queries */}
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] block mb-1.5">
                  Pilih Contoh Query Cepat (Presets):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_QUERIES.map((pq, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQueryInput(pq.query);
                        handleExecuteQuery(pq.query);
                      }}
                      className="px-2.5 py-1 text-[11px] rounded bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/60 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {pq.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SQL Input Area */}
              <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-slate-950 text-slate-100 font-mono text-xs">
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-sky-400" />
                    <span>SQL Editor • Database: {sqlInfo.database}</span>
                  </div>
                  <button
                    onClick={() => handleExecuteQuery()}
                    disabled={isExecuting}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
                    <span>{isExecuting ? 'Menjalankan...' : 'Jalankan Query'}</span>
                  </button>
                </div>
                <textarea
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-transparent text-slate-100 font-mono text-xs focus:outline-hidden resize-y"
                  placeholder="Ketik query SQL di sini (misal: SELECT * FROM engineers;)"
                />
              </div>

              {/* Query Results */}
              {queryResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        Hasil Eksekusi:
                      </span>
                      {queryResult.success ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Sukses ({queryResult.values?.length || 0} baris)
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                          Gagal
                        </span>
                      )}
                    </div>
                    {queryResult.executionTimeMs !== undefined && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        Waktu eksekusi: {queryResult.executionTimeMs} ms
                      </span>
                    )}
                  </div>

                  {queryResult.error ? (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-mono">
                      Error: {queryResult.error}
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            {queryResult.columns?.map((col, idx) => (
                              <th
                                key={idx}
                                className="px-3 py-2 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.values && queryResult.values.length > 0 ? (
                            queryResult.values.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                              >
                                {row.map((val: any, cIdx: number) => (
                                  <td
                                    key={cIdx}
                                    className="px-3 py-2 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap"
                                  >
                                    {val === null || val === undefined ? (
                                      <span className="text-slate-400 italic">NULL</span>
                                    ) : typeof val === 'object' ? (
                                      JSON.stringify(val)
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={queryResult.columns?.length || 1}
                                className="px-4 py-4 text-center text-slate-400 italic"
                              >
                                Tidak ada data (0 baris ditemukan).
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DDL SCRIPT & DOWNLOAD */}
          {activeTab === 'ddl' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    File Ekspor Skrip DDL Master
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sintaks lengkap DDL PostgreSQL/MySQL dengan CREATE DATABASE "MechMatrix Engineering", USER "Engineering", tabel, index, dan data seed
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyDdl}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Tersalin!' : 'Salin SQL'}</span>
                  </button>
                  <button
                    onClick={handleDownloadDdl}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .sql</span>
                  </button>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-200 max-h-96 overflow-y-auto leading-relaxed shadow-inner">
                <pre>{ddlScript}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-mono">Database:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">MechMatrix Engineering</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono">User:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">Engineering</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
