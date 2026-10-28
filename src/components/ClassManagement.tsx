import React, { useState } from 'react';
import { ClassRoom, Student } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  Layers,
  Search,
  CheckSquare,
  Square,
  X,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ClassManagementProps {
  classes: ClassRoom[];
  students: Student[];
  onAddClass: (newClass: Omit<ClassRoom, 'id'>) => void;
  onUpdateClass: (updatedClass: ClassRoom) => void;
  onDeleteClass: (id: string) => void;
  onDeleteBatchClasses: (ids: string[]) => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  classes,
  students,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onDeleteBatchClasses,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // In-app Delete Confirmation Modal State (replaces window.confirm)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id?: string;
    name?: string;
    isBatch?: boolean;
  }>({ isOpen: false });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Form states
  const [name, setName] = useState('');
  const [level, setLevel] = useState('10');
  const [major, setMajor] = useState('Fase E (Umum)');
  const [homeroomTeacher, setHomeroomTeacher] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.homeroomTeacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.major.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingClass(null);
    setName('');
    setLevel('10');
    setMajor('Fase E (Umum)');
    setHomeroomTeacher('');
    setAcademicYear('2026/2027');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassRoom) => {
    setEditingClass(cls);
    setName(cls.name);
    setLevel(cls.level);
    setMajor(cls.major);
    setHomeroomTeacher(cls.homeroomTeacher);
    setAcademicYear(cls.academicYear);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClass) {
      onUpdateClass({
        ...editingClass,
        name: name.trim(),
        level,
        major: major.trim() || 'Fase E (Umum)',
        homeroomTeacher: homeroomTeacher.trim() || '-',
        academicYear: academicYear.trim() || '2026/2027',
      });
      showToast(`Kelas "${name.trim()}" berhasil diperbarui`);
    } else {
      onAddClass({
        name: name.trim(),
        level,
        major: major.trim() || 'Fase E (Umum)',
        homeroomTeacher: homeroomTeacher.trim() || '-',
        academicYear: academicYear.trim() || '2026/2027',
      });
      showToast(`Kelas baru "${name.trim()}" berhasil ditambahkan`);
    }
    setIsModalOpen(false);
    setEditingClass(null);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredClasses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredClasses.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const triggerDeleteBatch = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal({
      isOpen: true,
      isBatch: true,
      name: `${selectedIds.length} kelas terpilih`,
    });
  };

  const triggerDeleteSingle = (id: string, className: string) => {
    setDeleteModal({
      isOpen: true,
      id,
      name: className,
      isBatch: false,
    });
  };

  const confirmDeleteAction = () => {
    if (deleteModal.isBatch) {
      onDeleteBatchClasses(selectedIds);
      showToast(`${selectedIds.length} kelas berhasil dihapus`);
      setSelectedIds([]);
    } else if (deleteModal.id) {
      onDeleteClass(deleteModal.id);
      setSelectedIds((prev) => prev.filter((item) => item !== deleteModal.id));
      showToast(`Kelas "${deleteModal.name}" berhasil dihapus`);
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
              Manajemen Kelas Belajar
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {classes.length} Rombel
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola rombongan belajar, wali kelas, kurikulum fase, dan jenjang pendidikan
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Kelas Baru
        </button>
      </div>

      {/* Toolbar Search & Batch Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama kelas, wali kelas, peminatan..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Batch Action Strip */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-3 py-1.5 rounded-lg animate-in fade-in">
            <span className="text-xs font-medium text-rose-800 dark:text-rose-200">
              {selectedIds.length} kelas dipilih
            </span>
            <button
              onClick={triggerDeleteBatch}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Sekaligus
            </button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                    aria-label="Pilih Semua Kelas"
                  >
                    {filteredClasses.length > 0 && selectedIds.length === filteredClasses.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">Nama Rombel / Kelas</th>
                <th className="p-3.5">Tingkat</th>
                <th className="p-3.5">Fase / Peminatan</th>
                <th className="p-3.5">Wali Kelas</th>
                <th className="p-3.5 text-center">Jml Siswa</th>
                <th className="p-3.5">Tahun Ajaran</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => {
                  const studentCount = students.filter((s) => s.classId === cls.id).length;
                  const isSelected = selectedIds.includes(cls.id);
                  return (
                    <tr
                      key={cls.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/40' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleSelect(cls.id)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                          aria-label={`Pilih ${cls.name}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-500" />
                        <span>{cls.name}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">Kelas {cls.level}</td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">{cls.major}</td>
                      <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">{cls.homeroomTeacher}</td>
                      <td className="p-3.5 text-center font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {studentCount}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">{cls.academicYear}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(cls)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            title="Edit Kelas"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerDeleteSingle(cls.id, cls.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            title="Hapus Kelas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <p>Tidak ada kelas yang sesuai pencarian.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah / Edit Kelas (Fully Accessible in Dark Mode) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold">
                  {editingClass ? 'Edit Informasi Kelas' : 'Tambah Kelas Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Nama Rombongan Belajar (Kelas) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: X.1 (Fase E-1), XI.F-1 (MIPA)"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Tingkat
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-medium"
                  >
                    <option value="10" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Kelas 10 (Fase E)</option>
                    <option value="11" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Kelas 11 (Fase F)</option>
                    <option value="12" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Kelas 12 (Fase F/Akhir)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Tahun Pelajaran
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2026/2027"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono placeholder:text-slate-400 dark:placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Kurikulum / Peminatan
                </label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Fase E (Umum) / Pilihan MIPA / Pilihan IPS"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Wali Kelas
                </label>
                <input
                  type="text"
                  value={homeroomTeacher}
                  onChange={(e) => setHomeroomTeacher(e.target.value)}
                  placeholder="Contoh: Dra. Hj. Nurhayati, M.Pd."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400"
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
                  {editingClass ? 'Simpan Perubahan' : 'Tambahkan Kelas'}
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
        title={deleteModal.isBatch ? 'Hapus Kelas Sekaligus' : 'Hapus Data Kelas'}
        message={
          deleteModal.isBatch
            ? `Apakah Anda yakin ingin menghapus ${deleteModal.name}? Seluruh rombel yang dipilih akan dihapus secara permanen.`
            : `Apakah Anda yakin ingin menghapus kelas "${deleteModal.name}"? Siswa di kelas ini tidak akan terhubung lagi.`
        }
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
