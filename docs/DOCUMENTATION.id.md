# Dokumentasi Teknis — Creative Alibi Word Add-in

> Versi dokumen: 1.0.0 · Bahasa: Indonesia (lihat `DOCUMENTATION.en.md` untuk versi Inggris)

Dokumen ini adalah rujukan lengkap untuk memahami **apa yang dibangun, kenapa dibangun seperti itu, bagaimana cara kerjanya secara detail, dan dari mana asal setiap angka yang ditampilkan ke pengguna**. Dokumen ini terpisah dari `README.md` (yang fokus ke instalasi & pemakaian cepat) — di sini kita masuk ke detail arsitektur, skema data, dan metodologi penilaian.

---

## Daftar Isi

1. [Latar Belakang & Pemetaan Design Thinking](#1-latar-belakang--pemetaan-design-thinking)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Struktur File & Tanggung Jawab Tiap File](#3-struktur-file--tanggung-jawab-tiap-file)
4. [Alur Kerja Pengguna (User Flow)](#4-alur-kerja-pengguna-user-flow)
5. [Alur Data Teknis (Data Flow)](#5-alur-data-teknis-data-flow)
6. [Skema Data / Metadata](#6-skema-data--metadata)
7. [Metodologi Human Rhythm Score — Referensi Penilaian Lengkap](#7-metodologi-human-rhythm-score--referensi-penilaian-lengkap)
8. [Sertifikat Proses & Integritas Hash](#8-sertifikat-proses--integritas-hash)
9. [Referensi Fungsi (`taskpane.js`)](#9-referensi-fungsi-taskpanejs)
10. [Referensi Manifest (`manifest.xml`)](#10-referensi-manifest-manifestxml)
11. [Privasi & Keamanan](#11-privasi--keamanan)
12. [Keterbatasan & Risiko yang Diketahui](#12-keterbatasan--risiko-yang-diketahui)
13. [Instalasi, Build, dan Deployment](#13-instalasi-build-dan-deployment)
14. [Roadmap Pengembangan](#14-roadmap-pengembangan)
15. [Glosarium](#15-glosarium)

---

## 1. Latar Belakang & Pemetaan Design Thinking

Produk ini adalah hasil turunan langsung dari worksheet *Design Thinking Quick Sheet* Tim ALIBI (file `Brainstorming_2_-_Creative_Alibi.xlsx`). Berikut pemetaan tiap tahap ke keputusan produk:

| Tahap | Isi Worksheet | Keputusan Produk |
|---|---|---|
| **Empathize** | Freelance creator dituduh "pakai AI" secara salah oleh klien/platform, kehilangan penghasilan & reputasi tanpa bukti pembelaan. | Fitur inti harus menghasilkan **bukti** yang bisa dikirim ke pihak ketiga, bukan sekadar catatan internal. |
| **Persona** | "Made", ilustrator vector 29 tahun, sering dicurigai AI karena gayanya rapi. | UI & bahasa produk ditulis untuk pengguna non-teknis yang sedang di bawah tekanan (butuh cepat & meyakinkan, bukan rumit). |
| **Define** | *"Bagaimana kita bisa membantu freelance creator membuktikan secara objektif bahwa proses kerja mereka manual... tanpa membongkar seluruh detail karya ke publik?"* | Ini alasan **konten tidak pernah direkam** — hanya metadata numerik. Membuktikan proses tanpa membongkar karya. |
| **Ideate** | 4 ide: Process Recorder, Human Rhythm Score, Timestamp Ledger, Instant Dispute Kit. Tim memilih gabungan Ide 1+2+4 untuk MVP; Ide 3 (ledger blockchain) jadi tahap lanjutan. | MVP ini mengimplementasikan Ide 1, 2, dan 4 secara penuh. Ide 3 didokumentasikan di [Roadmap](#14-roadmap-pengembangan) sebagai *belum diimplementasikan*. |
| **Prototype & Test** | Alur: install plugin → rekam timeline proses → hitung skor → generate sertifikat + video replay → kirim ke klien. Dua pertanyaan validasi: (1) apakah sertifikat meyakinkan klien, (2) apakah rekaman tidak mengganggu alur kerja. | Alur ini diimplementasikan persis (lihat [Bab 4](#4-alur-kerja-pengguna-user-flow)), minus video replay (lihat Roadmap). Beban rekam dijaga ringan: polling angka setiap 1.2 detik, bukan menyalin/menyimpan teks. |

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────┐
│        Microsoft Word       │
│  (Desktop / Online / Mac)   │
│                              │
│  ┌────────────────────────┐ │
│  │   Task Pane (iframe)   │ │   <-- dirender oleh Word, isinya taskpane.html
│  │                        │ │
│  │  taskpane.js  ─────────┼─┼──> Office.js API (Word.run, context.sync)
│  │  taskpane.css          │ │
│  └────────────────────────┘ │
└──────────────┬───────────────┘
               │ HTTPS (localhost:3000 saat dev,
               │        domain hosting saat produksi)
               ▼
     ┌───────────────────┐
     │  Dev/Static Server │   <-- webpack-dev-server (dev) atau hosting statis (prod)
     │  dist/taskpane.html│
     │  dist/taskpane.js  │
     │  dist/assets/*     │
     └───────────────────┘
```

**Kenapa arsitektur ini?**
- Word Add-in **tidak berjalan sebagai proses native terpisah** — ia adalah halaman web (HTML/CSS/JS) yang dirender di dalam task pane oleh Word, dan berkomunikasi dengan dokumen lewat **Office.js API**. Ini satu-satunya cara resmi untuk membuat "plugin" Word yang jalan lintas Windows/Mac/Web tanpa install file `.exe`/`.dll` berbeda-beda.
- Semua logika (polling, hitung skor, generate sertifikat) berjalan **100% di sisi client (browser engine di dalam Word)** — tidak ada backend server yang menyimpan data pengguna. Ini keputusan sengaja untuk privasi: tidak ada tempat data bisa bocor selain di komputer pengguna sendiri.
- **Webpack** dipakai untuk bundling karena itu adalah tooling standar yang direkomendasikan Microsoft untuk Office Add-in modern (bukan pilihan sembarang) — mendukung dev server HTTPS otomatis via `office-addin-dev-certs`, yang wajib karena Word mensyaratkan task pane dilayani lewat HTTPS.

---

## 3. Struktur File & Tanggung Jawab Tiap File

```
creative-alibi-word-addin/
├── manifest.xml              # "KTP" add-in: nama, ikon, izin, lokasi taskpane, tombol ribbon
├── package.json              # dependency & script (start, build, dev-server, validate)
├── webpack.config.js         # konfigurasi bundling + dev server HTTPS lokal
├── README.md                 # panduan instalasi & pemakaian cepat
├── docs/
│   ├── DOCUMENTATION.id.md   # dokumen ini
│   └── DOCUMENTATION.en.md   # versi Inggris
├── assets/
│   ├── icon-16.png           # ikon kecil (menu/toolbar)
│   ├── icon-32.png           # ikon standar (header taskpane, manifest)
│   ├── icon-64.png           # ikon medium (beberapa konteks Office)
│   └── icon-80.png           # ikon besar (ribbon button, high-res)
└── src/
    ├── commands/              # folder disiapkan untuk command ribbon tambahan (belum dipakai di v1)
    └── taskpane/
        ├── taskpane.html      # markup UI: status, timer, metrik, skor, sertifikat
        ├── taskpane.css       # tema visual "sertifikat/notaris" (lihat Bab desain di README)
        └── taskpane.js        # SELURUH logika: polling, skor, sertifikat, hash, insert ke dokumen
```

**Kenapa dipisah begini?**
- `manifest.xml` terpisah dari kode karena ia dibaca **oleh Word**, bukan oleh browser — formatnya XML khusus Office, bukan bagian dari bundel JS.
- `src/taskpane/` dipisah dari root karena mengikuti konvensi resmi Yeoman generator Office Add-in — memudahkan siapa pun yang familiar dengan Office Add-in langsung mengenali struktur project.
- `docs/` dipisah dari `README.md` sesuai permintaan: `README.md` untuk onboarding cepat ("bagaimana cara pakai"), `docs/` untuk pemahaman mendalam ("bagaimana cara kerja & kenapa").

---

## 4. Alur Kerja Pengguna (User Flow)

```
[1] Buka Word, klik ribbon "Rekam Proses"
        │
        ▼
[2] Panel Creative Alibi terbuka di kanan
        │
        ▼
[3] Klik "▶ Mulai Rekam"  ──────────────► status: idle → recording
        │                                  timer mulai berjalan
        │                                  polling dimulai (tiap 1.2 detik)
        ▼
[4] User menulis/mengedit dokumen seperti biasa
        │   (setiap 1.2 detik, sistem cek: panjang teks berubah atau tidak?)
        │
        ├── Jika TIDAK berubah lama (≥ 4 detik) → dicatat sebagai "jeda berpikir"
        ├── Jika berubah kecil & bertahap        → dicatat sebagai "edit wajar"
        ├── Jika berubah BESAR sekaligus (>40 char) → dicatat sebagai "lonjakan mendadak"
        └── Jika panjang teks BERKURANG           → dicatat sebagai "revisi/penghapusan"
        │
        ▼   (opsional, bisa berkali-kali)
[4b] Klik "⏸ Jeda" untuk pause perekaman tanpa reset (mis. saat rehat panjang)
        │
        ▼
[5] Klik "■ Berhenti" saat selesai bekerja
        │   → sistem menghitung Human Rhythm Score dari seluruh data sesi
        ▼
[6] Klik "📄 Buat Sertifikat"
        │   → payload metadata dirangkai + dihitung hash SHA-256
        ▼
[7a] Klik "⬇ Unduh JSON"           [7b] Klik "📝 Sisipkan ke Dokumen"
     → file sertifikat-proses-*.json     → ringkasan sertifikat ditambahkan
       terunduh, siap dilampirkan          sebagai paragraf di akhir dokumen Word
       ke email/tiket dispute klien
        │
        ▼
[8] User mengirim sertifikat (JSON dan/atau dokumen Word) ke klien/platform
    sebagai bukti pendukung sanggahan tuduhan "AI-generated"
```

Tombol **"Hapus sesi & mulai ulang"** tersedia kapan saja untuk mengosongkan seluruh state (samples, edits, pauses, skor, sertifikat) dan mulai sesi baru dari nol.

---

## 5. Alur Data Teknis (Data Flow)

Ini adalah alur data di level kode, dari event Word sampai ke angka yang tampil di layar.

```
setInterval (tiap 1200ms)
        │
        ▼
pollDocument()
        │  Word.run(context => {
        │    range = body.getRange()
        │    range.load("text")
        │    await context.sync()      ← satu-satunya titik di mana isi teks "disentuh"
        │    len = range.text.length   ← HANYA ANGKA panjang yang diambil
        │    range.text = null         ← string dibuang dari memory SEGERA
        │  })
        ▼
handleLengthSample(len)
        │  delta = len - lastLen
        │  if delta != 0:
        │     - hitung gap waktu sejak perubahan terakhir → push ke `pauses[]` jika ≥ 4000ms
        │     - push { t, delta } ke `edits[]`
        │     - jika |delta| > 40 → bursts++
        │     - jika delta < 0 → revisions++
        ▼
updateMetricsUI() + drawActivity()
        │  (render angka & grafik batang aktivitas ke DOM, tiap kali ada sample baru)
        ▼
[saat user klik "Berhenti"]
        ▼
computeMetrics()
        │  hitung: burstRatio, coefficient of variation kecepatan mengetik,
        │          coefficient of variation jeda, dsb.
        │  → hasilkan `score` 0–100  (lihat Bab 7 untuk formula lengkap)
        ▼
generateCertificate()
        │  susun payload metadata (lihat Bab 6)
        │  hash = SHA-256(JSON.stringify(payload))
        ▼
downloadCertificate() / insertCertificateIntoDoc()
```

**Poin penting:** variabel `edits`, `pauses`, `samples`, `bursts`, `revisions` **hanya berisi angka dan timestamp** — tidak ada satu pun string isi dokumen yang tersimpan di variabel `state` sepanjang siklus hidup add-in ini.

---

## 6. Skema Data / Metadata

### 6.1 Struktur `state` (in-memory, tidak persisten, hilang saat direset/ditutup)

```ts
state = {
  running: boolean,
  paused: boolean,
  startedAt: number | null,        // epoch ms
  elapsedBeforePause: number,      // ms akumulasi durasi aktif
  lastLen: number | null,          // panjang teks terakhir (angka)
  lastChangeAt: number | null,     // epoch ms perubahan terakhir
  samples: number,                 // total titik pengukuran
  edits: Array<{ t: number, delta: number }>,  // hanya angka
  pauses: Array<number>,           // durasi tiap jeda dalam ms
  bursts: number,                  // jumlah lonjakan mendadak
  revisions: number,                // jumlah delta negatif
  lastCertificate: object | null
}
```

### 6.2 Skema Payload Sertifikat (`payload` di `generateCertificate()`)

```json
{
  "dokumen": "Sertifikat Proses — Creative Alibi",
  "dibuat": "2026-07-07T05:12:33.000Z",
  "durasiDetik": 1830,
  "totalSampel": 1525,
  "intervalAktif": 240,
  "jedaTerdeteksi": 12,
  "rataRataJedaMs": 8340,
  "lonjakanMendadak": 3,
  "rasioLonjakan": 0.0125,
  "revisi": 18,
  "variasiKecepatanMengetik": 0.42,
  "humanRhythmScore": 81,
  "hashIntegritas": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85",
  "catatan": "Metadata numerik saja. Tidak memuat isi/kutipan konten dokumen."
}
```

| Field | Tipe | Arti | Dari mana |
|---|---|---|---|
| `durasiDetik` | number | Total durasi sesi aktif (tidak termasuk waktu di-pause) | `elapsedBeforePause / 1000` |
| `totalSampel` | number | Berapa kali sistem mengukur panjang dokumen | `state.samples` |
| `intervalAktif` | number | Berapa kali panjang dokumen benar-benar berubah | `state.edits.length` |
| `jedaTerdeteksi` | number | Berapa kali ada jeda ≥ 4 detik tanpa perubahan | `state.pauses.length` |
| `rataRataJedaMs` | number | Rata-rata durasi jeda | `avg(state.pauses)` |
| `lonjakanMendadak` | number | Berapa kali perubahan panjang > 40 karakter dalam satu interval | `state.bursts` |
| `rasioLonjakan` | number | `bursts / totalEdits`, 0–1 | dihitung |
| `revisi` | number | Berapa kali panjang dokumen berkurang (penghapusan/pengeditan ulang) | `state.revisions` |
| `variasiKecepatanMengetik` | number | Coefficient of variation dari delta positif | dihitung, lihat Bab 7 |
| `humanRhythmScore` | number | Skor akhir 0–100 | lihat Bab 7 |
| `hashIntegritas` | string (hex) | SHA-256 dari seluruh payload (sebelum field hash ini ditambahkan) | Web Crypto API |

---

## 7. Metodologi Human Rhythm Score — Referensi Penilaian Lengkap

### 7.1 Dasar Konseptual

Skor ini terinspirasi dari bidang **keystroke dynamics / behavioral biometrics** — riset yang sudah lama digunakan di bidang keamanan (misalnya untuk verifikasi identitas via pola mengetik) yang menunjukkan bahwa manusia punya pola ritme yang **secara alami tidak konstan**: kecepatan mengetik bervariasi, ada jeda berpikir yang tidak teratur, dan ada perilaku mengedit ulang (backspace, revisi kalimat). Sebaliknya, konten yang di-paste dari sumber lain (termasuk hasil AI-generation yang disalin-tempel) muncul sebagai **lonjakan panjang teks yang instan** — bukan proses bertahap.

> **Penting untuk jujur ke pengguna/klien:** ini adalah **heuristik**, bukan model machine learning terlatih atau riset ilmiah yang divalidasi khusus untuk kasus ini. Formula dirancang berdasarkan *prinsip umum* keystroke dynamics, disesuaikan untuk konteks MVP hackathon. Skor ini sebaiknya diposisikan sebagai **pendukung argumen**, bukan bukti forensik mutlak — sudah dinyatakan eksplisit di UI (`ca-score-label`) dan di setiap sertifikat yang dihasilkan.

### 7.2 Empat Faktor Penilaian

Skor dimulai dari **baseline 70**, lalu disesuaikan oleh 4 faktor:

#### Faktor 1 — Rasio Lonjakan Mendadak (`burstRatio`)
```
burstRatio = jumlah_interval_dengan_|delta|>40_karakter / total_interval_aktif
score -= min(45, burstRatio * 100 * 0.6)
```
- **Kenapa 40 karakter?** Ambang ini dipilih karena mengetik manual wajar dalam 1 interval (1.2 detik) biasanya menghasilkan beberapa kata (~5–15 karakter). Lonjakan >40 karakter dalam 1.2 detik jauh melebihi kecepatan mengetik manusia normal (~40-60 WPM ≈ 4-6 karakter/detik), sehingga jadi indikator kuat paste/insert instan.
- **Kenapa penalti maksimal 45?** Dibatasi supaya satu faktor saja tidak bisa menjatuhkan skor ke 0 secara ekstrem — mencerminkan bahwa lonjakan bisa juga berasal dari alasan sah (paste kutipan sendiri, paste dari draft lain di file berbeda), jadi tidak divonis 100% sebagai kecurangan.

#### Faktor 2 — Variasi Kecepatan Mengetik (`typingSpeedCv`)
```
cv = stdev(delta_positif) / rata-rata(delta_positif)
jika totalSampelPositif >= 4:
    jika cv < 0.15  → score -= 15   (terlalu seragam/monoton)
    jika cv > 0.30  → score += 10   (variasi alami)
```
- **Kenapa Coefficient of Variation (CV)?** CV (std/mean) dipakai alih-alih standar deviasi mentah karena CV tidak bergantung skala — cocok untuk membandingkan "keseragaman relatif" tanpa terpengaruh apakah user mengetik cepat atau lambat secara keseluruhan.
- **Kenapa ambang 0.15 dan 0.30?** Ini adalah **nilai heuristik awal (rule of thumb)**, bukan hasil kalibrasi statistik formal terhadap dataset besar — dipilih agar variasi kecil (di bawah 15% dari rata-rata) dianggap "terlalu mekanis", dan variasi besar (di atas 30%) dianggap "sangat manusiawi". Nilai ini adalah kandidat pertama yang **wajib dikalibrasi ulang** dengan data riil sebelum diklaim akurat (lihat [Keterbatasan](#12-keterbatasan--risiko-yang-diketahui)).

#### Faktor 3 — Pola Jeda Berpikir
```
jika durasi_sesi > 5 menit DAN jumlah_jeda == 0:
    score -= 15   (mencurigakan: sesi panjang tanpa jeda sama sekali)
selain itu, jika ada jeda:
    score += min(10, pauseCv * 10)
```
- **Kenapa jeda nol pada sesi panjang mencurigakan?** Proses kreatif manual (menulis/mengilustrasi) secara alami melibatkan momen berhenti untuk berpikir, cek referensi, dsb. Sesi >5 menit tanpa satu pun jeda ≥4 detik adalah pola yang tidak lazim untuk pekerjaan kreatif manual.
- **`pauseCv`** dihitung sama seperti Faktor 2, tapi untuk durasi jeda — jeda yang variatif (kadang sebentar, kadang lama) dianggap lebih natural daripada jeda yang seragam sempurna.

#### Faktor 4 — Revisi/Penghapusan
```
jika revisions > 0:
    score += min(10, revisions * 1.5)
```
- **Kenapa revisi menaikkan skor?** Proses kreatif manual jarang linear — manusia menghapus, mengetik ulang, mengubah kalimat. Ini adalah salah satu sinyal paling kuat untuk "proses berpikir ulang" yang sulit direplikasi oleh aksi paste satu kali.

### 7.3 Formula Akhir

```js
score = clamp(0, 100, round(
  70
  - min(45, burstRatio * 60)
  ± (penalti/bonus variasi kecepatan)
  ± (penalti/bonus pola jeda)
  + min(10, revisions * 1.5)
))
```

### 7.4 Interpretasi Skor (ditampilkan ke user)

| Rentang | Warna | Label |
|---|---|---|
| 75–100 | Hijau (`#2f7a4f`) | "Pola kerja konsisten dengan proses manual bertahap." |
| 50–74 | Kuning-coklat (`#b4762b`) | "Pola kerja cukup wajar, ada beberapa lonjakan mendadak." |
| 0–49 | Merah (`#a5432b`) | "Pola kerja tidak biasa — perlu tinjauan manual." |

Semua label diakhiri kalimat: *"(indikatif, bukan bukti forensik mutlak)"* — ini disengaja, bagian dari komitmen produk untuk tidak overclaim.

---

## 8. Sertifikat Proses & Integritas Hash

- **Hash**: dihitung dengan `crypto.subtle.digest("SHA-256", ...)` (Web Crypto API bawaan browser, tidak ada library eksternal) atas seluruh isi payload (dalam bentuk JSON string) **sebelum** field hash ditambahkan ke objek.
- **Fungsi hash di sini bukan blockchain/timestamp publik** — ia hanya membuktikan bahwa isi file JSON sertifikat **tidak diubah setelah dibuat** (integrity check lokal), bukan membuktikan *kapan* sertifikat dibuat ke pihak independen. Untuk pembuktian waktu yang tidak bisa disangkal pihak luar, lihat rencana **Timestamp Ledger** di [Roadmap](#14-roadmap-pengembangan).
- Sertifikat bisa diekspor sebagai:
  1. **File JSON** (via `downloadCertificate()`) — cocok dilampirkan ke email/tiket dispute.
  2. **Paragraf di dalam dokumen Word** (via `insertCertificateIntoDoc()`) — cocok agar sertifikat menyatu dengan file karya itu sendiri, memakai font `Courier New` ukuran kecil supaya jelas beda dari isi karya asli.

---

## 9. Referensi Fungsi (`taskpane.js`)

| Fungsi | Tanggung Jawab |
|---|---|
| `Office.onReady(...)` | Entry point add-in; mendaftarkan semua event listener tombol saat Word siap. |
| `startRecording()` | Reset state sesi baru, mulai `setInterval` polling (1200ms) dan timer UI (250ms). |
| `togglePause()` | Jeda/lanjutkan polling tanpa reset data; mengakumulasi `elapsedBeforePause`. |
| `stopRecording()` | Hentikan semua interval, kunci status "selesai", panggil `computeAndRenderScore()`. |
| `resetSession()` | Kosongkan total `state`, kembalikan seluruh UI ke kondisi awal. |
| `pollDocument()` | Satu-satunya fungsi yang menyentuh isi dokumen. Ambil `range.text.length`, langsung buang string (`range.text = null`), lempar angka ke `handleLengthSample()`. |
| `handleLengthSample(len)` | Bandingkan panjang baru vs lama → update `edits[]`, `pauses[]`, `bursts`, `revisions`. |
| `setStatus(kind, text)` | Update indikator titik status (idle/recording/paused) & teksnya. |
| `toggleButtons({...})` | Set `disabled` pada tombol-tombol sesuai fase alur kerja. |
| `updateTimer()` | Render `elapsedBeforePause` + waktu berjalan saat ini ke format `HH:MM:SS`. |
| `updateMetricsUI()` | Render angka samples/edits/pauses/bursts ke kartu metrik. |
| `drawActivity()` | Gambar grafik batang aktivitas (60 edit terakhir) ke `<canvas>`, warna beda untuk burst (merah), revisi (coklat), edit normal (navy). |
| `computeAndRenderScore()` | Wrapper: panggil `computeMetrics()` lalu `renderScore()`. |
| `computeMetrics()` | Hitung seluruh statistik & skor akhir (lihat Bab 7). |
| `renderScore(metrics)` | Render angka skor + warna + label interpretasi ke UI. |
| `avg(arr)` / `stdev(arr, mean)` | Utilitas statistik dasar (rata-rata, standar deviasi populasi). |
| `generateCertificate()` | Susun `payload`, hitung `sha256Hex`, simpan ke `state.lastCertificate`, tampilkan preview. |
| `renderCertificatePreview(payload)` | Render tabel definisi (`<dl>`) sertifikat ke dalam kartu UI. |
| `formatDuration(totalSec)` | Format detik → `"Xj Ym Zd"` (jam/menit/detik, Bahasa Indonesia). |
| `sha256Hex(message)` | Hitung SHA-256 memakai Web Crypto API, kembalikan string hex. |
| `downloadCertificate()` | Buat `Blob` JSON, trigger unduhan file `sertifikat-proses-<timestamp>.json`. |
| `insertCertificateIntoDoc()` | `Word.run` untuk menyisipkan ringkasan sertifikat sebagai paragraf di akhir dokumen. |

### Konstanta Konfigurasi

| Konstanta | Nilai | Arti | Cara mengubah dampaknya |
|---|---|---|---|
| `POLL_MS` | 1200 | Frekuensi polling panjang dokumen (ms) | Nilai lebih kecil = resolusi lebih halus tapi lebih banyak panggilan `Word.run` (potensi beban performa). |
| `PAUSE_THRESHOLD_MS` | 4000 | Jeda tanpa perubahan ≥ ini dianggap "jeda berpikir" | Naikkan jika ingin hanya jeda panjang (mis. rehat kopi) yang tercatat; turunkan untuk menangkap jeda mikro. |
| `BURST_CHAR_THRESHOLD` | 40 | Delta panjang > ini dalam satu interval = "lonjakan mendadak" | Sesuaikan dengan kecepatan mengetik rata-rata target user (lihat Faktor 1, Bab 7.2). |

---

## 10. Referensi Manifest (`manifest.xml`)

| Elemen | Fungsi |
|---|---|
| `<Id>` | UUID unik add-in — identitas permanen, jangan diubah setelah dipublikasikan. |
| `<Version>` | Versi add-in untuk keperluan update/cache-busting di sisi Office. |
| `<DefaultLocale>` | `id-ID` — bahasa default add-in mengikuti bahasa produk (Indonesia). |
| `<IconUrl>` / `<HighResIconUrl>` | Ikon yang tampil di galeri add-in Office. |
| `<AppDomains>` | Daftar domain yang diizinkan add-in untuk navigasi/komunikasi (saat ini hanya `localhost:3000` untuk dev). |
| `<Hosts><Host Name="Document" /></Hosts>` | Menyatakan add-in ini untuk **Word** (nilai `Document` = Word dalam skema Office Add-in). |
| `<Permissions>ReadWriteDocument</Permissions>` | Izin minimum yang diperlukan: baca (untuk polling panjang teks) dan tulis (untuk `insertCertificateIntoDoc`). Sengaja tidak minta izin lebih tinggi. |
| `<ExtensionPoint xsi:type="PrimaryCommandSurface">` | Menambahkan grup tombol baru bernama **Creative Alibi** di ribbon tab **Home**. |
| `<Control xsi:type="Button" id="CreativeAlibi.TaskpaneButton">` | Tombol ribbon "Rekam Proses" yang membuka task pane. |
| `<Resources>` | Kumpulan string & gambar yang direferensikan elemen di atas (multi-bahasa bisa ditambah di sini nantinya). |

---

## 11. Privasi & Keamanan

1. **Tidak ada backend.** Seluruh kode berjalan di sisi client (di dalam task pane Word). Tidak ada server yang menerima data pengguna.
2. **Tidak ada penyimpanan konten.** Fungsi `pollDocument()` adalah satu-satunya titik yang membaca `range.text`, dan baris berikutnya langsung `range.text = null` sebelum fungsi lain dipanggil. Tidak ada `console.log(range.text)`, tidak ada penulisan ke `localStorage`/`sessionStorage`/file, tidak ada pengiriman ke jaringan.
3. **Tidak ada penyimpanan persisten sama sekali** — bahkan metadata (angka) hilang begitu task pane ditutup/direset, kecuali user secara eksplisit klik "Unduh JSON" atau "Sisipkan ke Dokumen".
4. **Hash bersifat satu arah** — `hashIntegritas` tidak bisa dibalik untuk merekonstruksi isi dokumen; ia hanya checksum dari metadata numerik itu sendiri.
5. **Izin manifest minimal** — hanya `ReadWriteDocument`, tidak meminta akses ke file system, network, atau dokumen lain.

---

## 12. Keterbatasan & Risiko yang Diketahui

- **Ambang batas (40 karakter, CV 0.15/0.30, jeda 4 detik) adalah nilai heuristik awal**, belum dikalibrasi dengan studi pengguna nyata. Untuk klaim produksi yang lebih kuat, disarankan mengumpulkan data sesi asli (dengan consent) dan mengkalibrasi ulang ambang-ambang ini secara statistik.
- **Resolusi polling 1.2 detik** berarti perubahan yang sangat cepat (mis. dua burst kecil dalam <1.2 detik) bisa tergabung jadi satu delta besar — berpotensi salah diklasifikasikan sebagai "lonjakan mendadak" padahal sebenarnya dua aksi manual berurutan cepat.
- **Skor bisa "dikalahkan" secara sengaja** oleh pengguna yang tahu formulanya (mis. sengaja menambah jeda-jeda palsu, mengetik pelan-pelan dengan variasi buatan). Ini bukan sistem anti-cheat yang tahan manipulasi — cocok untuk kasus itikad baik, bukan untuk lingkungan adversarial berisiko tinggi.
- **Tidak menangani copy-paste dari dalam dokumen yang sama** (mis. duplikasi paragraf sendiri) secara berbeda dari paste eksternal — keduanya sama-sama tercatat sebagai "lonjakan mendadak".
- **Multi-window/multi-device**: jika user membuka dokumen yang sama di lebih dari satu jendela/task pane secara bersamaan, sesi rekaman tidak disinkronkan antar jendela (state lokal per task pane instance).
- **Bergantung pada Word tetap terbuka & task pane aktif** — jika Word/​task pane ditutup di tengah sesi tanpa klik "Berhenti", data sesi yang belum di-generate sertifikatnya akan hilang (sesuai prinsip privasi "tidak ada penyimpanan persisten", tapi ini trade-off yang perlu disadari user).

---

## 13. Instalasi, Build, dan Deployment

Lihat `README.md` untuk langkah cepat. Ringkasan tambahan dari sisi teknis:

- **Dev**: `npm start` menjalankan `office-addin-debugging start manifest.xml`, yang secara internal memicu `dev-server` (webpack-dev-server dengan sertifikat HTTPS lokal dari `office-addin-dev-certs`) dan melakukan sideload manifest ke Word secara otomatis.
- **Build produksi**: `npm run build` → `webpack --mode production` → menghasilkan `dist/` berisi `taskpane.html`, `taskpane.js` (ter-minify), `assets/`, dan salinan `manifest.xml`.
- **Deployment**: `dist/` perlu di-hosting di server HTTPS (Azure Static Web Apps, SharePoint, atau hosting statis lain). Setelah itu, **semua URL `https://localhost:3000` di `manifest.xml` wajib diganti ke domain hosting produksi** sebelum dibagikan sebagai add-in resmi — baik lewat sideload manual, AppSource, atau centralized deployment via Microsoft 365 admin center.
- **Validasi manifest**: `npm run validate` menjalankan `office-addin-manifest validate manifest.xml` untuk mengecek skema XML sebelum publikasi.

---

## 14. Roadmap Pengembangan

Diurutkan berdasarkan prioritas yang masuk akal untuk melanjutkan MVP ini:

1. **Timestamp Ledger (Ide 3 dari brainstorming, belum diimplementasikan)** — kirim `hashIntegritas` ke layanan timestamping publik (mis. OpenTimestamps, atau anchor ke blockchain ringan) di setiap milestone (bukan hanya di akhir), sehingga waktu pembuatan sertifikat bisa diverifikasi pihak independen, bukan sekadar diklaim sepihak.
2. **Kalibrasi ambang skor dengan data riil** — kumpulkan sesi nyata (dengan consent eksplisit dari kreator, tetap tanpa merekam konten) untuk mengganti nilai heuristik (40 karakter, CV 0.15/0.30, dst) dengan ambang yang tervalidasi statistik.
3. **Video replay ringkas** — sesuai Prototype awal, buat visualisasi replay dari data delta (grafik animasi, bukan rekaman layar konten) sebagai pelengkap sertifikat yang lebih mudah dicerna klien awam.
4. **Dukungan Procreate/Photoshop** — persona target juga ilustrator vector; versi add-in/plugin serupa untuk software desain akan memperluas jangkauan produk sesuai riset Empathize.
5. **Server verifikasi publik** — endpoint independen (di luar kendali kreator) tempat klien/platform bisa mengecek validitas hash tanpa harus mempercayai klaim sepihak.
6. **Export PDF bermeterai** — selain JSON, tambahkan opsi cetak sertifikat sebagai PDF dengan tata letak resmi untuk kebutuhan legal/formal.
7. **Multi-bahasa penuh di UI** — saat ini UI hanya Bahasa Indonesia; tambahkan toggle EN/ID di task pane (dokumentasi ini sudah bilingual sebagai langkah awal).

---

## 15. Glosarium

| Istilah | Penjelasan |
|---|---|
| **Metadata** | Data *tentang* proses kerja (panjang teks, waktu, jumlah perubahan) — bukan isi/konten karyanya sendiri. |
| **Delta** | Selisih panjang teks antara satu pengukuran (poll) dengan pengukuran sebelumnya. Bisa positif (penambahan) atau negatif (penghapusan). |
| **Burst / Lonjakan mendadak** | Delta dengan nilai absolut besar (>40 karakter) dalam satu interval polling — indikasi kemungkinan paste/insert instan. |
| **Coefficient of Variation (CV)** | Ukuran statistik `stdev / mean`, dipakai untuk menilai seberapa "seragam" atau "bervariasi" suatu pola secara relatif (tidak bergantung skala). |
| **Human Rhythm Score** | Skor 0–100 hasil heuristik yang menggabungkan burst ratio, variasi kecepatan mengetik, pola jeda, dan jumlah revisi. |
| **Hash Integritas** | Nilai SHA-256 dari isi sertifikat, dipakai untuk membuktikan file tidak diubah setelah dibuat (bukan bukti waktu pihak ketiga). |
| **Task Pane** | Panel samping di Word tempat UI add-in dirender (berbasis HTML/CSS/JS di dalam iframe terkendali Office). |
| **Office.js** | API JavaScript resmi Microsoft untuk berinteraksi dengan dokumen Office (Word, Excel, dll) dari task pane/add-in. |
| **Manifest** | File XML (`manifest.xml`) yang mendeskripsikan add-in ke Office: nama, ikon, izin, lokasi UI. |
| **Sideload** | Proses memasang add-in secara manual/lokal (tanpa lewat AppSource) untuk keperluan development/testing. |
