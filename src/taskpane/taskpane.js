/* global Office, Word */

/* ============================================================
   Creative Alibi — Word Add-in
   Merekam METADATA proses kerja (panjang teks, waktu, jeda,
   jumlah perubahan). Isi tulisan (konten) TIDAK PERNAH disimpan.
   ============================================================ */

const POLL_MS = 1200;          // frekuensi polling panjang dokumen
const PAUSE_THRESHOLD_MS = 4000; // jeda >= ini dianggap "pause" nyata
const BURST_CHAR_THRESHOLD = 40; // perubahan panjang > ini dalam 1 interval = lonjakan mendadak

let state = {
  running: false,
  paused: false,
  startedAt: null,
  elapsedBeforePause: 0,
  lastLen: null,
  lastChangeAt: null,
  samples: 0,
  edits: [],      // { t, delta }  -- angka saja, tidak ada teks
  pauses: [],     // durasi ms tiap jeda
  bursts: 0,
  revisions: 0,   // delta negatif (penghapusan/pengeditan)
  pollHandle: null,
  timerHandle: null,
  lastCertificate: null
};

Office.onReady(() => {
  document.getElementById("btn-start").onclick = startRecording;
  document.getElementById("btn-pause").onclick = togglePause;
  document.getElementById("btn-stop").onclick = stopRecording;
  document.getElementById("btn-certificate").onclick = generateCertificate;
  document.getElementById("btn-download").onclick = downloadCertificate;
  document.getElementById("btn-insert").onclick = insertCertificateIntoDoc;
  document.getElementById("btn-reset").onclick = resetSession;
  drawActivity();
});

/* ---------------------------- Recording control ---------------------------- */

async function startRecording() {
  state.running = true;
  state.paused = false;
  state.startedAt = Date.now();
  state.elapsedBeforePause = 0;
  state.lastLen = null;
  state.lastChangeAt = Date.now();
  state.samples = 0;
  state.edits = [];
  state.pauses = [];
  state.bursts = 0;
  state.revisions = 0;

  setStatus("recording", "Merekam proses…");
  toggleButtons({ start: true, pause: false, stop: false, cert: true });

  state.pollHandle = setInterval(pollDocument, POLL_MS);
  state.timerHandle = setInterval(updateTimer, 250);
}

function togglePause() {
  if (!state.running) return;
  if (!state.paused) {
    state.paused = true;
    clearInterval(state.pollHandle);
    state.elapsedBeforePause += Date.now() - state.startedAt;
    setStatus("paused", "Dijeda");
    document.getElementById("btn-pause").textContent = "▶ Lanjutkan";
  } else {
    state.paused = false;
    state.startedAt = Date.now();
    state.lastChangeAt = Date.now();
    state.pollHandle = setInterval(pollDocument, POLL_MS);
    setStatus("recording", "Merekam proses…");
    document.getElementById("btn-pause").textContent = "⏸ Jeda";
  }
}

function stopRecording() {
  state.running = false;
  if (!state.paused) {
    state.elapsedBeforePause += Date.now() - state.startedAt;
  }
  clearInterval(state.pollHandle);
  clearInterval(state.timerHandle);
  setStatus("idle", "Rekaman selesai");
  toggleButtons({ start: false, pause: true, stop: true, cert: false, download: true, insert: true });
  document.getElementById("btn-start").textContent = "▶ Mulai Sesi Baru";
  computeAndRenderScore();
}

function resetSession() {
  clearInterval(state.pollHandle);
  clearInterval(state.timerHandle);
  state = {
    running: false, paused: false, startedAt: null, elapsedBeforePause: 0,
    lastLen: null, lastChangeAt: null, samples: 0, edits: [], pauses: [],
    bursts: 0, revisions: 0, pollHandle: null, timerHandle: null, lastCertificate: null
  };
  setStatus("idle", "Belum merekam");
  document.getElementById("timer").textContent = "00:00:00";
  document.getElementById("btn-start").disabled = false;
  document.getElementById("btn-start").textContent = "▶ Mulai Rekam";
  toggleButtons({ start: false, pause: true, stop: true, cert: true, download: true, insert: true });
  document.getElementById("certificate-preview").classList.add("hidden");
  ["m-samples", "m-edits", "m-pauses", "m-bursts"].forEach(id => (document.getElementById(id).textContent = "0"));
  document.getElementById("score-value").textContent = "--";
  document.getElementById("score-label").textContent = "Belum ada data cukup";
  document.getElementById("score-ring").style.borderColor = "";
  drawActivity();
}

/* ---------------------------- Metadata polling (NO content read) ---------------------------- */

async function pollDocument() {
  try {
    await Word.run(async (context) => {
      const body = context.document.body;
      const range = body.getRange();
      range.load("text");
      await context.sync();

      // Kita hanya ambil PANJANG teks (angka), lalu string aslinya
      // langsung dibuang dari memory — tidak pernah disimpan/direkam.
      const len = range.text.length;
      range.text = null; // buang referensi konten secepatnya

      handleLengthSample(len);
    });
  } catch (err) {
    console.error("Gagal membaca metadata dokumen:", err);
  }
}

