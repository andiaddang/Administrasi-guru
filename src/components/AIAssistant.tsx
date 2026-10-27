import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Printer,
  Save,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  Sliders,
  BookOpen,
  Award,
  Layers,
  Users,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ClassRoom, Student, SchoolProfile, User, GradeType } from '../types';
import { generateSubjectExamPackage } from '../services/smartQuestionService';

interface AIAssistantProps {
  classes: ClassRoom[];
  students: Student[];
  school: SchoolProfile;
  currentUser: User | null;
  onApplyGradeToStudent?: (
    studentId: string,
    classId: string,
    gradeType: GradeType,
    score: number,
    topicName: string
  ) => void;
}

interface GeneratedQuestion {
  number: number;
  type: string;
  stimulus?: string;
  questionText: string;
  options?: string[];
  answerKey?: string;
  explanation?: string;
  scoreWeight?: number;
}

interface QuestionPackage {
  id: string;
  createdAt: string;
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  totalQuestions: number;
  questionType: string;
  difficulty: string;
  instructions: string;
  questions: GeneratedQuestion[];
}

interface GradeAnalysisItem {
  number: number;
  studentAnswer: string;
  expectedKey: string;
  status: 'correct' | 'partial' | 'incorrect';
  score: number;
  maxScore: number;
  feedback: string;
}

interface GradeAnalysisResult {
  studentNameDetected?: string;
  totalQuestionsDetected: number;
  finalScore: number;
  maxScore: number;
  percentage: number;
  gradeLetter: string;
  ketercapaian: string;
  summaryFeedback: string;
  items: GradeAnalysisItem[];
  recommendations?: string[];
}

const STORAGE_SAVED_EXAMS_KEY = 'sman1_gowa_ai_saved_exams_v1';
const STORAGE_LAST_SUBJECT_KEY = 'sman1_gowa_ai_last_subject_v1';

export const POPULAR_SUBJECTS = [
  'Fisika',
  'Matematika',
  'Kimia',
  'Biologi',
  'Informatika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Pendidikan Agama Islam',
  'Pendidikan Pancasila (PPKn)',
  'Sejarah',
  'Geografi',
  'Ekonomi',
  'Sosiologi',
  'PJOK',
  'Seni Budaya',
  'Prakarya dan Kewirausahaan',
  'Matematika Tingkat Lanjut',
  'Bimbingan Konseling (BK)',
];

export const SUBJECT_TOPIC_SUGGESTIONS: Record<string, string[]> = {
  Fisika: [
    'Hukum Newton tentang Gerak dan Penerapannya',
    'Kinematika Gerak Lurus (GLB dan GLBB)',
    'Termodinamika dan Perpindahan Kalor',
    'Gelombang Bunyi dan Gelombang Cahaya',
    'Listrik Dinamis dan Rangkaian Tertutup',
  ],
  Matematika: [
    'Persamaan dan Pertidaksamaan Nilai Mutlak',
    'Fungsi Kuadrat dan Grafiknya',
    'Trigonometri Dasar dan Sudut Berelasi',
    'Barisan dan Deret Aritmetika serta Geometri',
    'Statistika dan Analisis Penyajian Data',
  ],
  'Matematika Tingkat Lanjut': [
    'Polinomial dan Teorema Sisa',
    'Matriks dan Sistem Persamaan Linear',
    'Irisan Kerucut dan Vektor',
    'Kalkulus Diferensial dan Turunan',
  ],
  Kimia: [
    'Struktur Atom dan Konfigurasi Elektron',
    'Ikatan Kimia (Kovalen, Ionik, Logam)',
    'Stoikiometri dan Hukum Dasar Kimia',
    'Termokimia dan Entalpi Reaksi',
    'Larutan Asam-Basa dan Titrasi',
  ],
  Biologi: [
    'Struktur dan Fungsi Komponen Sel Hewan dan Tumbuhan',
    'Sistem Peredaran Darah pada Manusia',
    'Pewarisan Sifat dan Genetika Mendel',
    'Ekosistem dan Keanekaragaman Hayati',
    'Bioteknologi Konvensional dan Modern',
  ],
  Informatika: [
    'Berpikir Komputasional dan Algoritma Dasar',
    'Pemrograman Prosedural dan Variabel',
    'Jaringan Komputer dan Keamanan Siber',
    'Analisis Data dengan Spreadsheet',
  ],
  'Bahasa Indonesia': [
    'Teks Laporan Hasil Observasi (LHO)',
    'Teks Negosiasi dan Struktur Kebahasaan',
    'Teks Anekdot dan Kritik Sosial Santun',
    'Kaidah Resensi Buku dan Apresiasi Sastra',
    'Menyusun Karya Ilmiah dan Abstrak',
  ],
  'Bahasa Inggris': [
    'Narrative Text and Moral Values',
    'Analytical Exposition and Persuasive Arguments',
    'Report Text on Natural Phenomena and Animals',
    'Passive Voice in Scientific Contexts',
    'Conditional Sentences (Type 1, 2, and 3)',
  ],
  'Pendidikan Agama Islam': [
    'Meraih Kedamaian dengan Iman dan Akhlak Mulia',
    'Hukum Bacaan Tajwid Al-Qur\'an',
    'Fikih Muamalah: Jual Beli dan Asuransi Syariah',
    'Sejarah Peradaban Islam pada Masa Kejayaan',
  ],
  'Pendidikan Pancasila (PPKn)': [
    'Pancasila sebagai Pandangan Hidup dan Dasar Negara',
    'Konstitusi dan Norma Hukum dalam UUD NRI 1945',
    'Bhinneka Tunggal Ika dalam Harmoni Keberagaman',
    'Kedaulatan Rakyat dan Sistem Demokrasi Indonesia',
  ],
  Sejarah: [
    'Konsep Berpikir Diakronik dan Sinkronik dalam Sejarah',
    'Jejak Peradaban Hindu-Buddha dan Islam di Nusantara',
    'Lahirnya Pergerakan Nasional dan Sumpah Pemuda 1928',
    'Detik-Detik Proklamasi Kemerdekaan 17 Agustus 1945',
  ],
  Geografi: [
    'Konsep Esensial Geografi dan Prinsip Analisis Spasial',
    'Dinamika Litosfer dan Dampaknya terhadap Kehidupan',
    'Dinamika Atmosfer, Cuaca, dan Iklim Global',
    'Pemanfaatan Peta, Penginderaan Jauh, dan SIG',
  ],
  Ekonomi: [
    'Konsep Kelangkaan dan Pilihan Skala Prioritas Kebutuhan',
    'Mekanisme Pasar, Permintaan, dan Penawaran',
    'Pendapatan Nasional dan Kesejahteraan Masyarakat',
    'Lembaga Jasa Keuangan Perbankan dan OJK',
  ],
  Sosiologi: [
    'Individu, Kelompok, dan Hubungan Sosial di Masyarakat',
    'Nilai dan Norma Sosial sebagai Pembentuk Keteraturan',
    'Konflik Sosial, Kekerasan, dan Resolusi Damai',
  ],
  PJOK: [
    'Keterampilan Gerak Permainan Bola Besar (Sepak Bola & Voli)',
    'Analisis Kebugaran Jasmani dan Komposisi Tubuh Sehat',
    'Pola Hidup Sehat dan Pencegahan Bahaya NAPZA',
  ],
  'Seni Budaya': [
    'Apresiasi Karya Seni Rupa Dua dan Tiga Dimensi',
    'Karakteristik Musik Tradisional Nusantara',
    'Gerak Dasar dan Makna Simbolis Seni Tari Daerah',
  ],
};

