# LAPORAN PRAKTIK KERJA LAPANGAN (PKL)
## PERANCANGAN DAN PEMBUATAN APLIKASI LOG BOOK KEGIATAN PADA SEKRETARIAT JENDERAL DEWAN NASIONAL KAWASAN EKONOMI KHUSUS

---

> **Format Sistematika Baku:**  
> Mengacu pada **Pedoman Praktik Kerja Lapangan (PKL) Tahun 2026**  
> **Universitas Bina Sarana Informatika (UBSI)**  
> **Fakultas Teknik dan Informatika — Program Studi Informatika Program Sarjana (S1)**  
> **Halaman 30 – 31, Nomor 3: Outline Pembuatan Project Aplikasi**

---

## SUSUNAN STRUKTUR HALAMAN DEPAN

* **Lembar Judul Laporan PKL**
* **Lembar Persetujuan Laporan PKL**
  * Nama: Rizki Agustianto (NIM: 15230292)
  * Program Studi: Informatika (S1) — Kelas: 15.7A.01
  * Dosen Penasehat Akademik: Budi Sudrajat, M.Kom
* **Kata Pengantar**
* **Daftar Isi**
* **Daftar Simbol** (Simbol UML Use Case, Activity Diagram, Class Diagram, Sequence Diagram, dan Simbol ERD)
* **Daftar Gambar**
* **Daftar Tabel**
* **Daftar Lampiran**

---

# BAB I PENDAHULUAN

### 1.1. Latar Belakang Masalah
Dalam rangka mendukung tata kelola pemerintahan yang efektif, transparan, dan akuntabel di lingkungan Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus (Setjen DN KEK), pelaksanaan koordinasi dan perumusan kebijakan strategis memerlukan sistem pendokumentasian yang andal. Setiap agenda rapat koordinasi dinas, perumusan regulasi kawasan, percepatan investasi hilirisasi, serta fasilitasi kerja sama ekonomi menghasilkan keputusan-keputusan krusial yang harus dicatat, ditindaklanjuti, dan dipertanggungjawabkan secara tepat waktu.

Selama ini, pengelolaan log rapat dinas, penyusunan risalah notulensi, dan pemantauan butir tindak lanjut (*action items*) yang masih dilakukan secara konvensional atau terpisah-pisah menimbulkan beberapa kendala administratif, antara lain:
1. **Redundansi dan Ketidaksinkronan Penomoran:** Sering terjadi tumpang tindih (*overlap*) nomor registrasi agenda rapat dinas lintas biro/tim kerja karena pencatatan agenda masih menggunakan spreadsheet manual.
2. **Keterlambatan Distribusi Risalah:** Notulensi dan arahan pimpinan rapat membutuhkan waktu berhari-hari untuk didistribusikan kepada tim kerja atau pejabat penanggung jawab (*Person-in-Charge / PIC*).
3. **Ketiadaan Monitoring Real-Time:** Pimpinan kesulitan memantau progres realisasi tindak lanjut hasil kegiatan secara terpusat, sehingga batas waktu penyelesaian (*due date*) kerap terlewati (*overdue*).
4. **Hilangnya Jejak Audit (*Audit Trail*):** Tidak adanya rekam jejak riwayat perubahan naskah notulensi, sehingga sulit melacak siapa yang melakukan penyuntingan dan kapan revisi dilakukan.

Berdasarkan permasalahan tersebut, dibangun **Sistem Informasi Log & Notula Rapat (Log_Book_Rapat KEK)** berbasis web modern yang mengintegrasikan penjadwalan rapat, pencatatan presensi, penyusunan notulensi terstruktur, pengesahan risalah, hingga pemantauan status penyelesaian tindak lanjut (*action items*) dalam satu ekosistem terpadu.

