# Creative Alibi v2.0 - The "Proof of Human Effort" Protocol

---

# 🇬🇧 English

**Creative Alibi** is a Microsoft Word Add-in that acts as a digital notary, recording the process of writing to mathematically prove that the text was created by a human. It provides defense against false accusations from faulty AI detectors.

### Architecture (Multi-Layer Forensics)
1. **Layer 1: Behavioral Engine (Offline)** - Analyzes keystroke rhythms, editing bursts, and pauses.
2. **Layer 2: Linguistic Engine (Offline)** - Analyzes lexical diversity using Zipf's Law and Hapax Legomena.
3. **Layer 3: External API Verification (Consent-based)** - Integrates with powerful AI models like **IBM watsonx.ai (Granite)**, GPTZero, or ZeroGPT through a local proxy server.

### Why IBM watsonx.ai?
For the IBM AI Builders Challenge, we leverage **IBM watsonx.ai** and its Granite foundation models. By analyzing linguistic patterns through Granite models, we get an enterprise-grade forensic classification to compliment our local offline layers.

### Quick Setup
See `HOW TO INSTALL.md` for detailed instructions.
```bash
npm install
npm run dev:all
```

---

# 🇮🇩 Bahasa Indonesia

**Creative Alibi** adalah Add-in Microsoft Word yang bertindak sebagai notaris digital, merekam proses mengetik untuk membuktikan secara matematis bahwa teks tersebut dibuat oleh manusia murni. Aplikasi ini memberikan perlindungan dari tuduhan palsu *AI detector*.

### Arsitektur (Multi-Layer Forensics)
1. **Layer 1: Mesin Perilaku (Offline)** - Menganalisis ritme ketikan, lonjakan (*burst*) penyalinan, dan jeda natural.
2. **Layer 2: Mesin Linguistik (Offline)** - Menganalisis kekayaan kosakata menggunakan Hukum Zipf dan *Hapax Legomena*.
3. **Layer 3: Verifikasi API Eksternal (Berbasis Persetujuan)** - Terintegrasi dengan model AI canggih seperti **IBM watsonx.ai (Granite)**, GPTZero, atau ZeroGPT melalui server lokal yang aman.

### Kenapa menggunakan IBM watsonx.ai?
Khusus untuk IBM AI Builders Challenge, kami memanfaatkan **IBM watsonx.ai** dengan model unggulannya, *Granite*. Analisis dari *foundation model* IBM memberikan tingkat klasifikasi forensik standar *enterprise* yang melengkapi algoritma *offline* lokal kami.

### Cara Menjalankan
Silakan baca panduan lengkap untuk pemula di file `HOW TO INSTALL.md`.
```bash
npm install
npm run dev:all
```

## 🚀 Cloud Run Deployment

| Service | URL |
|---------|-----|
| **creative-alibi** | https://creative-alibi-994794168239.asia-southeast2.run.app |
| **desklib-detector** | https://desklib-detector-994794168239.asia-southeast2.run.app |

### Usage
- **Word Add-in API**: `https://creative-alibi-994794168239.asia-southeast2.run.app`
- **Text Detection**: `POST /api/detect`
- **Support Chat**: `POST /api/support`
- **Health Check**: `GET /health`

---

## 📖 Tutorial Penggunaan

### 1. 🚀 Akses API Cloud Run
Creative Alibi sudah live di Cloud Run. Kamu bisa akses langsung:

**Base URL:** `https://creative-alibi-994794168239.asia-southeast2.run.app`

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/health` | GET | Cek status server & provider aktif |
| `/api/detect` | POST | Deteksi apakah teks buatan AI |
| `/api/support` | POST | Chat dengan support AI |

### 2. 🔬 Deteksi Teks AI
**Request:**
```bash
curl -X POST https://creative-alibi-994794168239.asia-southeast2.run.app/api/detect \
  -H "Content-Type: application/json" \
  -d '{"provider":"desklib","text":"Teks yang ingin diperiksa..."}'
```

**Provider tersedia:**
| Provider | Status | Keterangan |
|----------|--------|------------|
| `desklib` | ✅ Aktif | Model lokal DeBERTa-v3 (via Cloud Run) |
| `hix` | ✅ Terintegrasi | HIX AI Bypass premium |
| `gptzero` | ⬜ butuh API key | GPTZero |
| `zerogpt` | ⬜ butuh API key | ZeroGPT |
| `watsonx` | ⬜ butuh API key | IBM watsonx.ai Granite |

### 3. 💬 Support Chat
```bash
curl -X POST https://creative-alibi-994794168239.asia-southeast2.run.app/api/support \
  -H "Content-Type: application/json" \
  -d '{"message":"Halo, bagaimana cara kerja Creative Alibi?"}'
```

### 4. 📝 Integrasi Microsoft Word
1. Clone repo: `git clone https://github.com/indri007/ai-alibi.git`
2. Install: `npm install`
3. Buka Word → Insert → Add-in → Sideload `manifest.xml`
4. Add-in akan terhubung otomatis ke Cloud Run

### 5. 🛠️ Fitur Utama
- ✅ **Keystroke Forensics** — Rekam kebiasaan mengetik
- ✅ **Linguistic Analysis** — Analisis gaya bahasa (Zipf's Law)
- ✅ **Multi-Provider Detection** — Desklib, HIX, GPTZero, dll
- ✅ **Real-time Tracking** — Pantau proses menulis langsung
- ✅ **Digital Certificate** — Bukti otentik tulisan manusia
- ✅ **Support Chat AI** — Tanya jawab langsung

### 6. 🐳 Deploy Sendiri (Cloud Run)
```bash
# Build & deploy creative-alibi
gcloud builds submit --tag gcr.io/heaven-493814/creative-alibi:latest .
gcloud run deploy creative-alibi --image gcr.io/heaven-493814/creative-alibi:latest \
  --platform managed --region asia-southeast2 --allow-unauthenticated --port 3001

# Build & deploy desklib-detector
gcloud builds submit --config cloudbuild.yaml .
gcloud run deploy desklib-detector --image gcr.io/heaven-493814/desklib-detector:latest \
  --platform managed --region asia-southeast2 --allow-unauthenticated --port 5000 \
  --memory 8Gi --cpu 4
```
