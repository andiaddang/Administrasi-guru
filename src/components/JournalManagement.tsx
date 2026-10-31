import React, { useState } from 'react';
import { TeachingJournal, ClassRoom, SchoolProfile, User } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  BookOpenCheck,
  Search,
  Calendar,
  X,
  Clock,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // In-app Delete Confirmation Modal State (replaces window.confirm)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id?: string;
    meetingNumber?: number;
    topic?: string;
  }>({ isOpen: false });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

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
    if (!topic.trim()) return;

    if (editingJournal) {
      onUpdateJournal({
        ...editingJournal,
        date,
        meetingNumber,
        classId,
        subject: subject.trim(),
        time,
        topic: topic.trim(),
        learningActivities: learningActivities.trim() || 'Pembelajaran tatap muka sesuai kurikulum',
        obstacles: obstacles.trim() || 'Tidak ada hambatan',
        solutions: solutions.trim() || 'Pembelajaran berjalan lancar',
        presentCount,
        absentCount,
      });
      showToast(`Jurnal pertemuan ke-${meetingNumber} berhasil diperbarui`);
    } else {
      onAddJournal({
        date,
        meetingNumber,
        classId,
        subject: subject.trim(),
        time,
        topic: topic.trim(),
        learningActivities: learningActivities.trim() || 'Pembelajaran tatap muka sesuai kurikulum',
        obstacles: obstacles.trim() || 'Tidak ada hambatan',
        solutions: solutions.trim() || 'Pembelajaran berjalan lancar',
        presentCount,
        absentCount,
      });
      showToast(`Jurnal baru pertemuan ke-${meetingNumber} berhasil dicatat`);
    }
    setIsModalOpen(false);
    setEditingJournal(null);
  };

  const triggerDelete = (id: string, meeting: number, topic?: string) => {
    setDeleteModal({
      isOpen: true,
      id,
      meetingNumber: meeting,
      topic,
    });
  };

  const confirmDeleteAction = () => {
    if (deleteModal.id) {
      onDeleteJournal(deleteModal.id);
      showToast(`Jurnal pertemuan ke-${deleteModal.meetingNumber} berhasil dihapus`);
    }
    setDeleteModal({ isOpen: false });
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Jurnal Harian Mengajar Guru
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {journals.length} Entri
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dokumentasi keterlaksanaan kurikulum, materi capaian, hambatan, dan solusi
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari materi pokok, aktivitas, atau mapel..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
            Filter Kelas:
          </label>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Kelas ({journals.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({journals.filter((j) => j.classId === c.id).length})
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
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-md">
                      Pertemuan Ke-{journal.meetingNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {journal.subject} · {cls?.name || 'Kelas'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
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
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Materi Pokok / Capaian Pembelajaran:
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {journal.topic}
                  </p>
                </div>

                {/* Activities */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Kegiatan & Metode Pembelajaran:
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {journal.learningActivities}
                  </p>
                </div>

                {/* Obstacles & Solutions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg border border-amber-200/60 dark:border-amber-900/40 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-200 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Hambatan / Kendala:</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">
                      {journal.obstacles || 'Tidak ada hambatan.'}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-200 mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Solusi & Tindak Lanjut:</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">
                      {journal.solutions || 'Berjalan lancar sesuai rencana.'}
                    </p>
                  </div>
                </div>

                {/* Footer status & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="font-mono">
                      Kehadiran: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{journal.presentCount}</strong> Hadir ·{' '}
                      <strong className="text-rose-600 dark:text-rose-400 font-bold">{journal.absentCount}</strong> Absen
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(journal)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                      title="Edit Jurnal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => triggerDelete(journal.id, journal.meetingNumber, journal.topic)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 dark:text-slate-500 shadow-xs">
            <BookOpenCheck className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-xs">Belum ada jurnal mengajar untuk filter ini.</p>
          </div>
        )}
      </div>

      {/* Modal Form Tambah / Edit Jurnal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800">
              <h3 className="text-sm font-bold">
                {editingJournal ? 'Edit Catatan Jurnal Mengajar' : 'Tulis Jurnal Mengajar Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Pertemuan Ke</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={meetingNumber}
                    onChange={(e) => setMeetingNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Rombel / Kelas</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-medium"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Mata Pelajaran *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Jam Tatap Muka</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="07:30 - 09:00"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Materi Pokok / Capaian Pembelajaran (CP) *
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Menentukan Asimtot Fungsi Eksponen dan Penyelesaian Persamaan"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Uraian Kegiatan Pembelajaran *
                </label>
                <textarea
                  rows={3}
                  required
                  value={learningActivities}
                  onChange={(e) => setLearningActivities(e.target.value)}
                  placeholder="Deskripsikan alur pendahuluan, inti (diskusi/presentasi/praktik), dan penutup..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Hambatan / Kendala yang Dihadapi
                  </label>
                  <textarea
                    rows={2}
                    value={obstacles}
                    onChange={(e) => setObstacles(e.target.value)}
                    placeholder="Contoh: Beberapa siswa kesulitan memahami grafik..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Solusi & Tindak Lanjut
                  </label>
                  <textarea
                    rows={2}
                    value={solutions}
                    onChange={(e) => setSolutions(e.target.value)}
                    placeholder="Contoh: Diberikan bimbingan khusus di luar jam pelajaran..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Jumlah Siswa Hadir
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={presentCount}
                    onChange={(e) => setPresentCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-center font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Jumlah Siswa Tidak Hadir
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={absentCount}
                    onChange={(e) => setAbsentCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-center font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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

      {/* In-app Deletion Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title="Hapus Catatan Jurnal Mengajar"
        message={`Apakah Anda yakin ingin menghapus catatan jurnal mengajar pertemuan ke-${deleteModal.meetingNumber}? Data yang dihapus tidak dapat dikembalikan.`}
        itemName={deleteModal.topic}
        confirmLabel="Hapus Jurnal"
        onConfirm={confirmDeleteAction}
        onClose={() => setDeleteModal({ isOpen: false })}
      />

      {/* Floating feedback toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 dark:bg-emerald-950/90 text-white rounded-xl shadow-xl border border-slate-700 dark:border-emerald-700/50 text-xs sm:text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

