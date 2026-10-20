import {
  SchoolProfile,
  User,
  ClassRoom,
  Student,
  Schedule,
  AttendanceRecord,
  GradeRecord,
  TeachingJournal,
} from '../types';

export const DEFAULT_USER: User = {
  id: 'usr-1',
  name: 'Andi Ismail, S.Pd.',
  email: 'andiismail05@guru.sma.belajar.id',
  nip: '19880815 201403 1 004',
  subject: 'Matematika & Informatika',
  role: 'Guru Mata Pelajaran',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

// SVG data URI for Logo Pemprov Sulsel / Tut Wuri Handayani as fallback
export const DEFAULT_LOGO_KIRI = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 92,26 92,74 50,95 8,74 8,26" fill="%23dc2626"/><polygon points="50,12 85,30 85,70 50,88 15,70 15,30" fill="%23fbbf24"/><circle cx="50" cy="50" r="24" fill="%230284c7"/><path d="M50 32 L54 44 L67 44 L57 52 L61 64 L50 56 L39 64 L43 52 L33 44 L46 44 Z" fill="%23ffffff"/></svg>';

export const DEFAULT_LOGO_KANAN = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1kVIzURAYqwbGKIKxPva-YMJ-f9n2vZsCB9QOQ7PVtLNReAVVTpidpKQF&s=10';

export const DEFAULT_SCHOOL: SchoolProfile = {
  name: 'SMA Negeri 1 Gowa',
  npsn: '40301015',
  address: 'Jalan Andi Mallombasang No.1 A',
  district: 'Somba Opu',
  city: 'Kabupaten Gowa',
  province: 'Sulawesi Selatan',
  postalCode: '92111',
  phone: '(0411) 861234',
  email: 'info@sman1gowa.sch.id',
  website: 'https://sman1gowa.sch.id',
  academicYear: '2026/2027',
  semester: 'Ganjil',
  headmaster: 'Drs. H. Arsyad, M.Pd.',
  headmasterNip: '19680512 199412 1 002',
  kopHeader1: 'PEMERINTAH PROVINSI SULAWESI SELATAN',
  kopHeader2: 'DINAS PENDIDIKAN',
  kopHeader3: 'CABANG DINAS PENDIDIKAN WILAYAH II (GOWA - TAKALAR)',
  kopHeader4: 'UPT SMA NEGERI 1 GOWA',
  kopSubheader: 'Jalan Andi Mallombasang No.1 A, Tombolo, Kec. Somba Opu, Kabupaten Gowa 92111',
  kopContact: 'Telepon: (0411) 861234 | Laman: sman1gowa.sch.id | Pos-el: info@sman1gowa.sch.id',
  logoKiri: DEFAULT_LOGO_KIRI,
  logoKanan: DEFAULT_LOGO_KANAN,
};

export const DEFAULT_CLASSES: ClassRoom[] = [
  {
    id: 'cls-1',
    name: 'X.1 (Fase E-1)',
    level: '10',
    major: 'Fase E (Umum)',
    homeroomTeacher: 'Dra. Hj. Nurhayati, M.Pd.',
    academicYear: '2026/2027',
  },
  {
    id: 'cls-2',
    name: 'XI.F-1 (MIPA)',
    level: '11',
    major: 'Pilihan MIPA',
    homeroomTeacher: 'Muhammad Yusuf, S.Si., M.Pd.',
    academicYear: '2026/2027',
  },
  {
    id: 'cls-3',
    name: 'XI.F-2 (IPS)',
    level: '11',
    major: 'Pilihan IPS',
    homeroomTeacher: 'Fatmawati, S.Pd.',
    academicYear: '2026/2027',
  },
  {
    id: 'cls-4',
    name: 'XII.MIPA-1',
    level: '12',
    major: 'MIPA Peminatan',
    homeroomTeacher: 'Drs. Baharuddin, M.M.',
    academicYear: '2026/2027',
  },
];

export const DEFAULT_STUDENTS: Student[] = [
  // Kelas X.1
  { id: 'std-101', nisnNis: '0081234001 / 2425001', nisn: '0081234001', nis: '2425001', name: 'Andi Siti Nurhaliza', gender: 'P', classId: 'cls-1', parentPhone: '081242331101', status: 'Aktif' },
  { id: 'std-102', nisnNis: '0081234002 / 2425002', nisn: '0081234002', nis: '2425002', name: 'Muh. Fajar Ramadhan', gender: 'L', classId: 'cls-1', parentPhone: '081242331102', status: 'Aktif' },
  { id: 'std-103', nisnNis: '0081234003 / 2425003', nisn: '0081234003', nis: '2425003', name: 'Nur Aisyah Maharani', gender: 'P', classId: 'cls-1', parentPhone: '081242331103', status: 'Aktif' },
  { id: 'std-104', nisnNis: '0081234004 / 2425004', nisn: '0081234004', nis: '2425004', name: 'Arya Pratama Putra', gender: 'L', classId: 'cls-1', parentPhone: '081242331104', status: 'Aktif' },
  { id: 'std-105', nisnNis: '0081234005 / 2425005', nisn: '0081234005', nis: '2425005', name: 'Dian Anggraeni', gender: 'P', classId: 'cls-1', parentPhone: '081242331105', status: 'Aktif' },
  { id: 'std-106', nisnNis: '0081234006 / 2425006', nisn: '0081234006', nis: '2425006', name: 'Muh. Rifqi Al-Farabi', gender: 'L', classId: 'cls-1', parentPhone: '081242331106', status: 'Aktif' },
  { id: 'std-107', nisnNis: '0081234007 / 2425007', nisn: '0081234007', nis: '2425007', name: 'Sri Wahyuni', gender: 'P', classId: 'cls-1', parentPhone: '081242331107', status: 'Aktif' },
  { id: 'std-108', nisnNis: '0081234008 / 2425008', nisn: '0081234008', nis: '2425008', name: 'Rezky Aditya Firmansyah', gender: 'L', classId: 'cls-1', parentPhone: '081242331108', status: 'Aktif' },

  // Kelas XI.F-1
  { id: 'std-201', nisnNis: '0071234001 / 2324001', nisn: '0071234001', nis: '2324001', name: 'Andi Muh. Dzaki', gender: 'L', classId: 'cls-2', parentPhone: '081342112201', status: 'Aktif' },
  { id: 'std-202', nisnNis: '0071234002 / 2324002', nisn: '0071234002', nis: '2324002', name: 'Putri Ayu Lestari', gender: 'P', classId: 'cls-2', parentPhone: '081342112202', status: 'Aktif' },
  { id: 'std-203', nisnNis: '0071234003 / 2324003', nisn: '0071234003', nis: '2324003', name: 'Ahmad Fauzan', gender: 'L', classId: 'cls-2', parentPhone: '081342112203', status: 'Aktif' },
  { id: 'std-204', nisnNis: '0071234004 / 2324004', nisn: '0071234004', nis: '2324004', name: 'Salsabila Putri', gender: 'P', classId: 'cls-2', parentPhone: '081342112204', status: 'Aktif' },
  { id: 'std-205', nisnNis: '0071234005 / 2324005', nisn: '0071234005', nis: '2324005', name: 'Muhammad Haidar', gender: 'L', classId: 'cls-2', parentPhone: '081342112205', status: 'Aktif' },
  { id: 'std-206', nisnNis: '0071234006 / 2324006', nisn: '0071234006', nis: '2324006', name: 'Nurul Hidayah', gender: 'P', classId: 'cls-2', parentPhone: '081342112206', status: 'Aktif' },
  { id: 'std-207', nisnNis: '0071234007 / 2324007', nisn: '0071234007', nis: '2324007', name: 'Ilham Jaya Kusuma', gender: 'L', classId: 'cls-2', parentPhone: '081342112207', status: 'Aktif' },
  { id: 'std-208', nisnNis: '0071234008 / 2324008', nisn: '0071234008', nis: '2324008', name: 'Zahra Amelia', gender: 'P', classId: 'cls-2', parentPhone: '081342112208', status: 'Aktif' },

  // Kelas XI.F-2
  { id: 'std-301', nisnNis: '0071234101 / 2324101', nisn: '0071234101', nis: '2324101', name: 'Bahrul Alam', gender: 'L', classId: 'cls-3', parentPhone: '085242551101', status: 'Aktif' },
  { id: 'std-302', nisnNis: '0071234102 / 2324102', nisn: '0071234102', nis: '2324102', name: 'Citra Kirana Dewi', gender: 'P', classId: 'cls-3', parentPhone: '085242551102', status: 'Aktif' },
  { id: 'std-303', nisnNis: '0071234103 / 2324103', nisn: '0071234103', nis: '2324103', name: 'Fikri Haikal', gender: 'L', classId: 'cls-3', parentPhone: '085242551103', status: 'Aktif' },
  { id: 'std-304', nisnNis: '0071234104 / 2324104', nisn: '0071234104', nis: '2324104', name: 'Mutmainnah', gender: 'P', classId: 'cls-3', parentPhone: '085242551104', status: 'Aktif' },
  { id: 'std-305', nisnNis: '0071234105 / 2324105', nisn: '0071234105', nis: '2324105', name: 'Rahmat Hidayat', gender: 'L', classId: 'cls-3', parentPhone: '085242551105', status: 'Aktif' },

  // Kelas XII.MIPA-1
  { id: 'std-401', nisnNis: '0061234001 / 2223001', nisn: '0061234001', nis: '2223001', name: 'Aditya Nugraha', gender: 'L', classId: 'cls-4', parentPhone: '08114422001', status: 'Aktif' },
  { id: 'std-402', nisnNis: '0061234002 / 2223002', nisn: '0061234002', nis: '2223002', name: 'Fitriani Syam', gender: 'P', classId: 'cls-4', parentPhone: '08114422002', status: 'Aktif' },
  { id: 'std-403', nisnNis: '0061234003 / 2223003', nisn: '0061234003', nis: '2223003', name: 'Taufiq Hidayatullah', gender: 'L', classId: 'cls-4', parentPhone: '08114422003', status: 'Aktif' },
  { id: 'std-404', nisnNis: '0061234004 / 2223004', nisn: '0061234004', nis: '2223004', name: 'Widya Astuti', gender: 'P', classId: 'cls-4', parentPhone: '08114422004', status: 'Aktif' },
];

export const DEFAULT_SCHEDULES: Schedule[] = [
  { id: 'sch-1', day: 'Senin', timeStart: '07:30', timeEnd: '09:00', period: 'Jam 1 - 2', classId: 'cls-1', subject: 'Matematika Fase E', room: 'R. 101', notes: 'Materi Eksponen' },
  { id: 'sch-2', day: 'Senin', timeStart: '09:15', timeEnd: '10:45', period: 'Jam 3 - 4', classId: 'cls-2', subject: 'Matematika Tingkat Lanjut', room: 'R. 201', notes: 'Polinomial' },
  { id: 'sch-3', day: 'Selasa', timeStart: '08:00', timeEnd: '09:30', period: 'Jam 2 - 3', classId: 'cls-3', subject: 'Informatika', room: 'Lab Komputer 1', notes: 'Analisis Data' },
  { id: 'sch-4', day: 'Rabu', timeStart: '07:30', timeEnd: '09:00', period: 'Jam 1 - 2', classId: 'cls-4', subject: 'Matematika Peminatan', room: 'R. 301', notes: 'Limit Fungsi Trigonometri' },
  { id: 'sch-5', day: 'Kamis', timeStart: '10:00', timeEnd: '11:30', period: 'Jam 4 - 5', classId: 'cls-1', subject: 'Matematika Fase E', room: 'R. 101', notes: 'Latihan Soal Eksponen' },
  { id: 'sch-6', day: 'Jumat', timeStart: '08:00', timeEnd: '09:30', period: 'Jam 2 - 3', classId: 'cls-2', subject: 'Matematika Tingkat Lanjut', room: 'R. 201', notes: 'Asesmen Formatif' },
];

export const DEFAULT_JOURNALS: TeachingJournal[] = [
  {
    id: 'jrn-1',
    date: '2026-10-12',
    meetingNumber: 10,
    classId: 'cls-1',
    subject: 'Matematika Fase E',
    time: '07:30 - 09:00',
    topic: 'Fungsi Eksponensial dan Grafik Hubungannya',
    learningActivities: 'Diskusi kelompok membedah karakteristik grafik fungsi f(x)=a^x dan presentasi hasil pemodelan pertumbuhan bakteri.',
    obstacles: 'Beberapa siswa masih bingung membedakan asimtot datar dan sumbu simetri.',
    solutions: 'Diberikan penguatan visual menggunakan media Geogebra di proyektor kelas.',
    presentCount: 7,
    absentCount: 1,
  },
  {
    id: 'jrn-2',
    date: '2026-10-14',
    meetingNumber: 11,
    classId: 'cls-2',
    subject: 'Matematika Tingkat Lanjut',
    time: '09:15 - 10:45',
    topic: 'Teorema Sisa dan Pembagian Suku Banyak (Polinomial)',
    learningActivities: 'Praktik pembagian Horner vs pembagian bersusun panjang, dilanjutkan kuis singkat per individu.',
    obstacles: 'Satu siswa sering terlambat masuk kelas setelah jam istirahat pertama.',
    solutions: 'Konseling singkat di akhir jam pelajaran dan penegasan kesepakatan kelas.',
    presentCount: 8,
    absentCount: 0,
  },
  {
    id: 'jrn-3',
    date: '2026-10-15',
    meetingNumber: 8,
    classId: 'cls-3',
    subject: 'Informatika',
    time: '08:00 - 09:30',
    topic: 'Visualisasi Data dan Analisis Statistik Spreadsheet',
    learningActivities: 'Praktik di Lab Komputer mengolah dataset kependudukan Gowa menggunakan fungsi pivot dan grafik batang.',
    obstacles: 'Komputer nomor 7 mouse tidak responsif.',
    solutions: 'Dipindahkan ke komputer cadangan nomor 12 dan dikoordinasikan ke teknisi lab.',
    presentCount: 5,
    absentCount: 0,
  },
];

// Seed realistic grades
export const DEFAULT_GRADES: GradeRecord[] = [
  // Kelas X.1
  { id: 'grd-101-1', studentId: 'std-101', classId: 'cls-1', subject: 'Matematika', type: 'Tugas', title: 'Tugas 1: Eksponen', score: 92, maxScore: 100, date: '2026-09-10', semester: 'Ganjil' },
  { id: 'grd-101-h', studentId: 'std-101', classId: 'cls-1', subject: 'Matematika', type: 'Harian', title: 'Formatif: Konsep Eksponensial', score: 90, maxScore: 100, date: '2026-09-16', semester: 'Ganjil' },
  { id: 'grd-101-2', studentId: 'std-101', classId: 'cls-1', subject: 'Matematika', type: 'Sumatif', title: 'Sumatif Lingkup Materi 1', score: 95, maxScore: 100, date: '2026-09-22', semester: 'Ganjil' },
  { id: 'grd-101-3', studentId: 'std-101', classId: 'cls-1', subject: 'Matematika', type: 'STS', title: 'Sumatif Tengah Semester', score: 94, maxScore: 100, date: '2026-10-05', semester: 'Ganjil' },
  { id: 'grd-101-4', studentId: 'std-101', classId: 'cls-1', subject: 'Matematika', type: 'SAS', title: 'Sumatif Akhir Semester', score: 96, maxScore: 100, date: '2026-10-15', semester: 'Ganjil' },

  { id: 'grd-102-1', studentId: 'std-102', classId: 'cls-1', subject: 'Matematika', type: 'Tugas', title: 'Tugas 1: Eksponen', score: 85, maxScore: 100, date: '2026-09-10', semester: 'Ganjil' },
  { id: 'grd-102-h', studentId: 'std-102', classId: 'cls-1', subject: 'Matematika', type: 'Harian', title: 'Formatif: Konsep Eksponensial', score: 84, maxScore: 100, date: '2026-09-16', semester: 'Ganjil' },
  { id: 'grd-102-2', studentId: 'std-102', classId: 'cls-1', subject: 'Matematika', type: 'Sumatif', title: 'Sumatif Lingkup Materi 1', score: 82, maxScore: 100, date: '2026-09-22', semester: 'Ganjil' },
  { id: 'grd-102-3', studentId: 'std-102', classId: 'cls-1', subject: 'Matematika', type: 'STS', title: 'Sumatif Tengah Semester', score: 88, maxScore: 100, date: '2026-10-05', semester: 'Ganjil' },
  { id: 'grd-102-4', studentId: 'std-102', classId: 'cls-1', subject: 'Matematika', type: 'SAS', title: 'Sumatif Akhir Semester', score: 86, maxScore: 100, date: '2026-10-15', semester: 'Ganjil' },

  { id: 'grd-103-1', studentId: 'std-103', classId: 'cls-1', subject: 'Matematika', type: 'Tugas', title: 'Tugas 1: Eksponen', score: 90, maxScore: 100, date: '2026-09-10', semester: 'Ganjil' },
  { id: 'grd-103-h', studentId: 'std-103', classId: 'cls-1', subject: 'Matematika', type: 'Harian', title: 'Formatif: Konsep Eksponensial', score: 88, maxScore: 100, date: '2026-09-16', semester: 'Ganjil' },
  { id: 'grd-103-2', studentId: 'std-103', classId: 'cls-1', subject: 'Matematika', type: 'Sumatif', title: 'Sumatif Lingkup Materi 1', score: 88, maxScore: 100, date: '2026-09-22', semester: 'Ganjil' },
  { id: 'grd-103-3', studentId: 'std-103', classId: 'cls-1', subject: 'Matematika', type: 'STS', title: 'Sumatif Tengah Semester', score: 91, maxScore: 100, date: '2026-10-05', semester: 'Ganjil' },
  { id: 'grd-103-4', studentId: 'std-103', classId: 'cls-1', subject: 'Matematika', type: 'SAS', title: 'Sumatif Akhir Semester', score: 89, maxScore: 100, date: '2026-10-15', semester: 'Ganjil' },

  { id: 'grd-104-1', studentId: 'std-104', classId: 'cls-1', subject: 'Matematika', type: 'Tugas', title: 'Tugas 1: Eksponen', score: 68, maxScore: 100, date: '2026-09-10', semester: 'Ganjil' },
  { id: 'grd-104-h', studentId: 'std-104', classId: 'cls-1', subject: 'Matematika', type: 'Harian', title: 'Formatif: Konsep Eksponensial', score: 72, maxScore: 100, date: '2026-09-16', semester: 'Ganjil' },
  { id: 'grd-104-2', studentId: 'std-104', classId: 'cls-1', subject: 'Matematika', type: 'Sumatif', title: 'Sumatif Lingkup Materi 1', score: 65, maxScore: 100, date: '2026-09-22', semester: 'Ganjil' },
  { id: 'grd-104-3', studentId: 'std-104', classId: 'cls-1', subject: 'Matematika', type: 'STS', title: 'Sumatif Tengah Semester', score: 70, maxScore: 100, date: '2026-10-05', semester: 'Ganjil' },
  { id: 'grd-104-4', studentId: 'std-104', classId: 'cls-1', subject: 'Matematika', type: 'SAS', title: 'Sumatif Akhir Semester', score: 67, maxScore: 100, date: '2026-10-15', semester: 'Ganjil' },

  { id: 'grd-105-1', studentId: 'std-105', classId: 'cls-1', subject: 'Matematika', type: 'Tugas', title: 'Tugas 1: Eksponen', score: 88, maxScore: 100, date: '2026-09-10', semester: 'Ganjil' },
  { id: 'grd-105-h', studentId: 'std-105', classId: 'cls-1', subject: 'Matematika', type: 'Harian', title: 'Formatif: Konsep Eksponensial', score: 86, maxScore: 100, date: '2026-09-16', semester: 'Ganjil' },
  { id: 'grd-105-2', studentId: 'std-105', classId: 'cls-1', subject: 'Matematika', type: 'Sumatif', title: 'Sumatif Lingkup Materi 1', score: 85, maxScore: 100, date: '2026-09-22', semester: 'Ganjil' },
  { id: 'grd-105-3', studentId: 'std-105', classId: 'cls-1', subject: 'Matematika', type: 'STS', title: 'Sumatif Tengah Semester', score: 87, maxScore: 100, date: '2026-10-05', semester: 'Ganjil' },
  { id: 'grd-105-4', studentId: 'std-105', classId: 'cls-1', subject: 'Matematika', type: 'SAS', title: 'Sumatif Akhir Semester', score: 90, maxScore: 100, date: '2026-10-15', semester: 'Ganjil' },

  { id: 'grd-106-1', studentId: 'std-106', classId: 'cls-1', subject: 'Matematika', type: 'Tugas', title: 'Tugas 1: Eksponen', score: 96, maxScore: 100, date: '2026-09-10', semester: 'Ganjil' },
  { id: 'grd-106-h', studentId: 'std-106', classId: 'cls-1', subject: 'Matematika', type: 'Harian', title: 'Formatif: Konsep Eksponensial', score: 95, maxScore: 100, date: '2026-09-16', semester: 'Ganjil' },
  { id: 'grd-106-2', studentId: 'std-106', classId: 'cls-1', subject: 'Matematika', type: 'Sumatif', title: 'Sumatif Lingkup Materi 1', score: 98, maxScore: 100, date: '2026-09-22', semester: 'Ganjil' },
  { id: 'grd-106-3', studentId: 'std-106', classId: 'cls-1', subject: 'Matematika', type: 'STS', title: 'Sumatif Tengah Semester', score: 97, maxScore: 100, date: '2026-10-05', semester: 'Ganjil' },
  { id: 'grd-106-4', studentId: 'std-106', classId: 'cls-1', subject: 'Matematika', type: 'SAS', title: 'Sumatif Akhir Semester', score: 99, maxScore: 100, date: '2026-10-15', semester: 'Ganjil' },

  { id: 'grd-107-1', studentId: 'std-107', classId: 'cls-1', subject: 'Matematika', type: 'Tugas', title: 'Tugas 1: Eksponen', score: 78, maxScore: 100, date: '2026-09-10', semester: 'Ganjil' },
  { id: 'grd-107-h', studentId: 'std-107', classId: 'cls-1', subject: 'Matematika', type: 'Harian', title: 'Formatif: Konsep Eksponensial', score: 76, maxScore: 100, date: '2026-09-16', semester: 'Ganjil' },
  { id: 'grd-107-2', studentId: 'std-107', classId: 'cls-1', subject: 'Matematika', type: 'Sumatif', title: 'Sumatif Lingkup Materi 1', score: 75, maxScore: 100, date: '2026-09-22', semester: 'Ganjil' },
  { id: 'grd-107-3', studentId: 'std-107', classId: 'cls-1', subject: 'Matematika', type: 'STS', title: 'Sumatif Tengah Semester', score: 80, maxScore: 100, date: '2026-10-05', semester: 'Ganjil' },
  { id: 'grd-107-4', studentId: 'std-107', classId: 'cls-1', subject: 'Matematika', type: 'SAS', title: 'Sumatif Akhir Semester', score: 78, maxScore: 100, date: '2026-10-15', semester: 'Ganjil' },

  { id: 'grd-108-1', studentId: 'std-108', classId: 'cls-1', subject: 'Matematika', type: 'Tugas', title: 'Tugas 1: Eksponen', score: 58, maxScore: 100, date: '2026-09-10', semester: 'Ganjil' },
  { id: 'grd-108-h', studentId: 'std-108', classId: 'cls-1', subject: 'Matematika', type: 'Harian', title: 'Formatif: Konsep Eksponensial', score: 64, maxScore: 100, date: '2026-09-16', semester: 'Ganjil' },
  { id: 'grd-108-2', studentId: 'std-108', classId: 'cls-1', subject: 'Matematika', type: 'Sumatif', title: 'Sumatif Lingkup Materi 1', score: 60, maxScore: 100, date: '2026-09-22', semester: 'Ganjil' },
  { id: 'grd-108-3', studentId: 'std-108', classId: 'cls-1', subject: 'Matematika', type: 'STS', title: 'Sumatif Tengah Semester', score: 62, maxScore: 100, date: '2026-10-05', semester: 'Ganjil' },
  { id: 'grd-108-4', studentId: 'std-108', classId: 'cls-1', subject: 'Matematika', type: 'SAS', title: 'Sumatif Akhir Semester', score: 65, maxScore: 100, date: '2026-10-15', semester: 'Ganjil' },

  // Kelas XI.F-1
  { id: 'grd-201-1', studentId: 'std-201', classId: 'cls-2', subject: 'Matematika TL', type: 'Tugas', title: 'Tugas Polinomial', score: 93, maxScore: 100, date: '2026-09-15', semester: 'Ganjil' },
  { id: 'grd-201-2', studentId: 'std-201', classId: 'cls-2', subject: 'Matematika TL', type: 'Sumatif', title: 'Sumatif Polinomial', score: 90, maxScore: 100, date: '2026-09-28', semester: 'Ganjil' },
  { id: 'grd-201-3', studentId: 'std-201', classId: 'cls-2', subject: 'Matematika TL', type: 'STS', title: 'Sumatif Tengah Semester', score: 92, maxScore: 100, date: '2026-10-06', semester: 'Ganjil' },

  { id: 'grd-202-1', studentId: 'std-202', classId: 'cls-2', subject: 'Matematika TL', type: 'Tugas', title: 'Tugas Polinomial', score: 97, maxScore: 100, date: '2026-09-15', semester: 'Ganjil' },
  { id: 'grd-202-2', studentId: 'std-202', classId: 'cls-2', subject: 'Matematika TL', type: 'Sumatif', title: 'Sumatif Polinomial', score: 95, maxScore: 100, date: '2026-09-28', semester: 'Ganjil' },
  { id: 'grd-202-3', studentId: 'std-202', classId: 'cls-2', subject: 'Matematika TL', type: 'STS', title: 'Sumatif Tengah Semester', score: 96, maxScore: 100, date: '2026-10-06', semester: 'Ganjil' },

  { id: 'grd-203-1', studentId: 'std-203', classId: 'cls-2', subject: 'Matematika TL', type: 'Tugas', title: 'Tugas Polinomial', score: 84, maxScore: 100, date: '2026-09-15', semester: 'Ganjil' },
  { id: 'grd-203-2', studentId: 'std-203', classId: 'cls-2', subject: 'Matematika TL', type: 'Sumatif', title: 'Sumatif Polinomial', score: 80, maxScore: 100, date: '2026-09-28', semester: 'Ganjil' },

  { id: 'grd-204-1', studentId: 'std-204', classId: 'cls-2', subject: 'Matematika TL', type: 'Tugas', title: 'Tugas Polinomial', score: 72, maxScore: 100, date: '2026-09-15', semester: 'Ganjil' },
  { id: 'grd-204-2', studentId: 'std-204', classId: 'cls-2', subject: 'Matematika TL', type: 'Sumatif', title: 'Sumatif Polinomial', score: 70, maxScore: 100, date: '2026-09-28', semester: 'Ganjil' },
];

// Seed realistic Attendance records for analysis
export const DEFAULT_ATTENDANCES: AttendanceRecord[] = [
  // Siswa 101: Andi Siti Nurhaliza (Kehadiran 100%)
  { id: 'att-1', date: '2026-10-05', classId: 'cls-1', studentId: 'std-101', status: 'HADIR' },
  { id: 'att-2', date: '2026-10-08', classId: 'cls-1', studentId: 'std-101', status: 'HADIR' },
  { id: 'att-3', date: '2026-10-12', classId: 'cls-1', studentId: 'std-101', status: 'HADIR' },
  { id: 'att-4', date: '2026-10-15', classId: 'cls-1', studentId: 'std-101', status: 'HADIR' },

  // Siswa 102: Muh. Fajar Ramadhan (Kehadiran 100%)
  { id: 'att-5', date: '2026-10-05', classId: 'cls-1', studentId: 'std-102', status: 'HADIR' },
  { id: 'att-6', date: '2026-10-08', classId: 'cls-1', studentId: 'std-102', status: 'HADIR' },
  { id: 'att-7', date: '2026-10-12', classId: 'cls-1', studentId: 'std-102', status: 'HADIR' },
  { id: 'att-8', date: '2026-10-15', classId: 'cls-1', studentId: 'std-102', status: 'HADIR' },

  // Siswa 103: Nur Aisyah (1 Sakit, 3 Hadir)
  { id: 'att-9', date: '2026-10-05', classId: 'cls-1', studentId: 'std-103', status: 'HADIR' },
  { id: 'att-10', date: '2026-10-08', classId: 'cls-1', studentId: 'std-103', status: 'SAKIT', notes: 'Surat dokter flu berat' },
  { id: 'att-11', date: '2026-10-12', classId: 'cls-1', studentId: 'std-103', status: 'HADIR' },
  { id: 'att-12', date: '2026-10-15', classId: 'cls-1', studentId: 'std-103', status: 'HADIR' },

  // Siswa 104: Arya Pratama (Perhatian Khusus: 2 Alpa, 1 Izin, 1 Hadir = 25% Hadir)
  { id: 'att-13', date: '2026-10-05', classId: 'cls-1', studentId: 'std-104', status: 'ALPA', notes: 'Tanpa keterangan' },
  { id: 'att-14', date: '2026-10-08', classId: 'cls-1', studentId: 'std-104', status: 'IZIN', notes: 'Urusan keluarga' },
  { id: 'att-15', date: '2026-10-12', classId: 'cls-1', studentId: 'std-104', status: 'ALPA', notes: 'Tidak masuk' },
  { id: 'att-16', date: '2026-10-15', classId: 'cls-1', studentId: 'std-104', status: 'HADIR' },

  // Siswa 105: Dian Anggraeni (100% Hadir)
  { id: 'att-17', date: '2026-10-05', classId: 'cls-1', studentId: 'std-105', status: 'HADIR' },
  { id: 'att-18', date: '2026-10-08', classId: 'cls-1', studentId: 'std-105', status: 'HADIR' },
  { id: 'att-19', date: '2026-10-12', classId: 'cls-1', studentId: 'std-105', status: 'HADIR' },
  { id: 'att-20', date: '2026-10-15', classId: 'cls-1', studentId: 'std-105', status: 'HADIR' },

  // Siswa 106: Muh. Rifqi (100% Hadir)
  { id: 'att-21', date: '2026-10-05', classId: 'cls-1', studentId: 'std-106', status: 'HADIR' },
  { id: 'att-22', date: '2026-10-08', classId: 'cls-1', studentId: 'std-106', status: 'HADIR' },
  { id: 'att-23', date: '2026-10-12', classId: 'cls-1', studentId: 'std-106', status: 'HADIR' },
  { id: 'att-24', date: '2026-10-15', classId: 'cls-1', studentId: 'std-106', status: 'HADIR' },

  // Siswa 107: Sri Wahyuni (1 Izin, 3 Hadir = 75%)
  { id: 'att-25', date: '2026-10-05', classId: 'cls-1', studentId: 'std-107', status: 'HADIR' },
  { id: 'att-26', date: '2026-10-08', classId: 'cls-1', studentId: 'std-107', status: 'HADIR' },
  { id: 'att-27', date: '2026-10-12', classId: 'cls-1', studentId: 'std-107', status: 'IZIN', notes: 'Lomba seni' },
  { id: 'att-28', date: '2026-10-15', classId: 'cls-1', studentId: 'std-107', status: 'HADIR' },

  // Siswa 108: Rezky Aditya (Perhatian Khusus: 2 Alpa, 2 Hadir = 50%)
  { id: 'att-29', date: '2026-10-05', classId: 'cls-1', studentId: 'std-108', status: 'HADIR' },
  { id: 'att-30', date: '2026-10-08', classId: 'cls-1', studentId: 'std-108', status: 'ALPA', notes: 'Tanpa kabar' },
  { id: 'att-31', date: '2026-10-12', classId: 'cls-1', studentId: 'std-108', status: 'ALPA', notes: 'Tanpa kabar' },
  { id: 'att-32', date: '2026-10-15', classId: 'cls-1', studentId: 'std-108', status: 'HADIR' },

  // Siswa Kelas XI.F-1
  { id: 'att-33', date: '2026-10-05', classId: 'cls-2', studentId: 'std-201', status: 'HADIR' },
  { id: 'att-34', date: '2026-10-09', classId: 'cls-2', studentId: 'std-201', status: 'HADIR' },
  { id: 'att-35', date: '2026-10-12', classId: 'cls-2', studentId: 'std-201', status: 'HADIR' },

  { id: 'att-36', date: '2026-10-05', classId: 'cls-2', studentId: 'std-202', status: 'HADIR' },
  { id: 'att-37', date: '2026-10-09', classId: 'cls-2', studentId: 'std-202', status: 'HADIR' },
  { id: 'att-38', date: '2026-10-12', classId: 'cls-2', studentId: 'std-202', status: 'HADIR' },

  { id: 'att-39', date: '2026-10-05', classId: 'cls-2', studentId: 'std-203', status: 'HADIR' },
  { id: 'att-40', date: '2026-10-09', classId: 'cls-2', studentId: 'std-203', status: 'SAKIT', notes: 'Demam' },
  { id: 'att-41', date: '2026-10-12', classId: 'cls-2', studentId: 'std-203', status: 'HADIR' },

  { id: 'att-42', date: '2026-10-05', classId: 'cls-2', studentId: 'std-204', status: 'ALPA', notes: 'Tanpa kabar' },
  { id: 'att-43', date: '2026-10-09', classId: 'cls-2', studentId: 'std-204', status: 'ALPA', notes: 'Tanpa kabar' },
  { id: 'att-44', date: '2026-10-12', classId: 'cls-2', studentId: 'std-204', status: 'HADIR' },
];
