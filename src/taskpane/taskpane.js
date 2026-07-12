/* global Office, Word */
import { analyzeLinguistic, interpretLinguisticScore } from "./linguistic-engine.js";
import { initApiDetector, setApiConsent, detectWithApi, interpretApiScore, resetApiDetector, getApiStatus } from "./api-detector.js";
import { computeForensicScore, buildForensicCertificate } from "./forensic-engine.js";

/* ============================================================
   State & Configuration
   ============================================================ */

const POLL_MS = 1200;
const PAUSE_THRESHOLD_MS = 4000;
const BURST_CHAR_THRESHOLD = 40;

let session = {
  running: false,
  paused: false,
  startedAt: null,
  elapsedBeforePause: 0,
  lastLen: null,
  lastChangeAt: null,
  samples: 0,
  edits: [],
  pauses: [],
  bursts: 0,
  revisions: 0,
  pollHandle: null,
  timerHandle: null,
  
  // Results
  textAtStop: "",
  l1Score: null,
  l2Result: null,
  l3Result: null,
  forensicResult: null,
  certificate: null
};

let config = {
  l2Enabled: true,
  l3Enabled: false,
  l3Provider: "gptzero",
  l3Proxy: "https://creative-alibi-994794168239.asia-southeast2.run.app",
  l3Consent: false
};

/* ============================================================
   Initialization
   ============================================================ */

Office.onReady(() => {
  // Tabs
  document.querySelectorAll(".ca-tab").forEach(tab => {
    tab.addEventListener("click", () => switchTab(tab.dataset.target));
  });

  // Main Buttons
  document.getElementById("btn-start").onclick = startSession;
  document.getElementById("btn-pause").onclick = togglePause;
  document.getElementById("btn-stop").onclick = stopSession;
  document.getElementById("btn-reset").onclick = resetSession;
  
  // Certificate Buttons
  document.getElementById("btn-generate-cert").onclick = generateCertificate;
  document.getElementById("btn-download").onclick = downloadCertificate;
  document.getElementById("btn-insert").onclick = insertCertificate;

  // Settings
  document.getElementById("btn-settings").onclick = () => {
    document.getElementById("settings-overlay").classList.remove("hidden");
  };
  document.getElementById("btn-close-settings").onclick = () => {
    document.getElementById("settings-overlay").classList.add("hidden");
    applySettings();
  };

  // Settings Toggles
  document.getElementById("setting-l3").onchange = (e) => {
    const configBox = document.getElementById("l3-config");
    if (e.target.checked) configBox.classList.remove("hidden");
    else configBox.classList.add("hidden");
  };

  applySettings();
  drawActivityCanvas();
});

function applySettings() {
  config.l2Enabled = document.getElementById("setting-l2").checked;
  config.l3Enabled = document.getElementById("setting-l3").checked;
  config.l3Provider = document.getElementById("setting-l3-provider").value;
  config.l3Proxy = document.getElementById("setting-l3-proxy").value;
  config.l3Consent = document.getElementById("setting-l3-consent").checked;

  if (config.l3Enabled) {
    initApiDetector({ provider: config.l3Provider, proxyUrl: config.l3Proxy });
    setApiConsent(config.l3Consent);
  } else {
    resetApiDetector();
  }

  // Update UI indicators (badges removed from HTML)
}