### 1.2. Maksud dan Tujuan
Maksud dan tujuan dari pelaksanaan Praktik Kerja Lapangan dan pembuatan proyek aplikasi ini adalah:
1. **Maksud:**
   a. Menerapkan ilmu rekayasa perangkat lunak dan arsitektur web modern yang diperoleh selama perkuliahan pada instansi pemerintah nyata.  
   b. Membantu instansi Sekretariat Jenderal Dewan Nasional KEK dalam mengotomasi tata kelola rapat dan tertib administrasi notulensi.  
   c. Memenuhi salah satu mata kuliah wajib Praktik Kerja Lapangan (PKL) pada Program Studi Informatika (S1) Fakultas Teknik dan Informatika Universitas Bina Sarana Informatika.
2. **Tujuan:**
   a. Membangun aplikasi web Log_Book_Rapat KEK yang memiliki generator nomor registrasi rapat otomatis per biro/tim kerja.  
   b. Menyediakan editor notulensi digital terstruktur yang mendukung riwayat audit trail versi dokumen.  
   c. Mengembangkan modul matriks monitoring tindak lanjut (*action items*) berbasis batas waktu (*deadline*).  
   d. Menyediakan dashboard eksekutif bagi pimpinan untuk memantau KPI penyelesaian penugasan rapat dinas secara *real-time*.

### 1.3. Metode Penelitian
Dalam pengumpulan data dan perancangan aplikasi, metode penelitian yang digunakan meliputi:
1. **Metode Pengumpulan Data:**
   * **Observasi:** Mengamati secara langsung alur kerja pengadministrasian rapat dinas, pencatatan notula, dan distribusi disposisi tugas di lingkungan Setjen DN KEK.
   * **Wawancara (*Interview*):** Melakukan tanya jawab dengan mentor instansi, staf persuratan, dan pimpinan rapat terkait kendala operasional pencatatan rapat dinas.
   * **Studi Pustaka:** Mengkaji literatur jurnal ilmiah, buku rekayasa perangkat lunak, dokumentasi resmi Next.js, Prisma ORM, dan PostgreSQL untuk landasan teoritis.
2. **Metode Pengembangan Perangkat Lunak:**
   Menggunakan model **Waterfall (Air Terjun)** yang terdiri dari tahapan terstruktur:
   * **Analisis Kebutuhan (*Requirements Analysis*):** Mengidentifikasi 27 kebutuhan fungsional sistem dan kebutuhan non-fungsional.
   * **Desain Sistem (*System Design*):** Merancang UML (Use Case, Activity, Class, Sequence Diagram), ERD, LRS, dan antarmuka pengguna.
   * **Implementasi Kode (*Implementation*):** Menulis kode program menggunakan Next.js 15, TypeScript, Tailwind CSS, Prisma ORM, dan Neon PostgreSQL.
   * **Pengujian Sistem (*Testing*):** Melakukan pengujian fungsionalitas menggunakan metode *Black Box Testing*.
   * **Penerapan & Pemeliharaan (*Deployment & Maintenance*):** Menerapkan aplikasi di server cloud Vercel dan database serverless Neon.

### 1.4. Ruang Lingkup
Ruang lingkup proyek aplikasi Log_Book_Rapat KEK dibatasi pada:
1. Pengelolaan data master biro, tim kerja internal KEK, dan akun pengguna dengan kontrol peran (*Super Admin, Admin Biro, Staff/PIC*).
2. Registrasi dan penjadwalan rapat dinas baru dengan otomasi penomoran urut berbasis biro.
3. Manajemen presensi kehadiran peserta rapat (*Invited, Present, Absent, Excused*).
4. Pencatatan notulensi digital (agenda, dinamika sidang, arahan pimpinan, dan kesimpulan) beserta audit trail perubahannya.
5. Perumusan dan pemantauan butir tindak lanjut (*action items*) dengan penugasan PIC dan tenggat waktu (*due date*).
6. Dashboard monitoring eksekutif dengan filter periode waktu dinamis (*Hari Ini, Minggu Ini, Bulan Ini, Semua*).
7. Pembuatan dan ekspor dokumen PDF risalah resmi ber-QR Code.

