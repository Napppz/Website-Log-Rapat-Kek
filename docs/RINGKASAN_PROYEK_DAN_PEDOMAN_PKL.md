# Ringkasan Memori & Konteks Proyek Laporan PKL UBSI 2026

Dokumen ini mencatat seluruh konteks, struktur, aturan pedoman, dan progres pengerjaan Laporan PKL serta sistem aplikasi agar tersimpan secara permanen di repositori.

---

## 1. Identitas Penulis & Instansi Magang
- **Nama Mahasiswa:** Rizki Agustianto
- **NIM:** 15230292
- **Program Studi:** Informatika Kampus Margonda (Program Sarjana / S1)
- **Fakultas:** Teknik dan Informatika, Universitas Bina Sarana Informatika (UBSI)
- **Tahun Akademik:** 2026
- **Dosen Pembimbing PKL:** Budi Sudrajat, M.Kom
- **Instansi PKL:** Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus (Setjen DN KEK RI)
- **Mentor Magang:** Diaji Junianto
- **Pimpinan Unit:** Noviar Iskandar (Kepala Tata Kelola Biro 3 KEK)
- **Judul Laporan PKL:**
  > *"Perancangan dan Pembuatan Aplikasi Log Book Kegiatan pada Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus"*

---

## 2. Tautan & Dokumen Utama
- **Google Doc Laporan PKL:**
  - **Doc ID:** `1dBGQ4RXnUhx2E4afkoQgKItVCMv2sQcfNHLGKdy4o7s`
  - **Tautan Akses:** https://docs.google.com/document/d/1dBGQ4RXnUhx2E4afkoQgKItVCMv2sQcfNHLGKdy4o7s/edit
  - **Judul Dokumen:** *Perancangan dan Pembuatan Aplikasi Log Book Kegiatan pada Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus*
- **File Desain Diagram & Dokumentasi Lokal:**
  - `docs/ERD_Log_Book_Rapat.drawio` (ERD Chen & LRS Relasional)
  - `docs/5_DESAIN_DATABASE.md` (Kamus Data & Spesifikasi Tabel)
  - `docs/4_ACTIVITY_DIAGRAM.md` (Activity Diagram Alur Sistem)
  - `docs/5_SEQUENCE_DIAGRAM.md` (Sequence Diagram)
  - `docs/LAPORAN_PKL_Log_Book_Rapat_OUTLINE_3.md` (Draft Naskah Laporan Bab I s/d Bab IV)

---

## 3. Standar Tipografi & Format Pedoman PKL UBSI 2026 (Tersinkronisasi 100% di Google Docs)
Seluruh naskah pada Google Docs telah distandarisasi secara otomatis sesuai **Buku Pedoman Praktik Kerja Lapangan (PKL) Tahun 2026 UBSI (Outline 3 - Pembuatan Project Aplikasi)**:

1. **Ukuran Kertas & Margin:**
   - **Kertas:** A4 (210 mm x 297 mm / `595.28 pt x 841.89 pt`).
   - **Margin 4-4-3-3 cm:**
     - Margin Atas (*Top*): 4 cm (`113.39 pt`)
     - Margin Kiri (*Left*): 4 cm (`113.39 pt`)
     - Margin Bawah (*Bottom*): 3 cm (`85.04 pt`)
     - Margin Kanan (*Right*): 3 cm (`85.04 pt`)

