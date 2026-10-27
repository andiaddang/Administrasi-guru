import {
  ref,
  set,
  get,
  onValue,
  off,
  DataSnapshot,
} from 'firebase/database';
import { rtdb, RTDB_URL, RTDB_PROJECT_NAME, RTDB_PROJECT_ID } from '../firebase';
import {
  SchoolProfile,
  ClassRoom,
  Student,
  Schedule,
  AttendanceRecord,
  GradeRecord,
  TeachingJournal,
  User,
  AppThemeConfig,
} from '../types';

export interface RtdbSyncPayload {
  school?: SchoolProfile;
  classes?: ClassRoom[];
  students?: Student[];
  schedules?: Schedule[];
  attendances?: AttendanceRecord[];
  grades?: GradeRecord[];
  journals?: TeachingJournal[];
  theme?: AppThemeConfig;
  lastUpdated?: string;
  updatedBy?: string;
  projectName?: string;
  appVersion?: string;
}

export interface RtdbStatus {
  isConnected: boolean;
  databaseUrl: string;
  projectName: string;
  projectId: string;
  lastSyncTime: string | null;
  lastError: string | null;
  syncInProgress: boolean;
  isPermissionDenied: boolean;
}

// Default root node in Realtime Database
const ROOT_PATH = 'administrasi_guru_sman1gowa';

class RtdbServiceClass {
  private lastSyncTime: string | null = null;
  private isConnected: boolean = false;
  private lastError: string | null = null;
  private syncInProgress: boolean = false;
  private isPermissionDenied: boolean = false;
  private statusListeners: Array<(status: RtdbStatus) => void> = [];
  private isInitialized: boolean = false;

  constructor() {
    this.initConnectionMonitor();
  }

