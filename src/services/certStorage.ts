/**
 * Hybrid Certificate File Storage:
 * 1. IndexedDB (client-side, up to 10MB+ per file)
 * 2. Express Server `/api/certificates` (server-side disk persistence)
 *
 * Includes binary magic-byte inspection so HTML/JSON SPA fallback responses
 * or corrupted payloads are never misidentified as PDF files.
 */

const DB_NAME = 'mechmatrix_certs_db';
const STORE_NAME = 'certificates';
const DB_VERSION = 1;

export type DetectedFileKind =
  | { kind: 'pdf'; mime: 'application/pdf'; pdfOffset: number }
  | { kind: 'image'; mime: string }
  | { kind: 'invalid_markup'; reason: string }
  | { kind: 'unknown'; mime: string };

export function parseDataUrlToBytes(
  dataUrl: string
): { mime: string; bytes: Uint8Array } | null {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return null;

    const header = dataUrl.slice(5, commaIdx); // strip "data:"
    const parts = header.split(';');
    const rawMime = (parts[0] || '').trim().toLowerCase();
    const isBase64 = parts.some((p) => p.trim().toLowerCase() === 'base64');
    const payload = dataUrl.slice(commaIdx + 1);

    if (!payload) return null;

    if (isBase64) {
      // Remove whitespace/linebreaks and normalize URL-safe base64
      let cleaned = payload.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
      const mod = cleaned.length % 4;
      if (mod === 2) cleaned += '==';
      else if (mod === 3) cleaned += '=';
      else if (mod === 1) return null;

      const binary = atob(cleaned);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return { mime: rawMime || 'application/octet-stream', bytes };
    }

    const decoded = decodeURIComponent(payload);
    const bytes = new TextEncoder().encode(decoded);
    return { mime: rawMime || 'text/plain', bytes };
  } catch {
    return null;
  }
}

export function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  const CHUNK_SIZE = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

export function findPdfHeaderOffset(bytes: Uint8Array, maxScan = 1024): number {
  const limit = Math.min(bytes.length - 5, maxScan);
  for (let i = 0; i <= limit; i++) {
    // "%PDF-" => 0x25 0x50 0x44 0x46 0x2D
    if (
      bytes[i] === 0x25 &&
      bytes[i + 1] === 0x50 &&
      bytes[i + 2] === 0x44 &&
      bytes[i + 3] === 0x46 &&
      bytes[i + 4] === 0x2d
    ) {
      return i;
    }
  }
  return -1;
}

export function detectBinaryFileKind(
  bytes: Uint8Array,
  declaredMime = ''
): DetectedFileKind {
  if (!bytes || bytes.length === 0) {
    return { kind: 'invalid_markup', reason: 'Berkas kosong (0 byte).' };
  }

  // 1. Check PDF magic signature "%PDF-" within first 1024 bytes
  const pdfOffset = findPdfHeaderOffset(bytes, 1024);
  if (pdfOffset !== -1) {
    return { kind: 'pdf', mime: 'application/pdf', pdfOffset };
  }

  // 2. Check common image signatures
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { kind: 'image', mime: 'image/png' };
  }
  // JPEG: FF D8 FF
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { kind: 'image', mime: 'image/jpeg' };
  }
  // GIF: GIF87a / GIF89a
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return { kind: 'image', mime: 'image/gif' };
  }
  // WEBP: RIFF....WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { kind: 'image', mime: 'image/webp' };
  }
  // BMP: BM
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return { kind: 'image', mime: 'image/bmp' };
  }

  // 3. Check for HTML / JSON error payloads or SVG
  const headText = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.subarray(0, Math.min(bytes.length, 256)))
    .trimStart()
    .toLowerCase();

  if (headText.startsWith('<svg') || (headText.startsWith('<?xml') && headText.includes('<svg'))) {
    return { kind: 'image', mime: 'image/svg+xml' };
  }

  if (
    headText.startsWith('<!doctype') ||
    headText.startsWith('<html') ||
    headText.startsWith('<head') ||
    headText.startsWith('{')
  ) {
    return {
      kind: 'invalid_markup',
      reason: 'Respons server bukan berkas PDF/gambar yang valid.',
    };
  }

  return { kind: 'unknown', mime: declaredMime || 'application/octet-stream' };
}

export function isUsableCertificateDataUrl(dataUrl: string | null | undefined): boolean {
  if (!dataUrl || !dataUrl.startsWith('data:')) return false;
  const parsed = parseDataUrlToBytes(dataUrl);
  if (!parsed) return false;
  const detected = detectBinaryFileKind(parsed.bytes, parsed.mime);
  return detected.kind === 'pdf' || detected.kind === 'image';
}

function openCertDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak tersedia di browser ini.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Gagal membuka IndexedDB.'));
  });
}

export async function saveCertificateFile(certId: string, fileUrl: string, fileName?: string): Promise<void> {
  if (!certId || !fileUrl) return;

  // 1. Save to IndexedDB
  try {
    const db = await openCertDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(fileUrl, certId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Gagal menyimpan file sertifikat ke IndexedDB:', err);
  }

  // 2. Also persist to backend if available
  try {
    await fetch('/api/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: certId, fileName: fileName || '', dataUrl: fileUrl }),
    });
  } catch (err) {
    console.warn('Server certificate backup skipped:', err);
  }
}

export async function getCertificateFile(certId: string): Promise<string | null> {
  // 1. Try IndexedDB first
  try {
    const db = await openCertDb();
    const localResult = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(certId);
      req.onsuccess = () => resolve((req.result as string) || null);
      req.onerror = () => reject(req.error);
    });
    if (localResult && isUsableCertificateDataUrl(localResult)) {
      return localResult;
    }
  } catch (err) {
    console.warn('Gagal membaca file sertifikat dari IndexedDB:', err);
  }

  // 2. Fallback to backend server endpoint
  try {
    const res = await fetch(`/api/certificates/${encodeURIComponent(certId)}`);
    if (!res.ok) return null;

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    // Reject HTML SPA fallbacks or JSON error payloads returned with HTTP 200
    if (
      contentType.includes('text/html') ||
      contentType.includes('application/json') ||
      contentType.includes('text/plain')
    ) {
      return null;
    }

    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength === 0) return null;

    const bytes = new Uint8Array(buf);
    const detected = detectBinaryFileKind(bytes, contentType);
    if (detected.kind === 'invalid_markup') {
      return null;
    }

    const cleanBytes =
      detected.kind === 'pdf' && detected.pdfOffset > 0
        ? bytes.subarray(detected.pdfOffset)
        : bytes;
    const resolvedMime =
      detected.kind === 'pdf'
        ? 'application/pdf'
        : detected.kind === 'image'
        ? detected.mime
        : contentType || 'application/octet-stream';

    return bytesToDataUrl(cleanBytes, resolvedMime);
  } catch (err) {
    console.warn('Server certificate fetch skipped:', err);
  }

  return null;
}

export async function deleteCertificateFile(certId: string): Promise<void> {
  try {
    const db = await openCertDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(certId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Gagal menghapus file sertifikat dari IndexedDB:', err);
  }
}
