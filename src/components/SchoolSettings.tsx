import React, { useState, useEffect, useRef } from 'react';
import { SchoolProfile, User } from '../types';
import {
  Building,
  Save,
  Upload,
  RotateCcw,
  CheckCircle,
  Eye,
  Image as ImageIcon,
  UserCheck,
  Mail,
  BookOpen,
  Edit3,
  BadgeCheck,
  Camera,
  Trash2,
  Database,
  Cloud,
  Server,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { DEFAULT_SCHOOL, DEFAULT_LOGO_KIRI, DEFAULT_LOGO_KANAN } from '../data/initialData';
import { RtdbStatus, RtdbService } from '../services/rtdbService';
import { RTDB_URL, RTDB_PROJECT_NAME, RTDB_PROJECT_ID } from '../firebase';

interface SchoolSettingsProps {
  school: SchoolProfile;
  onSaveSchool: (profile: SchoolProfile) => void;
  currentUser: User | null;
  onSaveProfile: (updated: User) => void;
  rtdbStatus?: RtdbStatus;
  onManualRtdbSync?: () => Promise<void>;
}

export const SchoolSettings: React.FC<SchoolSettingsProps> = ({
  school,
  onSaveSchool,
  currentUser,
  onSaveProfile,
  rtdbStatus,
  onManualRtdbSync,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'school' | 'teacher' | 'database'>('database');
  const [formData, setFormData] = useState<SchoolProfile>({ ...school });
  const [schoolSuccessMsg, setSchoolSuccessMsg] = useState(false);

  // Teacher Form State
  const [teacherName, setTeacherName] = useState(currentUser?.name || '');
  const [teacherNip, setTeacherNip] = useState(currentUser?.nip || '');
  const [teacherSubject, setTeacherSubject] = useState(currentUser?.subject || '');
  const [teacherEmail, setTeacherEmail] = useState(currentUser?.email || '');
  const [teacherRole, setTeacherRole] = useState(currentUser?.role || 'Guru Mata Pelajaran');
  const [teacherAvatar, setTeacherAvatar] = useState(currentUser?.avatar || '');
  const [teacherSuccessMsg, setTeacherSuccessMsg] = useState(false);
  const teacherAvatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (currentUser) {
      setTeacherName(currentUser.name || '');
      setTeacherNip(currentUser.nip || '');
      setTeacherSubject(currentUser.subject || '');
      setTeacherEmail(currentUser.email || '');
      setTeacherRole(currentUser.role || 'Guru Mata Pelajaran');
      setTeacherAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  const handleTeacherAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setTeacherAvatar(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (field: keyof SchoolProfile, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoKiri' | 'logoKanan'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleChange(field, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetKop = () => {
    if (window.confirm('Kembalikan kop surat dan profil ke default SMAN 1 Gowa?')) {
      setFormData({ ...DEFAULT_SCHOOL });
    }
  };

  const handleSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSchool(formData);
    setSchoolSuccessMsg(true);
    setTimeout(() => setSchoolSuccessMsg(false), 3000);
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) return;

    const updatedUser: User = {
      id: currentUser?.id || `usr-${Date.now()}`,
      name: teacherName.trim(),
      nip: teacherNip.trim() || '-',
      subject: teacherSubject.trim() || 'Mata Pelajaran',
      email: teacherEmail.trim(),
      role: teacherRole.trim() || 'Guru Mata Pelajaran',
      avatar: teacherAvatar.trim() || undefined,
    };

    onSaveProfile(updatedUser);
    setTeacherSuccessMsg(true);
    setTimeout(() => setTeacherSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header with Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Pengaturan & Profil Administrasi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Konfigurasi identitas guru, sekolah, dan format kop surat dinas resmi
          </p>
        </div>

        {/* Subtabs Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveSubTab('database')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'database'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span>Firebase Realtime DB</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('school')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'school'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Kop & Sekolah</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('teacher')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'teacher'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Profil Akun Guru</span>
          </button>
        </div>
      </div>

      {/* TAB 0: FIREBASE REALTIME DATABASE SYNC & STATUS */}
      {activeSubTab === 'database' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Status Card Utama */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Database className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Firebase Realtime Database Terhubung
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Online & Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sinkronisasi data otomatis 2-arah antara perangkat lokal dan cloud server
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (onManualRtdbSync) {
                      await onManualRtdbSync();
                    } else {
                      await RtdbService.syncAllToCloud({
                        school: formData,
                        classes: [],
                        students: [],
                        schedules: [],
                        attendances: [],
                        grades: [],
                        journals: [],
                        currentUser,
                      });
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sinkronkan Sekarang</span>
                </button>
              </div>
            </div>

            {/* Detail Konfigurasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                  Project Title / ID
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block font-mono">
                  {RTDB_PROJECT_NAME}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                  ({RTDB_PROJECT_ID})
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                  Database URL
                </span>
                <a
                  href={RTDB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline block font-mono truncate flex items-center gap-1"
                >
                  <span className="truncate">{RTDB_URL}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <span className="text-[10px] text-slate-500">Default Region (us-central1)</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                  Metode Penyimpanan
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Offline-First & Cloud Sync
                </span>
                <span className="text-[10px] text-slate-500">
                  Data tetap aman di browser saat offline
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                  Status Terakhir
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {rtdbStatus?.lastSyncTime
                    ? new Date(rtdbStatus.lastSyncTime).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      }) + ' WITA'
                    : 'Tersinkron Otomatis'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  Realtime Listener Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Tabel Entitas yang Disinkronkan */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Daftar Entitas & Jalur Realtime Database</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {[
                { name: 'Profil & Kop Sekolah', path: '/school', desc: 'Identitas SMAN 1 Gowa, kop surat, kepsek' },
                { name: 'Manajemen Kelas', path: '/classes', desc: 'Daftar rombel, tingkatan, wali kelas' },
                { name: 'Data Siswa', path: '/students', desc: 'NISN, nama siswa, jenis kelamin, kelas' },
                { name: 'Jadwal Mengajar', path: '/schedules', desc: 'Hari, jam pelajaran, mata pelajaran' },
                { name: 'Presensi Siswa', path: '/attendances', desc: 'Rekap kehadiran Hadir, Sakit, Izin, Alpa' },
                { name: 'Penilaian & Rapor', path: '/grades', desc: 'Formatif, sumatif, STS, SAS' },
                { name: 'Jurnal Harian Guru', path: '/journals', desc: 'Catatan mengajar, materi & kendala' },
                { name: 'Pengaturan Tema', path: '/theme', desc: 'Mode terang/gelap & warna menu bar' },
              ].map((item) => (
                <div
                  key={item.path}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 block">
                    administrasi_guru_sman1gowa{item.path}
                  </span>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: PROFIL AKUN GURU (NAMA & NIP BISA DIRUBAH) */}
      {activeSubTab === 'teacher' && (
        <div className="space-y-6 animate-in fade-in">
          {teacherSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Profil akun guru berhasil diperbarui! Nama dan NIP telah otomatis diselaraskan di header, leger nilai, jurnal, dan lembar cetak dokumen.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Profile Card Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <BadgeCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Kartu Identitas Pengajar
                  </h3>
                </div>

                <div className="flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="relative group mb-3">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-md">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center">
                        {teacherAvatar ? (
                          <img
                            src={teacherAvatar}
                            alt={teacherName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl">
                            {teacherName ? teacherName.charAt(0) : 'G'}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => teacherAvatarInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md cursor-pointer transition-transform hover:scale-110"
                      title="Klik untuk memilih foto dari perangkat"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {teacherName || 'Nama Belum Diisi'}
                  </h4>
                  <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                    NIP. {teacherNip || '-'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    {teacherSubject} · {teacherRole}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    {teacherEmail || '-'}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      ref={teacherAvatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleTeacherAvatarUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => teacherAvatarInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Unggah Foto Profil</span>
                    </button>
                    {teacherAvatar && (
                      <button
                        type="button"
                        onClick={() => setTeacherAvatar('')}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-lg border border-indigo-100 dark:border-indigo-900/50 text-[11px] text-indigo-900 dark:text-indigo-300">
                <p className="font-semibold mb-1">Foto & Identitas Akun:</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Foto profil guru akan otomatis tampil di sudut kanan atas header aplikasi dan sidebar. Nama & NIP digunakan sebagai tanda tangan resmi pengajar pada formulir cetak.
                </p>
              </div>
            </div>

            {/* Teacher Form */}
            <form
              onSubmit={handleTeacherSubmit}
              className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Formulir Ubah Identitas Akun Guru & NIP
                  </h2>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan Profil Pengajar
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Guru Beserta Gelar Akademik *
                </label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Contoh: Andi Ismail, S.Pd., M.Si."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Cantumkan gelar lengkap untuk kelengkapan administrasi rapor resmi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIP / NUPTK / No. Induk Guru *
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherNip}
                    onChange={(e) => setTeacherNip(e.target.value)}
                    placeholder="Contoh: 19880815 201403 1 004"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mata Pelajaran yang Diampu *
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={teacherSubject}
                      onChange={(e) => setTeacherSubject(e.target.value)}
                      placeholder="Contoh: Matematika & Informatika"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Akun Dinas / Belajar.id
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      placeholder="andiismail05@guru.sma.belajar.id"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Peran / Jabatan Tambahan
                  </label>
                  <input
                    type="text"
                    value={teacherRole}
                    onChange={(e) => setTeacherRole(e.target.value)}
                    placeholder="Contoh: Guru Mata Pelajaran / Wali Kelas"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer text-xs"
                >
                  <Save className="w-4 h-4" />
                  Simpan Perubahan Akun Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: PROFIL SEKOLAH & KOP SURAT */}
      {activeSubTab === 'school' && (
        <div className="space-y-6 animate-in fade-in">
          {schoolSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Profil sekolah dan kop surat resmi berhasil disimpan! Kop baru akan diterapkan otomatis pada setiap dokumen rapor, presensi, dan jurnal yang dicetak.
              </span>
            </div>
          )}

          {/* LIVE PREVIEW KOP SURAT */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Pratinjau Langsung (Live Preview) Kop Surat Dinas
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Ukuran Standar Kertas Cetak A4</span>
            </div>

            {/* The Kop Box */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white">
              <div className="border-kop-dinas pb-3">
                <div className="flex items-center justify-between gap-4">
                  {/* Logo Kiri */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 p-1 transition-all"
                    style={{
                      width: `${formData.logoKiriSize || 80}px`,
                      height: `${formData.logoKiriSize || 80}px`,
                    }}
                  >
                    {formData.logoKiri ? (
                      <img
                        src={formData.logoKiri}
                        alt="Logo Kiri"
                        style={{
                          maxHeight: `${formData.logoKiriSize || 80}px`,
                          maxWidth: `${formData.logoKiriSize || 80}px`,
                        }}
                        className="object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  {/* Header Text */}
                  <div className="flex-1 text-center font-serif leading-tight">
                    <p className="text-xs font-bold tracking-wider">{formData.kopHeader1}</p>
                    <p className="text-sm font-bold tracking-wider">{formData.kopHeader2}</p>
                    <p className="text-xs font-bold">{formData.kopHeader3}</p>
                    <h1 className="text-lg font-extrabold tracking-wide my-0.5">
                      {formData.kopHeader4}
                    </h1>
                    <p className="text-[10px] font-sans text-slate-700 dark:text-slate-300 font-normal">
                      {formData.kopSubheader}
                    </p>
                    <p className="text-[9px] font-sans text-slate-600 dark:text-slate-400 font-normal">
                      {formData.kopContact}
                    </p>
                  </div>

                  {/* Logo Kanan */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 p-1 transition-all"
                    style={{
                      width: `${formData.logoKananSize || 80}px`,
                      height: `${formData.logoKananSize || 80}px`,
                    }}
                  >
                    {formData.logoKanan ? (
                      <img
                        src={formData.logoKanan}
                        alt="Logo Kanan"
                        style={{
                          maxHeight: `${formData.logoKananSize || 80}px`,
                          maxWidth: `${formData.logoKananSize || 80}px`,
                        }}
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT FORM GRID */}
          <form onSubmit={handleSchoolSubmit} className="space-y-6">
            {/* Kop Surat Header Text Customization */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  1. Teks Baris Header Kop Surat Dinas
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetKop}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Default
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Simpan Kop & Profil
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Baris 1 (Pemerintah Provinsi / Daerah)
                  </label>
                  <input
                    type="text"
                    value={formData.kopHeader1}
                    onChange={(e) => handleChange('kopHeader1', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Baris 2 (Dinas Terkait)
                  </label>
                  <input
                    type="text"
                    value={formData.kopHeader2}
                    onChange={(e) => handleChange('kopHeader2', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Baris 3 (Cabang Dinas / Wilayah)
                  </label>
                  <input
                    type="text"
                    value={formData.kopHeader3}
                    onChange={(e) => handleChange('kopHeader3', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 font-bold">
                    Baris 4 - Satuan Pendidikan / Nama Sekolah *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kopHeader4}
                    onChange={(e) => {
                      handleChange('kopHeader4', e.target.value);
                      handleChange('name', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Baris Sub-Header (Alamat Lengkap & Kode Pos)
                  </label>
                  <input
                    type="text"
                    value={formData.kopSubheader}
                    onChange={(e) => handleChange('kopSubheader', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Baris Kontak (Telepon, Laman Web, Pos-el Dinas)
                  </label>
                  <input
                    type="text"
                    value={formData.kopContact}
                    onChange={(e) => handleChange('kopContact', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Logo Settings: Left and Right Logo */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    2. Pengaturan Logo Kiri &amp; Logo Kanan
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Besar kecil ukuran logo dapat diatur secara presisi dengan slider atau pilihan cepat (skala piksel)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Logo Kiri */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3.5 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Logo Kiri (Pemerintah Provinsi / Tut Wuri Handayani)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      Ukuran: {formData.logoKiriSize || 80}px
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden transition-all shadow-2xs"
                      style={{
                        width: `${Math.min(96, Math.max(52, formData.logoKiriSize || 80))}px`,
                        height: `${Math.min(96, Math.max(52, formData.logoKiriSize || 80))}px`,
                      }}
                    >
                      {formData.logoKiri ? (
                        <img
                          src={formData.logoKiri}
                          alt="Logo Kiri"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer font-medium text-slate-700 dark:text-slate-200 text-xs shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-indigo-500" />
                        Unggah File Logo Kiri
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'logoKiri')}
                        />
                      </label>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Didukung: PNG transparan, JPG, WebP, SVG
                      </p>
                    </div>
                  </div>

                  {/* Pengaturan Besar / Kecil Ukuran Logo Kiri */}
                  <div className="p-3 bg-white dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Atur Ukuran Logo Kiri:
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="40"
                          max="160"
                          value={formData.logoKiriSize || 80}
                          onChange={(e) =>
                            handleChange('logoKiriSize', Math.max(30, Math.min(200, Number(e.target.value) || 80)))
                          }
                          className="w-16 px-2 py-1 text-center font-mono font-bold text-xs border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-500">px</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-mono">40px</span>
                      <input
                        type="range"
                        min="40"
                        max="160"
                        step="2"
                        value={formData.logoKiriSize || 80}
                        onChange={(e) => handleChange('logoKiriSize', Number(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">160px</span>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">Pilihan cepat:</span>
                      {[
                        { label: 'Kecil (60px)', size: 60 },
                        { label: 'Standar (80px)', size: 80 },
                        { label: 'Besar (100px)', size: 100 },
                        { label: 'Ekstra (120px)', size: 120 },
                      ].map((preset) => (
                        <button
                          key={preset.size}
                          type="button"
                          onClick={() => handleChange('logoKiriSize', preset.size)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer border ${
                            (formData.logoKiriSize || 80) === preset.size
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                      Atau Tautan URL Logo Kiri:
                    </label>
                    <input
                      type="text"
                      value={formData.logoKiri}
                      onChange={(e) => handleChange('logoKiri', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 text-[11px] border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Logo Kanan */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3.5 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Logo Kanan (Logo Satuan Pendidikan SMAN 1 Gowa)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      Ukuran: {formData.logoKananSize || 80}px
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden transition-all shadow-2xs"
                      style={{
                        width: `${Math.min(96, Math.max(52, formData.logoKananSize || 80))}px`,
                        height: `${Math.min(96, Math.max(52, formData.logoKananSize || 80))}px`,
                      }}
                    >
                      {formData.logoKanan ? (
                        <img
                          src={formData.logoKanan}
                          alt="Logo Kanan"
                          className="max-h-full max-w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer font-medium text-slate-700 dark:text-slate-200 text-xs shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-indigo-500" />
                        Unggah File Logo Kanan
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'logoKanan')}
                        />
                      </label>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Didukung: PNG transparan, JPG, WebP, SVG
                      </p>
                    </div>
                  </div>

                  {/* Pengaturan Besar / Kecil Ukuran Logo Kanan */}
                  <div className="p-3 bg-white dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Atur Ukuran Logo Kanan:
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="40"
                          max="160"
                          value={formData.logoKananSize || 80}
                          onChange={(e) =>
                            handleChange('logoKananSize', Math.max(30, Math.min(200, Number(e.target.value) || 80)))
                          }
                          className="w-16 px-2 py-1 text-center font-mono font-bold text-xs border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-500">px</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-mono">40px</span>
                      <input
                        type="range"
                        min="40"
                        max="160"
                        step="2"
                        value={formData.logoKananSize || 80}
                        onChange={(e) => handleChange('logoKananSize', Number(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">160px</span>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">Pilihan cepat:</span>
                      {[
                        { label: 'Kecil (60px)', size: 60 },
                        { label: 'Standar (80px)', size: 80 },
                        { label: 'Besar (100px)', size: 100 },
                        { label: 'Ekstra (120px)', size: 120 },
                      ].map((preset) => (
                        <button
                          key={preset.size}
                          type="button"
                          onClick={() => handleChange('logoKananSize', preset.size)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer border ${
                            (formData.logoKananSize || 80) === preset.size
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                      Atau Tautan URL Logo Kanan:
                    </label>
                    <input
                      type="text"
                      value={formData.logoKanan}
                      onChange={(e) => handleChange('logoKanan', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 text-[11px] border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* School Profile Details & Headmaster */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
                3. Identitas Sekolah & Pejabat Penandatangan
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Satuan Pendidikan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">NPSN</label>
                  <input
                    type="text"
                    value={formData.npsn}
                    onChange={(e) => handleChange('npsn', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Alamat Jalan *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Kabupaten / Kota</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => handleChange('province', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tahun Pelajaran Default *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => handleChange('academicYear', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => handleChange('semester', e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap Kepala Sekolah & Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.headmaster}
                    onChange={(e) => handleChange('headmaster', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">NIP Kepala Sekolah</label>
                  <input
                    type="text"
                    value={formData.headmasterNip}
                    onChange={(e) => handleChange('headmasterNip', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer text-xs"
                >
                  <Save className="w-4 h-4" />
                  Simpan Seluruh Pengaturan Sekolah
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
