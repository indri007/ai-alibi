/* ============================================================
   Creative Alibi — External AI Detection API (Layer 3)
   Integrasi dengan API pihak ketiga untuk deteksi AI.
   Memerlukan consent EKSPLISIT dari user sebelum mengirim teks.
   ============================================================ */

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
  },
  DESKLIB: {
    id: "desklib",
    name: "Desklib",
    description: "RAID #1 — DeBERTa-v3-large, akurasi tertinggi (Cloud Run lokal).",
    endpoint: "/api/detect",
    requiresKey: false,
    isLocal: true
  }
};

const resultCache = new Map();
const MAX_CACHE_SIZE = 20;

let userConsent = false;
let activeProvider = null;
let backendUrl = "https://ai-alibi-backend-994794168239.asia-southeast2.run.app";

// GANTI STRING DI BAWAH INI dengan API_KEY yang sama persis
// dengan yang di-set di Cloud Run env var backend (ai-alibi-backend)
const API_KEY = "8da2e30cc2a0a856dd5279ea0c23d1f80d7a4fec13909ca8da2f092c323b142e";

/* ========================= Configuration ========================= */

export function initApiDetector(config) {
  backendUrl = config.proxyUrl || backendUrl;
  const provider = Object.values(PROVIDERS).find(p => p.id === config.provider);
  if (provider) {
    activeProvider = provider;
  }
}

export function setApiConsent(consent) {
  userConsent = !!consent;
}

export function hasConsent() {
  return userConsent;
}

export function getApiStatus() {
  return {
    consented: userConsent,
    provider: activeProvider ? activeProvider.name : "None",
    url: backendUrl
  };
}

export function getProviders() {
  return Object.values(PROVIDERS);
}

/* ========================= Core Detection ========================= */

export async function detectWithApi(text) {
  if (!userConsent) {
    return createResult(
      false, -1, "USER_NO_CONSENT",
      "Anda belum memberikan persetujuan untuk mengirim teks ke API eksternal. " +
      "Aktifkan Layer 3 di Settings dan setujui consent dialog terlebih dahulu."
    );
  }

  if (!activeProvider) {
    return createResult(
      false, -1, "NO_PROVIDER",
      "Belum ada provider API yang dipilih. Pilih provider di Settings."
    );
  }

  if (!text || text.trim().length < 50) {
    return createResult(
      false, -1, "TEXT_TOO_SHORT",
      "Teks terlalu pendek untuk analisis API (minimum ~50 karakter)."
    );
  }

  const cacheKey = await hashText(text.trim());
  if (resultCache.has(cacheKey)) {
    const cached = resultCache.get(cacheKey);
    cached.fromCache = true;
    return cached;
  }

  try {
    const response = await fetch(`${backendUrl}/api/detect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
      },
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

    if (resultCache.size >= MAX_CACHE_SIZE) {
      const firstKey = resultCache.keys().next().value;
      resultCache.delete(firstKey);
    }
    resultCache.set(cacheKey, result);

    return result;
  } catch (err) {
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

function normalizeProviderResult(providerId, raw) {
  switch (providerId) {
    case "watsonx":
      return normalizeWatsonx(raw);
    case "gptzero":
      return normalizeGPTZero(raw);
    case "zerogpt":
      return normalizeZeroGPT(raw);
    case "desklib":
      return normalizeDesklib(raw);
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

function normalizeDesklib(raw) {
  const prob = raw.probability ?? -1;
  const humanScore = prob >= 0 ? Math.round((1 - prob) * 100) : -1;

  return createResult(true, humanScore, "OK", "Analisis Desklib berhasil.", {
    provider: "Desklib (RAID #1)",
    aiProbability: prob,
    humanProbability: prob >= 0 ? 1 - prob : -1,
    label: raw.label,
    isAiGenerated: raw.isAiGenerated,
    processingTimeMs: raw.processingTimeMs,
    source: raw.source,
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
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function interpretApiScore(score) {
  if (score < 0) return { color: "#888", label: "API belum dijalankan", level: "UNKNOWN" };
  if (score >= 75) return { color: "#2f7a4f", label: "API mendeteksi: kemungkinan besar tulisan manusia.", level: "HUMAN_LIKELY" };
  if (score >= 50) return { color: "#b4762b", label: "API mendeteksi: campuran konten manusia & AI.", level: "MIXED" };
  return { color: "#a5432b", label: "API mendeteksi: kemungkinan besar teks AI-generated.", level: "AI_LIKELY" };
}

export function resetApiDetector() {
  userConsent = false;
  activeProvider = null;
  resultCache.clear();
}
