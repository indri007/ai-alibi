# Panduan Lengkap Instalasi dan Penggunaan Creative Alibi v2.0

Selamat datang! Panduan ini dibuat khusus agar siapa saja—bahkan yang tidak memiliki latar belakang IT atau pemrograman—dapat menginstal dan menguji sistem **Creative Alibi v2.0** di komputer mereka.

Sistem ini adalah sebuah *Add-in* (aplikasi tambahan) untuk **Microsoft Word** yang berfungsi layaknya "CCTV" yang merekam proses mengetik Anda untuk membuktikan bahwa tulisan tersebut benar-benar diketik oleh manusia, bukan hasil buatan AI (*Artificial Intelligence*).

---

## 🛠️ Tahap 1: Persiapan Sistem (Prasyarat)

Sebelum mulai, pastikan komputer Anda memiliki dua hal ini:
1. **Microsoft Word**: Versi Desktop (Windows atau Mac). Pastikan Word sudah terinstal dan bisa dibuka.
2. **Node.js**: Ini adalah mesin pembantu agar aplikasi kita bisa berjalan.
   - Cara cek: Buka aplikasi **Command Prompt** (di Windows) atau **Terminal** (di Mac). Ketik `node -v` lalu tekan Enter. Jika muncul angka versi (misal: `v16.14.0`), berarti Node.js sudah ada.
   - Jika belum ada, download dan instal dari [nodejs.org](https://nodejs.org/). Pilih versi yang disarankan untuk sebagian besar pengguna (LTS). Cukup klik *Next* sampai selesai saat proses instalasi.

---

## ⚙️ Tahap 2: Langkah Instalasi

Setelah persyaratan di atas terpenuhi, ikuti langkah-langkah berikut:

1. **Siapkan Folder Project**:
   Pastikan Anda sudah memiliki folder project `Creative-Alibi` di komputer Anda. Buka folder tersebut.

2. **Buka Terminal di Folder Tersebut**:
   - **Windows**: Buka folder `Creative-Alibi`, klik pada *address bar* (kolom lokasi folder di bagian atas) pada File Explorer, ketik `cmd`, lalu tekan **Enter**. Kotak hitam *Command Prompt* akan terbuka.
   - **Mac**: Buka folder, klik kanan pada nama folder, lalu pilih *New Terminal at Folder*.

3. **Instal Komponen Aplikasi**:
   Di dalam kotak hitam Terminal/Command Prompt tersebut, ketikkan perintah berikut dengan sama persis, lalu tekan **Enter**:
   ```bash
   npm install
   ```
   > ⚠️ *Tunggu beberapa saat (bisa 1 hingga 5 menit tergantung internet). Anda akan melihat teks berjalan. Ini adalah proses mengunduh komponen mesin aplikasi. Pastikan penyimpanan disk (hardisk/SSD) Anda tidak penuh.*

---

## 🔌 Tahap 3: Menjalankan Aplikasi & Microsoft Word

Setelah proses instalasi (*npm install*) selesai dan berhasil, jalankan perintah ini di Terminal yang sama:

```bash
npm run dev:all
```

**Apa yang terjadi setelah menekan enter?**
1. Komputer Anda akan menyalakan server lokal secara otomatis.
2. Sebuah jendela perizinan keamanan (Sertifikat SSL) mungkin akan muncul. Pilih **Yes** atau **Allow** (Izinkan). Ini aman, hanya prosedur standar agar Microsoft Word mengizinkan aplikasi berjalan secara lokal.
3. **Microsoft Word akan otomatis terbuka** dengan sendirinya, membawa Anda ke dokumen kosong baru.
   
*(Biarkan kotak hitam Terminal tetap terbuka di latar belakang. Jangan ditutup selama Anda masih menggunakan aplikasi).*

---

## 🧪 Tahap 4: Cara Menguji Aplikasi (Testing)

Sekarang aplikasi sudah berjalan di dalam Word. Mari kita uji!

### Langkah A: Membuka Panel Aplikasi
1. Di jendela Microsoft Word, lihat menu pita atas (*Ribbon*) di tab **Home** (Beranda).
2. Temukan dan klik tombol bernama **Creative Alibi** (atau *Rekam Proses*).
3. Panel hitam elegan (Dasbor Creative Alibi) akan terbuka di sebelah kanan layar Anda.

### Langkah B: Pengaturan (Opsional)
1. Di pojok kanan atas panel tersebut, ada tombol ikon roda gigi ⚙️. Klik tombol tersebut.
2. Anda akan melihat tombol sakelar (*toggle*). Pastikan tombol **Layer 2 (Analisis Lokal Offline)** menyala (berwarna hijau).
3. Anda bisa menutup kembali menu pengaturan tersebut dengan mengeklik tombol **X**.
*(Abaikan Layer 3 untuk saat ini jika Anda tidak memiliki kunci API berlangganan).*

### Langkah C: Mulai Rekaman (Uji Manusia)
1. Di panel tab **Rekam**, klik tombol biru **Mulai Rekam**.
2. Status akan berubah menjadi *"Sedang Merekam"*. Mulailah mengetik cerita karangan Anda sendiri, sekitar 2 atau 3 paragraf pendek di dokumen Word.
3. Mengetiklah dengan santai! Berhenti sejenak (*jeda berpikir*), hapus beberapa kata jika salah ketik (*revisi*), lalu lanjut mengetik. 
4. Lihat ke panel sebelah kanan! Angka-angka pada layar (seperti "Sampel", "Edit", "Jeda") akan bergerak hidup, mencatat aktivitas natural Anda. Ini membuktikan aplikasi merekam ritme Anda.

### Langkah D: Simulasi Kecurangan (Uji *Copy-Paste* AI)
1. Buka browser internet Anda (Chrome/Safari), cari sembarang teks atau berita panjang dalam bahasa Inggris di internet. Lalu blok teks (*Copy*).
2. Kembali ke Microsoft Word, klik tombol **Jeda** di panel agar istirahat sebentar, lalu klik **Lanjutkan**.
3. *Paste* (Tempel) teks panjang yang baru saja Anda *copy* langsung ke dalam Word!
4. Di panel kanan, Anda akan melihat peringatan aktivitas pada grafik memanjang ke atas secara ekstrem, dan skor metrik "Lonjakan" (*Burst*) bertambah seketika. Sistem mengenali ini sebagai tindakan tidak natural!

### Langkah E: Melihat Skor Forensik
1. Klik tombol merah **Berhenti** di panel.
2. Panel akan langsung otomatis bergeser ke tab **Forensik**. 
3. Anda akan disajikan animasi cincin yang berputar, menghitung **Skor Keyakinan Forensik** (1 sampai 100).
4. Karena Anda tadi mensimulasikan *Copy-Paste*, skor forensik Anda mungkin akan **jatuh (rendah)**, dan labelnya mungkin menunjukkan indikasi campur tangan AI atau hasil tempelan, membuktikan bahwa detektor berfungsi mengenali anomali!

### Langkah F: Membuat & Menyisipkan Sertifikat
1. Pindah ke tab **Sertifikat** (tab ketiga di atas panel).
2. Klik tombol **Buat Sertifikat**.
3. Rangkuman metadata sesi kerja Anda akan muncul (berisi rincian durasi kerja dan kode Hash SHA-256 yang aman dan mustahil dipalsukan).
4. Klik tombol **Sisipkan**. Bukti sertifikat tersebut akan tertulis secara otomatis di baris paling bawah dokumen Word Anda!

---

🎉 **Selamat!** Anda telah berhasil menjalankan sistem Creative Alibi dari awal hingga mencetak bukti integritas sertifikatnya. 

> *Jika Anda sudah selesai menggunakan aplikasi, Anda bisa menutup jendela Microsoft Word, lalu tutup (Silang) kotak hitam Terminal tadi untuk mematikan server lokal.*
