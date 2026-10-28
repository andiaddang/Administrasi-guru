const GENERIC_QUESTION_ANGLES = [
  {
    stem: "Manakah di antara pernyataan berikut yang paling tepat mendefinisikan prinsip dasar dari",
    correctText: "Merupakan konsep fundamental yang menghubungkan variabel utama dengan kaidah sistem yang berlaku secara konsisten.",
    distractors: [
      "Hanya berlaku pada kondisi eksperimen tertutup tanpa adanya interaksi eksternal.",
      "Mengindikasikan bahwa nilai besaran selalu bernilai nol dalam keadaan dinamis.",
      "Menyatakan bahwa perubahan sistem tidak dipengaruhi oleh parameter awal yang telah ditetapkan.",
      "Merupakan fenomena sesaat yang tidak memiliki korelasi dengan capaian pembelajaran materi terkait."
    ],
    explanation: "Pernyataan ini tepat karena merefleksikan definisi dan prinsip dasar materi secara saintifik, utuh, dan sesuai kaidah."
  },
  {
    stem: "Berdasarkan analisis karakteristik materi, faktor penentu yang paling dominan dalam keteraturan fenomena",
    correctText: "Interaksi timbal balik antara besaran input dengan daya dukung lingkungan sistem kerja.",
    distractors: [
      "Penurunan frekuensi operasional secara acak dan tidak teratur.",
      "Hanya faktor kebetulan tanpa adanya kaidah hukum alam atau kaidah keilmuan yang mengikat.",
      "Perubahan temperatur konstan yang sama sekali tidak menghasilkan perbedaan energi potensial.",
      "Ketiadaan hubungan kausalitas antara stimulus yang diberikan dengan respon yang diamati."
    ],
    explanation: "Faktor penentu utama selalu didasarkan pada interaksi terukur antar variabel pembentuk sistem."
  },
  {
    stem: "Dalam penerapan kehidupan sehari-hari, contoh konkret implementasi nyata dari konsep",
    correctText: "Aplikasi terpadu pada teknologi modern dan aktivitas masyarakat dalam memecahkan permasalahan kontekstual.",
    distractors: [
      "Pengabaian seluruh variabel pendukung demi efisiensi jangka pendek.",
      "Penggunaan metode acak tanpa evaluasi keselamatan dan efektivitas kerja.",
      "Penerapan yang bertentangan dengan prinsip etika dan kelestarian lingkungan hidup.",
      "Pemanfaatan instrumen tanpa kalibrasi standar yang baku dan tervalidasi."
    ],
    explanation: "Penerapan kontekstual bertujuan memberikan solusi nyata yang efektif, aman, serta relevan dengan lingkungan sekitar."
  },
  {
    stem: "Perhatikan hubungan sebab-akibat berikut! Apabila terjadi peningkatan intensitas pada komponen utama",
    correctText: "Sistem akan merespons secara adaptif sesuai dengan hukum kekekalan dan stabilitas dinamis.",
    distractors: [
      "Sistem langsung runtuh tanpa menghasilkan respon transformasi apa pun.",
      "Tidak terjadi perubahan sama sekali meskipun intensitas dinaikkan secara ekstrem.",
      "Nilai keluaran menjadi tidak terdefinisi dan menyimpang dari kaidah dasar.",
      "Semua parameter turunan akan tereliminasi secara spontan."
    ],
    explanation: "Respons adaptif mempertahankan keseimbangan sistem sesuai kaidah hukum yang berlaku."
  },
  {
    stem: "Seorang peserta didik melakukan kajian komparatif. Perbedaan mendasar antara penerapan konvensional dan modern pada",
    correctText: "Optimalisasi akurasi, efisiensi waktu, serta akuntabilitas data berbasis pendekatan saintifik.",
    distractors: [
      "Penggunaan bahan baku yang lebih rapuh dan tidak terstandarisasi secara industri.",
      "Penghilangan tahapan verifikasi demi mengejar kecepatan proses pengerjaan.",
      "Penurunan standar keselamatan kerja dibandingkan metode terdahulu.",
      "Ketiadaan dokumentasi hasil pengujian dalam pelaporan akhir."
    ],
    explanation: "Pendekatan modern menekankan presisi tinggi, efisiensi terukur, dan berbasis data ilmiah valid."
  },
  {
    stem: "Kajian kritis HOTS: Mengapa pemahaman mendalam tentang materi ini sangat penting dalam Profil Pelajar Pancasila?",
    correctText: "Mengembangkan nalar kritis, kreativitas pemecahan masalah kontekstual, dan kemandirian belajar.",
    distractors: [
      "Hanya untuk menghafal istilah tanpa memahami makna esensial di baliknya.",
      "Membatasi eksplorasi siswa agar terpaku pada satu sudut pandang teori tekstual saja.",
      "Menggantikan peran observasi lapangan dengan spekulasi abstrak semata.",
      "Menyederhanakan masalah kompleks menjadi kesimpulan parsial tanpa bukti empiris."
    ],
    explanation: "Kurikulum Merdeka berorientasi pada penguatan kompetensi nalar kritis, berpikir analitis, dan solutif."
  },
  {
    stem: "Dalam suatu eksperimen laboratorium/pengamatan lapangan mengenai materi ini, variabel kontrol yang harus dijaga konstan adalah",
    correctText: "Kondisi lingkungan awal dan instrumen ukur agar data yang diperoleh memiliki reliabilitas tinggi.",
    distractors: [
      "Hasil akhir yang diharapkan oleh peneliti agar sesuai dugaan awal.",
      "Semua variabel bebas diubah secara serentak tanpa pencatatan.",
      "Durasi pengamatan yang dipersingkat tanpa jadwal pasti.",
      "Sumber rujukan teori yang diabaikan selama proses sintesis data."
    ],
    explanation: "Variabel kontrol memastikan bahwa perubahan pada variabel terikat semata-mata diakibatkan oleh perlakuan variabel bebas."
  },
  {
    stem: "Jika data pengamatan menunjukkan deviasi yang signifikan dari teori standar pada",
    correctText: "Lakukan evaluasi terhadap kalibrasi alat ukur, kebersihan sampel, dan potensi galat sistematis.",
    distractors: [
      "Mengubah angka data mentah agar langsung sesuai dengan hipotesis mula-mula.",
      "Menolak teori dasar tanpa melakukan pengujian ulang yang memadai.",
      "Menghentikan seluruh proses pembelajaran dan menyatakan materi tidak valid.",
      "Mengabaikan data pencilan tanpa analisis faktor penyebabnya."
    ],
    explanation: "Sikap ilmiah menuntut penelusuran galat sistematis dan verifikasi metodologi pengujian."
  }
];
const STEM_QUESTION_ANGLES = [
  {
    stem: "Perhatikan formulasi matematis dan besaran yang terlibat! Hubungan proporsional yang tepat pada konsep",
    correctText: "Besaran keluaran berbanding lurus dengan koefisien input dan berbanding terbalik dengan faktor hambatan.",
    distractors: [
      "Besaran selalu bernilai kuadratik negatif terlepas dari nilai variabel pembentuk.",
      "Tidak terdapat hubungan matematis yang dapat dimodelkan secara pasti.",
      "Besaran keluaran selalu konstan pada nilai nol di setiap fase perubahan.",
      "Hubungan antarvariabel sepenuhnya bergantung pada asumsi subjektif pengamat."
    ],
    explanation: "Hubungan proporsionalitas ini merupakan representasi kaidah hukum fisika/matematika dasar materi tersebut."
  },
  {
    stem: "Analisis Grafik: Bila disajikan kurva hubungan antara parameter X dan Y pada materi",
    correctText: "Kemiringan kurva (gradien) merepresentasikan laju perubahan atau konstanta karakteristik sistem.",
    distractors: [
      "Kurva selalu berupa garis horizontal tanpa makna fisik yang dapat dianalisis.",
      "Gradien kurva tidak memiliki dimensi satuan dan tidak berkorelasi dengan laju perubahan.",
      "Luas di bawah kurva selalu mengabaikan hukum kekekalan energi.",
      "Bentuk kurva hanya bersifat estetis tanpa kaitan dengan persamaan diferensial materi."
    ],
    explanation: "Gradien kurva pada analisis saintifik menunjukkan laju transfer atau koefisien determinasi materi."
  }
];
function generateSubjectExamPackage(params) {
  const {
    subject = "Fisika",
    topic = "Materi Pokok Pembelajaran",
    gradeLevel = "Kelas X (Fase E)",
    questionType = "pilihan_ganda",
    count = 25,
    difficulty = "sedang",
    includeAnswerKey = true,
    includeExplanation = true
  } = params;
  const targetCount = Math.max(1, Math.min(50, Number(count) || 25));
  const keysCycle = ["A", "B", "C", "D", "E"];
  const isStem = /fisika|matematika|kimia|biologi|ipa|informatika/i.test(subject);
  const anglesPool = isStem ? [...GENERIC_QUESTION_ANGLES, ...STEM_QUESTION_ANGLES] : GENERIC_QUESTION_ANGLES;
  const questions = Array.from({ length: targetCount }, (_, idx) => {
    const num = idx + 1;
    const key = keysCycle[(num - 1) % keysCycle.length];
    const angle = anglesPool[(num - 1) % anglesPool.length];
    const scoreWeight = Math.round(100 / targetCount) || 1;
    if (questionType === "essay") {
      return {
        number: num,
        type: "essay",
        stimulus: `Kajian Analisis ${subject} (${topic}) - Bagian Evaluasi No. ${num}: Telaah mendalam tentang dinamika konsep dan implementasi terapan di lingkungan sekolah serta masyarakat.`,
        questionText: `Uraikan secara komprehensif bagaimana prinsip "${topic}" diterapkan pada butir evaluasi ke-${num}, serta jelaskan implikasi analitisnya terhadap pemecahan masalah kontekstual!`,
        answerKey: includeAnswerKey ? `Peserta didik mampu menguraikan definisi esensial ${topic}, menyajikan argumen logis berdasarkan prinsip saintifik, dan memberikan minimal satu contoh solusi penerapannya secara sistematis.` : void 0,
        explanation: includeExplanation ? `Rubrik Penskoran: Penguasaan konsep dasar (40%), Ketajaman analisis argumen (30%), Kejelasan contoh aplikasi nyata & kesimpulan (30%). Total bobot: ${scoreWeight} poin.` : void 0,
        scoreWeight
      };
    }
    if (questionType === "benar_salah") {
      const isTrue = num % 2 === 1;
      return {
        number: num,
        type: "benar_salah",
        stimulus: `Tinjauan Materi ${subject} (Topik: ${topic}): Evaluasi kebenaran pernyataan nomor ${num}.`,
        questionText: `Pernyataan: "Pada kajian ${topic}, dinamika perubahan sistem selalu sebanding dengan besaran faktor penggerak serta mengikuti kaidah keteraturan yang konsisten."`,
        options: ["A. Benar", "B. Salah"],
        answerKey: includeAnswerKey ? isTrue ? "A. Benar" : "B. Salah" : void 0,
        explanation: includeExplanation ? `Prinsip ${topic} membuktikan bahwa keteraturan sistem terjaga selama asumsi dasar dan variabel pembatas terpenuhi.` : void 0,
        scoreWeight
      };
    }
    if (questionType === "hots") {
      const optionsMap2 = {};
      const keyIndex2 = keysCycle.indexOf(key);
      let distractorIdx2 = 0;
      keysCycle.forEach((letter, lIdx) => {
        if (lIdx === keyIndex2) {
          optionsMap2[letter] = `${letter}. ${angle.correctText}`;
        } else {
          const distText = angle.distractors[distractorIdx2 % angle.distractors.length];
          optionsMap2[letter] = `${letter}. ${distText}`;
          distractorIdx2++;
        }
      });
      return {
        number: num,
        type: "hots",
        stimulus: `Studi Kasus Kontekstual SMAN 1 Gowa (Materi: ${subject} - ${topic}): Dalam proyek penelitian siswa bertema inovasi berkelanjutan, diperoleh serangkaian data pengukuran empiris pada simulasi nomor ${num}.`,
        questionText: `Berdasarkan analisis kritis terhadap data dan prinsip "${topic}", keputusan strategis yang paling rasional dan teruji secara ilmiah adalah?`,
        options: keysCycle.map((k) => optionsMap2[k]),
        answerKey: includeAnswerKey ? key : void 0,
        explanation: includeExplanation ? `Analisis HOTS: Keputusan tepat harus didasarkan pada integrasi nalar analitis materi ${topic} dengan fakta empiris terverifikasi (Opsi ${key} tepat).` : void 0,
        scoreWeight
      };
    }
    if (questionType === "campuran" && num > Math.floor(targetCount * 0.8)) {
      return {
        number: num,
        type: "essay",
        stimulus: `Bagian Uraian Penilaian Akhir ${subject}: Pendalaman materi ${topic} butir ke-${num}.`,
        questionText: `Jelaskan secara runtut hubungan sebab-akibat pada penerapan "${topic}", sertakan contoh kasus relevan serta simpulan analisis Anda!`,
        answerKey: includeAnswerKey ? `Jawaban mencakup penguasaan konsep, runtutan argumen sebab-akibat, dan contoh riil kontekstual.` : void 0,
        explanation: includeExplanation ? `Pedoman Penskoran: Sistematika uraian logis (100% skor).` : void 0,
        scoreWeight: scoreWeight * 2
      };
    }
    const optionsMap = {};
    const keyIndex = keysCycle.indexOf(key);
    let distractorIdx = 0;
    keysCycle.forEach((letter, lIdx) => {
      if (lIdx === keyIndex) {
        optionsMap[letter] = `${letter}. ${angle.correctText}`;
      } else {
        const distText = angle.distractors[distractorIdx % angle.distractors.length];
        optionsMap[letter] = `${letter}. ${distText}`;
        distractorIdx++;
      }
    });
    const options = keysCycle.map((k) => optionsMap[k]);
    return {
      number: num,
      type: "pilihan_ganda",
      stimulus: `Konteks Evaluasi Asesmen ${subject} (Materi: ${topic}) Butir ke-${num}:`,
      questionText: `${angle.stem} "${topic}" pada butir soal nomor ${num}?`,
      options,
      answerKey: includeAnswerKey ? key : void 0,
      explanation: includeExplanation ? `${angle.explanation} Pilihan jawaban yang tepat adalah opsi ${key}.` : void 0,
      scoreWeight
    };
  });
  return {
    id: `exam-${Date.now()}`,
    createdAt: (/* @__PURE__ */ new Date()).toLocaleString("id-ID"),
    title: `Paket Asesmen ${subject}: ${topic}`,
    subject,
    topic,
    gradeLevel: gradeLevel || "SMA Kelas X-XII (Fase E/F)",
    totalQuestions: targetCount,
    questionType,
    difficulty,
    instructions: "Bacalah setiap butir soal dengan seksama, teliti konteks yang disajikan, dan pilihlah/tuliskan jawaban terbaik Anda secara mandiri dan jujur.",
    questions
  };
}
export {
  generateSubjectExamPackage
};
