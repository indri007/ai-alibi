/* ============================================================
   Creative Alibi — Forensic Confidence Engine
   Menggabungkan skor dari semua layer aktif menjadi satu
   Forensic Confidence Score dengan confidence level.
   ============================================================ */

/**
 * Bobot default per layer.
 * Akan dinormalisasi ulang jika ada layer yang tidak aktif.
 */
const DEFAULT_WEIGHTS = {
  behavioral: 0.30,
  linguistic: 0.40,
  api: 0.30
};

/**
 * Bobot fallback ketika Layer 3 (API) tidak aktif.
 */
const FALLBACK_WEIGHTS_NO_API = {
  behavioral: 0.40,
  linguistic: 0.60
};

/**
 * Bobot fallback ketika hanya Layer 1 (Behavioral) aktif.
 */
const FALLBACK_WEIGHTS_BEHAVIORAL_ONLY = {
  behavioral: 1.0
};

/* ========================= Forensic Score Computation ========================= */

/**
 * Hitung Forensic Confidence Score dari semua layer yang tersedia.
 *
 * @param {object} params
 * @param {number} params.behavioralScore  — skor Layer 1 (0-100, selalu ada)
 * @param {object} params.linguisticResult — hasil dari analyzeLinguistic()
 * @param {object} params.apiResult        — hasil dari detectWithAPI()
 * @returns {object} — forensic result lengkap
 */
export function computeForensicScore({ behavioralScore, linguisticResult, apiResult }) {
  const layers = [];
  const layerDetails = {};

  // Layer 1: Behavioral (selalu tersedia jika ada recording)
  const hasBehavioral = typeof behavioralScore === "number" && behavioralScore >= 0;
  if (hasBehavioral) {
    layers.push({
      id: "behavioral",
      name: "Analisis Perilaku",
      score: behavioralScore,
      available: true,
      icon: "⌨️"
    });
    layerDetails.behavioral = {
      score: behavioralScore,
      interpretation: interpretBehavioralLevel(behavioralScore)
    };
  }

  // Layer 2: Linguistic (tersedia jika teks cukup panjang)
  const hasLinguistic = linguisticResult && linguisticResult.available && linguisticResult.score >= 0;
  if (hasLinguistic) {
    layers.push({
      id: "linguistic",
      name: "Analisis Linguistik",
      score: linguisticResult.score,
      available: true,
      icon: "📝"
    });
    layerDetails.linguistic = {
      score: linguisticResult.score,
      confidence: linguisticResult.confidence,
      metrics: linguisticResult.metrics,
      interpretation: interpretLinguisticLevel(linguisticResult.score)
    };
  }

  // Layer 3: External API (tersedia jika consent + API response OK)
  const hasAPI = apiResult && apiResult.available && apiResult.score >= 0;
  if (hasAPI) {
    layers.push({
      id: "api",
      name: "Deteksi AI Eksternal",
      score: apiResult.score,
      available: true,
      icon: "🔬"
    });
    layerDetails.api = {
      score: apiResult.score,
      provider: apiResult.details?.provider || "Unknown",
      interpretation: interpretAPILevel(apiResult.score)
    };
  }

  // Tentukan bobot berdasarkan layer yang aktif
  const weights = determineWeights(hasBehavioral, hasLinguistic, hasAPI);

  // Hitung weighted average
  let forensicScore = 0;
  let totalWeight = 0;

  if (hasBehavioral && weights.behavioral) {
    forensicScore += behavioralScore * weights.behavioral;
    totalWeight += weights.behavioral;
  }
  if (hasLinguistic && weights.linguistic) {
    forensicScore += linguisticResult.score * weights.linguistic;
    totalWeight += weights.linguistic;
  }
  if (hasAPI && weights.api) {
    forensicScore += apiResult.score * weights.api;
    totalWeight += weights.api;
  }

  forensicScore = totalWeight > 0 ? Math.round(forensicScore / totalWeight) : -1;

  // Hitung confidence level
  const confidenceLevel = computeConfidenceLevel(layers);

  // Hitung agreement antar layer
  const agreement = computeAgreement(layers);

  return {
    score: forensicScore,
    activeLayers: layers.length,
    totalLayers: 3,
    layers,
    layerDetails,
    weights,
    confidenceLevel,
    agreement,
    interpretation: interpretForensicScore(forensicScore, confidenceLevel),
    timestamp: new Date().toISOString()
  };
}

