/**
 * Hybrid Certificate File Storage:
 * 1. IndexedDB (client-side, up to 10MB+ per file)
 * 2. Express Server `/api/certificates` (server-side disk persistence)
 */

const DB_NAME = 'mechmatrix_certs_db';
const STORE_NAME = 'certificates';
const DB_VERSION = 1;

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

  // 2. Also persist to Express backend if available
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
    if (localResult) return localResult;
  } catch (err) {
    console.warn('Gagal membaca file sertifikat dari IndexedDB:', err);
  }

  // 2. Fallback to Express server endpoint
  try {
    const res = await fetch(`/api/certificates/${encodeURIComponent(certId)}`);
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Gagal membaca blob server'));
        reader.readAsDataURL(blob);
      });
    }
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