function handleLengthSample(len) {
  const now = Date.now();
  state.samples += 1;

  if (state.lastLen === null) {
    state.lastLen = len;
    state.lastChangeAt = now;
    updateMetricsUI();
    return;
  }

  const delta = len - state.lastLen;

  if (delta !== 0) {
    const gap = now - state.lastChangeAt;
    if (gap >= PAUSE_THRESHOLD_MS) {
      state.pauses.push(gap);
    }
    state.edits.push({ t: now, delta });
    if (Math.abs(delta) > BURST_CHAR_THRESHOLD) state.bursts += 1;
    if (delta < 0) state.revisions += 1;

    state.lastChangeAt = now;
    state.lastLen = len;
  }

  updateMetricsUI();
  drawActivity();
}

/* ---------------------------- UI helpers ---------------------------- */

function setStatus(kind, text) {
  const dot = document.getElementById("status-dot");
  dot.className = "ca-dot ca-dot--" + kind;
  document.getElementById("status-text").textContent = text;
}

function toggleButtons({ start, pause, stop, cert, download, insert }) {
  document.getElementById("btn-start").disabled = start;
  document.getElementById("btn-pause").disabled = pause;
  document.getElementById("btn-stop").disabled = stop;
  if (cert !== undefined) document.getElementById("btn-certificate").disabled = cert;
  if (download !== undefined) document.getElementById("btn-download").disabled = download;
  if (insert !== undefined) document.getElementById("btn-insert").disabled = insert;
}