---

# BAB II LANDASAN TEORI

### 2.1. Umum
Sub-bab ini memuat konsep umum mengenai sistem informasi, siklus hidup pengembangan sistem, dan pentingnya tata kelola rapat kedinasan di instansi kepemerintahan:
1. **Sistem Informasi:** Kombinasi terorganisasi dari manusia, perangkat keras, perangkat lunak, jaringan komunikasi, dan sumber daya data yang mengumpulkan, mengubah, dan menyebarkan informasi dalam suatu organisasi.
2. **Aplikasi Berbasis Web:** Program perangkat lunak yang diakses melalui peramban web (*web browser*) menggunakan jaringan internet atau intranet dengan arsitektur klien-server (*client-server*).

### 2.2. Teori Pendukung
Sub-bab ini menguraikan teori-teori teknis yang menjadi fondasi pembangunan Log_Book_Rapat KEK:
1. **Next.js 15 & React Server Components (RSC):** Framework fullstack modern berbasis React yang mendukung kompilasi sisi server (*Server-Side Rendering*) dan Server Actions untuk eksekusi mutasi data tanpa memerlukan API REST terpisah.
2. **TypeScript:** Bahasa pemrograman bertipe ketat (*strictly typed*) superset dari JavaScript yang meminimalisir kesalahan *runtime* pada skala produksi.
3. **Neon Serverless PostgreSQL:** Basis data relasional *cloud-native* berbasis PostgreSQL 16 dengan fitur konkurensi tinggi, *connection pooling*, dan kepatuhan prinsip ACID (*Atomicity, Consistency, Isolation, Durability*).
4. **Prisma ORM:** *Object-Relational Mapping* generasi baru untuk Node.js dan TypeScript yang menyederhanakan akses basis data melalui skema deklaratif (`schema.prisma`) dan kueri terparameter anti-SQL Injection.
5. **Unified Modeling Language (UML):** Bahasa visual standar untuk merancang sistem berorientasi objek yang mencakup Use Case Diagram, Activity Diagram, Class Diagram, dan Sequence Diagram.
6. **Entity Relationship Diagram (ERD):** Pemodelan data konseptual yang menggambarkan entitas, atribut, dan hubungan relasi antar-entitas (menggunakan Notasi Chen dan Notasi Crow's Foot).
7. **Logical Record Structure (LRS):** Representasi struktur rekaman logis dari relasi antar-tabel dalam bentuk ternormalisasi (3NF).
8. **Black Box Testing:** Metode pengujian perangkat lunak yang berfokus pada pengujian persyaratan fungsional program tanpa perlu mengetahui struktur internal kode.

---

# BAB III PEMBAHASAN

### 3.1. Tinjauan Umum
Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus (Setjen DN KEK) dibentuk berdasarkan Undang-Undang Nomor 39 Tahun 2009 tentang Kawasan Ekonomi Khusus. Setjen DN KEK bertugas memberikan dukungan teknis dan administratif kepada Dewan Nasional KEK dalam merumuskan kebijakan, menetapkan standar operasional, memantau kemajuan investasi, dan mengevaluasi kinerja Kawasan Ekonomi Khusus di seluruh Indonesia.

Struktur organisasi Setjen DN KEK dipimpin oleh Sekretaris Jenderal dan membawahi unit kerja Eselon II (Biro), antara lain Biro Perencanaan dan Fasilitasi Kebijakan, Biro Investasi dan Kerjasama, serta Biro Hukum, Humas, dan Tata Usaha, yang masing-masing memiliki tim kerja teknis fungsional.

### 3.2. Pembuatan Program

#### 3.2.1. Software Editor
Perangkat lunak editor dan utilitas yang digunakan selama proses pengembangan Log_Book_Rapat KEK meliputi:
a. **Editor Kode Utama:** Visual Studio Code / Antigravity IDE (v1.90+) dengan ekstensi Prisma, Tailwind CSS IntelliSense, ESLint, dan Prettier.
b. **Node.js Runtime & Package Manager:** Node.js v20 LTS dan npm sebagai pengelola dependensi pustaka.
c. **Database Management Tool:** Neon Database Web Console dan Prisma Studio untuk inspeksi visual data tabel PostgreSQL.
d. **Alat Perancangan Diagram (UML & Basis Data):** Draw.io (diagrams.net Desktop v24) dan Draw.io MCP Tool untuk pembuatan berkas `.drawio` terstandarisasi.
e. **Peramban Web Pengujian:** Google Chrome DevTools dan Microsoft Edge untuk inspeksi antarmuka responsif dan pengujian kinerja sistem.

#### 3.2.2. Design Program
Perancangan program dimodelkan secara komprehensif menggunakan notasi UML resmi:

a. **Use Case Diagram ([`docs/USE_CASE_Log_Book_Kegiatan.drawio`](file:///c:/Users/nappz/Documents/Magang/Projek%20Web%20Pencatatan%20Kegiatan/docs/USE_CASE_Log_Book_Kegiatan.drawio)):**
   1) **Aktor Sistem:** Memodelkan 3 aktor berjenjang (*Staf Pelaksana PIC*, *Admin Biro/Tim*, dan *Super Admin/Pimpinan*).
   2) **Batasan Modul Sistem:** Terdiri dari 5 modul fungsional (*Autentikasi*, *Manajemen Log Book Kegiatan*, *Pengelolaan Pihak Terkait*, *Matriks Tindak Lanjut & PIC*, dan *Monitoring Eksekutif*).
   3) **Daftar Use Case:** Terdiri dari 12 use case terdefinisi (`UC-01` s.d `UC-12`) yang memodelkan seluruh fungsionalitas pencatatan log book kegiatan tanpa presensi fisik dan dengan 3 status tahapan progres resmi (`Belum Dimulai`, `Dalam Proses`, `Selesai`).

