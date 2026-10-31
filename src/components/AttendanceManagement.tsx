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

  // Rekap month filter
  const [rekapMonth, setRekapMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // '2026-10'
  );

  // Current class students
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

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
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSetAllHadir}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Set Semua Hadir
              </button>

              <button
                type="button"
                onClick={handleSaveDaily}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Presensi
              </button>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Data presensi tanggal {selectedDate} berhasil disimpan ke LocalStorage!</span>
            </div>
          )}

          {/* Student attendance list table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Daftar Siswa Kelas {selectedClassObj?.name} ({classStudents.length} siswa)
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
                  {classStudents.length > 0 ? (
                    classStudents.map((student, idx) => {
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
                        Belum ada siswa terdaftar pada kelas ini.
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

              {/* Select Month */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Bulan:</label>
                <input
                  type="month"
                  value={rekapMonth}
                  onChange={(e) => setRekapMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-mono"
                />
              </div>
            </div>
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
    </div>
  );
};