function switchTab(targetId) {
  document.querySelectorAll(".ca-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".ca-tab-content").forEach(c => c.classList.remove("active"));
  
  document.querySelector(`.ca-tab[data-target="${targetId}"]`).classList.add("active");
  document.getElementById(targetId).classList.add("active");
}

/* ============================================================
   Recording Control (Layer 1 - Behavioral)
   ============================================================ */

async function startSession() {
  if (session.running) return;

  session.running = true;
  session.paused = false;
  session.startedAt = Date.now();
  session.elapsedBeforePause = 0;
  session.lastLen = null;
  session.lastChangeAt = Date.now();
  
  // Clear previous results but keep counts
  session.textAtStop = "";
  session.l1Score = null;
  session.l2Result = null;
  session.l3Result = null;
  session.forensicResult = null;
  
  updateStatusUI("recording", "Sedang Merekam");
  toggleButtons(true, false, false);
  
  session.pollHandle = setInterval(pollDocumentLength, POLL_MS);
  session.timerHandle = setInterval(updateTimer, 500);
}

function togglePause() {
  if (!session.running) return;
  
  if (!session.paused) {
    session.paused = true;
    clearInterval(session.pollHandle);
    session.elapsedBeforePause += Date.now() - session.startedAt;
    updateStatusUI("paused", "Dijeda");
    document.getElementById("btn-pause").textContent = "Lanjutkan";
  } else {
    session.paused = false;
    session.startedAt = Date.now();
    session.lastChangeAt = Date.now();
    session.pollHandle = setInterval(pollDocumentLength, POLL_MS);
    updateStatusUI("recording", "Sedang Merekam");
    document.getElementById("btn-pause").textContent = "Jeda";
  }
}

async function stopSession() {
  if (!session.running) return;
  
  session.running = false;
  if (!session.paused) {
    session.elapsedBeforePause += Date.now() - session.startedAt;
  }
  
  clearInterval(session.pollHandle);
  clearInterval(session.timerHandle);
  updateStatusUI("idle", "Rekaman Selesai");
  toggleButtons(false, true, true);
  document.getElementById("btn-start").textContent = "Lanjutkan Sesi";

  // Ambil konten sekali saja pada akhir sesi untuk Layer 2 & 3
  await fetchDocumentText();
  
  // Run Forensic Analysis
  await runForensicAnalysis();
  
  // Switch to forensic tab
  switchTab("tab-forensic");
}

function resetSession() {
  clearInterval(session.pollHandle);
  clearInterval(session.timerHandle);
  
  session = {
    running: false, paused: false, startedAt: null, elapsedBeforePause: 0,
    lastLen: null, lastChangeAt: null, samples: 0, edits: [], pauses: [],
    bursts: 0, revisions: 0, pollHandle: null, timerHandle: null,
    textAtStop: "", l1Score: null, l2Result: null, l3Result: null, forensicResult: null, certificate: null
  };
  
  updateStatusUI("idle", "Siap Merekam");
  document.getElementById("timer").textContent = "00:00:00";
  document.getElementById("btn-start").textContent = "Mulai Rekam";
  toggleButtons(false, true, true);
  
  ["m-samples", "m-edits", "m-pauses", "m-bursts"].forEach(id => (document.getElementById(id).textContent = "0"));
  drawActivityCanvas();
  
  resetDashboardUI();
  switchTab("tab-record");
}

/* ============================================================
   Word API Integrations
   ============================================================ */

async function pollDocumentLength() {
  try {
    await Word.run(async (context) => {
      const body = context.document.body;
      body.load("text");
      await context.sync();
      
      handleSample(body.text.length);
    });
  } catch (err) {
    console.error("Poll Error:", err);
  }
}

async function fetchDocumentText() {
  try {
    await Word.run(async (context) => {
      const body = context.document.body;
      body.load("text");
      await context.sync();
      session.textAtStop = body.text;
    });
  } catch (err) {
    console.error("Fetch Text Error:", err);
  }
}

function handleSample(len) {
  const now = Date.now();
  session.samples++;
  
  if (session.lastLen === null) {
    session.lastLen = len;
    session.lastChangeAt = now;
    updateMetricsUI();
    return;
  }
  
  const delta = len - session.lastLen;
  if (delta !== 0) {
    const gap = now - session.lastChangeAt;
    if (gap >= PAUSE_THRESHOLD_MS) session.pauses.push(gap);
    
    session.edits.push({ t: now, delta });
    if (Math.abs(delta) > BURST_CHAR_THRESHOLD) session.bursts++;
    if (delta < 0) session.revisions++;
    
    session.lastChangeAt = now;
    session.lastLen = len;
  }
  
  updateMetricsUI();
  drawActivityCanvas();
}

/* ============================================================
   Forensic Processing (All Layers)
   ============================================================ */

async function runForensicAnalysis() {
  document.getElementById("forensic-verdict").textContent = "Menganalisis...";
  document.getElementById("forensic-label").textContent = "Sedang menjalankan deteksi multi-layer...";
  
  // --- Layer 1: Behavioral ---
  const l1Metrics = computeBehavioralScore();
  session.l1Score = l1Metrics.score;
  updateLayerUI(1, session.l1Score, true);

  // --- Layer 2: Linguistic ---
  if (config.l2Enabled && session.textAtStop.length > 50) {
    session.l2Result = analyzeLinguistic(session.textAtStop);
    updateLayerUI(2, session.l2Result.score, session.l2Result.available, session.l2Result.message);
    populateLinguisticPanel(session.l2Result);
  } else {
    session.l2Result = null;
    updateLayerUI(2, null, false, !config.l2Enabled ? "Layer 2 dinonaktifkan." : "Teks terlalu pendek.");
  }

  // --- Layer 3: API ---
  const apiStatus = getApiStatus();
  if (config.l3Enabled && apiStatus.consented) {
    document.getElementById("l3-desc").textContent = `Menghubungi ${apiStatus.provider}...`;
    session.l3Result = await detectWithApi(session.textAtStop);
    
    if (session.l3Result.available) {
      updateLayerUI(3, session.l3Result.score, true, `Provider: ${apiStatus.provider}`);
    } else {
      updateLayerUI(3, null, false, session.l3Result.message);
    }
  } else {
    session.l3Result = null;
    updateLayerUI(3, null, false, "Tidak diaktifkan / Tanpa consent");
  }

  // --- Ensemble Scoring ---
  const forensicScore = computeForensicScore({
    behavioralScore: session.l1Score,
    linguisticResult: session.l2Result,
    apiResult: session.l3Result,
    behavioralBreakdown: l1Metrics,
    linguisticBreakdown: session.l2Result,
    apiBreakdown: session.l3Result
  });

  session.forensicResult = forensicScore;
  renderForensicDashboard(forensicScore);
  
  document.getElementById("btn-generate-cert").disabled = false;
}

function computeBehavioralScore() {
  const durationMs = session.elapsedBeforePause;
  const totalEdits = session.edits.length;
  const burstRatio = totalEdits > 0 ? session.bursts / totalEdits : 0;
  
  let score = 70;
  score -= Math.min(45, burstRatio * 100 * 0.6);
  if (session.revisions > 0) score += Math.min(10, session.revisions * 1.5);
  if (session.pauses.length > 0) score += 5;
  if (durationMs > 5 * 60 * 1000 && session.pauses.length === 0) score -= 15;
  
  if (totalEdits < 5) score = -1; // Not enough data
  else score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, durationMs, totalSamples: session.samples, totalEdits, bursts: session.bursts, burstRatio, revisions: session.revisions, pauses: session.pauses.length, pauseMeanMs: session.pauses.length ? session.pauses.reduce((a, b) => a + b, 0) / session.pauses.length : 0 };
}

