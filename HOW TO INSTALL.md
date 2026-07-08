# How to Install & Test Creative Alibi v2.0
# Panduan Lengkap Instalasi dan Penggunaan

---

# 🇬🇧 English

Welcome! This guide is designed for everyone, including non-technical users, to easily install and test the **Creative Alibi v2.0** system on their local machine.

This system is a **Microsoft Word Add-in** that acts as a "Digital CCTV" recording your typing process to mathematically prove that the text is created by a human, not an AI.

## 🛠️ Step 1: System Requirements
1. **Microsoft Word**: Desktop version (Windows or Mac).
2. **Node.js**: The runtime engine to run our local server.
   - To check, open your Terminal or Command Prompt and type `node -v`. If it shows a version number, you're good.
   - If not, download and install the LTS version from [nodejs.org](https://nodejs.org/).

## ⚙️ Step 2: Installation
1. Open your terminal or command prompt inside the `Creative-Alibi` project folder.
2. Run the following command to download all necessary engine components:
   ```bash
   npm install
   ```

## 🔌 Step 3: Running the Application
Once the installation finishes, run the following command to start both the Add-in and the Backend Proxy:
```bash
npm run dev:all
```
- Your computer will start the local proxy server (handling API keys securely).
- Microsoft Word will automatically launch and create a new blank document.
- *Keep the terminal open in the background!*

## 🧠 Step 4: Configuring IBM watsonx.ai (Optional but Recommended)
For the most robust forensic validation, you can connect the app to **IBM watsonx.ai**:
1. Open `server/.env.example` in the project folder and rename it to `.env` (or create a copy).
2. Insert your IBM Cloud API Key and WatsonX Project ID into `WATSONX_API_KEY` and `WATSONX_PROJECT_ID`.
3. In Microsoft Word, open the **Creative Alibi** panel from the Home tab.
4. Click the **Settings ⚙️** icon, activate **Layer 3 (External API)**, and select **IBM watsonx.ai (Granite)** from the dropdown.

## 🧪 Step 5: How to Test (Human vs AI Simulation)
1. **Human Test**: Click **Start Recording** in the panel. Type a short paragraph naturally, make some typos, pause to think, and delete characters. Watch the metrics panel record your authentic behavior.
2. **AI Test (Copy-Paste)**: Copy a large chunk of text from the internet. In Word, click Pause, then Resume, and paste the huge text all at once. Watch the "Burst" metric jump to abnormal levels!
3. **Forensic Analysis**: Click **Stop**. The app will automatically analyze your rhythm and generate a human confidence score. If configured, it will consult IBM watsonx.ai for deep linguistic classification.
4. **The Certificate**: Go to the Certificate tab, generate a cryptographic certificate containing the offline metadata, and insert it into your Word document to prove your human effort!

---

# 🇮🇩 Bahasa Indonesia

Selamat datang! Panduan ini dibuat khusus agar siapa saja—bahkan yang tidak memiliki latar belakang IT—dapat menginstal dan menguji sistem **Creative Alibi v2.0** di komputer mereka.

Sistem ini adalah sebuah *Add-in* untuk **Microsoft Word** yang berfungsi layaknya "CCTV digital" yang merekam proses mengetik Anda untuk membuktikan keaslian karya (bukan hasil *Copy-Paste* AI).

## 🛠️ Tahap 1: Persiapan Sistem
1. **Microsoft Word**: Versi Desktop (Windows atau Mac).
2. **Node.js**: Mesin pembantu agar aplikasi kita bisa berjalan.
   - Buka Command Prompt/Terminal, ketik `node -v`. Jika muncul angka versi, berarti sudah ada.
   - Jika belum, download versi LTS dari [nodejs.org](https://nodejs.org/) dan *install*.

## ⚙️ Tahap 2: Langkah Instalasi
1. Buka Terminal/Command Prompt tepat di dalam folder proyek `Creative-Alibi` ini.
2. Ketikkan perintah berikut lalu tekan Enter untuk mengunduh mesin aplikasi:
   ```bash
   npm install
   ```

### Tahap 6: Membangun Versi Produksi (Opsional)
Jika Anda ingin menghasilkan versi akhir (produksi) dari Add-in:
```bash
npm run build
```
Ini akan mengkompilasi *source code* (di dalam `src/`) ke dalam folder `dist/` yang siap untuk di-*deploy* ke server internet (misalnya AWS, Vercel, atau server mandiri).

---

### METODE ALTERNATIF: Sideloading Manual via Trust Center
Jika perintah `npm run dev:all` gagal meluncurkan Word atau Add-in mengalami error karena pembatasan Windows, Anda bisa mendaftarkan aplikasi ini secara manual ke dalam MS Word:

1. **Buat Network Share untuk Folder Proyek:**
   - Buka **File Explorer**, cari folder `Creative-Alibi`.
   - Klik Kanan pada folder tersebut -> **Properties** -> Tab **Sharing** -> Klik tombol **Share...**
   - Pilih nama Anda sendiri (atau *Everyone*), klik **Add**, lalu klik **Share**.
   - Salin **Network Path** yang muncul (contoh: `\\NAMA-PC\Creative-Alibi`).

2. **Daftarkan ke Trust Center MS Word:**
   - Buka Microsoft Word (Dokumen Kosong baru).
   - Klik menu **File** -> **Options** (di pojok kiri bawah) -> **Trust Center** -> **Trust Center Settings...**
   - Pilih menu **Trusted Add-in Catalogs** di sebelah kiri.
   - Pada kolom *Catalog Url*, tempelkan (*paste*) **Network Path** dari Langkah 1.
   - Klik tombol **Add catalog**.
   - **Centang kotak "Show in Menu"** di sebelah path yang baru ditambahkan.
   - Klik **OK** dan **OK** lagi. Tutup aplikasi Microsoft Word sepenuhnya.

3. **Jalankan Server Lokal (Buka 2 Terminal):**
   - Di Terminal pertama, jalankan:
     ```bash
     npm run server
     ```
   - Buka Terminal baru (di folder yang sama), lalu jalankan:
     ```bash
     npm run dev-server
     ```
   *(Biarkan kedua terminal ini menyala di latar belakang).*

4. **Masukkan Add-in ke Word:**
   - Buka kembali Microsoft Word (Dokumen Kosong).
   - Buka tab **Insert** -> Klik **Get Add-ins** (atau *My Add-ins*).
   - Pilih tab **SHARED FOLDER** (di bagian atas).
   - Klik **Creative Alibi**, lalu klik **Add**. Panel akan terbuka dengan sempurna!

## 🔌 Tahap 3: Menjalankan Aplikasi
Setelah instalasi selesai, jalankan perintah ini di Terminal yang sama:
```bash
npm run dev:all
```
- Server lokal akan menyala secara otomatis.
- Microsoft Word akan langsung otomatis terbuka membawa Anda ke dokumen kosong baru.
- *(Biarkan kotak hitam Terminal tetap terbuka di latar belakang).*

## 🧠 Tahap 4: Konfigurasi IBM watsonx.ai (Opsional)
Untuk tingkat akurasi forensik tertinggi, hubungkan aplikasi dengan model AI IBM:
1. Buka file `server/.env.example` lalu ubah namanya menjadi `.env`.
2. Masukkan *API Key* IBM Cloud dan *Project ID* WatsonX Anda di variabel yang tersedia.
3. Di dalam Microsoft Word, buka panel **Creative Alibi**, klik ikon pengaturan ⚙️, nyalakan **Layer 3 (External API)**, lalu pilih **IBM watsonx.ai (Granite)** dari daftar penyedia.

## 🧪 Tahap 5: Cara Menguji Aplikasi (Simulasi)
1. **Uji Manusia**: Klik **Mulai Rekam** di panel. Mengetiklah 2 paragraf secara natural. Hapus kata jika salah, diam sebentar untuk berpikir, lalu ketik lagi. Lihat angka-angka pada layar (seperti "Sampel", "Edit") mencatat aktivitas natural Anda.
2. **Uji Curang AI (Copy-Paste)**: Buka internet, salin teks yang panjang (*Copy*). Kembali ke Word, klik *Jeda*, lalu *Lanjutkan*, dan tempel (*Paste*) teks tersebut ke dalam Word! Grafik akan memerah karena ada lonjakan tidak natural.
3. **Analisis Forensik**: Klik **Berhenti**. Sistem akan menghitung Skor Keyakinan Forensik. Jika terhubung ke IBM WatsonX, sistem akan mengirim teks untuk dianalisis dan dicocokkan dengan data *offline* Anda.
4. **Sertifikat**: Pindah ke tab Sertifikat, klik **Buat**, lalu **Sisipkan**. Bukti kerja asli Anda (*Proof of Human Effort*) beserta Hash kriptografis akan tercetak abadi di dalam dokumen Word Anda!
