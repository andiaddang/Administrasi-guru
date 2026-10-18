import React, { useState, useRef } from 'react';
import { Student, ClassRoom, Gender } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  Users,
  Search,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Download,
  Upload,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface StudentManagementProps {
  students: Student[];
  classes: ClassRoom[];
  onAddStudent: (newStudent: Omit<Student, 'id'>) => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  onDeleteStudent: (id: string) => void;
  onDeleteBatchStudents: (ids: string[]) => void;
  onBatchImportStudents: (newStudents: Omit<Student, 'id'>[]) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  classes,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onDeleteBatchStudents,
  onBatchImportStudents,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states
  const [nisn, setNisn] = useState('');
  const [nis, setNis] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('L');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [parentPhone, setParentPhone] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Mutasi' | 'Alumni'>('Aktif');

  // Import states
  const [importPreview, setImportPreview] = useState<Array<Omit<Student, 'id'>>>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.nis.includes(searchTerm) ||
      s.parentPhone.includes(searchTerm);
    return matchesClass && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setNisn(`008${Math.floor(1000000 + Math.random() * 9000000)}`);
    setNis(`2425${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setGender('L');
    setClassId(selectedClassFilter !== 'all' ? selectedClassFilter : classes[0]?.id || '');
    setParentPhone('08');
    setStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setNisn(student.nisn);
    setNis(student.nis);
    setName(student.name);
    setGender(student.gender);
    setClassId(student.classId);
    setParentPhone(student.parentPhone);
    setStatus(student.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nisn.trim()) return;

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        nisn: nisn.trim(),
        nis: nis.trim() || nisn.trim(),
        name: name.trim(),
        gender,
        classId,
        parentPhone: parentPhone.trim() || '-',
        status,
      });
    } else {
      onAddStudent({
        nisn: nisn.trim(),
        nis: nis.trim() || nisn.trim(),
        name: name.trim(),
        gender,
        classId,
        parentPhone: parentPhone.trim() || '-',
        status,
      });
    }
    setIsModalOpen(false);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus ${selectedIds.length} data siswa terpilih?`
      )
    ) {
      onDeleteBatchStudents(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleDeleteSingle = (id: string, studentName: string) => {
    if (window.confirm(`Hapus data siswa "${studentName}"?`)) {
      onDeleteStudent(id);
      setSelectedIds(selectedIds.filter((item) => item !== id));
    }
  };

  // Unduh Template CSV
  const handleDownloadTemplateCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        'NISN,NIS,NamaLengkap,JenisKelamin,NamaKelas,KontakOrtu\n' +
          '0081234991,2425101,Andi Muhammad Ilham,L,X.1 (Fase E-1),081234567890\n' +
          '0081234992,2425102,Nurul Fatimah Az-Zahra,P,X.1 (Fase E-1),081298765432\n' +
          '0071234993,2324103,Bima Sakti Pratama,L,XI.F-1 (MIPA),085211223344\n'
      );
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'Template_Import_Siswa_SMAN1GOWA.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unduh Template Excel (.xlsx) menggunakan SheetJS
  const handleDownloadTemplateXlsx = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      handleDownloadTemplateCsv();
      return;
    }
    const sampleData = [
      {
        NISN: '0081234991',
        NIS: '2425101',
        NamaLengkap: 'Andi Muhammad Ilham',
        JenisKelamin: 'L',
        NamaKelas: 'X.1 (Fase E-1)',
        KontakOrtu: '081234567890',
      },
      {
        NISN: '0081234992',
        NIS: '2425102',
        NamaLengkap: 'Nurul Fatimah Az-Zahra',
        JenisKelamin: 'P',
        NamaKelas: 'X.1 (Fase E-1)',
        KontakOrtu: '081298765432',
      },
      {
        NISN: '0071234993',
        NIS: '2324103',
        NamaLengkap: 'Bima Sakti Pratama',
        JenisKelamin: 'L',
        NamaKelas: 'XI.F-1 (MIPA)',
        KontakOrtu: '085211223344',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DataSiswa');
    XLSX.writeFile(workbook, 'Template_Import_Siswa_SMAN1GOWA.xlsx');
  };

  // Export Siswa ke Excel
  const handleExportStudents = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) return;

    const exportData = filteredStudents.map((s, idx) => {
      const cls = classes.find((c) => c.id === s.classId);
      return {
        No: idx + 1,
        NISN: s.nisn,
        NIS: s.nis,
        NamaLengkap: s.name,
        JK: s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        Kelas: cls?.name || '-',
        KontakOrtu: s.parentPhone,
        Status: s.status,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Siswa');
    XLSX.writeFile(workbook, `Daftar_Siswa_SMAN1Gowa_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Handle Import File (Excel / CSV)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportPreview([]);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const XLSX = (window as any).XLSX;
        if (!XLSX) {
          throw new Error('Pustaka SheetJS belum dimuat di browser.');
        }

        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          throw new Error('File excel/csv kosong atau format tidak sesuai.');
        }

        const parsedList: Array<Omit<Student, 'id'>> = [];

        for (const row of json) {
          const rawName = row['NamaLengkap'] || row['Nama'] || row['nama'] || row['name'] || '';
          const rawNisn = String(row['NISN'] || row['nisn'] || '').trim();
          const rawNis = String(row['NIS'] || row['nis'] || rawNisn).trim();
          const rawGender = String(row['JenisKelamin'] || row['JK'] || row['gender'] || 'L')
            .toUpperCase()
            .startsWith('P')
            ? 'P'
            : 'L';
          const rawClassName = String(row['NamaKelas'] || row['Kelas'] || '').trim();
          const rawPhone = String(row['KontakOrtu'] || row['HP'] || row['Telepon'] || '-').trim();

          if (!rawName) continue;

          // Match class
          let matchedClassId = classes[0]?.id || '';
          if (rawClassName) {
            const foundClass = classes.find(
              (c) =>
                c.name.toLowerCase() === rawClassName.toLowerCase() ||
                c.name.toLowerCase().includes(rawClassName.toLowerCase())
            );
            if (foundClass) matchedClassId = foundClass.id;
          }

          parsedList.push({
            nisn: rawNisn || `008${Math.floor(1000000 + Math.random() * 9000000)}`,
            nis: rawNis || `2425${Math.floor(100 + Math.random() * 900)}`,
            name: rawName,
            gender: rawGender as Gender,
            classId: matchedClassId,
            parentPhone: rawPhone,
            status: 'Aktif',
          });
        }

        if (parsedList.length === 0) {
          throw new Error('Tidak ada baris data siswa yang valid ditemukan.');
        }

        setImportPreview(parsedList);
      } catch (err: any) {
        setImportError(err.message || 'Gagal memproses file import.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (importPreview.length === 0) return;
    onBatchImportStudents(importPreview);
    setIsImportModalOpen(false);
    setImportPreview([]);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Manajemen Data Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar biodata, NISN, status kelas, dan kontak orang tua siswa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setImportPreview([]);
              setImportError(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import Excel / CSV
          </button>

          <button
            onClick={handleExportStudents}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export (.xlsx)
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NISN, atau kontak ortu..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          {/* Filter Kelas */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Kelas:</label>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Kelas ({students.length})</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({students.filter((s) => s.classId === cls.id).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Batch Action Strip */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg animate-in fade-in">
            <span className="text-xs font-medium text-rose-800">
              {selectedIds.length} siswa dipilih
            </span>
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Sekaligus
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-slate-500 hover:text-slate-800 cursor-pointer"
                    aria-label="Pilih Semua Siswa"
                  >
                    {filteredStudents.length > 0 &&
                    selectedIds.length === filteredStudents.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">NISN / NIS</th>
                <th className="p-3.5">Nama Lengkap Siswa</th>
                <th className="p-3.5 text-center">L/P</th>
                <th className="p-3.5">Rombel / Kelas</th>
                <th className="p-3.5">Kontak Ortu (WA)</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const cls = classes.find((c) => c.id === student.classId);
                  const isSelected = selectedIds.includes(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleSelect(student.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          aria-label={`Pilih ${student.name}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 font-mono">
                        <div className="font-semibold text-slate-900">{student.nisn}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIS: {student.nis}</div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{student.name}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`font-semibold text-xs ${
                            student.gender === 'L' ? 'text-blue-600' : 'text-pink-600'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium">{cls?.name || 'Tanpa Kelas'}</td>
                      <td className="p-3.5 font-mono text-slate-600">{student.parentPhone}</td>
                      <td className="p-3.5">
                        <span
                          className={`text-[11px] font-medium ${
                            student.status === 'Aktif'
                              ? 'text-emerald-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                            title="Edit Siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSingle(student.id, student.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Hapus Siswa"
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
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <p>Tidak ada data siswa ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Siswa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <h3 className="text-sm font-bold">
                {editingStudent ? 'Edit Biodata Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Muh. Fajar Ramadhan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">NISN (10 Digit) *</label>
                  <input
                    type="text"
                    required
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    placeholder="0081234567"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">NIS Lokal</label>
                  <input
                    type="text"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="2425001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
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
                <label className="block font-medium text-slate-700 mb-1">
                  Kontak Telepon / WA Orang Tua
                </label>
                <input
                  type="text"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Status Keaktifan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Mutasi">Mutasi Keluar</option>
                  <option value="Alumni">Alumni / Lulus</option>
                </select>
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
                  {editingStudent ? 'Simpan Perubahan' : 'Tambahkan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Siswa via Excel/CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Import Data Siswa dari Excel / CSV</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Step 1: Template download */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">
                    Belum punya format template yang sesuai?
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gunakan template resmi agar nama kolom cocok otomatis.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadTemplateCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh CSV
                  </button>
                  <button
                    onClick={handleDownloadTemplateXlsx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Unduh Excel (.xlsx)
                  </button>
                </div>
              </div>

              {/* Step 2: File upload input */}
              <div>
                <label className="block font-medium text-slate-700 mb-2">
                  Pilih File Excel (.xlsx, .xls) atau CSV (.csv):
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 p-2 rounded-lg bg-slate-50"
                />
              </div>

              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview Rows */}
              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800">
                      Pratinjau Data ({importPreview.length} siswa siap diimport):
                    </p>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 sticky top-0 font-semibold text-slate-700">
                        <tr>
                          <th className="p-2">NISN</th>
                          <th className="p-2">Nama Lengkap</th>
                          <th className="p-2">L/P</th>
                          <th className="p-2">Kelas</th>
                          <th className="p-2">Kontak Ortu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.map((s, idx) => {
                          const cls = classes.find((c) => c.id === s.classId);
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 font-mono">{s.nisn}</td>
                              <td className="p-2 font-medium">{s.name}</td>
                              <td className="p-2">{s.gender}</td>
                              <td className="p-2">{cls?.name || 'Umum'}</td>
                              <td className="p-2 font-mono">{s.parentPhone}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={importPreview.length === 0}
                  onClick={handleConfirmImport}
                  className={`px-4 py-2 font-semibold rounded-lg shadow-sm transition-colors cursor-pointer ${
                    importPreview.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Konfirmasi Import ({importPreview.length} Siswa)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
