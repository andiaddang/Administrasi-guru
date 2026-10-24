import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  Zap,
  Check,
  Clipboard,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  GripVertical,
  ArrowUpDown,
} from 'lucide-react';

interface StudentManagementProps {
  students: Student[];
  classes: ClassRoom[];
  onAddStudent: (newStudent: Omit<Student, 'id'>) => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  onBatchUpdateStudents?: (updatedStudents: Student[]) => void;
  onDeleteStudent: (id: string) => void;
  onDeleteBatchStudents: (ids: string[]) => void;
  onBatchImportStudents: (newStudents: Omit<Student, 'id'>[]) => void;
  onReorderStudents?: (reorderedStudents: Student[]) => void;
}

// Universal parser for external clipboard text (Excel, Sheets, Word, WhatsApp, Web table)
export function parseExternalStudentText(
  rawText: string,
  defaultClassId: string,
  classes: ClassRoom[]
): Array<Omit<Student, 'id'>> {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const result: Array<Omit<Student, 'id'>> = [];

  for (const line of lines) {
    // 1. Remove leading list numbering like "1. ", "1) ", "1 - ", "1: ", "#1 "
    const cleanLine = line.replace(/^\s*(?:#|\b)?\d+[\.\)\-:\s]+\s*/, '').trim();
    if (!cleanLine) continue;

    // Skip table headers if copied with header row like "NISN\tNama\tJK"
    const lowerLine = cleanLine.toLowerCase();
    if (
      (lowerLine.includes('nisn') || lowerLine.includes('nomor induk')) &&
      (lowerLine.includes('nama') || lowerLine.includes('siswa'))
    ) {
      continue;
    }

    // 2. Try splitting by tab, semicolon, comma, or double/multiple space
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
      // Single space separated pattern: [NISN/NIS] [Nama Siswa] [L/P/Laki-laki/Perempuan]
      const spaceMatch = cleanLine.match(
        /^(\S+(?:\s*\/\s*\S+)?)\s+(.+?)(?:\s+([LP]|Laki-laki|Perempuan|Wanita|Pria))?(?:\s+(\+?\d[\d\s\-]{7,}\d))?$/i
      );
      if (spaceMatch) {
        tokens = [spaceMatch[1], spaceMatch[2]];
        if (spaceMatch[3]) tokens.push(spaceMatch[3]);
        if (spaceMatch[4]) tokens.push(spaceMatch[4]);
      } else {
        tokens = cleanLine.split(/\s+/).map((t) => t.trim());
      }
    }

    // Filter empty tokens
    tokens = tokens.filter((t) => t.length > 0);
    if (tokens.length < 2) continue;

    // Token 0: NISN or NISN/NIS
    const rawNis = tokens[0];
    // Token 1: Nama
    const rawName = tokens[1];

    let parsedGender: Gender = 'L';
    let targetClassId = defaultClassId;
    let rawPhone = '-';

    for (let i = 2; i < tokens.length; i++) {
      const tok = tokens[i].trim();
      const tokUpper = tok.toUpperCase();
      if (
        tokUpper === 'P' ||
        tokUpper.startsWith('PER') ||
        tokUpper === 'PR' ||
        tokUpper === 'F' ||
        tokUpper.startsWith('WAN')
      ) {
        parsedGender = 'P';
      } else if (
        tokUpper === 'L' ||
        tokUpper.startsWith('LAK') ||
        tokUpper.startsWith('PRI') ||
        tokUpper === 'M'
      ) {
        parsedGender = 'L';
      } else if (tok.match(/^\+?0?8[\d\-]{7,}$/) || tok.match(/^\d{9,}$/)) {
        rawPhone = tok;
      } else {
        // Attempt to match a class name
        const matchedClass = classes.find(
          (c) =>
            c.name.toLowerCase() === tok.toLowerCase() ||
            c.name.toLowerCase().includes(tok.toLowerCase())
        );
        if (matchedClass) {
          targetClassId = matchedClass.id;
        }
      }
    }

    if (rawName && rawName.toLowerCase() !== 'nama' && rawName.toLowerCase() !== 'nama lengkap') {
      result.push({
        nisnNis: rawNis,
        nisn: rawNis,
        nis: rawNis,
        name: rawName,
        gender: parsedGender,
        classId: targetClassId,
        parentPhone: rawPhone,
        status: 'Aktif',
      });
    }
  }

  return result;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  classes,
  onAddStudent,
  onUpdateStudent,
  onBatchUpdateStudents,
  onDeleteStudent,
  onDeleteBatchStudents,
  onBatchImportStudents,
  onReorderStudents,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(() => classes[0]?.id || '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Keep selectedClassFilter valid when classes load
  useEffect(() => {
    if ((!selectedClassFilter || !classes.some((c) => c.id === selectedClassFilter)) && classes.length > 0) {
      setSelectedClassFilter(classes[0].id);
    }
  }, [classes, selectedClassFilter]);

  // DRAG AND DROP REORDER STATE
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [dragOverStudentId, setDragOverStudentId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below'>('above');

  // INLINE EDITING STATE
  const [isInlineEditMode, setIsInlineEditMode] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // EXTERNAL PASTE STATE
  const [isQuickPasteBoxOpen, setIsQuickPasteBoxOpen] = useState(false);
  const [quickPasteText, setQuickPasteText] = useState('');
  const [quickPasteClassId, setQuickPasteClassId] = useState(
    selectedClassFilter || classes[0]?.id || ''
  );
  const [quickPasteOverwriteDuplicates, setQuickPasteOverwriteDuplicates] = useState(true);

  // MODAL DETEKSI PASTE DARI LUAR (Ctrl+V Popup)
  const [clipboardDetectedModalOpen, setClipboardDetectedModalOpen] = useState(false);
  const [detectedClipboardStudents, setDetectedClipboardStudents] = useState<
    Array<Omit<Student, 'id'>>
  >([]);
  const [detectedClassId, setDetectedClassId] = useState(
    selectedClassFilter || classes[0]?.id || ''
  );
  const [detectedOverwriteDuplicates, setDetectedOverwriteDuplicates] = useState(true);

  // MODALS LAINNYA
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

  // Multi-Student Quick Copy-Paste modal state
  const [pasteTargetClassId, setPasteTargetClassId] = useState(classes[0]?.id || '');
  const [rawPastedText, setRawPastedText] = useState('');

  // Import states
  const [importPreview, setImportPreview] = useState<Array<Omit<Student, 'id'>>>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const quickPasteInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Notification helper
  const showSaveToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => {
      setSaveToast((curr) => (curr === msg ? null : curr));
    }, 2500);
  };

  // Keep target class in sync when filter changes
  useEffect(() => {
    if (selectedClassFilter) {
      setPasteTargetClassId(selectedClassFilter);
      setQuickPasteClassId(selectedClassFilter);
      setDetectedClassId(selectedClassFilter);
    }
  }, [selectedClassFilter]);

  // GLOBAL PASTE LISTENER (Ctrl+V dari Excel / Sumber Luar)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Check if user is typing in standard inputs (except if multi-line is pasted into single input)
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        !target.classList.contains('allow-global-paste-intercept');

      const text = e.clipboardData?.getData('text');
      if (!text || !text.trim()) return;

      // If user is focused on a textarea or input but pasted multi-line student table, intercept!
      const hasMultipleLines = text.includes('\n') || text.includes('\t');
      if (isInput && !hasMultipleLines) {
        return; // Allow normal typing in single fields
      }

      // Check if text looks like student data
      const defaultCls = selectedClassFilter || classes[0]?.id || '';
      const parsed = parseExternalStudentText(text, defaultCls, classes);

      if (parsed.length >= 1) {
        e.preventDefault();
        setDetectedClipboardStudents(parsed);
        setDetectedClassId(defaultCls);
        setClipboardDetectedModalOpen(true);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [selectedClassFilter, classes]);

  // Parse students inside the quick paste box in real-time
  const parsedQuickPasteStudents = useMemo(() => {
    return parseExternalStudentText(quickPasteText, quickPasteClassId, classes);
  }, [quickPasteText, quickPasteClassId, classes]);

  // Parse students inside the modal tab in real-time
  const parsedPastedStudents = useMemo(() => {
    return parseExternalStudentText(rawPastedText, pasteTargetClassId, classes);
  }, [rawPastedText, pasteTargetClassId, classes]);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesClass = !selectedClassFilter ? true : s.classId === selectedClassFilter;
    const combinedId = s.nisnNis || `${s.nisn || ''} ${s.nis || ''}`;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      combinedId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.parentPhone && s.parentPhone.includes(searchTerm));
    return matchesClass && matchesSearch;
  });

  // Handle direct inline update for a field
  const handleInlineFieldChange = (student: Student, field: keyof Student, value: any) => {
    const updated: Student = {
      ...student,
      [field]: value,
    };
    if (field === 'nisnNis') {
      updated.nisn = value;
      updated.nis = value;
    }
    onUpdateStudent(updated);
    showSaveToast('Perubahan tersimpan otomatis');
  };

  // Handle instant 1-tap gender toggle
  const handleToggleGender = (student: Student) => {
    const newGender: Gender = student.gender === 'L' ? 'P' : 'L';
    const updated: Student = {
      ...student,
      gender: newGender,
    };
    onUpdateStudent(updated);
    showSaveToast(`Jenis kelamin ${student.name.split(' ')[0]} diubah ke ${newGender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}`);
  };

  // Handle Drag and Drop Reordering
  const handleReorderStudents = (draggedId: string, targetId: string, position: 'above' | 'below') => {
    if (draggedId === targetId) return;

    const currentList = [...students];
    const fromIndex = currentList.findIndex((s) => s.id === draggedId);
    if (fromIndex === -1) return;

    const [draggedItem] = currentList.splice(fromIndex, 1);

    let toIndex = currentList.findIndex((s) => s.id === targetId);
    if (toIndex === -1) {
      currentList.push(draggedItem);
    } else {
      if (position === 'below') {
        toIndex += 1;
      }
      currentList.splice(toIndex, 0, draggedItem);
    }

    if (onReorderStudents) {
      onReorderStudents(currentList);
    } else if (onBatchUpdateStudents) {
      onBatchUpdateStudents(currentList);
    }

    // Compute updated position number for toast notification
    const newIdx = currentList
      .filter((s) => {
        const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
        const combinedId = s.nisnNis || `${s.nisn || ''} ${s.nis || ''}`;
        const matchesSearch =
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          combinedId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.parentPhone && s.parentPhone.includes(searchTerm));
        return matchesClass && matchesSearch;
      })
      .findIndex((s) => s.id === draggedItem.id);

    const posLabel = newIdx >= 0 ? `urutan #${newIdx + 1}` : 'posisi baru';
    showSaveToast(`Urutan siswa disimpan: "${draggedItem.name}" dipindahkan ke ${posLabel}`);
  };

  // Quick Move 1 step up or down
  const handleMoveSingleStep = (studentId: string, direction: 'up' | 'down') => {
    const filteredIdx = filteredStudents.findIndex((s) => s.id === studentId);
    if (filteredIdx === -1) return;

    const targetFilteredIdx = direction === 'up' ? filteredIdx - 1 : filteredIdx + 1;
    if (targetFilteredIdx < 0 || targetFilteredIdx >= filteredStudents.length) return;

    const targetStudent = filteredStudents[targetFilteredIdx];
    handleReorderStudents(studentId, targetStudent.id, direction === 'up' ? 'above' : 'below');
  };

  // Quick Sort Helpers
  const handleSortByNameAZ = () => {
    const currentList = [...students];
    if (selectedClassFilter !== 'all') {
      const classStudents = currentList.filter((s) => s.classId === selectedClassFilter);
      classStudents.sort((a, b) => a.name.localeCompare(b.name, 'id'));
      let classIdx = 0;
      const reordered = currentList.map((s) => {
        if (s.classId === selectedClassFilter) {
          return classStudents[classIdx++];
        }
        return s;
      });
      if (onReorderStudents) onReorderStudents(reordered);
      else if (onBatchUpdateStudents) onBatchUpdateStudents(reordered);
      showSaveToast('Siswa kelas berhasil diurutkan A-Z berdasarkan nama');
    } else {
      currentList.sort((a, b) => a.name.localeCompare(b.name, 'id'));
      if (onReorderStudents) onReorderStudents(currentList);
      else if (onBatchUpdateStudents) onBatchUpdateStudents(currentList);
      showSaveToast('Seluruh siswa berhasil diurutkan A-Z berdasarkan nama');
    }
  };

  const handleSortByNisn = () => {
    const currentList = [...students];
    const getNisNum = (s: Student) => {
      const val = s.nisnNis || s.nisn || s.nis || '';
      const digits = val.replace(/\D/g, '');
      return digits ? parseInt(digits.slice(0, 14), 10) : 0;
    };
    if (selectedClassFilter !== 'all') {
      const classStudents = currentList.filter((s) => s.classId === selectedClassFilter);
      classStudents.sort((a, b) => getNisNum(a) - getNisNum(b) || a.name.localeCompare(b.name, 'id'));
      let classIdx = 0;
      const reordered = currentList.map((s) => {
        if (s.classId === selectedClassFilter) {
          return classStudents[classIdx++];
        }
        return s;
      });
      if (onReorderStudents) onReorderStudents(reordered);
      else if (onBatchUpdateStudents) onBatchUpdateStudents(reordered);
      showSaveToast('Siswa kelas berhasil diurutkan berdasarkan NISN/NIS');
    } else {
      currentList.sort((a, b) => getNisNum(a) - getNisNum(b) || a.name.localeCompare(b.name, 'id'));
      if (onReorderStudents) onReorderStudents(currentList);
      else if (onBatchUpdateStudents) onBatchUpdateStudents(currentList);
      showSaveToast('Seluruh siswa berhasil diurutkan berdasarkan NISN/NIS');
    }
  };

  // Handle paste from clipboard via button click
  const handleReadClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const defaultCls =
            selectedClassFilter !== 'all' ? selectedClassFilter : classes[0]?.id || '';
          const parsed = parseExternalStudentText(text, defaultCls, classes);
          if (parsed.length > 0) {
            setDetectedClipboardStudents(parsed);
            setDetectedClassId(defaultCls);
            setClipboardDetectedModalOpen(true);
            return;
          }
        }
      }
    } catch {
      // Permission blocked or not supported, fallback to opening quick paste drawer
    }
    setIsQuickPasteBoxOpen(true);
    setTimeout(() => {
      quickPasteInputRef.current?.focus();
    }, 100);
  };

  // Commit external pasted students (from detected modal or quick box)
  const handleCommitPastedStudents = (
    pastedList: Array<Omit<Student, 'id'>>,
    targetClsId: string,
    overwriteDuplicates: boolean
  ) => {
    if (pastedList.length === 0) return;

    // Apply target class to rows if not specifically specified
    const prepared = pastedList.map((item) => ({
      ...item,
      classId: item.classId || targetClsId,
    }));

    if (overwriteDuplicates && onBatchUpdateStudents) {
      const existingMap = new Map<string, Student>();
      students.forEach((s) => {
        const key = (s.nisnNis || s.nisn || s.nis || '').trim().toLowerCase();
        if (key) existingMap.set(key, s);
      });

      const toUpdate: Student[] = [];
      const toAdd: Array<Omit<Student, 'id'>> = [];

      prepared.forEach((newItem) => {
        const key = (newItem.nisnNis || newItem.nisn || newItem.nis || '').trim().toLowerCase();
        if (key && existingMap.has(key)) {
          const existing = existingMap.get(key)!;
          toUpdate.push({
            ...existing,
            name: newItem.name,
            gender: newItem.gender,
            classId: newItem.classId,
            parentPhone: newItem.parentPhone !== '-' ? newItem.parentPhone : existing.parentPhone,
          });
        } else {
          toAdd.push(newItem);
        }
      });

      if (toUpdate.length > 0) {
        onBatchUpdateStudents(toUpdate);
      }
      if (toAdd.length > 0) {
        onBatchImportStudents(toAdd);
      }

      showSaveToast(
        `Berhasil memproses ${prepared.length} data siswa (${toAdd.length} baru, ${toUpdate.length} diperbarui)`
      );
    } else {
      onBatchImportStudents(prepared);
      showSaveToast(`Berhasil menambahkan ${prepared.length} siswa baru dari data luar`);
    }

    setClipboardDetectedModalOpen(false);
    setDetectedClipboardStudents([]);
    setQuickPasteText('');
    setIsQuickPasteBoxOpen(false);
  };

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
    const defaultCls = classId || classes[0]?.id || '';
    const parsed = parseExternalStudentText(raw, defaultCls, classes);
    if (parsed.length > 0) {
      const item = parsed[0];
      setNisnNis(item.nisnNis);
      setName(item.name);
      setGender(item.gender);
      if (item.classId) setClassId(item.classId);
      if (item.parentPhone && item.parentPhone !== '-') setParentPhone(item.parentPhone);
      showSaveToast('Form otomatis terisi dari data yang ditempel');
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
      showSaveToast('Data siswa berhasil diperbarui');
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
      showSaveToast('Siswa baru berhasil ditambahkan');
    }

    setIsModalOpen(false);
  };

  // Submit Multi-Student from Modal tab
  const handleSavePastedStudents = () => {
    if (parsedPastedStudents.length === 0) return;
    onBatchImportStudents(parsedPastedStudents);
    showSaveToast(`Berhasil menambahkan ${parsedPastedStudents.length} siswa ke kelas`);
    setIsModalOpen(false);
    setRawPastedText('');
  };

  const handleDeleteSingle = (id: string, sName: string) => {
    if (window.confirm(`Yakin ingin menghapus data siswa "${sName}"?`)) {
      onDeleteStudent(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      showSaveToast('Siswa berhasil dihapus');
    }
  };

  // Batch Selection
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (
      window.confirm(
        `Yakin ingin menghapus ${selectedIds.length} data siswa yang dipilih sekaligus?`
      )
    ) {
      onDeleteBatchStudents(selectedIds);
      setSelectedIds([]);
      showSaveToast(`${selectedIds.length} siswa berhasil dihapus sekaligus`);
    }
  };

  // Template Excel Download
  const handleDownloadTemplateXlsx = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      alert('Fitur SheetJS belum siap.');
      return;
    }

    const templateData = [
      {
        NISN_NIS: '0081234901 / 2425001',
        NamaLengkap: 'Andi Muhammad Rifky',
        JenisKelamin: 'L',
        NamaKelas: classes[0]?.name || '10-A',
        KontakOrtu: '081234567890',
      },
      {
        NISN_NIS: '0081234902 / 2425002',
        NamaLengkap: 'Nurul Fadhilah Putri',
        JenisKelamin: 'P',
        NamaKelas: classes[0]?.name || '10-A',
        KontakOrtu: '081298765432',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TemplateSiswa');
    XLSX.writeFile(workbook, 'Template_Import_Siswa_SMAN1Gowa.xlsx');
  };

  // Template CSV Download
  const handleDownloadTemplateCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'NISN_NIS,NamaLengkap,JenisKelamin,NamaKelas,KontakOrtu\n' +
      '0081234901 / 2425001,Andi Muhammad Rifky,L,10-A,081234567890\n' +
      '0081234902 / 2425002,Nurul Fadhilah Putri,P,10-A,081298765432\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Template_Import_Siswa_SMAN1Gowa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel
  const handleExportStudents = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      alert('Pustaka SheetJS belum dimuat di browser.');
      return;
    }

    const exportData = filteredStudents.map((s, idx) => {
      const cls = classes.find((c) => c.id === s.classId);
      const displayId = s.nisnNis || `${s.nisn || ''}${s.nis ? ` / ${s.nis}` : ''}`;
      return {
        No: idx + 1,
        NISN_NIS: displayId,
        NamaLengkap: s.name,
        JenisKelamin: s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        Kelas: cls?.name || 'Tanpa Kelas',
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
    showSaveToast(`Berhasil mengimpor ${importPreview.length} siswa dari file`);
  };

  return (
    <div className="space-y-6">
      {/* Floating Save Toast */}
      {saveToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 backdrop-blur-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Manajemen Data Siswa
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {students.length} Siswa
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bisa diedit langsung (NISN/NIS, Nama, Jenis Kelamin) & mendukung paste langsung (Ctrl+V) dari Excel / WhatsApp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Toggle Direct Inline Edit Mode */}
          <button
            type="button"
            onClick={() => {
              setIsInlineEditMode(!isInlineEditMode);
              if (!isInlineEditMode) {
                showSaveToast('Mode Edit Langsung Aktif: Anda bisa mengetik langsung di tabel');
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer border shadow-2xs ${
              isInlineEditMode
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300 dark:ring-amber-900'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
            }`}
            title="Aktifkan pengeditan NISN, Nama, dan Jenis Kelamin langsung pada tabel"
          >
            <Zap className={`w-4 h-4 ${isInlineEditMode ? 'text-amber-100 animate-pulse' : 'text-amber-500'}`} />
            <span>{isInlineEditMode ? 'Mode Edit Langsung: AKTIF' : '⚡ Edit Langsung di Tabel'}</span>
          </button>

          <button
            onClick={() => {
              setImportPreview([]);
              setImportError(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
          >
            <Upload className="w-4 h-4" />
            Import Excel
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

      {/* QUICK PASTE BOX (DRAWER LANGSUNG DI HALAMAN) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        <button
          type="button"
          onClick={() => setIsQuickPasteBoxOpen(!isQuickPasteBoxOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Clipboard className="w-4 h-4 text-indigo-500" />
            <span>📋 Kotak Tempel Cepat (Paste Excel / WA / Spreadsheet)</span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
              — Copy dari Excel, lalu paste di sini untuk langsung dimasukkan ke tabel
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span className="text-[11px]">{isQuickPasteBoxOpen ? 'Tutup Kotak' : 'Buka Kotak'}</span>
            {isQuickPasteBoxOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isQuickPasteBoxOpen && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/10 space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Target Kelas:
                </label>
                <select
                  value={quickPasteClassId}
                  onChange={(e) => setQuickPasteClassId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quickPasteOverwriteDuplicates}
                    onChange={(e) => setQuickPasteOverwriteDuplicates(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Perbarui data jika NISN sudah ada</span>
                </label>
              </div>
            </div>

            <textarea
              ref={quickPasteInputRef}
              rows={3}
              value={quickPasteText}
              onChange={(e) => setQuickPasteText(e.target.value)}
              placeholder="Tempel (Ctrl+V) data siswa di sini... Contoh:
0081234991 / 2425001	Andi Muhammad Ilham	L
0081234992 / 2425002	Siti Fatimah Zahra	P
0081234993	Budi Gunawan	Laki-laki"
              className="w-full p-3 font-mono text-xs border border-indigo-200 dark:border-indigo-900/60 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="text-xs">
                {parsedQuickPasteStudents.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Terdeteksi {parsedQuickPasteStudents.length} siswa siap dimasukkan (
                    {parsedQuickPasteStudents.filter((s) => s.gender === 'L').length} L,{' '}
                    {parsedQuickPasteStudents.filter((s) => s.gender === 'P').length} P)
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Tip: Format didukung: Tab (Excel), Titik Koma (;), Koma (,), atau Spasi.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {quickPasteText && (
                  <button
                    type="button"
                    onClick={() => setQuickPasteText('')}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Bersihkan
                  </button>
                )}
                <button
                  type="button"
                  disabled={parsedQuickPasteStudents.length === 0}
                  onClick={() =>
                    handleCommitPastedStudents(
                      parsedQuickPasteStudents,
                      quickPasteClassId,
                      quickPasteOverwriteDuplicates
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer ${
                    parsedQuickPasteStudents.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan {parsedQuickPasteStudents.length > 0 ? `${parsedQuickPasteStudents.length} Siswa` : 'ke Tabel'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
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
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Kelas:
            </label>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Sort Helpers */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSortByNameAZ}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
              title="Urutkan daftar siswa alfabetis A ke Z"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
              <span>Urut A-Z</span>
            </button>
          </div>

          {/* Mode Edit Indicator Pill */}
          {isInlineEditMode && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-lg text-xs font-semibold animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit Langsung Aktif (Ketik & Simpan Otomatis)</span>
            </div>
          )}
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

      {/* Main Table with Direct Inline Editing & Drag Reorder */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                {/* No Header */}
                <th className="py-3 px-2 w-14 text-center whitespace-nowrap">
                  No
                </th>
                <th className="py-3 px-2 w-10 text-center">
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
                <th className="py-3 px-3 w-40 min-w-[140px] whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span>NISN / NIS</span>
                    {isInlineEditMode && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal lowercase">
                        (bisa diedit)
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[200px] whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span>Nama Lengkap Siswa</span>
                    {isInlineEditMode && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal lowercase">
                        (bisa diedit)
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-2 text-center w-36 min-w-[130px] whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <span>L/P</span>
                    {isInlineEditMode && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal lowercase">
                        (klik)
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-3 w-28 min-w-[90px] whitespace-nowrap">Rombel / Kelas</th>
                <th className="py-3 px-3 w-36 min-w-[125px] whitespace-nowrap">Kontak Ortu (WA)</th>
                <th className="py-3 px-2 text-center w-20 whitespace-nowrap">Status</th>
                <th className="py-3 px-2 text-center w-24 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => {
                  const cls = classes.find((c) => c.id === student.classId);
                  const isSelected = selectedIds.includes(student.id);
                  const isRowEditing = isInlineEditMode || editingRowId === student.id;
                  const isBeingDragged = draggedStudentId === student.id;
                  const isTargetOver = dragOverStudentId === student.id;
                  const displayNis =
                    student.nisnNis || `${student.nisn || ''}${student.nis ? ` / ${student.nis}` : ''}`;

                  let dragStyleClasses = '';
                  if (isBeingDragged) {
                    dragStyleClasses =
                      'opacity-30 bg-indigo-100/70 dark:bg-indigo-950/70 border-y-2 border-dashed border-indigo-500 shadow-inner';
                  } else if (isTargetOver) {
                    if (dropPosition === 'above') {
                      dragStyleClasses =
                        'border-t-4 border-t-indigo-600 dark:border-t-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 transition-all';
                    } else {
                      dragStyleClasses =
                        'border-b-4 border-b-indigo-600 dark:border-b-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 transition-all';
                    }
                  }

                  return (
                    <tr
                      key={student.id}
                      draggable={!isInlineEditMode && !editingRowId}
                      onDragStart={(e) => {
                        setDraggedStudentId(student.id);
                        e.dataTransfer.setData('text/plain', student.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (draggedStudentId && draggedStudentId !== student.id) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const midY = rect.top + rect.height / 2;
                          const isAbove = e.clientY < midY;
                          if (
                            dragOverStudentId !== student.id ||
                            dropPosition !== (isAbove ? 'above' : 'below')
                          ) {
                            setDragOverStudentId(student.id);
                            setDropPosition(isAbove ? 'above' : 'below');
                          }
                        }
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        if (dragOverStudentId === student.id) {
                          setDragOverStudentId(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceId = e.dataTransfer.getData('text/plain') || draggedStudentId;
                        if (sourceId && sourceId !== student.id) {
                          handleReorderStudents(sourceId, student.id, dropPosition);
                        }
                        setDraggedStudentId(null);
                        setDragOverStudentId(null);
                      }}
                      onDragEnd={() => {
                        setDraggedStudentId(null);
                        setDragOverStudentId(null);
                      }}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''
                      } ${isRowEditing ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''} ${dragStyleClasses}`}
                    >
                      {/* No & Drag Grip Handle */}
                      <td className="py-2.5 px-2 text-center select-none w-14" draggable={false}>
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            draggable={!isInlineEditMode && !editingRowId}
                            onDragStart={(e) => {
                              e.stopPropagation();
                              setDraggedStudentId(student.id);
                              e.dataTransfer.setData('text/plain', student.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/60 cursor-grab active:cursor-grabbing transition-colors"
                            title="Tahan & geser untuk memindahkan posisi urut siswa ini"
                          >
                            <GripVertical className="w-3.5 h-3.5 shrink-0" />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[20px] text-center">
                            {idx + 1}
                          </span>
                        </div>
                      </td>

                      {/* Checkbox */}
                      <td className="py-2.5 px-2 text-center w-10">
                        <button
                          onClick={() => handleToggleSelect(student.id)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                          aria-label={`Pilih ${student.name}`}
                          draggable={false}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* NISN / NIS (BISA DIEDIT LANGSUNG) */}
                      <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap w-40 min-w-[140px]">
                        {isRowEditing ? (
                          <input
                            type="text"
                            value={displayNis}
                            onChange={(e) =>
                              handleInlineFieldChange(student, 'nisnNis', e.target.value)
                            }
                            placeholder="NISN / NIS..."
                            className="w-full px-2.5 py-1 text-xs font-mono font-semibold bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 focus:border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                          />
                        ) : (
                          <span
                            onDoubleClick={() => setEditingRowId(student.id)}
                            className="font-semibold text-slate-900 dark:text-white cursor-pointer hover:underline decoration-dotted"
                            title="Klik ganda untuk edit langsung"
                          >
                            {displayNis || '-'}
                          </span>
                        )}
                      </td>

                      {/* NAMA SISWA (BISA DIEDIT LANGSUNG) */}
                      <td className="py-2.5 px-3 min-w-[200px]">
                        {isRowEditing ? (
                          <input
                            type="text"
                            value={student.name}
                            onChange={(e) =>
                              handleInlineFieldChange(student, 'name', e.target.value)
                            }
                            placeholder="Nama lengkap siswa..."
                            className="w-full px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 focus:border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                          />
                        ) : (
                          <span
                            onDoubleClick={() => setEditingRowId(student.id)}
                            className="font-bold text-slate-900 dark:text-white cursor-pointer hover:underline decoration-dotted"
                            title="Klik ganda untuk edit langsung"
                          >
                            {student.name}
                          </span>
                        )}
                      </td>

                      {/* JENIS KELAMIN (BISA DIKLIK & DIUBAH LANGSUNG DENGAN 1 KLIK) */}
                      <td className="py-2.5 px-2 text-center w-36 min-w-[130px] whitespace-nowrap">
                        {isRowEditing ? (
                          <div className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
                            <button
                              type="button"
                              onClick={() => handleInlineFieldChange(student, 'gender', 'L')}
                              className={`px-2 py-0.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                                student.gender === 'L'
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'text-slate-500 hover:text-blue-600 dark:text-slate-400'
                              }`}
                              title="Set ke Laki-laki"
                            >
                              L
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInlineFieldChange(student, 'gender', 'P')}
                              className={`px-2 py-0.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                                student.gender === 'P'
                                  ? 'bg-pink-600 text-white shadow-2xs'
                                  : 'text-slate-500 hover:text-pink-600 dark:text-slate-400'
                              }`}
                              title="Set ke Perempuan"
                            >
                              P
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleGender(student)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap inline-flex items-center justify-center ${
                              student.gender === 'L'
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
                            }`}
                            title="Klik untuk ubah L / P dengan cepat"
                          >
                            <span className="whitespace-nowrap">{student.gender === 'L' ? 'L (Laki-laki)' : 'P (Perempuan)'}</span>
                          </button>
                        )}
                      </td>

                      {/* KELAS */}
                      <td className="py-2.5 px-3 font-medium text-xs whitespace-nowrap w-28 min-w-[90px]">
                        {isRowEditing ? (
                          <select
                            value={student.classId}
                            onChange={(e) =>
                              handleInlineFieldChange(student, 'classId', e.target.value)
                            }
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            {classes.map((c) => (
                              <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-slate-800 dark:text-slate-200">{cls?.name || 'Tanpa Kelas'}</span>
                        )}
                      </td>

                      {/* KONTAK ORTU */}
                      <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap w-36 min-w-[125px] text-slate-700 dark:text-slate-200">
                        {isRowEditing ? (
                          <input
                            type="text"
                            value={student.parentPhone}
                            onChange={(e) =>
                              handleInlineFieldChange(student, 'parentPhone', e.target.value)
                            }
                            placeholder="08..."
                            className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          student.parentPhone || '-'
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="py-2.5 px-2 text-center w-20 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-semibold ${
                            student.status === 'Aktif'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="py-2.5 px-2 text-center w-24 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {editingRowId === student.id ? (
                            <button
                              onClick={() => {
                                setEditingRowId(null);
                                showSaveToast('Edit baris selesai');
                              }}
                              className="p-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                              title="Selesai Edit"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingRowId(student.id)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                              title="Edit Cepat Baris Ini"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            title="Edit Formulir Lengkap"
                          >
                            <FileText className="w-3.5 h-3.5" />
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
                  <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <p>Tidak ada data siswa ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL DETEKSI PASTE DARI LUAR (Ctrl+V / Clipboard Popup) */}
      {clipboardDetectedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white">
              <div className="flex items-center gap-2.5">
                <ClipboardPaste className="w-5 h-5 text-indigo-300" />
                <div>
                  <h3 className="text-sm font-bold">
                    Deteksi Data Siswa dari Clipboard (Hasil Paste Luar)
                  </h3>
                  <p className="text-[11px] text-indigo-200">
                    Ditemukan {detectedClipboardStudents.length} siswa siap dimasukkan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setClipboardDetectedModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Options */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <label className="font-bold text-slate-800 dark:text-slate-100">
                    Masukkan ke Kelas:
                  </label>
                  <select
                    value={detectedClassId}
                    onChange={(e) => setDetectedClassId(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={detectedOverwriteDuplicates}
                    onChange={(e) => setDetectedOverwriteDuplicates(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Perbarui data jika NISN sudah ada di daftar</span>
                </label>
              </div>

              {/* Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    Daftar Pratinjau Siswa ({detectedClipboardStudents.length}):
                  </p>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {detectedClipboardStudents.filter((s) => s.gender === 'L').length} Laki-laki,{' '}
                    {detectedClipboardStudents.filter((s) => s.gender === 'P').length} Perempuan
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-semibold text-slate-700 dark:text-slate-200">
                      <tr>
                        <th className="p-2 w-8 text-center">No</th>
                        <th className="p-2">NISN / NIS</th>
                        <th className="p-2">Nama Siswa</th>
                        <th className="p-2 text-center">L/P</th>
                        <th className="p-2 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {detectedClipboardStudents.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2 text-center text-slate-500 dark:text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-mono font-medium text-slate-900 dark:text-slate-100">{item.nisnNis}</td>
                          <td className="p-2 font-bold text-slate-900 dark:text-white">{item.name}</td>
                          <td className="p-2 text-center">
                            <span
                              className={`font-semibold ${
                                item.gender === 'L'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-pink-600 dark:text-pink-400'
                              }`}
                            >
                              {item.gender}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setDetectedClipboardStudents((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                );
                              }}
                              className="text-slate-400 hover:text-rose-600"
                              title="Hapus baris ini dari pratinjau"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setClipboardDetectedModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCommitPastedStudents(
                      detectedClipboardStudents,
                      detectedClassId,
                      detectedOverwriteDuplicates
                    )
                  }
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Simpan Semua ({detectedClipboardStudents.length} Siswa) ke Tabel
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 p-3.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      Masukkan ke Kelas:
                    </label>
                    <select
                      value={pasteTargetClassId}
                      onChange={(e) => setPasteTargetClassId(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[11px] text-slate-700 dark:text-slate-200 font-medium">
                    Mendukung copy dari <strong className="text-slate-900 dark:text-white">Excel</strong>, <strong className="text-slate-900 dark:text-white">Google Sheets</strong>, <strong className="text-slate-900 dark:text-white">WhatsApp</strong>, atau <strong className="text-slate-900 dark:text-white">Word</strong>
                  </span>
                </div>

                {/* Paste Area */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-100">
                      Tempelkan Teks Siswa di Bawah Ini:
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Format: [NISN/NIS] [NAMA LENGKAP] [L/P]
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={rawPastedText}
                    onChange={(e) => setRawPastedText(e.target.value)}
                    placeholder="Contoh salinan dari Excel / WhatsApp:
0081234901 / 2425001	Andi Muhammad Rifky	L
0081234902 / 2425002	Nurul Fadhilah Putri	P
0081234903 / 2425003	Siti Aisyah Rahma	Perempuan
0081234904 / 2425004	Fajar Hidayatullah	Laki-laki"
                    className="w-full p-3 font-mono text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      Dapat menggunakan pemisah Tab, Titik Koma (;), Koma (,), atau Spasi bertingkat.
                    </span>
                    {rawPastedText && (
                      <button
                        type="button"
                        onClick={() => setRawPastedText('')}
                        className="text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline cursor-pointer font-medium"
                      >
                        Hapus Teks
                      </button>
                    )}
                  </div>
                </div>

                {/* Parsed Live Preview Table */}
                {parsedPastedStudents.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {parsedPastedStudents.length} Siswa Terdeteksi Siap Ditambahkan:
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        ({parsedPastedStudents.filter((s) => s.gender === 'L').length} Laki-laki,{' '}
                        {parsedPastedStudents.filter((s) => s.gender === 'P').length} Perempuan)
                      </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-semibold text-slate-700 dark:text-slate-200">
                          <tr>
                            <th className="p-2 w-8 text-center">No</th>
                            <th className="p-2">NISN / NIS</th>
                            <th className="p-2">Nama Lengkap Siswa</th>
                            <th className="p-2 text-center">L/P</th>
                            <th className="p-2">Kelas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {parsedPastedStudents.map((s, idx) => {
                            const cls = classes.find((c) => c.id === s.classId);
                            return (
                              <tr
                                key={idx}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              >
                                <td className="p-2 text-center text-slate-500 dark:text-slate-400">{idx + 1}</td>
                                <td className="p-2 font-mono font-medium text-slate-900 dark:text-slate-100">{s.nisnNis}</td>
                                <td className="p-2 font-bold text-slate-900 dark:text-white">{s.name}</td>
                                <td className="p-2 text-center">
                                  <span
                                    className={`font-semibold ${
                                      s.gender === 'L'
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-pink-600 dark:text-pink-400'
                                    }`}
                                  >
                                    {s.gender}
                                  </span>
                                </td>
                                <td className="p-2 text-slate-700 dark:text-slate-200">{cls?.name || 'Dipilih'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
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
                    onClick={handleSavePastedStudents}
                    className={`px-4 py-2 font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                      parsedPastedStudents.length > 0
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      Tambahkan ({parsedPastedStudents.length} Siswa) Sekarang
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: INPUT FORMULIR TUNGGAL (NISN/NIS DIGABUNG) */
              <form onSubmit={handleSubmitSingle} className="p-5 space-y-3.5 text-xs">
                {!editingStudent && (
                  <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-900 mb-2">
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
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
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
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">
                      Cukup tempel (Ctrl+V) baris teks di atas, kolom NISN/NIS, Nama, dan Jenis Kelamin akan otomatis terisi!
                    </p>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Nama Lengkap Siswa *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Muh. Fajar Ramadhan"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-100 mb-1">
                    NISN / NIS (Digabungkan) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nisnNis}
                    onChange={(e) => setNisnNis(e.target.value)}
                    placeholder="Contoh: 0081234002 / 2425002 atau 0081234002"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 font-semibold"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Anda dapat memasukkan nomor identitas siswa secara gabungan.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-100 mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-medium"
                    >
                      <option value="L" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Laki-laki (L)</option>
                      <option value="P" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Perempuan (P)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-100 mb-1">
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
                  <label className="block font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Kontak Telepon / WA Orang Tua
                  </label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Status Keaktifan
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-medium"
                  >
                    <option value="Aktif" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Aktif</option>
                    <option value="Mutasi" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Mutasi Keluar</option>
                    <option value="Alumni" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Alumni / Lulus</option>
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
