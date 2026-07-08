/* ============================================================
   Creative Alibi — External AI Detection API (Layer 3)
   Integrasi dengan API pihak ketiga untuk deteksi AI.
   Memerlukan consent EKSPLISIT dari user sebelum mengirim teks.
   ============================================================ */

/**
 * Daftar provider yang didukung.
 * Setiap provider punya adapter sendiri.
 */
const PROVIDERS = {
  WATSONX: {
    id: "watsonx",
    name: "IBM watsonx.ai",
    description: "Powered by IBM Granite foundational models for forensic analysis.",
    endpoint: "/api/detect/watsonx",
    requiresKey: true
  },
  GPTZERO: {
    id: "gptzero",
    name: "GPTZero",
    description: "Deteksi AI terlatih untuk konteks akademik & profesional.",
    endpoint: "/api/detect/gptzero",
    requiresKey: true
  },
  ZEROGPT: {
    id: "zerogpt",
    name: "ZeroGPT",
    description: "Deteksi AI developer-friendly dengan statistik per-kalimat.",
    endpoint: "/api/detect/zerogpt",
    requiresKey: true
  }
};

/**
 * Cache hasil deteksi agar tidak mengirim teks yang sama dua kali.
 * Key = SHA-256 hash teks, Value = hasil API.
 */
const resultCache = new Map();
const MAX_CACHE_SIZE = 20;

/**
 * Status consent user — default false, harus diaktifkan eksplisit.
 */
let userConsent = false;
let activeProvider = null;
let backendUrl = "https://localhost:3001"; // proxy backend

/* ========================= Configuration ========================= */

/**
 * Inisialisasi API detector dengan provider dan proxy URL.
 */
export function initApiDetector(config) {
  backendUrl = config.proxyUrl || "http://localhost:3001";
  const provider = Object.values(PROVIDERS).find(p => p.id === config.provider);
  if (provider) {
    activeProvider = provider;
  }
}

/**
 * Set consent status. User HARUS menyetujui sebelum teks dikirim.
 */
export function setApiConsent(consent) {
  userConsent = !!consent;
}

/**
 * Cek apakah user sudah memberikan consent.
 */
export function hasConsent() {
  return userConsent;
}

/**
 * Ambil status API.
 */
export function getApiStatus() {
  return {
    consented: userConsent,
    provider: activeProvider ? activeProvider.name : "None",
    url: backendUrl
  };
}

/**
 * Ambil daftar semua provider yang tersedia.
 */
export function getProviders() {
  return Object.values(PROVIDERS);
}

/* ========================= Core Detection ========================= */

/**
 * Kirim teks ke API deteksi AI via backend proxy.
 * PENTING: Fungsi ini TIDAK akan berjalan tanpa consent eksplisit.
 *
 * @param {string} text — teks dokumen untuk dianalisis
 * @returns {object} — hasil deteksi dari API
 */
export async function detectWithApi(text) {
  // Guard: consent wajib
  if (!userConsent) {
    return createResult(
      false, -1, "USER_NO_CONSENT",
      "Anda belum memberikan persetujuan untuk mengirim teks ke API eksternal. " +
      "Aktifkan Layer 3 di Settings dan setujui consent dialog terlebih dahulu."
    );
  }

  // Guard: provider harus dipilih
  if (!activeProvider) {
    return createResult(
      false, -1, "NO_PROVIDER",
      "Belum ada provider API yang dipilih. Pilih provider di Settings."
    );
  }

  // Guard: teks tidak boleh kosong
  if (!text || text.trim().length < 50) {
    return createResult(
      false, -1, "TEXT_TOO_SHORT",
      "Teks terlalu pendek untuk analisis API (minimum ~50 karakter)."
    );
  }

  // Cek cache
  const cacheKey = await hashText(text.trim());
  if (resultCache.has(cacheKey)) {
    const cached = resultCache.get(cacheKey);
    cached.fromCache = true;
    return cached;
  }

  // Kirim ke backend proxy
  try {
    const response = await fetch(`${backendUrl}/api/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), provider: activeProvider.id })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return createResult(
        false, -1, "API_ERROR",
        `API error (${response.status}): ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();
    const result = normalizeProviderResult(activeProvider.id, data);

    // Simpan ke cache
    if (resultCache.size >= MAX_CACHE_SIZE) {
      const firstKey = resultCache.keys().next().value;
      resultCache.delete(firstKey);
    }
    resultCache.set(cacheKey, result);

    return result;
  } catch (err) {
    // Network error / backend tidak jalan
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      return createResult(
        false, -1, "NETWORK_ERROR",
        "Tidak dapat terhubung ke backend proxy server. " +
        "Pastikan server berjalan di " + backendUrl
      );
    }
    return createResult(
      false, -1, "UNKNOWN_ERROR",
      `Gagal menghubungi API: ${err.message}`
    );
  }
}