b. **Activity Diagram ([`docs/ACTIVITY_DIAGRAM_Log_Book_Kegiatan.drawio`](file:///c:/Users/nappz/Documents/Magang/Projek%20Web%20Pencatatan%20Kegiatan/docs/ACTIVITY_DIAGRAM_Log_Book_Kegiatan.drawio)):**
   Menggunakan *Swimlane Table Layout* terstandarisasi yang memodelkan 3 proses bisnis utama:
   1) **Alur Pencatatan & Penjadwalan Kegiatan Baru:** Alur registrasi kegiatan oleh Admin Biro, verifikasi data, penerbitan nomor registrasi unik otomatis (`REG-xxx`), status awal `Belum Dimulai`, sinkronisasi kalender, serta transisi ke `Dalam Proses` saat kegiatan dilaksanakan.
   2) **Alur Pencatatan Dokumen & Catatan Hasil Kegiatan:** Alur pengunggahan berkas eviden (undangan, nota konsumsi, materi paparan, tautan berita/drive), input ringkasan catatan hasil kegiatan, validasi format berkas (< 10MB), penyimpanan repositori cloud terstruktur, pengaktifan unduh rekapitulasi PDF resmi, serta peninjauan pimpinan.
   3) **Alur Monitoring Status Kegiatan & Tindak Lanjut:** Alur perumusan butir tindak lanjut (*action items*), penunjukan PIC dan tenggat waktu (*due date*), pembaruan 3 tahapan status oleh PIC (`Belum Dimulai` &rarr; `Dalam Proses` &rarr; `Selesai`), pencatatan audit log, serta agregasi KPI pada Dashboard Eksekutif.

