import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Engineer, AuditRecord } from '../types/skills';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (handles default or custom databaseId)
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export { firebaseConfig };

// ============================================================================
// FIRESTORE ERROR HANDLING (REQUIRED BY SPECIFICATION)
// ============================================================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test as required by skill guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: client is offline.");
      return false;
    }
    return true;
  }
}

// Execute connection test on initialization
testConnection();

// ============================================================================
// DATA SYNCHRONIZATION HELPERS
// ============================================================================

export function subscribeToEngineers(
  onData: (engineers: Engineer[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'engineers');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Engineer[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Engineer);
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'engineers');
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export function subscribeToAuditLogs(
  onData: (logs: AuditRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'auditLogs');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: AuditRecord[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as AuditRecord);
      });
      // Sort desc by timestamp
      list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'auditLogs');
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export function subscribeToConfig(
  onData: (config: { brandName?: string; brandSub?: string; customLogo?: string }) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, 'config', 'general');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as { brandName?: string; brandSub?: string; customLogo?: string });
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'config/general');
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

// Save or Update Engineer
export async function saveEngineerToFirestore(engineer: Engineer): Promise<void> {
  const path = `engineers/${engineer.id}`;
  try {
    const docRef = doc(db, 'engineers', engineer.id);
    let sanitizedCertificates = (engineer.certificates || []).slice(0, 100).map((cert) => {
      const cleanCert: Record<string, unknown> = {
        id: String(cert.id || ''),
        name: String(cert.name || ''),
        issuer: String(cert.issuer || ''),
        year: cert.year ?? new Date().getFullYear(),
      };
      if (cert.fileName) cleanCert.fileName = String(cert.fileName);
      if (cert.fileSize) cleanCert.fileSize = String(cert.fileSize);
      if (cert.fileUrl) cleanCert.fileUrl = String(cert.fileUrl);
      if (cert.hasFile || cert.fileUrl) cleanCert.hasFile = true;
      return cleanCert;
    });

    const cleanAvatarUrl = typeof engineer.avatarUrl === 'string' && engineer.avatarUrl.length <= 500000
      ? engineer.avatarUrl
      : '';

    let payload: Record<string, unknown> = {
      id: String(engineer.id),
      name: String(engineer.name || 'Engineer').slice(0, 150),
      roleTitle: String(engineer.roleTitle || 'Mechanical Engineer').slice(0, 150),
      department: String(engineer.department || 'Mechanical Systems R&D').slice(0, 150),
      email: String(engineer.email || '').slice(0, 150),
      experienceYears: Math.min(80, Math.max(0, Number(engineer.experienceYears) || 0)),
      targetBenchmark: String(engineer.targetBenchmark || 'mid_mechanical').slice(0, 64),
      avatarUrl: cleanAvatarUrl,
      skills: engineer.skills || {},
      certificates: sanitizedCertificates,
      selfAssessments: engineer.selfAssessments || {},
      updatedAt: new Date().toISOString()
    };

    // Firestore has a 1 MiB (1,048,576 bytes) document limit.
    // If payload exceeds 850 KB, strip large fileUrl strings from Firestore payload
    // (the full files remain safely stored in IndexedDB & local state).
    if (JSON.stringify(payload).length > 850000) {
      sanitizedCertificates = sanitizedCertificates.map((c) => {
        const { fileUrl: _omitted, ...metaOnly } = c;
        return metaOnly;
      });
      payload = {
        ...payload,
        certificates: sanitizedCertificates,
      };
    }

    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Delete Engineer
export async function deleteEngineerFromFirestore(engineerId: string): Promise<void> {
  const path = `engineers/${engineerId}`;
  try {
    const docRef = doc(db, 'engineers', engineerId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Save Audit Log
export async function saveAuditLogToFirestore(record: AuditRecord): Promise<void> {
  const path = `auditLogs/${record.id}`;
  try {
    const docRef = doc(db, 'auditLogs', record.id);
    const cleanRecord: AuditRecord = {
      id: String(record.id).slice(0, 128),
      timestamp: String(record.timestamp).slice(0, 64),
      engineerId: String(record.engineerId).slice(0, 128),
      engineerName: String(record.engineerName || '').slice(0, 150),
      skillId: String(record.skillId).slice(0, 128),
      skillName: String(record.skillName || '').slice(0, 150),
      previousLevel: Math.min(5, Math.max(0, Number(record.previousLevel) || 0)) as AuditRecord['previousLevel'],
      newLevel: Math.min(5, Math.max(0, Number(record.newLevel) || 0)) as AuditRecord['newLevel'],
      updatedBy: String(record.updatedBy || '').slice(0, 150),
      reason: String(record.reason || '').slice(0, 500),
    };
    await setDoc(docRef, cleanRecord);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Save App Config
export async function saveConfigToFirestore(config: { brandName: string; brandSub?: string; customLogo?: string }): Promise<void> {
  const path = 'config/general';
  try {
    const docRef = doc(db, 'config', 'general');
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Seed Initial Data to Firestore if collection is empty
export async function seedInitialFirestoreData(initialEngineers: Engineer[], initialAuditLogs: AuditRecord[]): Promise<boolean> {
  try {
    const engSnapshot = await getDocs(collection(db, 'engineers'));
    if (engSnapshot.empty) {
      console.log('Seeding initial engineers to Firestore...');
      for (const eng of initialEngineers) {
        await saveEngineerToFirestore(eng);
      }
    }

    const auditSnapshot = await getDocs(collection(db, 'auditLogs'));
    if (auditSnapshot.empty) {
      console.log('Seeding initial audit logs to Firestore...');
      for (const log of initialAuditLogs) {
        await saveAuditLogToFirestore(log);
      }
    }

    const configDoc = doc(db, 'config', 'general');
    await setDoc(configDoc, {
      brandName: 'MechMatrix',
      brandSub: 'Mechanical Engineering Competency Matrix',
      customLogo: '',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return true;
  } catch (err) {
    console.error('Error seeding initial Firestore data:', err);
    return false;
  }
}
