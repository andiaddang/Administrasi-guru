import React, { useState, useRef, useMemo } from 'react';
import {
  SchoolProfile,
  User,
  ClassRoom,
  Student,
  AttendanceRecord,
  GradeRecord,
  TeachingJournal,
  Schedule,
} from '../types';
import {
  DocumentExportService,
  DocumentPageSettings,
  DEFAULT_PAGE_SETTINGS,
  PaperSize,
  PageOrientation,
  MarginOption,
  ExportFormat,
  getMarginsInMm,
  getPaperDimensionsInMm,
} from '../services/documentExportService';
import {
  Printer,
  Download,
  Cloud,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  Users,
  GraduationCap,
  BookOpenCheck,
  CalendarDays,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PrintDocumentsViewProps {
  school: SchoolProfile;
  currentUser: User | null;
  classes: ClassRoom[];
  students: Student[];
  attendances: AttendanceRecord[];
  grades: GradeRecord[];
  journals: TeachingJournal[];
  schedules: Schedule[];
}

type DocumentType = 'attendance' | 'grades' | 'students' | 'journals' | 'schedules';

export const PrintDocumentsView: React.FC<PrintDocumentsViewProps> = ({
  school,
  currentUser,
  classes,
  students,
  attendances,
  grades,
  journals,
  schedules,
}) => {
  // Active document selection
  const [docType, setDocType] = useState<DocumentType>('attendance');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'all');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // Page setup state
  const [pageSettings, setPageSettings] = useState<DocumentPageSettings>(DEFAULT_PAGE_SETTINGS);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [isCustomMarginOpen, setIsCustomMarginOpen] = useState(false);

  // Zoom & Pan state (Screen zoom is separated from physical print size)
  const [zoom, setZoom] = useState<number>(100);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Export process state
  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pageCount, setPageCount] = useState<number>(1);
  const [toastMsg, setToastMsg] = useState<{
    text: string;
    type: 'success' | 'error';
    link?: string;
    linkText?: string;
  } | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const documentCardRef = useRef<HTMLDivElement>(null);
  const mouseDragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number>(0);
  const touchStartZoomRef = useRef<number>(100);
  const touchPanStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const showToast = (
    text: string,
    type: 'success' | 'error' = 'success',
    link?: string,
    linkText?: string
  ) => {
    setToastMsg({ text, type, link, linkText });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(250, prev + 15));
  const handleZoomOut = () => setZoom((prev) => Math.max(40, prev - 15));
  const handleResetZoom = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };
  const handleFitWidth = () => {
    if (viewportRef.current) {
      const containerWidth = viewportRef.current.clientWidth - 48;
      const dims = getPaperDimensionsInMm(pageSettings);
      const docPxWidth = dims.width * 3.78;
      const targetZoom = Math.min(200, Math.max(45, Math.round((containerWidth / docPxWidth) * 100)));
      setZoom(targetZoom);
      setPan({ x: 0, y: 0 });
    }
  };

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
    } else if (e.touches.length === 1 && zoom > 100) {
      touchPanStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current > 0) {
      if (e.cancelable) e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = currentDist / touchStartDistRef.current;
      setZoom(Math.min(250, Math.max(40, Math.round(touchStartZoomRef.current * scaleFactor))));
    } else if (e.touches.length === 1 && zoom > 100 && touchPanStartRef.current) {
      setPan({
        x: e.touches[0].clientX - touchPanStartRef.current.x,
        y: e.touches[0].clientY - touchPanStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) touchStartDistRef.current = 0;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom > 100 && e.button === 0) {
      setIsDragging(true);
      mouseDragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && zoom > 100) {
      setPan({
        x: e.clientX - mouseDragStartRef.current.x,
        y: e.clientY - mouseDragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((prev) => Math.min(250, Math.max(40, prev + (e.deltaY > 0 ? -10 : 10))));
    }
  };

  // Selected class object
  const currentClassObj = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  // Month label
  const monthLabel = useMemo(() => {
    if (!selectedMonth) return 'Semua Periode';
    const [year, month] = selectedMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
  }, [selectedMonth]);

  // Document metadata & tables generator
  const currentDocData = useMemo(() => {
    const todayFormatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    switch (docType) {
      case 'attendance': {
        const classStudents = students.filter(
          (s) => selectedClassId === 'all' || s.classId === selectedClassId
        );
        const rows = classStudents.map((s, idx) => {
          const studentAtts = attendances.filter(
            (a) => a.studentId === s.id && a.date.startsWith(selectedMonth)
          );
          const hadir = studentAtts.filter((a) => a.status === 'HADIR').length;
          const izin = studentAtts.filter((a) => a.status === 'IZIN').length;
          const sakit = studentAtts.filter((a) => a.status === 'SAKIT').length;
          const alpa = studentAtts.filter((a) => a.status === 'ALPA').length;
          const totalDays = studentAtts.length;
          const pct = totalDays > 0 ? Math.round((hadir / totalDays) * 100) : 0;
          const cls = classes.find((c) => c.id === s.classId);

          return {
            no: idx + 1,
            nisn: s.nisnNis || s.nisn || s.nis || '-',
            name: s.name,
            gender: s.gender,
            className: cls?.name || '-',
            hadir,
            izin,
            sakit,
            alpa,
            totalDays,
            pct: `${pct}%`,
          };
        });

        return {
          title: 'REKAPITULASI PRESENSI KEHADIRAN SISWA',
          subtitle: `Bulan: ${monthLabel} · Tahun Pelajaran ${school.academicYear}`,
          metaInfo: [
            { label: 'Kelas / Rombel', value: currentClassObj?.name || 'Semua Kelas' },
            { label: 'Wali Kelas', value: currentClassObj?.homeroomTeacher || '-' },
            { label: 'Mata Pelajaran', value: currentUser?.subject || '-' },
            { label: 'Bulan / Periode', value: monthLabel },
          ],
          headers: ['No', 'NISN / NIS', 'Nama Lengkap Siswa', 'L/P', 'Hadir', 'Izin', 'Sakit', 'Alpa', 'Total', '% Hadir'],
          rows: rows.map((r) => [
            String(r.no),
            r.nisn,
            r.name,
            r.gender,
            String(r.hadir),
            String(r.izin),
            String(r.sakit),
            String(r.alpa),
            String(r.totalDays),
            r.pct,
          ]),
          rawRows: rows,
        };
      }

      case 'grades': {
        const classStudents = students.filter(
          (s) => selectedClassId === 'all' || s.classId === selectedClassId
        );
        const rows = classStudents.map((s, idx) => {
          const studentGrades = grades.filter((g) => g.studentId === s.id);
          const tugasGrades = studentGrades.filter((g) => g.type === 'Tugas');
          const uhGrades = studentGrades.filter((g) => g.type === 'Harian');
          const sumatifGrades = studentGrades.filter((g) => g.type === 'Sumatif');

          const avgTugas =
            tugasGrades.length > 0
              ? Math.round(tugasGrades.reduce((a, b) => a + b.score, 0) / tugasGrades.length)
              : '-';
          const avgUh =
            uhGrades.length > 0
              ? Math.round(uhGrades.reduce((a, b) => a + b.score, 0) / uhGrades.length)
              : '-';
          const avgSumatif =
            sumatifGrades.length > 0
              ? Math.round(sumatifGrades.reduce((a, b) => a + b.score, 0) / sumatifGrades.length)
              : '-';

          const allScores = studentGrades.map((g) => g.score);
          const finalScore =
            allScores.length > 0
              ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
              : '-';

          const predikat =
            typeof finalScore === 'number'
              ? finalScore >= 90
                ? 'A'
                : finalScore >= 80
                ? 'B'
                : finalScore >= 75
                ? 'C'
                : 'D'
              : '-';

          return {
            no: idx + 1,
            nisn: s.nisnNis || s.nisn || '-',
            name: s.name,
            gender: s.gender,
            avgTugas: String(avgTugas),
            avgUh: String(avgUh),
            avgSumatif: String(avgSumatif),
            finalScore: String(finalScore),
            predikat,
            status: typeof finalScore === 'number' && finalScore >= 75 ? 'Tuntas' : 'Perlu Bimbingan',
          };
        });

        return {
          title: 'DAFTAR REKAPITULASI PENILAIAN SISWA',
          subtitle: `Mata Pelajaran: ${currentUser?.subject || 'Umum'} · Semester ${school.semester} ${school.academicYear}`,
          metaInfo: [
            { label: 'Kelas / Rombel', value: currentClassObj?.name || 'Semua Kelas' },
            { label: 'Mata Pelajaran', value: currentUser?.subject || '-' },
            { label: 'Guru Pengampu', value: currentUser?.name || '-' },
            { label: 'Tahun Pelajaran', value: `${school.academicYear} (Semester ${school.semester})` },
          ],
          headers: ['No', 'NISN / NIS', 'Nama Siswa', 'L/P', 'Rerata Tugas', 'Formatif/UH', 'Sumatif', 'Nilai Akhir', 'Predikat', 'Ketercapaian'],
          rows: rows.map((r) => [
            String(r.no),
            r.nisn,
            r.name,
            r.gender,
            r.avgTugas,
            r.avgUh,
            r.avgSumatif,
            r.finalScore,
            r.predikat,
            r.status,
          ]),
          rawRows: rows,
        };
      }

      case 'students': {
        const classStudents = students.filter(
          (s) => selectedClassId === 'all' || s.classId === selectedClassId
        );
        return {
          title: 'DAFTAR PESERTA DIDIK & ROMBONGAN BELAJAR',
          subtitle: `Satuan Pendidikan: ${school.name} · Tahun Ajaran ${school.academicYear}`,
          metaInfo: [
            { label: 'Kelas / Rombel', value: currentClassObj?.name || 'Semua Rombel' },
            { label: 'Wali Kelas', value: currentClassObj?.homeroomTeacher || '-' },
            { label: 'Total Siswa', value: `${classStudents.length} Orang` },
            { label: 'Tanggal Cetak', value: todayFormatted },
          ],
          headers: ['No', 'NISN', 'NIS', 'Nama Lengkap Siswa', 'L/P', 'Kelas', 'Kontak Orang Tua', 'Status'],
          rows: classStudents.map((s, idx) => {
            const cls = classes.find((c) => c.id === s.classId);
            return [
              String(idx + 1),
              s.nisn || s.nisnNis || '-',
              s.nis || '-',
              s.name,
              s.gender,
              cls?.name || '-',
              s.parentPhone || '-',
              s.status || 'Aktif',
            ];
          }),
        };
      }

      case 'journals': {
        const filtered = journals.filter(
          (j) => selectedClassId === 'all' || j.classId === selectedClassId
        );
        return {
          title: 'JURNAL KEGIATAN BELAJAR MENGAJAR GURU',
          subtitle: `Mata Pelajaran: ${currentUser?.subject || 'Umum'} · Semester ${school.semester}`,
          metaInfo: [
            { label: 'Nama Guru', value: currentUser?.name || '-' },
            { label: 'NIP Guru', value: currentUser?.nip || '-' },
            { label: 'Mata Pelajaran', value: currentUser?.subject || '-' },
            { label: 'Satuan Pendidikan', value: school.name },
          ],
          headers: ['No', 'Tanggal', 'Kelas', 'Jam', 'Materi / Topik', 'Kegiatan Pembelajaran', 'Kendala & Solusi', 'Hadir/Absen'],
          rows: filtered.map((j, idx) => {
            const cls = classes.find((c) => c.id === j.classId);
            return [
              String(idx + 1),
              j.date,
              cls?.name || '-',
              j.time || `Ke-${j.meetingNumber}`,
              j.topic,
              j.learningActivities || '-',
              `H: ${j.obstacles || '-'} | S: ${j.solutions || '-'}`,
              `${j.presentCount} / ${j.absentCount}`,
            ];
          }),
        };
      }

      case 'schedules': {
        const filtered = schedules.filter(
          (sc) => selectedClassId === 'all' || sc.classId === selectedClassId
        );
        return {
          title: 'JADWAL MENGAJAR GURU & ALOKASI WAKTU',
          subtitle: `Tahun Pelajaran ${school.academicYear} · Semester ${school.semester}`,
          metaInfo: [
            { label: 'Nama Guru', value: currentUser?.name || '-' },
            { label: 'NIP Guru', value: currentUser?.nip || '-' },
            { label: 'Mata Pelajaran', value: currentUser?.subject || '-' },
            { label: 'Satuan Pendidikan', value: school.name },
          ],
          headers: ['No', 'Hari', 'Jam Ke', 'Waktu Pelajaran', 'Kelas / Rombel', 'Mata Pelajaran', 'Ruangan'],
          rows: filtered.map((sc, idx) => {
            const cls = classes.find((c) => c.id === sc.classId);
            return [
              String(idx + 1),
              sc.day,
              String(sc.period || idx + 1),
              `${sc.timeStart} - ${sc.timeEnd}`,
              cls?.name || '-',
              sc.subject,
              sc.room || 'Kelas',
            ];
          }),
        };
      }
    }
  }, [docType, selectedClassId, selectedMonth, students, attendances, grades, journals, schedules, classes, school, currentUser, currentClassObj, monthLabel]);

  // Dynamic Page Count Measurement (Recalculates when rows or settings change)
  React.useEffect(() => {
    const updatePageCount = () => {
      if (documentCardRef.current) {
        const cardEl = documentCardRef.current;
        const dims = getPaperDimensionsInMm(pageSettings);
        const margins = getMarginsInMm(pageSettings);
        const printableHeightMm = dims.height - (margins.top + margins.bottom);
        const pxPerMm = 3.7795;
        const printableHeightPx = printableHeightMm * pxPerMm;
        const contentHeight = cardEl.scrollHeight - (margins.top + margins.bottom) * pxPerMm;
        const pages = Math.max(1, Math.ceil(contentHeight / printableHeightPx));
        setPageCount(pages);
      }
    };
    const timer = setTimeout(updatePageCount, 150);
    return () => clearTimeout(timer);
  }, [pageSettings, docType, selectedClassId, selectedMonth, currentDocData]);

  // Clean filename generator
  const getCleanFilename = (ext: 'pdf' | 'docx') => {
    const cleanDoc = docType.toUpperCase();
    const cleanClass = (currentClassObj?.name || 'Semua_Kelas').replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    return `${cleanDoc}_${cleanClass}_${school.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 15)}_${dateStr}.${ext}`;
  };

  // ACTION 1: Print Isolated
  const handlePrint = () => {
    if (!documentCardRef.current) return;
    DocumentExportService.printIsolated(documentCardRef.current, pageSettings, currentDocData.title);
  };

  // ACTION 2: Download to Device
  const handleDownloadToDevice = async () => {
    if (!documentCardRef.current) return;
    setIsDownloading(true);
    try {
      if (exportFormat === 'pdf') {
        const blob = await DocumentExportService.generatePdfBlob(
          documentCardRef.current,
          pageSettings
        );
        DocumentExportService.downloadBlob(blob, getCleanFilename('pdf'));
        showToast('Dokumen PDF berhasil diunduh ke perangkat Anda!');
      } else {
        const blob = await DocumentExportService.generateDocxBlob(
          school,
          currentUser,
          currentDocData.title,
          currentDocData.subtitle,
          currentDocData.metaInfo,
          currentDocData.headers,
          currentDocData.rows,
          pageSettings
        );
        DocumentExportService.downloadBlob(blob, getCleanFilename('docx'));
        showToast('Dokumen Word (.docx) berhasil diunduh ke perangkat Anda!');
      }
    } catch (err: any) {
      console.error('Download error:', err);
      showToast(err.message || 'Gagal mengunduh dokumen', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // ACTION 3: Export to Google Drive
  const handleExportToGoogleDrive = async () => {
    if (!documentCardRef.current) return;
    setIsExportingDrive(true);
    try {
      if (exportFormat === 'pdf') {
        const blob = await DocumentExportService.generatePdfBlob(
          documentCardRef.current,
          pageSettings
        );
        const res = await DocumentExportService.uploadToGoogleDrive(
          blob,
          getCleanFilename('pdf'),
          school.name
        );
        showToast(
          `Dokumen PDF berhasil disimpan ke Google Drive (${res.fileName})!`,
          'success',
          res.webViewLink || res.folderUrl,
          'Buka di Google Drive'
        );
      } else {
        const blob = await DocumentExportService.generateDocxBlob(
          school,
          currentUser,
          currentDocData.title,
          currentDocData.subtitle,
          currentDocData.metaInfo,
          currentDocData.headers,
          currentDocData.rows,
          pageSettings
        );
        const res = await DocumentExportService.uploadToGoogleDrive(
          blob,
          getCleanFilename('docx'),
          school.name
        );
        showToast(
          `Dokumen Word (.docx) berhasil disimpan ke Google Drive (${res.fileName})!`,
          'success',
          res.webViewLink || res.folderUrl,
          'Buka di Google Drive'
        );
      }
    } catch (err: any) {
      console.error('Google Drive export error:', err);
      showToast(err.message || 'Gagal menyimpan dokumen ke Google Drive', 'error');
    } finally {
      setIsExportingDrive(false);
    }
  };

  const margins = getMarginsInMm(pageSettings);
  const dims = getPaperDimensionsInMm(pageSettings);
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMsg && (
        <div
          className={`fixed top-6 right-6 z-60 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-2 text-white ${
            toastMsg.type === 'success'
              ? 'bg-slate-900 border border-emerald-500/60'
              : 'bg-rose-950 border border-rose-500/60'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
          {toastMsg.link && (
            <a
              href={toastMsg.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors ml-1"
            >
              <span>{toastMsg.linkText || 'Buka'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Main Header Card */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <Printer className="w-3 h-3" />
                Pusat Cetak Dokumen Resmi
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Standar Kop UPT SMA Negeri 1 Gowa
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Cetak & Ekspor Dokumen Pembelajaran
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Pilih dokumen administrasi yang ingin dicetak atau diekspor. Atur ukuran kertas (A4/F4), orientasi, margin,
              lalu cetak langsung atau simpan ke <strong>Google Drive</strong> dan <strong>Unduh ke Perangkat (PDF/Word)</strong>.
            </p>
          </div>

          {/* Quick Stats or Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak Sesuai Tampilan</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadToDevice}
              disabled={isDownloading}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {isDownloading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Unduh ke Perangkat ({exportFormat.toUpperCase()})</span>
            </button>

            <button
              type="button"
              onClick={handleExportToGoogleDrive}
              disabled={isExportingDrive}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {isExportingDrive ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Cloud className="w-4 h-4" />
              )}
              <span>Simpan ke Google Drive</span>
            </button>
          </div>
        </div>

        {/* Document Selector Pills */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          {[
            { id: 'attendance', label: 'Rekap Presensi Siswa', icon: Calendar },
            { id: 'grades', label: 'Daftar & Rekap Nilai', icon: GraduationCap },
            { id: 'journals', label: 'Jurnal Harian Mengajar', icon: BookOpenCheck },
            { id: 'students', label: 'Daftar Siswa & Rombel', icon: Users },
            { id: 'schedules', label: 'Jadwal Mengajar Guru', icon: CalendarDays },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = docType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setDocType(item.id as DocumentType)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter controls row (Class & Month) */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Class filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Pilih Kelas:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <option value="all">Semua Rombel / Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Month filter (for attendance) */}
            {docType === 'attendance' && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Bulan Rekap:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
                />
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              <Layers className="w-3.5 h-3.5" />
              <span>{pageCount > 1 ? `${pageCount} Halaman` : '1 Halaman'} ({pageSettings.paperSize} · {pageSettings.orientation === 'portrait' ? 'Potret' : 'Lanskap'})</span>
            </span>
            {pageCount > 1 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                · Area cetak melebihi 1 lembar: sistem otomatis menambah menjadi {pageCount} halaman saat cetak / ekspor PDF
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Pratinjau otomatis diperbarui</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Workspace Preview Frame with Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col print:border-none print:shadow-none print:bg-white print:p-0 print:m-0">
        {/* Settings Bar: Kertas, Orientasi, Margin, Format Ekspor & Zoom */}
        <div className="no-print bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Page Settings */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Paper Size */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5">Kertas:</span>
              <button
                type="button"
                onClick={() => setPageSettings((prev) => ({ ...prev, paperSize: 'A4' }))}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                  pageSettings.paperSize === 'A4'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                A4 (210×297)
              </button>
              <button
                type="button"
                onClick={() => setPageSettings((prev) => ({ ...prev, paperSize: 'F4' }))}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                  pageSettings.paperSize === 'F4'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                F4 / Folio (215×330)
              </button>
            </div>

            {/* Orientation */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5">Orientasi:</span>
              <button
                type="button"
                onClick={() => setPageSettings((prev) => ({ ...prev, orientation: 'portrait' }))}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                  pageSettings.orientation === 'portrait'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Potret
              </button>
              <button
                type="button"
                onClick={() => setPageSettings((prev) => ({ ...prev, orientation: 'landscape' }))}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                  pageSettings.orientation === 'landscape'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Lanskap
              </button>
            </div>

            {/* Margin Option */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 relative">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5">Margin:</span>
              {(['normal', 'narrow', 'moderate'] as MarginOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setPageSettings((prev) => ({ ...prev, marginOption: opt }));
                    setIsCustomMarginOpen(false);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors capitalize ${
                    pageSettings.marginOption === opt
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {opt === 'normal' ? 'Normal (2.5cm)' : opt === 'narrow' ? 'Sempit (1.5cm)' : 'Sedang (2cm)'}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsCustomMarginOpen(!isCustomMarginOpen)}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  pageSettings.marginOption === 'custom'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span>Kustom</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Custom Margin Popover */}
              {isCustomMarginOpen && (
                <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 w-64 text-xs space-y-2 animate-in fade-in">
                  <p className="font-bold text-slate-800 dark:text-slate-100">Atur Margin Kustom (mm):</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Atas (mm)</label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={pageSettings.customMargins?.top || 25}
                        onChange={(e) =>
                          setPageSettings((prev) => ({
                            ...prev,
                            marginOption: 'custom',
                            customMargins: {
                              ...(prev.customMargins || { top: 25, bottom: 25, left: 25, right: 25 }),
                              top: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full p-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Bawah (mm)</label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={pageSettings.customMargins?.bottom || 25}
                        onChange={(e) =>
                          setPageSettings((prev) => ({
                            ...prev,
                            marginOption: 'custom',
                            customMargins: {
                              ...(prev.customMargins || { top: 25, bottom: 25, left: 25, right: 25 }),
                              bottom: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full p-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Kiri (mm)</label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={pageSettings.customMargins?.left || 25}
                        onChange={(e) =>
                          setPageSettings((prev) => ({
                            ...prev,
                            marginOption: 'custom',
                            customMargins: {
                              ...(prev.customMargins || { top: 25, bottom: 25, left: 25, right: 25 }),
                              left: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full p-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Kanan (mm)</label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={pageSettings.customMargins?.right || 25}
                        onChange={(e) =>
                          setPageSettings((prev) => ({
                            ...prev,
                            marginOption: 'custom',
                            customMargins: {
                              ...(prev.customMargins || { top: 25, bottom: 25, left: 25, right: 25 }),
                              right: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full p-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 text-center font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Format Dokumen: PDF vs Word */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5">Format:</span>
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  exportFormat === 'pdf'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('docx')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  exportFormat === 'docx'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Word (.docx)</span>
              </button>
            </div>
          </div>

          {/* Right: Zoom controls (Visually scaled, does NOT alter print output) */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 40}
              className="p-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
              title="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min="40"
              max="250"
              step="5"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-16 sm:w-24 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              title="Zoom Tampilan"
            />

            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 px-1 min-w-[42px] text-center text-xs">
              {zoom}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 250}
              className="p-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
              title="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-0.5" />

            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              100%
            </button>

            <button
              type="button"
              onClick={handleFitWidth}
              className="px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Pas Layar</span>
            </button>
          </div>
        </div>

        {/* Viewport Canvas (Fixed preview with pan & zoom/pinch) */}
        <div
          ref={viewportRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            touchAction: 'none',
          }}
          className="h-[750px] overflow-auto p-6 sm:p-10 flex items-start justify-center bg-slate-200/90 dark:bg-slate-950/90 relative select-text print:h-auto print:max-h-none print:overflow-visible print:bg-white print:p-0 print:m-0 print:block"
        >
          {/* Paper Sheet Root */}
          <div
            id="printable-document-card"
            ref={documentCardRef}
            style={{
              width: `${dims.width}mm`,
              minHeight: `${dims.height}mm`,
              padding: `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`,
              transform: `scale(${zoom / 100}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'top center',
              transition: isDragging ? 'none' : 'transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
            className="printable-document-root bg-white rounded-lg shadow-2xl border border-slate-300 text-slate-900 text-[10.5pt] box-border relative flex flex-col justify-between print:shadow-none print:border-none print:rounded-none print:m-0 print:p-0 print:w-full print:max-w-none"
          >
            <div>
              {/* KOP SURAT RESMI DINAS */}
              <div className="border-kop-dinas pb-3 mb-5 border-b-2 border-black">
                <div className="flex items-center justify-between gap-4">
                  {/* Logo Kiri */}
                  <div
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      width: `${school.logoKiriSize || 80}px`,
                      height: `${school.logoKiriSize || 80}px`,
                    }}
                  >
                    {school.logoKiri ? (
                      <img
                        src={school.logoKiri}
                        alt="Logo Pemda"
                        style={{
                          maxHeight: `${school.logoKiriSize || 80}px`,
                          maxWidth: `${school.logoKiriSize || 80}px`,
                        }}
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400"
                        style={{
                          width: `${Math.min(64, school.logoKiriSize || 80)}px`,
                          height: `${Math.min(64, school.logoKiriSize || 80)}px`,
                        }}
                      >
                        Logo 1
                      </div>
                    )}
                  </div>

                  {/* Teks Kop Surat */}
                  <div className="flex-1 text-center font-serif leading-tight">
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                      {school.kopHeader1 || 'PEMERINTAH PROVINSI SULAWESI SELATAN'}
                    </h4>
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                      {school.kopHeader2 || 'DINAS PENDIDIKAN'}
                    </h4>
                    {school.kopHeader3 && (
                      <h4 className="text-xs sm:text-sm font-medium uppercase text-slate-900">
                        {school.kopHeader3}
                      </h4>
                    )}
                    <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-950 mt-0.5">
                      {school.kopHeader4 || school.name || 'UPT SMA NEGERI 1 GOWA'}
                    </h2>
                    <p className="text-[10px] sm:text-[11px] font-sans text-slate-700 mt-1">
                      {school.kopSubheader || school.address}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-sans text-slate-600">
                      {school.kopContact || `Telp: ${school.phone} · Website: ${school.website}`}
                    </p>
                  </div>

                  {/* Logo Kanan */}
                  <div
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      width: `${school.logoKananSize || 80}px`,
                      height: `${school.logoKananSize || 80}px`,
                    }}
                  >
                    {school.logoKanan ? (
                      <img
                        src={school.logoKanan}
                        alt="Logo Sekolah"
                        style={{
                          maxHeight: `${school.logoKananSize || 80}px`,
                          maxWidth: `${school.logoKananSize || 80}px`,
                        }}
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400"
                        style={{
                          width: `${Math.min(64, school.logoKananSize || 80)}px`,
                          height: `${Math.min(64, school.logoKananSize || 80)}px`,
                        }}
                      >
                        Logo 2
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* DOKUMEN TITLE */}
              <div className="text-center my-3">
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide underline underline-offset-4 decoration-1">
                  {currentDocData.title}
                </h3>
                {currentDocData.subtitle && (
                  <p className="text-xs text-slate-600 mt-1">{currentDocData.subtitle}</p>
                )}
              </div>

              {/* DOKUMEN META INFO */}
              {currentDocData.metaInfo.length > 0 && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 my-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                  {currentDocData.metaInfo.map((info, idx) => (
                    <div key={idx} className="flex">
                      <span className="w-32 font-medium text-slate-600">{info.label}</span>
                      <span className="mr-2">:</span>
                      <span className="font-semibold text-slate-900">{info.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* MAIN CONTENT TABLE */}
              <div className="my-3 overflow-x-auto">
                <table className="w-full text-xs border border-slate-900 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
                      {currentDocData.headers.map((h, idx) => (
                        <th
                          key={idx}
                          className={`p-2 border border-slate-900 ${
                            idx === 0 ? 'text-center w-8' : idx === 2 ? 'text-left' : 'text-center'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentDocData.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={currentDocData.headers.length}
                          className="p-6 text-center text-slate-500 italic"
                        >
                          Belum ada data untuk kriteria dokumen ini.
                        </td>
                      </tr>
                    ) : (
                      currentDocData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-900">
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`p-1.5 border border-slate-900 ${
                                cIdx === 0
                                  ? 'text-center font-mono w-8'
                                  : cIdx === 2
                                  ? 'text-left font-medium'
                                  : 'text-center'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FOOTER & SIGNATURE SECTION */}
            <div className="mt-8 pt-4 break-inside-avoid">
              <div className="flex justify-between items-start text-xs text-slate-900">
                {/* Mengetahui Kepala Sekolah */}
                <div className="text-center w-56">
                  <p>Mengetahui,</p>
                  <p className="font-medium">Kepala UPT SMA Negeri 1 Gowa</p>
                  <div className="h-20"></div>
                  <p className="font-bold underline uppercase">
                    {school.headmaster || 'Drs. H. Arsyad, M.Pd.'}
                  </p>
                  <p className="text-[11px] text-slate-700">
                    NIP. {school.headmasterNip || '19680512 199412 1 002'}
                  </p>
                </div>

                {/* Guru Pengampu */}
                <div className="text-center w-56">
                  <p>Sungguminasa, {todayFormatted}</p>
                  <p className="font-medium">Guru Mata Pelajaran,</p>
                  <div className="h-20"></div>
                  <p className="font-bold underline uppercase">
                    {currentUser?.name || 'Andi Ismail, S.Pd.'}
                  </p>
                  <p className="text-[11px] text-slate-700">
                    NIP. {currentUser?.nip || '19880815 201403 1 004'}
                  </p>
                </div>
              </div>

              {/* Page Numbering & System Footer */}
              <div className="mt-6 pt-2 border-t border-slate-200 text-[9px] text-slate-500 flex justify-between items-center">
                <span>Dokumen Resmi · Dicetak melalui Sistem Administrasi Guru SMAN 1 Gowa</span>
                <span className="font-mono font-medium">
                  {pageCount > 1 ? `Halaman 1 dari ${pageCount}` : 'Halaman 1'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
