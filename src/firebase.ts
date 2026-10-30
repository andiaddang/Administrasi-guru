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
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

WORKSPACE_SCOPES.forEach((scope) => googleProvider.addScope(scope));
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// IN-MEMORY ACCESS TOKEN CACHE (Per workspace skill instructions: never store in localStorage)
let cachedAccessToken: string | null = null;
let currentWorkspaceUser: { displayName?: string; email?: string; photoURL?: string } | null = null;
let isSigningIn = false;

export function getCachedWorkspaceToken(): string | null {
  return cachedAccessToken;
}

export function setCachedWorkspaceToken(token: string | null): void {
  cachedAccessToken = token;
}

export function getCurrentWorkspaceUser(): { displayName?: string; email?: string; photoURL?: string } | null {
  if (currentWorkspaceUser) return currentWorkspaceUser;
  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    return {
      displayName: auth.currentUser.displayName || auth.currentUser.email || 'Guru',
      email: auth.currentUser.email || '',
      photoURL: auth.currentUser.photoURL || '',
    };
  }
  return null;
}

export function setCurrentWorkspaceUser(user: { displayName?: string; email?: string; photoURL?: string } | null): void {
  currentWorkspaceUser = user;
}

auth.onAuthStateChanged((user) => {
  if (!user && !currentWorkspaceUser) {
    cachedAccessToken = null;
  }
});

/**
 * Format auth errors into user-friendly Indonesian messages
 */
export function formatAuthError(error: any): string {
  const code = error?.code || '';
  const msg = error?.message || String(error);

  if (
    msg.includes('admin_policy_enforced') ||
    msg.includes('Akses diblokir') ||
    msg.includes('blocked_by_admin') ||
    code === 'auth/admin-restricted-operation'
  ) {
    return 'Akses diblokir oleh kebijakan administrator akun sekolah/belajar.id (admin_policy_enforced). Gunakan akun Google Pribadi (@gmail.com) atau unduh langsung file Excel (.xlsx) untuk Google Sheets di bawah.';
  }
  if (msg.includes('origin_mismatch') || msg.includes('redirect_uri_mismatch')) {
    return 'Asal domain browser dibatasi oleh Google OAuth Client. Gunakan mode login Firebase Auth resmi atau unduh langsung file spreadsheet (.xlsx).';
  }
  if (code === 'auth/popup-blocked' || msg.includes('popup_blocked') || msg.includes('diblokir')) {
    return 'Jendela popup Google diblokir oleh browser. Silakan klik ikon gembok / popup di bilah alamat browser Anda dan pilih "Izinkan pop-up".';
  }
  if (code === 'auth/popup-closed-by-user' || msg.includes('popup_closed') || msg.includes('ditutup')) {
    return 'Jendela login ditutup sebelum otorisasi selesai. Silakan coba klik tombol kembali.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Domain pratinjau belum terdaftar di Firebase Auth Authorized Domains. Anda tetap dapat menggunakan tombol "Unduh File Excel (.xlsx) Siap Google Sheets" di bawah tanpa perlu login!';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Permintaan popup sebelumnya dibatalkan. Silakan coba kembali.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Koneksi jaringan terputus. Pastikan perangkat Anda terhubung ke internet.';
  }
  if (msg.includes('access_denied')) {
    return 'Izin akses Google Workspace tidak diberikan. Mohon berikan centang persetujuan izin Drive & Sheets.';
  }
  return msg || 'Gagal menghubungkan akun Google Workspace.';
}

/**
 * Helper to ensure Google Identity Services script is ready
 */
export function initGisClient(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window tidak tersedia'));

    const checkGis = () => {
      const g = (window as any).google;
      if (g?.accounts?.oauth2) {
        return g;
      }
      return null;
    };

    const ready = checkGis();
    if (ready) {
      return resolve(ready);
    }

    // Check if script element is in DOM
    let script = document.querySelector('script[src*="accounts.google.com/gsi/client"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      const g = checkGis();
      if (g) {
        clearInterval(interval);
        resolve(g);
      } else if (elapsed > 7000) {
        clearInterval(interval);
        reject(new Error('Pustaka Google Identity Services belum siap. Silakan muat ulang halaman.'));
      }
    }, 100);
  });
}

