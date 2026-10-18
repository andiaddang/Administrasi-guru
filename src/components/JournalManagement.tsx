import React, { useState } from 'react';
import { TeachingJournal, ClassRoom, SchoolProfile, User } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  BookOpenCheck,
  Search,
  Printer,
  Calendar,
  X,
  Clock,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { PrintDocumentModal } from './PrintDocumentModal';

interface JournalManagementProps {
  journals: TeachingJournal[];
  classes: ClassRoom[];
  onAddJournal: (newJournal: Omit<TeachingJournal, 'id'>) => void;
  onUpdateJournal: (updatedJournal: TeachingJournal) => void;
  onDeleteJournal: (id: string) => void;
  school: SchoolProfile;
  currentUser: User | null;
}

export const JournalManagement: React.FC<JournalManagementProps> = ({
  journals,
  classes,
  onAddJournal,
  onUpdateJournal,
  onDeleteJournal,
  school,
  currentUser,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<TeachingJournal | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [meetingNumber, setMeetingNumber] = useState(1);
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [subject, setSubject] = useState(currentUser?.subject?.split('&')[0]?.trim() || 'Matematika');
  const [time, setTime] = useState('07:30 - 09:00');
  const [topic, setTopic] = useState('');
  const [learningActivities, setLearningActivities] = useState('');
  const [obstacles, setObstacles] = useState('');
  const [solutions, setSolutions] = useState('');
  const [presentCount, setPresentCount] = useState(30);
  const [absentCount, setAbsentCount] = useState(0);

  const filteredJournals = journals.filter((j) => {
    const matchClass = selectedClassFilter === 'all' || j.classId === selectedClassFilter;
    const matchSearch =
      j.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.learningActivities.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchClass && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingJournal(null);
    setDate(new Date().toISOString().slice(0, 10));
    setMeetingNumber(journals.length + 1);
    setClassId(selectedClassFilter !== 'all' ? selectedClassFilter : classes[0]?.id || '');
    setSubject(currentUser?.subject?.split('&')[0]?.trim() || 'Matematika');
    setTime('07:30 - 09:00');
    setTopic('');
    setLearningActivities('');
    setObstacles('');
    setSolutions('');
    setPresentCount(30);
    setAbsentCount(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (journal: TeachingJournal) => {
    setEditingJournal(journal);
    setDate(journal.date);
    setMeetingNumber(journal.meetingNumber);
    setClassId(journal.classId);
    setSubject(journal.subject);
    setTime(journal.time);
    setTopic(journal.topic);
    setLearningActivities(journal.learningActivities);
    setObstacles(journal.obstacles);
    setSolutions(journal.solutions);
    setPresentCount(journal.presentCount);
    setAbsentCount(journal.absentCount);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !learningActivities.trim()) return;

    if (editingJournal) {
      onUpdateJournal({
        ...editingJournal,
        date,
        meetingNumber: Number(meetingNumber),
        classId,
        subject: subject.trim(),
        time: time.trim(),
        topic: topic.trim(),
        learningActivities: learningActivities.trim(),
        obstacles: obstacles.trim() || 'Tidak ada hambatan berarti.',
        solutions: solutions.trim() || 'Pembelajaran berjalan lancar.',
        presentCount: Number(presentCount),
        absentCount: Number(absentCount),
      });
    } else {
      onAddJournal({
        date,
        meetingNumber: Number(meetingNumber),
        classId,
        subject: subject.trim(),
        time: time.trim(),
        topic: topic.trim(),
        learningActivities: learningActivities.trim(),
        obstacles: obstacles.trim() || 'Tidak ada hambatan berarti.',
        solutions: solutions.trim() || 'Pembelajaran berjalan lancar.',
        presentCount: Number(presentCount),
        absentCount: Number(absentCount),
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus catatan jurnal pertemuan ${name}?`)) {
      onDeleteJournal(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Jurnal Harian Mengajar Guru
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumentasi keterlaksanaan kurikulum, materi capaian, hambatan, dan solusi
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Jurnal
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tulis Jurnal Baru
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari materi pokok, aktivitas, atau mapel..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Filter Kelas:</label>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Journal Cards / List */}
      <div className="space-y-4">
        {filteredJournals.length > 0 ? (
          filteredJournals.map((journal) => {
            const cls = classes.find((c) => c.id === journal.classId);
            return (
              <div
                key={journal.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md">
                      Pertemuan Ke-{journal.meetingNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {journal.subject} · {cls?.name || 'Kelas'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {journal.date}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {journal.time}
                    </span>
                  </div>
                </div>

                {/* Topic / CP */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Materi Pokok / Capaian Pembelajaran:
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{journal.topic}</p>
                </div>

                {/* Activities */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Kegiatan & Metode Pembelajaran:
                  </p>
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                    {journal.learningActivities}
                  </p>
                </div>

                {/* Obstacles & Solutions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-900 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Kendala / Hambatan:</span>
                    </div>
                    <p className="text-slate-700">{journal.obstacles}</p>
                  </div>

                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-900 mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Solusi & Tindak Lanjut:</span>
                    </div>
                    <p className="text-slate-700">{journal.solutions}</p>
                  </div>
                </div>

                {/* Footer status & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3 text-slate-500">
                    <span>
                      Kehadiran Siswa:{' '}
                      <strong className="text-emerald-700">{journal.presentCount} Hadir</strong>
                      {journal.absentCount > 0 && (
                        <span className="text-rose-600 ml-1">({journal.absentCount} Tidak Hadir)</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(journal)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                      title="Edit Jurnal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(journal.id, `${journal.meetingNumber} (${journal.topic})`)
                      }
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Hapus Jurnal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <BookOpenCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">Belum ada catatan jurnal pada filter yang dipilih.</p>
          </div>
        )}
      </div>

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <h3 className="text-sm font-bold">
                {editingJournal ? 'Edit Catatan Jurnal Mengajar' : 'Tulis Jurnal Mengajar Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pertemuan Ke</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={meetingNumber}
                    onChange={(e) => setMeetingNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Rombel / Kelas</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mata Pelajaran *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jam Tatap Muka</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="07:30 - 09:00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Materi Pokok / Capaian Pembelajaran (CP) *
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Menentukan Asimtot Fungsi Eksponen dan Penyelesaian Persamaan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Uraian Kegiatan Pembelajaran *
                </label>
                <textarea
                  rows={3}
                  required
                  value={learningActivities}
                  onChange={(e) => setLearningActivities(e.target.value)}
                  placeholder="Deskripsikan alur pendahuluan, inti (diskusi/presentasi/praktik), dan penutup..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Hambatan / Kendala yang Dihadapi
                  </label>
                  <textarea
                    rows={2}
                    value={obstacles}
                    onChange={(e) => setObstacles(e.target.value)}
                    placeholder="Contoh: Beberapa siswa kesulitan memahami grafik..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Solusi & Tindak Lanjut
                  </label>
                  <textarea
                    rows={2}
                    value={solutions}
                    onChange={(e) => setSolutions(e.target.value)}
                    placeholder="Contoh: Diberikan bimbingan khusus di luar jam pelajaran..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Jumlah Siswa Hadir
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={presentCount}
                    onChange={(e) => setPresentCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Jumlah Siswa Tidak Hadir
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={absentCount}
                    onChange={(e) => setAbsentCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editingJournal ? 'Simpan Perubahan' : 'Simpan Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT JURNAL MENGAJAR MODAL */}
      <PrintDocumentModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="BUKU JURNAL HARIAN MENGAJAR GURU"
        subtitle={`Tahun Pelajaran ${school.academicYear} · Semester ${school.semester}`}
        school={school}
        currentUser={currentUser}
        metaInfo={[
          { label: 'Nama Guru', value: currentUser?.name || '-' },
          { label: 'NIP / NUPTK', value: currentUser?.nip || '-' },
          { label: 'Mata Pelajaran', value: currentUser?.subject || '-' },
          { label: 'Satuan Pendidikan', value: school.name },
        ]}
      >
        <table className="w-full text-xs border border-slate-900 border-collapse print:border-black">
          <thead>
            <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
              <th className="p-2 border border-slate-900 text-center w-8">No</th>
              <th className="p-2 border border-slate-900 text-center w-20">Hari/Tgl</th>
              <th className="p-2 border border-slate-900 text-center w-14">Kelas</th>
              <th className="p-2 border border-slate-900 text-center w-12">Jam Ke</th>
              <th className="p-2 border border-slate-900 text-left w-48">Materi Pokok / CP</th>
              <th className="p-2 border border-slate-900 text-left">Kegiatan Pembelajaran</th>
              <th className="p-2 border border-slate-900 text-left w-36">Hambatan & Solusi</th>
              <th className="p-2 border border-slate-900 text-center w-16">Absensi (H/A)</th>
            </tr>
          </thead>
          <tbody>
            {filteredJournals.map((j, idx) => {
              const cls = classes.find((c) => c.id === j.classId);
              return (
                <tr key={j.id} className="border-b border-slate-900">
                  <td className="p-2 border border-slate-900 text-center font-mono">{idx + 1}</td>
                  <td className="p-2 border border-slate-900 text-center font-mono">{j.date}</td>
                  <td className="p-2 border border-slate-900 text-center font-semibold">{cls?.name}</td>
                  <td className="p-2 border border-slate-900 text-center font-mono">Ke-{j.meetingNumber}</td>
                  <td className="p-2 border border-slate-900 font-semibold">{j.topic}</td>
                  <td className="p-2 border border-slate-900 leading-snug">{j.learningActivities}</td>
                  <td className="p-2 border border-slate-900 text-[11px] leading-tight">
                    <p className="font-semibold">H: {j.obstacles}</p>
                    <p className="mt-1">S: {j.solutions}</p>
                  </td>
                  <td className="p-2 border border-slate-900 text-center font-mono">
                    {j.presentCount} / {j.absentCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </PrintDocumentModal>
    </div>
  );
};