/* ========================= Weight Determination ========================= */

function determineWeights(hasBehavioral, hasLinguistic, hasAPI) {
  if (hasBehavioral && hasLinguistic && hasAPI) {
    return { ...DEFAULT_WEIGHTS };
  }
  if (hasBehavioral && hasLinguistic && !hasAPI) {
    return { ...FALLBACK_WEIGHTS_NO_API, api: 0 };
  }
  if (hasBehavioral && !hasLinguistic && hasAPI) {
    return { behavioral: 0.45, linguistic: 0, api: 0.55 };
  }
  if (hasBehavioral && !hasLinguistic && !hasAPI) {
    return { ...FALLBACK_WEIGHTS_BEHAVIORAL_ONLY, linguistic: 0, api: 0 };
  }
  // Edge cases (tanpa behavioral)
  if (!hasBehavioral && hasLinguistic && hasAPI) {
    return { behavioral: 0, linguistic: 0.55, api: 0.45 };
  }
  if (!hasBehavioral && hasLinguistic && !hasAPI) {
    return { behavioral: 0, linguistic: 1.0, api: 0 };
  }
  if (!hasBehavioral && !hasLinguistic && hasAPI) {
    return { behavioral: 0, linguistic: 0, api: 1.0 };
  }
  return { behavioral: 0, linguistic: 0, api: 0 };
}

/* ========================= Confidence Level ========================= */

/**
 * Tentukan tingkat kepercayaan berdasarkan jumlah layer aktif
 * dan seberapa sepakat mereka.
 */
function computeConfidenceLevel(layers) {
  if (layers.length === 0) return { level: "NONE", label: "Tidak ada data", color: "#888" };

  const agreement = computeAgreement(layers);

  if (layers.length >= 3 && agreement.agreementLevel === "STRONG") {
    return { level: "VERY_HIGH", label: "Sangat Tinggi", color: "#1a6b37" };
  }
  if (layers.length >= 3 && agreement.agreementLevel === "MODERATE") {
    return { level: "HIGH", label: "Tinggi", color: "#2f7a4f" };
  }
  if (layers.length >= 2 && agreement.agreementLevel === "STRONG") {
    return { level: "HIGH", label: "Tinggi", color: "#2f7a4f" };
  }
  if (layers.length >= 2 && agreement.agreementLevel === "MODERATE") {
    return { level: "MEDIUM", label: "Sedang", color: "#b4762b" };
  }
  if (layers.length >= 2 && agreement.agreementLevel === "WEAK") {
    return { level: "REVIEW", label: "Perlu Tinjauan", color: "#a5432b" };
  }
  if (layers.length === 1) {
    return { level: "LOW", label: "Rendah (1 layer)", color: "#b4762b" };
  }

  return { level: "UNKNOWN", label: "Tidak diketahui", color: "#888" };
}

/**
 * Hitung tingkat kesepakatan antar layer.
 */
function computeAgreement(layers) {
  if (layers.length < 2) {
    return { agreementLevel: "N/A", maxDiff: 0, description: "Minimal 2 layer diperlukan." };
  }

  const scores = layers.map(l => l.score);
  const maxDiff = Math.max(...scores) - Math.min(...scores);

  // Semua layer pada "zona" yang sama?
  const zones = scores.map(s => {
    if (s >= 75) return "GREEN";
    if (s >= 50) return "YELLOW";
    return "RED";
  });
  const allSameZone = zones.every(z => z === zones[0]);

  let agreementLevel, description;

  if (maxDiff <= 15 && allSameZone) {
    agreementLevel = "STRONG";
    description = "Semua layer memberikan penilaian yang sangat konsisten.";
  } else if (maxDiff <= 25 || allSameZone) {
    agreementLevel = "MODERATE";
    description = "Layer memberikan penilaian yang cukup konsisten.";
  } else {
    agreementLevel = "WEAK";
    description = "Layer memberikan penilaian yang bertentangan — diperlukan tinjauan manual.";
  }

  return { agreementLevel, maxDiff, allSameZone, description };
}

/* ========================= Score Interpretation ========================= */

function interpretBehavioralLevel(score) {
  if (score >= 75) return "Pola kerja konsisten dengan proses manual.";
  if (score >= 50) return "Pola kerja cukup wajar, ada lonjakan.";
  return "Pola kerja mencurigakan.";
}

