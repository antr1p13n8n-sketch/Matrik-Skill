import React, { useEffect, useState } from 'react';
import { CertificateAttachment } from '../types/skills';
import { getCertificateFile } from '../services/certStorage';
import { X, Download, FileText, Award, AlertCircle } from 'lucide-react';

interface CertificatePreviewModalProps {
  cert: CertificateAttachment | null;
  onClose: () => void;
}

function dataUrlToBlobUrl(dataUrl: string): string | null {
  try {
    if (!dataUrl.startsWith('data:')) return dataUrl;
    const [header, base64Data] = dataUrl.split(',');
    if (!base64Data) return null;
    const mimeMatch = header.match(/data:([^;]+);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({ cert, onClose }) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let createdBlobUrl: string | null = null;

    const load = async () => {
      if (!cert) {
        setResolvedUrl(null);
        setObjectUrl(null);
        return;
      }

      setLoading(true);
      let rawUrl = cert.fileUrl || null;
      if (!rawUrl) {
        rawUrl = await getCertificateFile(cert.id);
      }

      if (!active) return;
      setResolvedUrl(rawUrl);

      if (!rawUrl) {
        setObjectUrl(null);
        setLoading(false);
        return;
      }

      if (rawUrl.startsWith('data:')) {
        createdBlobUrl = dataUrlToBlobUrl(rawUrl);
        setObjectUrl(createdBlobUrl || rawUrl);
      } else {
        setObjectUrl(rawUrl);
      }
      setLoading(false);
    };

    load();

    return () => {
      active = false;
      if (createdBlobUrl && createdBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [cert]);

  if (!cert) return null;

  const isImage =
    resolvedUrl?.startsWith('data:image/') ||
    /\.(png|jpe?g|webp|gif)$/i.test(cert.fileName || '');

  const isPdf =
    resolvedUrl?.startsWith('data:application/pdf') ||
    /\.pdf$/i.test(cert.fileName || '');

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 print:hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {cert.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {cert.issuer} · {cert.year}
                {cert.fileName ? ` · ${cert.fileName}` : ''}
                {cert.fileSize ? ` (${cert.fileSize})` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {resolvedUrl && (
              <a
                href={objectUrl || resolvedUrl}
                download={cert.fileName || `${cert.name.replace(/\s+/g, '_')}${isImage ? '.jpg' : '.pdf'}`}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 p-4 flex items-center justify-center min-h-[340px]">
          {loading ? (
            <div className="text-xs text-slate-500 animate-pulse">Memuat berkas sertifikat...</div>
          ) : !resolvedUrl ? (
            <div className="text-center max-w-md space-y-2 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Berkas Lampiran Tidak Tersedia
              </div>
              <p className="text-xs text-slate-500">
                Sertifikat ini tercatat tanpa file lampiran. Anda dapat mengunggah ulang berkas PDF atau gambar melalui menu Edit Data Personil.
              </p>
            </div>
          ) : isImage ? (
            <img
              src={objectUrl || resolvedUrl}
              alt={cert.name}
              className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-md"
            />
          ) : isPdf && objectUrl ? (
            <iframe
              src={objectUrl}
              title={cert.name}
              className="w-full h-[72vh] rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
            />
          ) : (
            <div className="text-center max-w-md space-y-3 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <FileText className="w-10 h-10 text-cyan-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {cert.fileName || cert.name}
              </div>
              <p className="text-xs text-slate-500">
                Pratinjau langsung tidak didukung untuk format berkas ini. Silakan klik tombol Unduh di atas untuk membuka file.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
