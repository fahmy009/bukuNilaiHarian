# 📚 Aplikasi Buku Nilai Harian (Google Apps Script)

Aplikasi **Buku Nilai Harian** adalah sistem pencatatan dan rekapitulasi nilai siswa berbasis web (Single Page Application) yang terintegrasi secara mulus dengan **Google Apps Script** dan **Google Sheets** sebagai *database* (sebagai Backend). 

Aplikasi ini dirancang secara modern untuk mempermudah tugas Guru (Wali Kelas maupun Guru Mata Pelajaran) dalam melakukan pencatatan nilai harian, sekaligus memberikan keleluasaan bagi Admin untuk mengelola seluruh data induk sekolah.

---

## ✨ Fitur Utama

### 1. 👥 Multi-Role Access (Akses Berbasis Peran)
Aplikasi mendukung 2 jenis pengguna dengan antarmuka dan wewenang yang berbeda:
- **Admin Panel**: Mengelola Master Data secara keseluruhan, termasuk Manajemen Akses User.
- **Guru Panel**: Untuk Wali Kelas maupun Guru Mata Pelajaran dalam menginput nilai, yang secara spesifik menampilkan mata pelajaran & kelas sesuai hak aksesnya.

### 2. ⚙️ Manajemen Data Induk (Admin)
Admin memiliki kontrol penuh untuk mengonfigurasi dan mengedit *database* langsung dari antarmuka web, meliputi:
- **Data Sekolah** (Nama instansi, logo kiri/kanan, kepala sekolah, dll)
- **Data Kelas** & **Mata Pelajaran** (Lengkap dengan Kode Mapel)
- **Data Guru** & **Siswa**
- **Manajemen Akun / Kredensial User**: Mengatur `Akses_Mapel` dan `Akses_Kelas` khusus untuk mendelegasikan hak akses kepada Guru Mata Pelajaran.
- Akses dan pemantauan **Database Nilai Mentah** secara langsung.

### 3. 📝 Editor Nilai Dinamis ala Excel (Guru)
Antarmuka untuk Guru dibuat sangat interaktif dan responsif layaknya *spreadsheet*:
- Menampilkan daftar siswa berdasarkan kelas yang diampu secara otomatis.
- **Tambah/Hapus Kolom Nilai (UH/Tugas)** secara *real-time* langsung dari UI. Terintegrasi dengan format penilaian spesifik Kurikulum Merdeka (seperti komponen NS, STS, SAS).
- Kalkulasi otomatis untuk **Total Nilai**, **Rata-rata (NR)**, hingga kalkulasi **Perankingan** otomatis.
- Peringatan error otomatis jika angka yang diinput di luar batas (0 - 100) atau format tidak valid.
- Navigasi pintar antar sel (mendukung tombol panah keyboard `Enter`, `Arrow Up`, `Arrow Down`).

### 4. 🖨️ Export PDF & Mode Print Cetak Otomatis
Sistem dilengkapi dengan mesin *renderer* mandiri untuk mencetak laporan yang presisi:
- Tersedia pilihan ukuran kertas standar Indonesia: **A4** dan **F4 (Folio)**.
- **Deteksi Penanda Tangan Cerdas**: Bagian tanda tangan akan mendeteksi secara otomatis apakah lembar mapel tersebut diampu oleh Guru Mapel atau Wali Kelas, lalu menampilkan Nama beserta NIP guru yang tepat.
- Tampilan dan kolom khusus seperti "Ranking" otomatis disembunyikan (*hidden*) ketika dokumen di-print atau di-export ke PDF agar hasil cetakan menjadi lebih ringkas dan resmi.
- Hasil *Export PDF* dikunci resolusinya (`windowWidth: 1200`), sehingga format dan tabel PDF dijamin **100% konsisten** di perangkat apapun (Desktop/Mobile).

