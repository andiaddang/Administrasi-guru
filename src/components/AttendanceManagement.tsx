import React, { useState, useMemo } from 'react';
import {
  Student,
  ClassRoom,
  AttendanceRecord,
  AttendanceStatus,
  SchoolProfile,
  User,
} from '../types';
import {
  CheckSquare,
  Calendar,
  Save,
  Sparkles,
  Info,
  CheckCircle,
  Clock,
  FileText,
  Users,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Filter,
  X,
  PieChart,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CalendarDays,
  ArrowRight,
  Eye,
  RotateCcw,
} from 'lucide-react';

interface AttendanceManagementProps {
  students: Student[];
  classes: ClassRoom[];
  attendances: AttendanceRecord[];
  onSaveAttendances: (records: AttendanceRecord[]) => void;
  school: SchoolProfile;
  currentUser: User | null;
}

export const AttendanceManagement: React.FC<AttendanceManagementProps> = ({
  students,
  classes,
  attendances,
  onSaveAttendances,
  school,
  currentUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'rekap'>('input');

  // Unified class selection state (automatically synced between input and rekap)
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  // Local state for daily input: studentId -> { status: AttendanceStatus, notes: string }
  const [dailyForm, setDailyForm] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  // Rekap month filter & Calendar active month (Synced bidirectionally)
  const [rekapMonth, setRekapMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // 'YYYY-MM'
  );
  const [calendarMonth, setCalendarMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  // Toggle calendar visibility
  const [showCalendar, setShowCalendar] = useState<boolean>(true);

  // Date to delete confirmation modal state
  const [dateToDeleteConfirm, setDateToDeleteConfirm] = useState<string | null>(null);

  // Current class students
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Synchronized date change handler
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const month = newDate.slice(0, 7);
    if (month) {
      setRekapMonth(month);
      setCalendarMonth(month);
    }
  };

  // Synchronized month change handler
  const handleMonthChange = (newMonth: string) => {
    setRekapMonth(newMonth);
    setCalendarMonth(newMonth);
    // Sync selectedDate to this month
    if (!selectedDate.startsWith(newMonth)) {
      const today = new Date().toISOString().slice(0, 10);
      if (today.startsWith(newMonth)) {
        setSelectedDate(today);
      } else {
        setSelectedDate(`${newMonth}-01`);
      }
    }
  };

  // Select date directly from calendar cell
  const handleSelectCalendarDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const m = dateStr.slice(0, 7);
    setRekapMonth(m);
    setCalendarMonth(m);
  };

  // Calendar month navigation
  const handlePrevMonth = () => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setCalendarMonth(newMonthStr);
    setRekapMonth(newMonthStr);
  };

  const handleNextMonth = () => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setCalendarMonth(newMonthStr);
    setRekapMonth(newMonthStr);
  };

  const handleGoToToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayMonth = today.slice(0, 7);
    setCalendarMonth(todayMonth);
    setRekapMonth(todayMonth);
    setSelectedDate(today);
  };

  // Helper formatting Indonesian full date
  const formatIndonesianDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(y, m - 1, d));
    } catch {
      return dateStr;
    }
  };

  // Check if attendance is already saved for selected date & class
  const isDateSaved = useMemo(() => {
    return attendances.some(
      (a) => a.classId === selectedClassId && a.date === selectedDate
    );
  }, [attendances, selectedClassId, selectedDate]);

  // Statistics for saved date
  const savedDateStats = useMemo(() => {
    if (!isDateSaved) return null;
    const records = attendances.filter(
      (a) => a.classId === selectedClassId && a.date === selectedDate
    );
    const hadir = records.filter((r) => r.status === 'HADIR').length;
    const izin = records.filter((r) => r.status === 'IZIN').length;
    const sakit = records.filter((r) => r.status === 'SAKIT').length;
    const alpa = records.filter((r) => r.status === 'ALPA').length;
    const total = records.length;
    const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { total, hadir, izin, sakit, alpa, pct };
  }, [attendances, selectedClassId, selectedDate, isDateSaved]);

  // Load existing records for selected class & date into dailyForm
  React.useEffect(() => {
    const existingRecords = attendances.filter(
      (a) => a.classId === selectedClassId && a.date === selectedDate
    );
    const initialMap: Record<string, { status: AttendanceStatus; notes: string }> = {};

    classStudents.forEach((student) => {
      const found = existingRecords.find((r) => r.studentId === student.id);
      if (found) {
        initialMap[student.id] = { status: found.status, notes: found.notes || '' };
      } else {
        // default to HADIR for convenience
        initialMap[student.id] = { status: 'HADIR', notes: '' };
      }
    });

    setDailyForm(initialMap);
  }, [selectedClassId, selectedDate, classStudents, attendances]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setDailyForm((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setDailyForm((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  const handleSetAllHadir = () => {
    const newForm: Record<string, { status: AttendanceStatus; notes: string }> = {};
    classStudents.forEach((s) => {
      newForm[s.id] = {
        status: 'HADIR',
        notes: dailyForm[s.id]?.notes || '',
      };
    });
    setDailyForm(newForm);
  };

  const handleSaveDaily = () => {
    // Generate new list of records
    const otherRecords = attendances.filter(
      (a) => !(a.classId === selectedClassId && a.date === selectedDate)
    );

    const updatedCurrent: AttendanceRecord[] = classStudents.map((s) => {
      const data = dailyForm[s.id] || { status: 'HADIR', notes: '' };
      return {
        id: `att-${selectedDate}-${s.id}`,
        date: selectedDate,
        classId: selectedClassId,
        studentId: s.id,
        status: data.status,
        notes: data.notes,
      };
    });

    onSaveAttendances([...otherRecords, ...updatedCurrent]);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Delete attendance records for a specific date
  const handleDeleteDateAttendance = (dateToDelete: string) => {
    const remaining = attendances.filter(
      (a) => !(a.classId === selectedClassId && a.date === dateToDelete)
    );
    onSaveAttendances(remaining);

    // If the deleted date is the currently selected date, reset dailyForm to default
    if (dateToDelete === selectedDate) {
      const resetMap: Record<string, { status: AttendanceStatus; notes: string }> = {};
      classStudents.forEach((student) => {
        resetMap[student.id] = { status: 'HADIR', notes: '' };
      });
      setDailyForm(resetMap);
    }

    setDeleteSuccessMsg(`Data presensi tanggal ${dateToDelete} berhasil dihapus.`);
    setTimeout(() => setDeleteSuccessMsg(null), 3500);
    setDateToDeleteConfirm(null);
  };

  // Calendar Days calculation for the active calendar month
  const calendarDaysData = useMemo(() => {
    const [year, month] = calendarMonth.split('-').map(Number);
    if (!year || !month) return { days: [], paddingStart: 0, monthName: '' };

    const daysInMonth = new Date(year, month, 0).getDate();
    // Monday as start of week: 0 = Mon, 6 = Sun
    const firstDayJs = new Date(year, month - 1, 1).getDay();
    const paddingStart = (firstDayJs + 6) % 7;

    const todayStr = new Date().toISOString().slice(0, 10);

    const days = [];
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dayStr = String(dayNum).padStart(2, '0');
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${dayStr}`;

      const records = attendances.filter(
        (a) => a.classId === selectedClassId && a.date === dateStr
      );
      const hasRecorded = records.length > 0;
      const hadir = records.filter((r) => r.status === 'HADIR').length;
      const izin = records.filter((r) => r.status === 'IZIN').length;
      const sakit = records.filter((r) => r.status === 'SAKIT').length;
      const alpa = records.filter((r) => r.status === 'ALPA').length;
      const total = records.length;
      const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;

      days.push({
        dayNum,
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        hasRecorded,
        hadir,
        izin,
        sakit,
        alpa,
        total,
        pct,
      });
    }

    const monthName = new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, 1));

    return { days, paddingStart, monthName };
  }, [calendarMonth, attendances, selectedClassId, selectedDate]);

  // List of recorded dates in this month for Rekap Bulanan overview
  const recordedDatesInMonth = useMemo(() => {
    const monthRecords = attendances.filter(
      (a) => a.classId === selectedClassId && a.date.startsWith(rekapMonth)
    );
    const dateMap = new Map<string, AttendanceRecord[]>();
    monthRecords.forEach((r) => {
      const list = dateMap.get(r.date) || [];
      list.push(r);
      dateMap.set(r.date, list);
    });

    return Array.from(dateMap.entries())
      .map(([date, recs]) => {
        const hadir = recs.filter((r) => r.status === 'HADIR').length;
        const izin = recs.filter((r) => r.status === 'IZIN').length;
        const sakit = recs.filter((r) => r.status === 'SAKIT').length;
        const alpa = recs.filter((r) => r.status === 'ALPA').length;
        const total = recs.length;
        const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;
        return { date, hadir, izin, sakit, alpa, total, pct };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [attendances, selectedClassId, rekapMonth]);

  // Filter for daily table: 'ALL' or a specific status
  const [dailyStatusFilter, setDailyStatusFilter] = useState<'ALL' | AttendanceStatus>('ALL');

  // Live daily recap calculations directly computed from dailyForm and classStudents
  const dailyRecap = useMemo(() => {
    const total = classStudents.length;
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;

    classStudents.forEach((s) => {
      const st = dailyForm[s.id]?.status || 'HADIR';
      if (st === 'HADIR') hadir++;
      else if (st === 'IZIN') izin++;
      else if (st === 'SAKIT') sakit++;
      else if (st === 'ALPA') alpa++;
    });

    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return {
      total,
      hadir,
      izin,
      sakit,
      alpa,
      percentage,
    };
  }, [classStudents, dailyForm]);

  // Formatted date string in Indonesian
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Filtered students for daily table if filter is applied
  const displayedDailyStudents = useMemo(() => {
    if (dailyStatusFilter === 'ALL') return classStudents;
    return classStudents.filter(
      (s) => (dailyForm[s.id]?.status || 'HADIR') === dailyStatusFilter
    );
  }, [classStudents, dailyForm, dailyStatusFilter]);

  // REKAP DATA CALCULATION (Uses unified selectedClassId)
  const rekapStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  const rekapData = useMemo(() => {
    // Filter attendances for selected class and month
    const monthRecords = attendances.filter(
      (a) => a.classId === selectedClassId && a.date.startsWith(rekapMonth)
    );

    return rekapStudents.map((student, idx) => {
      const records = monthRecords.filter((r) => r.studentId === student.id);
      const hadir = records.filter((r) => r.status === 'HADIR').length;
      const izin = records.filter((r) => r.status === 'IZIN').length;
      const sakit = records.filter((r) => r.status === 'SAKIT').length;
      const alpa = records.filter((r) => r.status === 'ALPA').length;
      const totalDays = records.length;
      const percentage = totalDays > 0 ? Math.round((hadir / totalDays) * 100) : 100;

      return {
        no: idx + 1,
        id: student.id,
        nisnNis: student.nisnNis || student.nisn || student.nis || '-',
        name: student.name,
        gender: student.gender,
        hadir,
        izin,
        sakit,
        alpa,
        totalDays,
        percentage,
      };
    });
  }, [rekapStudents, attendances, selectedClassId, rekapMonth]);

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);
  const rekapClassObj = selectedClassObj;

  // Format Month in Indonesian
  const monthLabel = useMemo(() => {
    const [year, month] = rekapMonth.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
  }, [rekapMonth]);

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Presensi & Rekapitulasi Kehadiran
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pencatatan absensi harian dan rekap persentase presensi bulanan siswa
          </p>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveSubTab('input')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'input'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Input Harian
          </button>
          <button
            onClick={() => setActiveSubTab('rekap')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'rekap'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Rekap Bulanan
          </button>
        </div>
      </div>

      {activeSubTab === 'input' ? (
        /* TAB 1: INPUT PRESENSI HARIAN */
        <div className="space-y-4">
          {/* KALENDER PRESENSI KELAS INTERAKTIF DENGAN TANDA SELESAI */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-all">
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                showCalendar ? 'pb-3.5 mb-3.5 border-b border-slate-100 dark:border-slate-800' : ''
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Kalender Presensi
                    </h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                      Kelas {selectedClassObj?.name || '-'}
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      • {calendarDaysData.days.filter((d) => d.hasRecorded).length} hari terisi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Klik tanggal pada kalender untuk membuka, mengedit, atau menghapus data presensi.
                  </p>
                </div>
              </div>

              {/* Sederhana & Kompak: Navigasi Bulan, Hari Ini, dan Toggle */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/80 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    title="Bulan Sebelumnya"
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-[95px] text-center select-none">
                    {calendarDaysData.monthName}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    title="Bulan Berikutnya"
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGoToToday}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                  title="Lompat ke hari ini"
                >
                  Hari Ini
                </button>

                <button
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                  title={showCalendar ? 'Sembunyikan kalender' : 'Buka kalender'}
                >
                  <span>{showCalendar ? 'Tutup' : 'Buka'}</span>
                  {showCalendar ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Calendar Grid View */}
            {showCalendar && (
              <div className="space-y-3">
                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <div className="py-1">Sen</div>
                  <div className="py-1">Sel</div>
                  <div className="py-1">Rab</div>
                  <div className="py-1">Kam</div>
                  <div className="py-1">Jum</div>
                  <div className="py-1 text-amber-600 dark:text-amber-400">Sab</div>
                  <div className="py-1 text-rose-600 dark:text-rose-400">Min</div>
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Padding before 1st */}
                  {Array.from({ length: calendarDaysData.paddingStart }).map((_, i) => (
                    <div
                      key={`pad-${i}`}
                      className="min-h-[64px] rounded-lg bg-slate-50/40 dark:bg-slate-800/20 border border-dashed border-slate-200/60 dark:border-slate-800/40 opacity-40"
                    />
                  ))}

                  {/* Day Cells */}
                  {calendarDaysData.days.map((day) => {
                    const isSelected = day.isSelected;
                    const hasRecorded = day.hasRecorded;

                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => handleSelectCalendarDate(day.dateStr)}
                        className={`min-h-[72px] sm:min-h-[76px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'ring-2 ring-indigo-600 dark:ring-indigo-500 border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-xs'
                            : hasRecorded
                            ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/25 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {/* Day header */}
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-bold ${
                              isSelected
                                ? 'text-indigo-700 dark:text-indigo-300'
                                : hasRecorded
                                ? 'text-emerald-800 dark:text-emerald-300'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {day.dayNum}
                          </span>

                          <div className="flex items-center gap-1">
                            {day.isToday && (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-indigo-600 text-white leading-tight">
                                Hari Ini
                              </span>
                            )}
                            {hasRecorded && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800" title="Selesai Diabsen" />
                            )}
                          </div>
                        </div>

                        {/* Status Label & Breakdown */}
                        <div className="mt-1">
                          {hasRecorded ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-1 py-0.2 rounded">
                                  ✓ Selesai
                                </span>
                                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                                  {day.pct}%
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                H:{day.hadir} {day.izin > 0 ? `I:${day.izin}` : ''} {day.sakit > 0 ? `S:${day.sakit}` : ''} {day.alpa > 0 ? `A:${day.alpa}` : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              Belum absen
                            </span>
                          )}
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[8px] font-black shadow-xs">
                            ●
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Simplified Calendar Legend and Quick Link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3.5 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">✓ Selesai</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />
                      <span>Belum Absen</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">Dipilih</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSubTab('rekap')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto text-xs"
                  >
                    Buka Rekap Bulanan <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              {/* Select Class */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Kelas:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Date */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Tanggal:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-mono"
                />
              </div>

              {/* Status Badge for Date */}
              {isDateSaved ? (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Selesai Absen ({savedDateStats?.hadir}/{savedDateStats?.total} Hadir)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    <Edit className="w-3 h-3" /> Mode Edit
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Belum Diabsen
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSetAllHadir}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Set Semua Hadir
              </button>

              {/* Delete attendance for this date */}
              {isDateSaved && (
                <button
                  type="button"
                  onClick={() => setDateToDeleteConfirm(selectedDate)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors cursor-pointer"
                  title="Hapus data presensi tanggal ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Presensi
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveDaily}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {isDateSaved ? 'Perbarui Presensi' : 'Simpan Presensi'}
              </button>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Data presensi tanggal {selectedDate} berhasil disimpan dan otomatis tersinkronisasi ke Rekap Bulanan!</span>
            </div>
          )}

          {deleteSuccessMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{deleteSuccessMsg}</span>
            </div>
          )}

          {/* REKAP KEHADIRAN HARIAN LANGSUNG DI ATAS TABEL */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-all">
            {/* Header info bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Rekap Kehadiran Harian
                    </h2>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                      {selectedClassObj?.name || 'Kelas'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      • {formattedSelectedDate}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Ringkasan otomatis terupdate langsung saat status siswa diubah. Klik kartu untuk menyaring daftar siswa.
                  </p>
                </div>
              </div>

              {/* Attendance rate indicator */}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Tingkat Kehadiran:
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-base font-extrabold ${
                    dailyRecap.percentage >= 90
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : dailyRecap.percentage >= 75
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {dailyRecap.percentage}%
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    ({dailyRecap.hadir}/{dailyRecap.total} siswa)
                  </span>
                </div>
              </div>
            </div>

            {/* 5 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Card 1: Total Siswa */}
              <button
                type="button"
                onClick={() => setDailyStatusFilter('ALL')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  dailyStatusFilter === 'ALL'
                    ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-400 dark:border-slate-600 ring-2 ring-indigo-500/30 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Total Siswa
                  </span>
                  <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="mt-2">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {dailyRecap.total}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {dailyStatusFilter === 'ALL' ? '• Menampilkan semua' : 'Klik tampilkan semua'}
                  </div>
                </div>
              </button>

              {/* Card 2: Hadir */}
              <button
                type="button"
                onClick={() => setDailyStatusFilter(dailyStatusFilter === 'HADIR' ? 'ALL' : 'HADIR')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  dailyStatusFilter === 'HADIR'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                    : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Hadir
                  </span>
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-200">
                      {dailyRecap.hadir}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-300/80">
                      ({dailyRecap.total > 0 ? Math.round((dailyRecap.hadir / dailyRecap.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                    {dailyStatusFilter === 'HADIR' ? '• Filter aktif' : 'Klik untuk saring'}
                  </div>
                </div>
              </button>

              {/* Card 3: Izin */}
              <button
                type="button"
                onClick={() => setDailyStatusFilter(dailyStatusFilter === 'IZIN' ? 'ALL' : 'IZIN')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  dailyStatusFilter === 'IZIN'
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 dark:border-sky-500 ring-2 ring-sky-500/30 shadow-xs'
                    : 'bg-sky-50/40 dark:bg-sky-950/20 border-sky-200/80 dark:border-sky-900/40 hover:bg-sky-50/70 dark:hover:bg-sky-950/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                    Izin
                  </span>
                  <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-sky-700 dark:text-sky-200">
                      {dailyRecap.izin}
                    </span>
                    <span className="text-[11px] font-semibold text-sky-600/80 dark:text-sky-300/80">
                      ({dailyRecap.total > 0 ? Math.round((dailyRecap.izin / dailyRecap.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="text-[10px] text-sky-600/80 dark:text-sky-400/80 mt-0.5">
                    {dailyStatusFilter === 'IZIN' ? '• Filter aktif' : 'Surat / izin'}
                  </div>
                </div>
              </button>

              {/* Card 4: Sakit */}
              <button
                type="button"
                onClick={() => setDailyStatusFilter(dailyStatusFilter === 'SAKIT' ? 'ALL' : 'SAKIT')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  dailyStatusFilter === 'SAKIT'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/30 shadow-xs'
                    : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 hover:bg-amber-50/70 dark:hover:bg-amber-950/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    Sakit
                  </span>
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-amber-700 dark:text-amber-200">
                      {dailyRecap.sakit}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-600/80 dark:text-amber-300/80">
                      ({dailyRecap.total > 0 ? Math.round((dailyRecap.sakit / dailyRecap.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                    {dailyStatusFilter === 'SAKIT' ? '• Filter aktif' : 'Kondisi sakit'}
                  </div>
                </div>
              </button>

              {/* Card 5: Alpa */}
              <button
                type="button"
                onClick={() => setDailyStatusFilter(dailyStatusFilter === 'ALPA' ? 'ALL' : 'ALPA')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  dailyStatusFilter === 'ALPA'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/30 shadow-xs'
                    : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40 hover:bg-rose-50/70 dark:hover:bg-rose-950/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    Alpa
                  </span>
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-rose-700 dark:text-rose-200">
                      {dailyRecap.alpa}
                    </span>
                    <span className="text-[11px] font-semibold text-rose-600/80 dark:text-rose-300/80">
                      ({dailyRecap.total > 0 ? Math.round((dailyRecap.alpa / dailyRecap.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                    {dailyStatusFilter === 'ALPA' ? '• Filter aktif' : 'Tanpa keterangan'}
                  </div>
                </div>
              </button>
            </div>

            {/* Distribution Visual Progress Bar */}
            {dailyRecap.total > 0 && (
              <div className="mt-3.5 space-y-1.5">
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                  {dailyRecap.hadir > 0 && (
                    <div
                      style={{ width: `${(dailyRecap.hadir / dailyRecap.total) * 100}%` }}
                      className="bg-emerald-500 transition-all duration-300"
                      title={`Hadir: ${dailyRecap.hadir} siswa`}
                    />
                  )}
                  {dailyRecap.izin > 0 && (
                    <div
                      style={{ width: `${(dailyRecap.izin / dailyRecap.total) * 100}%` }}
                      className="bg-sky-500 transition-all duration-300"
                      title={`Izin: ${dailyRecap.izin} siswa`}
                    />
                  )}
                  {dailyRecap.sakit > 0 && (
                    <div
                      style={{ width: `${(dailyRecap.sakit / dailyRecap.total) * 100}%` }}
                      className="bg-amber-500 transition-all duration-300"
                      title={`Sakit: ${dailyRecap.sakit} siswa`}
                    />
                  )}
                  {dailyRecap.alpa > 0 && (
                    <div
                      style={{ width: `${(dailyRecap.alpa / dailyRecap.total) * 100}%` }}
                      className="bg-rose-500 transition-all duration-300"
                      title={`Alpa: ${dailyRecap.alpa} siswa`}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Hadir: {dailyRecap.hadir}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                      Izin: {dailyRecap.izin}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      Sakit: {dailyRecap.sakit}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      Alpa: {dailyRecap.alpa}
                    </span>
                  </div>
                  {dailyStatusFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setDailyStatusFilter('ALL')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Filter Active Alert / Notice */}
            {dailyStatusFilter !== 'ALL' && (
              <div className="mt-3 p-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    Menyaring tabel untuk siswa berstatus: <strong>{dailyStatusFilter}</strong> ({displayedDailyStudents.length} dari {classStudents.length} siswa)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDailyStatusFilter('ALL')}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Tampilkan Semua Siswa
                </button>
              </div>
            )}
          </div>

          {/* Student attendance list table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Daftar Siswa Kelas {selectedClassObj?.name} ({displayedDailyStudents.length} {dailyStatusFilter !== 'ALL' ? `dari ${classStudents.length}` : ''} siswa)
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
                    <th className="p-3.5">NISN / NIS</th>
                    <th className="p-3.5">Nama Lengkap Siswa</th>
                    <th className="p-3.5 text-center">L/P</th>
                    <th className="p-3.5 text-center">Status Kehadiran</th>
                    <th className="p-3.5">Catatan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {displayedDailyStudents.length > 0 ? (
                    displayedDailyStudents.map((student, idx) => {
                      const currentStatus = dailyForm[student.id]?.status || 'HADIR';
                      const currentNotes = dailyForm[student.id]?.notes || '';
                      const studentIdNum = student.nisnNis || student.nisn || student.nis || '-';
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300 font-medium">{studentIdNum}</td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">{student.name}</td>
                          <td className="p-3.5 text-center font-semibold text-slate-500 dark:text-slate-400">
                            {student.gender}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              {(['HADIR', 'IZIN', 'SAKIT', 'ALPA'] as AttendanceStatus[]).map(
                                (st) => {
                                  const isActive = currentStatus === st;
                                  let activeClass = 'bg-indigo-600 text-white';
                                  if (st === 'HADIR') activeClass = 'bg-emerald-600 text-white';
                                  if (st === 'IZIN') activeClass = 'bg-sky-600 text-white';
                                  if (st === 'SAKIT') activeClass = 'bg-amber-600 text-white';
                                  if (st === 'ALPA') activeClass = 'bg-rose-600 text-white';

                                  return (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => handleStatusChange(student.id, st)}
                                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                                        isActive
                                          ? `${activeClass} shadow-xs`
                                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <input
                              type="text"
                              value={currentNotes}
                              onChange={(e) => handleNotesChange(student.id, e.target.value)}
                              placeholder={
                                currentStatus !== 'HADIR' ? 'Tuliskan keterangan / surat...' : '-'
                              }
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {dailyStatusFilter !== 'ALL' ? (
                          <div className="space-y-2">
                            <p>Tidak ada siswa dengan status <span className="font-semibold text-slate-600 dark:text-slate-300">{dailyStatusFilter}</span> pada tanggal ini.</p>
                            <button
                              type="button"
                              onClick={() => setDailyStatusFilter('ALL')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                            >
                              Tampilkan Semua Siswa
                            </button>
                          </div>
                        ) : (
                          'Belum ada siswa terdaftar pada kelas ini.'
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveDaily}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Presensi Kelas {selectedClassObj?.name}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: REKAP BULANAN PRESENSI */
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              {/* Select Class (Synced with Input Harian) */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Kelas:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Month (Synchronized with Calendar & Input Harian) */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Bulan:</label>
                <input
                  type="month"
                  value={rekapMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubTab('input')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Buka Kalender Input Harian
            </button>
          </div>

          {/* Riwayat Hari Presensi Terdata Bulan Ini */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Daftar Hari Efektif Presensi Terdata ({recordedDatesInMonth.length} Hari di Bulan {monthLabel})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Data presensi pada tanggal di bawah dapat langsung diedit atau dihapus
              </span>
            </div>

            {recordedDatesInMonth.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {recordedDatesInMonth.map((item) => (
                  <div
                    key={item.date}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatIndonesianDate(item.date)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                          {item.pct}% Hadir
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-2 flex-wrap font-mono">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">H: {item.hadir}</span>
                        <span className="text-sky-600 dark:text-sky-400">I: {item.izin}</span>
                        <span className="text-amber-600 dark:text-amber-400">S: {item.sakit}</span>
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">A: {item.alpa}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(item.date);
                          setActiveSubTab('input');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-md transition-colors cursor-pointer"
                        title="Buka dan edit data presensi tanggal ini"
                      >
                        <Edit className="w-3 h-3" /> Edit Presensi
                      </button>

                      <button
                        type="button"
                        onClick={() => setDateToDeleteConfirm(item.date)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-md transition-colors cursor-pointer"
                        title="Hapus data presensi tanggal ini"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-800/20 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                Belum ada data presensi yang diinput pada bulan {monthLabel} untuk kelas {rekapClassObj?.name}.
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('input')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Mulai Input Presensi di Kalender Harian
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Rekap Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Rekapitulasi Kehadiran Siswa · Bulan {monthLabel} · {rekapClassObj?.name}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Wali Kelas: {rekapClassObj?.homeroomTeacher}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3">NISN / NIS</th>
                    <th className="p-3">Nama Lengkap Siswa</th>
                    <th className="p-3 text-center">L/P</th>
                    <th className="p-3 text-center text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40">Hadir</th>
                    <th className="p-3 text-center text-sky-700 dark:text-sky-300 bg-sky-50/50 dark:bg-sky-950/40">Izin</th>
                    <th className="p-3 text-center text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/40">Sakit</th>
                    <th className="p-3 text-center text-rose-700 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/40">Alpa</th>
                    <th className="p-3 text-center font-mono">Total Hari</th>
                    <th className="p-3 text-center">% Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {rekapData.length > 0 ? (
                    rekapData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">{row.no}</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-300 font-medium">{row.nisnNis}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{row.name}</td>
                        <td className="p-3 text-center font-semibold text-slate-500 dark:text-slate-400">{row.gender}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/30">
                          {row.hadir}
                        </td>
                        <td className="p-3 text-center font-mono text-sky-600 dark:text-sky-400 bg-sky-50/30 dark:bg-sky-950/30">{row.izin}</td>
                        <td className="p-3 text-center font-mono text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/30">
                          {row.sakit}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/30">
                          {row.alpa}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">{row.totalDays}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-mono font-bold text-xs ${
                              row.percentage < 60
                                ? 'text-rose-600 dark:text-rose-400'
                                : row.percentage < 80
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {row.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        Tidak ada siswa pada kelas ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PRESENSI TANGGAL TERTENTU */}
      {dateToDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Data Presensi?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Apakah Anda yakin ingin menghapus seluruh rekaman presensi untuk{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    Kelas {selectedClassObj?.name}
                  </strong>{' '}
                  pada tanggal{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {formatIndonesianDate(dateToDeleteConfirm)}
                  </strong>?
                </p>
                <div className="mt-2.5 p-2.5 bg-rose-50/60 dark:bg-rose-950/30 rounded-lg border border-rose-200/80 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300">
                  Data presensi pada tanggal ini akan dihapus secara permanen dari penyimpanan dan kalkulasi rekap bulanan akan otomatis terupdate.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDateToDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDateAttendance(dateToDeleteConfirm)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Presensi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
