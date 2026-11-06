import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, ExternalLink, HelpCircle } from 'lucide-react';
import { GAS_CODE_GS } from '../data/gasCode';

interface GasExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasExportModal: React.FC<GasExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'codegs' | 'indexhtml' | 'guide'>('guide');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(false);

  if (!isOpen) return null;

  const handleDownload = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    element.remove();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Google Apps Script Deployment Files (Code.gs & Index.html)
              </h3>
              <p className="text-xs text-slate-500">
                Gunakan file ini langsung di Google Sheets / Apps Script untuk deploy Web App instan.
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 font-semibold transition-colors border-b-2 ${
              activeTab === 'guide'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Panduan Deploy Cepat (3 Menit)
          </button>
          <button
            onClick={() => setActiveTab('codegs')}
            className={`pb-2.5 font-semibold transition-colors border-b-2 ${
              activeTab === 'codegs'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Code.gs (Server-side)
          </button>
          <button
            onClick={() => setActiveTab('indexhtml')}
            className={`pb-2.5 font-semibold transition-colors border-b-2 ${
              activeTab === 'indexhtml'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Index.html (Frontend UI)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto text-xs space-y-4 flex-1">
          {activeTab === 'guide' && (
            <div className="space-y-4 text-slate-700 dark:text-slate-300">
              <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 space-y-2">
                <div className="font-bold flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-cyan-600" />
                  <span>File Siap Digunakan di Google Apps Script</span>
                </div>
                <p className="leading-relaxed">
                  Kami telah menyusun <strong>Code.gs</strong> (Google Script) dan <strong>Index.html</strong> dengan <strong>Database Google Sheets penuh</strong>. Seluruh data personil, matriks 19 keahlian teknis, audit log ISO 9001, dan konfigurasi brand tersimpan langsung dan tersinkronisasi 2 arah ke dalam 4 tab sheet: <code>Engineers</code>, <code>CompetencyMatrix</code>, <code>AuditTrail</code>, dan <code>Config</code>.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Langkah-Langkah Instalasi &amp; Konfigurasi Google Sheets Database:
                </h4>
                <ol className="list-decimal list-inside space-y-2.5 leading-relaxed">
                  <li className="pl-1">
                    Buka Google Sheets baru di browser:{' '}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 font-semibold underline inline-flex items-center gap-0.5"
                    >
                      sheets.new <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li className="pl-1">
                    Klik menu <strong>Extensions (Ekstensi)</strong> &gt; <strong>Apps Script</strong>.
                  </li>
                  <li className="pl-1">
                    Pada editor Apps Script, buka file <code>Code.gs</code>, hapus isinya, lalu salin dan tempel kode dari tab <strong>Code.gs</strong> di atas.
                  </li>
                  <li className="pl-1">
                    Klik tombol <strong>+ (Tambah file)</strong> di samping File &gt; pilih <strong>HTML</strong> &gt; beri nama persis <code>Index.html</code> (atau <code>Index</code>).
                  </li>
                  <li className="pl-1">
                    Hapus isi defaultnya, lalu salin dan tempel kode dari tab <strong>Index.html</strong> di atas.
                  </li>
                  <li className="pl-1">
                    Di toolbar editor atas, pilih fungsi <code>setupSheets</code> lalu klik <strong>Run</strong> sekali (berikan izin Google bila diminta). Sistem akan otomatis membuat dan memformat 4 tab database di Google Sheets Anda:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-slate-500 font-mono text-[11px]">
                      <li>• <strong>Engineers</strong>: ID, Nama, Jabatan, Foto Avatar, Multi-Sertifikat (JSON), Evaluasi Mandiri</li>
                      <li>• <strong>CompetencyMatrix</strong>: Baris per insinyur &amp; kolom 19 skill (L0-L5)</li>
                      <li>• <strong>AuditTrail</strong>: Timestamp, ISO 9001 Clause 7.2 log perubahan level &amp; alasan</li>
                      <li>• <strong>Config</strong>: Pengaturan Logo, Brand Name, dan Subtitle</li>
                    </ul>
                  </li>
                  <li className="pl-1">
                    Klik tombol biru <strong>Deploy</strong> &gt; <strong>New deployment</strong> &gt; Pilih ikon roda gigi <strong>Web app</strong>:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-slate-500">
                      <li>Execute as: <strong>Me (email Anda)</strong></li>
                      <li>Who has access: <strong>Anyone</strong> (atau siapa saja dalam organisasi Anda)</li>
                    </ul>
                  </li>
                  <li className="pl-1">
                    Klik <strong>Deploy</strong> &amp; buka link Web App yang diberikan! Status koneksi database Google Sheet akan langsung muncul di bar atas.
                  </li>
                </ol>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                <strong>Catatan File di Server Workspace:</strong> File ini juga telah tersimpan secara permanen di direktori <code>/gas/Code.gs</code> dan <code>/gas/Index.html</code> pada aplikasi ini.
              </div>
            </div>
          )}

          {activeTab === 'codegs' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono text-[11px]">Path: /gas/Code.gs</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload('Code.gs', GAS_CODE_GS)}
                    className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium flex items-center gap-1.5 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Code.gs</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(GAS_CODE_GS);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-700 font-medium flex items-center gap-1.5 text-white shadow-2xs"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Tersalin!' : 'Salin Seluruh Code.gs'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-[50vh] leading-relaxed">
                <pre>{`// MechMatrix - Google Apps Script Backend (Code.gs)
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('MechMatrix - Mechanical Engineering Skill Matrix')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Inisialisasi Sheet Database & API Endpoints:
// - setupSheets()
// - apiGetInitialData()
// - apiSaveSkillLevel(engineerId, skillId, newLevel, reason, updatedBy)
// - apiSubmitSelfAssessment(engineerId, skillId, proposedLevel, notes)
// - apiApproveAssessment(engineerId, skillId, level, notes, managerName)
// - apiRejectAssessment(engineerId, skillId)
// ... lihat file /gas/Code.gs untuk implementasi lengkap.`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'indexhtml' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono text-[11px]">Path: /gas/Index.html</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const res = await fetch('/gas/Index.html');
                      const text = await res.text();
                      handleDownload('Index.html', text);
                    }}
                    className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium flex items-center gap-1.5 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Index.html</span>
                  </button>
                  <button
                    onClick={async () => {
                      const res = await fetch('/gas/Index.html');
                      const text = await res.text();
                      navigator.clipboard.writeText(text);
                      setCopiedIndex(true);
                      setTimeout(() => setCopiedIndex(false), 2000);
                    }}
                    className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-700 font-medium flex items-center gap-1.5 text-white shadow-2xs"
                  >
                    {copiedIndex ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex ? 'Tersalin!' : 'Salin Seluruh Index.html'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-[50vh] leading-relaxed">
                <pre>{`<!-- Standalone Google Apps Script Frontend (Index.html) -->
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>MechMatrix</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<!-- Berisi seluruh UI Tailwind, Spider Chart SVG, High-density Matrix,
     Multi-Role Switcher, Modals, dan IDP Auto-generator yang berkomunikasi
     langsung via google.script.run -->
... lihat file /gas/Index.html untuk kode lengkap.`}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Tersimpan di workspace lokal: <code>/gas/Code.gs</code> &amp; <code>/gas/Index.html</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs hover:bg-slate-300"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