// Preload GIS on startup so it is immediately available on click
if (typeof window !== 'undefined') {
  initGisClient().catch(() => {});
}

/**
 * Direct Google Identity Services (GIS) OAuth Token Client
 * Runs directly through Google's accounts.google.com without depending on Firebase Auth domain whitelist.
 */
export async function requestGisWorkspaceToken(): Promise<{ user: any; accessToken: string }> {
  if (isSigningIn) {
    throw new Error('Proses login sedang berjalan. Silakan periksa jendela popup browser.');
  }

  isSigningIn = true;
  try {
    const google = await initGisClient();

    return await new Promise<{ user: any; accessToken: string }>((resolve, reject) => {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: firebaseConfig.oAuthClientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.error('GIS Error response:', tokenResponse);
              reject(new Error(tokenResponse.error_description || `Otorisasi Google gagal: ${tokenResponse.error}`));
              return;
            }

            const token = tokenResponse.access_token;
            if (!token) {
              reject(new Error('Tidak ada access token yang dikembalikan dari Google.'));
              return;
            }

            cachedAccessToken = token;

            // Fetch user profile from Google OAuth userinfo endpoint
            let userProfile: any = {
              displayName: 'Akun Google Workspace',
              email: 'andiismail05@guru.sma.belajar.id',
              photoURL: '',
            };

            try {
              const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (userRes.ok) {
                const userData = await userRes.json();
                userProfile = {
                  displayName: userData.name || userData.email || 'Guru',
                  email: userData.email || 'andiismail05@guru.sma.belajar.id',
                  photoURL: userData.picture || '',
                };
              }
            } catch {
              // Keep default profile if userinfo fetch fails
            }

            currentWorkspaceUser = userProfile;
            resolve({ user: userProfile, accessToken: token });
          },
          error_callback: (err: any) => {
            console.error('GIS error_callback:', err);
            if (err?.type === 'popup_blocked_by_browser') {
              reject(new Error('Jendela popup Google diblokir oleh browser. Silakan klik ikon gembok / popup di bilah URL browser Anda dan pilih "Izinkan pop-up".'));
            } else if (err?.type === 'popup_closed') {
              reject(new Error('Jendela login ditutup sebelum otorisasi selesai. Silakan coba kembali.'));
            } else {
              reject(new Error(err?.message || 'Gagal membuka jendela otorisasi Google Identity Services'));
            }
          },
        });

        client.requestAccessToken({ prompt: 'select_account' });
      } catch (err: any) {
        reject(err);
      }
    });
  } catch (error: any) {
    const formatted = formatAuthError(error);
    throw new Error(formatted);
  } finally {
    isSigningIn = false;
  }
}

/**
 * Alternative sign in via Firebase Auth popup
 */
export async function signInWithFirebasePopup(): Promise<{ user: any; accessToken: string }> {
  if (isSigningIn) {
    throw new Error('Proses login sedang berjalan.');
  }

  isSigningIn = true;
  try {
    if (auth.currentUser?.isAnonymous) {
      await fbSignOut(auth).catch(() => {});
    }

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Firebase berhasil login, tetapi tidak mengembalikan OAuth Access Token untuk Google Workspace.');
    }

    cachedAccessToken = credential.accessToken;
    const userProfile = {
      displayName: result.user.displayName || result.user.email || 'Guru',
      email: result.user.email || '',
      photoURL: result.user.photoURL || '',
    };
    currentWorkspaceUser = userProfile;
    return {
      user: userProfile,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    const formatted = formatAuthError(error);
    throw new Error(formatted);
  } finally {
    isSigningIn = false;
  }
}

/**
 * Sign in to Google Workspace using official Firebase Auth Popup flow
 * (Uses gen-lang-client-0594554728.firebaseapp.com authorized redirect handler to prevent origin_mismatch)
 */
export async function signInWithGoogleWorkspace(): Promise<{ user: any; accessToken: string }> {
  return signInWithFirebasePopup();
}

export async function signOutWorkspace(): Promise<void> {
  cachedAccessToken = null;
  currentWorkspaceUser = null;
  await fbSignOut(auth).catch(() => {});
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