2. **Tipografi & Jenis Huruf (Font):**
   - **Jenis Huruf:** 100% **Times New Roman** di seluruh dokumen naskah, heading, tabel, dan caption.
   - **Judul Sampul / Cover:** Font Times New Roman 14 pt, **Tebal (*Bold*)**, Rata Tengah (*Center*).
   - **Judul Bab (BAB I s/d IV, DAFTAR PUSTAKA, DAFTAR RIWAYAT HIDUP):** Font Times New Roman 14 pt, **Tebal (*Bold*)**, Kapital Semua, Rata Tengah (*Center*), dilengkapi `pageBreakBefore: true`.
   - **Sub-Bab (1.1, 1.2, 2.1, dst.):** Font Times New Roman 12 pt, **Tebal (*Bold*)**, *Title Case*, Rata Kiri (*Align Left*).
   - **Sub-Sub-Bab (1.2.1, 2.1.1, 2.2.1, dst.):** Font Times New Roman 12 pt, **Tebal (*Bold*)**, *Title Case*, Rata Kiri (*Align Left*).
   - **Isi Paragraf Naskah:** Font Times New Roman 12 pt, Reguler, Rata Kiri-Kanan (*Justified*).
   - **Keterangan / Judul Gambar & Tabel:** Font Times New Roman 12 pt, **Tebal (*Bold*)**, Rata Tengah (*Center*).
   - **Isi Tabel:** Font Times New Roman 10 pt, 1 spasi.

3. **Jarak Baris (Spasi / Line Spacing) & Blok Tanda Tangan:**
   - **Isi Naskah / Paragraf Pokok:** **1.5 spasi** (`lineSpacing: 150`).
   - **Isi Tabel & Judul Caption:** **1 spasi** (`lineSpacing: 100`).
   - **Blok Tanda Tangan Kata Pengantar & Daftar Riwayat Hidup:**
     - Posisi: **Rata Kanan (Kanan Bawah)** (`alignment: END`, tanpa karakter tab manual).
     - Format:
       ```
       Jakarta, 10 November 2026
       Penulis,



       Rizki Agustianto
       ```
     - Spasi: 1 spasi (`lineSpacing: 100`), font Times New Roman 12 pt.
   - **Daftar Pustaka:** **1 spasi** (`lineSpacing: 100`) antar baris dalam 1 entri referensi, dan berjarak 6 pt antar entri referensi.
   - **Daftar Isi, Daftar Simbol, Daftar Gambar, Daftar Tabel, Daftar Lampiran:** **1 spasi** (`lineSpacing: 100`).

4. **Pembersihan Struktur Outline & Navigasi Dokumen:**
   - Seluruh baris kosong yang sebelumnya berformat `HEADING` telah dihapus sehingga **Outline Navigasi Google Docs** bersih tanpa entri kosong (*ghost headings*).
   - Seluruh loncatan baris kosong berlebihan (34 enter kosong antara Daftar Lampiran dan Bab I, 11 enter di Daftar Gambar, 7 enter di Daftar Tabel) telah dipangkas dan digantikan oleh `pageBreakBefore: true` bawaan Google Docs API.
   - Gambar III.14 telah dikembalikan ke tingkatan caption yang benar (*Heading 4*).
   - Sub-bab 2.1.1, 2.1.2, 2.1.3, dan 2.2.1 telah dikoreksi menjadi *Heading 3* tebal.
   - Sub-bab 3.2 disinkronkan urutannya: `3.2.1. Software Editor`, `3.2.2. Design Program`, `3.2.3. Database* (Perancangan Basis Data)`, dan `3.2.4. Kode Program` (semuanya berformat *Heading 3* tebal).
   - Judul `BAB II` diselaraskan menjadi rata tengah (*Center*) konsisten dengan Bab I, III, dan IV.
   - Seluruh caption gambar (Gambar III.1 s/d Gambar III.14) diseragamkan formatnya: typo `Gambar III12` diperbaiki menjadi `Gambar III.12`, serta titik berlebih pada `Gambar III.9.` dan `Gambar III.14.` telah dirapikan.

---

## 4. Referensi Jurnal 5 Tahun Terakhir (SINTA Terakreditasi)
Landasan teori pada Sub-bab 2.2.1 dan DAFTAR PUSTAKA telah diperbarui 100% menggunakan 5 jurnal nasional terakreditasi SINTA periode 2022–2025 yang sesuai dengan topik Aplikasi Log Book Kegiatan:

