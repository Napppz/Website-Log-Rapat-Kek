# DOKUMEN TEKNIS
# PENGEMBANGAN WEBSITE LOG & NOTULA RAPAT (Log_Book_Rapat KEK)
### SEKRETARIAT JENDERAL DEWAN NASIONAL KAWASAN EKONOMI KHUSUS REPUBLIK INDONESIA

---

> [!TIP]
> **Struktur Resmi Laporan PKL UBSI (Pedoman PKL 2026 Halaman 30-31 No. 3 - Outline Pembuatan Project Aplikasi):**  
> Untuk penulisan Laporan PKL yang 100% mengikuti bab dan sub-bab resmi program studi Informatika S1 (BAB I PENDAHULUAN, BAB II LANDASAN TEORI, BAB III PEMBAHASAN [3.1 Tinjauan Umum, 3.2 Pembuatan Program (3.2.1 Software Editor, 3.2.2 Design Program, 3.2.3 Kode Program, 3.2.4 Database*), 3.3 Evaluasi Program, 3.4 Spesifikasi Perangkat], BAB IV PENUTUP), silakan merujuk pada dokumen induk:  
> **[`docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md)**.

---

## 1. Pendahuluan

### 1.1. Latar Belakang
Dalam rangka mendukung tata kelola pemerintahan yang efektif, transparan, dan akuntabel di lingkungan Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus (Setjen DN KEK), pelaksanaan koordinasi dan perumusan kebijakan strategis memerlukan sistem pendokumentasian yang andal. Setiap agenda rapat koordinasi dinas, perumusan regulasi kawasan, percepatan investasi hilirisasi, serta fasilitasi kerja sama ekonomi menghasilkan keputusan-keputusan krusial yang harus dicatat, ditindaklanjuti, dan dipertanggungjawabkan secara tepat waktu.

Selama ini, pengelolaan log rapat dinas, penyusunan risalah notulensi, dan pemantauan butir tindak lanjut (*action items*) yang masih dilakukan secara konvensional atau terpisah-pisah menimbulkan beberapa kendala administratif, antara lain:
1. Terjadinya redudansi dan ketidaksinkronan penomoran registrasi agenda rapat dinas lintas biro/tim kerja.
2. Keterlambatan distribusi risalah dan arahan pimpinan kepada tim kerja atau pejabat penanggung jawab (*Person-in-Charge / PIC*).
3. Sulitnya pimpinan melakukan pemantauan (*monitoring*) progres realisasi tindak lanjut hasil rapat dinas secara *real-time*.
4. Hilangnya jejak audit (*audit trail*) riwayat perubahan naskah notulensi rapat.

Oleh karena itu, diperlukan pengembangan **Sistem Informasi Log & Notula Rapat (Log_Book_Rapat KEK)** berbasis web modern yang mampu mengintegrasikan seluruh tahapan mulai dari penjadwalan rapat, pencatatan presensi, penyusunan notulensi terstruktur, pengesahan risalah, hingga pemantauan status penyelesaian tindak lanjut (*action items*) dalam satu ekosistem terpadu.

Pengembangan website Log_Book_Rapat KEK ini diharapkan dapat meningkatkan produktivitas aparatur, mempercepat proses tindak lanjut keputusan pimpinan, serta mendukung prinsip akuntabilitas kinerja instansi pemerintah.

### 1.2. Tujuan Dokumen
Dokumen teknis ini disusun dengan tujuan untuk:
a. Menjadi acuan baku dalam pengembangan, pengujian, dan pengelolaan website Log_Book_Rapat KEK.  
b. Memberikan gambaran menyeluruh terkait arsitektur sistem, alur proses bisnis, dan desain antarmuka.  
c. Mendokumentasikan struktur logika sistem, skema basis data (*database*), serta hubungan relasional data.  
d. Memudahkan proses pemeliharaan sistem (*maintenance*) dan pengembangan fitur lanjutan di masa mendatang.  
e. Menjadi dokumen referensi utama bagi tim teknis, pengembang (*developer*), dan pemangku kepentingan (*stakeholders*) Setjen DN KEK serta laporan Tugas Akhir / Skripsi.

### 1.3. Ruang Lingkup Sistem
Ruang lingkup pengembangan website Log_Book_Rapat KEK mencakup seluruh proses manajemen rapat dinas berbasis elektronik, antara lain:
a. Pengelolaan agenda dan penjadwalan rapat dinas (judul, tanggal, waktu, lokasi, kategori naskah, dan lampiran).  
b. Otomasi penomoran urut rapat dinas berbasis kode tim kerja pemrakarsa (*Biro Meeting Sequence*).  
c. Pengelolaan daftar kehadiran dan konfirmasi presensi peserta rapat dinas.  
d. Penyusunan risalah notulensi rapat terstruktur (agenda, dinamika sidang, arahan pimpinan, dan kesimpulan).  
e. Pengesahan (*approval*) dan penerbitan naskah notulensi resmi.  
f. Perumusan dan pemantauan butir tindak lanjut (*action items*) dengan penugasan PIC dan tenggat waktu (*due date*).  
g. Pelacakan (*tracking*) status progres tindak lanjut (*Pending*, *In Progress*, *Completed*, *Overdue*).  
h. Pencatatan log riwayat pembaruan progres dan jejak audit versi notulensi.  
i. Dashboard monitoring eksekutif dengan filter periode dinamis (*Hari Ini, Minggu Ini, Bulan Ini, Semua Periode*).  
j. Manajemen data master pengguna (*users*), biro, dan tim kerja internal KEK.  
k. Ekspor laporan risalah rapat dan nota dinas ke dalam format dokumen resmi.

### 1.4. Definisi Istilah
Berikut beberapa istilah teknis dan administratif yang digunakan dalam dokumen ini:
a. **Setjen DN KEK:** Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus Republik Indonesia.  
b. **Log_Book_Rapat KEK:** Sistem Informasi Log & Notula Rapat berbasis web terintegrasi di lingkungan Setjen KEK.  
c. **Biro Pemrakarsa:** Unit kerja setingkat eselon II yang menyelenggarakan atau menginisiasi agenda rapat dinas.  
d. **Tim Kerja KEK:** Sub-unit kerja teknis di bawah biro (misalnya: Tim Investasi & Hilirisasi, Tim Kerja Sama, Tim Komunikasi Publik).  
e. **Notulis:** Aparatur atau staf yang ditugaskan mencatat jalannya rapat dinas dan menyusun draf notulensi.  
f. **Pimpinan Rapat:** Pejabat pimpinan yang memimpin sidang koordinasi dan memberikan arahan keputusan.  
g. **Tindak Lanjut (*Action Items*):** Butir instruksi penugasan atau mandat pekerjaan hasil keputusan rapat dinas yang dibebankan kepada staf PIC.  
h. **PIC (*Person-in-Charge*):** Staf pelaksana yang ditugaskan bertanggung jawab menuntaskan butir tindak lanjut sebelum tenggat waktu.  
i. **Nomor Rapat:** Kode registrasi urut unik rapat dinas (contoh format: `INV-015`, `KS-008`).  
j. **Frontend:** Antarmuka pengguna (*User Interface*) berbasis web reaktif tempat pengguna berinteraksi dengan sistem.  
k. **Backend:** Lapisan logika bisnis, validasi, otorisasi, dan interaksi basis data yang memproses seluruh transaksi aplikasi.

---

## 2. Gambaran Umum Sistem

### 2.1. Deskripsi Sistem
Website Log_Book_Rapat KEK merupakan sistem informasi manajemen operasional rapat dinas yang dirancang untuk mendukung tertib administrasi dan akuntabilitas tindak lanjut keputusan di lingkungan Setjen KEK RI. Sistem ini memungkinkan pimpinan, admin biro, notulis, dan staf pelaksana bekerja dalam satu platform kolaboratif tanpa hambatan komunikasi manual.

Sistem dirancang terintegrasi secara *fullstack* memanfaatkan teknologi Next.js App Router modern dengan basis data relasional PostgreSQL (Neon DB). Data agenda rapat, daftar presensi, naskah risalah, dan butir penugasan tersimpan dalam skema terstruktur ternormalisasi (3NF), memastikan keutuhan (*integrity*) data dan kecepatan pelaporan.

### 2.2. Aktor / Pengguna Sistem
Sistem melibatkan 3 kelompok peran (*roles*) pengguna dengan tingkat kewenangan yang berbeda:
1. **Staf Pelaksana (*Staff / PIC*):**
   * Mengakses dashboard operasional staf.
   * Meninjau agenda rapat dinas yang mengundang dirinya dan melakukan konfirmasi kehadiran.
   * Meninjau butir tindak lanjut (*action items*) yang ditugaskan kepadanya.
   * Memperbarui status pengerjaan (*In Progress / Completed*), mengunggah berkas bukti, dan menambahkan catatan progres.
2. **Admin Biro / Notulis Rapat (*Admin*):**
   * Membuat dan menjadwalkan agenda rapat dinas baru.
   * Mengatur nomor urut rapat otomatis dan mengunggah dokumen naskah dinas.
   * Menginput peserta rapat dan memantau status presensi.
   * Mencatat dinamika sidang rapat, menyusun draf notulensi, dan merumuskan butir tindak lanjut beserta penetapan PIC.
   * Mengajukan draf notulensi untuk disahkan oleh pimpinan.
   * Mengunduh atau mencetak risalah rapat resmi.
3. **Super Admin / Pimpinan (*Super Admin*):**
   * Memiliki hak akses penuh (*full access*) ke seluruh data rapat dinas lintas biro dan tim kerja.
   * Mengakses Dashboard Monitoring Eksekutif untuk memantau KPI penyelesaian tugas tiap tim kerja secara *real-time*.
   * Mengesahkan (*approve*) naskah risalah notulensi rapat dinas.
   * Melakukan audit penugasan dan eskalasi pada butir pekerjaan yang mengalami keterlambatan (*overdue*).
   * Mengelola data master sistem (data akun pengguna, struktur biro, dan tim kerja).

---

### 2.3. Alur Proses Utama (Activity Diagram)

Alur proses bisnis utama pada Log_Book_Rapat KEK dimodelkan dalam bentuk **UML Activity Diagram dengan Swimlane Tabel 3 Kolom** (*Aktor 1 | System | Aktor 2*), mengadopsi standar baku visualisasi skripsi dengan kotak tindakan hijau, proses otomatis sistem ungu, titik keputusan kuning, dan status notifikasi merah putus-putus.

#### a. Alur Penjadwalan Rapat Dinas

Alur ini memodelkan proses ketika Admin Biro/Tim menjadwalkan agenda rapat baru hingga undangan terbit dan status rapat selesai:

```
+----------------------------------------------------------------------------------------------------+
|                                    Alur Penjadwalan Rapat Dinas                                    |
+------------------------------------+--------------------------+------------------------------------+
|          Admin Biro / Tim          |          System          |      Pimpinan & Peserta Rapat      |
+------------------------------------+--------------------------+------------------------------------+
|  (● Start)                         |                          |                                    |
|         │                          |                          |                                    |
|  [memilih form buat rapat & tim] ──┼─> [generate nomor rapat] │                                    |
|                                    │           │              │                                    |
|  [mengisi data agenda & peserta] <─┼───────────┘              │                                    |
|         │                          |                          |                                    |
|  [klik "Jadwalkan Rapat"] ─────────┼─> <verifikasi data?>     |                                    |
|                                    |      │           │       |                                    |
|                                    | (Tidak)         (Ya)     |                                    |
|                                    |      │           │       |                                    |
|                                    | [status: REJECT] ┼───────┼─> [edit status: SCHEDULED]         |
|                                    |                  │       |          │                         |
|  [notifikasi rapat dijadwalkan] <──┼──────────────────┴───────┼──────────┤                         |
|                                    |                          |  [menerima notifikasi undangan]    |
|                                    |                          |          │                         |
|                                    |                          |  <konfirmasi kehadiran?>           |
|                                    |                          |    │              │                |
|                                    |                          | (Izin)         (Hadir)             |
|                                    |                          |    │              │                |
|                                    |                          | [EXCUSED]      [PRESENT]           |
|  [notifikasi konfirmasi presensi] <┼──────────────────────────┼────┴──────────────┘                |
|                                    |                          |          │                         |
|                                    |                          |  [Rapat Dilaksanakan & Materi]     |
|                                    |                          |          │                         |
|                                    |                          |  <rapat selesai terlaksana?>       |
|                                    |                          |    │              │                |
|                                    |                          | (Tidak)          (Ya)              |
|                                    |                          |    │              │                |
|                                    |                          | [Reschedule]   [edit: FINAL/DONE]  |
|  [notifikasi pelaksanaan selesai] <┼──────────────────────────┼───────────────────┘                |
|         │                          |                          |                                    |
|   (◉ End)                          |                          |                                    |
+------------------------------------+--------------------------+------------------------------------+
```

#### b. Alur Penyusunan & Pengesahan Notulensi Rapat

Alur ini memodelkan proses notulis mencatat jalannya rapat dinas, penyimpanan draf, telaah pimpinan sidang, pengesahan dokumen resmi, hingga penerbitan butir tindak lanjut:

```
+----------------------------------------------------------------------------------------------------+
|                          Alur Penyusunan & Pengesahan Risalah Notulensi                            |
+------------------------------------+--------------------------+------------------------------------+
|            Notulis Rapat           |          System          |          Pimpinan Sidang           |
+------------------------------------+--------------------------+------------------------------------+
|  (● Start)                         |                          |                                    |
|         │                          |                          |                                    |
|  [mencatat dinamika sidang] ───────┼─> [generate draft JSON]  |                                    |
|                                    │           │              |                                    |
|  [simpan draf & ajukan telaah] <───┼───────────┘              |                                    |
|         │                          |                          |                                    |
|         └──────────────────────────┼─> [edit status: REVIEW] ─┼─> [notifikasi draf siap ditelaah]  |
|                                    |                          |          │                         |
|                                    |                          |  [menelaah isi draf risalah]       |
|                                    |                          |          │                         |
|                                    |                          |  <substansi disetujui?>            |
|                                    |                          |    │              │                |
|                                    |                          | (Revisi)      (Disetujui)          |
|                                    |                          |    │              │                |
|  [notifikasi naskah perlu revisi] <┼── [edit status: REVISI] <┘           [edit status: APPROVED]  |
|         │                          |                                              │                |
|  (perbaiki isi draf notulensi)     |   [generate PDF resmi & QR Code] <───────────┘                |
|                                    |                  │                                            |
|  [notifikasi notula resmi terbit] <┼──────────────────┘                                            |
|                                    |                          <terbitkan tindak lanjut ke tim?>    |
|                                    |                            │              │                   |
|                                    |                          (Tidak)         (Ya)                 |
|                                    |                            │              │                   |
|                                    |                          [Log Book]    [rumuskan butir PIC]      |
|  [notifikasi proses rapat tuntas] <┼───────────────────────────────────────────┘                   |
|         │                          |                                                               |
|   (◉ End)                          |                                                               |
+------------------------------------+--------------------------+------------------------------------+
```

#### c. Alur Monitoring & Pembaruan Tindak Lanjut (PIC)

Alur ini memodelkan perumusan butir mandat keputusan rapat dinas, penomoran tiket penugasan, pengerjaan oleh staf PIC, verifikasi ketepatan waktu, dan penutupan tugas:

```
+----------------------------------------------------------------------------------------------------+
|                       Alur Monitoring & Pembaruan Tindak Lanjut (Action Items)                      |
+------------------------------------+--------------------------+------------------------------------+
|        Staf Pelaksana (PIC)        |          System          |        Pimpinan / Admin Biro       |
+------------------------------------+--------------------------+------------------------------------+
|                                    |                          |  (● Start)                         |
|                                    |                          |         │                          |
|                                    |   [generate ticket PIC] <┼── [rumuskan butir & delegasi PIC]  |
|                                    |           │              |                                    |
|  [notifikasi penugasan baru] <─────┼───────────┘              |                                    |
|         │                          |                          |                                    |
|  [telaah instruksi & target]       |                          |                                    |
|         │                          |                          |                                    |
|  [edit status: ON PROGRESS] ───────┼──────────────────────────┼─> [notifikasi pekerjaan diproses]  |
|         │                          |                          |                                    |
|  <selesai tepat target waktu?>     |                          |                                    |
|    │              │                |                          |                                    |
| (Lewat)        (Tepat)             |                          |                                    |
|    │              │                |                          |                                    |
| [OVERDUE]     [COMPLETED] ─────────┼──────────────────────────┼─> [notifikasi siap verifikasi]     |
|                                    |                          |          │                         |
|                                    |                          |  [evaluasi bukti & hasil kerja]    |
|                                    |                          |          │                         |
|                                    |                          |  <hasil kerja memuaskan?>          |
|                                    |                          |    │              │                |
|                                    |                          | (Perlu Rev)   (Memuaskan)          |
|                                    |                          |    │              │                |
|  (kembali revisi pekerjaan) <──────┼──────────────────────────┼─ [Revisi]    [edit: CLOSED/DONE]   |
|                                    |                          |                   │                |
|  [notifikasi tindak lanjut tuntas]<┼──────────────────────────┼───────────────────┘                |
|         │                          |                          |                                    |
|   (◉ End)                          |                          |                                    |
+------------------------------------+--------------------------+------------------------------------+
```

---

### 2.4. Fitur Utama Sistem
Fitur utama yang diimplementasikan pada website Log_Book_Rapat KEK meliputi:
1. **Formulir Penjadwalan Rapat Dinas:** Registrasi rapat dengan penentuan tim kerja, tanggal, waktu, lokasi fisik/virtual, pimpinan rapat, dan notulis.
2. **Generator Nomor Urut Rapat Otomatis:** Perhitungan otomatis nomor agenda rapat dinas per biro/tim kerja (*misal: INV-015*).
3. **Editor Risalah Notulensi Terstruktur:** Antarmuka khusus pencatatan poin pembahasan, dinamika diskusi, arahan pimpinan, dan kesimpulan rapat.
4. **Matriks Tindak Lanjut (*Action Items Tracker*):** Manajemen butir instruksi kerja yang dilengkapi target tanggal selesai (*due date*) dan penugasan staf PIC.
5. **Dashboard Monitoring Kinerja Eksekutif:** Ringkasan capaian kinerja tim kerja KEK dengan visualisasi kartu statistik, bar progres, dan filter periode waktu (*Hari Ini, Minggu Ini, Bulan Ini, Semua*).
6. **Modul Presensi Kehadiran:** Pencatatan dan rekap kehadiran peserta rapat (*Invited, Present, Absent, Excused*).
7. **Jejak Audit & Riwayat Versi (*Audit Trail*):** Pencatatan riwayat setiap kali notulensi disunting dan catatan log saat status tindak lanjut diperbarui.
8. **Pengelolaan Lampiran Berkas Dinas:** Unggah berkas naskah undangan, bahan tayang paparan, dan bukti tindak lanjut.
9. **Sistem Notifikasi Lintas Pengguna:** Pemberitahuan otomatis ketika terdapat undangan rapat baru atau delegasi tugas tindak lanjut.
10. **Ekspor & Cetak Risalah Resmi:** Fitur cetak dokumen notulensi terformat resmi dan pembuatan nota dinas.

### 2.5. Batasan Sistem
Dalam pengembangannya, sistem website Log_Book_Rapat KEK memiliki beberapa batasan:
1. Sistem dapat diakses melalui jaringan intranet pemerintah maupun jaringan internet publik menggunakan protokol komunikasi aman HTTPS.
2. Pengelolaan hak akses data dibatasi secara ketat berdasarkan peran pengguna (*Super Admin, Admin, Staff*).
3. Validasi keabsahan data bergantung pada data akun yang telah terverifikasi di basis data Setjen KEK.
4. Setiap rapat dinas berada di bawah yurisdiksi satu biro pemrakarsa utama, namun dapat mengundang peserta lintas biro.
5. Dokumen lampiran yang diunggah memiliki batasan ukuran berkas (*file size limit*) maksimal sesuai konfigurasi server.

---

## 3. Arsitektur Sistem

### 3.1. Gambaran Arsitektur Sistem
Website Log_Book_Rapat KEK dibangun menggunakan arsitektur web modern berbasis **Next.js 15 (React Framework) dengan arsitektur Server-Side Rendering (SSR) & React Server Components (RSC)** yang terintegrasi secara *fullstack*. Seluruh logika antarmuka, routing aplikasi, Server Actions, validasi skema, dan komunikasi ORM dijalankan dalam satu kesatuan kode (*unified codebase*) yang sangat efisien dan berkecepatan tinggi.

Interaksi pengguna berlangsung melalui browser web dengan protokol HTTPS. Permintaan (*request*) diproses oleh Next.js Router, mengeksekusi Server Actions atau API Handler, berinteraksi dengan ORM Prisma, melakukan transaksi data ke **PostgreSQL Serverless (Neon DB)**, dan mengembalikan hasil dalam bentuk komponen antarmuka yang reaktif.

```
+-------------------------------------------------------------------------------+
|                             USER INTERFACE LAYER                              |
|       [Browser Web Klien] <─── HTTPS (SSL/TLS) ───> [Next.js App Router]      |
|       • Dashboard Eksekutif  • Form Buat Rapat   • Matriks Tindak Lanjut     |
+-------------------------------------------------------------------------------+
                                        │
                                        ▼
+-------------------------------------------------------------------------------+
|                          APPLICATION BACKEND LAYER                            |
|       • React Server Components (RSC) & Server Actions                        |
|       • Middleware Autentikasi & Otorisasi Peran (NextAuth.js v5)             |
|       • Business Logic & Sequence Generator                                   |
|       • Prisma Client (Object-Relational Mapping / ORM)                       |
+-------------------------------------------------------------------------------+
                                        │
                                        ▼
+-------------------------------------------------------------------------------+
|                            DATABASE STORAGE LAYER                             |
|       • Neon Serverless PostgreSQL (PostgreSQL 15+)                           |
|       • Connection Pooling (PgBouncer) & Direct URL SSL                       |
|       • Relational Tables (14 Entitas 3NF) & Transactional Integrity          |
+-------------------------------------------------------------------------------+
```

### 3.2. Pola Arsitektur Server Components & Actions
Sistem menerapkan pola arsitektur modern Next.js yang membagi tanggung jawab komponen ke dalam:
1. **Server Components:** Bertanggung jawab mengambil data secara langsung di sisi server secara aman tanpa mengekspos kredensial basis data ke browser, serta menghasilkan HTML yang dioptimasi untuk kecepatan *load time*.
2. **Client Components:** Menangani elemen antarmuka yang memerlukan interaktivitas dinamis tinggi, seperti filter tanggal reaktif, modal dialog, *tab switching*, dan animasi transisi.
3. **Server Actions:** Bertindak sebagai *controller* yang menerima mutasi data dari form, menjalankan validasi skema, mengelola transaksi *create/update/delete* pada basis data, dan memicu *revalidation* cache antarmuka secara instan.

### 3.3. Alur Kerja Sistem
Alur kerja pemrosesan data secara umum adalah sebagai berikut:
1. Pengguna mengakses halaman web Log_Book_Rapat KEK melalui peramban.
2. Pengguna memasukkan data transaksi (misalnya menjadwalkan rapat atau memperbarui status tugas).
3. Request dikirimkan secara aman ke server melalui Server Action Next.js.
4. Middleware memverifikasi token sesi dan hak akses peran (*role validation*).
5. Server Action memproses logika bisnis dan memanggil Prisma ORM.
6. Prisma ORM mengeksekusi kueri terparameter (*parameterized SQL query*) ke basis data Neon PostgreSQL.
7. Basis data merespons status transaksi (*commit/rollback*).
8. Komponen antarmuka pengguna diperbarui secara reaktif tanpa perlu memuat ulang seluruh halaman (*hot client-side refresh*).

### 3.4. Technology Stack
Tabel berikut merinci teknologi yang digunakan dalam implementasi website Log_Book_Rapat KEK:

| No | Komponen Sistem | Teknologi yang Digunakan | Keterangan |
|:---:|:---|:---|:---|
| **1** | **Framework Utama** | Next.js 15 (App Router) | Framework React *fullstack* modern dengan Server Components |
| **2** | **Bahasa Pemrograman** | TypeScript 5.x & Node.js 20+ | *Type-safe* JavaScript menjamin keandalan kode tanpa *runtime errors* |
| **3** | **Basis Data** | Neon Serverless PostgreSQL | Database cloud berkinerja tinggi dengan fitur *autoscaling & pooling* |
| **4** | **ORM (Data Access)** | Prisma ORM 5.x | Object-Relational Mapping dengan skema deklaratif (*schema.prisma*) |
| **5** | **Frontend Styling** | Tailwind CSS & Lucide Icons | *Utility-first CSS* dengan sistem desain responsif dan modern |
| **6** | **Autentikasi & Sesi** | NextAuth.js (Auth.js) | Enkripsi JWT (*JSON Web Token*) dengan kontrol peran berbasis sesi |
| **7** | **Web Server & Hosting** | Node.js Runtime / Vercel Serverless | Arsitektur *edge-ready* dengan latensi minimal |
| **8** | **Version Control** | Git & GitHub | Pelacakan versi kode terpusat |

### 3.5. Keamanan Sistem
Aspek keamanan data pada arsitektur Log_Book_Rapat KEK diterapkan secara berlapis:
1. **Proteksi Kredensial & Enkripsi Kata Sandi:** Penyimpanan kata sandi akun menggunakan algoritma *one-way cryptographic hash* (Bcrypt).
2. **Pencegahan SQL Injection:** Seluruh akses kueri basis data dijalankan melalui Prisma ORM dengan *parameterized queries*, mencegah manipulasi SQL berbahaya.
3. **Pencegahan XSS & CSRF:** Next.js Server Actions dan React JSX secara bawaan melakukan *auto-escaping* pada data input/output serta menyematkan proteksi anti-CSRF token pada setiap mutasi data.
4. **Role-Based Access Control (RBAC):** Middleware memvalidasi peran pengguna pada setiap rute halaman (`/dashboard`, `/semua-rapat`, `/buat-rapat`), menolak akses tidak sah.
5. **Koneksi Terenkripsi (TLS/SSL):** Seluruh lalu lintas data antara klien, server web, dan server basis data Neon diwajibkan menggunakan protokol HTTPS dan SSL mode terverifikasi.

---

## 4. Desain Database

Struktur data Log_Book_Rapat KEK disusun dalam model relasional yang telah memenuhi kaidah **Bentuk Normal Ketiga (3NF)** guna mencegah anomali insersi, pembaruan, dan penghapusan data.

Diagram visual relasional kartu (*Card Layout*) dengan header biru navy (`#205493`), baris kunci (*PK & FK*) berlatar biru muda (`#E6F0FA`), dan relasi ortogonal kardinalitas `0..1` &rarr; `*` dapat dilihat pada berkas pratinjau [`public/database-design-preview.html`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/public/database-design-preview.html).

Berikut kamus data terperinci untuk tabel-tabel utama yang membentuk operasional sistem:

#### Tabel 1: `biro` (Master Unit Kerja Biro KEK)
| No | Nama Field | Tipe Data | Keterangan |
|:---:|:---|:---|:---|
| 1 | `id_biro` | Varchar(50) | Primary Key (UUID) |
| 2 | `kode_biro` | Varchar(20) | Kode singkatan unik biro (Unique Key) |
| 3 | `nama_biro` | Varchar(255) | Nama lengkap biro |
| 4 | `nama_singkat` | Varchar(100) | Akronim / nama pendek biro |
| 5 | `deskripsi` | Text | Penjelasan fungsi tugas biro |
| 6 | `status_aktif` | Boolean | Status operasional biro (Default: true) |
| 7 | `dibuat_pada` | Timestamp | Waktu data dibuat |
| 8 | `diperbarui_pada` | Timestamp | Waktu data terakhir diperbarui |

#### Tabel 2: `tim_biro` (Sub-Unit Tim Kerja)
| No | Nama Field | Tipe Data | Keterangan |
|:---:|:---|:---|:---|
| 1 | `id_tim` | Varchar(50) | Primary Key (UUID) |
| 2 | `id_biro` | Varchar(50) | Foreign Key &rarr; `biro.id_biro` |
| 3 | `kode_tim` | Varchar(20) | Kode tim (contoh: `INV`, `KS`, `KOM`) |
| 4 | `nama_tim` | Varchar(150) | Nama lengkap tim kerja |
| 5 | `status_aktif` | Boolean | Status aktif tim kerja |
| 6 | `dibuat_pada` | Timestamp | Waktu pencatatan data |

#### Tabel 3: `pengguna` (Akun Pengguna Sistem)
| No | Nama Field | Tipe Data | Keterangan |
|:---:|:---|:---|:---|
| 1 | `id_pengguna` | Varchar(50) | Primary Key (UUID) |
| 2 | `id_biro` | Varchar(50) | Foreign Key &rarr; `biro.id_biro` |
| 3 | `id_tim` | Varchar(50) | Foreign Key &rarr; `tim_biro.id_tim` (Nullable) |
| 4 | `nama_lengkap` | Varchar(255) | Nama aparatur / pengguna |
| 5 | `email` | Varchar(255) | Alamat email kedinasan (Unique Key) |
| 6 | `kata_sandi` | Varchar(255) | Password terenkripsi (Bcrypt hash) |
| 7 | `peran` | Enum | Peran akses (`SUPER_ADMIN`, `ADMIN`, `STAFF`) |
| 8 | `status_aktif` | Boolean | Status keaktifan akun |

#### Tabel 4: `rapat` (Transaksi Agenda Rapat Dinas)
| No | Nama Field | Tipe Data | Keterangan |
|:---:|:---|:---|:---|
| 1 | `id_rapat` | Varchar(50) | Primary Key (UUID) |
| 2 | `nomor_rapat` | Varchar(50) | Nomor register agenda dinas (Unique Key) |
| 3 | `judul_rapat` | Varchar(255) | Topik agenda rapat dinas |
| 4 | `id_biro` | Varchar(50) | Foreign Key &rarr; `biro.id_biro` (Biro Pemrakarsa) |
| 5 | `id_tim` | Varchar(50) | Foreign Key &rarr; `tim_biro.id_tim` (Tim Pemrakarsa) |
| 6 | `id_pengguna` | Varchar(50) | Foreign Key &rarr; `pengguna.id_pengguna` (Pimpinan Rapat) |
| 7 | `id_notulis` | Varchar(50) | Foreign Key &rarr; `pengguna.id_pengguna` (Notulis) |
| 8 | `id_rapat_sebelumnya` | Varchar(50) | Foreign Key &rarr; `rapat.id_rapat` (Rapat Lanjutan) |
| 9 | `tanggal_rapat` | Timestamp | Tanggal pelaksanaan rapat dinas |
| 10 | `waktu_mulai` | Varchar(10) | Jam mulai rapat (HH:mm) |
| 11 | `waktu_selesai` | Varchar(10) | Jam berakhir rapat (HH:mm) |
| 12 | `lokasi_rapat` | Varchar(255) | Ruang rapat atau tautan video conference |
| 13 | `status_rapat` | Enum | Status (`DRAFT`, `REVIEW`, `APPROVED`, `FINAL`) |
| 14 | `kategori_naskah` | Varchar(100) | Kategori surat dinas |
| 15 | `dibuat_pada` | Timestamp | Waktu registrasi rapat |

#### Tabel 5: `notulen_rapat` (Naskah Risalah Notulensi)
| No | Nama Field | Tipe Data | Keterangan |
|:---:|:---|:---|:---|
| 1 | `id_notulen` | Varchar(50) | Primary Key (UUID) |
| 2 | `id_rapat` | Varchar(50) | Foreign Key &rarr; `rapat.id_rapat` (Unique Key: 1:1) |
| 3 | `poin_pembahasan` | Text | Rangkuman dinamika diskusi rapat |
| 4 | `arahan_pimpinan` | Text | Butir arahan dan instruksi pimpinan sidang |
| 5 | `kesimpulan` | Text | Kesepakatan dan hasil akhir keputusan rapat |
| 6 | `catatan_khusus` | Text | Catatan teknis tambahan |
| 7 | `dibuat_pada` | Timestamp | Waktu naskah notulensi dibuat |

#### Tabel 6: `tindak_lanjut` (Matriks Butir Action Items)
| No | Nama Field | Tipe Data | Keterangan |
|:---:|:---|:---|:---|
| 1 | `id_tindak_lanjut` | Varchar(50) | Primary Key (UUID) |
| 2 | `id_rapat` | Varchar(50) | Foreign Key &rarr; `rapat.id_rapat` |
| 3 | `id_biro` | Varchar(50) | Foreign Key &rarr; `biro.id_biro` |
| 4 | `id_tim` | Varchar(50) | Foreign Key &rarr; `tim_biro.id_tim` |
| 5 | `id_pengguna` | Varchar(50) | Foreign Key &rarr; `pengguna.id_pengguna` (Staf PIC) |
| 6 | `judul_tindak_lanjut` | Varchar(255) | Uraian instruksi tugas pekerjaan |
| 7 | `status_tindak_lanjut` | Enum | Status (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`) |
| 8 | `tenggat_waktu` | Timestamp | Batas akhir penyelesaian (*Due Date*) |
| 9 | `diselesaikan_pada` | Timestamp | Waktu tugas dituntaskan oleh PIC |

#### Tabel 7: `peserta_rapat` (Daftar Undangan & Kehadiran)
| No | Nama Field | Tipe Data | Keterangan |
|:---:|:---|:---|:---|
| 1 | `id_peserta` | Varchar(50) | Primary Key (UUID) |
| 2 | `id_rapat` | Varchar(50) | Foreign Key &rarr; `rapat.id_rapat` |
| 3 | `id_pengguna` | Varchar(50) | Foreign Key &rarr; `pengguna.id_pengguna` |
| 4 | `status_kehadiran` | Enum | Presensi (`INVITED`, `PRESENT`, `ABSENT`, `EXCUSED`) |
| 5 | `dibuat_pada` | Timestamp | Waktu undangan diterbitkan |

#### Tabel 8: `notifikasi` (Log Notifikasi Sistem)
| No | Nama Field | Tipe Data | Keterangan |
|:---:|:---|:---|:---|
| 1 | `id_notifikasi` | Varchar(50) | Primary Key (UUID) |
| 2 | `id_pengguna` | Varchar(50) | Foreign Key &rarr; `pengguna.id_pengguna` (Penerima) |
| 3 | `judul` | Varchar(255) | Judul pemberitahuan |
| 4 | `pesan` | Text | Isi rincian pesan notifikasi |
| 5 | `tipe` | Varchar(50) | Kategori notifikasi (*MEETING_INVITE*, *ACTION_ASSIGNED*) |
| 6 | `sudah_dibaca` | Boolean | Penanda status baca (Default: false) |
| 7 | `dibuat_pada` | Timestamp | Waktu notifikasi terbit |

---

## 5. Struktur Folder Sistem

Sesuai dengan arsitektur Next.js 15 App Router yang digunakan, berikut struktur direktori proyek Log_Book_Rapat KEK:

| No | Folder / File | Keterangan Fungsi |
|:---:|:---|:---|
| **1** | `app/` | Berisi seluruh struktur rute halaman (*App Router*), layout aplikasi, dan Server Actions |
| **2** | `app/dashboard/` | Halaman dashboard utama, metrik statistik, dan monitoring KPI tim kerja |
| **3** | `app/semua-rapat/` | Halaman repositori daftar agenda rapat dinas, filter, dan penelusuran |
| **4** | `app/buat-rapat/` | Halaman formulir registrasi dan penjadwalan rapat dinas baru |
| **5** | `app/notulensi/` | Halaman pencatatan dan penyusunan naskah risalah notulensi rapat |
| **6** | `app/tindak-lanjut/` | Halaman matriks pemantauan butir *action items* dan pembaruan progres PIC |
| **7** | `app/actions/` | Berisi kumpulan Server Actions untuk logika mutasi data ke basis data |
| **8** | `components/` | Berisi komponen antarmuka pengguna yang dapat digunakan kembali (*reusable UI components*) |
| **9** | `components/ui/` | Pustaka komponen dasar (tombol, dialog modal, badge status, kartu, input) |
| **10** | `lib/` | Modul utilitas sistem, helper kalkulasi waktu, fungsi format tanggal, dan inisialisasi prisma |
| **11** | `prisma/schema.prisma` | Berisi deklarasi skema basis data PostgreSQL, definisi model tabel, dan relasi |
| **12** | `public/` | Direktori berkas statis publik (logo instansi, favicon, aset gambar, pratinjau diagram) |
| **13** | `docs/` | Dokumentasi perancangan teknis resmi (ERD, LRS, Use Case, Activity Diagram, Desain DB) |
| **14** | `middleware.ts` | Berkas middleware pengatur otentikasi sesi dan proteksi hak akses rute halaman |
| **15** | `.env` | Berkas konfigurasi variabel lingkungan (*database URL, auth secret, host configuration*) |

---

## 6. Penutup

Dokumen teknis pengembangan website Log_Book_Rapat KEK ini disusun sebagai panduan menyeluruh dan pedoman resmi dalam perancangan, implementasi, dan pengujian sistem informasi log dan notula rapat dinas di lingkungan Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus.

Dengan terdokumentasikannya arsitektur sistem, alur proses bisnis (*Activity Diagram*), dan desain basis data relasional secara terstruktur, sistem ini diharapkan dapat mempermudah proses evaluasi akademik, sidang Tugas Akhir/Skripsi, serta menjamin kelangsungan pemeliharaan dan pengembangan fitur lanjutan sistem di masa yang akan datang demi terwujudnya tata kelola birokrasi pemerintahan yang modern dan akuntabel.

---
*Dokumen resmi rekayasa perangkat lunak Log_Book_Rapat KEK RI — Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus.*
