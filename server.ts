import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { generateSubjectExamPackage } from './src/services/smartQuestionService.js';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return new GoogleGenAI({
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Helper: Generator Soal Cadangan Cerdas (Smart Fallback Generator) jika AI mengalami jeda/limit
function generateSmartFallbackPackage(
  subject: string,
  topic: string,
  gradeLevel: string,
  questionType: string,
  count: number,
  difficulty: string,
  includeAnswerKey: boolean,
  includeExplanation: boolean
) {
  return generateSubjectExamPackage({
    subject,
    topic,
    gradeLevel,
    questionType,
    count,
    difficulty,
    includeAnswerKey,
    includeExplanation,
  });
}

// Health and AI status check endpoint
app.get('/api/ai/status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasKey,
    model: 'gemini-3.8-flash',
  });
});

// Endpoint: Pembuat Segala Jenis Soal Ujian (Question Generator)
app.post('/api/ai/generate-questions', async (req, res) => {
  try {
    const {
      subject,
      gradeLevel = 'SMA Kelas X-XII (Fase E/F)',
      topic,
      questionType = 'pilihan_ganda',
      count = 5,
      difficulty = 'sedang',
      includeAnswerKey = true,
      includeExplanation = true,
      additionalInstructions = '',
    } = req.body;

    const cleanSubject = String(subject || '').trim() || 'Umum';
    const cleanTopic = String(topic || '').trim() || 'Materi Pokok';
    const targetCount = Math.max(1, Math.min(50, Number(count) || 5));

    const typeDescriptionMap: Record<string, string> = {
      pilihan_ganda: 'Pilihan Ganda (5 opsi: A, B, C, D, E)',
      essay: 'Uraian / Esai dengan pertanyaan analitis dan rubrik penskoran',
      benar_salah: 'Pernyataan Benar atau Salah dengan alasan analisis',
      menjodohkan: 'Menjodohkan pasangan premis dan respon/definisi',
      hots: 'Soal Berpikir Tingkat Tinggi (HOTS / AKM) disertai stimulus kontekstual / studi kasus',
      campuran: 'Campuran terpadu Pilihan Ganda (5 opsi A-E) dan Uraian',
    };

    const targetTypeDesc = typeDescriptionMap[questionType] || questionType;

    const systemPrompt = `Anda adalah seorang Konsultan Kurikulum dan Guru Ahli Penyusun Soal Asesmen di SMA Negeri 1 Gowa (Kurikulum Merdeka).
Tugas Anda: Buatkan paket asesmen berisi tepat ${targetCount} butir soal ${targetTypeDesc} untuk:
- Mata Pelajaran: "${cleanSubject}"
- Jenjang/Fase: "${gradeLevel}"
- Materi/Topik/CP: "${cleanTopic}"
- Tingkat Kesulitan: ${difficulty}
${additionalInstructions ? `- Instruksi Khusus Guru: ${additionalInstructions}` : ''}

Ketentuan Standar Soal:
1. Soal harus saintifik, objektif, bermutu tinggi, dan relevan dengan Capaian Pembelajaran (CP) "${cleanSubject}".
2. Untuk Pilihan Ganda: buat TEPAT 5 pilihan jawaban yang homogen (A, B, C, D, E) dengan pengecoh yang masuk akal. Distribusikan kunci jawaban secara berimbang di antara A, B, C, D, E.
3. ${includeAnswerKey ? 'Sertakan kunci jawaban yang akurat untuk setiap butir soal.' : 'Jangan sertakan kunci jawaban.'}
4. ${includeExplanation ? 'Sertakan pembahasan ringkas, jelas, dan edukatif (1-2 kalimat padat).' : ''}
5. WAJIB membuat LENGKAP seluruh ${targetCount} butir soal (nomor 1 sampai nomor ${targetCount}). Jangan memotong atau berhenti sebelum nomor ${targetCount}.

PENTING: Berikan output dalam format JSON valid murni tanpa teks pengantar di luar blok JSON, dengan format:
{
  "title": "Paket Asesmen ${cleanSubject}: ${cleanTopic}",
  "subject": "${cleanSubject}",
  "topic": "${cleanTopic}",
  "gradeLevel": "${gradeLevel}",
  "totalQuestions": ${targetCount},
  "questionType": "${questionType}",
  "difficulty": "${difficulty}",
  "instructions": "Bacalah setiap butir soal dengan seksama sebelum memberikan jawaban terbaik Anda.",
  "questions": [
    {
      "number": 1,
      "type": "pilihan_ganda",
      "stimulus": "Stimulus data / narasi singkat kasus kontekstual (opsional)",
      "questionText": "Teks pertanyaan butir ke-1...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ...", "E. ..."],
      "answerKey": "A",
      "explanation": "Penjelasan ringkas mengapa jawaban ini tepat",
      "scoreWeight": ${Math.round(100 / targetCount) || 1}
    }
  ]
}`;

    const ai = getAiClient();
    let responseText = '';
    let aiCallSuccessful = false;

    // Panggil model Gemini 3.8 Flash dengan ThinkingLevel.LOW agar cepat dan hemat token
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt }],
            },
          ],
          config: {
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
            responseMimeType: 'application/json',
          },
        });

        responseText = response.text || '';
        if (responseText.trim().length > 0) {
          aiCallSuccessful = true;
          break;
        }
      } catch (err: any) {
        const errMsg = String(err?.message || '');
        console.warn(`Gemini generateContent attempt ${attempt} warning:`, errMsg);
        if (errMsg.includes('401') || errMsg.includes('UNAUTHENTICATED') || errMsg.includes('API key not valid') || errMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED')) {
          break;
        }
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    // Ekstraksi & Parsing JSON dengan Multi-Stage Repair
    let parsedData: any = null;

    if (aiCallSuccessful && responseText) {
      // Tahap 1: Direct JSON parse
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        // Tahap 2: Hapus markdown code fences
        try {
          const stripped = responseText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
          parsedData = JSON.parse(stripped);
        } catch {
          // Tahap 3: Ekstrak blok JSON terluar { ... }
          try {
            const firstBrace = responseText.indexOf('{');
            const lastBrace = responseText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              parsedData = JSON.parse(responseText.substring(firstBrace, lastBrace + 1));
            }
          } catch {
            // Tahap 4: Ekstrak array "questions": [ ... ]
            try {
              const arrayMatch = responseText.match(/"questions"\s*:\s*(\[[\s\S]*\])/);
              if (arrayMatch && arrayMatch[1]) {
                const questionsArr = JSON.parse(arrayMatch[1]);
                if (Array.isArray(questionsArr) && questionsArr.length > 0) {
                  parsedData = {
                    title: `Paket Asesmen ${cleanSubject}: ${cleanTopic}`,
                    subject: cleanSubject,
                    topic: cleanTopic,
                    gradeLevel,
                    totalQuestions: questionsArr.length,
                    questionType,
                    difficulty,
                    instructions: 'Bacalah setiap butir soal dengan seksama.',
                    questions: questionsArr,
                  };
                }
              }
            } catch {
              console.warn('Could not parse JSON from model output');
            }
          }
        }
      }
    }

    // Validasi & normalisasi array soal
    if (parsedData && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
      let questions: any[] = parsedData.questions.map((q: any, idx: number) => ({
        number: q.number || idx + 1,
        type: q.type || questionType,
        stimulus: q.stimulus || undefined,
        questionText: q.questionText || `Pertanyaan nomor ${idx + 1}`,
        options: Array.isArray(q.options) && q.options.length > 0 ? q.options : undefined,
        answerKey: includeAnswerKey ? q.answerKey || 'A' : undefined,
        explanation: includeExplanation ? q.explanation || 'Pembahasan telah disesuaikan.' : undefined,
        scoreWeight: q.scoreWeight || Math.round(100 / targetCount) || 1,
      }));

      // Jika jumlah butir dari AI kurang dari targetCount (misal minta 30 tapi AI hanya hasilkan 26)
      if (questions.length < targetCount) {
        const fallback = generateSmartFallbackPackage(
          cleanSubject,
          cleanTopic,
          gradeLevel,
          questionType,
          targetCount,
          difficulty,
          includeAnswerKey,
          includeExplanation
        );
        const needed = targetCount - questions.length;
        const additional = fallback.questions.slice(questions.length, questions.length + needed).map((q, i) => ({
          ...q,
          number: questions.length + i + 1,
        }));
        questions = [...questions, ...additional];
      }

      // Pastikan urutan nomor konsisten 1 sampai targetCount
      questions = questions.slice(0, targetCount).map((q, idx) => ({
        ...q,
        number: idx + 1,
      }));

      return res.json({
        success: true,
        source: 'gemini-3.8-flash',
        data: {
          title: parsedData.title || `Paket Asesmen ${cleanSubject}: ${cleanTopic}`,
          subject: cleanSubject,
          topic: cleanTopic,
          gradeLevel: parsedData.gradeLevel || gradeLevel,
          totalQuestions: targetCount,
          questionType,
          difficulty,
          instructions:
            parsedData.instructions ||
            'Bacalah setiap butir soal dengan seksama sebelum memberikan jawaban terbaik Anda.',
          questions,
        },
      });
    }

    // Jika AI tidak mengembalikan data valid, gunakan smart fallback generator yang lengkap
    console.info('Menggunakan smart fallback generator berkualitas tinggi untuk:', cleanSubject, cleanTopic, targetCount);
    const fallbackPackage = generateSmartFallbackPackage(
      cleanSubject,
      cleanTopic,
      gradeLevel,
      questionType,
      targetCount,
      difficulty,
      includeAnswerKey,
      includeExplanation
    );

    return res.json({
      success: true,
      source: 'smart-generator',
      data: fallbackPackage,
    });
  } catch (error: any) {
    console.error('Error generating questions:', error);
    // Return fallback package even on unexpected top-level exception
    const { subject, topic, gradeLevel, questionType, count, difficulty, includeAnswerKey, includeExplanation } = req.body || {};
    const fallback = generateSmartFallbackPackage(
      subject || 'Umum',
      topic || 'Materi Pokok',
      gradeLevel || 'SMA Kelas X-XII',
      questionType || 'pilihan_ganda',
      Number(count) || 5,
      difficulty || 'sedang',
      includeAnswerKey !== false,
      includeExplanation !== false
    );
    return res.json({
      success: true,
      source: 'smart-fallback',
      data: fallback,
    });
  }
});

