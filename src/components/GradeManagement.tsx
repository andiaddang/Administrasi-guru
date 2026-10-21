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
}

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

  // Mata Pelajaran Pengampu
  const defaultSubject = currentUser?.subject?.split('&')[0]?.trim() || 'Matematika';
  const [selectedSubject] = useState<string>(defaultSubject);

  // 2. BOBOT KOMPONEN PENILAIAN (HARUS 100%)
  const [weights, setWeights] = useState<Record<GradeType, number>>(DEFAULT_WEIGHTS);
  const [isWeightSettingsOpen, setIsWeightSettingsOpen] = useState<boolean>(false);

  // 3. KOLOM PENILAIAN DINAMIS (TAMBAH & HAPUS TUGAS)
  const [customColumns, setCustomColumns] = useState<AssessmentColumn[]>([]);

  // 4. DATA NILAI SISWA (studentId -> colKey -> score)
  const [tableScores, setTableScores] = useState<Record<string, Record<string, number | ''>>>({});

  // 5. STATUS SIMPAN & AUTO-SAVE
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 6. MODAL & VIEW EKSTRA
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState<boolean>(false);
  const [newColType, setNewColType] = useState<GradeType>('Tugas');
  const [newColTitle, setNewColTitle] = useState<string>('');
  const [newColDate, setNewColDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [showTrendChart, setShowTrendChart] = useState<boolean>(false);

  // Toast Notifikasi
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Kelas Terpilih
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  // Daftar Siswa Kelas Terpilih
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Siswa Hasil Filter Pencarian
  const filteredStudents = useMemo(() => {
    if (!searchStudent.trim()) return classStudents;
    const q = searchStudent.toLowerCase();
    return classStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nisnNis && s.nisnNis.toLowerCase().includes(q))
    );
  }, [classStudents, searchStudent]);

  // Kolom Penilaian dari Database
  const savedColumns = useMemo<AssessmentColumn[]>(() => {
    const map = new Map<string, AssessmentColumn>();
    const classGrades = grades.filter((g) => g.classId === selectedClassId);

    classGrades.forEach((g) => {
      const cleanTitle = (g.title || 'Penilaian').trim();
      const cleanDate = (g.date || '').trim();
      const key = `${g.type}__${cleanTitle.toLowerCase()}__${cleanDate}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          type: g.type,
          title: cleanTitle,
          date: cleanDate,
          maxScore: g.maxScore || 100,
          subject: g.subject || selectedSubject,
        });
      }
    });

    const typeOrder: Record<GradeType, number> = {
      Tugas: 1,
      Harian: 2,
      Sumatif: 3,
      STS: 4,
      SAS: 5,
    };

    return Array.from(map.values()).sort((a, b) => {
      const diff = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      if (diff !== 0) return diff;
      return a.date.localeCompare(b.date);
    });
  }, [grades, selectedClassId, selectedSubject]);

  const typeOrder: Record<GradeType, number> = {
    Tugas: 1,
    Harian: 2,
    Sumatif: 3,
    STS: 4,
    SAS: 5,
  };

  // Gabungan Kolom Tersimpan + Kolom Baru Ditambahkan (Tugas selalu di depan)
  const allColumns = useMemo<AssessmentColumn[]>(() => {
    const list = [...savedColumns];
    customColumns.forEach((custom) => {
      if (!list.some((existing) => existing.key === custom.key)) {
        list.push(custom);
      }
    });
    return list.sort((a, b) => {
      const diff = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      if (diff !== 0) return diff;
      return a.date.localeCompare(b.date);
    });
  }, [savedColumns, customColumns]);

  // Kolom Penilaian Khusus Tugas
  const tugasColumns = useMemo(() => {
    return allColumns.filter((col) => col.type === 'Tugas');
  }, [allColumns]);

  // Tampilkan kolom akumulasi tugas bila filter 'all' atau 'Tugas'
  const shouldShowAvgTugasCol = assessmentTypeFilter === 'all' || assessmentTypeFilter === 'Tugas';

  // Kolom yang Ditampilkan Berdasarkan Filter Jenis Penilaian
  const displayColumns = useMemo<AssessmentColumn[]>(() => {
    if (assessmentTypeFilter === 'all') {
      return allColumns;
    }
    return allColumns.filter((col) => col.type === assessmentTypeFilter);
  }, [allColumns, assessmentTypeFilter]);

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

  // PERHITUNGAN NILAI AKHIR OTOMATIS & OBJEKTIF
  // Ketentuan Utama: "Nilai yang belum diinput tidak boleh otomatis dianggap nol."
  const studentEvaluations = useMemo(() => {
    return classStudents.map((student, idx) => {
      const studentScores = tableScores[student.id] || {};

      const typeScores: Record<GradeType, number[]> = {
        Tugas: [],
        Harian: [],
        Sumatif: [],
        STS: [],
        SAS: [],
      };

      let filledCount = 0;
      allColumns.forEach((col) => {
        const val = studentScores[col.key];
        if (typeof val === 'number' && !isNaN(val)) {
          typeScores[col.type].push(val);
          filledCount++;
        }
      });

      // Hitung khusus akumulasi Tugas (termasuk nilai kosong yang dihitung 0):
      // "langsung akumulasikan tugas yang ada termasuk nilai kosong dengan menjumlah seluruh nilai tugas dan membagi jumlah tugas ada"
      const totalTugasCount = tugasColumns.length;
      let sumTugasWithZero = 0;
      let submittedTugasCount = 0;

      tugasColumns.forEach((col) => {
        const val = studentScores[col.key];
        if (typeof val === 'number' && !isNaN(val)) {
          sumTugasWithZero += val;
          submittedTugasCount++;
        }
      });

      const rataRataTugas = totalTugasCount > 0
        ? Math.round((sumTugasWithZero / totalTugasCount) * 10) / 10
        : null;

      // Rata-rata per jenis penilaian: untuk Tugas gunakan akumulasi rata-rata tugas (kosong dihitung 0) sebagai bobot ke Nilai Akhir
      const typeAverages: Record<GradeType, number | null> = {
        Tugas: rataRataTugas,
        Harian: typeScores.Harian.length > 0
          ? typeScores.Harian.reduce((a, b) => a + b, 0) / typeScores.Harian.length
          : null,
        Sumatif: typeScores.Sumatif.length > 0
          ? typeScores.Sumatif.reduce((a, b) => a + b, 0) / typeScores.Sumatif.length
          : null,
        STS: typeScores.STS.length > 0
          ? typeScores.STS[typeScores.STS.length - 1]
          : null,
        SAS: typeScores.SAS.length > 0
          ? typeScores.SAS[typeScores.SAS.length - 1]
          : null,
      };

      // Hitung nilai akhir dengan bobot komponen yang aktif
      let weightedSum = 0;
      let activeWeightsSum = 0;

      (Object.keys(typeAverages) as GradeType[]).forEach((type) => {
        const avg = typeAverages[type];
        if (avg !== null) {
          const w = weights[type] || 0;
          weightedSum += avg * w;
          activeWeightsSum += w;
        }
      });

      let finalScore: number | null = null;
      if (activeWeightsSum > 0) {
        // Dinormalisasi ke bobot aktif sehingga komponen belum terbit TIDAK menjadi nol!
        finalScore = Math.round((weightedSum / activeWeightsSum) * 10) / 10;
      }

      const isComplete = allColumns.length > 0 && filledCount === allColumns.length;
      const isPassing = finalScore !== null ? finalScore >= 75 : false;

      let predikat = '-';
      if (finalScore !== null) {
        if (finalScore >= 90) predikat = 'A';
        else if (finalScore >= 80) predikat = 'B';
        else if (finalScore >= 70) predikat = 'C';
        else predikat = 'D';
      }

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
        rataRataTugas,
        sumTugasWithZero,
        submittedTugasCount,
        totalTugasCount,
      };
    });
  }, [classStudents, tableScores, allColumns, weights, tugasColumns]);

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
        totalTugasCount: tugasColumns.length,
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
      totalTugasCount: tugasColumns.length,
    };
  }, [studentEvaluations, tugasColumns.length]);

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

  // Tambah Tugas/Komponen Penilaian Baru
  const handleCreateNewColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) {
      alert('Silakan isi deskripsi materi atau judul tugas.');
      return;
    }

    const cleanTitle = newColTitle.trim();
    const cleanDate = newColDate || new Date().toISOString().slice(0, 10);
    const key = `${newColType}__${cleanTitle.toLowerCase()}__${cleanDate}`;

    if (allColumns.some((c) => c.key === key)) {
      alert('Komponen penilaian dengan judul dan tanggal yang sama sudah ada.');
      return;
    }

    const newCol: AssessmentColumn = {
      key,
      type: newColType,
      title: cleanTitle,
      date: cleanDate,
      maxScore: 100,
      subject: selectedSubject,
    };

    setCustomColumns((prev) => [...prev, newCol]);
    setIsAddColumnModalOpen(false);
    setNewColTitle('');
    setIsDirty(true);
    showToast(`Komponen [${GRADE_TYPE_SHORT[newColType]}] "${cleanTitle}" berhasil ditambahkan ke tabel.`);
  };

  // Hapus Komponen Penilaian dari Tabel & Database
  const handleDeleteColumn = (col: AssessmentColumn) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus komponen penilaian:\n\n` +
      `[${GRADE_TYPE_LABELS[col.type]}]\n"${col.title}" (Tanggal: ${col.date})?\n\n` +
      `Semua nilai siswa pada kolom ini akan dihapus.`
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

    setCustomColumns((prev) => prev.filter((c) => c.key !== col.key));

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
    showToast(`Komponen "${col.title}" berhasil dihapus.`);
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

      {/* BILAH AKSI: TAMBAH TUGAS / KOMPONEN BARU */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Kolom Penilaian Aktif:
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
            {displayColumns.length} Komponen Asesmen
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1.5">
            <span>Rata-Rata Tugas Akumulasi: {tugasColumns.length} Tugas (Bobot ke Nilai Akhir: {weights.Tugas}%)</span>
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
            onClick={() => setIsAddColumnModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Komponen / Tugas Baru</span>
          </button>
        </div>
      </div>

      {/* TABEL INPUT NILAI MASSAL */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[750px] relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800/90 sticky top-0 z-20 backdrop-blur-md shadow-xs">
              <tr className="border-b border-slate-200 dark:border-slate-700 divide-x divide-slate-200 dark:divide-slate-700">
                {/* 1. Nomor */}
                <th className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-200 w-12 sticky left-0 z-30 bg-slate-100 dark:bg-slate-800">
                  No.
                </th>

                {/* 2. NISN / NIS */}
                <th className="py-3 px-3 font-bold text-slate-700 dark:text-slate-200 w-32 sticky left-12 z-30 bg-slate-100 dark:bg-slate-800">
                  NISN / NIS
                </th>

                {/* 3. Nama Siswa */}
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200 min-w-[200px] sticky left-44 z-30 bg-slate-100 dark:bg-slate-800 shadow-r">
                  Nama Siswa ({filteredStudents.length})
                </th>

                {/* Kolom Tugas & Penilaian Dinamis */}
                {displayColumns.map((col) => (
                  <th
                    key={col.key}
                    className="py-3 px-3 min-w-[170px] max-w-[220px] font-bold text-slate-800 dark:text-slate-100 align-top group"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeBadge(
                            col.type
                          )}`}
                        >
                          {GRADE_TYPE_SHORT[col.type]}
                        </span>
                        <div
                          className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2"
                          title={col.title}
                        >
                          {col.title}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                          Tgl: {col.date || '-'}
                        </div>
                      </div>

                      {/* Tombol Hapus Tugas / Komponen */}
                      <button
                        type="button"
                        onClick={() => handleDeleteColumn(col)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                        title={`Hapus komponen "${col.title}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                ))}

                {/* Kolom Khusus RATA-RATA TUGAS (Samping Kiri / Sebelum Nilai Akhir) */}
                <th className="py-3 px-3.5 font-bold text-center bg-sky-50 dark:bg-sky-950/70 border-x-2 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100 min-w-[150px] max-w-[190px] shadow-xs">
                  <div className="space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-sky-200 dark:bg-sky-800 text-sky-900 dark:text-sky-100 border border-sky-300 dark:border-sky-700 uppercase tracking-wider">
                      BOBOT TUGAS ({weights.Tugas}%)
                    </span>
                    <div className="font-black text-xs text-sky-950 dark:text-sky-100 leading-tight uppercase tracking-tight">
                      RATA-RATA TUGAS
                    </div>
                    <div className="text-[10px] text-sky-700 dark:text-sky-300 font-bold">
                      {tugasColumns.length > 0 ? `Σ Nilai ÷ ${tugasColumns.length} Tugas` : 'Belum Ada Tugas'}
                    </div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">
                      (Kosong dihitung 0)
                    </div>
                  </div>
                </th>

                {/* Nilai Akhir Otomatis */}
                <th className="py-3 px-4 font-bold text-center text-indigo-700 dark:text-indigo-300 min-w-[125px] bg-indigo-50/70 dark:bg-indigo-950/40">
                  <div className="leading-tight font-extrabold text-sm">Nilai Akhir</div>
                  <div className="text-[10px] text-indigo-500 font-normal">Bobot Aktif (Termasuk Tugas)</div>
                </th>

                {/* Predikat & Ketercapaian */}
                <th className="py-3 px-3 font-bold text-center text-slate-700 dark:text-slate-200 min-w-[110px]">
                  Ketercapaian
                </th>

                {/* Status Kelengkapan Nilai */}
                <th className="py-3 px-4 font-bold text-center text-slate-700 dark:text-slate-200 min-w-[150px]">
                  Kelengkapan Nilai
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayColumns.length + 7}
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
                        <td className="py-2.5 px-4 sticky left-44 z-10 bg-white dark:bg-slate-900 shadow-r">
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

                        {/* Input Nilai Komponen Asesmen */}
                        {displayColumns.map((col) => {
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
                        })}

                        {/* Kolom Khusus RATA-RATA TUGAS (Samping Kiri / Sebelum Nilai Akhir) */}
                        <td className="py-2.5 px-3 text-center bg-sky-50/60 dark:bg-sky-950/30 border-x-2 border-sky-200 dark:border-sky-900/60 font-mono">
                          {evalItem.rataRataTugas !== null ? (
                            <div className="space-y-0.5">
                              <div className="inline-flex items-center justify-center">
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-xs font-black shadow-xs ${
                                    evalItem.rataRataTugas >= 75
                                      ? 'bg-sky-100 dark:bg-sky-900/80 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-700'
                                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                  }`}
                                  title={`Total Nilai: ${evalItem.sumTugasWithZero} dari ${evalItem.totalTugasCount} tugas (Nilai kosong dihitung 0, Masuk ke Bobot Nilai Akhir: ${weights.Tugas}%)`}
                                >
                                  {evalItem.rataRataTugas.toFixed(1)}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-medium">
                                {evalItem.submittedTugasCount}/{evalItem.totalTugasCount} tugas kumpul
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>

                        {/* Nilai Akhir Otomatis (Menggunakan Rata-Rata Tugas Sebagai Bobot Tugas) */}
                        <td className="py-2.5 px-4 text-center bg-indigo-50/30 dark:bg-indigo-950/20 font-bold">
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
            <span className="font-bold text-slate-800 dark:text-slate-200">{displayColumns.length}</span> kolom komponen penilaian{' '}
            (<span className="font-bold text-sky-600 dark:text-sky-400">+ Kolom Khusus Rata-Rata Tugas sebelum Nilai Akhir</span>).
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

      {/* MODAL: TAMBAH KOMPONEN / TUGAS BARU */}
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
                    Tambah Komponen Penilaian Baru
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
                  Jenis Penilaian
                </label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as GradeType)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Tugas">Tugas Mandiri / Kelompok (Bobot: {weights.Tugas}%)</option>
                  <option value="Harian">Formatif / Ulangan Harian (Bobot: {weights.Harian}%)</option>
                  <option value="Sumatif">Sumatif Lingkup Materi TP (Bobot: {weights.Sumatif}%)</option>
                  <option value="STS">Sumatif Tengah Semester STS (Bobot: {weights.STS}%)</option>
                  <option value="SAS">Sumatif Akhir Semester SAS (Bobot: {weights.SAS}%)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Materi / Judul Tugas
                </label>
                <input
                  type="text"
                  required
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="Contoh: Tugas 3: SPLDV & Matriks Invers"
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
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
                  <span>Tambahkan ke Tabel</span>
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