c. **Class Diagram ([`docs/CLASS_DIAGRAM_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/CLASS_DIAGRAM_Log_Book_Rapat.drawio)):**
   1) **Struktur Kelas 3-Kompartemen:** Memodelkan 14 kelas entitas dengan kompartemen Nama Kelas, Atribut (PK/FK), dan Metode Layanan (*Service Methods*).
   2) **Enumerasi Sistem:** 4 enumerasi tipe data status (`PeranPengguna`, `StatusKegiatan`, `StatusKehadiran`, `StatusTindakLanjut`).
   3) **Relasi Antar-Kelas:** Menerapkan relasi komposisi (`*--`), asosiasi berarah (`-->`), dan kardinalitas multiplisitas (`1`, `0..1`, `1..*`).

d. **Sequence Diagram ([`docs/SEQUENCE_DIAGRAM_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/SEQUENCE_DIAGRAM_Log_Book_Rapat.drawio)):**
   1) **SD-01 (Penjadwalan Rapat Baru & Penomoran Otomatis):** Interaksi kronologis antara Admin, `BuatRapatPage`, `meetingAction`, `penomoran_rapat_biro` (pessimistic lock), `rapat`, `peserta_rapat`, dan `notifikasi`.
   2) **SD-02 (Penyusunan Risalah & Validasi Notulensi):** Interaksi antara Notulis, `NotulensiEditorPage`, `minutesAction`, `notulen_rapat`, `riwayat_notulen` (audit log), `rapat`, dan `PdfGeneratorService`.
   3) **SD-03 (Monitoring & Pembaruan Status Tindak Lanjut):** Interaksi antara PIC, `TindakLanjutPage`, `actionItemAction`, `tindak_lanjut`, `riwayat_tindak_lanjut`, `notifikasi`, dan Pimpinan Sidang.

e. **Perancangan Antarmuka Pengguna (*User Interface Design*):**
   1) **Halaman Dashboard Monitoring Eksekutif:** Visualisasi metrik KPI, kartu status rapat dinas, dan grafik capaian tugas tim.
   2) **Halaman Formulir Registrasi Rapat Baru:** Antarmuka input data agenda, pemilihan unit kerja biro/tim, penguncian nomor urut otomatis, dan unggah lampiran.
   3) **Halaman Editor Notulensi Rapat Dinamis:** Antarmuka pencatatan poin dinamika sidang, arahan pimpinan, serta audit riwayat perubahan.
   4) **Halaman Matriks Tindak Lanjut:** Antarmuka Kanban dan tabel interaktif bagi staf PIC untuk memantau batas waktu (*due date*) dan melaporkan progres 100%.

#### 3.2.3. Database* (Perancangan Basis Data Relasional)
Perancangan basis data relasional disusun untuk memenuhi Bentuk Normal Ketiga (3NF) guna mencegah anomali:
a. **Entity Relationship Diagram (ERD) ([`docs/ERD_Log_Book_Kegiatan.drawio`](file:///c:/Users/nappz/Documents/Magang/Projek%20Web%20Pencatatan%20Kegiatan/docs/ERD_Log_Book_Kegiatan.drawio)):**
   1) **ERD Notasi Chen Resmi:** Menampilkan 9 Entitas Persegi Panjang aktif, relasi Belah Ketupat, atribut elips dengan garis bawah untuk Primary Key (`PK`), dan kardinalitas berpanah (`1:N`, `1:1`).
   2) **Eliminasi Entitas Kosong:** Tabel-tabel yang tidak memiliki data riil (0 rows seperti `notulen_kegiatan`, `komentar_notulen`, `riwayat_notulen`, `penomoran_kegiatan_biro`, dan `kegiatan_biro`) dieliminasi.
