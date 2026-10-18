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

export const GradeManagement: React.FC<GradeManagementProps> = ({
  students,
  classes,
  grades,
  onSaveBatchGrades,
  onDeleteGrade,
  school,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'mass' | 'ledger' | 'history'>('mass');

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

  // Ledger state
  const [ledgerClassId, setLedgerClassId] = useState<string>(classes[0]?.id || '');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // History state
  const [historySearch, setHistorySearch] = useState('');

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

  const ledgerData = useMemo(() => {
    return ledgerStudents.map((student, idx) => {
      const studentGrades = grades.filter(
        (g) => g.studentId === student.id && g.classId === ledgerClassId
      );

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

      // Predikat
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
        nisn: student.nisn,
        name: student.name,
        gender: student.gender,
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
  }, [ledgerStudents, grades, ledgerClassId]);

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);
  const ledgerClassObj = classes.find((c) => c.id === ledgerClassId);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Manajemen Penilaian & Rapor Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Input nilai massal per kelas, leger nilai kompilasi, dan cetak dokumen resmi
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('mass')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'mass'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Input Nilai Massal
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Leger & Rekap Nilai
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat ({grades.length})
          </button>
        </div>
      </div>

      {activeTab === 'mass' ? (
        /* TAB 1: INPUT NILAI MASSAL */
        <div className="space-y-4">
          {/* Controls Form Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Rombel / Kelas
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Jenis Asesmen
                </label>
                <select
                  value={gradeType}
                  onChange={(e) => setGradeType(e.target.value as GradeType)}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Tugas">Tugas Mandiri / Kelompok</option>
                  <option value="Harian">Formatif Harian</option>
                  <option value="Sumatif">Sumatif Lingkup Materi</option>
                  <option value="STS">Sumatif Tengah Semester (STS)</option>
                  <option value="SAS">Sumatif Akhir Semester (SAS)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Judul Penilaian / Materi
                </label>
                <input
                  type="text"
                  value={assessmentTitle}
                  onChange={(e) => setAssessmentTitle(e.target.value)}
                  placeholder="Contoh: Sumatif Bab 2 Trigonometri"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Tanggal Asesmen
                </label>
                <input
                  type="date"
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Ketik langsung angka nilai (0 - 100) pada kolom input di bawah, lalu klik simpan.
              </span>
              <button
                type="button"
                onClick={handleSaveMassInput}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Semua Nilai ({classStudents.length} Siswa)
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Nilai asesmen "{assessmentTitle}" berhasil disimpan ke sistem!</span>
            </div>
          )}

          {/* Mass Input Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Form Nilai Massal: {selectedClassObj?.name} · {subject} · {gradeType}
              </span>
              <span className="text-slate-500">
                Skala Penilaian: 0 s/d 100 (KKM / Interval: 70)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 w-10 text-center">No</th>
                    <th className="p-3.5">NISN</th>
                    <th className="p-3.5">Nama Lengkap Siswa</th>
                    <th className="p-3.5 text-center">L/P</th>
                    <th className="p-3.5 text-center w-36">Nilai (0 - 100) *</th>
                    <th className="p-3.5">Catatan / Umpan Balik Guru</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {classStudents.length > 0 ? (
                    classStudents.map((student, idx) => {
                      const val = massScores[student.id] ?? '';
                      const note = massNotes[student.id] ?? '';
                      const isLow = typeof val === 'number' && val < 70;
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-3.5 font-mono text-slate-600">{student.nisn}</td>
                          <td className="p-3.5 font-bold text-slate-900">{student.name}</td>
                          <td className="p-3.5 text-center font-semibold text-slate-500">
                            {student.gender}
                          </td>
                          <td className="p-3.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={val}
                              onChange={(e) => handleScoreChange(student.id, e.target.value)}
                              placeholder="0"
                              className={`w-28 px-3 py-1.5 text-xs text-center font-mono font-bold rounded-lg border focus:outline-none focus:ring-2 ${
                                isLow
                                  ? 'border-rose-300 text-rose-700 bg-rose-50/60 focus:ring-rose-500'
                                  : 'border-slate-300 text-slate-900 bg-white focus:ring-indigo-500'
                              }`}
                            />
                          </td>
                          <td className="p-3.5">
                            <input
                              type="text"
                              value={note}
                              onChange={(e) =>
                                setMassNotes((prev) => ({
                                  ...prev,
                                  [student.id]: e.target.value,
                                }))
                              }
                              placeholder="Tulis umpan balik / remedial jika perlu..."
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Belum ada siswa di kelas ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={handleSaveMassInput}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Penilaian Kelas {selectedClassObj?.name}
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'ledger' ? (
        /* TAB 2: LEGER & REKAPITULASI NILAI LENGKAP */
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-600">Pilih Kelas:</label>
              <select
                value={ledgerClassId}
                onChange={(e) => setLedgerClassId(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen Leger Nilai / Rapor
            </button>
          </div>

          {/* Leger Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <span className="font-semibold text-slate-800">
                Buku Leger Nilai Kompilasi · {ledgerClassObj?.name} · T.A. {school.academicYear} (Semester {school.semester})
              </span>
              <span className="text-slate-500">
                Wali Kelas: {ledgerClassObj?.homeroomTeacher}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-8 text-center">No</th>
                    <th className="p-3">NISN</th>
                    <th className="p-3">Nama Lengkap Siswa</th>
                    <th className="p-3 text-center">L/P</th>
                    <th className="p-3 text-center">Tugas</th>
                    <th className="p-3 text-center">Harian</th>
                    <th className="p-3 text-center">Sumatif</th>
                    <th className="p-3 text-center">STS</th>
                    <th className="p-3 text-center">SAS</th>
                    <th className="p-3 text-center font-bold bg-indigo-50/50 text-indigo-900">
                      Nilai Akhir
                    </th>
                    <th className="p-3 text-center">Predikat</th>
                    <th className="p-3">Capaian Kompetensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {ledgerData.length > 0 ? (
                    ledgerData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 text-center font-mono text-slate-500">{row.no}</td>
                        <td className="p-3 font-mono text-slate-600">{row.nisn}</td>
                        <td className="p-3 font-bold text-slate-900">{row.name}</td>
                        <td className="p-3 text-center font-semibold text-slate-500">{row.gender}</td>
                        <td className="p-3 text-center font-mono">{row.avgTugas}</td>
                        <td className="p-3 text-center font-mono">{row.avgHarian}</td>
                        <td className="p-3 text-center font-mono">{row.avgSumatif}</td>
                        <td className="p-3 text-center font-mono">{row.sts}</td>
                        <td className="p-3 text-center font-mono">{row.sas}</td>
                        <td className="p-3 text-center font-mono font-bold text-sm bg-indigo-50/40 text-indigo-700">
                          {row.finalGrade}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">
                          {row.predikat}
                        </td>
                        <td className="p-3 text-[11px] text-slate-600">
                          <span
                            className={`inline-block font-medium ${
                              row.predikat === 'A'
                                ? 'text-emerald-700'
                                : row.predikat === 'B'
                                ? 'text-indigo-700'
                                : row.predikat === 'C'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {row.statusKetercapaian}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-slate-400">
                        Tidak ada data siswa pada kelas ini.
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
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Cari judul penilaian atau mata pelajaran..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5">Kelas</th>
                    <th className="p-3.5">Mata Pelajaran</th>
                    <th className="p-3.5">Jenis</th>
                    <th className="p-3.5">Judul Asesmen</th>
                    <th className="p-3.5">Nama Siswa</th>
                    <th className="p-3.5 text-center">Nilai</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
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
                          <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 font-mono text-slate-500">{g.date}</td>
                            <td className="p-3.5 font-medium">{cls?.name || '-'}</td>
                            <td className="p-3.5">{g.subject}</td>
                            <td className="p-3.5">
                              <span className="font-semibold text-indigo-700">{g.type}</span>
                            </td>
                            <td className="p-3.5 font-medium text-slate-900">{g.title}</td>
                            <td className="p-3.5 font-bold text-slate-800">{student?.name || '-'}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-sm text-indigo-600">
                              {g.score}
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  if (window.confirm('Hapus entri penilaian ini?')) {
                                    onDeleteGrade(g.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
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
        title="LEGER HASIL PENILAIAN CAPAIAN KOMPETENSI SISWA"
        subtitle={`Tahun Pelajaran ${school.academicYear} · Semester ${school.semester}`}
        school={school}
        currentUser={currentUser}
        metaInfo={[
          { label: 'Kelas / Rombel', value: ledgerClassObj?.name || '-' },
          { label: 'Wali Kelas', value: ledgerClassObj?.homeroomTeacher || '-' },
          { label: 'Mata Pelajaran', value: currentUser?.subject || 'Matematika & Informatika' },
          { label: 'Kurikulum', value: 'Kurikulum Merdeka' },
        ]}
      >
        <table className="w-full text-xs border border-slate-900 border-collapse print:border-black">
          <thead>
            <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
              <th className="p-2 border border-slate-900 text-center w-8">No</th>
              <th className="p-2 border border-slate-900 text-center">NISN</th>
              <th className="p-2 border border-slate-900 text-left">Nama Siswa</th>
              <th className="p-2 border border-slate-900 text-center w-8">L/P</th>
              <th className="p-2 border border-slate-900 text-center w-12">Tugas</th>
              <th className="p-2 border border-slate-900 text-center w-12">Harian</th>
              <th className="p-2 border border-slate-900 text-center w-12">Sumatif</th>
              <th className="p-2 border border-slate-900 text-center w-12">STS</th>
              <th className="p-2 border border-slate-900 text-center w-12">SAS</th>
              <th className="p-2 border border-slate-900 text-center w-14 font-extrabold">NA</th>
              <th className="p-2 border border-slate-900 text-center w-10">Pred.</th>
              <th className="p-2 border border-slate-900 text-left">Ketercapaian TP</th>
            </tr>
          </thead>
          <tbody>
            {ledgerData.map((row) => (
              <tr key={row.id} className="border-b border-slate-900">
                <td className="p-1.5 border border-slate-900 text-center font-mono">{row.no}</td>
                <td className="p-1.5 border border-slate-900 text-center font-mono">{row.nisn}</td>
                <td className="p-1.5 border border-slate-900 font-medium">{row.name}</td>
                <td className="p-1.5 border border-slate-900 text-center">{row.gender}</td>
                <td className="p-1.5 border border-slate-900 text-center font-mono">{row.avgTugas}</td>
                <td className="p-1.5 border border-slate-900 text-center font-mono">{row.avgHarian}</td>
                <td className="p-1.5 border border-slate-900 text-center font-mono">{row.avgSumatif}</td>
                <td className="p-1.5 border border-slate-900 text-center font-mono">{row.sts}</td>
                <td className="p-1.5 border border-slate-900 text-center font-mono">{row.sas}</td>
                <td className="p-1.5 border border-slate-900 text-center font-mono font-bold">
                  {row.finalGrade}
                </td>
                <td className="p-1.5 border border-slate-900 text-center font-bold">{row.predikat}</td>
                <td className="p-1.5 border border-slate-900 text-[10px]">{row.statusKetercapaian}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintDocumentModal>
    </div>
  );
};
