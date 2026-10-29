import React, { useState, useEffect } from 'react';
import {
  Student,
  ClassRoom,
  AttendanceRecord,
  GradeRecord,
  TeachingJournal,
  SchoolProfile,
  User,
} from '../types';
import {
  auth,
  signInWithGoogleWorkspace,
  requestGisWorkspaceToken,
  signInWithFirebasePopup,
  signOutWorkspace,
  getCachedWorkspaceToken,
  getCurrentWorkspaceUser,
  formatAuthError,
} from '../firebase';
import {
  GoogleWorkspaceService,
  DriveFileItem,
  ExportResult,
} from '../services/googleWorkspaceService';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  HardDrive,
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Trash2,
  FolderPlus,
  Search,
  Download,
  Upload,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Folder,
  Layers,
  Sparkles,
  Database,
  Lock,
  LogOut,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface GoogleWorkspaceViewProps {
  school: SchoolProfile;
  currentUser: User | null;
  classes: ClassRoom[];
  students: Student[];
  attendances: AttendanceRecord[];
  grades: GradeRecord[];
  journals: TeachingJournal[];
  schedules: any[];
  onImportStudents: (newStudents: Omit<Student, 'id'>[]) => void;
  onRestoreAllData?: (data: any) => void;
}

export const GoogleWorkspaceView: React.FC<GoogleWorkspaceViewProps> = ({
  school,
  currentUser,
  classes,
  students,
  attendances,
  grades,
  journals,
  schedules,
  onImportStudents,
  onRestoreAllData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sheets' | 'drive'>('sheets');
  const [googleUser, setGoogleUser] = useState<any>(() => getCurrentWorkspaceUser());
  const [accessToken, setAccessToken] = useState<string | null>(() => getCachedWorkspaceToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchDriveQuery, setSearchDriveQuery] = useState('');
  const [driveFilter, setDriveFilter] = useState<'all' | 'sheets' | 'folders' | 'backups'>('all');
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Sheets state
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [lastExportResult, setLastExportResult] = useState<ExportResult | null>(null);
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [isLoadingSheetPreview, setIsLoadingSheetPreview] = useState(false);
  const [sheetPreviewRows, setSheetPreviewRows] = useState<string[][] | null>(null);
  const [sheetPreviewTitle, setSheetPreviewTitle] = useState('');

  // Delete File Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    fileId?: string;
    fileName?: string;
  }>({ isOpen: false });

  // Restore Modal State
  const [restoreModal, setRestoreModal] = useState<{
    isOpen: boolean;
    fileId?: string;
    fileName?: string;
  }>({ isOpen: false });

  // New Folder Modal State
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Listen to auth changes without clobbering GIS session
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && !user.isAnonymous) {
        setGoogleUser({
          displayName: user.displayName || user.email || 'Guru',
          email: user.email || '',
          photoURL: user.photoURL || '',
        });
      } else {
        const curUser = getCurrentWorkspaceUser();
        setGoogleUser(curUser);
      }
      const token = getCachedWorkspaceToken();
      setAccessToken(token);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Drive files when user is authenticated and tab is drive
  useEffect(() => {
    if (accessToken) {
      loadDriveFiles();
    }
  }, [accessToken, driveFilter]);

  const loadDriveFiles = async () => {
    if (!accessToken) return;
    setIsLoadingFiles(true);
    try {
      const files = await GoogleWorkspaceService.listDriveFiles(accessToken, {
        mimeTypeFilter: driveFilter,
        q: searchDriveQuery,
      });
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Error loading drive files:', err);
      showToast(err.message || 'Gagal memuat berkas dari Google Drive', 'error');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleGoogleSignIn = async (method: 'gis' | 'firebase' = 'gis') => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const res =
        method === 'firebase'
          ? await signInWithFirebasePopup()
          : await requestGisWorkspaceToken();

      setGoogleUser(res.user);
      setAccessToken(res.accessToken);
      setAuthError(null);
      showToast(`Berhasil terhubung dengan Google Workspace (${res.user.email || res.user.displayName || 'Akun Google'})`);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      const msg = err.message || formatAuthError(err);
      setAuthError(msg);
      showToast(msg, 'error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await signOutWorkspace();
      setAccessToken(null);
      setGoogleUser(null);
      setDriveFiles([]);
      showToast('Koneksi Google Workspace telah diputuskan');
    } catch (err: any) {
      showToast('Gagal memutuskan koneksi', 'error');
    }
  };

  // EXPORT HANDLERS
  const handleExportStudents = async () => {
    if (!accessToken) {
      showToast('Silakan hubungkan akun Google Workspace Anda terlebih dahulu', 'error');
      return;
    }
    setIsExporting('students');
    try {
      const res = await GoogleWorkspaceService.exportStudentsToGoogleSheets(
        accessToken,
        students,
        classes,
        school
      );
      setLastExportResult(res);
      showToast(`Berhasil mengekspor ${res.rowCount} siswa ke Google Sheets`);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengekspor data siswa', 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportAttendance = async () => {
    if (!accessToken) {
      showToast('Silakan hubungkan akun Google Workspace Anda terlebih dahulu', 'error');
      return;
    }
    setIsExporting('attendance');
    try {
      const res = await GoogleWorkspaceService.exportAttendanceToGoogleSheets(
        accessToken,
        attendances,
        students,
        classes,
        school
      );
      setLastExportResult(res);
      showToast(`Berhasil mengekspor ${res.rowCount} catatan presensi ke Google Sheets`);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengekspor rekap presensi', 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportGrades = async () => {
    if (!accessToken) {
      showToast('Silakan hubungkan akun Google Workspace Anda terlebih dahulu', 'error');
      return;
    }
    setIsExporting('grades');
    try {
      const res = await GoogleWorkspaceService.exportGradesToGoogleSheets(
        accessToken,
        grades,
        students,
        classes,
        school
      );
      setLastExportResult(res);
      showToast(`Berhasil mengekspor ${res.rowCount} data nilai ke Google Sheets`);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengekspor data nilai', 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportJournals = async () => {
    if (!accessToken) {
      showToast('Silakan hubungkan akun Google Workspace Anda terlebih dahulu', 'error');
      return;
    }
    setIsExporting('journals');
    try {
      const res = await GoogleWorkspaceService.exportJournalsToGoogleSheets(
        accessToken,
        journals,
        classes,
        school
      );
      setLastExportResult(res);
      showToast(`Berhasil mengekspor ${res.rowCount} jurnal mengajar ke Google Sheets`);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengekspor jurnal mengajar', 'error');
    } finally {
      setIsExporting(null);
    }
  };

  // BACKUP TO DRIVE
  const handleBackupAll = async () => {
    if (!accessToken) {
      showToast('Silakan hubungkan akun Google Workspace terlebih dahulu', 'error');
      return;
    }
    setIsBackingUp(true);
    try {
      const fullState = {
        school,
        classes,
        students,
        schedules,
        attendances,
        grades,
        journals,
      };
      const file = await GoogleWorkspaceService.backupFullStateToDrive(
        accessToken,
        fullState,
        school
      );
      showToast(`Cadangan lengkap berhasil disimpan ke Google Drive (${file.name})`);
      loadDriveFiles();
    } catch (err: any) {
      showToast(err.message || 'Gagal mencadangkan data ke Google Drive', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  // RESTORE FROM DRIVE BACKUP
  const handleConfirmRestore = async () => {
    if (!accessToken || !restoreModal.fileId) return;
    try {
      const content = await GoogleWorkspaceService.downloadDriveFileContent(
        accessToken,
        restoreModal.fileId
      );
      const parsed = JSON.parse(content);
      if (parsed?.data && onRestoreAllData) {
        onRestoreAllData(parsed.data);
        showToast('Data aplikasi berhasil dipulihkan dari cadangan Google Drive');
      } else {
        showToast('Format berkas cadangan tidak dikenali', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memulihkan cadangan', 'error');
    } finally {
      setRestoreModal({ isOpen: false });
    }
  };

  // DELETE FILE (Explicit User Confirmation)
  const handleConfirmDelete = async () => {
    if (!accessToken || !deleteModal.fileId) return;
    try {
      await GoogleWorkspaceService.deleteDriveFile(accessToken, deleteModal.fileId);
      showToast(`Berkas "${deleteModal.fileName}" berhasil dihapus dari Google Drive`);
      setDriveFiles((prev) => prev.filter((f) => f.id !== deleteModal.fileId));
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus berkas', 'error');
    } finally {
      setDeleteModal({ isOpen: false });
    }
  };

  // CREATE FOLDER IN DRIVE
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      await GoogleWorkspaceService.createDriveFolder(accessToken, newFolderName.trim());
      showToast(`Folder "${newFolderName.trim()}" berhasil dibuat di Google Drive`);
      setNewFolderName('');
      setIsNewFolderOpen(false);
      loadDriveFiles();
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat folder', 'error');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // PREVIEW SPREADSHEET TO IMPORT
  const handleLoadSheetPreview = async () => {
    if (!accessToken) {
      showToast('Silakan hubungkan akun Google Workspace terlebih dahulu', 'error');
      return;
    }
    const cleanUrl = sheetUrlInput.trim();
    if (!cleanUrl) return;

    // Extract Spreadsheet ID from URL or bare ID
    let sheetId = cleanUrl;
    const match = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      sheetId = match[1];
    }

    setIsLoadingSheetPreview(true);
    setSheetPreviewRows(null);
    try {
      const info = await GoogleWorkspaceService.getSpreadsheetInfo(accessToken, sheetId);
      setSheetPreviewTitle(info.title);

      const firstTabName = info.sheets[0]?.title || 'Sheet1';
      const rows = await GoogleWorkspaceService.readSpreadsheetValues(
        accessToken,
        sheetId,
        `${firstTabName}!A1:Z50`
      );

      if (rows.length === 0) {
        showToast('Spreadsheet kosong atau tidak memiliki data pada baris pertama', 'error');
      } else {
        setSheetPreviewRows(rows);
        showToast(`Berhasil membaca ${rows.length} baris dari tab "${firstTabName}"`);
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal membaca spreadsheet Google', 'error');
    } finally {
      setIsLoadingSheetPreview(false);
    }
  };

  // IMPORT PREVIEWED SHEET ROWS AS STUDENTS
  const handleImportParsedSheet = () => {
    if (!sheetPreviewRows || sheetPreviewRows.length < 2) return;

    const headers = sheetPreviewRows[0].map((h) => h.toLowerCase().trim());
    const nameIdx = headers.findIndex((h) => h.includes('nama'));
    const nisnIdx = headers.findIndex((h) => h.includes('nisn') || h.includes('nomor induk') || h.includes('nis'));
    const genderIdx = headers.findIndex((h) => h.includes('kelamin') || h.includes('jk') || h.includes('gender'));
    const phoneIdx = headers.findIndex((h) => h.includes('hp') || h.includes('kontak') || h.includes('telepon'));

    const parsedList: Array<Omit<Student, 'id'>> = [];
    const defaultClassId = classes[0]?.id || '';

    for (let i = 1; i < sheetPreviewRows.length; i++) {
      const row = sheetPreviewRows[i];
      if (!row || row.length === 0) continue;

      const rawName = nameIdx >= 0 ? row[nameIdx] : row[1] || row[0];
      if (!rawName || !rawName.trim()) continue;

      const rawId = (nisnIdx >= 0 ? row[nisnIdx] : row[0] || '').trim();
      const rawGenderStr = (genderIdx >= 0 ? row[genderIdx] : 'L').toUpperCase().trim();
      const parsedGender = rawGenderStr.startsWith('P') || rawGenderStr.startsWith('WAN') ? 'P' : 'L';
      const rawPhone = phoneIdx >= 0 ? row[phoneIdx] : '-';

      parsedList.push({
        nisnNis: rawId || `2425${String(i).padStart(3, '0')}`,
        nisn: rawId,
        nis: rawId,
        name: rawName.trim(),
        gender: parsedGender,
        classId: defaultClassId,
        parentPhone: rawPhone || '-',
        status: 'Aktif',
      });
    }

    if (parsedList.length > 0) {
      onImportStudents(parsedList);
      showToast(`Berhasil mengimpor ${parsedList.length} siswa dari Google Sheets`);
      setSheetPreviewRows(null);
      setSheetUrlInput('');
    } else {
      showToast('Tidak ada baris siswa valid yang dapat diimpor', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 backdrop-blur-xs text-white ${
            toastMsg.type === 'success'
              ? 'bg-slate-900/90 border border-emerald-500/50'
              : 'bg-rose-900/90 border border-rose-500/50'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Google Sheets</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 font-bold text-xs">
                <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Google Drive</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Integrasi Cloud Workspace Resmi
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Pusat Integrasi Google Drive & Google Sheets
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Sinkronkan dan ekspor data siswa, rekap presensi, nilai, serta jurnal mengajar langsung ke
              Google Sheets, atau kelola berkas cadangan administrasi sekolah di Google Drive dengan aman.
            </p>
          </div>

          {/* Connection Status Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0 w-full lg:w-96">
            {accessToken && googleUser ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Terhubung ke Google Workspace
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    Putuskan
                  </button>
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full border border-slate-300 dark:border-slate-600 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {googleUser.displayName?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {googleUser.displayName || 'Akun Guru'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {googleUser.email || 'andiismail05@guru.sma.belajar.id'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Google Drive & Google Sheets siap digunakan</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Hubungkan Akun Google
                    </p>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                      OAuth 2.0
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Diperlukan untuk membaca, menulis & mengekspor ke Google Drive dan Google Sheets.
                  </p>
                </div>

                {/* Primary Official Google Sign-In Button (Direct GIS) */}
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn('gis')}
                  disabled={isAuthenticating}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  )}
                  <span>{isAuthenticating ? 'Membuka jendela otorisasi...' : 'Sign in with Google'}</span>
                </button>

                {/* Inline Error Box if Sign-In Failed */}
                {authError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl space-y-2 text-left animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-rose-900 dark:text-rose-200">
                          Gagal Menghubungkan Akun
                        </p>
                        <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed">
                          {authError}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60 dark:border-rose-900/60">
                      <button
                        type="button"
                        onClick={() => handleGoogleSignIn('gis')}
                        disabled={isAuthenticating}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Coba Lagi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGoogleSignIn('firebase')}
                        disabled={isAuthenticating}
                        className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
                      >
                        Coba via Firebase Auth
                      </button>
                    </div>
                  </div>
                )}

                {/* Troubleshooting Accordion for Popups */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                    className="w-full flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Jendela login tidak muncul?</span>
                    </span>
                    {showTroubleshoot ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {showTroubleshoot && (
                    <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-900/90 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 animate-in fade-in border border-slate-200 dark:border-slate-800">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        Cara mengizinkan pop-up di browser:
                      </p>
                      <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
                        <li>
                          Periksa bilah alamat browser (URL) di bagian kanan atas atau ikon gembok/pengaturan situs.
                        </li>
                        <li>
                          Cari ikon pop-up terblokir (kotak bertanda silang merah).
                        </li>
                        <li>
                          Pilih <strong>"Selalu izinkan pop-up dan pengalihan"</strong>, lalu klik Selesai.
                        </li>
                        <li>
                          Klik tombol <strong>"Sign in with Google"</strong> kembali dan pilih akun <code>@guru.sma.belajar.id</code>.
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mt-6 pt-2 gap-4">
          <button
            onClick={() => setActiveSubTab('sheets')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'sheets'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Sheets (Ekspor & Impor Spreadsheet)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('drive')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'drive'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Google Drive (File Manager & Cadangan Cloud)</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: GOOGLE SHEETS */}
      {activeSubTab === 'sheets' && (
        <div className="space-y-6">
          {/* Last Export Banner */}
          {lastExportResult && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/80 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Spreadsheet Berhasil Dibuat di Google Drive!
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    "{lastExportResult.title}" berisi {lastExportResult.rowCount} baris data.
                  </p>
                </div>
              </div>
              <a
                href={lastExportResult.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <span>Buka Google Spreadsheet Baru</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* 4 Quick Export Cards */}
          <div>
            <div className="mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Ekspor Cepat Data Sekolah ke Google Sheets</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih data yang ingin Anda ekspor langsung menjadi file Google Spreadsheet baru di Drive
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Data Siswa */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-emerald-500/50 transition-colors shadow-xs">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Data Siswa & Rombel
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Ekspor seluruh daftar {students.length} siswa dengan NISN, jenis kelamin, kelas, dan kontak orang tua.
                  </p>
                </div>
                <button
                  onClick={handleExportStudents}
                  disabled={isExporting !== null || !accessToken}
                  className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isExporting === 'students' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5" />
                  )}
                  <span>Ekspor Data Siswa</span>
                </button>
              </div>

              {/* Card 2: Presensi */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-emerald-500/50 transition-colors shadow-xs">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Rekapitulasi Presensi
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Ekspor rekap {attendances.length} catatan kehadiran harian siswa per tanggal, status Hadir/Sakit/Izin/Alpa.
                  </p>
                </div>
                <button
                  onClick={handleExportAttendance}
                  disabled={isExporting !== null || !accessToken}
                  className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isExporting === 'attendance' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5" />
                  )}
                  <span>Ekspor Presensi</span>
                </button>
              </div>

              {/* Card 3: Nilai */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-emerald-500/50 transition-colors shadow-xs">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Daftar & Rekap Nilai
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Ekspor {grades.length} nilai tugas, UH, PTS, dan PAS lengkap dengan mata pelajaran dan nama siswa.
                  </p>
                </div>
                <button
                  onClick={handleExportGrades}
                  disabled={isExporting !== null || !accessToken}
                  className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isExporting === 'grades' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5" />
                  )}
                  <span>Ekspor Rekap Nilai</span>
                </button>
              </div>

              {/* Card 4: Jurnal */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-emerald-500/50 transition-colors shadow-xs">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Jurnal Mengajar Guru
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Ekspor {journals.length} catatan pertemuan mengajar, materi pokok, kendala, serta tindak lanjut ke Google Sheets.
                  </p>
                </div>
                <button
                  onClick={handleExportJournals}
                  disabled={isExporting !== null || !accessToken}
                  className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isExporting === 'journals' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5" />
                  )}
                  <span>Ekspor Jurnal Guru</span>
                </button>
              </div>
            </div>
          </div>

          {/* Import from Google Sheets */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Impor Data Siswa dari Google Sheets</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Masukkan URL atau ID Spreadsheet dari Google Drive untuk membaca dan memasukkan data siswa ke aplikasi.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={sheetUrlInput}
                onChange={(e) => setSheetUrlInput(e.target.value)}
                placeholder="Contoh: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                className="flex-1 w-full p-2.5 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleLoadSheetPreview}
                disabled={isLoadingSheetPreview || !sheetUrlInput.trim() || !accessToken}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoadingSheetPreview ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Baca & Pratinjau Sheet</span>
              </button>
            </div>

            {/* Sheet Preview Table */}
            {sheetPreviewRows && sheetPreviewRows.length > 0 && (
              <div className="border border-emerald-200 dark:border-emerald-900/60 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Pratinjau Data: "{sheetPreviewTitle}" ({sheetPreviewRows.length - 1} baris data ditemukan)
                  </span>
                  <button
                    type="button"
                    onClick={handleImportParsedSheet}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Konfirmasi Impor ke Database Siswa</span>
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-semibold text-slate-700 dark:text-slate-200">
                      <tr>
                        {sheetPreviewRows[0].map((h, i) => (
                          <th key={i} className="p-2 border-b border-slate-200 dark:border-slate-700">
                            {h || `Kolom ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sheetPreviewRows.slice(1, 10).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2 truncate max-w-[200px]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {sheetPreviewRows.length > 10 && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Menampilkan 10 baris pertama dari {sheetPreviewRows.length - 1} total baris data.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: GOOGLE DRIVE */}
      {activeSubTab === 'drive' && (
        <div className="space-y-6">
          {/* 1-Click Backup Card */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold">
                <Database className="w-4 h-4 text-blue-400" />
                <span>Penyimpanan Aman Google Drive</span>
              </div>
              <h2 className="text-lg font-bold">Cadangkan Seluruh Data Sekolah ke Google Drive</h2>
              <p className="text-xs text-blue-100 leading-relaxed">
                Membuat arsip lengkap berisi data profil sekolah, kelas, siswa, presensi, nilai, dan jurnal mengajar ke folder khusus di Google Drive Anda.
              </p>
            </div>
            <button
              onClick={handleBackupAll}
              disabled={isBackingUp || !accessToken}
              className="px-5 py-2.5 bg-white hover:bg-blue-50 disabled:bg-white/40 text-blue-900 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              {isBackingUp ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-900" />
              ) : (
                <Cloud className="w-4 h-4 text-blue-600" />
              )}
              <span>{isBackingUp ? 'Menyimpan ke Drive...' : 'Cadangkan Data Sekarang'}</span>
            </button>
          </div>

          {/* Drive Explorer Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>Jelajahi Berkas di Google Drive</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Daftar berkas yang tersimpan di akun Google Drive Anda.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(true)}
                  disabled={!accessToken}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
                  <span>Folder Baru</span>
                </button>
                <button
                  type="button"
                  onClick={loadDriveFiles}
                  disabled={isLoadingFiles || !accessToken}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Segarkan daftar berkas"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchDriveQuery}
                  onChange={(e) => setSearchDriveQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadDriveFiles()}
                  placeholder="Cari nama berkas di Drive..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'sheets', 'folders', 'backups'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDriveFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      driveFilter === filter
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'all'
                      ? 'Semua Berkas'
                      : filter === 'sheets'
                      ? 'Google Sheets'
                      : filter === 'folders'
                      ? 'Folder'
                      : 'File Cadangan (Backup)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Files Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              {isLoadingFiles ? (
                <div className="p-8 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Memuat daftar berkas dari Google Drive...
                  </p>
                </div>
              ) : driveFiles.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-semibold text-slate-700 dark:text-slate-200">
                      <tr>
                        <th className="p-2.5">Nama Berkas / Folder</th>
                        <th className="p-2.5 w-32">Jenis</th>
                        <th className="p-2.5 w-36">Terakhir Diubah</th>
                        <th className="p-2.5 text-right w-36">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {driveFiles.map((file) => {
                        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                        const isSheet = file.mimeType === 'application/vnd.google-apps.spreadsheet';
                        const isBackup =
                          file.name.includes('Backup_Administrasi') || file.mimeType === 'application/json';

                        return (
                          <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isFolder ? (
                                  <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                ) : isSheet ? (
                                  <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : isBackup ? (
                                  <Database className="w-4 h-4 text-blue-500 shrink-0" />
                                ) : (
                                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <span className="font-semibold text-slate-900 dark:text-white truncate">
                                  {file.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-2.5 text-slate-500 dark:text-slate-400">
                              {isFolder
                                ? 'Folder'
                                : isSheet
                                ? 'Google Sheets'
                                : isBackup
                                ? 'Cadangan (JSON)'
                                : 'Dokumen'}
                            </td>
                            <td className="p-2.5 text-slate-500 dark:text-slate-400">
                              {file.modifiedTime
                                ? new Date(file.modifiedTime).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '-'}
                            </td>
                            <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold transition-colors"
                                  title="Buka di Google Drive"
                                >
                                  <span>Buka</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                              {isBackup && onRestoreAllData && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRestoreModal({
                                      isOpen: true,
                                      fileId: file.id,
                                      fileName: file.name,
                                    })
                                  }
                                  className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                                  title="Pulihkan data dari cadangan ini"
                                >
                                  Pulihkan
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteModal({
                                    isOpen: true,
                                    fileId: file.id,
                                    fileName: file.name,
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                                title="Hapus dari Google Drive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Folder className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tidak ada berkas yang ditemukan
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {accessToken
                      ? 'Gunakan tombol di atas untuk mencadangkan data atau membuat spreadsheet baru.'
                      : 'Hubungkan akun Google Workspace Anda terlebih dahulu untuk melihat berkas Drive.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Required by Workspace Integration Skill) */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Hapus Berkas dari Google Drive"
        message="Apakah Anda yakin ingin menghapus berkas ini dari akun Google Drive Anda? Tindakan ini akan memindahkan atau menghapus berkas tersebut."
        itemName={deleteModal.fileName}
        confirmLabel="Ya, Hapus dari Drive"
        cancelLabel="Batal"
      />

      {/* Restore Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={restoreModal.isOpen}
        onClose={() => setRestoreModal({ isOpen: false })}
        onConfirm={handleConfirmRestore}
        title="Pulihkan Data dari Cadangan Drive"
        message="Apakah Anda yakin ingin memuat data dari berkas cadangan ini? Data lokal aktif saat ini akan diperbarui sesuai isi cadangan Google Drive."
        itemName={restoreModal.fileName}
        confirmLabel="Ya, Pulihkan Sekarang"
        cancelLabel="Batal"
      />

      {/* New Folder Modal */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-blue-500" />
              <span>Buat Folder Baru di Google Drive</span>
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Nama Folder:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Contoh: Administrasi Kelas X"
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {isCreatingFolder ? 'Membuat...' : 'Buat Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
