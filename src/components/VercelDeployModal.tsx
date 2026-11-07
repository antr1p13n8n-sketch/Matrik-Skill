import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Globe, 
  Terminal, 
  Github, 
  FileCode, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  Flame, 
  Database 
} from 'lucide-react';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'config' | 'cli'>('steps');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const vercelJsonContent = `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}`;

  const cliCommands = `# 1. Pasang Vercel CLI
npm install -g vercel

# 2. Login ke akun Vercel
vercel login

# 3. Deploy langsung ke Vercel
vercel --prod`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            {/* Vercel Triangle Logo */}
            <div className="w-9 h-9 rounded-xl bg-black border border-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 1155 1000">
                <path d="m577.3 0 577.4 1000H0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Panduan Online Vercel</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/20">
                  vercel.app
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Konfigurasi deployment instan untuk hosting MechMatrix Engineering di Vercel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'steps'
                ? 'border-slate-900 dark:border-cyan-400 text-slate-900 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>Cara Deploy (GitHub & Vercel)</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'config'
                ? 'border-slate-900 dark:border-cyan-400 text-slate-900 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Berkas vercel.json</span>
          </button>
          <button
            onClick={() => setActiveTab('cli')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'cli'
                ? 'border-slate-900 dark:border-cyan-400 text-slate-900 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Vercel CLI</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-xs space-y-4 flex-1">
          {/* TAB 1: STEPS */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Konfigurasi Otomatis Siap Pakai (Bebas npm Error)
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-xs mt-1 leading-relaxed">
                    Berkas <strong>vercel.json</strong>, <strong>api/index.js</strong>, <strong>.npmrc</strong> (mencegah konflik dependensi ERESOLVE), <strong>package-lock.json</strong>, dan <strong>.vercelignore</strong> sudah otomatis kami buat di root folder proyek ini. Anda tinggal mengimpor repositori ke Vercel tanpa error instalasi npm.
                  </p>
                </div>
              </div>

              {/* Step by step */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-cyan-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Push Kode Proyek ke GitHub</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 pl-7 text-[11px]">
                    Unggah seluruh folder proyek ini ke repositori GitHub pribadi atau organisasi Anda.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                      <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-cyan-600 text-white flex items-center justify-center text-[10px]">2</span>
                      <span>Buka Vercel New Project</span>
                    </div>
                    <a
                      href="https://vercel.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-black text-white hover:bg-slate-800 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <span>Buka vercel.com/new</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 pl-7 text-[11px]">
                    Klik tombol <strong>"Import"</strong> pada repositori GitHub Anda di dashboard Vercel.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-cyan-600 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Pengaturan Build & Output (Otomatis Terdeteksi)</span>
                  </div>
                  <div className="pl-7 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[10px]">Framework:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Vite</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[10px]">Build Command:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">npm run build</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-cyan-600 text-white flex items-center justify-center text-[10px]">4</span>
                    <span>Environment Variables (Opsional)</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 pl-7 text-[11px]">
                    Jika ingin mengaktifkan evaluasi AI Gemini di Vercel, tambahkan variable:
                    <br />
                    <code className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 rounded font-mono font-bold">
                      GEMINI_API_KEY = [kunci_api_anda]
                    </code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERCEL.JSON */}
          {activeTab === 'config' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">
                    Isi Berkas vercel.json
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Telah tersimpan di root direktori proyek Anda
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(vercelJsonContent, 'vercelJson')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey === 'vercelJson' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'vercelJson' ? 'Tersalin!' : 'Salin JSON'}</span>
                </button>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-200 max-h-80 overflow-y-auto shadow-inner leading-relaxed">
                <pre>{vercelJsonContent}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: CLI */}
          {activeTab === 'cli' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">
                    Perintah Deploy via Vercel CLI
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Jalankan di terminal lokal untuk deploy langsung tanpa GitHub
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(cliCommands, 'cli')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey === 'cli' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'cli' ? 'Tersalin!' : 'Salin Perintah'}</span>
                </button>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 max-h-80 overflow-y-auto shadow-inner leading-relaxed">
                <pre>{cliCommands}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            <span>Target Host: <strong>vercel.app</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
