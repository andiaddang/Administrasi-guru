import React, { useState, useRef, useMemo } from 'react';
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
  ClipboardPaste,
  CheckCircle2,
  Sparkles,
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
  const [addMode, setAddMode] = useState<'paste' | 'single'>('paste');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Single Form states (NISN dan NIS digabung)
  const [nisnNis, setNisnNis] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('L');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [parentPhone, setParentPhone] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Mutasi' | 'Alumni'>('Aktif');

  // Multi-Student Quick Copy-Paste state
  const [pasteTargetClassId, setPasteTargetClassId] = useState(classes[0]?.id || '');
  const [rawPastedText, setRawPastedText] = useState('');

  // Import states
  const [importPreview, setImportPreview] = useState<Array<Omit<Student, 'id'>>>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to parse pasted raw lines into structured student items
  const parsedPastedStudents = useMemo(() => {
    if (!rawPastedText.trim()) return [];

    const lines = rawPastedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const result: Array<Omit<Student, 'id'>> = [];

    lines.forEach((line) => {
      // 1. Remove leading list numbering like "1. ", "1) ", "1 - ", "1: "
      const cleanLine = line.replace(/^\s*\d+[\.\)\-:\s]+\s*/, '').trim();
      if (!cleanLine) return;

      // 2. Try splitting by tab, semicolon, comma, or double space
      let tokens: string[] = [];
      if (cleanLine.includes('\t')) {
        tokens = cleanLine.split('\t').map((t) => t.trim());
      } else if (cleanLine.includes(';')) {
        tokens = cleanLine.split(';').map((t) => t.trim());
      } else if (cleanLine.includes(',')) {
        tokens = cleanLine.split(',').map((t) => t.trim());
      } else if (/\s{2,}/.test(cleanLine)) {
        tokens = cleanLine.split(/\s{2,}/).map((t) => t.trim());
      } else {
        // Fallback for single space separated text:
        // Pattern: [NISN/NIS] [Nama Lengkap Siswa] [L/P/Laki-laki/Perempuan]
        // E.g.: "0081234991 / 2425001 Andi Muhammad Ilham L" or "0081234991 Andi Muhammad Ilham L"
        const spaceMatch = cleanLine.match(
          /^(\S+(?:\s*\/\s*\S+)?)\s+(.+?)(?:\s+([LP]|Laki-laki|Perempuan|Wanita|Pria))?$/i
        );
        if (spaceMatch) {
          tokens = [spaceMatch[1], spaceMatch[2]];
          if (spaceMatch[3]) tokens.push(spaceMatch[3]);
        } else {
          tokens = cleanLine.split(/\s+/).map((t) => t.trim());
        }
      }

      // Filter out empty tokens
      tokens = tokens.filter((t) => t.length > 0);
      if (tokens.length < 2) return;

      // Token 0: NISN/NIS
      const rawNis = tokens[0];
      // Token 1: Nama
      const rawName = tokens[1];
      // Token 2 (or last token): Gender
      let rawGenderToken = tokens[2] || 'L';
      let parsedGender: Gender = 'L';

      const gClean = rawGenderToken.toUpperCase();
      if (
        gClean === 'P' ||
        gClean.startsWith('PER') ||
        gClean === 'PR' ||
        gClean === 'F' ||
        gClean.startsWith('WAN')
      ) {
        parsedGender = 'P';
      } else {
        parsedGender = 'L';
      }

      // Token 3 (optional): Nomor HP
      const rawPhone = tokens[3] || '-';

      if (rawName && rawName.toLowerCase() !== 'nama' && rawName.toLowerCase() !== 'nama lengkap') {
        result.push({
          nisnNis: rawNis,
          nisn: rawNis,
          nis: rawNis,
          name: rawName,
          gender: parsedGender,
          classId: pasteTargetClassId,
          parentPhone: rawPhone,
          status: 'Aktif',
        });
      }
    });

    return result;
  }, [rawPastedText, pasteTargetClassId]);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
    const combinedId = s.nisnNis || `${s.nisn || ''} ${s.nis || ''}`;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      combinedId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.parentPhone && s.parentPhone.includes(searchTerm));
    return matchesClass && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setAddMode('paste');
    setRawPastedText('');
    setPasteTargetClassId(selectedClassFilter !== 'all' ? selectedClassFilter : classes[0]?.id || '');
    setNisnNis(`008${Math.floor(1000000 + Math.random() * 9000000)} / 2425${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setGender('L');
    setClassId(selectedClassFilter !== 'all' ? selectedClassFilter : classes[0]?.id || '');
    setParentPhone('08');
    setStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setAddMode('single');
    setNisnNis(student.nisnNis || `${student.nisn || ''}${student.nis ? ` / ${student.nis}` : ''}`);
    setName(student.name);
    setGender(student.gender);
    setClassId(student.classId);
    setParentPhone(student.parentPhone || '');
    setStatus(student.status);
    setIsModalOpen(true);
  };

  // Auto-fill single form fields from a pasted single line
  const handleAutoFillSingleLine = (raw: string) => {
    let clean = raw.replace(/^\s*\d+[\.\)\-:\s]+\s*/, '').trim();
    let tokens: string[] = [];
    if (clean.includes('\t')) tokens = clean.split('\t');
    else if (clean.includes(';')) tokens = clean.split(';');
    else if (clean.includes(',')) tokens = clean.split(',');
    else if (/\s{2,}/.test(clean)) tokens = clean.split(/\s{2,}/);
    else {
      const match = clean.match(
        /^(\S+(?:\s*\/\s*\S+)?)\s+(.+?)(?:\s+([LP]|Laki-laki|Perempuan|Wanita|Pria))?$/i
      );
      if (match) {
        tokens = [match[1], match[2]];
        if (match[3]) tokens.push(match[3]);
      } else {
        tokens = clean.split(/\s+/);
      }
    }
    tokens = tokens.map((t) => t.trim()).filter((t) => t.length > 0);
    if (tokens.length >= 2) {
      setNisnNis(tokens[0]);
      setName(tokens[1]);
      if (tokens[2]) {
        const g = tokens[2].toUpperCase();
        if (g === 'P' || g.startsWith('PER') || g.startsWith('WAN') || g === 'PR' || g === 'F') {
          setGender('P');
        } else {
          setGender('L');
        }
      }
      if (tokens[3]) setParentPhone(tokens[3]);
    }
  };

  // Submit Single Student
  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nisnNis.trim()) return;

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        nisnNis: nisnNis.trim(),
        nisn: nisnNis.trim(),
        nis: nisnNis.trim(),
        name: name.trim(),
        gender,
        classId,
        parentPhone: parentPhone.trim() || '-',
        status,
      });
    } else {
      onAddStudent({
        nisnNis: nisnNis.trim(),
        nisn: nisnNis.trim(),
        nis: nisnNis.trim(),
        name: name.trim(),
        gender,
        classId,
        parentPhone: parentPhone.trim() || '-',
        status,
      });
    }
    setIsModalOpen(false);
  };

  // Submit Quick Pasted Students
  const handleSubmitPasted = () => {
    if (parsedPastedStudents.length === 0) return;
    onBatchImportStudents(parsedPastedStudents);
    setIsModalOpen(false);
    setRawPastedText('');
  };

  // Fill sample paste content
  const handleFillSamplePaste = () => {
    const sample = 
`0081234991	Andi Muhammad Ilham	L	081242001122
0081234992	Nurul Fatimah Az-Zahra	P	081242001133
0081234993	Bima Sakti Pratama	L	081342110044
0081234994	Siti Khadijah Al-Munawwarah	P	085242551155
0081234995	Rizky Fauzan Arsyad	L	081298765432`;
    setRawPastedText(sample);
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
        'NISN_NIS,NamaLengkap,JenisKelamin,NamaKelas,KontakOrtu\n' +
          '0081234991 / 2425101,Andi Muhammad Ilham,L,X.1 (Fase E-1),081234567890\n' +
          '0081234992 / 2425102,Nurul Fatimah Az-Zahra,P,X.1 (Fase E-1),081298765432\n' +
          '0071234993 / 2324103,Bima Sakti Pratama,L,XI.F-1 (MIPA),085211223344\n'
      );
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'Template_Import_Siswa_SMAN1GOWA.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unduh Template Excel (.xlsx)
  const handleDownloadTemplateXlsx = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      handleDownloadTemplateCsv();
      return;
    }
    const sampleData = [
      {
        NISN_NIS: '0081234991 / 2425101',
        NamaLengkap: 'Andi Muhammad Ilham',
        JenisKelamin: 'L',
        NamaKelas: 'X.1 (Fase E-1)',
        KontakOrtu: '081234567890',
      },
      {
        NISN_NIS: '0081234992 / 2425102',
        NamaLengkap: 'Nurul Fatimah Az-Zahra',
        JenisKelamin: 'P',
        NamaKelas: 'X.1 (Fase E-1)',
        KontakOrtu: '081298765432',
      },
      {
        NISN_NIS: '0071234993 / 2324103',
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
        'NISN / NIS': s.nisnNis || `${s.nisn || ''}${s.nis ? ` / ${s.nis}` : ''}`,
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
        if (!XLSX) throw new Error('Pustaka SheetJS belum dimuat di browser.');

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
          const rawId = String(row['NISN_NIS'] || row['NISN / NIS'] || row['NISN'] || row['nisn'] || '').trim();
          const rawGender = String(row['JenisKelamin'] || row['JK'] || row['gender'] || 'L')
            .toUpperCase()
            .startsWith('P')
            ? 'P'
            : 'L';
          const rawClassName = String(row['NamaKelas'] || row['Kelas'] || '').trim();
          const rawPhone = String(row['KontakOrtu'] || row['HP'] || row['Telepon'] || '-').trim();

          if (!rawName) continue;

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
            nisnNis: rawId || `008${Math.floor(1000000 + Math.random() * 9000000)}`,
            nisn: rawId,
            nis: rawId,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Manajemen Data Siswa
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar biodata, NISN / NIS gabungan, rombel kelas, dan kontak orang tua
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setImportPreview([]);
              setImportError(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
          >
            <Upload className="w-4 h-4" />
            Import Excel / CSV
          </button>

          <button
            onClick={handleExportStudents}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NISN / NIS, atau kontak..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Filter Kelas */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Kelas:</label>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-3 py-1.5 rounded-lg animate-in fade-in">
            <span className="text-xs font-medium text-rose-800 dark:text-rose-200">
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
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                    aria-label="Pilih Semua Siswa"
                  >
                    {filteredStudents.length > 0 &&
                    selectedIds.length === filteredStudents.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const cls = classes.find((c) => c.id === student.classId);
                  const isSelected = selectedIds.includes(student.id);
                  const displayNis = student.nisnNis || `${student.nisn || ''}${student.nis ? ` / ${student.nis}` : ''}`;
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleSelect(student.id)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                          aria-label={`Pilih ${student.name}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {displayNis}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{student.name}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`font-semibold text-xs ${
                            student.gender === 'L' ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium">{cls?.name || 'Tanpa Kelas'}</td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{student.parentPhone}</td>
                      <td className="p-3.5">
                        <span
                          className={`text-[11px] font-medium ${
                            student.status === 'Aktif'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            title="Edit Siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSingle(student.id, student.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
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

      {/* MODAL TAMBAH / EDIT SISWA (MENDUKUNG COPY-PASTE KILAT & INPUT TUNGGAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">
                  {editingStudent
                    ? 'Edit Data Siswa'
                    : 'Tambah Siswa (Copy-Paste Langsung / Manual)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs (Only if not editing) */}
            {!editingStudent && (
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAddMode('paste')}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    addMode === 'paste'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ClipboardPaste className="w-4 h-4 text-indigo-500" />
                  <span>Copy-Paste Cepat (Multi-Siswa Sekaligus)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('single')}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    addMode === 'single'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Plus className="w-4 h-4 text-indigo-500" />
                  <span>Input Satu Per Satu (Formulir Manual)</span>
                </button>
              </div>
            )}

            {/* TAB 1: COPY-PASTE LANGSUNG (MULTI-SISWA) */}
            {addMode === 'paste' && !editingStudent ? (
              <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                {/* Target Class & Helper */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 p-3.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      Masukkan ke Kelas:
                    </label>
                    <select
                      value={pasteTargetClassId}
                      onChange={(e) => setPasteTargetClassId(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    onClick={handleFillSamplePaste}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Isi Contoh Format
                  </button>
                </div>

                {/* Paste Area */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Tempel (Paste) Data Siswa dari Excel / Spreadsheet / Catatan:
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Format per baris: [NISN/NIS] [NAMA] [L/P]
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={rawPastedText}
                    onChange={(e) => setRawPastedText(e.target.value)}
                    placeholder="Contoh salin langsung dari Excel (kolom otomatis terbaca):&#10;0081234991	Andi Muhammad Ilham	L&#10;0081234992	Nurul Fatimah Az-Zahra	P&#10;0081234993	Bima Sakti Pratama	L"
                    className="w-full p-3 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    *Mendukung pemisah Tab (copy langsung dari tabel Excel/Sheets), koma, titik koma, atau spasi.
                  </p>
                </div>

                {/* Realtime Live Preview */}
                {parsedPastedStudents.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Terdeteksi {parsedPastedStudents.length} Siswa Siap Ditambahkan:
                      </span>
                    </div>

                    <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-semibold">
                          <tr>
                            <th className="p-2 w-8 text-center">No</th>
                            <th className="p-2">NISN / NIS</th>
                            <th className="p-2">Nama Lengkap</th>
                            <th className="p-2 text-center w-12">L/P</th>
                            <th className="p-2">No HP Ortu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {parsedPastedStudents.map((s, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                              <td className="p-2 font-mono font-medium text-slate-900 dark:text-white">
                                {s.nisnNis}
                              </td>
                              <td className="p-2 font-bold text-slate-900 dark:text-white">{s.name}</td>
                              <td className="p-2 text-center font-semibold text-slate-600 dark:text-slate-300">
                                {s.gender}
                              </td>
                              <td className="p-2 font-mono text-slate-500">{s.parentPhone || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={parsedPastedStudents.length === 0}
                    onClick={handleSubmitPasted}
                    className={`px-4 py-2 font-semibold rounded-lg shadow-sm transition-colors cursor-pointer ${
                      parsedPastedStudents.length > 0
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    Tambahkan {parsedPastedStudents.length} Siswa Sekaligus
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: INPUT FORMULIR TUNGGAL (NISN/NIS DIGABUNG) */
              <form onSubmit={handleSubmitSingle} className="p-5 space-y-3.5 text-xs">
                {!editingStudent && (
                  <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 mb-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        Copy-Paste 1 Baris Cepat (Auto-Fill Form):
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Format: [NISN/NIS] [NAMA] [L/P]
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Tempel di sini, misal: 0081234991 / 2425001 Andi Muhammad Ilham L"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      onPaste={(e) => {
                        const text = e.clipboardData.getData('text');
                        if (text) {
                          handleAutoFillSingleLine(text);
                        }
                      }}
                      onChange={(e) => {
                        if (
                          e.target.value.includes('\t') ||
                          e.target.value.includes(';') ||
                          e.target.value.includes(',') ||
                          e.target.value.split(/\s+/).length >= 3
                        ) {
                          handleAutoFillSingleLine(e.target.value);
                        }
                      }}
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Cukup tempel (Ctrl+V) baris teks di atas, kolom NISN/NIS, Nama, dan Jenis Kelamin akan otomatis terisi!
                    </p>
                  </div>
                )}

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap Siswa *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Muh. Fajar Ramadhan"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    NISN / NIS (Digabungkan) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nisnNis}
                    onChange={(e) => setNisnNis(e.target.value)}
                    placeholder="Contoh: 0081234002 / 2425002 atau 0081234002"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Anda dapat memasukkan nomor identitas siswa secara gabungan.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Rombel / Kelas
                    </label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kontak Telepon / WA Orang Tua
                  </label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status Keaktifan
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Mutasi">Mutasi Keluar</option>
                    <option value="Alumni">Alumni / Lulus</option>
                  </select>
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
                    {editingStudent ? 'Simpan Perubahan' : 'Tambahkan Siswa'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Import Siswa via Excel/CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between p-4 bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800">
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
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Format Template Import Siswa:
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Kolom NISN dan NIS digabung dalam format kolom <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">NISN_NIS</code>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadTemplateCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh CSV
                  </button>
                  <button
                    onClick={handleDownloadTemplateXlsx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Unduh Excel (.xlsx)
                  </button>
                </div>
              </div>

              {/* Step 2: File upload input */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Pilih File Excel (.xlsx, .xls) atau CSV (.csv):
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-950 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 dark:border-slate-700 p-2 rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {importError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview Rows */}
              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Pratinjau Data ({importPreview.length} siswa siap diimport):
                    </p>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-semibold text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-2">NISN / NIS</th>
                          <th className="p-2">Nama Lengkap</th>
                          <th className="p-2">L/P</th>
                          <th className="p-2">Kelas</th>
                          <th className="p-2">Kontak Ortu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {importPreview.map((s, idx) => {
                          const cls = classes.find((c) => c.id === s.classId);
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-2 font-mono font-medium">{s.nisnNis}</td>
                              <td className="p-2 font-bold">{s.name}</td>
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
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
