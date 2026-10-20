import React, { useState, useMemo } from 'react';
import {
  Student,
  ClassRoom,
  GradeRecord,
  GradeType,
  SchoolProfile,
  User,
} from '../types';
import {
  GraduationCap,
  Save,
  Printer,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Search,
  CheckCircle,
  Table,
  Calendar,
  BookOpen,
  Filter,
  CheckCircle2,
  Layers,
  Sparkles,
  BarChart2,
  Info,
  ListChecks,
} from 'lucide-react';
import { PrintDocumentModal } from './PrintDocumentModal';

interface GradeManagementProps {
  students: Student[];
  classes: ClassRoom[];
  grades: GradeRecord[];
  onSaveBatchGrades: (newGrades: GradeRecord[]) => void;
  onDeleteGrade: (id: string) => void;
  school: SchoolProfile;
  currentUser: User | null;
}

export interface AssessmentColumn {
  key: string;
  title: string;
  date: string;
  type: GradeType;
  subject: string;
  maxScore: number;
}

export const GradeManagement: React.FC<GradeManagementProps> = ({
  students,
  classes,
  grades,
  onSaveBatchGrades,
  onDeleteGrade,
  school,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'mass' | 'ledger' | 'history'>('ledger');

  // Mass input states
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [subject, setSubject] = useState<string>(currentUser?.subject?.split('&')[0]?.trim() || 'Matematika');
  const [gradeType, setGradeType] = useState<GradeType>('Sumatif');
  const [assessmentTitle, setAssessmentTitle] = useState<string>('Sumatif Lingkup Materi 2');
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  // Mass score map: studentId -> score number
  const [massScores, setMassScores] = useState<Record<string, number | ''>>({});
  const [massNotes, setMassNotes] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Ledger states
  const [ledgerClassId, setLedgerClassId] = useState<string>(classes[0]?.id || '');
  const [legerViewMode, setLegerViewMode] = useState<'detailed' | 'summary'>('detailed');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printViewMode, setPrintViewMode] = useState<'detailed' | 'summary'>('detailed');

  // History state
  const [historySearch, setHistorySearch] = useState('');

  // Helpers
  const formatDateId = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getTypeBadgeStyle = (type: GradeType) => {
    switch (type) {
      case 'Tugas':
        return 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'Harian':
        return 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Sumatif':
        return 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'STS':
        return 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'SAS':
        return 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  // Class students for mass input
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Prepopulate mass scores if exists for title/type
  React.useEffect(() => {
    const existing = grades.filter(
      (g) =>
        g.classId === selectedClassId &&
        g.type === gradeType &&
        g.title.toLowerCase() === assessmentTitle.trim().toLowerCase()
    );
    const scoreMap: Record<string, number | ''> = {};
    const notesMap: Record<string, string> = {};

    classStudents.forEach((s) => {
      const found = existing.find((g) => g.studentId === s.id);
      if (found) {
        scoreMap[s.id] = found.score;
        notesMap[s.id] = found.notes || '';
      } else {
        scoreMap[s.id] = '';
        notesMap[s.id] = '';
      }
    });

    setMassScores(scoreMap);
    setMassNotes(notesMap);
  }, [selectedClassId, gradeType, assessmentTitle, classStudents, grades]);

  const handleScoreChange = (studentId: string, val: string) => {
    const num = val === '' ? '' : Math.min(100, Math.max(0, Number(val)));
    setMassScores((prev) => ({
      ...prev,
      [studentId]: num,
    }));
  };

  const handleSaveMassInput = () => {
    if (!assessmentTitle.trim()) {
      alert('Harap masukkan judul asesmen penilaian.');
      return;
    }

    const newRecords: GradeRecord[] = [];
    classStudents.forEach((student) => {
      const scoreVal = massScores[student.id];
      if (scoreVal !== '' && typeof scoreVal === 'number') {
        newRecords.push({
          id: `grd-${Date.now()}-${student.id}`,
          studentId: student.id,
          classId: selectedClassId,
          subject: subject.trim(),
          type: gradeType,
          title: assessmentTitle.trim(),
          score: scoreVal,
          maxScore: 100,
          date: assessmentDate,
          semester: school.semester,
          notes: massNotes[student.id] || '',
        });
      }
    });

    if (newRecords.length === 0) {
      alert('Harap masukkan setidaknya satu nilai siswa.');
      return;
    }

    onSaveBatchGrades(newRecords);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // LEGER REKAPITULASI NILAI CALCULATION
  const ledgerStudents = useMemo(() => {
    return students.filter((s) => s.classId === ledgerClassId);
  }, [students, ledgerClassId]);

  // Extract all distinct assessment sessions for selected class (with Date & Title)
  const uniqueAssessments = useMemo<AssessmentColumn[]>(() => {
    const map = new Map<string, AssessmentColumn>();
    const classGrades = grades.filter((g) => g.classId === ledgerClassId);

    classGrades.forEach((g) => {
      const cleanTitle = (g.title || 'Penilaian').trim();
      const cleanDate = (g.date || '').trim();
      const key = `${g.type}__${cleanTitle.toLowerCase()}__${cleanDate}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          title: cleanTitle,
          date: cleanDate,
          type: g.type,
          subject: g.subject || 'Matematika',
          maxScore: g.maxScore || 100,
        });
      }
    });

    // Sort chronologically by date ascending, then by title
    return Array.from(map.values()).sort((a, b) => {
      if (a.date && b.date && a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.title.localeCompare(b.title);
    });
  }, [grades, ledgerClassId]);

  // Filtered assessment columns by type if user chooses
  const displayedAssessments = useMemo(() => {
    if (ledgerTypeFilter === 'all') return uniqueAssessments;
    return uniqueAssessments.filter((a) => a.type === ledgerTypeFilter);
  }, [uniqueAssessments, ledgerTypeFilter]);

  // Detailed Ledger dataset containing individual assessment scores and aggregates
  const detailedLedgerData = useMemo(() => {
    return ledgerStudents.map((student, idx) => {
      const studentGrades = grades.filter(
        (g) => g.studentId === student.id && g.classId === ledgerClassId
      );

      // Map scores per unique assessment column
      const scoresMap: Record<string, number | null> = {};
      uniqueAssessments.forEach((col) => {
        const found = studentGrades.find(
          (g) =>
            `${g.type}__${(g.title || '').trim().toLowerCase()}__${(g.date || '').trim()}` === col.key
        );
        scoresMap[col.key] = found !== undefined ? found.score : null;
      });

      const tugasList = studentGrades.filter((g) => g.type === 'Tugas').map((g) => g.score);
      const harianList = studentGrades.filter((g) => g.type === 'Harian').map((g) => g.score);
      const sumatifList = studentGrades.filter((g) => g.type === 'Sumatif').map((g) => g.score);
      const stsList = studentGrades.filter((g) => g.type === 'STS').map((g) => g.score);
      const sasList = studentGrades.filter((g) => g.type === 'SAS').map((g) => g.score);

      const avgTugas = tugasList.length ? Math.round(tugasList.reduce((a, b) => a + b, 0) / tugasList.length) : null;
      const avgHarian = harianList.length ? Math.round(harianList.reduce((a, b) => a + b, 0) / harianList.length) : null;
      const avgSumatif = sumatifList.length ? Math.round(sumatifList.reduce((a, b) => a + b, 0) / sumatifList.length) : null;
      const valSTS = stsList.length ? stsList[stsList.length - 1] : null;
      const valSAS = sasList.length ? sasList[sasList.length - 1] : null;

      // Calculate Final Grade (Rata-rata berbobot Kurikulum Merdeka)
      const validScores: number[] = [];
      if (avgTugas !== null) validScores.push(avgTugas);
      if (avgHarian !== null) validScores.push(avgHarian);
      if (avgSumatif !== null) validScores.push(avgSumatif);
      if (valSTS !== null) validScores.push(valSTS);
      if (valSAS !== null) validScores.push(valSAS);

      const finalGrade =
        validScores.length > 0
          ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
          : 0;

      // Predikat & Status Ketercapaian
      let predikat = 'D';
      let statusKetercapaian = 'Perlu Bimbingan';
      if (finalGrade >= 90) {
        predikat = 'A';
        statusKetercapaian = 'Tercapai Sangat Baik';
      } else if (finalGrade >= 80) {
        predikat = 'B';
        statusKetercapaian = 'Tercapai Baik';
      } else if (finalGrade >= 70) {
        predikat = 'C';
        statusKetercapaian = 'Tercapai Cukup';
      }

      return {
        no: idx + 1,
        id: student.id,
        nisnNis: student.nisnNis || student.nisn || student.nis || '-',
        name: student.name,
        gender: student.gender,
        scoresMap,
        avgTugas: avgTugas ?? '-',
        avgHarian: avgHarian ?? '-',
        avgSumatif: avgSumatif ?? '-',
        sts: valSTS ?? '-',
        sas: valSAS ?? '-',
        finalGrade: validScores.length > 0 ? finalGrade : '-',
        predikat: validScores.length > 0 ? predikat : '-',
        statusKetercapaian: validScores.length > 0 ? statusKetercapaian : 'Belum Ada Nilai',
      };
    });
  }, [ledgerStudents, grades, ledgerClassId, uniqueAssessments]);

  // Statistics per assessment column (average, min, max, count)
  const colStats = useMemo(() => {
    const stats: Record<
      string,
      { avg: number | null; min: number | null; max: number | null; count: number }
    > = {};

    uniqueAssessments.forEach((col) => {
      const scores: number[] = [];
      detailedLedgerData.forEach((row) => {
        const val = row.scoresMap[col.key];
        if (typeof val === 'number') {
          scores.push(val);
        }
      });

      if (scores.length > 0) {
        const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        stats[col.key] = { avg, min, max, count: scores.length };
      } else {
        stats[col.key] = { avg: null, min: null, max: null, count: 0 };
      }
    });

    return stats;
  }, [uniqueAssessments, detailedLedgerData]);

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);
  const ledgerClassObj = classes.find((c) => c.id === ledgerClassId);

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Manajemen Penilaian & Rapor Siswa
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {grades.length} Nilai Tersimpan
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Input nilai massal, leger rincian asesmen lengkap dengan tanggal & materi, serta cetak dokumen resmi
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Leger & Rekap Nilai</span>
          </button>
          <button
            onClick={() => setActiveTab('mass')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mass'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Input Nilai Massal</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Riwayat ({grades.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'ledger' ? (
        /* TAB 2: LEGER & REKAPITULASI NILAI LENGKAP DENGAN RINCIAN TANGGAL & JUDUL */
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                  Pilih Kelas:
                </label>
                <select
                  value={ledgerClassId}
                  onChange={(e) => setLedgerClassId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {c.name} ({students.filter((s) => s.classId === c.id).length} Siswa)
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle (Detailed vs Summary) */}
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setLegerViewMode('detailed')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    legerViewMode === 'detailed'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Menampilkan setiap inputan asesmen lengkap dengan tanggal dan judul materi"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Rincian Semua Penilaian (Tanggal & Judul)</span>
                  <span className="px-1.5 py-0.2 bg-indigo-500/30 text-[10px] rounded-full">
                    {uniqueAssessments.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setLegerViewMode('summary')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    legerViewMode === 'summary'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Menampilkan ringkasan rata-rata per kategori asesmen"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Ringkasan Nilai Akhir</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto">
              {/* Filter Type in Detailed Mode */}
              {legerViewMode === 'detailed' && uniqueAssessments.length > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={ledgerTypeFilter}
                    onChange={(e) => setLedgerTypeFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="all">Semua Jenis ({uniqueAssessments.length})</option>
                    <option value="Tugas">Tugas ({uniqueAssessments.filter((a) => a.type === 'Tugas').length})</option>
                    <option value="Harian">Harian ({uniqueAssessments.filter((a) => a.type === 'Harian').length})</option>
                    <option value="Sumatif">Sumatif ({uniqueAssessments.filter((a) => a.type === 'Sumatif').length})</option>
                    <option value="STS">STS ({uniqueAssessments.filter((a) => a.type === 'STS').length})</option>
                    <option value="SAS">SAS ({uniqueAssessments.filter((a) => a.type === 'SAS').length})</option>
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setPrintViewMode(legerViewMode);
                  setIsPrintModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Leger / Rapor</span>
              </button>
            </div>
          </div>

          {/* ASSESSMENT SESSIONS SUMMARY STRIP */}
          {uniqueAssessments.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    Daftar {uniqueAssessments.length} Asesmen Terinput di Kelas {ledgerClassObj?.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    (Lengkap dengan tanggal pelaksanaan & judul materi pembelajaran)
                  </span>
                </div>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {uniqueAssessments.filter((a) => a.type === 'Tugas').length} Tugas ·{' '}
                  {uniqueAssessments.filter((a) => a.type === 'Harian').length} Harian ·{' '}
                  {uniqueAssessments.filter((a) => a.type === 'Sumatif').length} Sumatif ·{' '}
                  {uniqueAssessments.filter((a) => a.type === 'STS' || a.type === 'SAS').length} Ujian STS/SAS
                </span>
              </div>

              {/* Horizontal Scrollable Assessment Cards */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 text-xs">
                {uniqueAssessments.map((item, idx) => {
                  const stat = colStats[item.key];
                  const isFiltered = ledgerTypeFilter !== 'all' && item.type !== ledgerTypeFilter;
                  return (
                    <div
                      key={idx}
                      className={`min-w-[200px] max-w-[240px] p-2.5 rounded-xl border transition-all ${
                        isFiltered
                          ? 'opacity-40 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeBadgeStyle(item.type)}`}>
                          {item.type}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDateId(item.date)}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white truncate text-xs" title={item.title}>
                        {item.title}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span>Rerata Kelas:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {stat?.avg !== null ? stat.avg : '-'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Info className="w-8 h-8 text-indigo-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Belum Ada Asesmen yang Diinput untuk Kelas {ledgerClassObj?.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Silakan beralih ke tab <strong>Input Nilai Massal</strong> untuk mulai memasukkan nilai harian, tugas, sumatif, STS, atau SAS.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedClassId(ledgerClassId);
                  setActiveTab('mass');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Input Nilai untuk Kelas Ini Sekarang</span>
              </button>
            </div>
          )}

          {/* MAIN LEGER TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
            {/* Table Header Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {legerViewMode === 'detailed' ? '📊 Matriks Penilaian Lengkap' : '📋 Buku Leger Nilai Kompilasi'} · Kelas {ledgerClassObj?.name}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tahun Ajaran {school.academicYear} · Semester {school.semester} · {currentUser?.subject || 'Mata Pelajaran'}
                </p>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <span>Wali Kelas: <strong className="text-slate-900 dark:text-white">{ledgerClassObj?.homeroomTeacher}</strong></span>
                <span>•</span>
                <span>Jumlah: <strong className="text-slate-900 dark:text-white">{ledgerStudents.length} Siswa</strong></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                {/* TABLE HEAD */}
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-800">
                  {legerViewMode === 'detailed' ? (
                    /* MULTI-COLUMN DETAILED ASSESSMENTS HEADER */
                    <tr>
                      <th className="p-3 w-10 text-center sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/90">No</th>
                      <th className="p-3 w-40 sticky left-10 z-10 bg-slate-50 dark:bg-slate-800/90">NISN / NIS</th>
                      <th className="p-3 min-w-[180px] sticky left-50 z-10 bg-slate-50 dark:bg-slate-800/90">Nama Siswa</th>
                      <th className="p-3 text-center w-12">L/P</th>

                      {/* Dynamic Columns for each Unique Assessment */}
                      {displayedAssessments.length > 0 ? (
                        displayedAssessments.map((col) => (
                          <th
                            key={col.key}
                            className="p-3 text-center min-w-[150px] border-l border-slate-200 dark:border-slate-700/80 bg-slate-100/60 dark:bg-slate-800/90"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getTypeBadgeStyle(col.type)}`}>
                                {col.type}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2 max-w-[160px] text-center" title={col.title}>
                                {col.title}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300 font-mono font-normal">
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                {formatDateId(col.date)}
                              </span>
                            </div>
                          </th>
                        ))
                      ) : (
                        <th className="p-3 text-center text-slate-400 italic">
                          (Belum ada rincian asesmen terinput)
                        </th>
                      )}

                      {/* Summary Columns */}
                      <th className="p-3 text-center min-w-[90px] border-l border-slate-200 dark:border-slate-700 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold">
                        Nilai Akhir
                      </th>
                      <th className="p-3 text-center min-w-[70px] bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-bold">
                        Predikat
                      </th>
                      <th className="p-3 min-w-[180px] bg-indigo-50/20 dark:bg-indigo-950/20 text-slate-800 dark:text-slate-200 font-bold">
                        Capaian Kompetensi (TP)
                      </th>
                    </tr>
                  ) : (
                    /* SUMMARY CATEGORIES HEADER */
                    <tr>
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3 w-40">NISN / NIS</th>
                      <th className="p-3">Nama Lengkap Siswa</th>
                      <th className="p-3 text-center w-12">L/P</th>
                      <th className="p-3 text-center min-w-[80px]">Rata Tugas</th>
                      <th className="p-3 text-center min-w-[80px]">Rata Harian</th>
                      <th className="p-3 text-center min-w-[80px]">Rata Sumatif</th>
                      <th className="p-3 text-center min-w-[80px]">STS</th>
                      <th className="p-3 text-center min-w-[80px]">SAS</th>
                      <th className="p-3 text-center font-bold bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 min-w-[90px]">
                        Nilai Akhir
                      </th>
                      <th className="p-3 text-center min-w-[70px]">Predikat</th>
                      <th className="p-3 min-w-[180px]">Capaian Kompetensi</th>
                    </tr>
                  )}
                </thead>

                {/* TABLE BODY */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {detailedLedgerData.length > 0 ? (
                    detailedLedgerData.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400 sticky left-0 bg-white dark:bg-slate-900">
                          {row.no}
                        </td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-200 font-medium sticky left-10 bg-white dark:bg-slate-900">
                          {row.nisnNis}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white sticky left-50 bg-white dark:bg-slate-900">
                          {row.name}
                        </td>
                        <td className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                          {row.gender}
                        </td>

                        {/* DETAILED COLUMNS */}
                        {legerViewMode === 'detailed' ? (
                          displayedAssessments.length > 0 ? (
                            displayedAssessments.map((col) => {
                              const scoreVal = row.scoresMap[col.key];
                              return (
                                <td
                                  key={col.key}
                                  className="p-3 text-center font-mono border-l border-slate-100 dark:border-slate-800"
                                >
                                  {scoreVal !== null && scoreVal !== undefined ? (
                                    <span
                                      className={`font-bold inline-block px-2 py-0.5 rounded text-xs ${
                                        scoreVal >= 85
                                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-extrabold'
                                          : scoreVal >= 75
                                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                                          : scoreVal >= 65
                                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                                      }`}
                                    >
                                      {scoreVal}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-600 font-normal">
                                      -
                                    </span>
                                  )}
                                </td>
                              );
                            })
                          ) : (
                            <td className="p-3 text-center text-slate-400">-</td>
                          )
                        ) : (
                          /* SUMMARY COLUMNS */
                          <>
                            <td className="p-3 text-center font-mono font-medium">{row.avgTugas}</td>
                            <td className="p-3 text-center font-mono font-medium">{row.avgHarian}</td>
                            <td className="p-3 text-center font-mono font-medium">{row.avgSumatif}</td>
                            <td className="p-3 text-center font-mono font-medium">{row.sts}</td>
                            <td className="p-3 text-center font-mono font-medium">{row.sas}</td>
                          </>
                        )}

                        {/* FINAL GRADE */}
                        <td className="p-3 text-center font-mono font-extrabold text-sm border-l border-slate-200 dark:border-slate-700 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300">
                          {row.finalGrade}
                        </td>
                        <td className="p-3 text-center font-mono font-extrabold text-slate-900 dark:text-white bg-indigo-50/20 dark:bg-indigo-950/20">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              row.predikat === 'A'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                                : row.predikat === 'B'
                                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200'
                                : row.predikat === 'C'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200'
                            }`}
                          >
                            {row.predikat}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-slate-700 dark:text-slate-200">
                          <span className="font-medium">{row.statusKetercapaian}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={15} className="p-8 text-center text-slate-400">
                        Tidak ada data siswa pada kelas ini.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* TABLE FOOTER (RERATA KELAS PER ASESMEN) */}
                {detailedLedgerData.length > 0 && (
                  <tfoot className="bg-slate-100/80 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100">
                    {/* Baris Rata-rata */}
                    <tr>
                      <td colSpan={4} className="p-3 text-right font-bold tracking-wide">
                        Rata-Rata Nilai Kelas:
                      </td>

                      {legerViewMode === 'detailed' ? (
                        displayedAssessments.map((col) => {
                          const stat = colStats[col.key];
                          return (
                            <td key={col.key} className="p-3 text-center font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300 border-l border-slate-200 dark:border-slate-700">
                              {stat?.avg !== null ? stat.avg : '-'}
                            </td>
                          );
                        })
                      ) : (
                        <>
                          <td className="p-3 text-center font-mono font-bold text-xs">
                            {(() => {
                              const vals = detailedLedgerData.map((d) => d.avgTugas).filter((v): v is number => typeof v === 'number');
                              return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                            })()}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-xs">
                            {(() => {
                              const vals = detailedLedgerData.map((d) => d.avgHarian).filter((v): v is number => typeof v === 'number');
                              return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                            })()}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-xs">
                            {(() => {
                              const vals = detailedLedgerData.map((d) => d.avgSumatif).filter((v): v is number => typeof v === 'number');
                              return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                            })()}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-xs">
                            {(() => {
                              const vals = detailedLedgerData.map((d) => d.sts).filter((v): v is number => typeof v === 'number');
                              return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                            })()}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-xs">
                            {(() => {
                              const vals = detailedLedgerData.map((d) => d.sas).filter((v): v is number => typeof v === 'number');
                              return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                            })()}
                          </td>
                        </>
                      )}

                      {/* Rata Nilai Akhir Kelas */}
                      <td className="p-3 text-center font-mono font-extrabold text-indigo-700 dark:text-indigo-300 border-l border-slate-300 dark:border-slate-700">
                        {(() => {
                          const finals = detailedLedgerData.map((d) => d.finalGrade).filter((v): v is number => typeof v === 'number');
                          return finals.length ? Math.round(finals.reduce((a, b) => a + b, 0) / finals.length) : '-';
                        })()}
                      </td>
                      <td colSpan={2} className="p-3 text-xs text-slate-500 dark:text-slate-400">
                        {ledgerStudents.length} siswa terdaftar
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'mass' ? (
        /* TAB 1: INPUT NILAI MASSAL */
        <div className="space-y-4">
          {/* Controls Form Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs transition-colors">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Rombel / Kelas
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Jenis Asesmen
                </label>
                <select
                  value={gradeType}
                  onChange={(e) => setGradeType(e.target.value as GradeType)}
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Tugas" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tugas Mandiri / Kelompok</option>
                  <option value="Harian" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Formatif Harian</option>
                  <option value="Sumatif" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Sumatif Lingkup Materi</option>
                  <option value="STS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Sumatif Tengah Semester (STS)</option>
                  <option value="SAS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Sumatif Akhir Semester (SAS)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Judul Penilaian / Materi
                </label>
                <input
                  type="text"
                  value={assessmentTitle}
                  onChange={(e) => setAssessmentTitle(e.target.value)}
                  placeholder="Contoh: Sumatif Bab 2 Trigonometri"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Tanggal Asesmen
                </label>
                <input
                  type="date"
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Menilai untuk {classStudents.length} siswa di kelas {selectedClassObj?.name}
              </span>

              <button
                type="button"
                onClick={handleSaveMassInput}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Penilaian Massal
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Nilai asesmen &quot;{assessmentTitle}&quot; tanggal {assessmentDate} berhasil disimpan! Data langsung muncul di Leger Nilai.</span>
            </div>
          )}

          {/* Student list for mass grading */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-100">
                Formulir Pengisian Nilai Kelas {selectedClassObj?.name}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Wali Kelas: {selectedClassObj?.homeroomTeacher}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 w-10 text-center">No</th>
                    <th className="p-3.5 w-44">NISN / NIS</th>
                    <th className="p-3.5">Nama Lengkap Siswa</th>
                    <th className="p-3.5 text-center w-12">L/P</th>
                    <th className="p-3.5 w-32 text-center">Nilai (0 - 100)</th>
                    <th className="p-3.5">Catatan Khusus (Opsional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {classStudents.length > 0 ? (
                    classStudents.map((student, idx) => {
                      const scoreVal = massScores[student.id];
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 font-mono text-slate-700 dark:text-slate-200 font-medium">
                            {student.nisnNis || student.nisn || student.nis || '-'}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">{student.name}</td>
                          <td className="p-3.5 text-center font-semibold text-slate-600 dark:text-slate-300">{student.gender}</td>
                          <td className="p-3.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={scoreVal}
                              onChange={(e) => handleScoreChange(student.id, e.target.value)}
                              placeholder="0 - 100"
                              className="w-24 px-3 py-1.5 text-center font-mono font-bold text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="p-3.5">
                            <input
                              type="text"
                              value={massNotes[student.id] || ''}
                              onChange={(e) =>
                                setMassNotes((prev) => ({
                                  ...prev,
                                  [student.id]: e.target.value,
                                }))
                              }
                              placeholder="Catatan kemajuan atau remedial..."
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400"
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Tidak ada siswa pada kelas terpilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 3: RIWAYAT PENILAIAN INDIVIDUAL */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Cari judul penilaian atau mata pelajaran..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5">Kelas</th>
                    <th className="p-3.5">Mata Pelajaran</th>
                    <th className="p-3.5">Jenis</th>
                    <th className="p-3.5">Judul Asesmen / Materi</th>
                    <th className="p-3.5">Nama Siswa</th>
                    <th className="p-3.5 text-center">Nilai</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {grades.length > 0 ? (
                    grades
                      .filter(
                        (g) =>
                          g.title.toLowerCase().includes(historySearch.toLowerCase()) ||
                          g.subject.toLowerCase().includes(historySearch.toLowerCase())
                      )
                      .map((g) => {
                        const student = students.find((s) => s.id === g.studentId);
                        const cls = classes.find((c) => c.id === g.classId);
                        return (
                          <tr key={g.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">{formatDateId(g.date)}</td>
                            <td className="p-3.5 font-medium">{cls?.name || '-'}</td>
                            <td className="p-3.5">{g.subject}</td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeBadgeStyle(g.type)}`}>
                                {g.type}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">{g.title}</td>
                            <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-100">{student?.name || '-'}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                              {g.score}
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  if (window.confirm('Hapus entri penilaian ini?')) {
                                    onDeleteGrade(g.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                                title="Hapus Nilai"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Belum ada riwayat penilaian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRINT DOKUMEN LEGER NILAI / RAPOR MODAL */}
      <PrintDocumentModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={printViewMode === 'detailed' ? 'LEGER RINCIAN HASIL PENILAIAN LENGKAP' : 'LEGER HASIL PENILAIAN CAPAIAN KOMPETENSI'}
        subtitle={`Tahun Pelajaran ${school.academicYear} · Semester ${school.semester} · ${printViewMode === 'detailed' ? 'Matriks Rincian Judul & Tanggal Asesmen' : 'Kompilasi Rata-rata Kategori'}`}
        school={school}
        currentUser={currentUser}
        metaInfo={[
          { label: 'Kelas / Rombel', value: ledgerClassObj?.name || '-' },
          { label: 'Wali Kelas', value: ledgerClassObj?.homeroomTeacher || '-' },
          { label: 'Mata Pelajaran', value: currentUser?.subject || 'Matematika & Informatika' },
          { label: 'Total Asesmen', value: `${uniqueAssessments.length} Sesi Penilaian` },
          { label: 'Kurikulum', value: 'Kurikulum Merdeka' },
        ]}
      >
        <div className="space-y-4">
          {/* Print format switch (hidden on actual print paper) */}
          <div className="no-print flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-200 mb-4 text-xs">
            <span className="font-semibold text-slate-700">Pilih Format Cetak Leger:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPrintViewMode('detailed')}
                className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                  printViewMode === 'detailed'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                Matriks Rinci (Tanggal & Judul Asesmen)
              </button>
              <button
                type="button"
                onClick={() => setPrintViewMode('summary')}
                className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                  printViewMode === 'summary'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                Ringkasan Nilai Akhir
              </button>
            </div>
          </div>

          {printViewMode === 'detailed' && uniqueAssessments.length > 0 ? (
            /* PRINT TABEL MATRIKS RINCI */
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border border-slate-900 border-collapse print:border-black">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                    <th className="p-1.5 border border-slate-900 text-center w-7">No</th>
                    <th className="p-1.5 border border-slate-900 text-center w-28">NISN / NIS</th>
                    <th className="p-1.5 border border-slate-900 text-left min-w-[120px]">Nama Siswa</th>
                    <th className="p-1.5 border border-slate-900 text-center w-7">L/P</th>

                    {/* Columns for each assessment with date & title */}
                    {uniqueAssessments.map((col) => (
                      <th key={col.key} className="p-1.5 border border-slate-900 text-center min-w-[70px]">
                        <div className="text-[9px] uppercase font-bold text-slate-700">{col.type}</div>
                        <div className="font-bold text-[10px] leading-tight">{col.title}</div>
                        <div className="font-normal font-mono text-[9px] text-slate-600">{formatDateId(col.date)}</div>
                      </th>
                    ))}

                    <th className="p-1.5 border border-slate-900 text-center w-12 font-extrabold bg-slate-200">NA</th>
                    <th className="p-1.5 border border-slate-900 text-center w-8">Pred.</th>
                    <th className="p-1.5 border border-slate-900 text-left min-w-[110px]">Capaian TP</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedLedgerData.map((row) => (
                    <tr key={row.id} className="border-b border-slate-900">
                      <td className="p-1 border border-slate-900 text-center font-mono">{row.no}</td>
                      <td className="p-1 border border-slate-900 text-center font-mono">{row.nisnNis}</td>
                      <td className="p-1 border border-slate-900 font-medium">{row.name}</td>
                      <td className="p-1 border border-slate-900 text-center">{row.gender}</td>

                      {/* Scores per assessment */}
                      {uniqueAssessments.map((col) => {
                        const sc = row.scoresMap[col.key];
                        return (
                          <td key={col.key} className="p-1 border border-slate-900 text-center font-mono font-medium">
                            {sc !== null && sc !== undefined ? sc : '-'}
                          </td>
                        );
                      })}

                      <td className="p-1 border border-slate-900 text-center font-mono font-bold bg-slate-100">
                        {row.finalGrade}
                      </td>
                      <td className="p-1 border border-slate-900 text-center font-bold">{row.predikat}</td>
                      <td className="p-1 border border-slate-900 text-[10px] leading-tight">{row.statusKetercapaian}</td>
                    </tr>
                  ))}
                  {/* Footer Rata-rata */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                    <td colSpan={4} className="p-1.5 border border-slate-900 text-right">Rerata Kelas:</td>
                    {uniqueAssessments.map((col) => {
                      const stat = colStats[col.key];
                      return (
                        <td key={col.key} className="p-1.5 border border-slate-900 text-center font-mono">
                          {stat?.avg !== null ? stat.avg : '-'}
                        </td>
                      );
                    })}
                    <td className="p-1.5 border border-slate-900 text-center font-mono font-extrabold">
                      {(() => {
                        const finals = detailedLedgerData.map((d) => d.finalGrade).filter((v): v is number => typeof v === 'number');
                        return finals.length ? Math.round(finals.reduce((a, b) => a + b, 0) / finals.length) : '-';
                      })()}
                    </td>
                    <td colSpan={2} className="p-1.5 border border-slate-900 text-center text-[10px]">
                      {ledgerStudents.length} Siswa
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* PRINT TABEL RINGKASAN */
            <table className="w-full text-xs border border-slate-900 border-collapse print:border-black">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                  <th className="p-2 border border-slate-900 text-center w-8">No</th>
                  <th className="p-2 border border-slate-900 text-center">NISN / NIS</th>
                  <th className="p-2 border border-slate-900 text-left">Nama Siswa</th>
                  <th className="p-2 border border-slate-900 text-center w-8">L/P</th>
                  <th className="p-2 border border-slate-900 text-center w-12">Tugas</th>
                  <th className="p-2 border border-slate-900 text-center w-12">Harian</th>
                  <th className="p-2 border border-slate-900 text-center w-12">Sumatif</th>
                  <th className="p-2 border border-slate-900 text-center w-12">STS</th>
                  <th className="p-2 border border-slate-900 text-center w-12">SAS</th>
                  <th className="p-2 border border-slate-900 text-center w-14 font-extrabold bg-slate-200">NA</th>
                  <th className="p-2 border border-slate-900 text-center w-10">Pred.</th>
                  <th className="p-2 border border-slate-900 text-left">Ketercapaian TP</th>
                </tr>
              </thead>
              <tbody>
                {detailedLedgerData.map((row) => (
                  <tr key={row.id} className="border-b border-slate-900">
                    <td className="p-1.5 border border-slate-900 text-center font-mono">{row.no}</td>
                    <td className="p-1.5 border border-slate-900 text-center font-mono font-medium">{row.nisnNis}</td>
                    <td className="p-1.5 border border-slate-900 font-medium">{row.name}</td>
                    <td className="p-1.5 border border-slate-900 text-center">{row.gender}</td>
                    <td className="p-1.5 border border-slate-900 text-center font-mono">{row.avgTugas}</td>
                    <td className="p-1.5 border border-slate-900 text-center font-mono">{row.avgHarian}</td>
                    <td className="p-1.5 border border-slate-900 text-center font-mono">{row.avgSumatif}</td>
                    <td className="p-1.5 border border-slate-900 text-center font-mono">{row.sts}</td>
                    <td className="p-1.5 border border-slate-900 text-center font-mono">{row.sas}</td>
                    <td className="p-1.5 border border-slate-900 text-center font-mono font-bold bg-slate-100">
                      {row.finalGrade}
                    </td>
                    <td className="p-1.5 border border-slate-900 text-center font-bold">{row.predikat}</td>
                    <td className="p-1.5 border border-slate-900 text-[10px]">{row.statusKetercapaian}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PrintDocumentModal>
    </div>
  );
};
