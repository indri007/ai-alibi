# Creative Alibi v2.0 — The "Proof of Human Effort" Protocol 🛡️

[![Streamlit App](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://ai-alibi-cccxvdhsdfskhhvbu8ushj.streamlit.app/)
[![IBM watsonx.ai](https://img.shields.io/badge/IBM%20watsonx.ai-Granite%20Model-blue.svg)](https://www.ibm.com/watsonx)
[![Word Add-in](https://img.shields.io/badge/Microsoft%20Word-Add--in%20v2.0-0078D4.svg)](https://www.microsoft.com/microsoft-365/word)

---

## 🔗 Quick Links & Live Demos

| Component | Link / URL | Description |
|---|---|---|
| 🎈 **Streamlit Web App (Live)** | [`https://ai-alibi-cccxvdhsdfskhhvbu8ushj.streamlit.app/`](https://ai-alibi-cccxvdhsdfskhhvbu8ushj.streamlit.app/) | Interactive web UI for instant text verification & certificate generation |
| ⚡ **Cloud Run Backend Proxy** | [`https://ai-alibi-backend-994794168239.asia-southeast2.run.app`](https://ai-alibi-backend-994794168239.asia-southeast2.run.app) | Secure proxy server powering API integrations |
| 📄 **Word Add-in Manifest** | [`https://ai-alibi-backend-994794168239.asia-southeast2.run.app/manifest.xml`](https://ai-alibi-backend-994794168239.asia-southeast2.run.app/manifest.xml) | Office 365 XML manifest for Microsoft Word |

---

# 🇬🇧 English

**Creative Alibi** is a digital notary system and Microsoft Word Add-in that mathematically proves text was authored by a human. It records typing behavioral metadata, evaluates offline linguistic signatures, and integrates with enterprise AI detectors to protect creators against false AI detector accusations.

Built for the **IBM AI Builders Challenge** — theme "Reimagine Creative Industries with AI".

### 🏛️ Multi-Layer Forensic Architecture
1. **Layer 1: Behavioral Engine (Offline / Local)** — Analyzes typing rhythm, editing bursts, deletion revisions, and natural thinking pauses.
2. **Layer 2: Offline Linguistic Engine (Local)** — Evaluates vocabulary richness (MATTR), sentence length variation (Burstiness), Hapax Legomena ratio, and AI connective word overuse.
3. **Layer 3: External API Ensemble Verification** — Integrates with **IBM watsonx.ai (Granite Model `ibm/granite-13b-chat-v2`)**, ZeroGPT (RapidAPI), and Desklib (DeBERTa-v3).
4. **Layer 4: Digital Authenticity Certificate** — SHA-256 hashed integrity proof with exportable JSON certificate.

---

# 🇮🇩 Bahasa Indonesia

**Creative Alibi** adalah sistem notaris digital dan Add-in Microsoft Word yang membuktikan secara matematis bahwa sebuah karya tulis dibuat murni oleh manusia. Sistem ini merekam ritme mengetik, menguji pola linguistik secara *offline*, dan mengonfirmasi hasil dengan model AI *enterprise* untuk melindungi penulis dari tuduhan palsu *AI detector*.

Dibuat khusus untuk **IBM AI Builders Challenge**.

### 🏛️ Arsitektur Deteksi Multi-Layer
1. **Layer 1: Mesin Perilaku (Behavioral - Offline)** — Merekam variasi kecepatan ketikan, jeda berpikir alami, lonjakan masukan teks (*burst*), serta statistik penghapusan/revisi.
2. **Layer 2: Mesin Linguistik (Linguistic - Offline)** — Mengukur keanekaragaman kata (*MATTR*), variasi panjang kalimat (*Burstiness*), kata unik (*Hapax Legomena*), serta pengulangan kata penghubung khas AI.
3. **Layer 3: Verifikasi Ensemble API Eksternal** — Terintegrasi langsung dengan **IBM watsonx.ai (Granite Model `ibm/granite-13b-chat-v2`)**, ZeroGPT (RapidAPI), dan Desklib (DeBERTa-v3-large).
4. **Layer 4: Sertifikat Keaslian Digital** — Menghasilkan sertifikat bukti forensik digital ber-hash SHA-256 yang dapat diunduh (JSON).

---

## 🟢 Status Integrasi Provider API Layer 3

| Provider API | Status | Model / Platform | Keterangan |
|---|---|---|---|
| **IBM watsonx.ai** | 🟢 **AKTIF & VERIFIED** | `ibm/granite-13b-chat-v2` (`us-south`) | Terhubung via IAM Token & Project `ai alibi` |
| **ZeroGPT** | 🟢 **AKTIF & VERIFIED** | RapidAPI Engine | Terhubung via RapidAPI Proxy Key |
| **Desklib** | 🟢 **AKTIF** | DeBERTa-v3-large (`:5000`) | Self-hosted local sidecar detector |

---

## 📖 Cara Penggunaan (3 Pilihan Akses)

### 1. 🎈 Opsi 1: Menggunakan Streamlit Web App (Tanpa Install Word)
1. Buka link web app: **[`https://ai-alibi-cccxvdhsdfskhhvbu8ushj.streamlit.app/`](https://ai-alibi-cccxvdhsdfskhhvbu8ushj.streamlit.app/)**
2. Tempel teks tulisan/artikel ilmiah Anda pada kolom input (minimal 50 kata).
3. Klik **🔍 Jalankan Analisis Multi-Layer**.
4. Lihat **Forensic Confidence Score** dan unduh **Sertifikat Keaslian (JSON)**.

---

### 2. 📝 Opsi 2: Menggunakan Microsoft Word Add-in
1. Buka Microsoft Word (Desktop / Web / Mac / iPad).
2. Pilih menu **Insert** ➔ **Get Add-ins** ➔ **Upload My Add-in**.
3. Masukkan file `manifest.xml` lokal atau link manifest:  
   `https://ai-alibi-backend-994794168239.asia-southeast2.run.app/manifest.xml`
4. Tab **Creative Alibi** akan muncul di bagian atas Microsoft Word.
5. Klik **Buka Panel Forensik** untuk mulai menulis dengan perlindungan rekam jejak.

---

### 3. 💻 Opsi 3: Menjalankan Secara Lokal (Developer Mode)

```bash
# 1. Clone repository
git clone https://github.com/indri007/ai-alibi.git
cd ai-alibi

# 2. Install dependency
npm install

# 3. Jalankan Backend Express Proxy Server (Port 3001)
npm run start-server

# 4. Jalankan Webpack Dev Server untuk Word Add-in (Port 3000)
npm run dev-server

# 5. Jalankan Streamlit App (Lokal)
streamlit run streamlit_app.py
```

---

## 🧪 Contoh Request API Proxy (CLI)

```bash
# Testing IBM watsonx.ai via Express Proxy
curl -X POST http://localhost:3001/api/detect \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "watsonx",
    "text": "Penelitian ini menganalisis bukti forensik ritme penulisan dan distribusi frekuensi kata alami manusia."
  }'
```

---

## 🛠️ Struktur Project

```
ai-alibi/
├── streamlit_app.py       # Streamlit Live Web App Dashboard
├── manifest.xml           # Microsoft Word Add-in Manifest (Valid Office 365)
├── package.json           # Scripts & Node Dependencies
├── server/
│   ├── index.js           # Express Proxy Server Entry Point
│   ├── routes/
│   │   └── detect.js      # Router untuk API /api/detect
│   ├── providers/
│   │   ├── watsonx.js     # IBM watsonx.ai Granite Model Provider
│   │   ├── zerogpt.js     # ZeroGPT RapidAPI Provider
│   │   └── desklib.js     # Desklib Local Model Provider
│   └── detector/          # Python FastAPI Local Detector Sidecar
└── src/
    └── taskpane/          # Frontend Microsoft Word Add-in UI & Engines
        ├── taskpane.html  # HTML View
        ├── taskpane.css   # Styling (Dark Mode & Glassmorphism)
        ├── taskpane.js    # Taskpane Controller
        ├── forensic-engine.js   # Multi-layer Scoring & Payload Generator
        ├── linguistic-engine.js # Offline Zipf & MATTR Linguistic Calculator
        └── api-detector.js      # Frontend API Handler
```

---

## 👥 Tim Creative Alibi

Dibangun oleh tim 5 orang lintas disiplin untuk **IBM AI Builders Challenge** 2026.