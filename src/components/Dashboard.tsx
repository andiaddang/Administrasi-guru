import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ClassRoom,
  Student,
  AttendanceRecord,
  GradeRecord,
  TeachingJournal,
  Schedule,
} from '../types';
import {
  Layers,
  Users,
  BookOpenCheck,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Percent,
} from 'lucide-react';

interface DashboardProps {
  classes: ClassRoom[];
  students: Student[];
  attendances: AttendanceRecord[];
  grades: GradeRecord[];
  journals: TeachingJournal[];
  schedules: Schedule[];
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  classes,
  students,
  attendances,
  grades,
  journals,
  schedules,
  onNavigateTab,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const gradeChartRef = useRef<HTMLCanvasElement | null>(null);
  const attendanceChartRef = useRef<HTMLCanvasElement | null>(null);
  const gradeChartInstance = useRef<any>(null);
  const attendanceChartInstance = useRef<any>(null);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    if (selectedClassId === 'all') return students;
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Overall attendance rate
  const attendanceStats = useMemo(() => {
    const relevantAttendances =
      selectedClassId === 'all'
        ? attendances
        : attendances.filter((a) => a.classId === selectedClassId);

    if (relevantAttendances.length === 0) return { rate: 100, total: 0, hadir: 0 };
    const hadir = relevantAttendances.filter((a) => a.status === 'HADIR').length;
    const rate = Math.round((hadir / relevantAttendances.length) * 100);
    return { rate, total: relevantAttendances.length, hadir };
  }, [attendances, selectedClassId]);

