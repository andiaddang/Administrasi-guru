import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, signInAnonymously } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
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
  (firebaseConfig as any).firestoreDatabaseId
);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

WORKSPACE_SCOPES.forEach((scope) => googleProvider.addScope(scope));
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// IN-MEMORY ACCESS TOKEN CACHE (Per workspace skill instructions: never store in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

auth.onAuthStateChanged((user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

export function getCachedWorkspaceToken(): string | null {
  return cachedAccessToken;
}

export function setCachedWorkspaceToken(token: string | null): void {
  cachedAccessToken = token;
}

export async function signInWithGoogleWorkspace(): Promise<{ user: any; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh access token Google Workspace.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export async function signOutWorkspace(): Promise<void> {
  cachedAccessToken = null;
  await fbSignOut(auth);
}

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

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export { fbSignOut, signInWithPopup };
