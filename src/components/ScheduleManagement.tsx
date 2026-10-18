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
} from 'lucide-react';

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
    if (!subject.trim() || !classId) return;

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
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus jadwal ${name}?`)) {
      onDeleteSchedule(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Manajemen Jadwal Mengajar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        {/* Day selector tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setSelectedDayFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              selectedDayFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Hari
          </button>
          {daysList.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDayFilter(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedDayFilter === d
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Filter Kelas */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Kelas:</label>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      {sch.day}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {sch.period}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{sch.subject}</span>
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                    <div className="flex items-center gap-2 font-medium text-slate-800">
                      <span className="text-slate-400">Kelas:</span>
                      <span>{cls?.name || 'Semua Kelas'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono tabular-nums">
                        {sch.timeStart} - {sch.timeEnd} WITA
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{sch.room}</span>
                    </div>

                    {sch.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded mt-2 border border-slate-100">
                        {sch.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEdit(sch)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                    title="Edit Jadwal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(sch.id, `${sch.subject} (${sch.day})`)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Hapus Jadwal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">Tidak ada jadwal mengajar pada filter yang dipilih.</p>
          </div>
        )}
      </div>

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <h3 className="text-sm font-bold">
                {editingSchedule ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Hari Pelaksanaan</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {daysList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Rombel / Kelas</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Mata Pelajaran *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Contoh: Matematika Fase E, Informatika"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Sesi / Jam Ke</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="Jam 1 - 2"
                    className="w-full px-2 py-2 border border-slate-300 rounded-lg text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Ruangan / Lab</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Contoh: R. 101, Lab Komputer 1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Membawa penggaris segitiga & kalkulator"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                  {editingSchedule ? 'Simpan Perubahan' : 'Tambahkan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