/* ============================================================
   UI Updating
   ============================================================ */

function updateStatusUI(kind, text) {
  const dot = document.getElementById("status-dot");
  dot.className = `ca-dot ca-dot--${kind}`;
  document.getElementById("status-text").textContent = text;
}

function toggleButtons(startDisabled, pauseDisabled, stopDisabled) {
  document.getElementById("btn-start").disabled = startDisabled;
  document.getElementById("btn-pause").disabled = pauseDisabled;
  document.getElementById("btn-stop").disabled = stopDisabled;
}

function updateTimer() {
  const activeElapsed = session.paused ? 0 : Date.now() - session.startedAt;
  const totalMs = session.elapsedBeforePause + activeElapsed;
  const totalSec = Math.floor(totalMs / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${h}:${m}:${s}`;
}

function updateMetricsUI() {
  document.getElementById("m-samples").textContent = session.samples;
  document.getElementById("m-edits").textContent = session.edits.length;
  document.getElementById("m-pauses").textContent = session.pauses.length;
  document.getElementById("m-bursts").textContent = session.bursts;
}

function drawActivityCanvas() {
  const canvas = document.getElementById("activity-canvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  
  if (session.edits.length === 0) return;
  const recent = session.edits.slice(-100);
  const maxAbs = Math.max(...recent.map(e => Math.abs(e.delta)), 1);
  const barW = w / recent.length;

  recent.forEach((e, i) => {
    const barH = Math.min(h - 4, (Math.abs(e.delta) / maxAbs) * (h - 4));
    const isBurst = Math.abs(e.delta) > BURST_CHAR_THRESHOLD;
    ctx.fillStyle = isBurst ? "#ef4444" : (e.delta < 0 ? "#fbbf24" : "#6391ff");
    ctx.fillRect(i * barW, h - barH - 2, Math.max(1, barW - 1), barH);
  });
}

function updateLayerUI(layerNum, score, active, descOverride) {
  const item = document.getElementById(`layer${layerNum}-item`);
  const scoreEl = document.getElementById(`l${layerNum}-score`);
  const dot = document.getElementById(`l${layerNum}-dot`);
  const desc = document.getElementById(`l${layerNum}-desc`);
  
  if (!active || score === null || score < 0) {
    scoreEl.textContent = "OFF";
    item.classList.remove("active");
    dot.className = "ca-layer-dot ca-layer-dot--inactive";
  } else {
    scoreEl.textContent = score;
    item.classList.add("active");
    dot.className = "ca-layer-dot ca-layer-dot--active";
    if (score < 50) dot.className = "ca-layer-dot ca-layer-dot--error";
  }
  
  if (descOverride && desc) desc.textContent = descOverride;
}

function renderForensicDashboard(res) {
  const scoreEl = document.getElementById("forensic-score");
  const fillEl = document.getElementById("forensic-ring-fill");
  const verdictEl = document.getElementById("forensic-verdict");
  const labelEl = document.getElementById("forensic-label");
  const agreementBar = document.getElementById("agreement-bar");
  const tagEl = document.getElementById("confidence-tag");
  const agreementLabel = document.getElementById("agreement-label");
  
  if (res.score < 0) {
    scoreEl.textContent = "--";
    fillEl.style.strokeDashoffset = 326.7;
    verdictEl.textContent = "Tidak cukup data";
    verdictEl.className = "ca-verdict-badge color-muted";
    return;
  }
  
  scoreEl.textContent = res.score;
  const dashoffset = 326.7 - (326.7 * (res.score / 100));
  fillEl.style.strokeDashoffset = dashoffset;
  fillEl.style.stroke = res.interpretation.color;
  
  verdictEl.textContent = res.interpretation.label;
  verdictEl.style.color = res.interpretation.color;
  verdictEl.style.borderColor = res.interpretation.color;
  verdictEl.style.background = res.interpretation.bgColor;
  
  labelEl.textContent = res.interpretation.description;
  
  tagEl.textContent = res.agreement.agreement;
  agreementLabel.textContent = res.agreement.details;
  
  let agreeColor = "var(--text-muted)";
  let agreePct = "33%";
  if (res.agreement.agreement === "STRONG") { agreeColor = "var(--green)"; agreePct = "100%"; }
  else if (res.agreement.agreement === "GOOD") { agreeColor = "var(--green)"; agreePct = "80%"; }
  else if (res.agreement.agreement === "PARTIAL") { agreeColor = "var(--yellow)"; agreePct = "60%"; }
  else if (res.agreement.agreement === "CONFLICT") { agreeColor = "var(--red)"; agreePct = "50%"; }
  
  agreementBar.style.width = agreePct;
  agreementBar.style.background = agreeColor;
  tagEl.style.color = agreeColor;
  tagEl.style.borderColor = agreeColor;
}

function resetDashboardUI() {
  document.getElementById("forensic-score").textContent = "--";
  document.getElementById("forensic-ring-fill").style.strokeDashoffset = 326.7;
  document.getElementById("forensic-ring-fill").style.stroke = "var(--blue)";
  document.getElementById("forensic-verdict").textContent = "Menunggu Data";
  document.getElementById("forensic-verdict").style = "";
  document.getElementById("forensic-label").textContent = "Mulai sesi rekam untuk menghasilkan skor forensik.";
  document.getElementById("agreement-bar").style.width = "0%";
  document.getElementById("confidence-tag").textContent = "UNVERIFIED";
  document.getElementById("confidence-tag").style = "";
  document.getElementById("agreement-label").textContent = "Data tidak cukup";
  
  [1,2,3].forEach(i => updateLayerUI(i, null, false));
  document.getElementById("linguistic-card").classList.add("hidden");
  document.getElementById("certificate-preview").classList.add("hidden");
  
  document.getElementById("btn-generate-cert").disabled = true;
  document.getElementById("btn-download").disabled = true;
  document.getElementById("btn-insert").disabled = true;
}

function populateLinguisticPanel(l2Res) {
  if (!l2Res || !l2Res.available) return;
  const card = document.getElementById("linguistic-card");
  const box = document.getElementById("linguistic-breakdown");
  box.innerHTML = "";
  card.classList.remove("hidden");
  
  Object.values(l2Res.metrics).forEach(m => {
    if (m.score < 0) return;
    const colorClass = m.score >= 75 ? "bg-green" : m.score >= 50 ? "bg-yellow" : "bg-red";
    box.innerHTML += `
      <div class="ca-metric-row">
        <div class="ca-metric-row-label" title="${m.description}">${m.label}</div>
        <div class="ca-metric-bar"><div class="ca-metric-bar-fill ${colorClass}" style="width: ${m.score}%"></div></div>
        <div class="ca-metric-row-score">${m.score}</div>
      </div>
    `;
  });
}

/* ============================================================
   Certificate Management
   ============================================================ */

async function generateCertificate() {
  if (!session.forensicResult) return;
  
  const l1Metrics = computeBehavioralScore();
  const sessionMeta = {
    durationSec: Math.round(session.elapsedBeforePause / 1000),
    totalSamples: session.samples,
    totalEdits: session.edits.length,
    pauses: session.pauses.length,
    pauseMeanMs: l1Metrics.pauseMeanMs,
    bursts: session.bursts,
    burstRatio: l1Metrics.burstRatio,
    revisions: session.revisions
  };
  
  const cert = generateForensicCertificatePayload(session.forensicResult, sessionMeta);
  const hash = await sha256Hex(JSON.stringify(cert));
  cert.hashIntegritas = hash;
  session.certificate = cert;
  
  renderCertificatePreview(cert);
  document.getElementById("btn-download").disabled = false;
  document.getElementById("btn-insert").disabled = false;
}

function renderCertificatePreview(cert) {
  const box = document.getElementById("certificate-preview");
  box.classList.remove("hidden");
  box.innerHTML = `
    <dl>
      <dt>Waktu Dibuat</dt><dd>${new Date(cert.dibuat).toLocaleString("id-ID")}</dd>
      <dt>Durasi Aktif</dt><dd>${Math.floor(cert.sesi.durasiDetik/60)}m ${cert.sesi.durasiDetik%60}s</dd>
      <dt>Interval Pengetikan</dt><dd>${cert.sesi.intervalAktif} (${cert.sesi.jedaTerdeteksi} jeda alami)</dd>
      <dt>Skor Forensik</dt><dd>${cert.forensik.skorForensik}/100 — ${cert.forensik.interpretasi}</dd>
      <dt>Tingkat Kepercayaan</dt><dd>${cert.forensik.tingkatKepercayaan} (${cert.forensik.layerAktif} Layer Aktif)</dd>
      <dt>SHA-256 Hash</dt><dd>${cert.hashIntegritas}</dd>
    </dl>
  `;
}

async function sha256Hex(message) {
  const enc = new TextEncoder().encode(message);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function downloadCertificate() {
  if (!session.certificate) return;
  const blob = new Blob([JSON.stringify(session.certificate, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ca-forensic-cert-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function insertCertificate() {
  if (!session.certificate) return;
  const c = session.certificate;
  
  await Word.run(async (context) => {
    const body = context.document.body;
    body.insertParagraph("", Word.InsertLocation.end);
    const title = body.insertParagraph("SERTIFIKAT FORENSIK — CREATIVE ALIBI v2.0", Word.InsertLocation.end);
    title.font.bold = true;
    title.font.size = 11;
    
    const lines = [
      `Waktu Dibuat: ${new Date(c.dibuat).toLocaleString("id-ID")}`,
      `Durasi Aktif: ${Math.floor(c.sesi.durasiDetik/60)}m ${c.sesi.durasiDetik%60}s`,
      `Skor Forensik Keseluruhan: ${c.forensik.skorForensik}/100`,
      `Interpretasi: ${c.forensik.interpretasi}`,
      `Tingkat Kepercayaan: ${c.forensik.tingkatKepercayaan} (${c.forensik.layerAktif} Layer Aktif)`,
      `Layer 1 (Behavioral): ${c.forensik.layer1_behavioral.aktif ? c.forensik.layer1_behavioral.skor : 'OFF'}`,
      `Layer 2 (Linguistic): ${c.forensik.layer2_linguistic.aktif ? c.forensik.layer2_linguistic.skor : 'OFF'}`,
      `Layer 3 (External API): ${c.forensik.layer3_api.aktif ? c.forensik.layer3_api.skor + ' (' + c.forensik.layer3_api.provider + ')' : 'OFF'}`,
      `SHA-256 Hash Integritas: ${c.hashIntegritas}`,
      `Catatan: ${c.catatan}`
    ];
    
    lines.forEach(line => {
      const para = body.insertParagraph(line, Word.InsertLocation.end);
      para.font.size = 9;
      para.font.name = "Courier New";
    });
    
    await context.sync();
  });
}

// ================================================================
// SUPPORT CHAT TOGGLE
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  const chatBtn = document.getElementById('chat-btn');
  const chatModal = document.getElementById('chat-modal');
  const chatFrame = document.getElementById('chat-frame');
  let chatOpen = false;

  if (!chatBtn || !chatModal || !chatFrame) return;

  // Get proxy URL from settings or default
  const proxyInput = document.getElementById('setting-l3-proxy');
  const proxyUrl = proxyInput ? proxyInput.value : 'https://creative-alibi-994794168239.asia-southeast2.run.app';

  chatBtn.addEventListener('click', () => {
    chatOpen = !chatOpen;
    if (chatOpen) {
      chatFrame.src = proxyUrl + '/support.html';
      chatModal.classList.remove('hidden');
      chatBtn.textContent = '✖';
    } else {
      chatModal.classList.add('hidden');
      chatBtn.textContent = '💬';
    }
  });
});