function updateTimer() {
  const activeElapsed = state.paused ? 0 : Date.now() - state.startedAt;
  const totalMs = state.elapsedBeforePause + activeElapsed;
  const totalSec = Math.floor(totalMs / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${h}:${m}:${s}`;
}

function updateMetricsUI() {
  document.getElementById("m-samples").textContent = state.samples;
  document.getElementById("m-edits").textContent = state.edits.length;
  document.getElementById("m-pauses").textContent = state.pauses.length;
  document.getElementById("m-bursts").textContent = state.bursts;
}

function drawActivity() {
  const canvas = document.getElementById("activity-canvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#fbf9f4";
  ctx.fillRect(0, 0, w, h);

  if (state.edits.length === 0) return;

  const recent = state.edits.slice(-60);
  const maxAbs = Math.max(...recent.map(e => Math.abs(e.delta)), 1);
  const barW = w / recent.length;

  recent.forEach((e, i) => {
    const barH = Math.min(h - 4, (Math.abs(e.delta) / maxAbs) * (h - 4));
    const isBurst = Math.abs(e.delta) > BURST_CHAR_THRESHOLD;
    ctx.fillStyle = isBurst ? "#a5432b" : (e.delta < 0 ? "#b4762b" : "#14213d");
    const x = i * barW;
    const y = h - barH - 2;
    ctx.fillRect(x, y, Math.max(1, barW - 1), barH);
  });
}

/* ---------------------------- Human Rhythm Score ---------------------------- */

function computeAndRenderScore() {
  const metrics = computeMetrics();
  renderScore(metrics);
  return metrics;
}

function computeMetrics() {
  const totalEdits = state.edits.length;
  const durationMs = state.elapsedBeforePause;
  const burstRatio = totalEdits > 0 ? state.bursts / totalEdits : 0;

  const positiveDeltas = state.edits.filter(e => e.delta > 0).map(e => e.delta);
  const mean = positiveDeltas.length ? avg(positiveDeltas) : 0;
  const std = positiveDeltas.length ? stdev(positiveDeltas, mean) : 0;
  const cv = mean > 0 ? std / mean : 0; // coefficient of variation kecepatan mengetik

  const pauseMean = state.pauses.length ? avg(state.pauses) : 0;
  const pauseStd = state.pauses.length ? stdev(state.pauses, pauseMean) : 0;
  const pauseCv = pauseMean > 0 ? pauseStd / pauseMean : 0;

  let score = 70;

  // Lonjakan mendadak (mirip paste/instant-generation) menurunkan skor
  score -= Math.min(45, burstRatio * 100 * 0.6);

  // Variasi kecepatan mengetik yang wajar (manusia jarang konstan sempurna) menaikkan skor
  if (positiveDeltas.length >= 4) {
    if (cv < 0.15) score -= 15; // terlalu seragam, mencurigakan
    else if (cv > 0.3) score += 10; // variasi alami
  }

  // Jeda berpikir yang wajar menaikkan skor; tidak ada jeda sama sekali pada sesi panjang mencurigakan
  if (durationMs > 5 * 60 * 1000 && state.pauses.length === 0) {
    score -= 15;
  } else if (state.pauses.length > 0) {
    score += Math.min(10, pauseCv * 10);
  }

  // Revisi/penghapusan menunjukkan proses berpikir ulang yang manusiawi
  if (state.revisions > 0) score += Math.min(10, state.revisions * 1.5);

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    durationMs,
    totalSamples: state.samples,
    totalEdits,
    pauses: state.pauses.length,
    pauseMeanMs: Math.round(pauseMean),
    bursts: state.bursts,
    burstRatio: Number(burstRatio.toFixed(3)),
    revisions: state.revisions,
    typingSpeedCv: Number(cv.toFixed(3)),
    score
  };
}

function renderScore(metrics) {
  const el = document.getElementById("score-value");
  const ring = document.getElementById("score-ring");
  const label = document.getElementById("score-label");

  el.textContent = metrics.score;

  let color = "#a5432b", desc = "Pola kerja tidak biasa — perlu tinjauan manual.";
  if (metrics.score >= 75) { color = "#2f7a4f"; desc = "Pola kerja konsisten dengan proses manual bertahap."; }
  else if (metrics.score >= 50) { color = "#b4762b"; desc = "Pola kerja cukup wajar, ada beberapa lonjakan mendadak."; }

  ring.style.borderColor = color;
  el.style.color = color;
  label.textContent = desc + " (indikatif, bukan bukti forensik mutlak)";
}

function avg(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function stdev(arr, mean) {
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/* ---------------------------- Sertifikat Proses ---------------------------- */

async function generateCertificate() {
  const metrics = computeAndRenderScore();
  const generatedAt = new Date();

  const payload = {
    dokumen: "Sertifikat Proses — Creative Alibi",
    dibuat: generatedAt.toISOString(),
    durasiDetik: Math.round(metrics.durationMs / 1000),
    totalSampel: metrics.totalSamples,
    intervalAktif: metrics.totalEdits,
    jedaTerdeteksi: metrics.pauses,
    rataRataJedaMs: metrics.pauseMeanMs,
    lonjakanMendadak: metrics.bursts,
    rasioLonjakan: metrics.burstRatio,
    revisi: metrics.revisions,
    variasiKecepatanMengetik: metrics.typingSpeedCv,
    humanRhythmScore: metrics.score,
    catatan: "Metadata numerik saja. Tidak memuat isi/kutipan konten dokumen."
  };

  const hash = await sha256Hex(JSON.stringify(payload));
  payload.hashIntegritas = hash;

  state.lastCertificate = payload;
  renderCertificatePreview(payload);
  toggleButtons({ start: true, pause: true, stop: true, cert: false, download: false, insert: false });
}

function renderCertificatePreview(payload) {
  const box = document.getElementById("certificate-preview");
  box.classList.remove("hidden");
  box.innerHTML = `
    <dl>
      <dt>Dibuat</dt><dd>${new Date(payload.dibuat).toLocaleString("id-ID")}</dd>
      <dt>Durasi sesi</dt><dd>${formatDuration(payload.durasiDetik)}</dd>
      <dt>Total sampel</dt><dd>${payload.totalSampel}</dd>
      <dt>Interval aktif</dt><dd>${payload.intervalAktif}</dd>
      <dt>Jeda terdeteksi</dt><dd>${payload.jedaTerdeteksi} (rata-rata ${(payload.rataRataJedaMs/1000).toFixed(1)}s)</dd>
      <dt>Lonjakan mendadak</dt><dd>${payload.lonjakanMendadak} (rasio ${payload.rasioLonjakan})</dd>
      <dt>Revisi/penghapusan</dt><dd>${payload.revisi}</dd>
      <dt>Human Rhythm Score</dt><dd>${payload.humanRhythmScore} / 100</dd>
      <dt>Hash integritas</dt><dd>${payload.hashIntegritas}</dd>
    </dl>
  `;
}

function formatDuration(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}j ${m}m ${s}d`;
}

async function sha256Hex(message) {
  const enc = new TextEncoder().encode(message);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function downloadCertificate() {
  if (!state.lastCertificate) return;
  const blob = new Blob([JSON.stringify(state.lastCertificate, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sertifikat-proses-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function insertCertificateIntoDoc() {
  if (!state.lastCertificate) return;
  const p = state.lastCertificate;

  await Word.run(async (context) => {
    const body = context.document.body;
    body.insertParagraph("", Word.InsertLocation.end);
    const title = body.insertParagraph("SERTIFIKAT PROSES — CREATIVE ALIBI", Word.InsertLocation.end);
    title.font.bold = true;
    title.font.size = 12;

    const lines = [
      `Dibuat: ${new Date(p.dibuat).toLocaleString("id-ID")}`,
      `Durasi sesi: ${formatDuration(p.durasiDetik)}`,
      `Total sampel metadata: ${p.totalSampel}`,
      `Interval aktif: ${p.intervalAktif}   |   Jeda terdeteksi: ${p.jedaTerdeteksi}`,
      `Lonjakan mendadak: ${p.lonjakanMendadak} (rasio ${p.rasioLonjakan})   |   Revisi: ${p.revisi}`,
      `Human Rhythm Score: ${p.humanRhythmScore} / 100`,
      `Hash integritas (SHA-256): ${p.hashIntegritas}`,
      `Catatan: metadata numerik saja, tidak memuat kutipan isi dokumen.`
    ];
    lines.forEach(line => {
      const para = body.insertParagraph(line, Word.InsertLocation.end);
      para.font.size = 9;
      para.font.name = "Courier New";
    });

    await context.sync();
  });
}
