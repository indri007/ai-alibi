# Creative Alibi v2.0 — Forensic Proof System

Add-in Microsoft Word yang secara transparan merekam **metadata proses kerja** dan melakukan **analisis multi-layer forensik** untuk membantu freelance creator membuktikan bahwa karyanya dibuat secara manual oleh manusia, bukan hasil *generate* AI.

## Arsitektur Deteksi Multi-Layer

Sistem ini berevolusi dari versi MVP (heuristik ritme kerja tunggal) menjadi sistem **3 Lapis (Multi-Layer)**:

- **Layer 1: Behavioral Engine (Lokal/Offline)**
  Merekam ritme pengetikan secara realtime di background. Menganalisis metadata kuantitatif seperti: jumlah sampel, durasi pengetikan yang sebenarnya, frekuensi jeda (*pauses*), jumlah pengeditan/penghapusan, dan rasio "lonjakan mendadak" (*copy-paste burst*).
- **Layer 2: Linguistic Engine (Lokal/Offline)**
  Menganalisis hukum distribusi kata (Hukum Zipf), rasio *hapax legomena*, kekayaan kosakata (*Type-Token Ratio*), sentimen, dan kompleksitas leksikal. Semuanya diproses 100% secara aman di perangkat pengguna menggunakan ekspresi reguler.
- **Layer 3: External API / Third-Party Detection (Opsional)**
  *(Membutuhkan Persetujuan Eksplisit)* Terhubung melalui proxy backend ke detektor AI kelas industri (seperti GPTZero atau ZeroGPT) sebagai verifikator pamungkas (*hard check*). 

Ketiga skor ini akan dikumpulkan ke dalam **Forensic Engine** untuk menghasilkan satu nilai akhir tertimbang dan sebuah **Sertifikat Integritas Kriptografis**.

## Prinsip Privasi (Penting!)

Add-in ini menghormati privasi dan kekayaan intelektual (IP) klien/kreator:
1. **Layer 1 & Layer 2 berjalan sepenuhnya OFFLINE di komputer Anda**. Isi dokumen tidak pernah dikirim ke server luar secara default.
2. **Hanya Metadata**: Layer 1 hanya merekam perubahan *panjang/ukuran teks* (angka), selisih panjang (delta), dan jeda waktu (waktu). Kami membuang teks tersebut dari memori seketika.
3. Teks dari dokumen **hanya dikirimkan jika dan hanya jika** Anda menyalakan Layer 3 (API Eksternal) di menu pengaturan, memberikan persetujuan ("Saya setuju"), dan mengklik proses akhir. Jika Layer 3 dinonaktifkan, maka teks Anda tidak pernah meninggalkan komputer Anda.

## Struktur Project

```
creative-alibi-word-addin/
├── manifest.xml              # Definisi Office Add-in (ikon, izin, config UI)
├── package.json              # Dependensi front-end & back-end, scripts build
├── webpack.config.js         # Config bundling untuk Office Add-in (port 3000)
├── server/                   # (BARU) Express.js Proxy Backend Server (port 3001)
│   ├── index.js              # Routing proxy & healthcheck
│   ├── .env.example          # Template environment variable (API Keys)
│   └── providers/            # API adapter untuk GPTZero & ZeroGPT
├── assets/                   # Ikon add-in
└── src/taskpane/
    ├── taskpane.html         # UI Dashboard & Settings (Glassmorphism, Dark Mode)
    ├── taskpane.css          # Tema visual premium forensic
    ├── taskpane.js           # Main controller, orchestrator tab & UI
    ├── forensic-engine.js    # Logika ensemble scoring dari 3 layer
    ├── linguistic-engine.js  # Detektor Layer 2 (100% JS RegEx)
    └── api-detector.js       # Klien komunikasi ke backend Layer 3
```

## Cara Menjalankan (Development)

Prasyarat: **Node.js 16+** dan **Microsoft Word desktop** (Windows/Mac).

1. Install dependensi:
   ```bash
   npm install
   ```
2. Setup Backend Proxy (Hanya jika ingin menggunakan Layer 3):
   - Masuk ke folder `server`
   - Copy `server/.env.example` menjadi `server/.env`
   - Isi `GPTZERO_API_KEY` atau `ZEROGPT_API_KEY`
3. Jalankan Environment Lengkap (Taskpane + Backend Server):
   ```bash
   npm run dev:all
   ```

Script di atas akan menjalankan:
1. **Dev server HTTPS lokal** di `https://localhost:3000` untuk Office Add-in.
2. **Backend Proxy** di `http://localhost:3001`.
3. Membuka Word dan otomatis **sideload** add-in menggunakan `manifest.xml`.

## Cara Kerja Dashboard (User Flow)

1. Buka taskpane **Creative Alibi** via pita (ribbon) Word.
2. Buka icon ⚙️ (Pengaturan) di sudut kanan atas untuk mengaktifkan Layer 2 (Linguistik) atau Layer 3 (API Pihak Ketiga) sebelum mulai.
3. Di tab **Rekam**, klik **Mulai Rekam**. Kerjakan dokumen Anda seperti biasa. Anda akan melihat metadata Behavioral (Layer 1) berkedip dan mencatat sesi Anda secara live.
4. Klik **Berhenti** untuk mengakhiri sesi.
5. Secara otomatis berpindah ke tab **Forensik**. Sistem akan menghitung Forensic Score, Layer 1, Layer 2, dan Layer 3 secara paralel. Sebuah animasi Cincin Forensik (*Hero Ring*) akan menampilkan skor keyakinan akhir (*Confidence Level*).
6. Buka tab **Sertifikat** dan klik **Buat Sertifikat** untuk meng-generate paket JSON Kriptografis beserta ringkasan. Anda dapat menyisipkan (*Insert*) langsung catatan ringkasan forensik ini di bagian bawah karya Anda.

---
*Didesain dan dikembangkan sebagai bagian dari MVP ide "Proof of Human Effort" oleh Tim ALIBI.*