function interpretLinguisticLevel(score) {
  if (score >= 75) return "Struktur teks konsisten dengan tulisan manusia.";
  if (score >= 50) return "Struktur teks campuran — ada ciri AI.";
  return "Struktur teks menunjukkan kemungkinan AI-generated.";
}

function interpretAPILevel(score) {
  if (score >= 75) return "Model ML mendeteksi tulisan manusia.";
  if (score >= 50) return "Model ML mendeteksi campuran.";
  return "Model ML mendeteksi kemungkinan AI.";
}

/**
 * Interpretasi Forensic Confidence Score gabungan.
 */
export function interpretForensicScore(score, confidenceLevel) {
  if (score < 0) {
    return {
      color: "#888",
      label: "Belum ada data forensik.",
      verdict: "UNKNOWN",
      icon: "❓"
    };
  }

  const clName = confidenceLevel?.level || "UNKNOWN";

  if (score >= 80) {
    return {
      color: "#1a6b37",
      label: `Bukti forensik ${clName === "VERY_HIGH" ? "sangat kuat" : "kuat"}: karya ini sangat konsisten dengan proses kreatif manusia.`,
      verdict: "HUMAN_VERIFIED",
      icon: "✅"
    };
  }
  if (score >= 65) {
    return {
      color: "#2f7a4f",
      label: "Bukti forensik mendukung: karya ini kemungkinan besar dibuat manusia.",
      verdict: "HUMAN_LIKELY",
      icon: "🟢"
    };
  }
  if (score >= 50) {
    return {
      color: "#b4762b",
      label: "Bukti forensik campuran: ada indikasi penggunaan alat bantu AI secara parsial.",
      verdict: "MIXED",
      icon: "🟡"
    };
  }
  if (score >= 30) {
    return {
      color: "#c45a2b",
      label: "Bukti forensik memperingatkan: banyak indikasi konten AI-generated.",
      verdict: "AI_LIKELY",
      icon: "🟠"
    };
  }
  return {
    color: "#a5432b",
    label: "Bukti forensik kuat: karya ini sangat konsisten dengan output AI-generated.",
    verdict: "AI_DETECTED",
    icon: "🔴"
  };
}

/**
 * Generate payload sertifikat forensik yang lebih lengkap dari v1.
 */
export function generateForensicCertificatePayload(forensicResult, behavioralMetrics) {
  return {
    dokumen: "Sertifikat Forensik — Creative Alibi v2.0",
    versi: "2.0.0",
    dibuat: forensicResult.timestamp,

    // Skor utama
    forensicConfidenceScore: forensicResult.score,
    tingkatKepercayaan: forensicResult.confidenceLevel?.label || "N/A",
    verdict: forensicResult.interpretation?.verdict || "UNKNOWN",
    verdictLabel: forensicResult.interpretation?.label || "",

    // Layer breakdown
    layerAktif: forensicResult.activeLayers,
    totalLayer: forensicResult.totalLayers,
    bobotLayer: forensicResult.weights,

    // Layer 1: Behavioral
    behavioral: forensicResult.layerDetails?.behavioral || null,

    // Layer 2: Linguistic
    linguistic: forensicResult.layerDetails?.linguistic
      ? {
          score: forensicResult.layerDetails.linguistic.score,
          confidence: forensicResult.layerDetails.linguistic.confidence,
          interpretation: forensicResult.layerDetails.linguistic.interpretation
        }
      : null,

    // Layer 3: API
    apiDetection: forensicResult.layerDetails?.api
      ? {
          score: forensicResult.layerDetails.api.score,
          provider: forensicResult.layerDetails.api.provider,
          interpretation: forensicResult.layerDetails.api.interpretation
        }
      : null,

    // Agreement
    agreement: forensicResult.agreement,

    // Behavioral metrics detail (dari v1)
    metrikPerilaku: behavioralMetrics || null,

    catatan: "Sertifikat ini dihasilkan oleh Creative Alibi v2.0 dengan sistem deteksi multi-layer. " +
      "Forensic Confidence Score menggabungkan analisis perilaku menulis, struktur linguistik teks, " +
      "dan (jika diaktifkan) hasil dari AI detector eksternal."
  };
}
