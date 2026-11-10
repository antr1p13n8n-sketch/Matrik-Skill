/// <reference types="vite/client" />
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { CertificateAttachment } from '../types/skills';
import { getCertificateFile } from '../services/certStorage';
import { X, Download, FileText, Award, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface CertificatePreviewModalProps {
  cert: CertificateAttachment | null;
  onClose: () => void;
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return null;
    const base64Data = dataUrl.slice(commaIdx + 1);
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function dataUrlToBlobUrl(dataUrl: string): string | null {
  try {
    if (!dataUrl.startsWith('data:')) return dataUrl;
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return null;
    const header = dataUrl.slice(0, commaIdx);
    const mimeMatch = header.match(/data:([^;]+);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bytes = dataUrlToUint8Array(dataUrl);
    if (!bytes) return null;
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mime });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

interface PdfCanvasViewerProps {
  sourceUrl: string;
  scale: number;
  onLoadedPages: (count: number) => void;
}

const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({ sourceUrl, scale, onLoadedPages }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;

    const renderPdf = async () => {
      setRendering(true);
      setError(null);

      try {
        let dataBytes: Uint8Array | null = null;
        if (sourceUrl.startsWith('data:')) {
          dataBytes = dataUrlToUint8Array(sourceUrl);
        } else {
          const res = await fetch(sourceUrl);
          if (!res.ok) throw new Error('Gagal mengunduh berkas PDF.');
          const buf = await res.arrayBuffer();
          dataBytes = new Uint8Array(buf);
        }

        if (!dataBytes) {
          throw new Error('Format PDF tidak valid.');
        }

        const loadingTask = pdfjsLib.getDocument({ data: dataBytes });
        pdfDoc = await loadingTask.promise;
        if (cancelled) return;

        onLoadedPages(pdfDoc.numPages);

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';

        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (cancelled) break;
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          const wrapper = document.createElement('div');
          wrapper.className = 'bg-white shadow-md rounded overflow-hidden mx-auto';
          wrapper.style.width = `${Math.floor(viewport.width)}px`;

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          wrapper.appendChild(canvas);
          container.appendChild(wrapper);

          if (context) {
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
            await page.render({
              canvasContext: context,
              viewport,
              canvas,
            }).promise;
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal menampilkan pratinjau PDF.');
        }
      } finally {
        if (!cancelled) {
          setRendering(false);
        }
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
      if (pdfDoc) {
        pdfDoc.cleanup().catch(() => {});
      }
    };
  }, [sourceUrl, scale, onLoadedPages]);

  if (error) {
    return (
      <div className="text-center max-w-md space-y-2 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Gagal Merender PDF
        </div>
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {rendering && (
        <div className="text-xs text-slate-500 animate-pulse py-2">
          Merender halaman PDF...
        </div>
      )}
      <div ref={containerRef} className="w-full flex flex-col items-center gap-4" />
    </div>
  );
};

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({ cert, onClose }) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.15);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    let active = true;
    let createdBlobUrl: string | null = null;

    const load = async () => {
      if (!cert) {
        setResolvedUrl(null);
        setDownloadUrl(null);
        setNumPages(0);
        return;
      }

      setLoading(true);
      setNumPages(0);
      setPdfScale(1.15);

      let rawUrl = cert.fileUrl || null;
      if (!rawUrl) {
        rawUrl = await getCertificateFile(cert.id);
      }

      if (!active) return;
      setResolvedUrl(rawUrl);

      if (!rawUrl) {
        setDownloadUrl(null);
        setLoading(false);
        return;
      }

      if (rawUrl.startsWith('data:')) {
        createdBlobUrl = dataUrlToBlobUrl(rawUrl);
        setDownloadUrl(createdBlobUrl || rawUrl);
      } else {
        setDownloadUrl(rawUrl);
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
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
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
                {isPdf && numPages > 0 ? ` · ${numPages} halaman` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPdf && resolvedUrl && (
              <div className="hidden sm:flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 bg-white dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setPdfScale((s) => Math.max(0.6, Number((s - 0.2).toFixed(2))))}
                  className="p-1 text-slate-600 dark:text-slate-300 hover:text-cyan-600"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 w-10 text-center">
                  {Math.round(pdfScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setPdfScale((s) => Math.min(2.4, Number((s + 0.2).toFixed(2))))}
                  className="p-1 text-slate-600 dark:text-slate-300 hover:text-cyan-600"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {resolvedUrl && (
              <a
                href={downloadUrl || resolvedUrl}
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

        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 p-4 flex items-start justify-center min-h-[360px]">
          {loading ? (
            <div className="text-xs text-slate-500 animate-pulse my-auto">Memuat berkas sertifikat...</div>
          ) : !resolvedUrl ? (
            <div className="text-center max-w-md space-y-2 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-auto">
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
              src={downloadUrl || resolvedUrl}
              alt={cert.name}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md my-auto"
            />
          ) : isPdf ? (
            <PdfCanvasViewer
              sourceUrl={resolvedUrl}
              scale={pdfScale}
              onLoadedPages={setNumPages}
            />
          ) : (
            <div className="text-center max-w-md space-y-3 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-auto">
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