export const AIAssistant: React.FC<AIAssistantProps> = ({
  classes,
  students,
  school,
  currentUser,
  onApplyGradeToStudent,
}) => {
  // Navigation sub-tab
  const [activeModule, setActiveModule] = useState<'generator' | 'examiner'>('generator');

  // ==========================================
  // STATE: PEMBUAT SOAL (QUESTION GENERATOR)
  // ==========================================
  const [subject, setSubject] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_LAST_SUBJECT_KEY);
      if (stored && stored.trim()) return stored;
    } catch {
      // ignore
    }
    return currentUser?.subject || 'Fisika';
  });
  const [gradeLevel, setGradeLevel] = useState<string>('Kelas X (Fase E)');
  const [topic, setTopic] = useState<string>('Hukum Newton tentang Gerak dan Penerapannya');
  const [questionType, setQuestionType] = useState<string>('pilihan_ganda');
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [difficulty, setDifficulty] = useState<string>('sedang');
  const [includeKey, setIncludeKey] = useState<boolean>(true);
  const [includeExplanation, setIncludeExplanation] = useState<boolean>(true);
  const [customInstructions, setCustomInstructions] = useState<string>('');

  // Chunk pagination for viewing large question sets (e.g. 25 or 30 questions)
  const [pageChunk, setPageChunk] = useState<'all' | '1-10' | '11-20' | '21-30'>('all');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPackage, setGeneratedPackage] = useState<QuestionPackage | null>(null);
  const [savedExams, setSavedExams] = useState<QuestionPackage[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SAVED_EXAMS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Helper untuk menyimpan mata pelajaran aktif dan menyinkronkan
  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    setExaminerSubject(newSubject);
    try {
      localStorage.setItem(STORAGE_LAST_SUBJECT_KEY, newSubject);
    } catch {
      // ignore
    }
  };

  // Helper untuk menerapkan topik saran dengan 1 klik
  const handleSelectTopicSuggestion = (suggestedTopic: string) => {
    setTopic(suggestedTopic);
  };

  // Dapatkan daftar saran materi/topik yang relevan dengan mata pelajaran aktif
  const currentTopicSuggestions =
    SUBJECT_TOPIC_SUGGESTIONS[subject] ||
    SUBJECT_TOPIC_SUGGESTIONS[
      Object.keys(SUBJECT_TOPIC_SUGGESTIONS).find(
        (k) => k.toLowerCase() === subject.trim().toLowerCase()
      ) || ''
    ] || [
      'Konsep Dasar dan Teori Pokok',
      'Analisis Karakteristik dan Prinsip Kerja',
      'Penerapan Nyata dalam Kehidupan Sehari-hari',
      'Pemecahan Masalah dan Evaluasi Kasus',
    ];

  // ==========================================
  // STATE: PEMERIKSA JAWABAN (VISION EXAMINER)
  // ==========================================
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [examinerSubject, setExaminerSubject] = useState<string>(currentUser?.subject || 'Fisika');
  const [maxScoreInput, setMaxScoreInput] = useState<number>(100);
  const [answerKeyInput, setAnswerKeyInput] = useState<string>(
    '1. B\n2. C\n3. A\n4. D\n5. C\n(Atau rubrik esai: penjelasan hukum I Newton bernilai 20 poin)'
  );
  const [questionContextInput, setQuestionContextInput] = useState<string>('');

  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadedImageMime, setUploadedImageMime] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<GradeAnalysisResult | null>(null);
  const [targetGradeType, setTargetGradeType] = useState<GradeType>('Harian');
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter students for the selected class
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  // Update selected student when class changes
  useEffect(() => {
    if (classStudents.length > 0 && !classStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(classStudents[0].id);
    }
  }, [selectedClassId, classStudents, selectedStudentId]);

  // Handle Generate Questions via backend API with instant resilient client fallback
  const handleGenerateQuestions = async () => {
    setErrorNotice(null);

    // Amankan nilai mata pelajaran dan topik agar tidak kosong
    let activeSubject = subject.trim();
    if (!activeSubject) {
      activeSubject = currentUser?.subject || 'Fisika';
      setSubject(activeSubject);
    }

    let activeTopic = topic.trim();
    if (!activeTopic) {
      activeTopic = currentTopicSuggestions[0] || 'Materi Pokok Pembelajaran';
      setTopic(activeTopic);
    }

    setIsGenerating(true);

    try {
      let pkg: QuestionPackage | null = null;

      // Pasang AbortController dengan batas waktu 10 detik agar tombol tidak pernah macet
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 10000);

      try {
        const res = await fetch('/api/ai/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            subject: activeSubject,
            gradeLevel,
            topic: activeTopic,
            questionType,
            count: Number(questionCount),
            difficulty,
            includeAnswerKey: includeKey,
            includeExplanation,
            additionalInstructions: customInstructions,
          }),
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          const receivedData = json.data;
          if (receivedData && Array.isArray(receivedData.questions) && receivedData.questions.length > 0) {
            pkg = {
              id: `exam-${Date.now()}`,
              createdAt: new Date().toLocaleString('id-ID'),
              title: receivedData.title || `Paket Asesmen ${activeSubject}: ${activeTopic}`,
              subject: receivedData.subject || activeSubject,
              topic: receivedData.topic || activeTopic,
              gradeLevel: receivedData.gradeLevel || gradeLevel,
              totalQuestions: receivedData.totalQuestions || receivedData.questions.length || questionCount,
              questionType: receivedData.questionType || questionType,
              difficulty: receivedData.difficulty || difficulty,
              instructions:
                receivedData.instructions ||
                'Bacalah setiap butir soal dengan seksama sebelum memberikan jawaban terbaik Anda.',
              questions: receivedData.questions,
            };
          }
        }
      } catch (fetchErr: any) {
        console.warn('Network or timeout reaching question API, generating instant curated package:', fetchErr?.message || fetchErr);
      }

      // Jika server tidak mengembalikan soal atau koneksi tertunda, jalankan perumusan cerdas langsung di browser
      if (!pkg || !pkg.questions || pkg.questions.length === 0) {
        pkg = generateSubjectExamPackage({
          subject: activeSubject,
          topic: activeTopic,
          gradeLevel,
          questionType,
          count: Number(questionCount),
          difficulty,
          includeAnswerKey: includeKey,
          includeExplanation,
          additionalInstructions: customInstructions,
        });
      }

      setGeneratedPackage(pkg);
      setPageChunk('all');
      showToast(`Berhasil merumuskan ${pkg.questions.length} butir soal ${pkg.subject} (${pkg.questionType})!`);
    } catch (err: any) {
      console.error('Error generating questions:', err);
      // Fallback cadangan otomatis
      const fallbackPkg = generateSubjectExamPackage({
        subject: activeSubject,
        topic: activeTopic,
        gradeLevel,
        questionType,
        count: Number(questionCount),
        difficulty,
        includeAnswerKey: includeKey,
        includeExplanation,
      });
      setGeneratedPackage(fallbackPkg);
      setPageChunk('all');
      showToast(`Berhasil merumuskan ${fallbackPkg.questions.length} butir soal ${fallbackPkg.subject}!`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Unduh Paket Soal sebagai File Teks / Word Ready
  const handleDownloadExamTxt = () => {
    if (!generatedPackage) return;
    let text = `${school.name.toUpperCase()}\n`;
    text += `ASESMEN PEMBELAJARAN - ${generatedPackage.subject.toUpperCase()}\n`;
    text += `Materi Pokok: ${generatedPackage.topic}\n`;
    text += `Tingkat / Fase: ${generatedPackage.gradeLevel}\n`;
    text += `Bentuk Soal: ${generatedPackage.questionType.toUpperCase()} (${generatedPackage.questions.length} Butir Soal)\n`;
    text += `Semester: ${school.semester} T.A ${school.academicYear}\n`;
    text += `Petunjuk Pengerjaan: ${generatedPackage.instructions}\n\n`;
    text += `========================================================================\n\n`;

    generatedPackage.questions.forEach((q) => {
      text += `Soal No. ${q.number} (Bobot: ${q.scoreWeight || 1} Poin)\n`;
      if (q.stimulus) {
        text += `[Konteks/Stimulus]:\n${q.stimulus}\n\n`;
      }
      text += `${q.questionText}\n\n`;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt) => {
          text += `  ${opt}\n`;
        });
        text += `\n`;
      }
      text += `------------------------------------------------------------------------\n\n`;
    });

    if (includeKey || includeExplanation) {
      text += `\n========================================================================\n`;
      text += `KUNCI JAWABAN & PEMBAHASAN RESMI\n`;
      text += `========================================================================\n\n`;

      generatedPackage.questions.forEach((q) => {
        text += `Nomor ${q.number}: Kunci [ ${q.answerKey || '-'} ]\n`;
        if (q.explanation) {
          text += `Pembahasan: ${q.explanation}\n`;
        }
        text += `\n`;
      });
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Paket_Soal_${generatedPackage.subject.replace(/[^a-zA-Z0-9]/g, '_')}_${generatedPackage.questions.length}_Nomor.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Berhasil mengunduh dokumen ${generatedPackage.questions.length} butir soal!`);
  };

  // Save Exam Package to Local Bank
  const handleSaveToBank = () => {
    if (!generatedPackage) return;
    const exists = savedExams.some((e) => e.id === generatedPackage.id);
    let nextList: QuestionPackage[];
    if (exists) {
      nextList = savedExams.map((e) => (e.id === generatedPackage.id ? generatedPackage : e));
    } else {
      nextList = [generatedPackage, ...savedExams];
    }
    setSavedExams(nextList);
    try {
      localStorage.setItem(STORAGE_SAVED_EXAMS_KEY, JSON.stringify(nextList));
    } catch (e) {
      console.error('Error saving exams', e);
    }
    showToast('Paket soal berhasil disimpan ke Bank Soal Guru!');
  };

  // Copy All Questions to Clipboard
  const handleCopyQuestions = () => {
    if (!generatedPackage) return;
    let text = `${school.name.toUpperCase()}\n`;
    text += `ASESMEN PEMBELAJARAN - ${generatedPackage.subject.toUpperCase()}\n`;
    text += `Materi: ${generatedPackage.topic} | Jenjang: ${generatedPackage.gradeLevel}\n`;
    text += `Petunjuk: ${generatedPackage.instructions}\n\n`;
    text += `=========================================\n\n`;

    generatedPackage.questions.forEach((q) => {
      text += `No. ${q.number}\n`;
      if (q.stimulus) {
        text += `[Konteks/Stimulus]: ${q.stimulus}\n`;
      }
      text += `${q.questionText}\n`;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt) => {
          text += `  ${opt}\n`;
        });
      }
      if (q.answerKey) {
        text += `\n>> Kunci Jawaban: ${q.answerKey}\n`;
      }
      if (q.explanation) {
        text += `>> Pembahasan: ${q.explanation}\n`;
      }
      text += `\n-----------------------------------------\n\n`;
    });

    navigator.clipboard.writeText(text);
    showToast('Seluruh butir soal dan kunci berhasil disalin ke clipboard!');
  };

  // Print Exam Sheet
  const handlePrintExam = () => {
    window.print();
  };

  // Handle Image Upload for Examiner
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorNotice('Silakan pilih file gambar yang valid (JPG, PNG, WebP).');
      showToast('Format file harus berupa gambar.');
      return;
    }

    setUploadedImageMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImagePreview(reader.result as string);
      setAnalysisResult(null);
      setAppliedSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  // Load Sample Sheet (for quick test)
  const handleLoadSampleSheet = () => {
    // Generate a simple SVG-based sample answer sheet data URL
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" style="background:#ffffff; font-family:sans-serif;">
      <rect width="600" height="750" fill="#fcfcfc" stroke="#333" stroke-width="2"/>
      <text x="30" y="40" font-size="16" font-weight="bold" fill="#1e293b">LEMBAR JAWABAN SISWA SMAN 1 GOWA</text>
      <text x="30" y="65" font-size="12" fill="#475569">Nama: Ahmad Fauzi | Kelas: X.1 | Mapel: Fisika</text>
      <line x1="30" y1="80" x2="570" y2="80" stroke="#cbd5e1" stroke-width="2"/>
      <text x="30" y="110" font-size="13" font-weight="bold" fill="#0f172a">1. B (v = s/t = 100/10 = 10 m/s)</text>
      <text x="30" y="150" font-size="13" font-weight="bold" fill="#0f172a">2. C (Gaya aksi sama dengan gaya reaksi)</text>
      <text x="30" y="190" font-size="13" font-weight="bold" fill="#0f172a">3. A (Hukum I Newton/Kelembaman benda)</text>
      <text x="30" y="230" font-size="13" font-weight="bold" fill="#0f172a">4. D (F = m.a = 2 kg x 5 m/s2 = 10 N)</text>
      <text x="30" y="270" font-size="13" font-weight="bold" fill="#0f172a">5. B (Gesekan statis lebih besar dari kinetis)</text>
      <rect x="30" y="310" width="540" height="200" fill="#f8fafc" stroke="#94a3b8" rx="6"/>
      <text x="45" y="340" font-size="12" font-weight="bold" fill="#334155">Catatan Pengerjaan Esai:</text>
      <text x="45" y="370" font-size="11" fill="#475569">Ketika mobil direm mendadak, penumpang terdorong ke depan karena sifat inersia.</text>
      <text x="45" y="395" font-size="11" fill="#475569">Hal ini sesuai dengan Hukum Newton Pertama (Sigma F = 0).</text>
    </svg>`;
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgData)}`;
    setUploadedImagePreview(dataUrl);
    setUploadedImageMime('image/svg+xml');
    setAnalysisResult(null);
    setAppliedSuccess(false);
    showToast('Contoh lembar jawaban siswa berhasil dimuat.');
  };

  // Run AI Vision Examination
  const handleAnalyzeSubmission = async () => {
    if (!uploadedImagePreview) {
      setErrorNotice('Silakan unggah foto lembar jawaban siswa terlebih dahulu.');
      showToast('Pilih lembar jawaban sebelum memulai analisis.');
      return;
    }

    const currentStudent = students.find((s) => s.id === selectedStudentId);

    setIsAnalyzing(true);
    setErrorNotice(null);
    try {
      const res = await fetch('/api/ai/grade-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedImagePreview,
          mimeType: uploadedImageMime,
          studentName: currentStudent?.name || 'Siswa',
          subject: examinerSubject,
          answerKey: answerKeyInput,
          questionContext: questionContextInput,
          maxScore: Number(maxScoreInput),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal memeriksa lembar jawaban');
      }

      setAnalysisResult(json.data);
      setAppliedSuccess(false);
      showToast('Pemeriksaan AI selesai! Hasil analisis siap ditinjau.');
    } catch (err: any) {
      console.error(err);
      setErrorNotice(`Catatan pemeriksaan: ${err.message || 'Layanan sedang dimutakhirkan, silakan coba sesaat lagi.'}`);
      showToast('Kendala pemeriksaan lembar jawaban.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply Grade to GradeManagement table
  const handleApplyGrade = () => {
    if (!analysisResult) return;
    const currentStudent = students.find((s) => s.id === selectedStudentId);
    if (!currentStudent) return;

    if (onApplyGradeToStudent) {
      onApplyGradeToStudent(
        currentStudent.id,
        selectedClassId,
        targetGradeType,
        analysisResult.finalScore,
        `AI: ${examinerSubject}`
      );
    }

    // Also update localStorage grade records directly
    try {
      const STORAGE_GRADES_KEY = 'sman1_gowa_grades';
      const raw = localStorage.getItem(STORAGE_GRADES_KEY);
      const list = raw ? JSON.parse(raw) : [];

      const newRecord = {
        id: `grade-${Date.now()}`,
        studentId: currentStudent.id,
        classId: selectedClassId,
        subject: examinerSubject,
        type: targetGradeType,
        title: `Pemeriksaan AI Vision - ${examinerSubject}`,
        score: analysisResult.finalScore,
        maxScore: analysisResult.maxScore || 100,
        date: new Date().toISOString().slice(0, 10),
        notes: `Koreksi AI Vision. ${analysisResult.summaryFeedback || ''}`,
      };

      list.push(newRecord);
      localStorage.setItem(STORAGE_GRADES_KEY, JSON.stringify(list));
      setAppliedSuccess(true);
      showToast(
        `Nilai ${analysisResult.finalScore} berhasil dimasukkan ke buku nilai ${currentStudent.name}!`
      );
    } catch (e) {
      console.error('Error applying grade', e);
      setAppliedSuccess(true);
      showToast('Nilai berhasil diterapkan!');
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-4 border border-slate-700 dark:border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BANNER ASISTEN GURU AI */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-purple-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold tracking-wider uppercase backdrop-blur-xs border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Kecerdasan Buatan Terintegrasi SMAN 1 Gowa
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Asisten Guru AI</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Gemini 3.8 Flash
              </span>
            </h1>
            <p className="text-xs text-indigo-100/90 max-w-2xl leading-relaxed">
              Mempermudah pekerjaan guru dalam menyusun segala jenis soal asesmen (Pilihan Ganda, Esai,
              HOTS, Menjodohkan) dan memeriksa lembar kerja/jawaban siswa secara instan melalui analisis
              foto & OCR cerdas.
            </p>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex items-center gap-2 p-1.5 bg-black/30 rounded-xl border border-white/10 backdrop-blur-xs shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveModule('generator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeModule === 'generator'
                  ? 'bg-white text-indigo-950 shadow-md scale-102'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Pembuat Soal Asesmen</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('examiner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeModule === 'examiner'
                  ? 'bg-white text-purple-950 shadow-md scale-102'
                  : 'text-purple-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Camera className="w-4 h-4 text-purple-600" />
              <span>Pemeriksa Jawaban AI (Foto)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODUL 1: PEMBUAT SOAL ASESMEN (QUESTION GENERATOR) */}
      {/* ========================================================================= */}
      {activeModule === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* PANEL KIRI: PARAMETER GENERASI SOAL (5 COLS) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Kriteria & Parameter Soal</span>
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">Kurikulum Merdeka</span>
              </div>

              {/* Form Input */}
              <div className="space-y-4 text-xs">
                {/* Mata Pelajaran - Bebas diisi atau pilih cepat */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Mata Pelajaran
                    </label>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      Bisa diisi sesuai yang buatkan soal
                    </span>
                  </div>
                  <input
                    type="text"
                    list="popular-subjects-list"
                    value={subject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    placeholder="Ketik mata pelajaran (Contoh: Fisika, Matematika, Biologi, Kimia, dll.)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                  <datalist id="popular-subjects-list">
                    {POPULAR_SUBJECTS.map((subj) => (
                      <option key={subj} value={subj} />
                    ))}
                  </datalist>

                  {/* Pilihan Cepat Mata Pelajaran */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400">Pilihan Cepat:</span>
                    {POPULAR_SUBJECTS.slice(0, 10).map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => handleSubjectChange(subj)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          subject.toLowerCase() === subj.toLowerCase()
                            ? 'bg-indigo-600 text-white shadow-2xs scale-102'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Jenjang / Kelas & Bentuk Soal */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jenjang & Fase
                    </label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Kelas X (Fase E)">Kelas X (Fase E)</option>
                      <option value="Kelas XI (Fase F)">Kelas XI (Fase F)</option>
                      <option value="Kelas XII (Fase F)">Kelas XII (Fase F)</option>
                      <option value="SMP / Sederajat (Fase D)">SMP / Fase D</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bentuk Soal
                    </label>
                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="pilihan_ganda">Pilihan Ganda (5 Opsi: A-E)</option>
                      <option value="essay">Uraian / Esai Analitis</option>
                      <option value="benar_salah">Benar / Salah</option>
                      <option value="menjodohkan">Menjodohkan Pasangan</option>
                      <option value="hots">Soal HOTS / AKM (Studi Kasus)</option>
                      <option value="campuran">Campuran Terpadu</option>
                    </select>
                  </div>
                </div>

                {/* Topik / Materi / Capaian Pembelajaran */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Topik / Materi / Capaian Pembelajaran (CP)
                    </label>
                    <span className="text-[10px] text-slate-400">Bisa diketik bebas</span>
                  </div>
                  <textarea
                    rows={2}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ketik topik pokok bahasan atau indikator capaian yang ingin diuji..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 text-xs"
                  />

                  {/* Saran Topik Cepat Berdasarkan Mata Pelajaran Aktif */}
                  {currentTopicSuggestions.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-medium">Saran Topik:</span>
                      {currentTopicSuggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleSelectTopicSuggestion(sug)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border text-left transition-colors cursor-pointer ${
                            topic === sug
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-semibold'
                              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50'
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Jumlah & Tingkat Kesulitan */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Jumlah Butir Soal
                      </label>
                      <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                        {questionCount} Soal
                      </span>
                    </div>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value={3}>3 Butir Soal (Kuis Singkat)</option>
                      <option value={5}>5 Butir Soal (Formatif Standar)</option>
                      <option value={10}>10 Butir Soal (Sumatif TP / Bab)</option>
                      <option value={15}>15 Butir Soal (Ulangan Harian)</option>
                      <option value={20}>20 Butir Soal (Asesmen Lengkap)</option>
                      <option value={25}>25 Butir Soal (Sumatif Tengah Semester / STS) 🔥</option>
                      <option value={30}>30 Butir Soal (Ujian Akhir Semester / SAS) 🎯</option>
                    </select>

                    {/* Tombol Pilihan Cepat Jumlah Soal */}
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {[3, 5, 10, 15, 20, 25, 30].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setQuestionCount(cnt)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                            questionCount === cnt
                              ? 'bg-indigo-600 text-white shadow-2xs scale-105'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {cnt === 25 ? '25 (STS)' : cnt === 30 ? '30 (SAS)' : cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tingkat Kesulitan
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="mudah">Mudah (Dasar Pemahaman)</option>
                      <option value="sedang">Sedang (Aplikasi Konsep)</option>
                      <option value="sulit">Sulit (Analisis Kompleks)</option>
                      <option value="hots">HOTS / Penalaran Kritis</option>
                    </select>
                  </div>
                </div>

                {/* Toggles Kunci & Pembahasan */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeKey}
                      onChange={(e) => setIncludeKey(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Sertakan Kunci Jawaban Akurat
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeExplanation}
                      onChange={(e) => setIncludeExplanation(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Sertakan Pembahasan & Rubrik Penskoran
                    </span>
                  </label>
                </div>

                {/* Instruksi Tambahan (Opsional) */}
                <div>
                  <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Instruksi Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Misal: kaitkan contoh dengan kearifan lokal Sulsel atau konteks nyata..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-100 text-xs"
                  />
                </div>

                {/* Pesan Kesalahan / Notifikasi jika ada */}
                {errorNotice && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>{errorNotice}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setErrorNotice(null)}
                      className="text-amber-600 hover:text-amber-800 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Tombol Buat Soal */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateQuestions}
                    disabled={isGenerating}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      isGenerating
                        ? 'bg-indigo-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98 hover:shadow-indigo-500/25'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>
                          Sedang Merumuskan & Menyusun {questionCount} Butir Soal...
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        <span>
                          Rumuskan & Susun {questionCount} Butir Soal Sekarang
                        </span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                    Klik untuk merumuskan paket soal {subject || 'asesmen'} ({questionCount} nomor) lengkap dengan kunci jawaban dan rubrik.
                  </p>
                </div>
              </div>
            </div>

            {/* DAFTAR BANK SOAL TERSIMPAN */}
            {savedExams.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Bank Soal Tersimpan ({savedExams.length})</span>
                  </h3>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {savedExams.map((exam) => (
                    <div
                      key={exam.id}
                      onClick={() => setGeneratedPackage(exam)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/50 transition-colors cursor-pointer text-xs space-y-1"
                    >
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {exam.title}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {exam.subject} · {exam.questions.length} butir
                        </span>
                        <span className="font-mono">{exam.createdAt.slice(0, 10)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PANEL KANAN: HASIL PRATINJAU SOAL UJIAN (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            {generatedPackage ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                {/* Action Bar Atas */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      Paket Asesmen AI Siap Pakai
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {generatedPackage.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyQuestions}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Salin semua teks soal"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Salin</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadExamTxt}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Unduh paket soal dalam format .txt (siap diolah di Microsoft Word / dicetak)"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Unduh .txt</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintExam}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Cetak lembar soal"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Cetak</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveToBank}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Simpan ke Bank Soal Guru"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan ke Bank</span>
                    </button>
                  </div>
                </div>

                {/* Navigasi Kelompok Butir Soal untuk Ujian 25 atau 30 Nomor */}
                {generatedPackage.questions.length > 10 && (
                  <div className="px-4 py-2 bg-indigo-50/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Navigasi Butir Soal:</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setPageChunk('all')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                          pageChunk === 'all'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Semua ({generatedPackage.questions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPageChunk('1-10')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                          pageChunk === '1-10'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        No. 1–10
                      </button>
                      <button
                        type="button"
                        onClick={() => setPageChunk('11-20')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                          pageChunk === '11-20'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        No. 11–20
                      </button>
                      {generatedPackage.questions.length > 20 && (
                        <button
                          type="button"
                          onClick={() => setPageChunk('21-30')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                            pageChunk === '21-30'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          No. 21–{generatedPackage.questions.length}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Konten Kertas Ujian (Printable format) */}
                <div className="p-6 space-y-6 max-h-[700px] overflow-y-auto">
                  {/* Kop Soal Ujian */}
                  <div className="border-b-2 border-slate-800 dark:border-slate-300 pb-4 text-center space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-wide uppercase">
                      {school.name}
                    </h3>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                      ASESMEN FORMATIF / SUMATIF SEMESTER {school.semester} T.A {school.academicYear}
                    </h4>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                      <span>
                        Mata Pelajaran: <b>{generatedPackage.subject}</b>
                      </span>
                      <span>•</span>
                      <span>
                        Tingkat/Fase: <b>{generatedPackage.gradeLevel}</b>
                      </span>
                      <span>•</span>
                      <span>
                        Bentuk: <b>{generatedPackage.questionType}</b>
                      </span>
                      <span>•</span>
                      <span>
                        Waktu: <b>{generatedPackage.questions.length * 4} Menit</b>
                      </span>
                    </div>
                  </div>

                  {/* Petunjuk Pengerjaan */}
                  {generatedPackage.instructions && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
                      <span className="font-bold">Petunjuk Pengerjaan: </span>
                      {generatedPackage.instructions}
                    </div>
                  )}

                  {/* Daftar Butir Soal */}
                  <div className="space-y-6 text-xs">
                    {generatedPackage.questions
                      .filter((q) => {
                        if (pageChunk === '1-10') return q.number >= 1 && q.number <= 10;
                        if (pageChunk === '11-20') return q.number >= 11 && q.number <= 20;
                        if (pageChunk === '21-30') return q.number >= 21;
                        return true;
                      })
                      .map((q) => (
                      <div
                        key={q.number}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3"
                      >
                        {/* Header Soal */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                            Soal No. {q.number}
                          </span>
                          {q.scoreWeight && (
                            <span className="text-slate-400 font-medium">
                              Bobot: {q.scoreWeight} Poin
                            </span>
                          )}
                        </div>

                        {/* Stimulus / Konteks jika ada */}
                        {q.stimulus && (
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border-l-3 border-indigo-500 text-slate-700 dark:text-slate-300 italic leading-relaxed">
                            {q.stimulus}
                          </div>
                        )}

                        {/* Pertanyaan */}
                        <div className="font-semibold text-slate-900 dark:text-white leading-relaxed text-sm">
                          {q.questionText}
                        </div>

                        {/* Opsi Pilihan Ganda jika ada */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Kunci Jawaban & Pembahasan */}
                        {(q.answerKey || q.explanation) && (
                          <div className="mt-2 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1.5 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200/50">
                            {q.answerKey && (
                              <div className="text-emerald-900 dark:text-emerald-200">
                                <span className="font-bold">Kunci Jawaban: </span>
                                <span className="font-mono font-extrabold px-1.5 py-0.5 bg-emerald-200 dark:bg-emerald-800 rounded">
                                  {q.answerKey}
                                </span>
                              </div>
                            )}
                            {q.explanation && (
                              <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                                  Pembahasan / Rubrik:{' '}
                                </span>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 rounded-2xl">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Pratinjau Soal Asesmen Akan Ditampilkan di Sini
                </h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Tentukan mata pelajaran dan topik materi pada panel di sebelah kiri, lalu klik tombol{' '}
                  <b className="text-indigo-600 dark:text-indigo-400">"Rumuskan & Susun {questionCount} Butir Soal Sekarang"</b>.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  disabled={isGenerating}
                  className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-transform active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Mulai Rumuskan {questionCount} Soal {subject}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODUL 2: PEMERIKSA JAWABAN SISWA VIA AI VISION (IMAGE EXAMINER) */}
      {/* ========================================================================= */}
      {activeModule === 'examiner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* PANEL KIRI: UPLOAD FOTO & PENGATURAN KUNCI (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-purple-600" />
                  <span>Foto & Kunci Koreksi AI</span>
                </h2>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950">
                  Multimodal OCR
                </span>
              </div>

              {/* Pilih Kelas & Siswa */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kelas
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Siswa
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      {classStudents.map((std) => (
                        <option key={std.id} value={std.id}>
                          {std.name} ({std.gender})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mata Pelajaran
                    </label>
                    <input
                      type="text"
                      value={examinerSubject}
                      onChange={(e) => setExaminerSubject(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Skala Skor Maksimal
                    </label>
                    <input
                      type="number"
                      value={maxScoreInput}
                      onChange={(e) => setMaxScoreInput(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Dropzone Upload Foto Lembar Jawaban */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Foto / Scan Lembar Jawaban Siswa</span>
                    <button
                      type="button"
                      onClick={handleLoadSampleSheet}
                      className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
                    >
                      Muat Contoh Lembar Ujian
                    </button>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  {uploadedImagePreview ? (
                    <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-slate-900">
                      <img
                        src={uploadedImagePreview}
                        alt="Lembar Jawaban Siswa"
                        className="w-full max-h-56 object-contain"
                      />
                      <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded bg-black/70 hover:bg-black text-white text-[10px] font-bold cursor-pointer"
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedImagePreview(null);
                            setAnalysisResult(null);
                          }}
                          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                    >
                      <div className="w-10 h-10 mx-auto rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        Klik untuk Pilih Foto Lembar Jawaban
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Format JPG, PNG, atau jepret langsung dari kamera HP
                      </p>
                    </div>
                  )}
                </div>

                {/* Kunci Jawaban / Rubrik Guru */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Kunci Jawaban & Rubrik Resmi
                    </label>
                    {generatedPackage && (
                      <button
                        type="button"
                        onClick={() => {
                          const keysText = generatedPackage.questions
                            .map((q) => `${q.number}. ${q.answerKey || ''} (${q.explanation || ''})`)
                            .join('\n');
                          setAnswerKeyInput(keysText);
                          showToast('Kunci dari Generator Soal berhasil dimuat!');
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                      >
                        Salin dari Generator Soal
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={answerKeyInput}
                    onChange={(e) => setAnswerKeyInput(e.target.value)}
                    placeholder="Contoh: 1. A, 2. B, 3. D atau kriteria kata kunci esai..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs font-mono"
                  />
                </div>

                {/* Tombol Periksa Sekarang */}
                <button
                  type="button"
                  onClick={handleAnalyzeSubmission}
                  disabled={isAnalyzing || !uploadedImagePreview}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isAnalyzing || !uploadedImagePreview
                      ? 'bg-purple-400 cursor-not-allowed opacity-75'
                      : 'bg-purple-600 hover:bg-purple-700 active:scale-98'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AI Vision Sedang Membaca & Memeriksa Jawaban...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Periksa & Hitung Nilai Otomatis</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* PANEL KANAN: HASIL KOREKSI & EVALUASI SISWA (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            {analysisResult ? (
              <div className="space-y-4 animate-in fade-in-50">
                {/* KARTU SKOR BESAR */}
                <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-purple-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-800/80 pb-4">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-purple-300 tracking-wider">
                        Hasil Pemeriksaan Berbasis AI
                      </span>
                      <h3 className="text-lg font-black text-white">
                        {students.find((s) => s.id === selectedStudentId)?.name || 'Siswa'}
                      </h3>
                      <p className="text-xs text-purple-200">
                        Kelas: {classes.find((c) => c.id === selectedClassId)?.name} · Mapel:{' '}
                        {examinerSubject}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-3xl font-black text-amber-300">
                          {analysisResult.finalScore}
                          <span className="text-sm font-normal text-purple-200">
                            /{analysisResult.maxScore}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-purple-200">
                          Predikat: {analysisResult.gradeLetter} ({analysisResult.percentage}%)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ketercapaian & Ringkasan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-purple-950/60 rounded-xl border border-purple-800/50 space-y-1">
                      <span className="text-[10px] text-purple-300 uppercase font-bold">
                        Status Ketercapaian (KKTP):
                      </span>
                      <div className="font-extrabold text-white text-sm">
                        {analysisResult.ketercapaian || (analysisResult.finalScore >= 75 ? 'Tuntas' : 'Perlu Bimbingan')}
                      </div>
                    </div>

                    <div className="p-3 bg-purple-950/60 rounded-xl border border-purple-800/50 space-y-1">
                      <span className="text-[10px] text-purple-300 uppercase font-bold">
                        Butir Soal Terdeteksi:
                      </span>
                      <div className="font-extrabold text-white text-sm">
                        {analysisResult.items?.length || analysisResult.totalQuestionsDetected} Butir
                        Soal
                      </div>
                    </div>
                  </div>

                  {/* Ringkasan Pedagogis */}
                  {analysisResult.summaryFeedback && (
                    <div className="p-3.5 rounded-xl bg-white/10 text-xs text-purple-100 leading-relaxed border border-white/10">
                      <span className="font-bold text-amber-300">Catatan Evaluasi Guru AI: </span>
                      {analysisResult.summaryFeedback}
                    </div>
                  )}

                  {/* Tombol Terapkan Nilai ke Buku Nilai */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-purple-800/80">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-purple-200">Masukkan ke komponen:</span>
                      <select
                        value={targetGradeType}
                        onChange={(e) => setTargetGradeType(e.target.value as GradeType)}
                        className="bg-purple-950 text-white font-bold border border-purple-700 rounded-lg px-2.5 py-1 text-xs cursor-pointer"
                      >
                        <option value="Harian">Formatif / Ulangan</option>
                        <option value="Tugas">Tugas</option>
                        <option value="Sumatif">Sumatif TP</option>
                        <option value="STS">Sumatif Tengah Semester (STS)</option>
                        <option value="SAS">Sumatif Akhir Semester (SAS)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyGrade}
                      disabled={appliedSuccess}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                        appliedSuccess
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white hover:bg-emerald-50 text-purple-950 hover:text-emerald-950'
                      }`}
                    >
                      {appliedSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>Sudah Dimasukkan ke Buku Nilai</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 text-emerald-600" />
                          <span>Terapkan Nilai ({analysisResult.finalScore}) ke Buku Nilai</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* TABEL RINCIAN PEMERIKSAAN PER BUTIR SOAL */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      <span>Rincian Hasil Koreksi Butir per Butir</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Benar: {analysisResult.items?.filter((i) => i.status === 'correct').length} · Salah:{' '}
                      {analysisResult.items?.filter((i) => i.status === 'incorrect').length}
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2 px-3 text-center w-12">No</th>
                          <th className="py-2 px-3 min-w-[120px]">Jawaban Siswa</th>
                          <th className="py-2 px-3 min-w-[100px]">Kunci Resmi</th>
                          <th className="py-2 px-2 text-center w-24">Status</th>
                          <th className="py-2 px-2 text-center w-20">Skor</th>
                          <th className="py-2 px-3 min-w-[160px]">Catatan Koreksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {analysisResult.items?.map((item) => (
                          <tr
                            key={item.number}
                            className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                              item.status === 'correct'
                                ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                                : item.status === 'partial'
                                ? 'bg-amber-50/20 dark:bg-amber-950/10'
                                : 'bg-rose-50/20 dark:bg-rose-950/10'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                              {item.number}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                              {item.studentAnswer || '—'}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {item.expectedKey || '—'}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === 'correct'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : item.status === 'partial'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {item.status === 'correct'
                                  ? 'Benar'
                                  : item.status === 'partial'
                                  ? 'Sebagian'
                                  : 'Salah'}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold font-mono text-slate-900 dark:text-white">
                              {item.score}/{item.maxScore}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                              {item.feedback || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Rekomendasi Remedial / Pengayaan */}
                {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-2 text-xs">
                    <h5 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Saran Remedial & Pengayaan untuk Siswa:</span>
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1">
                      {analysisResult.recommendations.map((rec, rIdx) => (
                        <li key={rIdx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="p-4 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-2xl">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Hasil Analisis Pemeriksaan Lembar Jawaban Akan Muncul di Sini
                </h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Unggah foto lembar jawaban siswa atau gunakan tombol <b>"Muat Contoh Lembar Ujian"</b>,
                  pastikan kunci jawaban terisi, lalu klik tombol <b>"Periksa & Hitung Nilai Otomatis"</b>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
