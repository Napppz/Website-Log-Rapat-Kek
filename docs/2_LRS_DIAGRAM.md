# PERANCANGAN BASIS DATA: LRS (SUB-BAB 3.2.4.b)
## Aplikasi Log Book Kegiatan KEK
**Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus Republik Indonesia**

Dokumen ini memuat spesifikasi lengkap **Logical Record Structure (LRS)** yang ditransformasikan secara sistematis dari Entity Relationship Diagram (ERD), mencakup **8 tabel entitas inti aktif** pada basis data **Neon PostgreSQL** dengan desain visual modern yang selaras dengan dokumen laporan PKL.

> [!NOTE]
> **Penempatan pada Laporan PKL (Pedoman PKL UBSI Tahun 2026 Halaman 30 – 31 No. 3):**  
> Diagram LRS ini ditempatkan pada **BAB III PEMBAHASAN &rarr; 3.2. Pembuatan Program &rarr; 3.2.4. Database\* &rarr; b. Logical Record Structure (LRS)** (Gambar III.9).

---

## 1. File Diagram & Visual Asset LRS Resmi

* **Gambar Resmi Laporan (PNG):** [`public/lrs_modern_diagram.png`](file:///c:/Users/nappz/Documents/Magang/Projek%20Web%20Pencatatan%20Kegiatan/public/lrs_modern_diagram.png)
* **Vektor Skalabel (SVG):** [`public/lrs_modern_diagram.svg`](file:///c:/Users/nappz/Documents/Magang/Projek%20Web%20Pencatatan%20Kegiatan/public/lrs_modern_diagram.svg)
* **File Asli Draw.io:** [`docs/LRS_Log_Book_Kegiatan.drawio`](file:///c:/Users/nappz/Documents/Magang/Projek%20Web%20Pencatatan%20Kegiatan/docs/LRS_Log_Book_Kegiatan.drawio)
* **Pratinjau Interaktif Browser:** [http://localhost:3000/lrs-preview.html](http://localhost:3000/lrs-preview.html)
* **Status Google Doc Laporan:** Telah tersinkronisasi pada **Gambar III.9** di naskah resmi Google Docs.

---

## 2. Penyederhanaan Skema & Eliminasi Tabel Tidak Perlu

Berdasarkan audit fungsional aplikasi Log Book Kegiatan KEK dan basis data riil Neon PostgreSQL, entitas tabel yang dimodelkan dalam LRS difokuskan secara efisien pada tabel operasional transaksi nyata. Entitas yang redundan atau tidak digunakan dieliminasi agar LRS bersih, padat, dan mudah dipahami:

| No | Nama Tabel | Status pada LRS | Alasan & Rasionalisasi |
|:--:|:-----------|:---------------:|:-----------------------|
| 1 | **`biro`** | **Dimasukkan (Aktif)** | Master data unit kerja Eselon II di lingkungan Sekretariat Dewan Nasional KEK. |
| 2 | **`tim_biro`** | **Dimasukkan (Aktif)** | Master data kelompok kerja / tim teknis di bawah naungan biro. |
| 3 | **`pengguna`** | **Dimasukkan (Aktif)** | Akun aparatur, autentikasi multi-role (Super Admin, Admin Biro, Pegawai). |
| 4 | **`kegiatan`** | **Dimasukkan (Aktif)** | Entitas sentral pencatatan jadwal, registrasi kegiatan, dan catatan ringkasan hasil kegiatan. |
| 5 | **`lampiran_kegiatan`** | **Dimasukkan (Aktif)** | Berkas naskah digital pendukung (undangan, bahan paparan materi, dokumentasi/rilis). |
| 6 | **`peserta_kegiatan`** | **Dimasukkan (Aktif)** | Daftar aparatur dan pihak terkait penugasan kehadiran kegiatan resmi. |
| 7 | **`tindak_lanjut`** | **Dimasukkan (Aktif)** | Arahan komitmen penugasan (*action items*), PIC eksekutor, dan tenggat waktu. |
| 8 | **`riwayat_tindak_lanjut`** | **Dimasukkan (Aktif)** | Rekam jejak audit perkembangan status tindak lanjut oleh penanggung jawab. |
| 9 | `notulen_kegiatan` | *Dieliminasi (Tidak Perlu)* | Tidak ada tabel terpisah; naskah ringkasan hasil kegiatan dicatat langsung di kolom `catatan_hasil` pada tabel `kegiatan`. |
| 10 | `komentar_notulen` | *Dieliminasi (Tidak Perlu)* | Modul komentar review naskah ditiadakan demi simplifikasi alur kerja kegiatan. |
| 11 | `riwayat_notulen` | *Dieliminasi (Tidak Perlu)* | Riwayat revisi naskah notulensi tidak digunakan pada modul operasional. |
| 12 | `kegiatan_biro` | *Dieliminasi (Tidak Perlu)* | Relasi biro pemrakarsa telah dinormalisasi langsung melalui kolom `id_biro` pada tabel `kegiatan`. |
| 13 | `penomoran_kegiatan_biro` | *Dieliminasi (Tidak Perlu)* | Penomoran urut otomatis di-generate secara algoritmik oleh *service layer* sistem. |

---

## 3. Gaya Visual Diagram LRS (Acuan Desain Modern)

Visual diagram LRS dirancang dengan mengadopsi standar modern visual database:
1. **Header Tabel:** Kartu dengan header bernuansa gradient biru elegan (`#2D6396` s.d. `#1E4F7D`) dan sudut membulat (*rounded corners*).
2. **Indikator Atribut:**
   - **Primary Key (PK):** Ditandai dengan latar baris biru muda lembut (`#EBF2F9`) serta simbol kunci emas `🔑`.
   - **Foreign Key (FK):** Ditandai dengan simbol tautan rantai `🔗`.
   - **Boolean:** Ditandai dengan simbol kotak centang `🗹`.
   - **Tipe Data:** Ditampilkan rata kanan dengan tipografi teknis abu-abu netral (`varchar`, `integer`, `timestamp`, `boolean`, `text`, `enum`).
3. **Garis Relasi & Kardinalitas:**
   - Menggunakan garis ortogonal biru halus (`#3B82F6`) berhiaskan titik dekoratif di sepanjang jalur koneksi.
   - Menggunakan notasi kardinalitas standar akademik perguruan tinggi **`1`** (sisi induk / parent) dan **`N`** (sisi anak / child) dengan ujung panah terarah. Menghindari format `0..1` atau `*` agar tidak membingungkan dosen pembimbing dan penguji.

---

## 4. Struktur Rekod 8 Entitas Inti

```text
================================================================================
KLASTER 1: UNIT ORGANISASI & APARATUR (3 TABEL)
================================================================================

1. biro
   ├── 🔑 id_biro : varchar <PK>
   ├── kode_biro : varchar
   ├── nama_biro : varchar
   ├── nama_singkat : varchar
   └── 🗹 status_aktif : boolean

2. tim_biro
   ├── 🔑 id_tim : varchar <PK>
   ├── 🔗 id_biro : varchar <FK> ───────── (Relasi 1 ke N dari biro)
   ├── kode_tim : varchar
   ├── nama_tim : varchar
   └── 🗹 status_aktif : boolean

3. pengguna
   ├── 🔑 id_pengguna : varchar <PK>
   ├── 🔗 id_biro : varchar <FK> ───────── (Relasi 1 ke N dari biro)
   ├── 🔗 id_tim : varchar <FK> ────────── (Relasi 1 ke N dari tim_biro)
   ├── nama_lengkap : varchar
   ├── email : varchar
   ├── nama_pengguna : varchar
   ├── kata_sandi : varchar
   ├── peran : enum
   └── 🗹 status_aktif : boolean

================================================================================
KLASTER 2: LOG BOOK KEGIATAN & BERKAS DOKUMEN (3 TABEL)
================================================================================

4. kegiatan
   ├── 🔑 id_kegiatan : varchar <PK>
   ├── 🔗 id_biro : varchar <FK> ───────── (Relasi 1 ke N dari biro)
   ├── 🔗 id_tim : varchar <FK> ────────── (Relasi 1 ke N dari tim_biro)
   ├── nomor_kegiatan : varchar
   ├── judul_kegiatan : varchar
   ├── tanggal_kegiatan : timestamp
   ├── waktu_mulai : varchar
   ├── waktu_selesai : varchar
   ├── lokasi_kegiatan : varchar
   ├── pic_kegiatan : varchar
   ├── kategori_naskah : varchar
   ├── catatan_hasil : text
   └── status_kegiatan : enum

5. lampiran_kegiatan
   ├── 🔑 id_lampiran : varchar <PK>
   ├── 🔗 id_kegiatan : varchar <FK> ───── (Relasi 1 ke N dari kegiatan)
   ├── nama_berkas : varchar
   ├── url_berkas : varchar
   ├── ukuran_berkas : integer
   ├── tipe_berkas : varchar
   ├── kategori : varchar
   └── dibuat_pada : timestamp

6. peserta_kegiatan
   ├── 🔑 id_peserta : varchar <PK>
   ├── 🔗 id_kegiatan : varchar <FK> ───── (Relasi 1 ke N dari kegiatan)
   ├── 🔗 id_pengguna : varchar <FK> ───── (Relasi 1 ke N dari pengguna)
   ├── status_kehadiran : enum
   └── dibuat_pada : timestamp

================================================================================
KLASTER 3: TINDAK LANJUT / ACTION ITEMS (2 TABEL)
================================================================================

7. tindak_lanjut
   ├── 🔑 id_tindak_lanjut : varchar <PK>
   ├── 🔗 id_kegiatan : varchar <FK> ───── (Relasi 1 ke N dari kegiatan)
   ├── 🔗 id_biro : varchar <FK> ───────── (Relasi 1 ke N dari biro)
   ├── 🔗 id_tim : varchar <FK> ────────── (Relasi 1 ke N dari tim_biro)
   ├── 🔗 id_pengguna : varchar <FK> ───── (Relasi 1 ke N dari pengguna - PIC)
   ├── judul_tindakan : varchar
   ├── deskripsi_tindakan : text
   ├── tenggat_waktu : timestamp
   ├── status_tindak_lanjut : enum
   ├── diselesaikan_pada : timestamp
   └── dibuat_pada : timestamp

8. riwayat_tindak_lanjut
   ├── 🔑 id_riwayat : varchar <PK>
   ├── 🔗 id_tindak_lanjut : varchar <FK> (Relasi 1 ke N dari tindak_lanjut)
   ├── 🔗 id_pengguna : varchar <FK> ───── (Relasi 1 ke N dari pengguna)
   ├── status_sebelumnya : enum
   ├── status_terbaru : enum
   ├── catatan_progres : text
   └── dibuat_pada : timestamp
```

---

## 5. Matriks Hubungan Kunci Tamu (Foreign Key Map)

| No | Tabel Asal (Child) | Kolom Kunci Tamu (FK) | Tabel Rujukan (Parent) | Kolom Rujukan (PK) | Kardinalitas |
|:---|:-------------------|:----------------------|:-----------------------|:-------------------|:-------------|
| 1  | `tim_biro` | `id_biro` | `biro` | `id_biro` | 1 : N |
| 2  | `pengguna` | `id_biro` | `biro` | `id_biro` | 1 : N |
| 3  | `pengguna` | `id_tim` | `tim_biro` | `id_tim` | 1 : N |
| 4  | `kegiatan` | `id_biro` | `biro` | `id_biro` | 1 : N |
| 5  | `kegiatan` | `id_tim` | `tim_biro` | `id_tim` | 1 : N |
| 6  | `lampiran_kegiatan`| `id_kegiatan` | `kegiatan` | `id_kegiatan` | 1 : N |
| 7  | `peserta_kegiatan` | `id_kegiatan` | `kegiatan` | `id_kegiatan` | 1 : N |
| 8  | `peserta_kegiatan` | `id_pengguna` | `pengguna` | `id_pengguna` | 1 : N |
| 9  | `tindak_lanjut` | `id_kegiatan` | `kegiatan` | `id_kegiatan` | 1 : N |
| 10 | `tindak_lanjut` | `id_biro` | `biro` | `id_biro` | 1 : N |
| 11 | `tindak_lanjut` | `id_tim` | `tim_biro` | `id_tim` | 1 : N |
| 12 | `tindak_lanjut` | `id_pengguna` | `pengguna` | `id_pengguna` | 1 : N |
| 13 | `riwayat_tindak_lanjut` | `id_tindak_lanjut` | `tindak_lanjut` | `id_tindak_lanjut` | 1 : N |
| 14 | `riwayat_tindak_lanjut` | `id_pengguna` | `pengguna` | `id_pengguna` | 1 : N |

---

## 6. Teks Deskripsi (Caption) Laporan PKL

> **Gambar III.9: Logical Record Structure (LRS) Aplikasi Log Book Kegiatan KEK**
> 
> *Gambar di atas menyajikan Logical Record Structure (LRS) yang merepresentasikan struktur rekod relasional dari 8 entitas tabel utama pada basis data Aplikasi Log Book Kegiatan Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus. Setiap tabel menyertakan definisi Primary Key (ditandai ikon kunci) dan Foreign Key (ditandai ikon rantai penghubung) yang menegaskan integritas referensial antar-tabel tanpa anomali redundansi data.*
