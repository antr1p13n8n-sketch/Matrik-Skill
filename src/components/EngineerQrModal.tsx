import React, { useState, useRef } from 'react';
import { Engineer } from '../types/skills';
import { QRCodeCanvas } from 'qrcode.react';
import { X, QrCode, Download, Copy, Check, ExternalLink } from 'lucide-react';
import { getAvatarGradient } from '../utils/domainColors';

interface EngineerQrModalProps {
  engineer: Engineer | null;
  idpUrl: string;
  onClose: () => void;
  onOpenReport: (engineer: Engineer) => void;
}

export const EngineerQrModal: React.FC<EngineerQrModalProps> = ({
  engineer,
  idpUrl,
  onClose,
  onOpenReport,
}) => {
  const [copied, setCopied] = useState(false);
  const qrCanvasWrapperRef = useRef<HTMLDivElement>(null);

  if (!engineer) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(idpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = idpUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPng = () => {
    const sourceCanvas = qrCanvasWrapperRef.current?.querySelector('canvas');
    if (!sourceCanvas) return;

    // Create a clean printable card PNG containing the QR code + engineer metadata
    const exportCanvas = document.createElement('canvas');
    const width = 440;
    const height = 540;
    exportCanvas.width = width;
    exportCanvas.height = height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Top gradient header bar
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(0.5, '#6366f1');
    grad.addColorStop(1, '#d946ef');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, 12);

    // Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MECHMATRIX · LAPORAN IDP INSINYUR', width / 2, 52);

    // QR Code centered
    const qrSize = 300;
    const qrX = (width - qrSize) / 2;
    const qrY = 78;
    ctx.drawImage(sourceCanvas, qrX, qrY, qrSize, qrSize);

    // Engineer Name & Role
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(engineer.name, width / 2, 418);

    ctx.fillStyle = '#4f46e5';
    ctx.font = '600 14px sans-serif';
    ctx.fillText(engineer.roleTitle, width / 2, 444);

    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.fillText(engineer.department, width / 2, 468);

    ctx.fillStyle = '#0891b2';
    ctx.font = '600 12px sans-serif';
    ctx.fillText('Pindai QR Code untuk membuka Laporan IDP secara langsung', width / 2, 506);

    const pngUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `QR_IDP_${engineer.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 no-print">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="h-1.5 w-full bg-linear-to-r from-cyan-500 via-indigo-500 to-fuchsia-500" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-linear-to-br from-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                QR Code Akses Langsung IDP
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pindai dengan kamera ponsel untuk membuka laporan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-3 w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-left">
            {engineer.avatarUrl ? (
              <img
                src={engineer.avatarUrl}
                alt={engineer.name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover border-2 border-cyan-300 dark:border-cyan-700 shrink-0"
              />
            ) : (
              <div className={`w-11 h-11 rounded-full bg-linear-to-br ${getAvatarGradient(engineer.name)} flex items-center justify-center text-white font-bold shrink-0 text-xs`}>
                {engineer.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                {engineer.name}
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                {engineer.roleTitle}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {engineer.department}
              </div>
            </div>
          </div>

          {/* High-Contrast Scannable QR Code Frame */}
          <div
            ref={qrCanvasWrapperRef}
            className="p-4 bg-white rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 shadow-md"
          >
            <QRCodeCanvas
              value={idpUrl}
              size={220}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="M"
              includeMargin={true}
            />
          </div>

          {/* URL Readout & Copy */}
          <div className="w-full flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[11px]">
            <span className="font-mono text-slate-600 dark:text-slate-300 truncate flex-1 text-left">
              {idpUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-cyan-400 font-semibold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5">
          <button
            onClick={handleDownloadPng}
            className="flex-1 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh PNG</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenReport(engineer);
            }}
            className="flex-1 px-3.5 py-2 rounded-xl bg-linear-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Laporan IDP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
