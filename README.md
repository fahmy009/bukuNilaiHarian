# 📚 Aplikasi Buku Nilai Harian (Google Apps Script)

Aplikasi **Buku Nilai Harian** adalah sistem pencatatan dan rekapitulasi nilai siswa berbasis web (Single Page Application) yang terintegrasi secara mulus dengan **Google Apps Script** dan **Google Sheets** sebagai *database* (sebagai Backend). 

Aplikasi ini dirancang secara modern untuk mempermudah tugas Guru (Wali Kelas) dalam melakukan pencatatan nilai harian, sekaligus memberikan keleluasaan bagi Admin untuk mengelola seluruh data induk sekolah.

---

## ✨ Fitur Utama

### 1. 👥 Multi-Role Access (Akses Berbasis Peran)
Aplikasi mendukung 2 jenis pengguna dengan antarmuka dan wewenang yang berbeda:
- **Admin Panel**: Mengelola Master Data secara keseluruhan.
- **Guru Panel**: Khusus untuk Wali Kelas/Guru mata pelajaran menginput nilai.

### 2. ⚙️ Manajemen Data Induk (Admin)
Admin memiliki kontrol penuh untuk mengonfigurasi dan mengedit *database* langsung dari antarmuka web, meliputi:
- **Data Sekolah** (Nama instansi, logo kiri/kanan, kepala sekolah, dll)
- **Data Kelas** & **Mata Pelajaran**
- **Data Guru** & **Siswa**
- **Manajemen Akun / Kredensial User**
- Akses dan pemantauan **Database Nilai Mentah** secara langsung.

### 3. 📝 Editor Nilai Dinamis ala Excel (Guru)
Antarmuka untuk Guru dibuat sangat interaktif dan responsif layaknya *spreadsheet*:
- Menampilkan daftar siswa berdasarkan kelas yang diampu secara otomatis.
- **Tambah/Hapus Kolom Nilai (UH/Tugas)** secara *real-time* langsung dari UI.
- Kalkulasi otomatis untuk **Total Nilai** dan **Rata-rata**.
- Peringatan error otomatis jika angka yang diinput di luar batas (0 - 100) atau format tidak valid.
- Navigasi pintar antar sel (mendukung tombol panah keyboard `Enter`, `Arrow Up`, `Arrow Down`).

### 4. 🖨️ Export PDF & Mode Print Cetak Otomatis
Sistem dilengkapi dengan mesin *renderer* mandiri untuk mencetak laporan yang presisi:
- Tersedia pilihan ukuran kertas standar Indonesia: **A4** dan **F4 (Folio)**.
- Desain *kop surat* dinamis dengan 2 sisi logo (Kiri dan Kanan), tanda tangan guru, dan kepala sekolah.
- Hasil *Export PDF* dikunci resolusinya (`windowWidth: 1200`), sehingga format dan tabel PDF dijamin **100% konsisten** baik saat dieksekusi melalui Layar Lebar (PC/Laptop) maupun melalui *Smartphone*.

### 5. 📱 Fully Responsive & Mobile-Friendly
- **Smart Viewport**: Tampilan panel akan berubah otomatis menyesuaikan ukuran layar (Desktop, Tablet, Mobile Landscape, Mobile Portrait).
- **Floating Zoom Controls**: Tersedia fitur kontrol *Zoom In (+)* dan *Zoom Out (-)* khusus bagi pengguna HP/Tablet. Fitur ini membantu guru melakukan *pinch* layar dengan stabil saat merekap data di area tabel yang luas.

### 6. 🖼️ Terintegrasi dengan Image Cropper
Admin dapat mengunggah Logo Sekolah. Sistem dilengkapi fitur `Cropper.js` bawaan yang memungkinkan pemotongan area logo *(cropping)* secara *live* sebelum diunggah ke Google Drive.

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
   - `kode.gs` (Pindahkan/Tulis semua logika *Backend Javascript* Anda ke sini).
   - `index.html` (Salin dan tempelkan seluruh kode frontend SPA dari *repository* ini).
5. Pada fungsi `doGet()` di file `kode.gs`, pastikan ia mengembalikan/memanggil file `index.html` (Gunakan `HtmlService.createHtmlOutputFromFile('index')`).
6. Klik **Terapkan (Deploy) > Deployment Baru**.
7. Pilih jenis **Aplikasi Web (Web App)**. Atur aksesibilitas ke *"Siapa saja yang memiliki link"* (Atau sesuaikan dengan domain sekolah).
8. Selesai! Bagikan URL Web App tersebut kepada staf dan guru-guru.

---

## 💻 Struktur Utama Kode Frontend (`index.html`)

Sebagian besar antarmuka berada di `index.html` yang terbagi atas:
- `<style>`: Blok CSS sentral yang mendefinisikan seluruh variabel warna, animasi, *layouting grid*, media queries, hingga pengaturan khusus cetak kertas (`@media print`).
- **Divisi Kontainer Utama**:
  - `#login-screen`: Halaman Kredensial.
  - `#app-admin`: Dasbor untuk Admin.
  - `#app-guru`: Dasbor input nilai untuk Guru.
  - `#admin-data-modal` & `#cropper-modal`: Jendela *pop-up* fungsionalitas khusus.
- `<script>`: Mengontrol logika antarmuka, perpindahan halaman (*routing*), kalkulasi rekapitulasi langsung, komunikasi asinkron dengan Apps Script, dan fungsionalitas PDF.

---
*Dibuat untuk memudahkan produktivitas dunia pendidikan.* 🎓