  // Calculate Student Average Grades for Ranking Chart
  const studentGradeRankings = useMemo(() => {
    const list = filteredStudents.map((student) => {
      const studentGrades = grades.filter((g) => g.studentId === student.id);
      if (studentGrades.length === 0) {
        return {
          id: student.id,
          name: student.name,
          avgScore: 0,
          count: 0,
          className: classes.find((c) => c.id === student.classId)?.name || '',
        };
      }
      const sum = studentGrades.reduce((acc, curr) => acc + curr.score, 0);
      const avg = Math.round((sum / studentGrades.length) * 10) / 10;
      return {
        id: student.id,
        name: student.name,
        avgScore: avg,
        count: studentGrades.length,
        className: classes.find((c) => c.id === student.classId)?.name || '',
      };
    });

    // Sort descending (Terbaik ke Terendah)
    return list
      .filter((item) => item.count > 0 || selectedClassId !== 'all')
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10); // Show top 10 for neat visual
  }, [filteredStudents, grades, classes, selectedClassId]);

  // Calculate Student Attendance Percentages for Attention Chart (Rendah ke Tertinggi)
  const studentAttendanceRankings = useMemo(() => {
    const list = filteredStudents.map((student) => {
      const records = attendances.filter((a) => a.studentId === student.id);
      if (records.length === 0) {
        return {
          id: student.id,
          name: student.name,
          percentage: 100,
          total: 0,
          alpa: 0,
          className: classes.find((c) => c.id === student.classId)?.name || '',
        };
      }
      const hadir = records.filter((r) => r.status === 'HADIR').length;
      const alpa = records.filter((r) => r.status === 'ALPA').length;
      const pct = Math.round((hadir / records.length) * 100);
      return {
        id: student.id,
        name: student.name,
        percentage: pct,
        total: records.length,
        alpa,
        className: classes.find((c) => c.id === student.classId)?.name || '',
      };
    });

    // Sort ascending (Rendah ke Tertinggi - agar yang butuh perhatian terlihat duluan)
    return list
      .filter((item) => item.total > 0)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 10);
  }, [filteredStudents, attendances, classes]);

  // Students requiring special attention (<75% attendance or avg < 70)
  const studentsNeedingAttention = useMemo(() => {
    return studentAttendanceRankings.filter((s) => s.percentage < 75 || s.alpa >= 2);
  }, [studentAttendanceRankings]);

  // Today's schedule
  const todayName = useMemo(() => {
    const dayIndex = new Date().getDay();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dayIndex];
  }, []);

  const todaySchedules = useMemo(() => {
    return schedules.filter(
      (s) => s.day.toLowerCase() === todayName.toLowerCase() || s.day === 'Senin'
    );
  }, [schedules, todayName]);

  // Render Charts with Chart.js
  useEffect(() => {
    const Chart = (window as any).Chart;
    if (!Chart) return;

    // 1. GRADE RANKING CHART (Bar Horizontal/Vertical)
    if (gradeChartRef.current) {
      if (gradeChartInstance.current) {
        gradeChartInstance.current.destroy();
      }

      const labels = studentGradeRankings.map((s) =>
        s.name.length > 18 ? s.name.substring(0, 16) + '...' : s.name
      );
      const dataValues = studentGradeRankings.map((s) => s.avgScore);

      const ctx = gradeChartRef.current.getContext('2d');
      if (ctx) {
        gradeChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Rata-rata Nilai',
                data: dataValues,
                backgroundColor: 'rgba(79, 70, 229, 0.85)',
                borderColor: 'rgb(67, 56, 202)',
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx: any) => ` Nilai: ${ctx.parsed.y} / 100`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                },
                grid: { color: 'rgba(226, 232, 240, 0.6)' },
              },
              x: {
                ticks: {
                  font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
                  maxRotation: 45,
                  minRotation: 25,
                },
                grid: { display: false },
              },
            },
          },
        });
      }
    }

    // 2. ATTENDANCE RATE CHART (Rendah ke Tertinggi)
    if (attendanceChartRef.current) {
      if (attendanceChartInstance.current) {
        attendanceChartInstance.current.destroy();
      }

      const labels = studentAttendanceRankings.map((s) =>
        s.name.length > 18 ? s.name.substring(0, 16) + '...' : s.name
      );
      const dataValues = studentAttendanceRankings.map((s) => s.percentage);
      const backgroundColors = dataValues.map((val) => {
        if (val < 60) return 'rgba(220, 38, 38, 0.85)'; // Red alert
        if (val < 80) return 'rgba(245, 158, 11, 0.85)'; // Amber warning
        return 'rgba(16, 185, 129, 0.85)'; // Emerald good
      });

      const ctx = attendanceChartRef.current.getContext('2d');
      if (ctx) {
        attendanceChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: '% Kehadiran',
                data: dataValues,
                backgroundColor: backgroundColors,
                borderRadius: 4,
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx: any) => ` Kehadiran: ${ctx.parsed.y}%`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: (val: any) => `${val}%`,
                  font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                },
                grid: { color: 'rgba(226, 232, 240, 0.6)' },
              },
              x: {
                ticks: {
                  font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
                  maxRotation: 45,
                  minRotation: 25,
                },
                grid: { display: false },
              },
            },
          },
        });
      }
    }

    return () => {
      if (gradeChartInstance.current) gradeChartInstance.current.destroy();
      if (attendanceChartInstance.current) attendanceChartInstance.current.destroy();
    };
  }, [studentGradeRankings, studentAttendanceRankings]);

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Administrasi Guru
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ikhtisar komprehensif pembelajaran, nilai capaian, dan presensi siswa
          </p>
        </div>

        {/* Filter Kelas */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Filter Kelas:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Kelas ({classes.length})</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({students.filter((s) => s.classId === cls.id).length} Siswa)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Kelas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Kelas Diampu</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
              {classes.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tingkat X, XI, XII</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Total Siswa */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Siswa Aktif</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
              {filteredStudents.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {selectedClassId === 'all' ? 'Keseluruhan kelas' : 'Kelas terpilih'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Jurnal */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Jurnal Mengajar</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
              {journals.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Pertemuan terlaksana</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <BookOpenCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Rata-rata Kehadiran */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Rerata Presensi</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
              {attendanceStats.rate}%
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {attendanceStats.hadir} hadir dari {attendanceStats.total} catatan
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-700 mr-1">Aksi Cepat Guru:</span>
        <button
          onClick={() => onNavigateTab('attendance')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Input Presensi Hari Ini
        </button>
        <button
          onClick={() => onNavigateTab('grades')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Input Nilai Massal
        </button>
        <button
          onClick={() => onNavigateTab('journals')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
        >
          <BookOpenCheck className="w-3.5 h-3.5" />
          Buat Jurnal Baru
        </button>
      </div>

      {/* Alert Perhatian Khusus jika ada siswa presensi rendah */}
      {studentsNeedingAttention.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Peringatan Dini: Siswa Butuh Perhatian Khusus ({studentsNeedingAttention.length} Siswa)
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Siswa berikut memiliki tingkat kehadiran di bawah batas minimum (75%) atau tercatat alpa berulang:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {studentsNeedingAttention.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded-md text-xs font-medium text-amber-900"
                  >
                    <span>{s.name}</span>
                    <span className="font-mono font-bold text-red-600">({s.percentage}%)</span>
                    <span className="text-[10px] text-slate-500">· {s.className}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Ranking Nilai Siswa (Terbaik ke Terendah) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Peringkat Capaian Nilai Siswa
              </h2>
              <p className="text-[11px] text-slate-500">
                Diurutkan dari nilai rerata terbaik ke terendah
              </p>
            </div>
            <span className="text-[11px] font-mono text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
              Skala 0 - 100
            </span>
          </div>

          <div className="h-64 relative w-full">
            {studentGradeRankings.length > 0 ? (
              <canvas ref={gradeChartRef} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada data nilai pada kelas ini
              </div>
            )}
          </div>
        </div>

        {/* Chart B: Persentase Kehadiran (Rendah ke Tertinggi) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Deteksi Presensi Kehadiran Siswa
              </h2>
              <p className="text-[11px] text-slate-500">
                Diurutkan dari persentase kehadiran terendah (deteksi perhatian khusus)
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="inline-block w-2.5 h-2.5 rounded-xs bg-red-600"></span>
              <span>&lt;60%</span>
              <span className="inline-block w-2.5 h-2.5 rounded-xs bg-amber-500"></span>
              <span>60-80%</span>
              <span className="inline-block w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
              <span>&gt;80%</span>
            </div>
          </div>

          <div className="h-64 relative w-full">
            {studentAttendanceRankings.length > 0 ? (
              <canvas ref={attendanceChartRef} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada data presensi pada kelas ini
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Jadwal Hari Ini & Jurnal Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jadwal Hari Ini */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-800">
                Jadwal Mengajar ({todayName})
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('schedules')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              Lihat Semua
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todaySchedules.length > 0 ? (
            <div className="space-y-2.5">
              {todaySchedules.map((sch) => {
                const cls = classes.find((c) => c.id === sch.classId);
                return (
                  <div
                    key={sch.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{sch.subject}</p>
                      <p className="text-[11px] text-slate-500">
                        {cls?.name || 'Kelas'} · {sch.room}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {sch.timeStart} - {sch.timeEnd}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">
              Tidak ada agenda tatap muka hari ini.
            </p>
          )}
        </div>

        {/* Jurnal Terakhir */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <BookOpenCheck className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-800">Catatan Jurnal Mengajar Terakhir</h2>
            </div>
            <button
              onClick={() => onNavigateTab('journals')}
              className="text-xs text-sky-600 hover:text-sky-800 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              Kelola Jurnal
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {journals.length > 0 ? (
            <div className="space-y-3">
              {journals.slice(0, 2).map((j) => {
                const cls = classes.find((c) => c.id === j.classId);
                return (
                  <div key={j.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800">{j.subject} - {cls?.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{j.date}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{j.topic}</p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {j.learningActivities}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">
              Belum ada catatan jurnal.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
