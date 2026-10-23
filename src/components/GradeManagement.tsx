import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Student,
  ClassRoom,
  GradeRecord,
  GradeType,
  SchoolProfile,
  User,
} from '../types';
import {
  Table,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award,
  Users,
  Check,
  X,
  FileSpreadsheet,
  Clock,
  Printer,
  BarChart3,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react';
import { PrintDocumentModal } from './PrintDocumentModal';
import { GradeTrendAnalytics } from './GradeTrendAnalytics';

export interface AssessmentColumn {
  key: string;
  type: GradeType;
  title: string;
  date: string;
  maxScore: number;
  subject: string;
  isPaten?: boolean;
}

export const createDefaultClassColumns = (classId: string, subject: string, date: string): AssessmentColumn[] => [
  // Kolom 1: Tugas (3 sub-kolom bawaan)
  {
    key: `subcol__${classId}__Tugas__1__${date}`,
    type: 'Tugas',
    title: 'Tugas 1: Mandiri / Kelompok',
    date,
    maxScore: 100,
    subject,
  },
  {
    key: `subcol__${classId}__Tugas__2__${date}`,
    type: 'Tugas',
    title: 'Tugas 2: Pendalaman Materi',
    date,
    maxScore: 100,
    subject,
  },
  {
    key: `subcol__${classId}__Tugas__3__${date}`,
    type: 'Tugas',
    title: 'Tugas 3: Proyek / Portofolio',
    date,
    maxScore: 100,
    subject,
  },
  // Kolom 3: Formatif / Ulangan (2 sub-kolom bawaan)
  {
    key: `subcol__${classId}__Harian__1__${date}`,
    type: 'Harian',
    title: 'Formatif 1: Ulangan Harian Bab 1',
    date,
    maxScore: 100,
    subject,
  },
  {
    key: `subcol__${classId}__Harian__2__${date}`,
    type: 'Harian',
    title: 'Formatif 2: Ulangan Harian Bab 2',
    date,
    maxScore: 100,
    subject,
  },
  // Sumatif Lingkup Materi TP (1 sub-kolom bawaan)
  {
    key: `subcol__${classId}__Sumatif__1__${date}`,
    type: 'Sumatif',
    title: 'Sumatif TP 1: Capaian Pembelajaran',
    date,
    maxScore: 100,
    subject,
  },
  // Sumatif Tengah Semester STS (1 kolom bawaan)
  {
    key: `subcol__${classId}__STS__1__${date}`,
    type: 'STS',
    title: 'Sumatif Tengah Semester (STS)',
    date,
    maxScore: 100,
    subject,
  },
  // Sumatif Akhir Semester SAS (1 kolom bawaan)
  {
    key: `subcol__${classId}__SAS__1__${date}`,
    type: 'SAS',
    title: 'Sumatif Akhir Semester (SAS)',
    date,
    maxScore: 100,
    subject,
  },
];

const STORAGE_COLUMNS_KEY = 'sman1_gowa_assessment_subcolumns_v3';

const getStoredColumnsByClass = (): Record<string, AssessmentColumn[]> => {
  try {
    const raw = localStorage.getItem(STORAGE_COLUMNS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading stored columns', e);
  }
  return {};
};

const saveStoredColumnsByClass = (map: Record<string, AssessmentColumn[]>) => {
  try {
    localStorage.setItem(STORAGE_COLUMNS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving stored columns', e);
  }
};

export const GRADE_TYPE_LABELS: Record<GradeType, string> = {
  Tugas: 'Tugas Mandiri / Kelompok',
  Harian: 'Formatif / Ulangan Harian',
  Sumatif: 'Sumatif Lingkup Materi (TP)',
  STS: 'Sumatif Tengah Semester (STS)',
  SAS: 'Sumatif Akhir Semester (SAS)',
};

export const GRADE_TYPE_SHORT: Record<GradeType, string> = {
  Tugas: 'Tugas',
  Harian: 'Formatif',
  Sumatif: 'Sumatif TP',
  STS: 'STS',
  SAS: 'SAS',
};

const DEFAULT_WEIGHTS: Record<GradeType, number> = {
  Tugas: 20,
  Harian: 20,
  Sumatif: 25,
  STS: 15,
  SAS: 20,
};

interface GradeManagementProps {
  students: Student[];
  classes: ClassRoom[];
  grades: GradeRecord[];
  onSaveBatchGrades: (newGrades: GradeRecord[]) => void;
  onUpdateSingleGrade?: (grade: GradeRecord) => void;
  onDeleteGrade: (id: string) => void;
  onDeleteBatchGrades?: (ids: string[]) => void;
  school: SchoolProfile;
  currentUser: User | null;
}

export const GradeManagement: React.FC<GradeManagementProps> = ({
  students,
  classes,
  grades,
  onSaveBatchGrades,
  onDeleteGrade,
  onDeleteBatchGrades,
  school,
  currentUser,
}) => {
  // 1. FILTER SEBELUM INPUT
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');

  // Siswa & Kelas Terpilih
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  const filteredStudents = useMemo(() => {
    const q = searchStudent.toLowerCase().trim();
    if (!q) return classStudents;
    return classStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nisnNis && s.nisnNis.toLowerCase().includes(q)) ||
        (s.nisn && s.nisn.toLowerCase().includes(q)) ||
        (s.nis && s.nis.toLowerCase().includes(q))
    );
  }, [classStudents, searchStudent]);

  // State Nilai Tabel: [studentId][colKey] = number | ''
  const [tableScores, setTableScores] = useState<Record<string, Record<string, number | ''>>>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal & UI States
  const [showTrendChart, setShowTrendChart] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // State Modal Tambah Sub-Kolom
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState<boolean>(false);
  const [newColType, setNewColType] = useState<GradeType>('Tugas');
  const [newColTitle, setNewColTitle] = useState<string>('');
  const [newColDate, setNewColDate] = useState<string>('');

  // State Modal Edit Sub-Kolom (Deskripsi & Tanggal)
  const [isEditColumnModalOpen, setIsEditColumnModalOpen] = useState<boolean>(false);
  const [columnToEdit, setColumnToEdit] = useState<AssessmentColumn | null>(null);
  const [editColTitle, setEditColTitle] = useState<string>('');
  const [editColDate, setEditColDate] = useState<string>('');

  // Mata Pelajaran Pengampu
  const defaultSubject = currentUser?.subject?.split('&')[0]?.trim() || 'Matematika';
  const [selectedSubject] = useState<string>(defaultSubject);

  // 2. BOBOT KOMPONEN PENILAIAN (HARUS 100%)
  const [weights, setWeights] = useState<Record<GradeType, number>>(DEFAULT_WEIGHTS);
  const [isWeightSettingsOpen, setIsWeightSettingsOpen] = useState<boolean>(false);

  // 3. STRUKTUR SUB-KOLOM PENILAIAN PER KELAS
  const [classColumnsMap, setClassColumnsMap] = useState<Record<string, AssessmentColumn[]>>(getStoredColumnsByClass);

  // Sub-kolom aktif untuk kelas terpilih (default: 3 Tugas, 2 Formatif, 1 Sumatif TP, 1 STS, 1 SAS)
  const currentClassColumns = useMemo<AssessmentColumn[]>(() => {
    const existing = classColumnsMap[selectedClassId];
    if (existing && existing.length > 0) {
      return existing;
    }
    const today = new Date().toISOString().slice(0, 10);
    return createDefaultClassColumns(selectedClassId, selectedSubject, today);
  }, [classColumnsMap, selectedClassId, selectedSubject]);

  const updateClassColumns = (newCols: AssessmentColumn[]) => {
    setClassColumnsMap((prev) => {
      const next = { ...prev, [selectedClassId]: newCols };
      saveStoredColumnsByClass(next);
      return next;
    });
  };

  const typeOrder: Record<GradeType, number> = {
    Tugas: 1,
    Harian: 2,
    Sumatif: 3,
    STS: 4,
    SAS: 5,
  };

  // Sub-kolom terpisah berdasarkan 5 pilar komponen penilaian:
  // Kolom 1: Tugas (default 3 sub-kolom)
  const tugasCols = useMemo(() => {
    return currentClassColumns.filter((c) => c.type === 'Tugas');
  }, [currentClassColumns]);

  // Kolom 3: Formatif / Ulangan (default 2 sub-kolom)
  const formatifCols = useMemo(() => {
    return currentClassColumns.filter((c) => c.type === 'Harian');
  }, [currentClassColumns]);

  // Sumatif Lingkup Materi TP (default 1 sub-kolom)
  const sumatifCols = useMemo(() => {
    return currentClassColumns.filter((c) => c.type === 'Sumatif');
  }, [currentClassColumns]);

  // Sumatif Tengah Semester STS (default 1 kolom)
  const stsCols = useMemo(() => {
    return currentClassColumns.filter((c) => c.type === 'STS');
  }, [currentClassColumns]);

  // Sumatif Akhir Semester SAS (default 1 kolom)
  const sasCols = useMemo(() => {
    return currentClassColumns.filter((c) => c.type === 'SAS');
  }, [currentClassColumns]);

  // Seluruh sub-kolom aktif berurutan
  const allColumns = useMemo<AssessmentColumn[]>(() => {
    return [...tugasCols, ...formatifCols, ...sumatifCols, ...stsCols, ...sasCols];
  }, [tugasCols, formatifCols, sumatifCols, stsCols, sasCols]);

  // Inisialisasi Nilai ke State Lokal
  useEffect(() => {
    const initialMap: Record<string, Record<string, number | ''>> = {};

    classStudents.forEach((student) => {
      initialMap[student.id] = {};
      allColumns.forEach((col) => {
        const matchingRecord = grades.find(
          (g) =>
            g.classId === selectedClassId &&
            g.studentId === student.id &&
            g.type === col.type &&
            (g.title || '').trim().toLowerCase() === col.title.trim().toLowerCase() &&
            (g.date || '').trim() === col.date.trim()
        );
        initialMap[student.id][col.key] =
          matchingRecord && typeof matchingRecord.score === 'number'
            ? matchingRecord.score
            : '';
      });
    });

    setTableScores(initialMap);
    setIsDirty(false);
  }, [selectedClassId, allColumns.length, classStudents.length, grades]);

  // Validasi Total Bobot (Harus Tepat 100%)
  const totalWeight = useMemo(() => {
    return (
      (Number(weights.Tugas) || 0) +
      (Number(weights.Harian) || 0) +
      (Number(weights.Sumatif) || 0) +
      (Number(weights.STS) || 0) +
      (Number(weights.SAS) || 0)
    );
  }, [weights]);

  const isWeightValid = totalWeight === 100;

  // PERHITUNGAN NILAI AKHIR OTOMATIS & OBJEKTIF:
  // "Hitung komponen yang kosong, Jumlahkan langsung semua komponen dengan bobot nilai tugas yang ditetapkan untuk mendapatkan nilai hasil akhir"
  const studentEvaluations = useMemo(() => {
    return classStudents.map((student, idx) => {
      const studentScores = tableScores[student.id] || {};

      let filledCount = 0;
      allColumns.forEach((col) => {
        const val = studentScores[col.key];
        if (typeof val === 'number' && !isNaN(val)) {
          filledCount++;
        }
      });

      // 1. TUGAS (Akumulasi seluruh sub-kolom tugas di kelas, nilai kosong dihitung 0)
      const totalTugasCount = tugasCols.length;
      let sumTugasWithZero = 0;
      let submittedTugasCount = 0;
      tugasCols.forEach((col) => {
        const val = studentScores[col.key];
        if (typeof val === 'number' && !isNaN(val)) {
          sumTugasWithZero += val;
          submittedTugasCount++;
        }
      });
      const rataRataTugas = totalTugasCount > 0
        ? Math.round((sumTugasWithZero / totalTugasCount) * 10) / 10
        : 0;

      // 2. FORMATIF / ULANGAN HARIAN (Nilai kosong dihitung 0)
      let sumHarianWithZero = 0;
      let submittedHarianCount = 0;
      formatifCols.forEach((col) => {
        const val = studentScores[col.key];
        if (typeof val === 'number' && !isNaN(val)) {
          sumHarianWithZero += val;
          submittedHarianCount++;
        }
      });
      const avgHarian = formatifCols.length > 0
        ? Math.round((sumHarianWithZero / formatifCols.length) * 10) / 10
        : 0;

      // 3. SUMATIF LINGKUP MATERI TP (Nilai kosong dihitung 0)
      let sumSumatifWithZero = 0;
      let submittedSumatifCount = 0;
      sumatifCols.forEach((col) => {
        const val = studentScores[col.key];
        if (typeof val === 'number' && !isNaN(val)) {
          sumSumatifWithZero += val;
          submittedSumatifCount++;
        }
      });
      const avgSumatif = sumatifCols.length > 0
        ? Math.round((sumSumatifWithZero / sumatifCols.length) * 10) / 10
        : 0;

      // 4. SUMATIF TENGAH SEMESTER STS (Nilai kosong dihitung 0)
      let sumSTSWithZero = 0;
      let submittedSTSCount = 0;
      stsCols.forEach((col) => {
        const val = studentScores[col.key];
        if (typeof val === 'number' && !isNaN(val)) {
          sumSTSWithZero += val;
          submittedSTSCount++;
        }
      });
      const avgSTS = stsCols.length > 0
        ? Math.round((sumSTSWithZero / stsCols.length) * 10) / 10
        : 0;

      // 5. SUMATIF AKHIR SEMESTER SAS (Nilai kosong dihitung 0)
      let sumSASWithZero = 0;
      let submittedSASCount = 0;
      sasCols.forEach((col) => {
        const val = studentScores[col.key];
        if (typeof val === 'number' && !isNaN(val)) {
          sumSASWithZero += val;
          submittedSASCount++;
        }
      });
      const avgSAS = sasCols.length > 0
        ? Math.round((sumSASWithZero / sasCols.length) * 10) / 10
        : 0;

      const typeAverages: Record<GradeType, number> = {
        Tugas: rataRataTugas,
        Harian: avgHarian,
        Sumatif: avgSumatif,
        STS: avgSTS,
        SAS: avgSAS,
      };

      // Jumlahkan langsung semua komponen dengan bobot nilai yang ditetapkan untuk mendapatkan nilai hasil akhir:
      // (Komponen kosong dihitung bernilai 0)
      const weightedSum =
        (rataRataTugas * (Number(weights.Tugas) || 0)) +
        (avgHarian * (Number(weights.Harian) || 0)) +
        (avgSumatif * (Number(weights.Sumatif) || 0)) +
        (avgSTS * (Number(weights.STS) || 0)) +
        (avgSAS * (Number(weights.SAS) || 0));

      const finalScore = Math.round((weightedSum / 100) * 10) / 10;

      const isComplete = allColumns.length > 0 && filledCount === allColumns.length;
      const isPassing = finalScore >= 75;

      let predikat = 'D';
      if (finalScore >= 90) predikat = 'A';
      else if (finalScore >= 80) predikat = 'B';
      else if (finalScore >= 70) predikat = 'C';
      else predikat = 'D';

      return {
        student,
        no: idx + 1,
        studentScores,
        filledCount,
        totalCols: allColumns.length,
        missingCount: Math.max(0, allColumns.length - filledCount),
        isComplete,
        finalScore,
        predikat,
        isPassing,
        typeAverages,
        // Properti khusus akumulasi Rata-Rata Tugas:
        rataRataTugas: totalTugasCount > 0 ? rataRataTugas : null,
        sumTugasWithZero,
        submittedTugasCount,
        totalTugasCount,
      };
    });
  }, [classStudents, tableScores, allColumns, weights, tugasCols, formatifCols, sumatifCols, stsCols, sasCols]);

  // FITUR ANALISIS HASIL BELAJAR OBJEKTIF KELAS
  const classAnalytics = useMemo(() => {
    const scoredStudents = studentEvaluations.filter((s) => s.finalScore !== null);
    const totalCount = studentEvaluations.length;

    // Rata-rata Tugas Kelas Berdasarkan Akumulasi
    const tugasAverages = studentEvaluations
      .map((s) => s.rataRataTugas)
      .filter((v): v is number => v !== null);
    const avgClassTugas =
      tugasAverages.length > 0
        ? Math.round((tugasAverages.reduce((a, b) => a + b, 0) / tugasAverages.length) * 10) / 10
        : null;

    if (scoredStudents.length === 0) {
      return {
        hasData: false,
        totalStudents: totalCount,
        evaluatedCount: 0,
        average: 0,
        highest: 0,
        highestStudent: '-',
        lowest: 0,
        lowestStudent: '-',
        passingCount: 0,
        failingCount: 0,
        passingRate: 0,
        avgClassTugas,
        totalTugasCount: tugasCols.length,
      };
    }

    const scores = scoredStudents.map((s) => s.finalScore as number);
    const sum = scores.reduce((a, b) => a + b, 0);
    const average = Math.round((sum / scores.length) * 10) / 10;

    let highest = -Infinity;
    let highestStudent = '';
    let lowest = Infinity;
    let lowestStudent = '';

    scoredStudents.forEach((s) => {
      const score = s.finalScore as number;
      if (score > highest) {
        highest = score;
        highestStudent = s.student.name;
      }
      if (score < lowest) {
        lowest = score;
        lowestStudent = s.student.name;
      }
    });

    const passingCount = scoredStudents.filter((s) => s.isPassing).length;
    const failingCount = scoredStudents.length - passingCount;
    const passingRate = Math.round((passingCount / scoredStudents.length) * 100);

    return {
      hasData: true,
      totalStudents: totalCount,
      evaluatedCount: scoredStudents.length,
      average,
      highest,
      highestStudent,
      lowest,
      lowestStudent,
      passingCount,
      failingCount,
      passingRate,
      avgClassTugas,
      totalTugasCount: tugasCols.length,
    };
  }, [studentEvaluations, tugasCols.length]);

  // Handle Perubahan Nilai Input (0-100)
  const handleScoreChange = (studentId: string, colKey: string, rawVal: string) => {
    let sanitizedVal: number | '' = '';
    if (rawVal.trim() !== '') {
      const num = Number(rawVal);
      if (!isNaN(num)) {
        sanitizedVal = Math.min(100, Math.max(0, num));
      }
    }

    setTableScores((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [colKey]: sanitizedVal,
      },
    }));

    setIsDirty(true);

    if (isAutoSaveEnabled && isWeightValid) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      setAutoSaveStatus('saving');
      autoSaveTimeoutRef.current = setTimeout(() => {
        executeAutoSave(studentId, colKey, sanitizedVal);
      }, 1500);
    }
  };

  // Eksekusi Simpan Otomatis (Auto-Save)
  const executeAutoSave = (lastStudentId: string, lastColKey: string, lastVal: number | '') => {
    const recordsToSave: GradeRecord[] = [];
    const now = new Date().toISOString().slice(0, 10);

    classStudents.forEach((student) => {
      const sScores = tableScores[student.id] || {};
      allColumns.forEach((col) => {
        const val = student.id === lastStudentId && col.key === lastColKey ? lastVal : sScores[col.key];
        if (typeof val === 'number' && !isNaN(val)) {
          recordsToSave.push({
            id: `grd-${student.id}-${col.type}-${col.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${col.date}`,
            studentId: student.id,
            classId: selectedClassId,
            subject: selectedSubject,
            type: col.type,
            title: col.title,
            score: val,
            maxScore: 100,
            date: col.date || now,
            semester: school.semester,
          });
        }
      });
    });

    if (recordsToSave.length > 0) {
      onSaveBatchGrades(recordsToSave);
      setAutoSaveStatus('saved');
      setIsDirty(false);
      setLastSavedTime(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } else {
      setAutoSaveStatus('idle');
    }
  };

  // Simpan Semua Nilai Sekaligus untuk Satu Kelas
  const handleSaveAllClassGrades = () => {
    if (!isWeightValid) {
      alert(`Total bobot saat ini ${totalWeight}%. Harus bernilai tepat 100% sebelum menyimpan data.`);
      return;
    }

    const recordsToSave: GradeRecord[] = [];
    const now = new Date().toISOString().slice(0, 10);

    classStudents.forEach((student) => {
      const sScores = tableScores[student.id] || {};
      allColumns.forEach((col) => {
        const val = sScores[col.key];
        if (typeof val === 'number' && !isNaN(val)) {
          recordsToSave.push({
            id: `grd-${student.id}-${col.type}-${col.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${col.date}`,
            studentId: student.id,
            classId: selectedClassId,
            subject: selectedSubject,
            type: col.type,
            title: col.title,
            score: val,
            maxScore: 100,
            date: col.date || now,
            semester: school.semester,
          });
        }
      });
    });

    if (recordsToSave.length === 0) {
      showToast('Belum ada nilai yang diinput untuk disimpan.');
      return;
    }

    onSaveBatchGrades(recordsToSave);
    setIsDirty(false);
    setAutoSaveStatus('saved');
    setLastSavedTime(
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
    showToast(`Berhasil menyimpan ${recordsToSave.length} nilai untuk kelas ${currentClass?.name || ''}!`);
  };

  // Buka Modal Tambah Sub-Kolom
  const handleOpenAddModal = (defaultType: GradeType = 'Tugas') => {
    setNewColType(defaultType);
    let defaultTitle = '';
    if (defaultType === 'Tugas') defaultTitle = `Tugas ${tugasCols.length + 1}: Pendalaman Materi`;
    else if (defaultType === 'Harian') defaultTitle = `Formatif ${formatifCols.length + 1}: Ulangan Harian`;
    else if (defaultType === 'Sumatif') defaultTitle = `Sumatif TP ${sumatifCols.length + 1}: Capaian Pembelajaran`;
    else if (defaultType === 'STS') defaultTitle = `Sumatif Tengah Semester (STS) ${stsCols.length + 1}`;
    else if (defaultType === 'SAS') defaultTitle = `Sumatif Akhir Semester (SAS) ${sasCols.length + 1}`;
    setNewColTitle(defaultTitle);
    setNewColDate(new Date().toISOString().slice(0, 10));
    setIsAddColumnModalOpen(true);
  };

  // Tambah Sub-Kolom Baru (Dapat ditambah untuk Tugas, Formatif, Sumatif TP, STS, SAS)
  const handleCreateNewColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) {
      alert('Silakan isi deskripsi materi atau judul sub-kolom.');
      return;
    }

    const cleanTitle = newColTitle.trim();
    const cleanDate = newColDate || new Date().toISOString().slice(0, 10);
    const key = `subcol__${selectedClassId}__${newColType}__${Date.now()}__${cleanDate}`;

    const newCol: AssessmentColumn = {
      key,
      type: newColType,
      title: cleanTitle,
      date: cleanDate,
      maxScore: 100,
      subject: selectedSubject,
    };

    const nextCols = [...currentClassColumns, newCol];
    updateClassColumns(nextCols);
    setIsAddColumnModalOpen(false);
    setNewColTitle('');
    setIsDirty(true);
    showToast(`Sub-kolom [${GRADE_TYPE_SHORT[newColType]}] "${cleanTitle}" berhasil ditambahkan.`);
  };

  // Hapus Sub-Kolom Penilaian (Bisa dihapus / dikurangi untuk semua komponen)
  const handleDeleteColumn = (col: AssessmentColumn) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus sub-kolom:\n\n` +
      `[${GRADE_TYPE_LABELS[col.type]}]\n"${col.title}" (Tanggal: ${col.date})?\n\n` +
      `Semua nilai siswa pada sub-kolom ini akan dihapus dari tabel.`
    );

    if (!confirmDelete) return;

    const matching = grades.filter(
      (g) =>
        g.classId === selectedClassId &&
        g.type === col.type &&
        (g.title || '').trim().toLowerCase() === col.title.trim().toLowerCase() &&
        (g.date || '').trim() === col.date.trim()
    );

    if (matching.length > 0) {
      if (onDeleteBatchGrades) {
        onDeleteBatchGrades(matching.map((m) => m.id));
      } else {
        matching.forEach((m) => onDeleteGrade(m.id));
      }
    }

    const nextCols = currentClassColumns.filter((c) => c.key !== col.key);
    updateClassColumns(nextCols);

    setTableScores((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((studentId) => {
        const studentMap = { ...updated[studentId] };
        delete studentMap[col.key];
        updated[studentId] = studentMap;
      });
      return updated;
    });

    setIsDirty(true);
    showToast(`Sub-kolom "${col.title}" berhasil dihapus.`);
  };

  // Buka Modal Edit Sub-Kolom Penilaian
  const handleOpenEditColumn = (col: AssessmentColumn) => {
    setColumnToEdit(col);
    setEditColTitle(col.title);
    setEditColDate(col.date || new Date().toISOString().slice(0, 10));
    setIsEditColumnModalOpen(true);
  };

  // Simpan Perubahan Deskripsi Materi / Teks dan Tanggal Penilaian Sub-Kolom
  const handleSaveEditColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!columnToEdit) return;

    const cleanTitle = editColTitle.trim();
    const cleanDate = editColDate.trim() || new Date().toISOString().slice(0, 10);

    if (!cleanTitle) {
      alert('Deskripsi materi / judul sub-kolom tidak boleh kosong.');
      return;
    }

    const targetKey = columnToEdit.key;

    // 1. Perbarui nilai di database / state grades jika sudah pernah disimpan
    const matchingOldGrades = grades.filter(
      (g) =>
        g.classId === selectedClassId &&
        g.type === columnToEdit.type &&
        (g.title || '').trim().toLowerCase() === columnToEdit.title.trim().toLowerCase() &&
        (g.date || '').trim() === columnToEdit.date.trim()
    );

    if (matchingOldGrades.length > 0) {
      const updatedRecords: GradeRecord[] = matchingOldGrades.map((m) => ({
        ...m,
        title: cleanTitle,
        date: cleanDate,
      }));
      onSaveBatchGrades(updatedRecords);
    }

    // 2. Perbarui sub-kolom di currentClassColumns
    const nextCols = currentClassColumns.map((c) => {
      if (c.key === targetKey) {
        return {
          ...c,
          title: cleanTitle,
          date: cleanDate,
        };
      }
      return c;
    });
    updateClassColumns(nextCols);

    setIsEditColumnModalOpen(false);
    setColumnToEdit(null);
    setIsDirty(true);
    showToast(`Sub-kolom berhasil diperbarui menjadi "${cleanTitle}".`);
  };

  // Atur Ulang ke Konfigurasi Default (3 Tugas, 2 Formatif, 1 Sumatif TP, 1 STS, 1 SAS)
  const handleResetDefaultColumns = () => {
    if (
      window.confirm(
        `Atur ulang struktur sub-kolom kelas ${currentClass?.name || ''} ke konfigurasi default:\n` +
        `• Kolom 1 Tugas: 3 Sub-Kolom\n` +
        `• Kolom 2: Rata-Rata Tugas\n` +
        `• Kolom 3 Formatif: 2 Sub-Kolom\n` +
        `• Sumatif TP: 1 Sub-Kolom\n` +
        `• STS: 1 Kolom\n` +
        `• SAS: 1 Kolom\n\n` +
        `Lanjutkan atur ulang struktur?`
      )
    ) {
      const today = new Date().toISOString().slice(0, 10);
      const defaults = createDefaultClassColumns(selectedClassId, selectedSubject, today);
      updateClassColumns(defaults);
      showToast('Struktur sub-kolom berhasil diatur ulang ke konfigurasi default.');
    }
  };

  // Preset Bobot Cepat
  const applyPresetWeights = (preset: 'standard' | 'praktikum' | 'teori') => {
    if (preset === 'standard') {
      setWeights(DEFAULT_WEIGHTS);
    } else if (preset === 'praktikum') {
      setWeights({
        Tugas: 35,
        Harian: 15,
        Sumatif: 25,
        STS: 10,
        SAS: 15,
      });
    } else if (preset === 'teori') {
      setWeights({
        Tugas: 15,
        Harian: 20,
        Sumatif: 30,
        STS: 15,
        SAS: 20,
      });
    }
    setIsDirty(true);
    showToast('Bobot penilaian berhasil diatur.');
  };

  const getTypeBadge = (type: GradeType) => {
    switch (type) {
      case 'Tugas':
        return 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800';
      case 'Harian':
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Sumatif':
        return 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'STS':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'SAS':
        return 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    }
  };

  // Filter visibilitas 5 kolom utama penilaian
  const showTugasSection = assessmentTypeFilter === 'all' || assessmentTypeFilter === 'Tugas';
  const showAvgTugasCol = assessmentTypeFilter === 'all' || assessmentTypeFilter === 'Tugas';
  const showFormatifSection = assessmentTypeFilter === 'all' || assessmentTypeFilter === 'Harian';
  const showSumatifSection = assessmentTypeFilter === 'all' || assessmentTypeFilter === 'Sumatif';
  const showSTSSection = assessmentTypeFilter === 'all' || assessmentTypeFilter === 'STS';
  const showSASSection = assessmentTypeFilter === 'all' || assessmentTypeFilter === 'SAS';

  // Total sub-kolom aktif yang tampil
  const activeSubColumnsCount =
    (showTugasSection ? tugasCols.length : 0) +
    (showFormatifSection ? formatifCols.length : 0) +
    (showSumatifSection ? sumatifCols.length : 0) +
    (showSTSSection ? stsCols.length : 0) +
    (showSASSection ? sasCols.length : 0);

  // Total colspan tabel (untuk baris kosong)
  const totalTableColSpan =
    3 + // No, NISN, Nama
    (showTugasSection ? Math.max(1, tugasCols.length) : 0) +
    (showAvgTugasCol ? 1 : 0) +
    (showFormatifSection ? Math.max(1, formatifCols.length) : 0) +
    (showSumatifSection ? Math.max(1, sumatifCols.length) : 0) +
    (showSTSSection ? Math.max(1, stsCols.length) : 0) +
    (showSASSection ? Math.max(1, sasCols.length) : 0) +
    3; // Nilai Akhir, Ketercapaian, Kelengkapan

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-4 border border-slate-700 dark:border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER UTAMA & KONTROL CEPAT */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Manajemen Penilaian Siswa
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Input nilai massal satu halaman, evaluasi hasil belajar objektif, pengaturan bobot, dan cetak leger resmi
                </p>
              </div>
            </div>
          </div>

          {/* Tombol Aksi Utama */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle Grafik Tren */}
            <button
              type="button"
              onClick={() => setShowTrendChart(!showTrendChart)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
              <span>{showTrendChart ? 'Tutup Grafik Tren' : 'Lihat Grafik Tren'}</span>
              {showTrendChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Tombol Cetak Leger */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-500" />
              <span>Cetak Leger Rapor</span>
            </button>

            {/* Tombol Simpan Semua Nilai */}
            <button
              type="button"
              onClick={handleSaveAllClassGrades}
              disabled={!isWeightValid}
              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                isDirty
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400/50 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } ${!isWeightValid ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save className="w-4 h-4" />
              <span>Simpan Semua Nilai ({currentClass?.name || 'Kelas'})</span>
            </button>
          </div>
        </div>

        {/* FILTER SEBELUM INPUT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Filter Dropdown Kelas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>1. Filter Kelas (Dropdown)</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                if (isDirty) {
                  const confirmChange = window.confirm(
                    'Anda memiliki perubahan nilai yang belum disimpan. Apakah ingin beralih kelas dan membatalkan perubahan lokal?'
                  );
                  if (!confirmChange) return;
                }
                setSelectedClassId(e.target.value);
              }}
              className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.major} - Wali: {cls.homeroomTeacher})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filter Dropdown Jenis Penilaian */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>2. Jenis Penilaian</span>
            </label>
            <select
              value={assessmentTypeFilter}
              onChange={(e) => setAssessmentTypeFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
            >
              <option value="all">Semua Komponen ({allColumns.length} Tugas & Asesmen)</option>
              <option value="Tugas">Tugas Mandiri / Kelompok ({allColumns.filter((c) => c.type === 'Tugas').length})</option>
              <option value="Harian">Formatif / Ulangan Harian ({allColumns.filter((c) => c.type === 'Harian').length})</option>
              <option value="Sumatif">Sumatif Lingkup Materi TP ({allColumns.filter((c) => c.type === 'Sumatif').length})</option>
              <option value="STS">Sumatif Tengah Semester STS ({allColumns.filter((c) => c.type === 'STS').length})</option>
              <option value="SAS">Sumatif Akhir Semester SAS ({allColumns.filter((c) => c.type === 'SAS').length})</option>
            </select>
          </div>

          {/* 3. Mata Pelajaran & Semester */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
              <span>Mata Pelajaran & Semester</span>
            </label>
            <div className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white truncate">{selectedSubject}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                Sem. {school.semester}
              </span>
            </div>
          </div>

          {/* 4. Pencarian Siswa */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-500" />
              <span>Cari Siswa</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Ketik nama atau NISN..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
              {searchStudent && (
                <button
                  type="button"
                  onClick={() => setSearchStudent('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* STATUS PENYIMPANAN & PENGATURAN BOBOT */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2.5">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Ada nilai yang belum disimpan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <Check className="w-3.5 h-3.5" />
                Semua nilai tersimpan {lastSavedTime ? `(pukul ${lastSavedTime})` : ''}
              </span>
            )}

            {autoSaveStatus === 'saving' && (
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3 animate-spin" /> Menyimpan otomatis...
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAutoSaveEnabled}
                onChange={(e) => setIsAutoSaveEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Simpan Otomatis (Auto-Save)
              </span>
            </label>

            <button
              type="button"
              onClick={() => setIsWeightSettingsOpen(!isWeightSettingsOpen)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
              <span>Atur Bobot Komponen</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                  isWeightValid
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {totalWeight}%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* PANEL PENGATURAN BOBOT (COLLAPSIBLE) */}
      {isWeightSettingsOpen && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Pengaturan Bobot Komponen Penilaian (Total Harus 100%)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Nilai akhir dihitung secara proporsional. Komponen yang belum diinput tidak dihitung sebagai nol.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium mr-1">Preset Cepat:</span>
              <button
                type="button"
                onClick={() => applyPresetWeights('standard')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Standar (20/20/25/15/20)
              </button>
              <button
                type="button"
                onClick={() => applyPresetWeights('praktikum')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Praktikum (35/15/25/10/15)
              </button>
              <button
                type="button"
                onClick={() => applyPresetWeights('teori')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Teori (15/20/30/15/20)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Tugas */}
            <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-sky-900 dark:text-sky-200">
                <span>Tugas Mandiri/Kelompok</span>
                <span className="text-sky-700 dark:text-sky-300 font-extrabold">{weights.Tugas}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.Tugas}
                onChange={(e) => {
                  setWeights((w) => ({ ...w, Tugas: Number(e.target.value) }));
                  setIsDirty(true);
                }}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                <span>Persentase Bobot</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.Tugas}
                  onChange={(e) => {
                    setWeights((w) => ({ ...w, Tugas: Math.min(100, Math.max(0, Number(e.target.value))) }));
                    setIsDirty(true);
                  }}
                  className="w-14 text-center font-bold bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded px-1 py-0.5"
                />
              </div>
            </div>

            {/* Harian */}
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <span>Formatif / Ulangan Harian</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">{weights.Harian}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.Harian}
                onChange={(e) => {
                  setWeights((w) => ({ ...w, Harian: Number(e.target.value) }));
                  setIsDirty(true);
                }}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Persentase Bobot</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.Harian}
                  onChange={(e) => {
                    setWeights((w) => ({ ...w, Harian: Math.min(100, Math.max(0, Number(e.target.value))) }));
                    setIsDirty(true);
                  }}
                  className="w-14 text-center font-bold bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded px-1 py-0.5"
                />
              </div>
            </div>

            {/* Sumatif TP */}
            <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200">
                <span>Sumatif Lingkup Materi (TP)</span>
                <span className="text-purple-700 dark:text-purple-300 font-extrabold">{weights.Sumatif}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.Sumatif}
                onChange={(e) => {
                  setWeights((w) => ({ ...w, Sumatif: Number(e.target.value) }));
                  setIsDirty(true);
                }}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                <span>Persentase Bobot</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.Sumatif}
                  onChange={(e) => {
                    setWeights((w) => ({ ...w, Sumatif: Math.min(100, Math.max(0, Number(e.target.value))) }));
                    setIsDirty(true);
                  }}
                  className="w-14 text-center font-bold bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 rounded px-1 py-0.5"
                />
              </div>
            </div>

            {/* STS */}
            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                <span>Sumatif Tengah Semester</span>
                <span className="text-amber-700 dark:text-amber-300 font-extrabold">{weights.STS}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.STS}
                onChange={(e) => {
                  setWeights((w) => ({ ...w, STS: Number(e.target.value) }));
                  setIsDirty(true);
                }}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                <span>Persentase Bobot</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.STS}
                  onChange={(e) => {
                    setWeights((w) => ({ ...w, STS: Math.min(100, Math.max(0, Number(e.target.value))) }));
                    setIsDirty(true);
                  }}
                  className="w-14 text-center font-bold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded px-1 py-0.5"
                />
              </div>
            </div>

            {/* SAS */}
            <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-rose-900 dark:text-rose-200">
                <span>Sumatif Akhir Semester</span>
                <span className="text-rose-700 dark:text-rose-300 font-extrabold">{weights.SAS}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.SAS}
                onChange={(e) => {
                  setWeights((w) => ({ ...w, SAS: Number(e.target.value) }));
                  setIsDirty(true);
                }}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                <span>Persentase Bobot</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.SAS}
                  onChange={(e) => {
                    setWeights((w) => ({ ...w, SAS: Math.min(100, Math.max(0, Number(e.target.value))) }));
                    setIsDirty(true);
                  }}
                  className="w-14 text-center font-bold bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded px-1 py-0.5"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {isWeightValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 animate-bounce" />
              )}
              <span
                className={`text-xs font-bold ${
                  isWeightValid
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-300'
                }`}
              >
                {isWeightValid
                  ? 'Total Bobot: Tepat 100% (Valid & Proporsional)'
                  : `Total Bobot: ${totalWeight}% (Harus Tepat 100% — Selisih ${100 - totalWeight > 0 ? `+${100 - totalWeight}%` : `${100 - totalWeight}%`})`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setWeights(DEFAULT_WEIGHTS);
                setIsDirty(true);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Default (100%)</span>
            </button>
          </div>
        </div>
      )}

      {/* ANALISIS HASIL BELAJAR OBJEKTIF (RATA-RATA, TERTINGGI, TERENDAH, TUNTAS, TIDAK TUNTAS) */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-5 rounded-2xl shadow-lg border border-indigo-800/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">
                Analisis Evaluasi Hasil Belajar Objektif — {currentClass?.name || 'Kelas'}
              </h2>
              <p className="text-[11px] text-indigo-200">
                Kriteria Ketercapaian Tujuan Pembelajaran (KKTP / KKM): ≥ 75.0 · Dihitung adil tanpa penalti nol untuk tugas belum terbit
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-indigo-800/60 text-indigo-200 font-semibold border border-indigo-700/50">
              {classAnalytics.evaluatedCount} dari {classAnalytics.totalStudents} Siswa Terisi Nilai
            </span>
          </div>
        </div>

        {/* 5 Kartu Metrik Analisis */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Nilai Rata-rata Kelas */}
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-xl border border-white/10 space-y-1">
            <span className="text-[11px] text-indigo-200 uppercase tracking-wider font-semibold block">
              Nilai Rata-rata Kelas
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">
                {classAnalytics.hasData ? classAnalytics.average.toFixed(1) : '-'}
              </span>
              <span className="text-[11px] text-indigo-300 font-medium">/ 100</span>
            </div>
            <p className="text-[10px] text-indigo-300 truncate">
              {classAnalytics.hasData && classAnalytics.average >= 75 ? 'Rata-rata memenuhi KKTP' : 'Perlu penguatan materi'}
            </p>
          </div>

          {/* 2. Nilai Tertinggi */}
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-xl border border-white/10 space-y-1">
            <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-semibold block flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              Nilai Tertinggi
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-300">
                {classAnalytics.hasData ? classAnalytics.highest.toFixed(1) : '-'}
              </span>
              <span className="text-[11px] text-emerald-400/80 font-medium">Puncak</span>
            </div>
            <p className="text-[10px] text-emerald-200 truncate" title={classAnalytics.highestStudent}>
              {classAnalytics.hasData ? classAnalytics.highestStudent : '-'}
            </p>
          </div>

          {/* 3. Nilai Terendah */}
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-xl border border-white/10 space-y-1">
            <span className="text-[11px] text-amber-300 uppercase tracking-wider font-semibold block flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 rotate-180" />
              Nilai Terendah
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-300">
                {classAnalytics.hasData ? classAnalytics.lowest.toFixed(1) : '-'}
              </span>
              <span className="text-[11px] text-amber-400/80 font-medium">Batas</span>
            </div>
            <p className="text-[10px] text-amber-200 truncate" title={classAnalytics.lowestStudent}>
              {classAnalytics.hasData ? classAnalytics.lowestStudent : '-'}
            </p>
          </div>

          {/* 4. Jumlah Siswa yang Tuntas */}
          <div className="bg-emerald-950/40 backdrop-blur-md p-3.5 rounded-xl border border-emerald-500/30 space-y-1">
            <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-semibold block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Siswa Tuntas
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-400">
                {classAnalytics.passingCount}
              </span>
              <span className="text-[11px] text-emerald-300 font-semibold">
                ({classAnalytics.passingRate}%)
              </span>
            </div>
            <p className="text-[10px] text-emerald-300">Nilai Akhir ≥ 75.0</p>
          </div>

          {/* 5. Jumlah Siswa yang Tidak Tuntas */}
          <div className="bg-rose-950/40 backdrop-blur-md p-3.5 rounded-xl border border-rose-500/30 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-rose-300 uppercase tracking-wider font-semibold block flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Tidak Tuntas
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-400">
                {classAnalytics.failingCount}
              </span>
              <span className="text-[11px] text-rose-300 font-semibold">
                Siswa
              </span>
            </div>
            <p className="text-[10px] text-rose-300">Perlu Bimbingan / Remedial</p>
          </div>
        </div>

        {classAnalytics.hasData && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-indigo-200">
              <span>Ketuntasan Belajar Kelas: {classAnalytics.passingRate}%</span>
              <span>Target Kelulusan: 100%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                style={{ width: `${classAnalytics.passingRate}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
              />
              <div
                style={{ width: `${100 - classAnalytics.passingRate}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* GRAFIK TREN NILAI (OPTIONAL COLLAPSIBLE RECHARTS) */}
      {showTrendChart && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Visualisasi & Tren Penilaian Semester
                </h3>
                <p className="text-xs text-slate-500">Pergerakan rata-rata nilai per mata pelajaran dan per semester</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowTrendChart(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
            >
              Tutup Grafik
            </button>
          </div>
          <GradeTrendAnalytics
            grades={grades}
            students={students}
            classes={classes}
            school={school}
            initialClassId={selectedClassId}
          />
        </div>
      )}

      {/* BILAH AKSI: RINGKASAN STRUKTUR 5 KOLOM & TAMBAH SUB-KOLOM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Struktur 5 Kolom Penilaian:
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 flex items-center gap-1.5">
            <span>Kolom 1: Tugas ({tugasCols.length})</span>
            <span>·</span>
            <span className="text-sky-700 dark:text-sky-300 font-extrabold">Kolom 2: Rata-Rata Tugas</span>
            <span>·</span>
            <span>Kolom 3: Formatif ({formatifCols.length})</span>
            <span>·</span>
            <span>Sumatif TP ({sumatifCols.length})</span>
            <span>·</span>
            <span>STS ({stsCols.length})</span>
            <span>·</span>
            <span>SAS ({sasCols.length})</span>
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1.5">
            <span>Bobot Tugas: {weights.Tugas}%</span>
            {classAnalytics.avgClassTugas !== null && (
              <span className="px-1.5 py-0.2 bg-sky-200 dark:bg-sky-800 text-sky-900 dark:text-sky-100 rounded text-[11px] font-extrabold">
                Rerata Kelas: {classAnalytics.avgClassTugas.toFixed(1)}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaultColumns}
            className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            title="Atur ulang struktur ke konfigurasi default (3 Tugas, 2 Formatif, 1 Sumatif TP, 1 STS, 1 SAS)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Struktur Default</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal('Tugas')}
            className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Sub-Kolom</span>
          </button>
        </div>
      </div>

      {/* TABEL INPUT NILAI MASSAL (5 KOLOM PENILAIAN DENGAN SUB-KOLOM & RATA-RATA TUGAS) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[750px] relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800/90 sticky top-0 z-20 backdrop-blur-md shadow-xs">
              {/* BARIS HEADER 1: KATEGORI 5 KOLOM PENILAIAN */}
              <tr className="border-b border-slate-200 dark:border-slate-700 divide-x divide-slate-200 dark:divide-slate-700">
                {/* 1. Nomor */}
                <th
                  rowSpan={2}
                  className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-200 w-12 sticky left-0 z-30 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700"
                >
                  No.
                </th>

                {/* 2. NISN / NIS */}
                <th
                  rowSpan={2}
                  className="py-3 px-3 font-bold text-slate-700 dark:text-slate-200 w-28 sticky left-12 z-30 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700"
                >
                  NISN / NIS
                </th>

                {/* 3. Nama Siswa */}
                <th
                  rowSpan={2}
                  className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200 min-w-[190px] sticky left-40 z-30 bg-slate-100 dark:bg-slate-800 shadow-r border-b border-slate-300 dark:border-slate-700"
                >
                  Nama Siswa ({filteredStudents.length})
                </th>

                {/* KOLOM 1: TUGAS */}
                {showTugasSection && (
                  <th
                    colSpan={Math.max(1, tugasCols.length)}
                    className="py-2.5 px-3 bg-sky-100/95 dark:bg-sky-950/90 border-b border-x border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100 text-center"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-600 text-white uppercase tracking-wider">
                            Kolom 1: Tugas
                          </span>
                          <span className="text-[11px] font-bold text-sky-800 dark:text-sky-200">
                            (Bobot: {weights.Tugas}%)
                          </span>
                        </div>
                        <div className="text-[10px] text-sky-700 dark:text-sky-300 font-medium mt-0.5">
                          {tugasCols.length} Sub-Kolom (Dapat diedit, ditambah, dihapus)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal('Tugas')}
                        className="px-2.5 py-1 text-[11px] font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Tambah Sub-Kolom Tugas Baru"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Sub-Kolom</span>
                      </button>
                    </div>
                  </th>
                )}

                {/* KOLOM 2: RATA-RATA TUGAS (Tepat setelah Tugas, Sebelum Formatif) */}
                {showAvgTugasCol && (
                  <th
                    rowSpan={2}
                    className="py-3 px-3.5 font-bold text-center bg-sky-200/90 dark:bg-sky-900/90 border-x-2 border-b border-sky-400 dark:border-sky-700 text-sky-950 dark:text-sky-50 min-w-[155px] max-w-[190px] shadow-xs align-middle"
                  >
                    <div className="space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-sky-700 text-white border border-sky-600 uppercase tracking-wider">
                        KOLOM 2
                      </span>
                      <div className="font-black text-xs text-sky-950 dark:text-sky-50 leading-tight uppercase tracking-tight">
                        RATA-RATA TUGAS
                      </div>
                      <div className="text-[10px] text-sky-900 dark:text-sky-200 font-bold">
                        {tugasCols.length > 0 ? `Σ Nilai ÷ ${tugasCols.length} Tugas` : 'Belum Ada Tugas'}
                      </div>
                      <div className="text-[9px] text-sky-800 dark:text-sky-300 font-medium">
                        (Kosong = 0 · Bobot {weights.Tugas}%)
                      </div>
                    </div>
                  </th>
                )}

                {/* KOLOM 3: FORMATIF / ULANGAN */}
                {showFormatifSection && (
                  <th
                    colSpan={Math.max(1, formatifCols.length)}
                    className="py-2.5 px-3 bg-emerald-100/95 dark:bg-emerald-950/90 border-b border-x border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 text-center"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                            Kolom 3: Formatif / Ulangan
                          </span>
                          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200">
                            (Bobot: {weights.Harian}%)
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">
                          {formatifCols.length} Sub-Kolom (Dapat diedit, ditambah, dihapus)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal('Harian')}
                        className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Tambah Sub-Kolom Formatif Baru"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Sub-Kolom</span>
                      </button>
                    </div>
                  </th>
                )}

                {/* SUMATIF LINGKUP MATERI (TP) */}
                {showSumatifSection && (
                  <th
                    colSpan={Math.max(1, sumatifCols.length)}
                    className="py-2.5 px-3 bg-purple-100/95 dark:bg-purple-950/90 border-b border-x border-purple-300 dark:border-purple-800 text-purple-950 dark:text-purple-100 text-center"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-600 text-white uppercase tracking-wider">
                            Sumatif TP
                          </span>
                          <span className="text-[11px] font-bold text-purple-800 dark:text-purple-200">
                            (Bobot: {weights.Sumatif}%)
                          </span>
                        </div>
                        <div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium mt-0.5">
                          Lingkup Materi ({sumatifCols.length} Sub-Kolom)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal('Sumatif')}
                        className="px-2.5 py-1 text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Tambah Sub-Kolom Sumatif TP Baru"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Sub-Kolom</span>
                      </button>
                    </div>
                  </th>
                )}

                {/* SUMATIF TENGAH SEMESTER (STS) */}
                {showSTSSection && (
                  <th
                    colSpan={Math.max(1, stsCols.length)}
                    className="py-2.5 px-3 bg-amber-100/95 dark:bg-amber-950/90 border-b border-x border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 text-center"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-600 text-white uppercase tracking-wider">
                            STS
                          </span>
                          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-200">
                            (Bobot: {weights.STS}%)
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium mt-0.5">
                          Tengah Semester ({stsCols.length} Kolom)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal('STS')}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Tambah Kolom STS Baru"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Kolom</span>
                      </button>
                    </div>
                  </th>
                )}

                {/* SUMATIF AKHIR SEMESTER (SAS) */}
                {showSASSection && (
                  <th
                    colSpan={Math.max(1, sasCols.length)}
                    className="py-2.5 px-3 bg-rose-100/95 dark:bg-rose-950/90 border-b border-x border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 text-center"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                            SAS
                          </span>
                          <span className="text-[11px] font-bold text-rose-800 dark:text-rose-200">
                            (Bobot: {weights.SAS}%)
                          </span>
                        </div>
                        <div className="text-[10px] text-rose-700 dark:text-rose-300 font-medium mt-0.5">
                          Akhir Semester ({sasCols.length} Kolom)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal('SAS')}
                        className="px-2.5 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Tambah Kolom SAS Baru"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Kolom</span>
                      </button>
                    </div>
                  </th>
                )}

                {/* Nilai Akhir Otomatis */}
                <th
                  rowSpan={2}
                  className="py-3 px-4 font-bold text-center text-indigo-700 dark:text-indigo-300 min-w-[125px] bg-indigo-50/80 dark:bg-indigo-950/50 border-b border-indigo-200 dark:border-indigo-900"
                >
                  <div className="leading-tight font-extrabold text-sm">Nilai Akhir</div>
                  <div className="text-[10px] text-indigo-500 font-normal">Akumulasi Bobot 100% (Kosong = 0)</div>
                </th>

                {/* Predikat & Ketercapaian */}
                <th
                  rowSpan={2}
                  className="py-3 px-3 font-bold text-center text-slate-700 dark:text-slate-200 min-w-[110px] border-b border-slate-300 dark:border-slate-700"
                >
                  Ketercapaian
                </th>

                {/* Status Kelengkapan Nilai */}
                <th
                  rowSpan={2}
                  className="py-3 px-4 font-bold text-center text-slate-700 dark:text-slate-200 min-w-[140px] border-b border-slate-300 dark:border-slate-700"
                >
                  Kelengkapan Nilai
                </th>
              </tr>

              {/* BARIS HEADER 2: RINCIAN SUB-KOLOM (JUDUL, TANGGAL, TOMBOL EDIT & HAPUS) */}
              <tr className="border-b border-slate-200 dark:border-slate-700 divide-x divide-slate-200 dark:divide-slate-700">
                {/* Sub-kolom Tugas */}
                {showTugasSection &&
                  (tugasCols.length > 0 ? (
                    tugasCols.map((col) => (
                      <th
                        key={col.key}
                        className="py-2.5 px-3 min-w-[160px] max-w-[210px] font-bold text-slate-800 dark:text-slate-100 align-top group hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors border-x border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div
                            className="space-y-0.5 flex-1 cursor-pointer"
                            onClick={() => handleOpenEditColumn(col)}
                            title="Klik untuk mengedit deskripsi materi & tanggal penilaian"
                          >
                            <div
                              className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 group/title text-xs"
                              title={`Klik untuk edit: ${col.title}`}
                            >
                              <span>{col.title}</span>
                              <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/title:opacity-100 text-indigo-500 shrink-0 transition-opacity" />
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal hover:text-slate-700 dark:hover:text-slate-200">
                              Tgl: {col.date || '-'}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditColumn(col)}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                              title={`Edit deskripsi teks & tanggal "${col.title}"`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(col)}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={`Hapus sub-kolom "${col.title}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))
                  ) : (
                    <th className="py-2.5 px-3 text-center text-xs text-slate-400 italic">
                      Belum ada sub-kolom tugas
                    </th>
                  ))}

                {/* Sub-kolom Formatif / Ulangan */}
                {showFormatifSection &&
                  (formatifCols.length > 0 ? (
                    formatifCols.map((col) => (
                      <th
                        key={col.key}
                        className="py-2.5 px-3 min-w-[160px] max-w-[210px] font-bold text-slate-800 dark:text-slate-100 align-top group hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors border-x border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div
                            className="space-y-0.5 flex-1 cursor-pointer"
                            onClick={() => handleOpenEditColumn(col)}
                            title="Klik untuk mengedit deskripsi materi & tanggal penilaian"
                          >
                            <div
                              className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 group/title text-xs"
                              title={`Klik untuk edit: ${col.title}`}
                            >
                              <span>{col.title}</span>
                              <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/title:opacity-100 text-indigo-500 shrink-0 transition-opacity" />
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal hover:text-slate-700 dark:hover:text-slate-200">
                              Tgl: {col.date || '-'}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditColumn(col)}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                              title={`Edit deskripsi teks & tanggal "${col.title}"`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(col)}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={`Hapus sub-kolom "${col.title}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))
                  ) : (
                    <th className="py-2.5 px-3 text-center text-xs text-slate-400 italic">
                      Belum ada sub-kolom formatif
                    </th>
                  ))}

                {/* Sub-kolom Sumatif TP */}
                {showSumatifSection &&
                  (sumatifCols.length > 0 ? (
                    sumatifCols.map((col) => (
                      <th
                        key={col.key}
                        className="py-2.5 px-3 min-w-[160px] max-w-[210px] font-bold text-slate-800 dark:text-slate-100 align-top group hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors border-x border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div
                            className="space-y-0.5 flex-1 cursor-pointer"
                            onClick={() => handleOpenEditColumn(col)}
                            title="Klik untuk mengedit deskripsi materi & tanggal penilaian"
                          >
                            <div
                              className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 group/title text-xs"
                              title={`Klik untuk edit: ${col.title}`}
                            >
                              <span>{col.title}</span>
                              <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/title:opacity-100 text-indigo-500 shrink-0 transition-opacity" />
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal hover:text-slate-700 dark:hover:text-slate-200">
                              Tgl: {col.date || '-'}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditColumn(col)}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                              title={`Edit deskripsi teks & tanggal "${col.title}"`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(col)}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={`Hapus sub-kolom "${col.title}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))
                  ) : (
                    <th className="py-2.5 px-3 text-center text-xs text-slate-400 italic">
                      Belum ada sub-kolom sumatif TP
                    </th>
                  ))}

                {/* Sub-kolom STS */}
                {showSTSSection &&
                  (stsCols.length > 0 ? (
                    stsCols.map((col) => (
                      <th
                        key={col.key}
                        className="py-2.5 px-3 min-w-[160px] max-w-[210px] font-bold text-slate-800 dark:text-slate-100 align-top group hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors border-x border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div
                            className="space-y-0.5 flex-1 cursor-pointer"
                            onClick={() => handleOpenEditColumn(col)}
                            title="Klik untuk mengedit deskripsi materi & tanggal penilaian"
                          >
                            <div
                              className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 group/title text-xs"
                              title={`Klik untuk edit: ${col.title}`}
                            >
                              <span>{col.title}</span>
                              <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/title:opacity-100 text-indigo-500 shrink-0 transition-opacity" />
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal hover:text-slate-700 dark:hover:text-slate-200">
                              Tgl: {col.date || '-'}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditColumn(col)}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                              title={`Edit deskripsi teks & tanggal "${col.title}"`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(col)}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={`Hapus kolom "${col.title}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))
                  ) : (
                    <th className="py-2.5 px-3 text-center text-xs text-slate-400 italic">
                      Belum ada kolom STS
                    </th>
                  ))}

                {/* Sub-kolom SAS */}
                {showSASSection &&
                  (sasCols.length > 0 ? (
                    sasCols.map((col) => (
                      <th
                        key={col.key}
                        className="py-2.5 px-3 min-w-[160px] max-w-[210px] font-bold text-slate-800 dark:text-slate-100 align-top group hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors border-x border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div
                            className="space-y-0.5 flex-1 cursor-pointer"
                            onClick={() => handleOpenEditColumn(col)}
                            title="Klik untuk mengedit deskripsi materi & tanggal penilaian"
                          >
                            <div
                              className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 group/title text-xs"
                              title={`Klik untuk edit: ${col.title}`}
                            >
                              <span>{col.title}</span>
                              <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/title:opacity-100 text-indigo-500 shrink-0 transition-opacity" />
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal hover:text-slate-700 dark:hover:text-slate-200">
                              Tgl: {col.date || '-'}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditColumn(col)}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                              title={`Edit deskripsi teks & tanggal "${col.title}"`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(col)}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={`Hapus kolom "${col.title}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))
                  ) : (
                    <th className="py-2.5 px-3 text-center text-xs text-slate-400 italic">
                      Belum ada kolom SAS
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalTableColSpan}
                    className="py-12 text-center text-slate-400 dark:text-slate-500"
                  >
                    Tidak ada siswa yang ditemukan untuk kelas ini.
                  </td>
                </tr>
              ) : (
                studentEvaluations
                  .filter((evalItem) =>
                    filteredStudents.some((s) => s.id === evalItem.student.id)
                  )
                  .map((evalItem) => {
                    const student = evalItem.student;
                    const studentScores = evalItem.studentScores;

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors divide-x divide-slate-100 dark:divide-slate-800"
                      >
                        {/* 1. Nomor */}
                        <td className="py-2.5 px-3 text-center font-medium text-slate-500 dark:text-slate-400 sticky left-0 z-10 bg-white dark:bg-slate-900">
                          {evalItem.no}
                        </td>

                        {/* 2. NISN / NIS */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 sticky left-12 z-10 bg-white dark:bg-slate-900 truncate">
                          {student.nisnNis || student.nisn || student.nis || '-'}
                        </td>

                        {/* 3. Nama Siswa */}
                        <td className="py-2.5 px-4 sticky left-40 z-10 bg-white dark:bg-slate-900 shadow-r">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                student.gender === 'L'
                                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                                  : 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300'
                              }`}
                            >
                              {student.gender}
                            </span>
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {student.name}
                            </div>
                          </div>
                        </td>

                        {/* KOLOM 1: Input Nilai Sub-Kolom Tugas Mandiri / Kelompok */}
                        {showTugasSection &&
                          (tugasCols.length > 0 ? (
                            tugasCols.map((col) => {
                              const currentScore = studentScores[col.key] ?? '';
                              const isFilled = typeof currentScore === 'number' && !isNaN(currentScore);
                              const isWarning = isFilled && currentScore < 75;

                              return (
                                <td key={col.key} className="py-2 px-2.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="—"
                                      value={currentScore}
                                      onChange={(e) =>
                                        handleScoreChange(student.id, col.key, e.target.value)
                                      }
                                      className={`w-full text-center text-xs font-bold rounded-lg px-2 py-1.5 border transition-all ${
                                        isFilled
                                          ? isWarning
                                            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                                            : 'bg-slate-50 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:bg-white'
                                          : 'bg-slate-50/40 dark:bg-slate-800/30 border-dashed border-slate-200 dark:border-slate-700 text-slate-400'
                                      } focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                    />
                                  </div>
                                </td>
                              );
                            })
                          ) : (
                            <td className="py-2.5 px-3 text-center text-slate-400 italic text-xs">—</td>
                          ))}

                        {/* KOLOM 2: Kolom Khusus RATA-RATA TUGAS (Tepat setelah Tugas, Sebelum Formatif) */}
                        {showAvgTugasCol && (
                          <td className="py-2.5 px-3 text-center bg-sky-100/60 dark:bg-sky-950/40 border-x-2 border-sky-300 dark:border-sky-800 font-mono">
                            {evalItem.rataRataTugas !== null ? (
                              <div className="space-y-0.5">
                                <div className="inline-flex items-center justify-center">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-xs font-black shadow-xs ${
                                      evalItem.rataRataTugas >= 75
                                        ? 'bg-sky-200 dark:bg-sky-900 text-sky-950 dark:text-sky-100 border border-sky-400 dark:border-sky-700'
                                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                    }`}
                                    title={`Total Nilai: ${evalItem.sumTugasWithZero} dari ${evalItem.totalTugasCount} tugas (Nilai kosong dihitung 0, Masuk ke Bobot Nilai Akhir: ${weights.Tugas}%)`}
                                  >
                                    {evalItem.rataRataTugas.toFixed(1)}
                                  </span>
                                </div>
                                <div className="text-[10px] text-sky-800 dark:text-sky-300 font-sans font-semibold">
                                  {evalItem.submittedTugasCount}/{tugasCols.length} tugas kumpul
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">—</span>
                            )}
                          </td>
                        )}

                        {/* KOLOM 3: Input Nilai Sub-Kolom Formatif / Ulangan */}
                        {showFormatifSection &&
                          (formatifCols.length > 0 ? (
                            formatifCols.map((col) => {
                              const currentScore = studentScores[col.key] ?? '';
                              const isFilled = typeof currentScore === 'number' && !isNaN(currentScore);
                              const isWarning = isFilled && currentScore < 75;

                              return (
                                <td key={col.key} className="py-2 px-2.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="—"
                                      value={currentScore}
                                      onChange={(e) =>
                                        handleScoreChange(student.id, col.key, e.target.value)
                                      }
                                      className={`w-full text-center text-xs font-bold rounded-lg px-2 py-1.5 border transition-all ${
                                        isFilled
                                          ? isWarning
                                            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                                            : 'bg-slate-50 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:bg-white'
                                          : 'bg-slate-50/40 dark:bg-slate-800/30 border-dashed border-slate-200 dark:border-slate-700 text-slate-400'
                                      } focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                    />
                                  </div>
                                </td>
                              );
                            })
                          ) : (
                            <td className="py-2.5 px-3 text-center text-slate-400 italic text-xs">—</td>
                          ))}

                        {/* SUMATIF LINGKUP MATERI (TP) */}
                        {showSumatifSection &&
                          (sumatifCols.length > 0 ? (
                            sumatifCols.map((col) => {
                              const currentScore = studentScores[col.key] ?? '';
                              const isFilled = typeof currentScore === 'number' && !isNaN(currentScore);
                              const isWarning = isFilled && currentScore < 75;

                              return (
                                <td key={col.key} className="py-2 px-2.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="—"
                                      value={currentScore}
                                      onChange={(e) =>
                                        handleScoreChange(student.id, col.key, e.target.value)
                                      }
                                      className={`w-full text-center text-xs font-bold rounded-lg px-2 py-1.5 border transition-all ${
                                        isFilled
                                          ? isWarning
                                            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                                            : 'bg-slate-50 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:bg-white'
                                          : 'bg-slate-50/40 dark:bg-slate-800/30 border-dashed border-slate-200 dark:border-slate-700 text-slate-400'
                                      } focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                    />
                                  </div>
                                </td>
                              );
                            })
                          ) : (
                            <td className="py-2.5 px-3 text-center text-slate-400 italic text-xs">—</td>
                          ))}

                        {/* SUMATIF TENGAH SEMESTER (STS) */}
                        {showSTSSection &&
                          (stsCols.length > 0 ? (
                            stsCols.map((col) => {
                              const currentScore = studentScores[col.key] ?? '';
                              const isFilled = typeof currentScore === 'number' && !isNaN(currentScore);
                              const isWarning = isFilled && currentScore < 75;

                              return (
                                <td key={col.key} className="py-2 px-2.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="—"
                                      value={currentScore}
                                      onChange={(e) =>
                                        handleScoreChange(student.id, col.key, e.target.value)
                                      }
                                      className={`w-full text-center text-xs font-bold rounded-lg px-2 py-1.5 border transition-all ${
                                        isFilled
                                          ? isWarning
                                            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                                            : 'bg-slate-50 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:bg-white'
                                          : 'bg-slate-50/40 dark:bg-slate-800/30 border-dashed border-slate-200 dark:border-slate-700 text-slate-400'
                                      } focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                    />
                                  </div>
                                </td>
                              );
                            })
                          ) : (
                            <td className="py-2.5 px-3 text-center text-slate-400 italic text-xs">—</td>
                          ))}

                        {/* SUMATIF AKHIR SEMESTER (SAS) */}
                        {showSASSection &&
                          (sasCols.length > 0 ? (
                            sasCols.map((col) => {
                              const currentScore = studentScores[col.key] ?? '';
                              const isFilled = typeof currentScore === 'number' && !isNaN(currentScore);
                              const isWarning = isFilled && currentScore < 75;

                              return (
                                <td key={col.key} className="py-2 px-2.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="—"
                                      value={currentScore}
                                      onChange={(e) =>
                                        handleScoreChange(student.id, col.key, e.target.value)
                                      }
                                      className={`w-full text-center text-xs font-bold rounded-lg px-2 py-1.5 border transition-all ${
                                        isFilled
                                          ? isWarning
                                            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                                            : 'bg-slate-50 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:bg-white'
                                          : 'bg-slate-50/40 dark:bg-slate-800/30 border-dashed border-slate-200 dark:border-slate-700 text-slate-400'
                                      } focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                    />
                                  </div>
                                </td>
                              );
                            })
                          ) : (
                            <td className="py-2.5 px-3 text-center text-slate-400 italic text-xs">—</td>
                          ))}

                        {/* Nilai Akhir Otomatis (Menggunakan Rata-Rata Tugas Sebagai Bobot Tugas) */}
                        <td className="py-2.5 px-4 text-center bg-indigo-50/40 dark:bg-indigo-950/30 font-bold">
                          {evalItem.finalScore !== null ? (
                            <div className="space-y-0.5">
                              <span
                                className={`text-sm font-extrabold ${
                                  evalItem.isPassing
                                    ? 'text-indigo-700 dark:text-indigo-300'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {evalItem.finalScore.toFixed(1)}
                              </span>
                              <div className="text-[10px] text-slate-400 font-normal">
                                Predikat: <span className="font-bold">{evalItem.predikat}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal italic">—</span>
                          )}
                        </td>

                        {/* Ketercapaian */}
                        <td className="py-2.5 px-3 text-center">
                          {evalItem.finalScore !== null ? (
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                evalItem.isPassing
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              }`}
                            >
                              {evalItem.isPassing ? 'Tuntas' : 'Belum Tuntas'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Belum Dinilai</span>
                          )}
                        </td>

                        {/* Status Kelengkapan Nilai */}
                        <td className="py-2.5 px-4 text-center">
                          {evalItem.totalCols === 0 ? (
                            <span className="text-[10px] text-slate-400">Belum ada tugas</span>
                          ) : evalItem.isComplete ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                              <Check className="w-3 h-3" />
                              Lengkap ({evalItem.filledCount}/{evalItem.totalCols})
                            </span>
                          ) : evalItem.filledCount === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              Belum Diisi (0/{evalItem.totalCols})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                              Kurang {evalItem.missingCount} ({evalItem.filledCount}/{evalItem.totalCols})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Tabel & Tombol Simpan Sekaligus */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{filteredStudents.length}</span> siswa,{' '}
            struktur <span className="font-bold text-slate-800 dark:text-slate-200">5 kolom penilaian</span> ({activeSubColumnsCount} sub-kolom aktif{' '}
            <span className="font-bold text-sky-600 dark:text-sky-400">+ Kolom 2 Rata-Rata Tugas sebelum Formatif</span>).
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAllClassGrades}
              disabled={!isWeightValid}
              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Sekaligus untuk Kelas {currentClass?.name}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: TAMBAH SUB-KOLOM BARU (DAPAT DITAMBAHKAN UNTUK 5 PILAR ASESMEN) */}
      {isAddColumnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Tambah Sub-Kolom Penilaian Baru
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Untuk kelas: <span className="font-semibold text-indigo-600">{currentClass?.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddColumnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewColumn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Komponen Penilaian (Pilar Asesmen)
                </label>
                <select
                  value={newColType}
                  onChange={(e) => {
                    const t = e.target.value as GradeType;
                    setNewColType(t);
                    if (t === 'Tugas') setNewColTitle(`Tugas ${tugasCols.length + 1}: Pendalaman Materi`);
                    else if (t === 'Harian') setNewColTitle(`Formatif ${formatifCols.length + 1}: Ulangan Harian`);
                    else if (t === 'Sumatif') setNewColTitle(`Sumatif TP ${sumatifCols.length + 1}: Capaian Pembelajaran`);
                    else if (t === 'STS') setNewColTitle(`Sumatif Tengah Semester (STS) ${stsCols.length + 1}`);
                    else if (t === 'SAS') setNewColTitle(`Sumatif Akhir Semester (SAS) ${sasCols.length + 1}`);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Tugas">Kolom 1: Tugas Mandiri / Kelompok (Bobot: {weights.Tugas}%)</option>
                  <option value="Harian">Kolom 3: Formatif / Ulangan (Bobot: {weights.Harian}%)</option>
                  <option value="Sumatif">Sumatif Lingkup Materi TP (Bobot: {weights.Sumatif}%)</option>
                  <option value="STS">Sumatif Tengah Semester STS (Bobot: {weights.STS}%)</option>
                  <option value="SAS">Sumatif Akhir Semester SAS (Bobot: {weights.SAS}%)</option>
                </select>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                  *Sub-kolom dapat ditambah, dikurangi/dihapus, dan deskripsi materi beserta tanggalnya dapat diedit bebas sewaktu-waktu.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Materi / Judul Sub-Kolom
                </label>
                <input
                  type="text"
                  required
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="Contoh: Tugas 2: Matriks & Determinan"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Penilaian
                </label>
                <input
                  type="date"
                  required
                  value={newColDate}
                  onChange={(e) => setNewColDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddColumnModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambahkan Sub-Kolom</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* MODAL: EDIT KOMPONEN PENILAIAN (DESKRIPSI TEKS & TANGGAL) */}
      {isEditColumnModalOpen && columnToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Edit Komponen Penilaian
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      [{GRADE_TYPE_LABELS[columnToEdit.type]}]
                    </span>{' '}
                    — Kelas {currentClass?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditColumnModalOpen(false);
                  setColumnToEdit(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditColumn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Materi / Judul Penilaian
                </label>
                <input
                  type="text"
                  required
                  value={editColTitle}
                  onChange={(e) => setEditColTitle(e.target.value)}
                  placeholder="Contoh: Tugas 1: SPLDV & Matriks"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Deskripsi materi akan langsung diperbarui pada header tabel penilaian.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Penilaian
                </label>
                <input
                  type="date"
                  required
                  value={editColDate}
                  onChange={(e) => setEditColDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditColumnModalOpen(false);
                    setColumnToEdit(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CETAK DOKUMEN RESMI LEGER RAPOR */}
      <PrintDocumentModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="LEGER NILAI HASIL BELAJAR SISWA"
        subtitle={`Kelas: ${currentClass?.name || ''} | Mata Pelajaran: ${selectedSubject} | Semester: ${school.semester} T.A ${school.academicYear}`}
        school={school}
        currentUser={currentUser}
        metaInfo={[
          { label: 'Kelas', value: currentClass?.name || '-' },
          { label: 'Wali Kelas', value: currentClass?.homeroomTeacher || '-' },
          { label: 'Mata Pelajaran', value: selectedSubject },
          { label: 'Semester', value: school.semester },
          { label: 'Tahun Ajaran', value: school.academicYear },
        ]}
      >
        <div className="p-4 space-y-4">
          <table className="w-full text-[10px] border border-slate-900 border-collapse print:border-black">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900 text-center">
                <th className="p-1 border border-slate-900 w-8">No</th>
                <th className="p-1 border border-slate-900 w-24">NISN / NIS</th>
                <th className="p-1 border border-slate-900 text-left min-w-[120px]">Nama Siswa</th>
                <th className="p-1 border border-slate-900 w-8">L/P</th>
                <th className="p-1 border border-slate-900 w-16">Rerata Tugas ({weights.Tugas}%)</th>
                <th className="p-1 border border-slate-900 w-14">Formatif ({weights.Harian}%)</th>
                <th className="p-1 border border-slate-900 w-14">Sumatif ({weights.Sumatif}%)</th>
                <th className="p-1 border border-slate-900 w-14">STS ({weights.STS}%)</th>
                <th className="p-1 border border-slate-900 w-14">SAS ({weights.SAS}%)</th>
                <th className="p-1 border border-slate-900 w-14 bg-slate-200 font-extrabold">NA</th>
                <th className="p-1 border border-slate-900 w-10">Pred.</th>
                <th className="p-1 border border-slate-900 text-center w-20">Ketercapaian</th>
              </tr>
            </thead>
            <tbody>
              {studentEvaluations.map((row) => (
                <tr key={row.student.id} className="border-b border-slate-900">
                  <td className="p-1 border border-slate-900 text-center font-mono">{row.no}</td>
                  <td className="p-1 border border-slate-900 text-center font-mono">{row.student.nisnNis || '-'}</td>
                  <td className="p-1 border border-slate-900 font-medium">{row.student.name}</td>
                  <td className="p-1 border border-slate-900 text-center">{row.student.gender}</td>
                  <td className="p-1 border border-slate-900 text-center font-mono font-semibold">
                    {row.rataRataTugas !== null
                      ? row.rataRataTugas.toFixed(1)
                      : row.typeAverages.Tugas !== null
                      ? Math.round(row.typeAverages.Tugas)
                      : '-'}
                  </td>
                  <td className="p-1 border border-slate-900 text-center font-mono">
                    {row.typeAverages.Harian !== null ? Math.round(row.typeAverages.Harian) : '-'}
                  </td>
                  <td className="p-1 border border-slate-900 text-center font-mono">
                    {row.typeAverages.Sumatif !== null ? Math.round(row.typeAverages.Sumatif) : '-'}
                  </td>
                  <td className="p-1 border border-slate-900 text-center font-mono">
                    {row.typeAverages.STS !== null ? Math.round(row.typeAverages.STS) : '-'}
                  </td>
                  <td className="p-1 border border-slate-900 text-center font-mono">
                    {row.typeAverages.SAS !== null ? Math.round(row.typeAverages.SAS) : '-'}
                  </td>
                  <td className="p-1 border border-slate-900 text-center font-mono font-bold bg-slate-100">
                    {row.finalScore !== null ? row.finalScore.toFixed(1) : '-'}
                  </td>
                  <td className="p-1 border border-slate-900 text-center font-bold">{row.predikat}</td>
                  <td className="p-1 border border-slate-900 text-center text-[9px] font-semibold">
                    {row.finalScore !== null ? (row.isPassing ? 'Tuntas' : 'Belum Tuntas') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintDocumentModal>
    </div>
  );
};