### 5. 📱 Fully Responsive & Mobile-Friendly
- **Smart Viewport**: Tampilan panel akan berubah otomatis menyesuaikan ukuran layar (Desktop, Tablet, Mobile Landscape, Mobile Portrait).
- **Navigasi Cerdas**: Menampilkan menu tombol navigasi Kode Mapel di bagian pojok layar agar mudah beralih pelajaran. Khusus untuk Guru Mapel, navigasi tersebut akan otomatis memunculkan keterangan Kelas untuk menghindari kebingungan.
- **Floating Zoom Controls**: Tersedia fitur kontrol *Zoom In (+)* dan *Zoom Out (-)* khusus bagi pengguna HP/Tablet untuk mengatur kenyamanan melihat tabel nilai.

### 6. 🖼️ Terintegrasi dengan Image Cropper
Admin dapat mengunggah Logo Sekolah langsung. Sistem dilengkapi fitur `Cropper.js` bawaan yang memungkinkan pemotongan area logo *(cropping)* secara *live* sebelum diunggah ke Google Drive.

---

## 🛠️ Teknologi yang Digunakan

Aplikasi ini dibangun tanpa mengandalkan *framework backend* berbayar, melainkan memaksimalkan ekosistem Google Workspace:
- **Frontend**: HTML5, Vanilla CSS3 (Custom Variables, Flexbox, CSS Grid), dan Vanilla JavaScript.
- **Backend & API**: Google Apps Script (`google.script.run`).
- **Database**: Google Sheets (Spreadsheet).
- **Library Tambahan**:
  - `html2pdf.js` & `html2canvas.js` (Pembuatan & Export PDF).
  - `SweetAlert2` (Notifikasi Pop-up / Toast yang cantik).
  - `FontAwesome 6` (Ikon antarmuka vektor).
  - `Cropper.js` (Manipulasi pemotongan rasio gambar logo).

---

## 🚀 Cara Instalasi (Deployment via Google Apps Script)

Karena aplikasi ini bergantung pada Google Apps Script (GAS), berikut cara untuk memasangnya:

1. Siapkan satu file **Google Sheets** kosong di Google Drive Anda.
2. Buat Lembar Kerja (Sheets) yang sesuai dengan kerangka aplikasi (misalnya: `Data_Sekolah`, `Data_User`, `Data_Guru`, `Data_Siswa`, dll).
3. Klik menu **Ekstensi > Apps Script** di Google Sheets Anda.
4. Buat dua file di dalam editor Apps Script:
   - `kode.gs` (Pindahkan/Tulis semua logika *Backend Javascript* dari file `kode.js` repository ini ke sana).
   - `index.html` (Salin dan tempelkan seluruh kode frontend SPA dari file `index.html` repository ini).
5. Pada fungsi `doGet()` di file `kode.gs`, pastikan memanggil file `index.html` (Gunakan `HtmlService.createHtmlOutputFromFile('index')`).
6. **(Penting)** Jalankan fungsi `otorisasiDrive()` sekali dari antarmuka editor Apps Script untuk memancing perizinan akses upload file ke Google Drive (untuk logo sekolah).
7. Klik **Terapkan (Deploy) > Deployment Baru**.
8. Pilih jenis **Aplikasi Web (Web App)**. Atur aksesibilitas ke *"Siapa saja yang memiliki link"*.
9. Selesai! Bagikan URL Web App tersebut kepada staf dan guru-guru.

---

## 💻 Struktur Utama Kode Frontend (`index.html`)

Sebagian besar antarmuka berada di `index.html` yang terbagi atas:
- `<style>`: Blok CSS sentral yang mendefinisikan seluruh variabel warna, animasi, *layouting grid*, media queries, dan pengaturan khusus cetak kertas (`@media print`).
- **Divisi Kontainer Utama**:
  - `#login-screen`: Halaman Kredensial.
  - `#app-admin`: Dasbor untuk Admin (dilengkapi Live Preview Print A4/F4).
  - `#app-guru`: Dasbor input nilai untuk Guru/Wali Kelas.
  - `#admin-data-modal` & `#cropper-modal`: Jendela *pop-up* fungsionalitas pendukung.
- `<script>`: Mengontrol logika antarmuka, perpindahan halaman (*routing*), kalkulasi nilai harian & ranking secara langsung, pencarian/penggabungan data Guru Mapel, komunikasi asinkron dengan Apps Script, dan fungsionalitas Export PDF.

---
*Dibuat untuk memudahkan produktivitas dunia pendidikan.* 🎓
