import {
  SchoolProfile,
  User,
  ClassRoom,
  Student,
  Schedule,
  AttendanceRecord,
  GradeRecord,
  TeachingJournal,
  AppThemeConfig,
} from '../types';
import {
  DEFAULT_SCHOOL,
  DEFAULT_USER,
  DEFAULT_CLASSES,
  DEFAULT_STUDENTS,
  DEFAULT_SCHEDULES,
  DEFAULT_JOURNALS,
  DEFAULT_GRADES,
  DEFAULT_ATTENDANCES,
} from '../data/initialData';

const KEYS = {
  SCHOOL: 'sman1gowa_school',
  CURRENT_USER: 'sman1gowa_current_user',
  ACCOUNTS: 'sman1gowa_accounts',
  CLASSES: 'sman1gowa_classes',
  STUDENTS: 'sman1gowa_students',
  SCHEDULES: 'sman1gowa_schedules',
  ATTENDANCES: 'sman1gowa_attendances',
  GRADES: 'sman1gowa_grades',
  JOURNALS: 'sman1gowa_journals',
  THEME: 'sman1gowa_theme_config',
  LAST_LOCAL_MUTATION: 'sman1gowa_last_local_mutation',
};

export const DEFAULT_THEME_CONFIG: AppThemeConfig = {
  mode: 'light',
  menuColor: 'navy',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

export const StorageService = {
  touchLocalMutation(): number {
    const now = Date.now();
    try {
      localStorage.setItem(KEYS.LAST_LOCAL_MUTATION, String(now));
    } catch {
      // ignore
    }
    return now;
  },

  getLastLocalMutation(): number {
    try {
      const v = localStorage.getItem(KEYS.LAST_LOCAL_MUTATION);
      return v ? Number(v) : 0;
    } catch {
      return 0;
    }
  },

  getSchool(): SchoolProfile {
    const data = safeGet<SchoolProfile>(KEYS.SCHOOL, DEFAULT_SCHOOL);
    return {
      ...DEFAULT_SCHOOL,
      ...data,
      logoKiriSize: data.logoKiriSize ?? 80,
      logoKananSize: data.logoKananSize ?? 80,
    };
  },
  saveSchool(school: SchoolProfile): void {
    safeSet(KEYS.SCHOOL, school);
    this.touchLocalMutation();
  },

  getCurrentUser(): User | null {
    return safeGet<User | null>(KEYS.CURRENT_USER, DEFAULT_USER);
  },
  saveCurrentUser(user: User | null): void {
    if (user === null) {
      localStorage.removeItem(KEYS.CURRENT_USER);
    } else {
      safeSet(KEYS.CURRENT_USER, user);
    }
    this.touchLocalMutation();
  },

  getAccounts(): Array<User & { passwordHash: string }> {
    const defaultAcc = [{ ...DEFAULT_USER, passwordHash: '123456' }];
    return safeGet<Array<User & { passwordHash: string }>>(KEYS.ACCOUNTS, defaultAcc);
  },
  saveAccounts(accounts: Array<User & { passwordHash: string }>): void {
    safeSet(KEYS.ACCOUNTS, accounts);
  },

  getClasses(): ClassRoom[] {
    return safeGet<ClassRoom[]>(KEYS.CLASSES, DEFAULT_CLASSES);
  },
  saveClasses(classes: ClassRoom[]): void {
    safeSet(KEYS.CLASSES, classes);
    this.touchLocalMutation();
  },

  getStudents(): Student[] {
    const raw = safeGet<any[]>(KEYS.STUDENTS, DEFAULT_STUDENTS);
    return raw.map((s) => ({
      ...s,
      nisnNis: s.nisnNis || (s.nisn && s.nis ? `${s.nisn} / ${s.nis}` : s.nisn || s.nis || '-'),
    }));
  },
  saveStudents(students: Student[]): void {
    safeSet(KEYS.STUDENTS, students);
    this.touchLocalMutation();
  },

  getTheme(): AppThemeConfig {
    return safeGet<AppThemeConfig>(KEYS.THEME, DEFAULT_THEME_CONFIG);
  },
  saveTheme(theme: AppThemeConfig): void {
    safeSet(KEYS.THEME, theme);
    this.touchLocalMutation();
  },

  updateUserProfile(updatedUser: User): void {
    safeSet(KEYS.CURRENT_USER, updatedUser);
    const accounts = this.getAccounts();
    const updatedAccounts = accounts.map((acc) =>
      acc.id === updatedUser.id ? { ...acc, ...updatedUser } : acc
    );
    this.saveAccounts(updatedAccounts);
    this.touchLocalMutation();
  },

  getSchedules(): Schedule[] {
    return safeGet<Schedule[]>(KEYS.SCHEDULES, DEFAULT_SCHEDULES);
  },
  saveSchedules(schedules: Schedule[]): void {
    safeSet(KEYS.SCHEDULES, schedules);
    this.touchLocalMutation();
  },

  getAttendances(): AttendanceRecord[] {
    return safeGet<AttendanceRecord[]>(KEYS.ATTENDANCES, DEFAULT_ATTENDANCES);
  },
  saveAttendances(attendances: AttendanceRecord[]): void {
    safeSet(KEYS.ATTENDANCES, attendances);
    this.touchLocalMutation();
  },

  getGrades(): GradeRecord[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(KEYS.GRADES);
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Error parsing stored grades:', e);
        return [];
      }
    }
    // Tampilan awal sebelum nilai dimasukkan: kosong bersih
    return [];
  },
  saveGrades(grades: GradeRecord[]): void {
    safeSet(KEYS.GRADES, grades);
    this.touchLocalMutation();
  },

  getJournals(): TeachingJournal[] {
    return safeGet<TeachingJournal[]>(KEYS.JOURNALS, DEFAULT_JOURNALS);
  },
  saveJournals(journals: TeachingJournal[]): void {
    safeSet(KEYS.JOURNALS, journals);
    this.touchLocalMutation();
  },

  resetToDefaults(): void {
    safeSet(KEYS.SCHOOL, DEFAULT_SCHOOL);
    safeSet(KEYS.CURRENT_USER, DEFAULT_USER);
    safeSet(KEYS.CLASSES, DEFAULT_CLASSES);
    safeSet(KEYS.STUDENTS, DEFAULT_STUDENTS);
    safeSet(KEYS.SCHEDULES, DEFAULT_SCHEDULES);
    safeSet(KEYS.ATTENDANCES, DEFAULT_ATTENDANCES);
    safeSet(KEYS.GRADES, DEFAULT_GRADES);
    safeSet(KEYS.JOURNALS, DEFAULT_JOURNALS);
    safeSet(KEYS.THEME, DEFAULT_THEME_CONFIG);
    this.touchLocalMutation();
  },
};