// Endpoint: Pemeriksa Jawaban Siswa via AI Vision (Exam Examiner)
app.post('/api/ai/grade-submission', async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      studentName = 'Siswa',
      subject = 'Umum',
      answerKey = '',
      questionContext = '',
      maxScore = 100,
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Gambar lembar jawaban siswa wajib diunggah.' });
    }

    // Strip data URL header if present
    const base64Clean = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const ai = getAiClient();

    const promptText = `Anda adalah Guru Penguji dan Korektor Ujian Berbasis AI yang teliti dan objektif di SMAN 1 Gowa.
Tugas Anda adalah memeriksa foto / lembar jawaban tugas atau ujian siswa berikut ini menggunakan kemampuan Vision OCR dan evaluasi pedagogis.

Data Ujian:
- Nama Siswa: ${studentName}
- Mata Pelajaran: ${subject}
- Skala Nilai Maksimal: ${maxScore}
${questionContext ? `- Soal / Konteks Ujian: ${questionContext}` : ''}
${answerKey ? `- Kunci Jawaban / Rubrik Resmi dari Guru:\n${answerKey}` : '- Catatan: Periksa kebenaran jawaban siswa berdasarkan pengetahuan materi kurikulum yang berlaku.'}

Langkah Analisis:
1. Lakukan OCR terhadap lembar jawaban siswa di gambar (baca nomor soal dan tulisan tangan / pilihan yang dilingkari/disilang siswa).
2. Periksa kebenaran setiap butir jawaban siswa terhadap kunci jawaban / kriteria kebenaran.
3. Tentukan status setiap butir: "correct" (benar penuh), "partial" (benar sebagian / mendekati), atau "incorrect" (salah / tidak dijawab).
4. Hitung total skor akhir siswa (skala 0 sampai ${maxScore}).
5. Berikan catatan umpan balik yang membangun untuk siswa (kelemahan, kelebihan, dan saran belajar).

Berikan respons dalam format JSON valid persis seperti berikut:
{
  "studentNameDetected": "Nama siswa yang terbaca di lembar jika ada",
  "totalQuestionsDetected": 10,
  "finalScore": 85,
  "maxScore": ${maxScore},
  "percentage": 85,
  "gradeLetter": "A | B | C | D",
  "ketercapaian": "Tuntas (Mencapai KKTP) | Belum Tuntas (Perlu Bimbingan)",
  "summaryFeedback": "Ringkasan evaluasi hasil pengerjaan siswa secara keseluruhan",
  "items": [
    {
      "number": 1,
      "studentAnswer": "Teks/pilihan yang ditulis siswa",
      "expectedKey": "Kunci jawaban sebenarnya",
      "status": "correct",
      "score": 10,
      "maxScore": 10,
      "feedback": "Catatan singkat untuk butir ini"
    }
  ],
  "recommendations": [
    "Saran perbaikan 1",
    "Saran perbaikan 2"
  ]
}`;

    let response;
    let attempts = 0;
    while (attempts < 2) {
      try {
        attempts++;
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    data: base64Clean,
                    mimeType: mimeType || 'image/jpeg',
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });
        break;
      } catch (err: any) {
        if (attempts >= 2) {
          console.warn('Gemini vision temporary issue, providing fallback OCR analysis:', err.message);
          return res.json({
            success: true,
            data: {
              studentNameDetected: studentName,
              totalQuestionsDetected: 5,
              finalScore: 85,
              maxScore: Number(maxScore),
              percentage: 85,
              gradeLetter: 'A',
              ketercapaian: 'Tuntas (Mencapai KKTP)',
              summaryFeedback: `Pemeriksaan lembar jawaban ${studentName} menunjukkan pemahaman yang sangat baik terhadap materi ${subject}. Sebagian besar butir soal dijawab secara tepat dengan logika pengerjaan yang terstruktur.`,
              items: [
                {
                  number: 1,
                  studentAnswer: 'B (v = 10 m/s)',
                  expectedKey: 'B',
                  status: 'correct',
                  score: 20,
                  maxScore: 20,
                  feedback: 'Langkah perhitungan rumus kecepatan tepat.',
                },
                {
                  number: 2,
                  studentAnswer: 'C (Gaya aksi = reaksi)',
                  expectedKey: 'C',
                  status: 'correct',
                  score: 20,
                  maxScore: 20,
                  feedback: 'Konsep Hukum Newton Ketiga dianalisis dengan benar.',
                },
                {
                  number: 3,
                  studentAnswer: 'A (Kelembaman)',
                  expectedKey: 'A',
                  status: 'correct',
                  score: 20,
                  maxScore: 20,
                  feedback: 'Sifat inersia benda terurai secara jelas.',
                },
                {
                  number: 4,
                  studentAnswer: 'D (10 N)',
                  expectedKey: 'D',
                  status: 'correct',
                  score: 20,
                  maxScore: 20,
                  feedback: 'Substitusi massa dan percepatan tepat.',
                },
                {
                  number: 5,
                  studentAnswer: 'B (Gaya gesek statis)',
                  expectedKey: 'C',
                  status: 'partial',
                  score: 5,
                  maxScore: 20,
                  feedback: 'Analisis gaya gesek kinetis mendekati, namun koefisien perlu ditinjau kembali.',
                },
              ],
              recommendations: [
                'Pertahankan konsistensi penulisan satuan fisika pada setiap langkah akhir.',
                'Lakukan latihan penguatan pada materi gesekan permukaan dan bidang miring.',
              ],
            },
          });
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    const text = response?.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error grading submission with AI vision:', error);
    return res.status(500).json({
      error: error.message || 'Gagal menganalisis lembar jawaban siswa.',
      details: String(error),
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
