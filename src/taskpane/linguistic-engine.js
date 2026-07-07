/* ============================================================
   Creative Alibi — Linguistic Analysis Engine (Layer 2)
   Analisis struktur linguistik teks untuk mendeteksi pola AI.
   Berjalan 100% lokal di browser — teks TIDAK PERNAH dikirim keluar.
   ============================================================ */

/**
 * Minimum kata yang diperlukan untuk analisis linguistik yang akurat.
 * Di bawah ini, hasil dianggap "insufficient data".
 */
const MIN_WORDS_FOR_ANALYSIS = 50;
const IDEAL_WORDS_FOR_ANALYSIS = 250;

/**
 * Kata-kata penghubung khas output AI (Indonesia + English).
 * AI cenderung overuse kata-kata ini untuk transisi antar kalimat.
 */
const AI_CONNECTIVE_WORDS_ID = [
  "selain itu", "lebih lanjut", "di sisi lain", "dengan demikian",
  "oleh karena itu", "sebagai tambahan", "perlu dicatat", "secara keseluruhan",
  "pada dasarnya", "terlebih lagi", "tidak hanya itu", "sebagai hasilnya",
  "dapat disimpulkan", "penting untuk", "menariknya", "sejalan dengan",
  "berdasarkan hal tersebut", "sebagai kesimpulan", "hal ini menunjukkan",
  "patut diperhatikan"
];

const AI_CONNECTIVE_WORDS_EN = [
  "furthermore", "moreover", "additionally", "consequently",
  "nevertheless", "in conclusion", "it is worth noting", "significantly",
  "in essence", "it is important to note", "notably", "overall",
  "in summary", "as a result", "therefore", "thus", "hence",
  "on the other hand", "in addition", "accordingly"
];

/* ========================= Utility Functions ========================= */

/**
 * Pecah teks menjadi array kalimat.
 * Mendukung tanda baca Indonesia dan Inggris.
 */
function splitSentences(text) {
  // Split pada titik, tanda seru, tanda tanya yang diikuti spasi/akhir teks
  // Hindari split pada singkatan umum (Dr., Mr., dll.)
  const raw = text
    .replace(/([.!?])(\s+)/g, "$1\n")
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 3); // abaikan fragmen sangat pendek
  return raw;
}

/**
 * Pecah teks menjadi array kata (token), lowercase.
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u024F]/g, " ") // hapus tanda baca, pertahankan huruf + aksen
    .split(/\s+/)
    .filter(w => w.length > 0);
}

/**
 * Pecah teks menjadi array paragraf non-kosong.
 */
function splitParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 10);
}

/**
 * Hitung rata-rata dari array angka.
 */
function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Hitung standar deviasi populasi.
 */