1. **Thisara, S. K., & Putri, R. A. (2024).**  
   *Sistem Informasi Penjadwalan Kegiatan Berbasis Web pada Kantor Kecamatan.* Jurnal Sistem Informasi dan Informatika (SIMIKA), 7(1), 45–56. (Terakreditasi SINTA 4).
2. **Fauziah, E. S. (2022).**  
   *Sistem Agenda Kegiatan Berbasis Web Menggunakan Metode Waterfall.* KALBISIANA: Jurnal Sains, Bisnis dan Teknologi, 8(2), 189–201. (Terakreditasi SINTA 4).
3. **Rahmadani, P., Putri, N. E., Wahyuningsih, R., Ardianti, L., & Agustin, M. (2025).**  
   *Perancangan Aplikasi E-Arsip Dokumen Kedinasan Berbasis Web.* Jurnal RESTI (Rekayasa Sistem dan Teknologi Informasi), 9(1), 112–123. (Terakreditasi SINTA 2).
4. **Saifullah, R. A., & Komalasari, R. (2025).**  
   *Pembuatan Aplikasi Pengarsipan Berkas Digital Berbasis Web.* Joutica: Jurnal Informatika Terpadu, 10(1), 28–39. (Terakreditasi SINTA 4).
5. **Hendradi, P., & Dewi, K. K. R. (2023).**  
   *Perancangan Sistem Informasi Manajemen Agenda dan Notulensi Rapat Kedinasan.* JURNAL LIMITS: Variasi Rekayasa dan Teknologi, 20(2), 77–88. (Terakreditasi SINTA 3).

---

## 5. Sinkronisasi Struktur Dokumen Baku (Bab I s/d Bab IV)
- **Halaman Depan:**
  - Lembar Judul / Cover Laporan PKL
  - Lembar Persetujuan Laporan PKL
  - Kata Pengantar
  - Daftar Isi
  - Daftar Simbol (18 simbol UML & ERD)
  - Daftar Gambar (Gambar III.1 s/d III.14)
  - Daftar Tabel (Tabel III.1 s/d III.11)
  - Daftar Lampiran (Lampiran 1 s/d 5)
- **Bagian Pokok:**
  - **BAB I PENDAHULUAN:** Latar Belakang, Maksud & Tujuan, Metode Penelitian (Waterfall), Ruang Lingkup.
  - **BAB II LANDASAN TEORI:** Konsep Sistem Informasi, Manajemen Penjadwalan Kegiatan, Pencatatan Dokumen Log Book Digital, Penelitian Terkait (5 Jurnal SINTA), Next.js 15, TypeScript, Tailwind CSS, PostgreSQL & Prisma ORM, UML & ERD.
  - **BAB III PEMBAHASAN:** Tinjauan Instansi (Setjen DN KEK), Pembuatan Program, UML Diagrams, ERD & LRS, Data Dictionary, Antarmuka Pengguna, Black Box Testing (7 skenario pengujian), Spesifikasi Hardware & Software.
  - **BAB IV PENUTUP:** Kesimpulan (5 poin) dan Saran (Bagi Instansi & Pengembangan Sistem Selanjutnya).
  - **DAFTAR PUSTAKA:** 15 referensi terurut abjad A-Z (Aji, Baehaqi, Dennis, Fauziah, Hendradi, Hutahaean, Kesuma, Laudon, Prasetyo, Prisma, Rahmadani, Rifandi, Saifullah, Thisara, Widodo).
  - **DAFTAR RIWAYAT HIDUP:** Biodata Penulis, Riwayat Pendidikan Formal, Pengalaman Magang PKL di Setjen DN KEK RI.
  - **LAMPIRAN-LAMPIRAN:** Halaman Lampiran 1 s/d 5.


---

