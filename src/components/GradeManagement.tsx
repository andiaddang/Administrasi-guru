import React, { useState, useMemo, useEffect } from 'react';
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
  Check,
  X,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  Award,
} from 'lucide-react';
import { PrintDocumentModal } from './PrintDocumentModal';

interface GradeManagementProps {
  students: Student[];
  classes: ClassRoom[];
  grades: GradeRecord[];
  onSaveBatchGrades: (newGrades: GradeRecord[]) => void;
  onUpdateSingleGrade?: (grade: GradeRecord) => void;
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
  onUpdateSingleGrade,
  onDeleteGrade,
  school,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'mass' | 'history'>('ledger');

  // Ledger configuration states
  const [ledgerClassId, setLedgerClassId] = useState<string>(classes[0]?.id || '');
  const [legerViewMode, setLegerViewMode] = useState<'matrix' | 'detailed' | 'summary'>('matrix');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printViewMode, setPrintViewMode] = useState<'matrix' | 'detailed' | 'summary'>('matrix');

  // Inline table editing state
  const [isInlineEditMode, setIsInlineEditMode] = useState<boolean>(false);
  const [editingCell, setEditingCell] = useState<{ studentId: string; assessmentKey: string } | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');

  // Edit modals state
  const [editingStudentGrades, setEditingStudentGrades] = useState<Student | null>(null);
  const [studentModalScores, setStudentModalScores] = useState<Record<string, number | ''>>({});
  const [studentModalNotes, setStudentModalNotes] = useState<Record<string, string>>({});

  const [editingRecord, setEditingRecord] = useState<GradeRecord | null>(null);
  const [editRecordForm, setEditRecordForm] = useState<{
    score: number | '';
    title: string;
    type: GradeType;
    date: string;
    notes: string;
  }>({
    score: '',
    title: '',
    type: 'Sumatif',
    date: '',
    notes: '',
  });

  // Success toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mass input states
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [subject, setSubject] = useState<string>(currentUser?.subject?.split('&')[0]?.trim() || 'Matematika');
  const [gradeType, setGradeType] = useState<GradeType>('Sumatif');
  const [assessmentTitle, setAssessmentTitle] = useState<string>('Sumatif Lingkup Materi 1');
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [massScores, setMassScores] = useState<Record<string, number | ''>>({});
  const [massNotes, setMassNotes] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedExistingSessionKey, setSelectedExistingSessionKey] = useState<string>('');

  // History state
  const [historySearch, setHistorySearch] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

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

  // Students in selected classes
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

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

    // Sort: Tugas -> Harian -> Sumatif -> STS -> SAS, then chronologically
    const typeOrder: Record<GradeType, number> = {
      Tugas: 1,
      Harian: 2,
      Sumatif: 3,
      STS: 4,
      SAS: 5,
    };

    return Array.from(map.values()).sort((a, b) => {
      const orderA = typeOrder[a.type] || 99;
      const orderB = typeOrder[b.type] || 99;
      if (orderA !== orderB) return orderA - orderB;
      if (a.date && b.date && a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.title.localeCompare(b.title);
    });
  }, [grades, ledgerClassId]);

  // Distinct assessment sessions for Mass Input class
  const massUniqueAssessments = useMemo<AssessmentColumn[]>(() => {
    const map = new Map<string, AssessmentColumn>();
    const classGrades = grades.filter((g) => g.classId === selectedClassId);

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

    return Array.from(map.values());
  }, [grades, selectedClassId]);

  // Filtered assessment columns by type if user chooses
  const displayedAssessments = useMemo(() => {
    if (ledgerTypeFilter === 'all') return uniqueAssessments;
    return uniqueAssessments.filter((a) => a.type === ledgerTypeFilter);
  }, [uniqueAssessments, ledgerTypeFilter]);

  // Comprehensive Detailed Ledger dataset containing individual assessment scores and component aggregates
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
        studentObj: student,
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

  // Prepopulate mass scores when editing or switching
  useEffect(() => {
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

  // Mass score change handler
  const handleScoreChange = (studentId: string, val: string) => {
    const num = val === '' ? '' : Math.min(100, Math.max(0, Number(val)));
    setMassScores((prev) => ({
      ...prev,
      [studentId]: num,
    }));
  };

  // Mass input save
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
    triggerToast(`Nilai asesmen "${assessmentTitle}" (${newRecords.length} siswa) berhasil disimpan!`);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Load existing session into Mass Input for re-editing
  const handleLoadExistingSession = (sessionKey: string) => {
    setSelectedExistingSessionKey(sessionKey);
    if (!sessionKey) return;
    const session = massUniqueAssessments.find((a) => a.key === sessionKey);
    if (session) {
      setGradeType(session.type);
      setAssessmentTitle(session.title);
      setAssessmentDate(session.date);
      setSubject(session.subject);
      triggerToast(`Data sesi "${session.title}" dimuat. Anda dapat mengubah nilai dan menyimpannya kembali.`);
    }
  };

  // Switch to mass input with a specific assessment preloaded
  const handleEditAssessmentSession = (col: AssessmentColumn) => {
    setSelectedClassId(ledgerClassId);
    setGradeType(col.type);
    setAssessmentTitle(col.title);
    setAssessmentDate(col.date);
    setSubject(col.subject);
    setActiveTab('mass');
    triggerToast(`Memuat asesmen "${col.title}" ke formulir pengeditan massal.`);
  };

  // INLINE EDITING LOGIC
  const handleStartInlineEdit = (studentId: string, col: AssessmentColumn, currentVal: number | null) => {
    setEditingCell({ studentId, assessmentKey: col.key });
    setCellEditValue(currentVal !== null && currentVal !== undefined ? String(currentVal) : '');
  };

  const handleSaveInlineScore = (
    studentId: string,
    col: AssessmentColumn,
    valueToSave: string
  ) => {
    if (valueToSave.trim() === '') {
      setEditingCell(null);
      return;
    }

    const numVal = Math.min(100, Math.max(0, Number(valueToSave)));
    if (isNaN(numVal)) {
      setEditingCell(null);
      return;
    }

    const existingGrade = grades.find(
      (g) =>
        g.studentId === studentId &&
        g.classId === ledgerClassId &&
        g.type === col.type &&
        (g.title || '').trim().toLowerCase() === col.title.trim().toLowerCase() &&
        (g.date || '').trim() === col.date.trim()
    );

    const studentObj = students.find((s) => s.id === studentId);

    if (existingGrade) {
      const updated: GradeRecord = {
        ...existingGrade,
        score: numVal,
      };
      if (onUpdateSingleGrade) {
        onUpdateSingleGrade(updated);
      } else {
        onSaveBatchGrades([updated]);
      }
    } else {
      const newGrade: GradeRecord = {
        id: `grd-${Date.now()}-${studentId}`,
        studentId,
        classId: ledgerClassId,
        subject: col.subject || currentUser?.subject?.split('&')[0]?.trim() || 'Matematika',
        type: col.type,
        title: col.title,
        score: numVal,
        maxScore: col.maxScore || 100,
        date: col.date || new Date().toISOString().slice(0, 10),
        semester: school.semester,
        notes: '',
      };
      if (onUpdateSingleGrade) {
        onUpdateSingleGrade(newGrade);
      } else {
        onSaveBatchGrades([newGrade]);
      }
    }

    setEditingCell(null);
    triggerToast(`Nilai ${studentObj?.name || 'siswa'} pada "${col.title}" diubah menjadi ${numVal}`);
  };

  // OPEN EDIT MODAL FOR A STUDENT'S ALL GRADES
  const handleOpenStudentGradesModal = (student: Student) => {
    setEditingStudentGrades(student);
    const scoreMap: Record<string, number | ''> = {};
    const notesMap: Record<string, string> = {};

    uniqueAssessments.forEach((col) => {
      const found = grades.find(
        (g) =>
          g.studentId === student.id &&
          g.classId === ledgerClassId &&
          g.type === col.type &&
          (g.title || '').trim().toLowerCase() === col.title.trim().toLowerCase() &&
          (g.date || '').trim() === col.date.trim()
      );
      if (found) {
        scoreMap[col.key] = found.score;
        notesMap[col.key] = found.notes || '';
      } else {
        scoreMap[col.key] = '';
        notesMap[col.key] = '';
      }
    });

    setStudentModalScores(scoreMap);
    setStudentModalNotes(notesMap);
  };

  // SAVE EDITED STUDENT GRADES
  const handleSaveStudentModalGrades = () => {
    if (!editingStudentGrades) return;

    const toSave: GradeRecord[] = [];
    uniqueAssessments.forEach((col) => {
      const val = studentModalScores[col.key];
      if (val !== '' && typeof val === 'number') {
        const existing = grades.find(
          (g) =>
            g.studentId === editingStudentGrades.id &&
            g.classId === ledgerClassId &&
            g.type === col.type &&
            (g.title || '').trim().toLowerCase() === col.title.trim().toLowerCase() &&
            (g.date || '').trim() === col.date.trim()
        );

        if (existing) {
          toSave.push({
            ...existing,
            score: val,
            notes: studentModalNotes[col.key] || existing.notes || '',
          });
        } else {
          toSave.push({
            id: `grd-${Date.now()}-${col.key}`,
            studentId: editingStudentGrades.id,
            classId: ledgerClassId,
            subject: col.subject,
            type: col.type,
            title: col.title,
            score: val,
            maxScore: col.maxScore || 100,
            date: col.date,
            semester: school.semester,
            notes: studentModalNotes[col.key] || '',
          });
        }
      }
    });

    if (toSave.length > 0) {
      onSaveBatchGrades(toSave);
      triggerToast(`Semua nilai untuk siswa ${editingStudentGrades.name} berhasil diperbarui.`);
    }

    setEditingStudentGrades(null);
  };

  // OPEN SINGLE RECORD EDIT (FROM RIWAYAT)
  const handleOpenEditRecordModal = (record: GradeRecord) => {
    setEditingRecord(record);
    setEditRecordForm({
      score: record.score,
      title: record.title,
      type: record.type,
      date: record.date,
      notes: record.notes || '',
    });
  };

  // SAVE SINGLE RECORD EDIT
  const handleSaveSingleRecordEdit = () => {
    if (!editingRecord) return;
    if (editRecordForm.score === '') {
      alert('Harap masukkan nilai siswa (0 - 100).');
      return;
    }

    const updated: GradeRecord = {
      ...editingRecord,
      score: Math.min(100, Math.max(0, Number(editRecordForm.score))),
      title: editRecordForm.title.trim() || editingRecord.title,
      type: editRecordForm.type,
      date: editRecordForm.date,
      notes: editRecordForm.notes.trim(),
    };

    if (onUpdateSingleGrade) {
      onUpdateSingleGrade(updated);
    } else {
      onSaveBatchGrades([updated]);
    }

    setEditingRecord(null);
    triggerToast(`Data penilaian "${updated.title}" berhasil diperbarui.`);
  };

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);
  const ledgerClassObj = classes.find((c) => c.id === ledgerClassId);

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 border border-slate-700 dark:border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Manajemen Penilaian & Rapor Siswa
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {grades.length} Nilai Tersimpan
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tabel matriks komponen penilaian lengkap (Tugas, Harian, Sumatif, STS, SAS), edit nilai interaktif, dan rekap leger resmi
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
            <span>Matriks & Leger Nilai</span>
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
            <span>Riwayat & Edit Nilai ({grades.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'ledger' ? (
        /* TAB 1: MATRIKS PENILAIAN LENGKAP SEMUA KOMPONEN DENGAN FITUR EDIT NILAI */
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
                  onChange={(e) => {
                    setLedgerClassId(e.target.value);
                    setEditingCell(null);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {c.name} ({students.filter((s) => s.classId === c.id).length} Siswa)
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle: Matrix (All components + details), Detailed, Summary */}
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setLegerViewMode('matrix')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    legerViewMode === 'matrix'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Menampilkan semua kolom asesmen individual (tanggal & judul) sekaligus rekap rerata per komponen nilai"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Matriks Lengkap & Komponen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLegerViewMode('detailed')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    legerViewMode === 'detailed'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Menampilkan rincian setiap asesmen dengan tanggal dan judul"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Rincian Asesmen Saja</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLegerViewMode('summary')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    legerViewMode === 'summary'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Menampilkan ringkasan rata-rata per komponen asesmen e-Rapor"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Ringkasan Komponen Rapor</span>
                </button>
              </div>
            </div>

            {/* Right side controls: Inline Edit Mode toggle, Filter, Print */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              {/* Toggle Inline Edit Mode */}
              <button
                type="button"
                onClick={() => {
                  setIsInlineEditMode(!isInlineEditMode);
                  if (isInlineEditMode) setEditingCell(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  isInlineEditMode
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                }`}
                title="Aktifkan untuk mengedit nilai langsung di dalam sel tabel"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isInlineEditMode ? 'Mode Edit Tabel: AKTIF' : 'Mode Edit Nilai Tabel'}</span>
              </button>

              {/* Filter Type in Detailed / Matrix Mode */}
              {legerViewMode !== 'summary' && uniqueAssessments.length > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={ledgerTypeFilter}
                    onChange={(e) => setLedgerTypeFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="all">Semua Komponen ({uniqueAssessments.length})</option>
                    <option value="Tugas">Tugas ({uniqueAssessments.filter((a) => a.type === 'Tugas').length})</option>
                    <option value="Harian">Formatif Harian ({uniqueAssessments.filter((a) => a.type === 'Harian').length})</option>
                    <option value="Sumatif">Sumatif Materi ({uniqueAssessments.filter((a) => a.type === 'Sumatif').length})</option>
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Leger</span>
              </button>
            </div>
          </div>

          {/* Quick Notice when Inline Edit is Active */}
          {isInlineEditMode && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 rounded-xl text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>Mode Edit Langsung Aktif:</strong> Klik pada angka nilai atau tanda strip (<span className="font-mono font-bold">-</span>) pada kolom asesmen untuk langsung mengetik dan mengedit nilai siswa. Tekan <strong>Enter</strong> atau klik tanda centang untuk menyimpan.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsInlineEditMode(false);
                  setEditingCell(null);
                }}
                className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[11px] rounded-lg hover:bg-emerald-700 transition-colors shrink-0 cursor-pointer"
              >
                Selesai Mengedit
              </button>
            </div>
          )}

          {/* ASSESSMENT SESSIONS SUMMARY STRIP (WITH QUICK EDIT BUTTON PER ASSESSMENT) */}
          {uniqueAssessments.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    Daftar {uniqueAssessments.length} Komponen Asesmen Terinput di Kelas {ledgerClassObj?.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    (Klik tombol pensil pada kartu untuk mengedit nilai 1 sesi asesmen sekaligus)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    Tugas: {uniqueAssessments.filter((a) => a.type === 'Tugas').length}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Harian: {uniqueAssessments.filter((a) => a.type === 'Harian').length}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Sumatif: {uniqueAssessments.filter((a) => a.type === 'Sumatif').length}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    STS: {uniqueAssessments.filter((a) => a.type === 'STS').length}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    SAS: {uniqueAssessments.filter((a) => a.type === 'SAS').length}
                  </span>
                </div>
              </div>

              {/* Horizontal Scrollable Assessment Cards with Edit Action */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 text-xs">
                {uniqueAssessments.map((item, idx) => {
                  const stat = colStats[item.key];
                  const isFiltered = ledgerTypeFilter !== 'all' && item.type !== ledgerTypeFilter;
                  return (
                    <div
                      key={idx}
                      className={`min-w-[210px] max-w-[250px] p-2.5 rounded-xl border transition-all relative group ${
                        isFiltered
                          ? 'opacity-40 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeBadgeStyle(item.type)}`}>
                          {item.type}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDateId(item.date)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEditAssessmentSession(item)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors cursor-pointer"
                            title="Edit nilai seluruh siswa untuk asesmen ini"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white truncate text-xs" title={item.title}>
                        {item.title}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span>Rerata ({stat?.count || 0} Siswa):</span>
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
                Silakan beralih ke tab <strong>Input Nilai Massal</strong> untuk mulai memasukkan nilai tugas, formatif harian, sumatif, STS, atau SAS.
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

          {/* MAIN MATRIKS & LEGER TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
            {/* Table Header Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {legerViewMode === 'matrix'
                    ? '📊 Tabel Matriks Penilaian Lengkap & Komponen'
                    : legerViewMode === 'detailed'
                    ? '📈 Rincian Asesmen Per Tanggal & Judul'
                    : '📋 Buku Leger Nilai Kompilasi Rapor'} · Kelas {ledgerClassObj?.name}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tahun Ajaran {school.academicYear} · Semester {school.semester} · {currentUser?.subject || 'Mata Pelajaran'} · Kurikulum Merdeka
                </p>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <span>Wali Kelas: <strong className="text-slate-900 dark:text-white">{ledgerClassObj?.homeroomTeacher}</strong></span>
                <span>•</span>
                <span>Jumlah: <strong className="text-slate-900 dark:text-white">{ledgerStudents.length} Siswa</strong></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                {/* TABLE HEAD */}
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-800">
                  {/* TWO TIER HEADER FOR MATRIX MODE */}
                  {legerViewMode === 'matrix' ? (
                    <>
                      {/* TOP TIER: Group Categorization */}
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-center">
                        <th colSpan={4} className="p-2 bg-slate-100/70 dark:bg-slate-800 text-left pl-3 text-slate-600 dark:text-slate-300 font-bold sticky left-0 z-20">
                          Identitas Siswa
                        </th>

                        {/* Individual Assessments Group */}
                        {displayedAssessments.length > 0 && (
                          <th
                            colSpan={displayedAssessments.length}
                            className="p-2 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold border-l border-r border-indigo-200 dark:border-indigo-900"
                          >
                            Rincian Seluruh Asesmen Terinput ({displayedAssessments.length} Asesmen) · Klik Angka Nilai Untuk Mengedit
                          </th>
                        )}

                        {/* Summary Components Group */}
                        <th
                          colSpan={5}
                          className="p-2 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold border-r border-emerald-200 dark:border-emerald-900"
                        >
                          Rerata Komponen Penilaian (e-Rapor)
                        </th>

                        {/* Final Outcomes */}
                        <th colSpan={3} className="p-2 bg-purple-50/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-bold border-r border-purple-200 dark:border-purple-900">
                          Hasil Akhir
                        </th>

                        {/* Action Column */}
                        <th className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                          Aksi
                        </th>
                      </tr>

                      {/* SECOND TIER: Specific Columns */}
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="p-3 w-10 text-center sticky left-0 z-10 bg-slate-50 dark:bg-slate-800">No</th>
                        <th className="p-3 w-36 sticky left-10 z-10 bg-slate-50 dark:bg-slate-800">NISN / NIS</th>
                        <th className="p-3 min-w-[170px] sticky left-46 z-10 bg-slate-50 dark:bg-slate-800">Nama Lengkap Siswa</th>
                        <th className="p-3 text-center w-12">L/P</th>

                        {/* Dynamic Columns for each Unique Assessment */}
                        {displayedAssessments.map((col) => (
                          <th
                            key={col.key}
                            className="p-2.5 text-center min-w-[145px] border-l border-slate-200 dark:border-slate-700/80 bg-slate-100/60 dark:bg-slate-800/90"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getTypeBadgeStyle(col.type)}`}>
                                {col.type}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2 max-w-[150px] text-center" title={col.title}>
                                {col.title}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300 font-mono font-normal">
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                {formatDateId(col.date)}
                              </span>
                            </div>
                          </th>
                        ))}

                        {/* Component Averages */}
                        <th className="p-2.5 text-center min-w-[80px] border-l border-slate-200 dark:border-slate-700 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold">
                          Rata Tugas
                        </th>
                        <th className="p-2.5 text-center min-w-[80px] bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold">
                          Rata Harian
                        </th>
                        <th className="p-2.5 text-center min-w-[80px] bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold">
                          Rata Sumatif
                        </th>
                        <th className="p-2.5 text-center min-w-[70px] bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold">
                          STS
                        </th>
                        <th className="p-2.5 text-center min-w-[70px] bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold">
                          SAS
                        </th>

                        {/* Outcomes */}
                        <th className="p-2.5 text-center min-w-[85px] border-l border-slate-200 dark:border-slate-700 bg-purple-50/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-extrabold">
                          Nilai Akhir
                        </th>
                        <th className="p-2.5 text-center min-w-[65px] bg-purple-50/40 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 font-bold">
                          Predikat
                        </th>
                        <th className="p-2.5 min-w-[170px] bg-purple-50/20 dark:bg-purple-950/20 text-slate-800 dark:text-slate-200 font-bold">
                          Capaian TP
                        </th>

                        {/* Action Header */}
                        <th className="p-2.5 text-center w-24 border-l border-slate-200 dark:border-slate-700">
                          Aksi
                        </th>
                      </tr>
                    </>
                  ) : legerViewMode === 'detailed' ? (
                    /* DETAILED ONLY HEADER */
                    <tr>
                      <th className="p-3 w-10 text-center sticky left-0 z-10 bg-slate-50 dark:bg-slate-800">No</th>
                      <th className="p-3 w-36 sticky left-10 z-10 bg-slate-50 dark:bg-slate-800">NISN / NIS</th>
                      <th className="p-3 min-w-[180px] sticky left-46 z-10 bg-slate-50 dark:bg-slate-800">Nama Siswa</th>
                      <th className="p-3 text-center w-12">L/P</th>

                      {displayedAssessments.map((col) => (
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
                      ))}

                      <th className="p-3 text-center min-w-[90px] border-l border-slate-200 dark:border-slate-700 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold">
                        Nilai Akhir
                      </th>
                      <th className="p-3 text-center min-w-[70px] bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-bold">
                        Predikat
                      </th>
                      <th className="p-3 min-w-[180px] bg-indigo-50/20 dark:bg-indigo-950/20 text-slate-800 dark:text-slate-200 font-bold">
                        Capaian TP
                      </th>
                      <th className="p-3 text-center w-24">Aksi</th>
                    </tr>
                  ) : (
                    /* SUMMARY ONLY HEADER */
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
                      <th className="p-3 text-center w-24">Aksi</th>
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
                        <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400 sticky left-0 bg-white dark:bg-slate-900 z-10">
                          {row.no}
                        </td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-200 font-medium sticky left-10 bg-white dark:bg-slate-900 z-10">
                          {row.nisnNis}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white sticky left-46 bg-white dark:bg-slate-900 z-10">
                          {row.name}
                        </td>
                        <td className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                          {row.gender}
                        </td>

                        {/* MATRIX & DETAILED ASSESSMENT CELLS WITH INTERACTIVE EDITING */}
                        {legerViewMode !== 'summary' &&
                          displayedAssessments.map((col) => {
                            const scoreVal = row.scoresMap[col.key];
                            const isThisCellEditing =
                              editingCell?.studentId === row.id && editingCell?.assessmentKey === col.key;

                            return (
                              <td
                                key={col.key}
                                className="p-2 text-center font-mono border-l border-slate-100 dark:border-slate-800 relative group"
                              >
                                {isThisCellEditing ? (
                                  /* INLINE CELL INPUT */
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      autoFocus
                                      value={cellEditValue}
                                      onChange={(e) => setCellEditValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveInlineScore(row.id, col, cellEditValue);
                                        } else if (e.key === 'Escape') {
                                          setEditingCell(null);
                                        }
                                      }}
                                      className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded-md focus:outline-none text-slate-900 dark:text-white shadow-sm"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveInlineScore(row.id, col, cellEditValue)}
                                      className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                                      title="Simpan (Enter)"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingCell(null)}
                                      className="p-1 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-400 cursor-pointer"
                                      title="Batal (Esc)"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  /* STATIC CELL WITH CLICK TO EDIT */
                                  <div
                                    onClick={() => handleStartInlineEdit(row.id, col, scoreVal)}
                                    className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-xs transition-all cursor-pointer select-none ${
                                      isInlineEditMode
                                        ? 'ring-1 ring-dashed ring-indigo-400 dark:ring-indigo-600 hover:ring-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60'
                                        : 'hover:ring-1 hover:ring-indigo-300 dark:hover:ring-indigo-700'
                                    }`}
                                    title="Klik untuk mengedit nilai siswa ini"
                                  >
                                    {scoreVal !== null && scoreVal !== undefined ? (
                                      <span
                                        className={`font-bold inline-block px-1.5 py-0.5 rounded text-xs ${
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
                                      <span className="text-slate-300 dark:text-slate-600 font-normal px-2">
                                        -
                                      </span>
                                    )}
                                    {/* Small hover pencil icon */}
                                    <Edit2 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                )}
                              </td>
                            );
                          })}

                        {/* COMPONENT SUMMARY COLUMNS (IN MATRIX OR SUMMARY MODE) */}
                        {legerViewMode !== 'detailed' && (
                          <>
                            <td className="p-3 text-center font-mono font-medium border-l border-slate-100 dark:border-slate-800 bg-emerald-50/20 dark:bg-emerald-950/10">
                              {row.avgTugas}
                            </td>
                            <td className="p-3 text-center font-mono font-medium bg-emerald-50/20 dark:bg-emerald-950/10">
                              {row.avgHarian}
                            </td>
                            <td className="p-3 text-center font-mono font-medium bg-emerald-50/20 dark:bg-emerald-950/10">
                              {row.avgSumatif}
                            </td>
                            <td className="p-3 text-center font-mono font-medium bg-emerald-50/20 dark:bg-emerald-950/10">
                              {row.sts}
                            </td>
                            <td className="p-3 text-center font-mono font-medium bg-emerald-50/20 dark:bg-emerald-950/10">
                              {row.sas}
                            </td>
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

                        {/* ACTIONS COLUMN (EDIT ALL GRADES FOR THIS STUDENT) */}
                        <td className="p-2 text-center border-l border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => handleOpenStudentGradesModal(row.studentObj)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                            title="Edit semua nilai siswa ini dalam satu jendela modal"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit Nilai</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={20} className="p-8 text-center text-slate-400">
                        Tidak ada data siswa pada kelas ini.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* TABLE FOOTER (RERATA KELAS & STATISTIK KOMPONEN) */}
                {detailedLedgerData.length > 0 && (
                  <tfoot className="bg-slate-100/80 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100">
                    {/* Baris Rata-rata Kelas */}
                    <tr>
                      <td colSpan={4} className="p-3 text-right font-bold tracking-wide">
                        Rata-Rata Nilai Kelas:
                      </td>

                      {/* Rata-rata Per Asesmen */}
                      {legerViewMode !== 'summary' &&
                        displayedAssessments.map((col) => {
                          const stat = colStats[col.key];
                          return (
                            <td key={col.key} className="p-3 text-center font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300 border-l border-slate-200 dark:border-slate-700">
                              {stat?.avg !== null ? stat.avg : '-'}
                            </td>
                          );
                        })}

                      {/* Rata-rata Per Komponen Rapor */}
                      {legerViewMode !== 'detailed' && (
                        <>
                          <td className="p-3 text-center font-mono font-bold text-xs border-l border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-300">
                            {(() => {
                              const vals = detailedLedgerData.map((d) => d.avgTugas).filter((v): v is number => typeof v === 'number');
                              return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                            })()}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-xs text-emerald-700 dark:text-emerald-300">
                            {(() => {
                              const vals = detailedLedgerData.map((d) => d.avgHarian).filter((v): v is number => typeof v === 'number');
                              return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                            })()}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-xs text-emerald-700 dark:text-emerald-300">
                            {(() => {
                              const vals = detailedLedgerData.map((d) => d.avgSumatif).filter((v): v is number => typeof v === 'number');
                              return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                            })()}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-xs text-emerald-700 dark:text-emerald-300">
                            {(() => {
                              const vals = detailedLedgerData.map((d) => d.sts).filter((v): v is number => typeof v === 'number');
                              return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                            })()}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-xs text-emerald-700 dark:text-emerald-300">
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
                      <td colSpan={3} className="p-3 text-xs text-slate-500 dark:text-slate-400">
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
        /* TAB 2: INPUT & RE-EDIT NILAI MASSAL */
        <div className="space-y-4">
          {/* Controls Form Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs transition-colors">
            {/* Quick Picker: Muat Nilai Asesmen Yang Sudah Ada Untuk Diedit */}
            {massUniqueAssessments.length > 0 && (
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/50 rounded-xl border border-indigo-200 dark:border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <div>
                    <span className="font-bold text-indigo-900 dark:text-indigo-200">
                      Edit Asesmen Yang Telah Terinput Sebelumnya:
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Pilih sesi penilaian di bawah untuk memuat nilai seluruh siswa dan mengeditnya kembali
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedExistingSessionKey}
                    onChange={(e) => handleLoadExistingSession(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[220px]"
                  >
                    <option value="">-- Pilih Asesmen Yang Ingin Diedit --</option>
                    {massUniqueAssessments.map((a) => (
                      <option key={a.key} value={a.key}>
                        [{a.type}] {a.title} ({formatDateId(a.date)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Rombel / Kelas
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSelectedExistingSessionKey('');
                  }}
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
                  Komponen Asesmen
                </label>
                <select
                  value={gradeType}
                  onChange={(e) => setGradeType(e.target.value as GradeType)}
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Tugas" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tugas Mandiri / Kelompok</option>
                  <option value="Harian" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Formatif / Ulangan Harian</option>
                  <option value="Sumatif" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Sumatif Lingkup Materi (TP)</option>
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
              <span>Nilai asesmen &quot;{assessmentTitle}&quot; tanggal {assessmentDate} berhasil disimpan! Data langsung terbarui di Matriks Penilaian.</span>
            </div>
          )}

          {/* Student list for mass grading */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-100">
                Formulir Pengisian & Edit Nilai Kelas {selectedClassObj?.name}
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
        /* TAB 3: RIWAYAT & EDIT PENILAIAN INDIVIDUAL */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Cari judul penilaian, nama siswa, atau mata pelajaran..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Total {grades.length} entri penilaian tersimpan dalam sistem
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5">Kelas</th>
                    <th className="p-3.5">Mata Pelajaran</th>
                    <th className="p-3.5">Komponen</th>
                    <th className="p-3.5">Judul Asesmen / Materi</th>
                    <th className="p-3.5">Nama Siswa</th>
                    <th className="p-3.5 text-center">Nilai</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {grades.length > 0 ? (
                    grades
                      .filter((g) => {
                        const student = students.find((s) => s.id === g.studentId);
                        const q = historySearch.toLowerCase();
                        return (
                          g.title.toLowerCase().includes(q) ||
                          g.subject.toLowerCase().includes(q) ||
                          (student?.name && student.name.toLowerCase().includes(q))
                        );
                      })
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
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditRecordModal(g)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md transition-colors cursor-pointer"
                                  title="Edit Nilai & Detail"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Hapus entri nilai ${student?.name} (${g.title})?`)) {
                                      onDeleteGrade(g.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                                  title="Hapus Nilai"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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

      {/* MODAL 1: EDIT SEMUA NILAI SISWA */}
      {editingStudentGrades && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Edit Nilai Siswa: {editingStudentGrades.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  NISN/NIS: {editingStudentGrades.nisnNis || '-'} · Kelas {ledgerClassObj?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudentGrades(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: List of all assessments */}
            <div className="p-4 overflow-y-auto space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
              {uniqueAssessments.length > 0 ? (
                uniqueAssessments.map((col) => {
                  const val = studentModalScores[col.key];
                  return (
                    <div key={col.key} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeBadgeStyle(col.type)}`}>
                            {col.type}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {formatDateId(col.date)}
                          </span>
                        </div>
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-100">
                          {col.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <label className="text-[11px] font-semibold text-slate-500">Nilai:</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={val}
                            onChange={(e) => {
                              const num = e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value)));
                              setStudentModalScores((prev) => ({
                                ...prev,
                                [col.key]: num,
                              }));
                            }}
                            placeholder="0-100"
                            className="w-20 px-2.5 py-1 text-center font-mono font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs text-slate-400 py-6">
                  Belum ada asesmen yang dibuat untuk kelas ini.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Nilai yang kosong tidak akan tersimpan.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudentGrades(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveStudentModalGrades}
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SINGLE GRADE RECORD (FROM RIWAYAT) */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Edit Data Penilaian Siswa
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {students.find((s) => s.id === editingRecord.studentId)?.name || 'Siswa'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Skor Nilai (0 - 100) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editRecordForm.score}
                  onChange={(e) =>
                    setEditRecordForm((prev) => ({
                      ...prev,
                      score: e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value))),
                    }))
                  }
                  className="w-full px-3 py-2 font-mono font-bold text-base bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Judul Penilaian / Materi
                </label>
                <input
                  type="text"
                  value={editRecordForm.title}
                  onChange={(e) =>
                    setEditRecordForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Jenis Asesmen
                  </label>
                  <select
                    value={editRecordForm.type}
                    onChange={(e) =>
                      setEditRecordForm((prev) => ({
                        ...prev,
                        type: e.target.value as GradeType,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="Tugas">Tugas</option>
                    <option value="Harian">Harian</option>
                    <option value="Sumatif">Sumatif</option>
                    <option value="STS">STS</option>
                    <option value="SAS">SAS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={editRecordForm.date}
                    onChange={(e) =>
                      setEditRecordForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Catatan Khusus (Opsional)
                </label>
                <input
                  type="text"
                  value={editRecordForm.notes}
                  onChange={(e) =>
                    setEditRecordForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Catatan kemajuan atau remedial..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSingleRecordEdit}
                className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT DOKUMEN LEGER NILAI / RAPOR MODAL */}
      <PrintDocumentModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={
          printViewMode === 'matrix'
            ? 'LEGER MATRIKS RINCIAN & KOMPONEN HASIL PENILAIAN'
            : printViewMode === 'detailed'
            ? 'LEGER RINCIAN HASIL PENILAIAN LENGKAP'
            : 'LEGER HASIL PENILAIAN CAPAIAN KOMPETENSI'
        }
        subtitle={`Tahun Pelajaran ${school.academicYear} · Semester ${school.semester} · ${
          printViewMode === 'matrix'
            ? 'Matriks Lengkap Komponen Penilaian (Tugas, Harian, Sumatif, STS, SAS)'
            : printViewMode === 'detailed'
            ? 'Matriks Rincian Judul & Tanggal Asesmen'
            : 'Kompilasi Rata-rata Kategori'
        }`}
        school={school}
        currentUser={currentUser}
        metaInfo={[
          { label: 'Kelas / Rombel', value: ledgerClassObj?.name || '-' },
          { label: 'Wali Kelas', value: ledgerClassObj?.homeroomTeacher || '-' },
          { label: 'Mata Pelajaran', value: currentUser?.subject || 'Matematika' },
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
                onClick={() => setPrintViewMode('matrix')}
                className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                  printViewMode === 'matrix'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                Matriks Lengkap (Semua Komponen)
              </button>
              <button
                type="button"
                onClick={() => setPrintViewMode('detailed')}
                className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                  printViewMode === 'detailed'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                Rincian Asesmen Saja
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

          {printViewMode === 'matrix' && uniqueAssessments.length > 0 ? (
            /* PRINT TABEL MATRIKS LENGKAP SEMUA KOMPONEN */
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border border-slate-900 border-collapse print:border-black">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 font-bold border-b border-slate-900 text-center">
                    <th colSpan={4} className="p-1 border border-slate-900 text-left pl-2">Data Siswa</th>
                    <th colSpan={uniqueAssessments.length} className="p-1 border border-slate-900">Rincian Asesmen (Tanggal & Judul)</th>
                    <th colSpan={5} className="p-1 border border-slate-900">Rerata Komponen</th>
                    <th colSpan={3} className="p-1 border border-slate-900">Hasil Akhir</th>
                  </tr>
                  <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                    <th className="p-1 border border-slate-900 text-center w-6">No</th>
                    <th className="p-1 border border-slate-900 text-center w-24">NISN / NIS</th>
                    <th className="p-1 border border-slate-900 text-left min-w-[110px]">Nama Siswa</th>
                    <th className="p-1 border border-slate-900 text-center w-6">L/P</th>

                    {/* Columns for each assessment */}
                    {uniqueAssessments.map((col) => (
                      <th key={col.key} className="p-1 border border-slate-900 text-center min-w-[60px]">
                        <div className="text-[8px] uppercase font-bold text-slate-700">{col.type}</div>
                        <div className="font-bold text-[9px] leading-tight truncate max-w-[80px]" title={col.title}>{col.title}</div>
                        <div className="font-normal font-mono text-[8px] text-slate-600">{formatDateId(col.date)}</div>
                      </th>
                    ))}

                    {/* Component Averages */}
                    <th className="p-1 border border-slate-900 text-center w-10">Tugas</th>
                    <th className="p-1 border border-slate-900 text-center w-10">Harian</th>
                    <th className="p-1 border border-slate-900 text-center w-10">Sumatif</th>
                    <th className="p-1 border border-slate-900 text-center w-10">STS</th>
                    <th className="p-1 border border-slate-900 text-center w-10">SAS</th>

                    <th className="p-1 border border-slate-900 text-center w-10 font-extrabold bg-slate-200">NA</th>
                    <th className="p-1 border border-slate-900 text-center w-7">Pred.</th>
                    <th className="p-1 border border-slate-900 text-left min-w-[90px]">Capaian TP</th>
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

                      {/* Component Averages */}
                      <td className="p-1 border border-slate-900 text-center font-mono">{row.avgTugas}</td>
                      <td className="p-1 border border-slate-900 text-center font-mono">{row.avgHarian}</td>
                      <td className="p-1 border border-slate-900 text-center font-mono">{row.avgSumatif}</td>
                      <td className="p-1 border border-slate-900 text-center font-mono">{row.sts}</td>
                      <td className="p-1 border border-slate-900 text-center font-mono">{row.sas}</td>

                      <td className="p-1 border border-slate-900 text-center font-mono font-bold bg-slate-100">
                        {row.finalGrade}
                      </td>
                      <td className="p-1 border border-slate-900 text-center font-bold">{row.predikat}</td>
                      <td className="p-1 border border-slate-900 text-[9px] leading-tight">{row.statusKetercapaian}</td>
                    </tr>
                  ))}
                  {/* Footer Rata-rata */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                    <td colSpan={4} className="p-1 border border-slate-900 text-right">Rerata Kelas:</td>
                    {uniqueAssessments.map((col) => {
                      const stat = colStats[col.key];
                      return (
                        <td key={col.key} className="p-1 border border-slate-900 text-center font-mono">
                          {stat?.avg !== null ? stat.avg : '-'}
                        </td>
                      );
                    })}
                    <td className="p-1 border border-slate-900 text-center font-mono">
                      {(() => {
                        const vals = detailedLedgerData.map((d) => d.avgTugas).filter((v): v is number => typeof v === 'number');
                        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                      })()}
                    </td>
                    <td className="p-1 border border-slate-900 text-center font-mono">
                      {(() => {
                        const vals = detailedLedgerData.map((d) => d.avgHarian).filter((v): v is number => typeof v === 'number');
                        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                      })()}
                    </td>
                    <td className="p-1 border border-slate-900 text-center font-mono">
                      {(() => {
                        const vals = detailedLedgerData.map((d) => d.avgSumatif).filter((v): v is number => typeof v === 'number');
                        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                      })()}
                    </td>
                    <td className="p-1 border border-slate-900 text-center font-mono">
                      {(() => {
                        const vals = detailedLedgerData.map((d) => d.sts).filter((v): v is number => typeof v === 'number');
                        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                      })()}
                    </td>
                    <td className="p-1 border border-slate-900 text-center font-mono">
                      {(() => {
                        const vals = detailedLedgerData.map((d) => d.sas).filter((v): v is number => typeof v === 'number');
                        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '-';
                      })()}
                    </td>
                    <td className="p-1 border border-slate-900 text-center font-mono font-extrabold">
                      {(() => {
                        const finals = detailedLedgerData.map((d) => d.finalGrade).filter((v): v is number => typeof v === 'number');
                        return finals.length ? Math.round(finals.reduce((a, b) => a + b, 0) / finals.length) : '-';
                      })()}
                    </td>
                    <td colSpan={2} className="p-1 border border-slate-900 text-center text-[9px]">
                      {ledgerStudents.length} Siswa
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : printViewMode === 'detailed' && uniqueAssessments.length > 0 ? (
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
