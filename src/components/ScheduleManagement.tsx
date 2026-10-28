import React, { useState } from 'react';
import { Schedule, ClassRoom, DayOfWeek } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  MapPin,
  X,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ScheduleManagementProps {
  schedules: Schedule[];
  classes: ClassRoom[];
  onAddSchedule: (newSchedule: Omit<Schedule, 'id'>) => void;
  onUpdateSchedule: (updatedSchedule: Schedule) => void;
  onDeleteSchedule: (id: string) => void;
}

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({
  schedules,
  classes,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // In-app Delete Confirmation Modal State (replaces window.confirm)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id?: string;
    name?: string;
  }>({ isOpen: false });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Form states
  const [day, setDay] = useState<DayOfWeek>('Senin');
  const [timeStart, setTimeStart] = useState('07:30');
  const [timeEnd, setTimeEnd] = useState('09:00');
  const [period, setPeriod] = useState('Jam Ke 1 - 2');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [subject, setSubject] = useState('Matematika');
  const [room, setRoom] = useState('R. 101');
  const [notes, setNotes] = useState('');

  const daysList: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const filteredSchedules = schedules.filter((s) => {
    const matchDay = selectedDayFilter === 'all' || s.day === selectedDayFilter;
    const matchClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
    return matchDay && matchClass;
  });

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setDay('Senin');
    setTimeStart('07:30');
    setTimeEnd('09:00');
    setPeriod('Jam Ke 1 - 2');
    setClassId(selectedClassFilter !== 'all' ? selectedClassFilter : classes[0]?.id || '');
    setSubject('Matematika');
    setRoom('R. 101');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sch: Schedule) => {
    setEditingSchedule(sch);
    setDay(sch.day);
    setTimeStart(sch.timeStart);
    setTimeEnd(sch.timeEnd);
    setPeriod(sch.period);
    setClassId(sch.classId);
    setSubject(sch.subject);
    setRoom(sch.room);
    setNotes(sch.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    if (editingSchedule) {
      onUpdateSchedule({
        ...editingSchedule,
        day,
        timeStart,
        timeEnd,
        period,
        classId,
        subject: subject.trim(),
        room: room.trim() || 'Kelas',
        notes: notes.trim(),
      });
      showToast(`Jadwal "${subject.trim()} (${day})" berhasil diperbarui`);
    } else {
      onAddSchedule({
        day,
        timeStart,
        timeEnd,
        period,
        classId,
        subject: subject.trim(),
        room: room.trim() || 'Kelas',
        notes: notes.trim(),
      });
      showToast(`Jadwal baru "${subject.trim()} (${day})" berhasil ditambahkan`);
    }
    setIsModalOpen(false);
    setEditingSchedule(null);
  };

  const triggerDelete = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      id,
      name,
    });
  };

  const confirmDeleteAction = () => {
    if (deleteModal.id) {
      onDeleteSchedule(deleteModal.id);
      showToast(`Jadwal "${deleteModal.name}" berhasil dihapus`);
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
              Manajemen Jadwal Mengajar
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {schedules.length} Sesi
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Susunan jam pelajaran tatap muka mingguan guru di SMAN 1 Gowa
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Jadwal Mengajar
        </button>
      </div>

      {/* Filter Tabs by Day & Class */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        {/* Day selector tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setSelectedDayFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              selectedDayFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua Hari
          </button>
          {daysList.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDayFilter(d)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                selectedDayFilter === d
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Filter Kelas */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
            Kelas:
          </label>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchedules.length > 0 ? (
          filteredSchedules.map((sch) => {
            const cls = classes.find((c) => c.id === sch.classId);
            return (
              <div
                key={sch.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 px-2.5 py-0.5 rounded-md">
                      {sch.day}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {sch.period}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{sch.subject}</span>
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mt-2">
                    <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                      <span className="text-slate-400 dark:text-slate-500">Kelas:</span>
                      <span>{cls?.name || 'Semua Kelas'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {sch.timeStart} - {sch.timeEnd} WITA
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{sch.room}</span>
                    </div>

                    {sch.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded mt-2 border border-slate-100 dark:border-slate-800">
                        {sch.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenEdit(sch)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    title="Edit Jadwal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => triggerDelete(sch.id, `${sch.subject} (${sch.day})`)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    title="Hapus Jadwal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 dark:text-slate-500 shadow-xs">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-xs">Tidak ada jadwal mengajar pada filter yang dipilih.</p>
          </div>
        )}
      </div>

      {/* Modal Form Tambah / Edit Jadwal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800">
              <h3 className="text-sm font-bold">
                {editingSchedule ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Hari Pelaksanaan
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-medium"
                  >
                    {daysList.map((d) => (
                      <option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Rombel / Kelas
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-medium"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Mata Pelajaran *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Contoh: Matematika Fase E, Informatika"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    required
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    required
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Sesi / Jam Ke
                  </label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="Jam 1 - 2"
                    className="w-full px-2 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Ruangan / Lab
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Contoh: R. 101, Lab Komputer 1"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Membawa penggaris segitiga & kalkulator"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
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
                  {editingSchedule ? 'Simpan Perubahan' : 'Tambahkan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={confirmDeleteAction}
        title="Hapus Jadwal Mengajar"
        message={`Apakah Anda yakin ingin menghapus jadwal ${deleteModal.name}?`}
        itemName={deleteModal.name}
      />

      {/* Floating Success Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
