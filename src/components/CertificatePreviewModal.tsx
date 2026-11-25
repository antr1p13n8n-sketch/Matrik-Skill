/// <reference types="vite/client" />
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { CertificateAttachment } from '../types/skills';
import {
  getCertificateFile,
  parseDataUrlToBytes,
  detectBinaryFileKind,
} from '../services/certStorage';
import { X, Download, FileText, Award, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface CertificatePreviewModalProps {
  cert: CertificateAttachment | null;
  onClose: () => void;
}

type ResolvedKind = 'pdf' | 'image' | 'unknown' | 'missing' | 'corrupt';

interface ResolvedAttachment {
  kind: ResolvedKind;
  bytes: Uint8Array | null;
  mime: string;
  downloadUrl: string | null;
  errorDetail?: string;
}

function createBlobUrlFromBytes(bytes: Uint8Array, mime: string): string | null {
  try {
    const copy = new Uint8Array(bytes);
    const blob = new Blob([copy.buffer as ArrayBuffer], { type: mime });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

async function fetchUrlBytes(
  url: string
): Promise<{ bytes: Uint8Array; mime: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (
      contentType.includes('text/html') ||
      contentType.includes('application/json') ||
      contentType.includes('text/plain')
    ) {
      return null;
    }
    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength === 0) return null;
    return { bytes: new Uint8Array(buf), mime: contentType || 'application/octet-stream' };
  } catch {
    return null;
  }
}

function translatePdfError(err: unknown): { title: string; detail: string } {
  const msg = err instanceof Error ? err.message : String(err || '');
  const name = err instanceof Error ? err.name : '';

  if (name === 'PasswordException' || /password/i.test(msg)) {
    return {
      title: 'PDF Dilindungi Kata Sandi',
      detail:
        'Berkas PDF ini terenkripsi dengan kata sandi sehingga tidak dapat dirender langsung di pratinjau. Anda tetap dapat mengunduh berkas aslinya.',
    };
  }

  if (/invalid pdf structure|missing pdf|unexpected/i.test(msg) || name === 'InvalidPDFException') {
    return {
      title: 'Struktur Berkas PDF Tidak Valid / Rusak',
      detail:
        'Berkas lampiran tidak memiliki struktur PDF yang utuh atau rusak saat pengunggahan. Silakan unduh untuk memeriksa berkas atau unggah ulang file PDF yang valid melalui menu Edit Data Personil.',
    };
  }

  return {
    title: 'Gagal Merender Pratinjau PDF',
    detail:
      msg ||
      'Terjadi kendala saat membuka halaman PDF. Anda dapat mengunduh berkas melalui tombol Unduh di atas.',
  };
}

interface PdfCanvasViewerProps {
  pdfBytes: Uint8Array;
  scale: number;
  onLoadedPages: (count: number) => void;
  downloadUrl?: string | null;
  fileName?: string;
}

const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  pdfBytes,
  scale,
  onLoadedPages,
  downloadUrl,
  fileName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onLoadedPagesRef = useRef(onLoadedPages);
  onLoadedPagesRef.current = onLoadedPages;

  const [error, setError] = useState<{ title: string; detail: string } | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;
    let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;

    const renderPdf = async () => {
      setRendering(true);
      setError(null);

      try {
        // Clone bytes per load because PDF.js transfers ownership to its WebWorker
        const workerCopy = new Uint8Array(pdfBytes);
        loadingTask = pdfjsLib.getDocument({ data: workerCopy });
        pdfDoc = await loadingTask.promise;
        if (cancelled) return;

        onLoadedPagesRef.current(pdfDoc.numPages);

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';

        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (cancelled) break;
          const page = await pdfDoc.getPage(pageNum);
          if (cancelled) break;

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
          setError(translatePdfError(err));
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
      if (loadingTask) {
        loadingTask.destroy().catch(() => {});
      } else if (pdfDoc) {
        pdfDoc.cleanup().catch(() => {});
      }
    };
  }, [pdfBytes, scale]);

  if (error) {
    return (
      <div className="text-center max-w-md space-y-3 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-auto">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {error.title}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{error.detail}</p>
        {downloadUrl && (
          <div className="pt-1">
            <a
              href={downloadUrl}
              download={fileName || 'sertifikat.pdf'}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Berkas Asli</span>
            </a>
          </div>
        )}
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
  const [resolved, setResolved] = useState<ResolvedAttachment | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.15);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    let active = true;
    let createdBlobUrl: string | null = null;

    const inspectRawUrl = async (
      rawUrl: string
    ): Promise<ResolvedAttachment | null> => {
      let bytes: Uint8Array | null = null;
      let declaredMime = '';

      if (rawUrl.startsWith('data:')) {
        const parsed = parseDataUrlToBytes(rawUrl);
        if (!parsed) return null;
        bytes = parsed.bytes;
        declaredMime = parsed.mime;
      } else {
        const fetched = await fetchUrlBytes(rawUrl);
        if (!fetched) return null;
        bytes = fetched.bytes;
        declaredMime = fetched.mime;
      }

      const detected = detectBinaryFileKind(bytes, declaredMime);
      if (detected.kind === 'invalid_markup') {
        return null;
      }

      if (detected.kind === 'pdf') {
        const cleanPdfBytes =
          detected.pdfOffset > 0 ? bytes.subarray(detected.pdfOffset) : bytes;
        createdBlobUrl = createBlobUrlFromBytes(cleanPdfBytes, 'application/pdf');
        return {
          kind: 'pdf',
          bytes: cleanPdfBytes,
          mime: 'application/pdf',
          downloadUrl: createdBlobUrl,
        };
      }

      if (detected.kind === 'image') {
        createdBlobUrl = createBlobUrlFromBytes(bytes, detected.mime);
        return {
          kind: 'image',
          bytes,
          mime: detected.mime,
          downloadUrl: createdBlobUrl,
        };
      }

      // Unknown binary format (not PDF %PDF- header and not recognized image)
      if (/\.pdf$/i.test(cert?.fileName || '') || declaredMime === 'application/pdf') {
        createdBlobUrl = createBlobUrlFromBytes(bytes, 'application/pdf');
        return {
          kind: 'corrupt',
          bytes,
          mime: 'application/pdf',
          downloadUrl: createdBlobUrl,
          errorDetail:
            'Berkas yang tersimpan dengan ekstensi .pdf ini tidak memiliki header PDF yang valid (%PDF-) sehingga tidak dapat ditampilkan. Anda dapat mengunduh berkas atau mengunggah ulang file PDF yang benar melalui Edit Data Personil.',
        };
      }

      createdBlobUrl = createBlobUrlFromBytes(bytes, detected.mime);
      return {
        kind: 'unknown',
        bytes,
        mime: detected.mime,
        downloadUrl: createdBlobUrl,
      };
    };

    const load = async () => {
      if (!cert) {
        setResolved(null);
        setNumPages(0);
        return;
      }

      setLoading(true);
      setNumPages(0);
      setPdfScale(1.15);

      let result: ResolvedAttachment | null = null;

      if (cert.fileUrl) {
        result = await inspectRawUrl(cert.fileUrl);
      }

      // Fallback to IndexedDB / server storage if inline fileUrl was missing or invalid
      if (!result || result.kind === 'corrupt') {
        const fallbackUrl = await getCertificateFile(cert.id);
        if (fallbackUrl) {
          const fallbackResult = await inspectRawUrl(fallbackUrl);
          if (fallbackResult && fallbackResult.kind !== 'corrupt') {
            if (createdBlobUrl && result?.downloadUrl && result.downloadUrl !== fallbackResult.downloadUrl) {
              URL.revokeObjectURL(result.downloadUrl);
            }
            result = fallbackResult;
          } else if (!result && fallbackResult) {
            result = fallbackResult;
          }
        }
      }

      if (!active) {
        if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
        return;
      }

      if (!result) {
        setResolved({
          kind: 'missing',
          bytes: null,
          mime: '',
          downloadUrl: null,
        });
      } else {
        setResolved(result);
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

  const isPdf = resolved?.kind === 'pdf';
  const isImage = resolved?.kind === 'image';
  const defaultExt = isImage ? '.jpg' : '.pdf';

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
            {isPdf && resolved?.bytes && (
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
            {resolved?.downloadUrl && (
              <a
                href={resolved.downloadUrl}
                download={cert.fileName || `${cert.name.replace(/\s+/g, '_')}${defaultExt}`}
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
          ) : !resolved || resolved.kind === 'missing' ? (
            <div className="text-center max-w-md space-y-2 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-auto">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Berkas Lampiran Tidak Tersedia
              </div>
              <p className="text-xs text-slate-500">
                Sertifikat ini tercatat tanpa file lampiran yang dapat dimuat. Anda dapat mengunggah ulang berkas PDF atau gambar melalui menu Edit Data Personil.
              </p>
            </div>
          ) : resolved.kind === 'corrupt' ? (
            <div className="text-center max-w-md space-y-3 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-auto">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Berkas PDF Tidak Valid atau Rusak
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {resolved.errorDetail}
              </p>
            </div>
          ) : resolved.kind === 'image' && resolved.downloadUrl ? (
            <img
              src={resolved.downloadUrl}
              alt={cert.name}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md my-auto"
            />
          ) : resolved.kind === 'pdf' && resolved.bytes ? (
            <PdfCanvasViewer
              pdfBytes={resolved.bytes}
              scale={pdfScale}
              onLoadedPages={setNumPages}
              downloadUrl={resolved.downloadUrl}
              fileName={cert.fileName}
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