/**
 * Cek apakah backend proxy server bisa dijangkau.
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${backendUrl}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const data = await response.json();
      return { online: true, providers: data.providers || [] };
    }
    return { online: false, error: `Server responded with ${response.status}` };
  } catch {
    return { online: false, error: "Server tidak dapat dijangkau." };
  }
}

/* ========================= Provider Normalizers ========================= */

/**
 * Normalisasi hasil dari berbagai provider ke format standar.
 */
function normalizeProviderResult(providerId, raw) {
  switch (providerId) {
    case "watsonx":
      return normalizeWatsonx(raw);
    case "gptzero":
      return normalizeGPTZero(raw);
    case "zerogpt":
      return normalizeZeroGPT(raw);
    default:
      return createResult(false, -1, "UNKNOWN_PROVIDER", "Provider tidak dikenal.");
  }
}

function normalizeWatsonx(raw) {
  const humanScore = typeof raw.human_score === 'number' ? raw.human_score : -1;
  return createResult(true, humanScore, "OK", "Analisis IBM watsonx.ai berhasil.", {
    provider: "IBM watsonx.ai",
    aiProbability: humanScore >= 0 ? (100 - humanScore) / 100 : -1,
    humanProbability: humanScore >= 0 ? humanScore / 100 : -1,
    feedback: raw.feedback || "Tidak ada detail alasan.",
    raw
  });
}

function normalizeGPTZero(raw) {
  // GPTZero returns: completely_generated_prob, overall_burstiness, etc.
  const prob = raw.completely_generated_prob ?? raw.ai_prob ?? -1;
  const humanScore = prob >= 0 ? Math.round((1 - prob) * 100) : -1;

  return createResult(true, humanScore, "OK", "Analisis GPTZero berhasil.", {
    provider: "GPTZero",
    aiProbability: prob,
    humanProbability: prob >= 0 ? 1 - prob : -1,
    burstiness: raw.overall_burstiness ?? null,
    perplexity: raw.average_generated_prob ?? null,
    sentences: raw.sentences || [],
    raw
  });
}

function normalizeZeroGPT(raw) {
  // ZeroGPT returns: is_human_written, ai_percentage, etc.
  const aiPct = raw.ai_percentage ?? raw.fakePercentage ?? -1;
  const humanScore = aiPct >= 0 ? Math.round(100 - aiPct) : -1;

  return createResult(true, humanScore, "OK", "Analisis ZeroGPT berhasil.", {
    provider: "ZeroGPT",
    aiProbability: aiPct >= 0 ? aiPct / 100 : -1,
    humanProbability: aiPct >= 0 ? (100 - aiPct) / 100 : -1,
    aiWordCount: raw.aiWordCount ?? null,
    sentences: raw.sentences || [],
    raw
  });
}

/* ========================= Utilities ========================= */

function createResult(available, score, status, message, details = null) {
  return {
    available,
    score,
    status,
    message,
    details,
    fromCache: false,
    timestamp: new Date().toISOString()
  };
}

async function hashText(text) {
  const enc = new TextEncoder().encode(text.substring(0, 500)); // hash cukup 500 char pertama
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Interpretasi skor API untuk tampilan UI.
 */
export function interpretApiScore(score) {
  if (score < 0) return { color: "#888", label: "API belum dijalankan", level: "UNKNOWN" };
  if (score >= 75) return { color: "#2f7a4f", label: "API mendeteksi: kemungkinan besar tulisan manusia.", level: "HUMAN_LIKELY" };
  if (score >= 50) return { color: "#b4762b", label: "API mendeteksi: campuran konten manusia & AI.", level: "MIXED" };
  return { color: "#a5432b", label: "API mendeteksi: kemungkinan besar teks AI-generated.", level: "AI_LIKELY" };
}

/**
 * Reset semua state API detector (consent, cache, provider).
 */
export function resetApiDetector() {
  userConsent = false;
  activeProvider = null;
  resultCache.clear();
}