## 6. Standar Status Kegiatan & Tindak Lanjut serta Kebijakan Data Peserta (27 Oktober 2026)
Sesuai arahan dan kesepakatan kebutuhan operasional di lingkungan Setjen DN KEK:
1. **Status Kegiatan & Butir Tindak Lanjut (3 Tahapan Resmi):**
   - **Belum Dimulai** (*PENDING*): Kegiatan/tugas telah dijadwalkan dan diagendakan, persiapan materi/administrasi sedang disiapkan.
   - **Dalam Proses** (*IN_PROGRESS*): Kegiatan sedang berlangsung atau butir tindak lanjut sedang dalam pengerjaan aktif oleh staf/tim kerja.
   - **Selesai** (*COMPLETED*): Kegiatan rampung/risalah disahkan, atau butir tindak lanjut telah diselesaikan 100%.
   - **Tidak Ada Status Terlambat (OVERDUE)** pada kategori status. Seluruh filter status, KPI cards, dan badge status dibatasi secara ketat hanya pada ketiga tahapan resmi di atas.
2. **Kebijakan Data Peserta Kegiatan (Tanpa Presensi Kehadiran):**
   - Sistem tidak menggunakan modul absensi/presensi fisik (*Hadir/Izin/Sakit/Alpa*).
   - Seluruh peserta kegiatan dikelola sebagai **Daftar Pihak dan Aparatur Terkait Kegiatan** (undangan pejabat internal dan eksternal) untuk keperluan log book kegiatan resmi.
   - Seluruh tabel kamus data (Tabel III.5), skenario pengujian Black Box (Tabel III.9), use case, dan uraian bab pada naskah Google Docs telah disinkronkan 100% bebas dari modul presensi kehadiran.

---

## 7. Audit Basis Data Neon PostgreSQL & Spesifikasi Kamus Data (28 Oktober 2026)
Berdasarkan hasil audit data aktual pada basis data cloud **Neon Serverless PostgreSQL (PostgreSQL 16/18)**:
1. **9 Tabel Aktif Berisi Record Riil (Dimodelkan dalam Data Dictionary & ERD):**
   - `biro` (5 baris data) — Master data unit kerja biro.
   - `tim_biro` (5 baris data) — Tim kerja teknis fungsional biro.
   - `pengguna` (23 baris data) — Akun pengguna aparatur dan kontrol peran (*RBAC*).
   - `kegiatan` (23 baris data) — Transaksi utama log book agenda kegiatan.
   - `peserta_kegiatan` (38 baris data) — Daftar aparatur / pihak terkait penugasan kegiatan.
   - `lampiran_kegiatan` (9 baris data) — Berkas digital dokumen pendukung log book kegiatan.
   - `tindak_lanjut` (36 baris data) — Matriks butir tindak lanjut penugasan (*action items*).
   - `riwayat_tindak_lanjut` (34 baris data) — Log jejak progres penyelesaian tugas oleh PIC.
   - `notifikasi` (35 baris data) — Notifikasi lonceng sistem bagi aparatur.
2. **5 Tabel Kosong (0 baris data) yang Dieliminasi dari Dokumentasi:**
   - `notulen_kegiatan` (0 baris data) — Catatan ringkasan langsung tercatat pada tabel `kegiatan`.
   - `komentar_notulen` (0 baris data) — Tidak ada record data aktif.
   - `riwayat_notulen` (0 baris data) — Tidak ada record data aktif.
   - `penomoran_kegiatan_biro` (0 baris data) — Penomoran otomatis ditangani via logika algoritmik program.
   - `kegiatan_biro` (0 baris data) — Relasi biro pemrakarsa terhubung langsung via FK `id_biro`.
3. **Pemisahan Halaman Daftar Riwayat Hidup:**
   - `DAFTAR RIWAYAT HIDUP` telah dipisahkan menjadi **1 halaman tersendiri** menggunakan `pageBreakBefore: true`.
   - Judul diformat sebagai `HEADING_1`, Font Times New Roman 14 pt Bold Rata Tengah (`alignment: CENTER`).
   - Isi biodata, riwayat pendidikan, riwayat magang, dan blok tanda tangan kanan bawah tersusun proporsional sehingga pas dan rapi dalam 1 halaman utuh tanpa bersatu dengan DAFTAR PUSTAKA.


