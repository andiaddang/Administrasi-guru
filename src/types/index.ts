export type Gender = 'L' | 'P';

export type AttendanceStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';

export type GradeType = 'Tugas' | 'Harian' | 'Sumatif' | 'STS' | 'SAS';

export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

export interface User {
  id: string;
  name: string;
  email: string;
  nip: string;
  subject: string;
  role: string;
  avatar?: string;
}

export interface SchoolProfile {
  name: string;
  npsn: string;
  address: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  headmaster: string;
  headmasterNip: string;
  kopHeader1: string;
  kopHeader2: string;
  kopHeader3: string;
  kopHeader4: string;
  kopSubheader: string;
  kopContact: string;
  logoKiri: string;
  logoKanan: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  level: string; // '10' | '11' | '12'
  major: string; // 'Fase E (Umum)', 'Fase F (MIPA)', etc.
  homeroomTeacher: string;
  academicYear: string;
}

export type ThemeMode = 'light' | 'dark';

export type MenuTheme = 'indigo' | 'emerald' | 'navy' | 'slate' | 'maroon' | 'amethyst';

export interface AppThemeConfig {
  mode: ThemeMode;
  menuColor: MenuTheme;
}

export interface Student {
  id: string;
  nisnNis: string; // NISN dan NIS digabung sesuai permintaan
  nisn?: string;
  nis?: string;
  name: string;
  gender: Gender;
  classId: string;
  parentPhone: string;
  address?: string;
  status: 'Aktif' | 'Mutasi' | 'Alumni';
}

export interface Schedule {
  id: string;
  day: DayOfWeek;
  timeStart: string;
  timeEnd: string;
  period: string;
  classId: string;
  subject: string;
  room: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  type: GradeType;
  title: string;
  score: number;
  maxScore: number;
  date: string;
  semester: 'Ganjil' | 'Genap';
  notes?: string;
}

export interface TeachingJournal {
  id: string;
  date: string;
  meetingNumber: number;
  classId: string;
  subject: string;
  time: string;
  topic: string;
  learningActivities: string;
  obstacles: string;
  solutions: string;
  presentCount: number;
  absentCount: number;
}
