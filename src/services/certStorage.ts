/**
 * IndexedDB storage for certificate files (PDFs & images)
 * Allows storing files up to 10MB+ without hitting localStorage (5MB) or Firestore (1MB) limits.
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

export async function saveCertificateFile(certId: string, fileUrl: string): Promise<void> {
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
}

export async function getCertificateFile(certId: string): Promise<string | null> {
  try {
    const db = await openCertDb();
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(certId);
      req.onsuccess = () => resolve((req.result as string) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal membaca file sertifikat dari IndexedDB:', err);
    return null;
  }
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
