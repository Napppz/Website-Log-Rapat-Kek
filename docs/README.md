# PANDUAN DOKUMENTASI REKAYASA PERANGKAT LUNAK Log_Book_Rapat KEK RI
## Sesuai Pedoman PKL UBSI Tahun 2026 (Halaman 30 – 31, Nomor 3: Outline Pembuatan Project Aplikasi)

Dokumentasi dalam folder `docs/` ini telah disusun dan diselaraskan secara penuh dengan **Buku Pedoman Praktik Kerja Lapangan (PKL) Tahun 2026 Universitas Bina Sarana Informatika (UBSI)** untuk **Program Studi Informatika Program Sarjana (S1)**.

---

### 1. Dokumen Induk Laporan PKL Resmi
Seluruh isi laporan dari halaman judul, Bab I, Bab II, Bab III (Pembahasan Lengkap), Bab IV (Penutup), hingga Daftar Pustaka dan Riwayat Hidup disatukan dalam:
👉 **[`docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md)**

---

### 2. Pemetaan Berkas Dokumentasi ke Bab Laporan PKL

| Bab & Sub-Bab Pedoman PKL (Hal 30–31) | Dokumen Spesifikasi Markdown | Berkas Diagram Draw.io (`.drawio`) | Halaman Pratinjau Web |
|:---|:---|:---|:---|
| **BAB I PENDAHULUAN**<br>1.1 Latar Belakang Masalah<br>1.2 Maksud dan Tujuan<br>1.3 Metode Penelitian<br>1.4 Ruang Lingkup | [`docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md#bab-i-pendahuluan`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md) | - | - |
| **BAB II LANDASAN TEORI**<br>2.1 Umum<br>2.2 Teori Pendukung (Next.js, PostgreSQL, Prisma, UML, ERD, Black Box) | [`docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md#bab-ii-landasan-teori`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md) | - | - |
| **BAB III PEMBAHASAN**<br>**3.1. Tinjauan Umum**<br>(Profil Setjen DN KEK RI, Visi Misi, Struktur Organisasi) | [`docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md#31-tinjauan-umum`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md) | - | - |
| **BAB III PEMBAHASAN**<br>**3.2.1. Software Editor**<br>a. VS Code / Antigravity IDE<br>b. Node.js & npm<br>c. Neon DB & Prisma Studio<br>d. Draw.io Desktop<br>e. Web Browser (Chrome/Edge) | [`docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md#321-software-editor`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md) | - | - |
| **BAB III PEMBAHASAN**<br>**3.2.2. Design Program**<br>a. UML Use Case Diagram (12 Use Case)<br>b. UML Activity Diagram (3 Alur Swimlane)<br>c. UML Class Diagram (14 Kelas & 5 Enum)<br>d. UML Sequence Diagram (SD-01 s.d SD-03)<br>e. Desain Antarmuka Layar (Mockup UI) | • [`docs/3_USE_CASE_DIAGRAM.md`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/3_USE_CASE_DIAGRAM.md)<br>• [`docs/4_ACTIVITY_DIAGRAM.md`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/4_ACTIVITY_DIAGRAM.md)<br>• [`docs/5_SEQUENCE_DIAGRAM.md`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/5_SEQUENCE_DIAGRAM.md)<br>• [`docs/UML_DIAGRAM_LENGKAP.md`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/UML_DIAGRAM_LENGKAP.md) | • [`USE_CASE_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/USE_CASE_Log_Book_Rapat.drawio)<br>• [`ACTIVITY_DIAGRAM_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/ACTIVITY_DIAGRAM_Log_Book_Rapat.drawio)<br>• [`CLASS_DIAGRAM_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/CLASS_DIAGRAM_Log_Book_Rapat.drawio)<br>• [`SEQUENCE_DIAGRAM_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/SEQUENCE_DIAGRAM_Log_Book_Rapat.drawio) | • [Activity Preview](http://localhost:3000/activity-diagram-preview.html)<br>• [Sequence Preview](http://localhost:3000/sequence-diagram-preview.html) |
| **BAB III PEMBAHASAN**<br>**3.2.3. Kode Program**<br>a. Struktur Direktori Proyek<br>b. Server Actions Mutasi Data<br>c. Koneksi Prisma Client<br>d. Middleware Otorisasi RBAC | [`docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md#323-kode-program`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md) | - | - |
| **BAB III PEMBAHASAN**<br>**3.2.4. Database\***<br>a. Entity Relationship Diagram (ERD)<br>b. Logical Record Structure (LRS 3NF)<br>c. Spesifikasi Basis Data (14 Tabel) | • [`docs/1_ERD_DIAGRAM.md`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/1_ERD_DIAGRAM.md)<br>• [`docs/2_LRS_DIAGRAM.md`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/2_LRS_DIAGRAM.md)<br>• [`docs/5_DESAIN_DATABASE.md`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/5_DESAIN_DATABASE.md) | • [`ERD_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/ERD_Log_Book_Rapat.drawio)<br>• [`LRS_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LRS_Log_Book_Rapat.drawio)<br>• [`DESAIN_DATABASE_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/DESAIN_DATABASE_Log_Book_Rapat.drawio) | • [Database Preview](http://localhost:3000/database-design-preview.html) |
| **BAB III PEMBAHASAN**<br>**3.3. Evaluasi Program**<br>a. Metode Pengujian Black Box<br>b. Tabel Hasil Evaluasi 7 Skenario | [`docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md#33-evaluasi-program-black-box-testing`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md) | - | - |
| **BAB III PEMBAHASAN**<br>**3.4. Spesifikasi Perangkat**<br>3.4.1 Perangkat Keras (a s.d e)<br>3.4.2 Perangkat Lunak (a s.d g) | [`docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md#34-spesifikasi-perangkat`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md) | - | - |
| **BAB IV PENUTUP**<br>4.1 Kesimpulan<br>4.2 Saran | [`docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md#bab-iv-penutup`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md) | - | - |
| **DAFTAR PUSTAKA & RIWAYAT HIDUP** | [`docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md#daftar-pustaka`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md) | - | - |

---

### 3. Sinkronisasi Berkas Draw.io
Semua berkas diagram di direktori `docs/` disinkronkan secara identik ke direktori `public/`, sehingga dapat diunduh langsung melalui web browser saat aplikasi Next.js dijalankan (`npm run dev`):
* `http://localhost:3000/ERD_Log_Book_Rapat.drawio`
* `http://localhost:3000/LRS_Log_Book_Rapat.drawio`
* `http://localhost:3000/USE_CASE_Log_Book_Rapat.drawio`
* `http://localhost:3000/CLASS_DIAGRAM_Log_Book_Rapat.drawio`
* `http://localhost:3000/ACTIVITY_DIAGRAM_Log_Book_Rapat.drawio`
* `http://localhost:3000/SEQUENCE_DIAGRAM_Log_Book_Rapat.drawio`
