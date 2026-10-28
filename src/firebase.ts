import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, signInAnonymously } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import { getDatabase, ref as rtdbRef, get as getRtdb } from 'firebase/database';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Set Firestore log level to error to avoid noisy connection status logs in sandboxed preview
setLogLevel('error');

// CRITICAL: initializeFirestore with experimentalForceLongPolling to avoid WebSocket disconnects in iframe previews
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

// Firebase Realtime Database initialization
export const RTDB_URL =
  (firebaseConfig as any).databaseURL ||
  'https://administrasiguru159-default-rtdb.firebaseio.com';
export const RTDB_PROJECT_NAME = 'Aplikasi Administrasi Guru SMAN 1 Gowa';
export const RTDB_PROJECT_ID = 'administrasiguru159';

export const rtdb = getDatabase(app, RTDB_URL);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Attempt silent anonymous auth to satisfy auth != null rules if enabled
if (typeof window !== 'undefined') {
  try {
    if (!auth.currentUser) {
      signInAnonymously(auth).catch(() => {
        // Silently ignore if anonymous sign-in is disabled in project
      });
    }
  } catch {
    // ignore
  }
}

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
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot per critical constraint
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.code === 'not-found') {
      // Backend is online and responding
      return;
    }
    if (
      error?.code === 'unavailable' ||
      (error instanceof Error && error.message.includes('the client is offline'))
    ) {
      console.warn('Firestore is operating in offline/fallback mode.');
    }
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    testFirestoreConnection().catch(() => {});
  }, 1000);
}

export async function testRtdbConnection(): Promise<boolean> {
  try {
    const connectedRef = rtdbRef(rtdb, '.info/connected');
    const snapshot = await getRtdb(connectedRef);
    return snapshot.val() === true;
  } catch (error) {
    console.warn('Realtime Database connection check:', error);
    return false;
  }
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export { fbSignOut, signInWithPopup };