function stdev(arr) {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Hitung Coefficient of Variation.
 */
function coefficientOfVariation(arr) {
  const m = mean(arr);
  if (m === 0) return 0;
  return stdev(arr) / m;
}

/* ========================= 8 Metrik Linguistik ========================= */

/**
 * METRIK 1: Sentence Burstiness Score
 * Mengukur variasi panjang kalimat. Manusia menulis dengan campuran
 * kalimat pendek dan panjang; AI cenderung seragam.
 *
 * @returns {number} 0-100 (tinggi = lebih manusiawi/bursty)
 */
function calcSentenceBurstiness(sentences) {
  if (sentences.length < 3) return -1; // insufficient

  const lengths = sentences.map(s => tokenize(s).length);
  const cv = coefficientOfVariation(lengths);

  // CV kalimat manusia biasanya 0.4-0.8, AI biasanya 0.15-0.35
  if (cv >= 0.7) return 100;
  if (cv >= 0.5) return 80 + ((cv - 0.5) / 0.2) * 20;
  if (cv >= 0.35) return 55 + ((cv - 0.35) / 0.15) * 25;
  if (cv >= 0.2) return 25 + ((cv - 0.2) / 0.15) * 30;
  return Math.max(0, cv / 0.2 * 25);
}

/**
 * METRIK 2: Vocabulary Richness (Type-Token Ratio)
 * Rasio kata unik terhadap total kata. Manusia cenderung lebih kaya
 * kosakatanya, AI lebih repetitif.
 *
 * Menggunakan Moving Average TTR (MATTR) untuk mengatasi bias panjang teks.
 * @returns {number} 0-100
 */
function calcVocabularyRichness(words) {
  if (words.length < MIN_WORDS_FOR_ANALYSIS) return -1;

  // MATTR: hitung TTR pada window bergerak, lalu rata-ratakan
  const windowSize = Math.min(50, words.length);
  const ttrValues = [];

  for (let i = 0; i <= words.length - windowSize; i++) {
    const window = words.slice(i, i + windowSize);
    const unique = new Set(window).size;
    ttrValues.push(unique / windowSize);
  }

  const mattr = mean(ttrValues);

  // MATTR manusia biasanya 0.7-0.9, AI biasanya 0.55-0.75
  if (mattr >= 0.85) return 100;
  if (mattr >= 0.75) return 75 + ((mattr - 0.75) / 0.1) * 25;
  if (mattr >= 0.65) return 45 + ((mattr - 0.65) / 0.1) * 30;
  if (mattr >= 0.55) return 20 + ((mattr - 0.55) / 0.1) * 25;
  return Math.max(0, mattr / 0.55 * 20);
}

/**
 * METRIK 3: Hapax Legomena Ratio
 * Persentase kata yang hanya muncul 1 kali dalam seluruh teks.
 * Manusia punya lebih banyak hapax legomena.
 *
 * @returns {number} 0-100
 */
function calcHapaxRatio(words) {
  if (words.length < MIN_WORDS_FOR_ANALYSIS) return -1;

  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  const hapaxCount = Object.values(freq).filter(f => f === 1).length;
  const totalUnique = Object.keys(freq).length;
  const hapaxRatio = totalUnique > 0 ? hapaxCount / totalUnique : 0;

  // Manusia: 50-70% kata unik hanya muncul sekali, AI: 30-50%
  if (hapaxRatio >= 0.65) return 100;
  if (hapaxRatio >= 0.55) return 75 + ((hapaxRatio - 0.55) / 0.1) * 25;
  if (hapaxRatio >= 0.45) return 45 + ((hapaxRatio - 0.45) / 0.1) * 30;
  if (hapaxRatio >= 0.35) return 20 + ((hapaxRatio - 0.35) / 0.1) * 25;
  return Math.max(0, hapaxRatio / 0.35 * 20);
}

/**
 * METRIK 4: Sentence Starter Diversity
 * Mengukur variasi kata pertama setiap kalimat.
 * AI sering memulai kalimat dengan pola yang berulang.
 *
 * @returns {number} 0-100
 */
function calcSentenceStarterDiversity(sentences) {
  if (sentences.length < 5) return -1;

  const starters = sentences.map(s => {
    const words = tokenize(s);
    return words.length > 0 ? words[0] : "";
  }).filter(w => w.length > 0);

  const uniqueStarters = new Set(starters).size;
  const diversityRatio = uniqueStarters / starters.length;

  // Manusia: 70-90% starter unik, AI: 40-65%
  if (diversityRatio >= 0.85) return 100;
  if (diversityRatio >= 0.7) return 75 + ((diversityRatio - 0.7) / 0.15) * 25;
  if (diversityRatio >= 0.55) return 45 + ((diversityRatio - 0.55) / 0.15) * 30;
  if (diversityRatio >= 0.4) return 20 + ((diversityRatio - 0.4) / 0.15) * 25;
  return Math.max(0, diversityRatio / 0.4 * 20);
}

/**
 * METRIK 5: Connective Word Overuse Score
 * Deteksi penggunaan berlebihan kata penghubung khas AI.
 * AI sangat suka "Furthermore", "Moreover", "Selain itu", dll.
 *
 * @returns {number} 0-100 (tinggi = sedikit connective berlebihan = manusiawi)
 */
function calcConnectiveOveruse(text, sentences) {
  if (sentences.length < 5) return -1;

  const lowerText = text.toLowerCase();
  const allConnectives = [...AI_CONNECTIVE_WORDS_ID, ...AI_CONNECTIVE_WORDS_EN];

  let connectiveCount = 0;
  allConnectives.forEach(conn => {
    const regex = new RegExp("\\b" + conn.replace(/\s+/g, "\\s+") + "\\b", "gi");
    const matches = lowerText.match(regex);
    if (matches) connectiveCount += matches.length;
  });

  // Rasio connective per kalimat
  const ratio = connectiveCount / sentences.length;

  // Manusia: 0-0.1 connective/kalimat, AI: 0.15-0.4+
  if (ratio <= 0.05) return 100;
  if (ratio <= 0.1) return 80 + ((0.1 - ratio) / 0.05) * 20;
  if (ratio <= 0.2) return 50 + ((0.2 - ratio) / 0.1) * 30;
  if (ratio <= 0.35) return 20 + ((0.35 - ratio) / 0.15) * 30;
  return Math.max(0, Math.round(20 * (1 - (ratio - 0.35) / 0.3)));
}

/**
 * METRIK 6: Zipf's Law Compliance
 * Hukum Zipf: kata ke-n paling sering muncul ~1/n kali dari kata paling sering.
 * Teks manusia alami mengikuti hukum ini dengan baik; AI sering menyimpang.
 *
 * @returns {number} 0-100
 */
function calcZipfCompliance(words) {
  if (words.length < MIN_WORDS_FOR_ANALYSIS) return -1;

  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  // Sort frekuensi dari tertinggi
  const sorted = Object.values(freq).sort((a, b) => b - a);
  if (sorted.length < 10) return -1;

  // Hitung korelasi dengan distribusi Zipf ideal
  const topN = Math.min(50, sorted.length);
  const maxFreq = sorted[0];

  let sumSqDiff = 0;
  let sumSqIdeal = 0;

  for (let rank = 1; rank <= topN; rank++) {
    const actual = sorted[rank - 1] / maxFreq;
    const ideal = 1 / rank;
    sumSqDiff += Math.pow(actual - ideal, 2);
    sumSqIdeal += Math.pow(ideal, 2);
  }

  // R² approximation: 1 - (SSres / SStot)
  const rSquared = Math.max(0, 1 - (sumSqDiff / sumSqIdeal));

  // R² manusia: 0.85-0.98, AI: 0.6-0.85
  if (rSquared >= 0.95) return 100;
  if (rSquared >= 0.85) return 70 + ((rSquared - 0.85) / 0.1) * 30;
  if (rSquared >= 0.7) return 35 + ((rSquared - 0.7) / 0.15) * 35;
  if (rSquared >= 0.5) return 10 + ((rSquared - 0.5) / 0.2) * 25;
  return Math.max(0, rSquared / 0.5 * 10);
}

/**
 * METRIK 7: Repetitive N-gram Detection
 * Deteksi frasa berulang (bigram dan trigram).
 * AI cenderung mengulang pola frasa yang sama lebih sering.
 *
 * @returns {number} 0-100 (tinggi = sedikit repetisi = manusiawi)
 */
function calcRepetitiveNgrams(words) {
  if (words.length < MIN_WORDS_FOR_ANALYSIS) return -1;

  // Hitung bigram repetitions
  const bigrams = {};
  for (let i = 0; i < words.length - 1; i++) {
    const bg = words[i] + " " + words[i + 1];
    bigrams[bg] = (bigrams[bg] || 0) + 1;
  }

  // Hitung trigram repetitions
  const trigrams = {};
  for (let i = 0; i < words.length - 2; i++) {
    const tg = words[i] + " " + words[i + 1] + " " + words[i + 2];
    trigrams[tg] = (trigrams[tg] || 0) + 1;
  }

  // Hitung persentase n-gram yang muncul >1 kali (mengabaikan stopwords umum)
  const repeatedBigrams = Object.values(bigrams).filter(f => f > 1).length;
  const repeatedTrigrams = Object.values(trigrams).filter(f => f > 1).length;

  const totalBigrams = Object.keys(bigrams).length;
  const totalTrigrams = Object.keys(trigrams).length;

  const bigramRepeatRatio = totalBigrams > 0 ? repeatedBigrams / totalBigrams : 0;
  const trigramRepeatRatio = totalTrigrams > 0 ? repeatedTrigrams / totalTrigrams : 0;

  // Gabungkan kedua rasio (trigram diberi bobot lebih karena lebih signifikan)
  const combinedRatio = bigramRepeatRatio * 0.3 + trigramRepeatRatio * 0.7;

  // Manusia: 0.02-0.08, AI: 0.08-0.2+
  if (combinedRatio <= 0.03) return 100;
  if (combinedRatio <= 0.06) return 75 + ((0.06 - combinedRatio) / 0.03) * 25;
  if (combinedRatio <= 0.1) return 45 + ((0.1 - combinedRatio) / 0.04) * 30;
  if (combinedRatio <= 0.18) return 15 + ((0.18 - combinedRatio) / 0.08) * 30;
  return Math.max(0, Math.round(15 * (1 - (combinedRatio - 0.18) / 0.12)));
}

/**
 * METRIK 8: Paragraph Structure Uniformity
 * AI cenderung menghasilkan paragraf dengan panjang seragam.
 * Manusia lebih bervariasi.
 *
 * @returns {number} 0-100
 */
function calcParagraphUniformity(paragraphs) {
  if (paragraphs.length < 3) return -1;

  const lengths = paragraphs.map(p => tokenize(p).length);
  const cv = coefficientOfVariation(lengths);

  // CV paragraf manusia: 0.4-0.9, AI: 0.1-0.35
  if (cv >= 0.7) return 100;
  if (cv >= 0.5) return 75 + ((cv - 0.5) / 0.2) * 25;
  if (cv >= 0.35) return 45 + ((cv - 0.35) / 0.15) * 30;
  if (cv >= 0.2) return 15 + ((cv - 0.2) / 0.15) * 30;
  return Math.max(0, cv / 0.2 * 15);
}

/* ========================= Main Analysis Function ========================= */

/**
 * Jalankan seluruh analisis linguistik pada teks.
 * Semua proses berjalan lokal — teks TIDAK dikirim ke mana pun.
 *
 * @param {string} text — teks dokumen untuk dianalisis
 * @returns {object} — hasil analisis dengan skor per-metrik dan skor gabungan
 */
export function analyzeLinguistic(text) {
  if (!text || typeof text !== "string") {
    return createEmptyResult("Tidak ada teks untuk dianalisis.");
  }

  const words = tokenize(text);
  const sentences = splitSentences(text);
  const paragraphs = splitParagraphs(text);

  const wordCount = words.length;

  // Cek minimum kata
  if (wordCount < MIN_WORDS_FOR_ANALYSIS) {
    return createEmptyResult(
      `Teks terlalu pendek (${wordCount} kata). Minimum ${MIN_WORDS_FOR_ANALYSIS} kata untuk analisis linguistik.`
    );
  }

  // Hitung semua metrik
  const metrics = {
    sentenceBurstiness: {
      score: calcSentenceBurstiness(sentences),
      label: "Variasi Panjang Kalimat",
      description: "Manusia menulis campuran kalimat pendek & panjang; AI cenderung seragam.",
      weight: 0.15
    },
    vocabularyRichness: {
      score: calcVocabularyRichness(words),
      label: "Kekayaan Kosakata",
      description: "Rasio kata unik vs total (MATTR). Manusia lebih bervariasi.",
      weight: 0.15
    },
    hapaxRatio: {
      score: calcHapaxRatio(words),
      label: "Hapax Legomena",
      description: "Kata yang hanya muncul 1×. Manusia punya lebih banyak kata sekali-pakai.",
      weight: 0.10
    },
    sentenceStarterDiv: {
      score: calcSentenceStarterDiversity(sentences),
      label: "Variasi Awal Kalimat",
      description: "AI sering memulai kalimat dengan pola berulang.",
      weight: 0.10
    },
    connectiveOveruse: {
      score: calcConnectiveOveruse(text, sentences),
      label: "Kata Penghubung Berlebihan",
      description: "AI overuse 'Selain itu', 'Furthermore', 'Moreover', dll.",
      weight: 0.15
    },
    zipfCompliance: {
      score: calcZipfCompliance(words),
      label: "Kepatuhan Hukum Zipf",
      description: "Distribusi frekuensi kata alami mengikuti hukum Zipf.",
      weight: 0.10
    },
    repetitiveNgrams: {
      score: calcRepetitiveNgrams(words),
      label: "Pola Frasa Berulang",
      description: "AI mengulang bigram/trigram lebih sering dari manusia.",
      weight: 0.15
    },
    paragraphUniformity: {
      score: calcParagraphUniformity(paragraphs),
      label: "Variasi Struktur Paragraf",
      description: "AI menghasilkan paragraf dengan panjang seragam.",
      weight: 0.10
    }
  };

  // Hitung weighted score hanya dari metrik yang valid (score !== -1)
  let totalWeight = 0;
  let weightedSum = 0;
  let activeMetrics = 0;
  let insufficientMetrics = 0;

  Object.values(metrics).forEach(m => {
    if (m.score >= 0) {
      weightedSum += m.score * m.weight;
      totalWeight += m.weight;
      activeMetrics++;
    } else {
      insufficientMetrics++;
    }
  });

  const linguisticScore = totalWeight > 0
    ? Math.round(weightedSum / totalWeight)
    : -1;

  // Confidence berdasarkan jumlah kata dan metrik aktif
  let confidence = "LOW";
  if (wordCount >= IDEAL_WORDS_FOR_ANALYSIS && activeMetrics >= 6) confidence = "HIGH";
  else if (wordCount >= MIN_WORDS_FOR_ANALYSIS && activeMetrics >= 4) confidence = "MEDIUM";

  return {
    available: linguisticScore >= 0,
    score: linguisticScore,
    confidence,
    wordCount,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    activeMetrics,
    insufficientMetrics,
    metrics,
    message: linguisticScore >= 0
      ? `Analisis linguistik selesai (${activeMetrics}/${activeMetrics + insufficientMetrics} metrik aktif).`
      : "Data tidak cukup untuk analisis linguistik."
  };
}

/**
 * Buat result kosong untuk kasus di mana analisis tidak bisa dijalankan.
 */
function createEmptyResult(message) {
  return {
    available: false,
    score: -1,
    confidence: "NONE",
    wordCount: 0,
    sentenceCount: 0,
    paragraphCount: 0,
    activeMetrics: 0,
    insufficientMetrics: 8,
    metrics: {},
    message
  };
}

/**
 * Interpretasi skor linguistik untuk tampilan UI.
 */
export function interpretLinguisticScore(score) {
  if (score < 0) return { color: "#888", label: "Data tidak cukup", level: "UNKNOWN" };
  if (score >= 75) return { color: "#2f7a4f", label: "Pola linguistik konsisten dengan tulisan manusia.", level: "HUMAN_LIKELY" };
  if (score >= 50) return { color: "#b4762b", label: "Pola linguistik campuran — ada karakteristik AI terdeteksi.", level: "MIXED" };
  return { color: "#a5432b", label: "Pola linguistik menunjukkan kemungkinan besar teks AI-generated.", level: "AI_LIKELY" };
}
