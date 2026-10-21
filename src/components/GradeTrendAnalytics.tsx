import React, { useState, useMemo } from 'react';
import {
  Student,
  ClassRoom,
  GradeRecord,
  GradeType,
  SchoolProfile,
} from '../types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BookOpen,
  Users,
  Award,
  Filter,
  BarChart3,
  LineChart as LineChartIcon,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';

interface GradeTrendAnalyticsProps {
  grades: GradeRecord[];
  students: Student[];
  classes: ClassRoom[];
  school: SchoolProfile;
  initialClassId?: string;
  initialSubject?: string;
  onNavigateToLedger?: (classId: string) => void;
}

export const GradeTrendAnalytics: React.FC<GradeTrendAnalyticsProps> = ({
  grades,
  students,
  classes,
  school,
  initialClassId,
  initialSubject,
  onNavigateToLedger,
}) => {
  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || classes[0]?.id || 'all'
  );
  const [selectedSemester, setSelectedSemester] = useState<string>('all'); // 'all' | 'Ganjil' | 'Genap'
  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubject || 'all'
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all'); // 'all' or student id
  const [viewChartMode, setViewChartMode] = useState<
    'kronologis' | 'komparasi-semester' | 'antar-mapel' | 'komponen'
  >('kronologis');

  // List of unique subjects present in grades
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    grades.forEach((g) => {
      if (g.subject) set.add(g.subject.trim());
    });
    const arr = Array.from(set).sort();
    return arr.length > 0 ? arr : ['Matematika'];
  }, [grades]);

  // Students eligible for selected class
  const classStudents = useMemo(() => {
    if (selectedClassId === 'all') return students;
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Filtered grades according to selections
  const filteredGrades = useMemo(() => {
    return grades.filter((g) => {
      // Class filter
      if (selectedClassId !== 'all' && g.classId !== selectedClassId) return false;
      // Semester filter
      if (selectedSemester !== 'all' && g.semester !== selectedSemester) return false;
      // Subject filter
      if (selectedSubject !== 'all' && g.subject.toLowerCase() !== selectedSubject.toLowerCase()) return false;
      // Student filter
      if (selectedStudentId !== 'all' && g.studentId !== selectedStudentId) return false;
      return true;
    });
  }, [grades, selectedClassId, selectedSemester, selectedSubject, selectedStudentId]);

  // Selected student object if any
  const selectedStudentObj = useMemo(() => {
    if (selectedStudentId === 'all') return null;
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Selected class object
  const selectedClassObj = useMemo(() => {
    if (selectedClassId === 'all') return null;
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Calculate overall KPIs
  const kpis = useMemo(() => {
    if (filteredGrades.length === 0) {
      return {
        avgScore: 0,
        tuntasPercent: 0,
        tuntasCount: 0,
        totalEvaluated: 0,
        maxScore: 0,
        minScore: 0,
        countTugas: 0,
        countSumatif: 0,
        trendDelta: 0,
      };
    }

    const scores = filteredGrades.map((g) => g.score);
    const avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const tuntasCount = scores.filter((s) => s >= 75).length;
    const tuntasPercent = Math.round((tuntasCount / scores.length) * 100);

    const countTugas = filteredGrades.filter((g) => g.type === 'Tugas').length;
    const countSumatif = filteredGrades.filter((g) => g.type !== 'Tugas').length;

    // Calculate delta between Ganjil and Genap if applicable
    const ganjilGrades = filteredGrades.filter((g) => g.semester === 'Ganjil');
    const genapGrades = filteredGrades.filter((g) => g.semester === 'Genap');

    let trendDelta = 0;
    if (ganjilGrades.length > 0 && genapGrades.length > 0) {
      const avgGanjil = ganjilGrades.reduce((a, b) => a + b.score, 0) / ganjilGrades.length;
      const avgGenap = genapGrades.reduce((a, b) => a + b.score, 0) / genapGrades.length;
      trendDelta = Math.round((avgGenap - avgGanjil) * 10) / 10;
    } else if (scores.length >= 2) {
      // chronological delta first vs second half
      const half = Math.floor(filteredGrades.length / 2);
      const sorted = [...filteredGrades].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const earlyScores = sorted.slice(0, half).map((g) => g.score);
      const lateScores = sorted.slice(half).map((g) => g.score);
      if (earlyScores.length && lateScores.length) {
        const earlyAvg = earlyScores.reduce((a, b) => a + b, 0) / earlyScores.length;
        const lateAvg = lateScores.reduce((a, b) => a + b, 0) / lateScores.length;
        trendDelta = Math.round((lateAvg - earlyAvg) * 10) / 10;
      }
    }

    return {
      avgScore,
      tuntasPercent,
      tuntasCount,
      totalEvaluated: scores.length,
      maxScore,
      minScore,
      countTugas,
      countSumatif,
      trendDelta,
    };
  }, [filteredGrades]);

  // DATASET 1: Tren Kronologis per Asesmen / Tanggal
  const chronologicalTrendData = useMemo(() => {
    // Group grades by assessment session (subject + title + date + type + semester)
    // to calculate class average, and if a student is picked, that student's specific score
    const sessionMap = new Map<
      string,
      {
        key: string;
        title: string;
        shortTitle: string;
        date: string;
        semester: 'Ganjil' | 'Genap';
        subject: string;
        type: GradeType;
        scores: number[];
        studentScore: number | null;
      }
    >();

    const targetGrades = grades.filter((g) => {
      if (selectedClassId !== 'all' && g.classId !== selectedClassId) return false;
      if (selectedSemester !== 'all' && g.semester !== selectedSemester) return false;
      if (selectedSubject !== 'all' && g.subject.toLowerCase() !== selectedSubject.toLowerCase()) return false;
      return true;
    });

    targetGrades.forEach((g) => {
      const sessionKey = `${g.semester}-${g.subject}-${g.type}-${g.title}-${g.date}`;
      if (!sessionMap.has(sessionKey)) {
        const short = g.title.length > 20 ? g.title.slice(0, 18) + '...' : g.title;
        sessionMap.set(sessionKey, {
          key: sessionKey,
          title: g.title,
          shortTitle: `[${g.type}] ${short}`,
          date: g.date,
          semester: g.semester,
          subject: g.subject,
          type: g.type,
          scores: [],
          studentScore: null,
        });
      }

      const item = sessionMap.get(sessionKey)!;
      item.scores.push(g.score);

      if (selectedStudentId !== 'all' && g.studentId === selectedStudentId) {
        item.studentScore = g.score;
      }
    });

    // Convert to sorted array by date
    const sorted = Array.from(sessionMap.values()).sort((a, b) => {
      // primary: semester (Ganjil before Genap), secondary: date
      if (a.semester !== b.semester) {
        return a.semester === 'Ganjil' ? -1 : 1;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return sorted.map((item, idx) => {
      const avg = Math.round((item.scores.reduce((a, b) => a + b, 0) / item.scores.length) * 10) / 10;
      const min = Math.min(...item.scores);
      const max = Math.max(...item.scores);
      return {
        index: idx + 1,
        label: `${item.shortTitle} (${item.date.slice(5)})`,
        fullTitle: item.title,
        date: item.date,
        semester: item.semester,
        type: item.type,
        subject: item.subject,
        rataRataKelas: avg,
        rentangBawah: min,
        rentangAtas: max,
        kkm: 75,
        nilaiSiswa: item.studentScore,
        countSiswa: item.scores.length,
      };
    });
  }, [grades, selectedClassId, selectedSemester, selectedSubject, selectedStudentId]);

  // DATASET 2: Komparasi Semester Ganjil vs Semester Genap per Komponen Asesmen
  const semesterComponentComparison = useMemo(() => {
    const components: GradeType[] = ['Tugas', 'Harian', 'Sumatif', 'STS', 'SAS'];

    const targetGrades = grades.filter((g) => {
      if (selectedClassId !== 'all' && g.classId !== selectedClassId) return false;
      if (selectedSubject !== 'all' && g.subject.toLowerCase() !== selectedSubject.toLowerCase()) return false;
      if (selectedStudentId !== 'all' && g.studentId !== selectedStudentId) return false;
      return true;
    });

    return components.map((type) => {
      const ganjilScores = targetGrades
        .filter((g) => g.semester === 'Ganjil' && g.type === type)
        .map((g) => g.score);
      const genapScores = targetGrades
        .filter((g) => g.semester === 'Genap' && g.type === type)
        .map((g) => g.score);

      const avgGanjil =
        ganjilScores.length > 0
          ? Math.round((ganjilScores.reduce((a, b) => a + b, 0) / ganjilScores.length) * 10) / 10
          : null;

      const avgGenap =
        genapScores.length > 0
          ? Math.round((genapScores.reduce((a, b) => a + b, 0) / genapScores.length) * 10) / 10
          : null;

      const diff =
        avgGanjil !== null && avgGenap !== null
          ? Math.round((avgGenap - avgGanjil) * 10) / 10
          : null;

      return {
        komponen: type === 'Harian' ? 'Formatif' : type,
        komponenLabel:
          type === 'Tugas'
            ? 'Tugas Mandiri/Kelompok'
            : type === 'Harian'
            ? 'Formatif / Harian'
            : type === 'Sumatif'
            ? 'Sumatif TP'
            : type === 'STS'
            ? 'Sumatif Tengah (STS)'
            : 'Sumatif Akhir (SAS)',
        semesterGanjil: avgGanjil,
        semesterGenap: avgGenap,
        perubahan: diff,
        kkm: 75,
      };
    });
  }, [grades, selectedClassId, selectedSubject, selectedStudentId]);

  // DATASET 3: Perbandingan Rata-rata Nilai Antar Mata Pelajaran per Semester
  const subjectComparisonData = useMemo(() => {
    const targetGrades = grades.filter((g) => {
      if (selectedClassId !== 'all' && g.classId !== selectedClassId) return false;
      if (selectedStudentId !== 'all' && g.studentId !== selectedStudentId) return false;
      return true;
    });

    const subjects = availableSubjects;

    return subjects.map((subj) => {
      const ganjilScores = targetGrades
        .filter((g) => g.subject.toLowerCase() === subj.toLowerCase() && g.semester === 'Ganjil')
        .map((g) => g.score);
      const genapScores = targetGrades
        .filter((g) => g.subject.toLowerCase() === subj.toLowerCase() && g.semester === 'Genap')
        .map((g) => g.score);

      const avgGanjil =
        ganjilScores.length > 0
          ? Math.round((ganjilScores.reduce((a, b) => a + b, 0) / ganjilScores.length) * 10) / 10
          : 0;

      const avgGenap =
        genapScores.length > 0
          ? Math.round((genapScores.reduce((a, b) => a + b, 0) / genapScores.length) * 10) / 10
          : 0;

      const allScores = [...ganjilScores, ...genapScores];
      const avgTotal =
        allScores.length > 0
          ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
          : 0;

      return {
        mataPelajaran: subj,
        ganjil: avgGanjil || null,
        genap: avgGenap || null,
        gabungan: avgTotal || null,
        kkm: 75,
        totalAsesmen: allScores.length,
      };
    });
  }, [grades, availableSubjects, selectedClassId, selectedStudentId]);

  // DATASET 4: Distribusi Predikat Nilai (A, B, C, D)
  const predicateDistribution = useMemo(() => {
    const scores = filteredGrades.map((g) => g.score);
    let a = 0,
      b = 0,
      c = 0,
      d = 0;

    scores.forEach((s) => {
      if (s >= 90) a++;
      else if (s >= 80) b++;
      else if (s >= 75) c++;
      else d++;
    });

    const total = scores.length || 1;

    return [
      {
        predikat: 'A (Sangat Baik)',
        rentang: '90 - 100',
        jumlah: a,
        persen: Math.round((a / total) * 100),
        fill: '#10b981', // emerald
      },
      {
        predikat: 'B (Baik)',
        rentang: '80 - 89',
        jumlah: b,
        persen: Math.round((b / total) * 100),
        fill: '#6366f1', // indigo
      },
      {
        predikat: 'C (Cukup / KKM)',
        rentang: '75 - 79',
        jumlah: c,
        persen: Math.round((c / total) * 100),
        fill: '#f59e0b', // amber
      },
      {
        predikat: 'D (Perlu Bimbingan)',
        rentang: '< 75',
        jumlah: d,
        persen: Math.round((d / total) * 100),
        fill: '#ef4444', // rose/red
      },
    ];
  }, [filteredGrades]);

  // DATASET 5: Tabel Rekapitulasi Rinci Tren per Mapel & Semester
  const summaryTableRows = useMemo(() => {
    // Generate breakdown for each Subject x Semester combination
    const combinations: { subject: string; semester: 'Ganjil' | 'Genap' }[] = [];

    availableSubjects.forEach((subj) => {
      if (selectedSemester === 'all' || selectedSemester === 'Ganjil') {
        combinations.push({ subject: subj, semester: 'Ganjil' });
      }
      if (selectedSemester === 'all' || selectedSemester === 'Genap') {
        combinations.push({ subject: subj, semester: 'Genap' });
      }
    });

    return combinations
      .map(({ subject, semester }) => {
        const relevant = grades.filter((g) => {
          if (selectedClassId !== 'all' && g.classId !== selectedClassId) return false;
          if (selectedStudentId !== 'all' && g.studentId !== selectedStudentId) return false;
          return (
            g.subject.toLowerCase() === subject.toLowerCase() &&
            g.semester === semester
          );
        });

        if (relevant.length === 0) return null;

        const scores = relevant.map((g) => g.score);
        const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
        const tugas = relevant.filter((g) => g.type === 'Tugas').map((g) => g.score);
        const sumatif = relevant.filter((g) => g.type === 'Sumatif' || g.type === 'Harian').map((g) => g.score);
        const ujian = relevant.filter((g) => g.type === 'STS' || g.type === 'SAS').map((g) => g.score);

        const avgTugas = tugas.length ? Math.round(tugas.reduce((a, b) => a + b, 0) / tugas.length) : '-';
        const avgSumatif = sumatif.length ? Math.round(sumatif.reduce((a, b) => a + b, 0) / sumatif.length) : '-';
        const avgUjian = ujian.length ? Math.round(ujian.reduce((a, b) => a + b, 0) / ujian.length) : '-';

        const tuntas = scores.filter((s) => s >= 75).length;
        const tuntasRate = Math.round((tuntas / scores.length) * 100);

        let predikat = 'D';
        if (avg >= 90) predikat = 'A';
        else if (avg >= 80) predikat = 'B';
        else if (avg >= 75) predikat = 'C';

        return {
          subject,
          semester,
          count: relevant.length,
          avg,
          avgTugas,
          avgSumatif,
          avgUjian,
          tuntasRate,
          predikat,
        };
      })
      .filter(Boolean) as {
      subject: string;
      semester: 'Ganjil' | 'Genap';
      count: number;
      avg: number;
      avgTugas: number | string;
      avgSumatif: number | string;
      avgUjian: number | string;
      tuntasRate: number;
      predikat: string;
    }[];
  }, [availableSubjects, grades, selectedClassId, selectedSemester, selectedStudentId]);

  // Reset filters helper
  const handleResetFilters = () => {
    setSelectedClassId('all');
    setSelectedSemester('all');
    setSelectedSubject('all');
    setSelectedStudentId('all');
  };

  // Custom Recharts Tooltip for Chronological Chart
  const CustomChronologicalTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 p-3 rounded-xl shadow-xl text-xs border border-slate-700 dark:border-slate-200 min-w-[210px] space-y-1.5">
          <div className="border-b border-slate-700/80 dark:border-slate-200/80 pb-1.5">
            <span className="font-bold text-sm block">{data.fullTitle}</span>
            <div className="flex items-center gap-2 text-[11px] text-slate-300 dark:text-slate-600 font-mono mt-0.5">
              <span>{data.subject}</span>
              <span>·</span>
              <span>Semester {data.semester}</span>
              <span>·</span>
              <span>{data.date}</span>
            </div>
          </div>

          <div className="space-y-1 pt-1 font-mono tabular-nums">
            {data.nilaiSiswa !== null && data.nilaiSiswa !== undefined && (
              <div className="flex items-center justify-between font-bold text-indigo-400 dark:text-indigo-600">
                <span>Nilai Siswa:</span>
                <span className="text-sm">{data.nilaiSiswa}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-emerald-400 dark:text-emerald-600">
              <span>Rata-rata Kelas:</span>
              <span className="font-bold text-sm">{data.rataRataKelas}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Rentang Nilai (Min-Maks):</span>
              <span>{data.rentangBawah} - {data.rentangAtas}</span>
            </div>
            <div className="flex items-center justify-between text-amber-400 dark:text-amber-600 text-[11px]">
              <span>Batas KKM:</span>
              <span>75</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Visual Analytics Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Modul Analisis & Visualisasi Grafis</span>
              <span>·</span>
              <span>Kurikulum Merdeka e-Rapor</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Visualisasi Tren Nilai Siswa per Mata Pelajaran & Semester
            </h2>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Pantau progres belajar dan evolusi kompetensi siswa lintas tugas, ulangan harian, sumatif, dan ujian semester secara interaktif dengan visualisasi Recharts.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer border border-white/15"
              title="Cetak Laporan Tren Visualisasi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Analisis</span>
            </button>
            {onNavigateToLedger && selectedClassId !== 'all' && (
              <button
                onClick={() => onNavigateToLedger(selectedClassId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Buka Matriks Leger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTER & CONTROL TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Parameter Analisis & Filter Grafis</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Filter 1: Kelas */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Rombongan Belajar (Kelas)
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedStudentId('all'); // reset student when class changes
              }}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Rombel / Kelas ({classes.length})</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Kelas {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Mata Pelajaran */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Mata Pelajaran
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Mata Pelajaran ({availableSubjects.length})</option>
              {availableSubjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Semester */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Semester Akademik
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Semester (Ganjil & Genap)</option>
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          {/* Filter 4: Fokus Siswa / Kolektif */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Fokus Siswa / Benchmark
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Rata-rata Kelas / Semua Siswa</option>
              {classStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.nisnNis || 'Siswa'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewChartMode('kronologis')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewChartMode === 'kronologis'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Garis Tren Kronologis</span>
            </button>
            <button
              onClick={() => setViewChartMode('komparasi-semester')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewChartMode === 'komparasi-semester'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Komparasi Antar Semester</span>
            </button>
            <button
              onClick={() => setViewChartMode('antar-mapel')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewChartMode === 'antar-mapel'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Perbandingan Antar Mapel</span>
            </button>
            <button
              onClick={() => setViewChartMode('komponen')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewChartMode === 'komponen'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Distribusi Predikat</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            <span>Menampilkan data: </span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {filteredGrades.length} nilai asesmen
            </span>
            {selectedStudentObj && (
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                {' '}· Benchmark untuk {selectedStudentObj.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI STAT SUMMARY STRIP (Tabular Numerals, High Legibility) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Rata-rata Nilai */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span>Rata-rata Nilai</span>
            {kpis.trendDelta > 0 ? (
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                +{kpis.trendDelta}
              </span>
            ) : kpis.trendDelta < 0 ? (
              <span className="inline-flex items-center text-rose-600 dark:text-rose-400 text-[11px] font-bold">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                {kpis.trendDelta}
              </span>
            ) : (
              <span className="inline-flex items-center text-slate-400 text-[11px] font-medium">
                <Minus className="w-3.5 h-3.5 mr-0.5" />
                Stabil
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpis.avgScore > 0 ? kpis.avgScore : '-'}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>Batas KKM: 75</span>
            <span>·</span>
            <span className={kpis.avgScore >= 75 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
              {kpis.avgScore >= 75 ? 'Memenuhi KKM' : 'Di Bawah KKM'}
            </span>
          </div>
        </div>

        {/* Card 2: Ketuntasan Belajar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span>Ketuntasan Belajar (≥75)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpis.tuntasPercent}%
            </span>
            <span className="text-xs text-slate-400">tuntas</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                kpis.tuntasPercent >= 85
                  ? 'bg-emerald-500'
                  : kpis.tuntasPercent >= 70
                  ? 'bg-indigo-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${kpis.tuntasPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono tabular-nums">
            {kpis.tuntasCount} dari {kpis.totalEvaluated} nilai di atas batas tuntas
          </p>
        </div>

        {/* Card 3: Nilai Tertinggi & Terendah */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span>Sebaran Rentang Nilai</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center justify-between font-mono tabular-nums pt-1">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-sans">
                Tertinggi
              </span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {kpis.maxScore || '-'}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-sans">
                Terendah
              </span>
              <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                {kpis.minScore || '-'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
            Rentang deviasi: {kpis.maxScore && kpis.minScore ? kpis.maxScore - kpis.minScore : 0} poin
          </p>
        </div>

        {/* Card 4: Volume Asesmen & Komponen */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span>Komposisi Asesmen</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpis.totalEvaluated}
            </span>
            <span className="text-xs text-slate-400">total entri</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 space-x-2">
            <span>Tugas: <strong className="font-mono text-slate-700 dark:text-slate-200">{kpis.countTugas}</strong></span>
            <span>·</span>
            <span>Sumatif/Ujian: <strong className="font-mono text-slate-700 dark:text-slate-200">{kpis.countSumatif}</strong></span>
          </div>
        </div>
      </div>

      {/* MAIN CHART CONTAINER */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors space-y-4">
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-white">
              {viewChartMode === 'kronologis' && 'Grafik Tren Garis Perkembangan Nilai Kronologis'}
              {viewChartMode === 'komparasi-semester' && 'Komparasi Kinerja Nilai: Semester Ganjil vs Semester Genap'}
              {viewChartMode === 'antar-mapel' && 'Perbandingan Rata-rata Nilai Antar Mata Pelajaran per Semester'}
              {viewChartMode === 'komponen' && 'Distribusi Capaian Predikat & Ketercapaian Kompetensi'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {viewChartMode === 'kronologis' &&
                'Menampilkan alur waktu nilai dari tugas pertama, formatif harian, hingga STS dan SAS dengan garis benchmark KKM 75.'}
              {viewChartMode === 'komparasi-semester' &&
                'Bandingkan performa tiap komponen asesmen (Tugas, Formatif, Sumatif TP, STS, SAS) antar semester.'}
              {viewChartMode === 'antar-mapel' &&
                'Melihat perbandingan tingkat penguasaan siswa antar mata pelajaran di kelas terpilih.'}
              {viewChartMode === 'komponen' &&
                'Sebaran persentase predikat Sangat Baik (A), Baik (B), Cukup (C), dan Perlu Bimbingan (D).'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              {selectedStudentObj ? selectedStudentObj.name : 'Rata-rata Nilai'}
            </span>
            {selectedStudentObj && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Rata-rata Kelas
              </span>
            )}
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
              <span className="w-2.5 h-0.5 bg-amber-500" />
              Batas KKM (75)
            </span>
          </div>
        </div>

        {/* Dynamic Chart Display according to viewChartMode */}
        {viewChartMode === 'kronologis' && (
          <div className="w-full h-80 md:h-96">
            {chronologicalTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chronologicalTrendData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
                >
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    domain={[40, 100]}
                    tickCount={7}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomChronologicalTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <ReferenceLine
                    y={75}
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{
                      value: 'KKM 75',
                      position: 'insideBottomRight',
                      fill: '#d97706',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                  {/* Class average area & line */}
                  <Area
                    type="monotone"
                    dataKey="rataRataKelas"
                    name="Rata-rata Kelas"
                    stroke="#10b981"
                    strokeWidth={selectedStudentObj ? 2 : 3}
                    fillOpacity={1}
                    fill="url(#colorAvg)"
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                  {/* Selected student specific line if active */}
                  {selectedStudentObj && (
                    <Line
                      type="monotone"
                      dataKey="nilaiSiswa"
                      name={`Nilai: ${selectedStudentObj.name}`}
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-semibold">
                  Tidak ada data penilaian yang memenuhi kriteria filter saat ini.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}
          </div>
        )}

        {viewChartMode === 'komparasi-semester' && (
          <div className="w-full h-80 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={semesterComponentComparison}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis
                  dataKey="komponenLabel"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  domain={[50, 100]}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `${val ?? '-'} poin`,
                    name === 'semesterGanjil' ? 'Semester Ganjil' : 'Semester Genap',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    borderColor: '#334155',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                />
                <ReferenceLine
                  y={75}
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: 'KKM 75',
                    position: 'insideBottomRight',
                    fill: '#d97706',
                    fontSize: 10,
                  }}
                />
                <Bar
                  dataKey="semesterGanjil"
                  name="Semester Ganjil"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  dataKey="semesterGenap"
                  name="Semester Genap"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewChartMode === 'antar-mapel' && (
          <div className="w-full h-80 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectComparisonData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis
                  dataKey="mataPelajaran"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  domain={[50, 100]}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `${val ?? '-'} poin`,
                    name === 'ganjil'
                      ? 'Semester Ganjil'
                      : name === 'genap'
                      ? 'Semester Genap'
                      : 'Rata-rata Gabungan',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    borderColor: '#334155',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                />
                <ReferenceLine
                  y={75}
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: 'KKM 75',
                    position: 'insideBottomRight',
                    fill: '#d97706',
                    fontSize: 10,
                  }}
                />
                <Bar
                  dataKey="ganjil"
                  name="Semester Ganjil"
                  fill="#4f46e5"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="genap"
                  name="Semester Genap"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewChartMode === 'komponen' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={predicateDistribution}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis
                    dataKey="predikat"
                    type="category"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val} nilai`, 'Jumlah']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="jumlah" radius={[0, 6, 6, 0]} maxBarSize={32}>
                    {predicateDistribution.map((entry, index) => (
                      <Bar key={`cell-${index}`} dataKey="jumlah" fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                Keterangan Predikat Capaian Pembelajaran
              </h4>
              <div className="space-y-2 text-xs">
                {predicateDistribution.map((item) => (
                  <div
                    key={item.predikat}
                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 font-mono tabular-nums"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-100 font-sans">
                        {item.predikat}
                      </span>
                      <span className="text-[11px] text-slate-400">({item.rentang})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.jumlah} Siswa
                      </span>
                      <span className="text-[11px] text-slate-400">({item.persen}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUMMARY TABLE: REKAPITULASI ANALISIS TREN PER MATA PELAJARAN & SEMESTER */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors space-y-0">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">
              Tabel Rekapitulasi Rata-rata Nilai per Mata Pelajaran & Semester
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Rincian komparasi nilai per komponen tugas, sumatif harian, dan ujian semester
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {summaryTableRows.length} Baris Analisis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Mata Pelajaran</th>
                <th className="p-3.5">Semester</th>
                <th className="p-3.5 text-center">Jumlah Asesmen</th>
                <th className="p-3.5 text-center">Rata Tugas</th>
                <th className="p-3.5 text-center">Rata Formatif/Sumatif</th>
                <th className="p-3.5 text-center">Rata STS/SAS</th>
                <th className="p-3.5 text-center">Nilai Rata Akhir</th>
                <th className="p-3.5 text-center">Predikat</th>
                <th className="p-3.5 text-center">Ketuntasan (≥75)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {summaryTableRows.length > 0 ? (
                summaryTableRows.map((row, idx) => (
                  <tr
                    key={`${row.subject}-${row.semester}-${idx}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors font-mono tabular-nums"
                  >
                    <td className="p-3.5 font-bold font-sans text-slate-900 dark:text-white">
                      {row.subject}
                    </td>
                    <td className="p-3.5 font-sans">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Calendar className="w-3 h-3 text-indigo-500" />
                        Semester {row.semester}
                      </span>
                    </td>
                    <td className="p-3.5 text-center text-slate-600 dark:text-slate-400">
                      {row.count} Sesi
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                      {row.avgTugas}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                      {row.avgSumatif}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                      {row.avgUjian}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`font-extrabold text-sm ${row.avg >= 75 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {row.avg}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-sans font-bold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                          row.predikat === 'A'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : row.predikat === 'B'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : row.predikat === 'C'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {row.predikat}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`font-semibold ${
                          row.tuntasRate >= 80
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : row.tuntasRate >= 60
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {row.tuntasRate}% Tuntas
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                    Tidak ada data rekapitulasi penilaian untuk kriteria filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