b. **Logical Record Structure (LRS) ([`docs/LRS_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Magang/Projek%20Web%20Pencatatan%20Kegiatan/docs/LRS_Log_Book_Rapat.drawio)):**
   Memetakan struktur rekaman logis tabel dengan penempatan Foreign Key yang konsisten dan kardinalitas tepat (1..N).
c. **Spesifikasi Basis Data (Data Dictionary):**
   Memuat rincian struktur field, tipe data, dan keterangan eksplisit untuk setiap *Primary Key* (PK) dan *Foreign Key* (FK) pada tabel aktif skema aplikasi (Tabel III.1 s/d III.8):
   1) `pengguna` (Tabel III.1: `id_pengguna` [PK], `id_biro` [FK Biro], `id_tim` [FK Tim])
   2) `biro` (Tabel III.2: `id_biro` [PK Unit Eselon II])
   3) `tim_biro` (Tabel III.3: `id_tim` [PK], `id_biro` [FK Biro Induk])
   4) `kegiatan` (Tabel III.4: `id_rapat` [PK], `id_biro` [FK Pemrakarsa], `id_tim` [FK Tim], `id_pengguna` [FK Pimpinan Kegiatan], `id_notulis` [FK Pencatat Log])
   5) `peserta_kegiatan` (Tabel III.5: `id_peserta` [PK], `id_rapat` [FK Kegiatan], `id_pengguna` [FK Aparatur/Peserta Terkait])
   6) `riwayat_tindak_lanjut` (Tabel III.6: `id_riwayat` [PK], `id_tindak_lanjut` [FK Tindak Lanjut], `id_pengguna` [FK Aparatur PIC])
   7) `tindak_lanjut` (Tabel III.7: `id_tindak_lanjut` [PK], `id_rapat` [FK Kegiatan], `id_biro` [FK Biro PJ], `id_tim` [FK Tim PJ], `id_pengguna` [FK Staf Aparatur PIC])
   8) `lampiran_kegiatan` (Tabel III.8: `id_lampiran` [PK], `id_rapat` [FK Kegiatan Pemilik Berkas])
   *Serta entitas pendukung aktif `notifikasi` (Tabel III.9: notifikasi pesan sistem).*

#### 3.2.4. Kode Program
Struktur arsitektur kode program pada Log_Book_Rapat KEK disusun menggunakan pola *Next.js 15 App Router*:
a. **Struktur Direktori Proyek:**
   1) `app/`: Menangani rute antarmuka pengguna (`dashboard/`, `semua-rapat/`, `buat-rapat/`, `notulensi/`, `tindak-lanjut/`).
   2) `app/actions/`: Lapisan *Server Actions* untuk penanganan logika bisnis mutasi data (`meetingActions.ts`, `minutesActions.ts`, `actionItemActions.ts`).
   3) `components/`: Komponen UI modular (*Dialog, Toast, Button, Badge, Card, Table*).
   4) `lib/`: Modul inisialisasi koneksi `prisma.ts` dan utilitas format tanggal/angka.
   5) `prisma/schema.prisma`: Deklarasi model skema 14 tabel basis data PostgreSQL.
b. **Koneksi Basis Data:** Menggunakan Prisma Client yang terhubung dengan *connection pooling* PgBouncer pada Neon Serverless PostgreSQL.
c. **Middleware Otorisasi:** Menggunakan NextAuth.js v5 pada `middleware.ts` untuk membatasi hak akses rute halaman berdasarkan peran akun pengguna (*Role-Based Access Control*).

### 3.3. Evaluasi Program (Black Box Testing)
Pengujian sistem dilakukan menggunakan metode **Black Box Testing** untuk memverifikasi fungsionalitas tombol, validasi formulir, dan integritas transaksi basis data:
a. **Metode Pengujian:** Pengujian *Black Box* difokuskan pada spesifikasi fungsional perangkat lunak tanpa memeriksa jalur kode internal.
b. **Tabel Hasil Pengujian Fungsional Sistem:**

| No | Modul / Kasus Uji | Skenario Pengujian | Hasil yang Diharapkan | Hasil Pengujian | Status |
|:---:|:---|:---|:---|:---|:---:|
| 1 | **Login Sistem** | Input email & kata sandi yang valid | Sistem mengotentikasi sesi dan mengarahkan ke Dashboard sesuai hak akses peran | Berhasil masuk ke Dashboard sesuai peran | **Valid** |
| 2 | **Generator Nomor Rapat** | Memilih unit kerja Biro pada formulir rapat | Nomor registrasi otomatis terisi urut tanpa duplikasi (contoh: `INV-015`) | Nomor urut terisi otomatis dan terkunci | **Valid** |
| 3 | **Penjadwalan Rapat** | Mengisi metadata rapat lengkap dan klik 'Jadwalkan Rapat' | Record tersimpan ke tabel `rapat`, `peserta_rapat`, dan notifikasi terbit | Notifikasi sukses muncul & data tampil di repositori | **Valid** |
| 4 | **Pencatatan Notulensi** | Notulis mengetik poin pembahasan dan menyimpan draf | Data JSON tersimpan di tabel `notulen_rapat` dan audit trail tercatat di `riwayat_notulen` | Draf tersimpan dan riwayat audit bertambah | **Valid** |
| 5 | **Pengesahan Risalah** | Pimpinan menelaah draf dan klik tombol 'Setujui Risalah' | Status rapat berubah dari `REVIEW` menjadi `APPROVED` / `FINAL` | Status berubah & tombol ekspor PDF aktif | **Valid** |
| 6 | **Pembaruan Tindak Lanjut** | Staf PIC mengunggah bukti dan mengubah status ke `COMPLETED` | Progres terbarui 100%, status selesai, dan notifikasi verifikasi terkirim ke Pimpinan | Status tugas hijau & log progres tercatat | **Valid** |
| 7 | **Filter Dashboard** | Memilih filter waktu 'Minggu Ini' pada Dashboard | Menampilkan kartu metrik dan daftar rapat khusus minggu berjalan | Data tersaring akurat sesuai rentang tanggal | **Valid** |

### 3.4. Spesifikasi Perangkat

#### 3.4.1. Perangkat Keras (*Hardware*)
Spesifikasi perangkat keras minimum yang digunakan untuk membangun dan menjalankan Log_Book_Rapat KEK:
a. **Prosesor:** Intel Core i5 / AMD Ryzen 5 (4 Cores, 2.5 GHz ke atas).
b. **Memori RAM:** 8 GB DDR4 (disarankan 16 GB).
c. **Media Penyimpanan:** Solid State Drive (SSD) 256 GB (tersisa ruang minimum 20 GB).
d. **Layar / Monitor:** Resolusi Full HD (1920 &times; 1080 piksel).
e. **Perangkat Masukan & Jaringan:** Keyboard, Mouse, dan Koneksi Internet (kecepatan minimum 10 Mbps).

#### 3.4.2. Perangkat Lunak (*Software*)
Spesifikasi perangkat lunak yang mendukung berjalannya sistem:
a. **Sistem Operasi:** Microsoft Windows 11 Pro 64-bit / Linux Ubuntu 22.04 LTS.
b. **Lingkungan Runtime:** Node.js v20.x LTS.
c. **Bahasa Pemrograman:** TypeScript 5.x & JavaScript ES6+.
d. **Web Framework:** Next.js 15 (React 19).
e. **Basis Data:** Neon Serverless PostgreSQL (PostgreSQL 16 Engine).
f. **Object-Relational Mapping (ORM):** Prisma ORM v5.x.
g. **Peramban Web Klien:** Google Chrome, Mozilla Firefox, atau Microsoft Edge versi terbaru.

---

# BAB IV PENUTUP

### 4.1. Kesimpulan
Berdasarkan hasil analisis, perancangan, implementasi, dan pengujian yang telah dilaksanakan pada proyek aplikasi Log_Book_Rapat KEK di lingkungan Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus, dapat disimpulkan bahwa:
1. Sistem Informasi Log & Notula Rapat (Log_Book_Rapat KEK) berhasil dibangun menggunakan arsitektur web modern Next.js 15 dan basis data relasional PostgreSQL (Neon DB) yang terintegrasi secara *fullstack*.
2. Implementasi fitur generator nomor urut rapat otomatis berhasil meniadakan redundansi dan tumpang tindih (*overlap*) kode registrasi agenda dinas lintas biro dan tim kerja.
3. Modul penyusunan risalah notulensi digital dengan pencatatan *audit trail* versi naskah menjamin integritas, transparansi, dan kecepatan distribusi arahan pimpinan rapat.
4. Matriks monitoring tindak lanjut (*action items*) memungkinkan staf PIC dan pimpinan memantau progres realisasi mandat kerja secara *real-time*, sehingga menekan tingkat keterlambatan pekerjaan (*overdue*).
5. Hasil pengujian *Black Box Testing* membuktikan seluruh fungsi utama sistem beroperasi secara valid dan siap diimplementasikan untuk mendukung birokrasi pemerintahan digital (*e-government*).

### 4.2. Saran
Untuk pengembangan sistem lebih lanjut di masa mendatang, disarankan beberapa hal sebagai berikut:
1. Mengintegrasikan sistem dengan layanan *WhatsApp Business API* atau bot *Telegram* untuk pengiriman pengingat (*reminder*) otomatis menjelang batas waktu tenggat penugasan PIC.
2. Menambahkan fitur *Digital Signature* berbasis sertifikat elektronik (BSrE - BSSN) pada berkas PDF risalah rapat resmi untuk pengesahan berkekuatan hukum penuh.
3. Mengembangkan modul *Voice-to-Text* (Speech Recognition AI) pada editor notulensi guna membantu notulis mentranskripsikan rekaman audio dinamika rapat secara otomatis.

---

## DAFTAR PUSTAKA
1. Pressman, R. S., & Maxim, B. R. (2020). *Software Engineering: A Practitioner's Approach* (9th ed.). New York: McGraw-Hill Education.
2. Sommerville, I. (2019). *Software Engineering* (10th ed.). Boston: Pearson.
3. Fowler, M. (2018). *UML Distilled: A Brief Guide to the Standard Object Modeling Language* (3rd ed.). Boston: Addison-Wesley.
4. Vercel Inc. (2025). *Next.js Documentation and App Router Architecture*. Diakses dari https://nextjs.org/docs.
5. Prisma Data Inc. (2025). *Prisma ORM Reference & PostgreSQL Connector Documentation*. Diakses dari https://www.prisma.io/docs.
6. Neon Inc. (2025). *Serverless PostgreSQL Architecture & Connection Pooling Guide*. Diakses dari https://neon.tech/docs.
7. Al Maulana, H., dkk. (2023). *Rancang Bangun Sistem Informasi Log Rapat Berbasis Web*. Jurnal Rekayasa Sistem dan Teknologi Informasi, 7(3), 112-120.
8. Simatupang, R., & Widya, A. (2024). *Implementasi Server Actions dan Server Components pada Aplikasi Notulensi Elektronik*. Jurnal Teknologi Informasi dan Ilmu Komputer, 11(2), 245-256.

---

## DAFTAR RIWAYAT HIDUP
* **Nama Lengkap:** Rizki Agustianto
* **NIM:** 15230292
* **Program Studi:** Informatika (S1)
* **Fakultas:** Teknik dan Informatika
* **Perguruan Tinggi:** Universitas Bina Sarana Informatika (UBSI)
* **Unit Kerja Magang/PKL:** Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus (Setjen DN KEK RI)
* **Periode Magang:** Semester Gasal Tahun Akademik 2026/2027

---

*Laporan Praktik Kerja Lapangan (PKL) resmi disusun berdasarkan Pedoman PKL UBSI Tahun 2026 Halaman 30–31 No. 3 (Outline Pembuatan Project Aplikasi).*