  private initConnectionMonitor() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    try {
      const connectedRef = ref(rtdb, '.info/connected');
      onValue(
        connectedRef,
        (snap: DataSnapshot) => {
          this.isConnected = snap.val() === true;
          this.notifyStatus();
        },
        (err) => {
          console.warn('Realtime Database monitor notice:', err?.message || String(err));
          if (String(err?.message || err).toLowerCase().includes('permission')) {
            this.isPermissionDenied = true;
          }
          this.lastError = err?.message || 'Gagal memantau koneksi';
          this.notifyStatus();
        }
      );
    } catch (e: any) {
      console.warn('Gagal memonitor status RTDB:', e);
      this.lastError = e?.message || 'Gagal memantau koneksi';
    }
  }

  public subscribeStatus(listener: (status: RtdbStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private notifyStatus() {
    const current = this.getStatus();
    this.statusListeners.forEach((listener) => {
      try {
        listener(current);
      } catch {
        // ignore
      }
    });
  }

  public getStatus(): RtdbStatus {
    return {
      isConnected: this.isConnected,
      databaseUrl: RTDB_URL,
      projectName: RTDB_PROJECT_NAME,
      projectId: RTDB_PROJECT_ID,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError,
      syncInProgress: this.syncInProgress,
      isPermissionDenied: this.isPermissionDenied,
    };
  }

  public hasPermissionDenied(): boolean {
    return this.isPermissionDenied;
  }

  public resetPermissionState(): void {
    this.isPermissionDenied = false;
    this.lastError = null;
    this.notifyStatus();
  }

  /**
   * Mengunggah seluruh data administrasi sekolah & guru ke Firebase Realtime Database
   */
  public async syncAllToCloud(data: {
    school: SchoolProfile;
    classes: ClassRoom[];
    students: Student[];
    schedules: Schedule[];
    attendances: AttendanceRecord[];
    grades: GradeRecord[];
    journals: TeachingJournal[];
    theme?: AppThemeConfig;
    currentUser?: User | null;
  }): Promise<{ success: boolean; error?: string; timestamp?: string }> {
    if (this.isPermissionDenied) {
      return {
        success: false,
        error: this.lastError || 'Izin akses Realtime Database dibatasi (Permission Denied).',
      };
    }

    this.syncInProgress = true;
    this.lastError = null;
    this.notifyStatus();

    try {
      const now = new Date().toISOString();
      const payload: RtdbSyncPayload = {
        school: data.school,
        classes: data.classes,
        students: data.students,
        schedules: data.schedules,
        attendances: data.attendances,
        grades: data.grades,
        journals: data.journals,
        theme: data.theme,
        lastUpdated: now,
        updatedBy: data.currentUser
          ? `${data.currentUser.name} (${data.currentUser.email || 'Guru'})`
          : 'Guru SMAN 1 Gowa',
        projectName: RTDB_PROJECT_NAME,
        appVersion: '2.0.0-rtdb',
      };

      const targetRef = ref(rtdb, ROOT_PATH);
      await set(targetRef, payload);

      this.lastSyncTime = now;
      this.isConnected = true;
      this.isPermissionDenied = false;
      this.lastError = null;
      this.syncInProgress = false;
      this.notifyStatus();

      return { success: true, timestamp: now };
    } catch (err: any) {
      const rawMsg = err?.message || String(err || '');
      const isPerm =
        rawMsg.toLowerCase().includes('permission') ||
        rawMsg.toLowerCase().includes("client doesn't have permission");

      if (isPerm) {
        this.isPermissionDenied = true;
        this.lastError =
          'Izin akses Realtime Database ditolak. Pastikan Rules di Firebase Console mengizinkan tulis atau lakukan Login.';
      } else {
        this.lastError = rawMsg || 'Gagal menyimpan ke Realtime Database';
      }

      console.warn('Realtime Database sync notice:', this.lastError);
      this.isConnected = false;
      this.syncInProgress = false;
      this.notifyStatus();
      return { success: false, error: this.lastError || undefined };
    }
  }

  /**
   * Membaca seluruh data dari Firebase Realtime Database
   */
  public async loadAllFromCloud(): Promise<{
    success: boolean;
    data?: RtdbSyncPayload | null;
    error?: string;
  }> {
    if (this.isPermissionDenied) {
      return {
        success: false,
        error: this.lastError || 'Izin akses Realtime Database dibatasi (Permission Denied).',
      };
    }

    this.syncInProgress = true;
    this.notifyStatus();

    try {
      const targetRef = ref(rtdb, ROOT_PATH);
      const snapshot = await get(targetRef);

      this.syncInProgress = false;
      if (snapshot.exists()) {
        const val = snapshot.val() as RtdbSyncPayload;
        this.lastSyncTime = new Date().toISOString();
        this.isConnected = true;
        this.isPermissionDenied = false;
        this.lastError = null;
        this.notifyStatus();
        return { success: true, data: val };
      } else {
        this.isConnected = true;
        this.isPermissionDenied = false;
        this.lastError = null;
        this.notifyStatus();
        return { success: true, data: null };
      }
    } catch (err: any) {
      const rawMsg = err?.message || String(err || '');
      const isPerm =
        rawMsg.toLowerCase().includes('permission') ||
        rawMsg.toLowerCase().includes("client doesn't have permission");

      if (isPerm) {
        this.isPermissionDenied = true;
        this.lastError =
          'Izin akses Realtime Database ditolak. Pastikan Rules di Firebase Console mengizinkan baca atau lakukan Login.';
      } else {
        this.lastError = rawMsg || 'Gagal mengambil data dari Realtime Database';
      }

      console.warn('Realtime Database read notice:', this.lastError);
      this.isConnected = false;
      this.syncInProgress = false;
      this.notifyStatus();
      return { success: false, error: this.lastError || undefined };
    }
  }

  /**
   * Berlangganan (realtime listener) terhadap perubahan data di Firebase Realtime Database
   */
  public subscribeToRealtimeCloud(
    callback: (data: RtdbSyncPayload) => void
  ): () => void {
    const targetRef = ref(rtdb, ROOT_PATH);

    const handleValue = (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val() as RtdbSyncPayload;
        this.lastSyncTime = new Date().toISOString();
        this.isConnected = true;
        this.isPermissionDenied = false;
        this.notifyStatus();
        callback(val);
      }
    };

    const handleError = (error: Error) => {
      const rawMsg = error?.message || String(error || '');
      const isPerm =
        rawMsg.toLowerCase().includes('permission') ||
        rawMsg.toLowerCase().includes("client doesn't have permission");

      if (isPerm) {
        this.isPermissionDenied = true;
        this.lastError =
          'Aturan keamanan (Rules) Firebase Realtime Database membatasi akses baca/tulis. Pastikan Rules di Firebase Console sudah disetel atau lakukan Login.';
      } else {
        this.lastError = rawMsg;
      }

      console.warn('Realtime Database listener notice:', this.lastError);
      this.isConnected = false;
      this.notifyStatus();
    };

    onValue(targetRef, handleValue, handleError);

    return () => {
      off(targetRef, 'value', handleValue);
    };
  }

  /**
   * Menyimpan satu entitas secara independen ke Realtime Database
   */
  public async saveEntity<T>(subPath: string, data: T): Promise<boolean> {
    if (this.isPermissionDenied) return false;
    try {
      const entityRef = ref(rtdb, `${ROOT_PATH}/${subPath}`);
      await set(entityRef, data);
      return true;
    } catch (err: any) {
      console.warn(`Pemberitahuan simpan ${subPath} ke RTDB:`, err?.message || err);
      return false;
    }
  }
}

export const RtdbService = new RtdbServiceClass();
