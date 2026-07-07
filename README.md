# Creative Alibi — Word Add-in (MVP)

Add-in Microsoft Word yang merekam **metadata proses kerja** (bukan isi tulisan) untuk membantu freelance creator membuktikan bahwa karyanya dibuat secara manual — sesuai hasil design thinking "Tim ALIBI".

Ide ini menggabungkan 3 ide dari sesi Ideate kalian:
- **Ide 1 — Process Recorder**: merekam timeline proses (panjang teks, jeda, revisi) di background.
- **Ide 2 — Human Rhythm Score**: skor AI berdasarkan pola ritme kerja (kecepatan, jeda, variasi).
- **Ide 4 — Instant Dispute Kit**: generate laporan/sertifikat siap kirim sebagai bukti sanggahan.

*(Ide 3 — Timestamp Ledger berbasis blockchain — ditandai sebagai roadmap tahap 2, lihat bagian "Pengembangan Lanjutan".)*

## Kenapa Word Add-in + JavaScript?

- **Office Add-in (Office.js)** adalah cara resmi Microsoft untuk menambah panel/fitur ke Word desktop, Word Online, dan Word di Mac — tanpa perlu install .exe/.dll terpisah, cukup satu file `manifest.xml`.
- **JavaScript/HTML/CSS** dipakai karena itu satu-satunya bahasa yang didukung penuh oleh Office.js task pane, dan mudah di-deploy lintas platform (Windows, Mac, Web).
- Build tool: **Webpack** (standar untuk project Office Add-in), tidak perlu framework berat (React dsb) untuk MVP ini — lebih ringan dan gampang di-maintain oleh tim kecil.

## Prinsip Privasi (penting!)

Add-in ini **tidak pernah membaca, menyimpan, atau mengirim isi tulisan Anda**. Yang direkam hanya:
- Panjang teks dokumen (angka), diukur berkala.
- Selisih panjang antar pengukuran (delta) → menandai "ada perubahan" atau "revisi/penghapusan".
- Waktu antar perubahan → menandai "jeda berpikir".
- Jumlah lonjakan panjang teks yang tiba-tiba besar → indikasi kemungkinan tempel (paste) instan.

String isi dokumen yang diambil untuk mengukur panjang **langsung dibuang dari memory** (`range.text = null`) dan tidak pernah ditulis ke variabel penyimpanan, localStorage, atau dikirim keluar. Lihat fungsi `pollDocument()` di `src/taskpane/taskpane.js`.

## Dokumentasi Lengkap

README ini hanya panduan cepat. Untuk detail arsitektur, skema data, dan **penjelasan lengkap dari mana asal setiap angka di Human Rhythm Score**, lihat:
- 🇮🇩 [`docs/DOCUMENTATION.id.md`](./docs/DOCUMENTATION.id.md) — Bahasa Indonesia
- 🇬🇧 [`docs/DOCUMENTATION.en.md`](./docs/DOCUMENTATION.en.md) — English

## Struktur Project

```
creative-alibi-word-addin/
├── manifest.xml              # deskripsi add-in untuk Word (ikon, izin, lokasi taskpane)
├── package.json              # dependencies & script build/dev
├── webpack.config.js         # bundling + dev server HTTPS lokal
├── docs/
│   ├── DOCUMENTATION.id.md    # dokumentasi teknis lengkap (Indonesia)
│   └── DOCUMENTATION.en.md    # dokumentasi teknis lengkap (Inggris)
├── assets/                   # ikon add-in (16/32/64/80 px)
└── src/taskpane/
    ├── taskpane.html         # UI panel (status, timer, skor, sertifikat)
    ├── taskpane.css          # tema visual "sertifikat/notaris"
    └── taskpane.js           # logika rekam metadata, hitung skor, buat sertifikat
```

## Cara Menjalankan (Development)

Prasyarat: **Node.js 16+** dan **Microsoft Word desktop** (Windows/Mac) terpasang.

```bash
npm install
npm start
```

`npm start` akan:
1. Menjalankan dev server HTTPS lokal di `https://localhost:3000` (sertifikat dev di-generate otomatis oleh `office-addin-dev-certs`).
2. Membuka Word dan otomatis **sideload** add-in menggunakan `manifest.xml`.
3. Menampilkan tombol **"Rekam Proses"** di ribbon tab **Home** Word.

Jika `npm start` tidak tersedia di environment kalian, cara manual:
```bash
npm run dev-server      # jalankan server saja
```
Lalu di Word: **Insert → Add-ins → Upload My Add-in** → pilih `manifest.xml`.

## Cara Pakai di Word

1. Klik tombol **Rekam Proses** di ribbon → panel terbuka di kanan.
2. Klik **▶ Mulai Rekam** sebelum mulai menulis/menggambar-teks di dokumen.
3. Bekerja seperti biasa. Panel menampilkan grafik aktivitas & metrik live.
4. Setelah selesai, klik **■ Berhenti** → sistem menghitung **Human Rhythm Score**.
5. Klik **📄 Buat Sertifikat** → muncul ringkasan metadata + hash integritas (SHA-256).
6. Klik **⬇ Unduh JSON** untuk simpan file bukti, atau **📝 Sisipkan ke Dokumen** untuk menambahkan ringkasan sertifikat langsung di akhir dokumen Word.

## Cara Kerja Human Rhythm Score (v1 — heuristik)

Skor 0–100 dihitung dari kombinasi:
- **Rasio lonjakan mendadak** (banyak teks masuk sekaligus dalam satu interval) → menurunkan skor.
- **Variasi kecepatan mengetik** (manusia jarang mengetik dengan kecepatan yang benar-benar konstan) → variasi wajar menaikkan skor, terlalu seragam menurunkan skor.
- **Keberadaan jeda berpikir** yang wajar dalam sesi panjang → menaikkan skor; tidak ada jeda sama sekali pada sesi panjang → menurunkan skor.
- **Jumlah revisi/penghapusan** (manusia lazim mengedit ulang) → menaikkan skor.

> ⚠️ **Disclaimer jujur**: ini adalah *heuristik indikatif*, bukan bukti forensik absolut. Untuk MVP hackathon, ini cukup untuk menunjukkan pola kerja yang konsisten dengan proses manual — bukan untuk mengklaim "100% terbukti manusia". Sertifikat sebaiknya diposisikan sebagai *pendukung* argumen, bukan bukti tunggal mutlak.

## Pengembangan Lanjutan (Roadmap)

- **Timestamp Ledger (Ide 3)**: kirim hash sertifikat ke public ledger (mis. OpenTimestamps / blockchain ringan) tiap milestone, supaya tidak bisa dipalsukan belakangan — saat ini hash hanya dihitung lokal.
- **Video replay ringkas**: rekam replay visual dari data delta (bukan konten) untuk laporan yang lebih meyakinkan klien.
- **Dukungan Procreate/Photoshop**: versi plugin serupa untuk software desain, karena target user juga ilustrator vector.
- **Server verifikasi publik**: endpoint sederhana tempat klien/platform bisa memverifikasi hash sertifikat tanpa perlu percaya klaim sepihak dari kreator.
- **Export PDF bermeterai** untuk sertifikat, bukan hanya JSON.

## Build untuk Distribusi

```bash
npm run build
```
Hasil build ada di folder `dist/`. Untuk distribusi ke tim/klien, `dist/` perlu di-hosting di server HTTPS (atau SharePoint/Azure Static Web Apps), lalu update URL di `manifest.xml` dari `https://localhost:3000` ke domain hosting tersebut sebelum dibagikan sebagai add-in resmi (via AppSource atau sideload manual/centralized deployment Microsoft 365 admin center).
