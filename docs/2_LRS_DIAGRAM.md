# PERANCANGAN BASIS DATA: LRS (SUB-BAB 3.2.4.b)
## Sistem Informasi Log & Risalah Rapat (Log_Book_Rapat KEK RI)
**Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus Republik Indonesia**

Dokumen ini memuat spesifikasi lengkap **Logical Record Structure (LRS)** yang ditransformasikan secara sistematis dari Entity Relationship Diagram (ERD), mencakup seluruh **14 tabel entitas aktif** pada basis data **Neon PostgreSQL**.

> [!NOTE]
> **Penempatan pada Laporan PKL (Pedoman PKL UBSI Tahun 2026 Halaman 30 – 31 No. 3):**  
> Diagram LRS ini ditempatkan pada **BAB III PEMBAHASAN &rarr; 3.2. Pembuatan Program &rarr; 3.2.4. Database\* &rarr; b. Logical Record Structure (LRS)**.

---

## 1. File Diagram Draw.io Resmi

* **File Asli Draw.io:** [`docs/LRS_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LRS_Log_Book_Rapat.drawio)
* **File Publik (Mirror):** [`public/LRS_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LRS_Log_Book_Rapat.drawio)
* **Tautan Unduh Langsung:** [http://localhost:3000/LRS_Log_Book_Rapat.drawio](http://localhost:3000/LRS_Log_Book_Rapat.drawio)
* **Karakteristik LRS:** 
  - **Tab 1:** LRS Log_Book_Rapat (8 Tabel Inti Terkoreksi) — Menggunakan arsitektur 3-kolom bebas persilangan garis (0 Crossings), notasi kardinalitas standar akademik BSI (`1` dan `N`), serta validasi penuh atas relasi Foreign Key.
  - **Tab 2:** LRS Log_Book_Rapat (14 Entitas Lengkap 3NF) — Menampilkan seluruh skema ternormalisasi ketiga (3NF) yang sinkron langsung dengan basis data Neon PostgreSQL.

---

## 1.1. Matriks Hasil Koreksi Kritis LRS (Penyempurnaan Kaidah Relasional Akademik)

Berdasarkan telaah kaidah integritas referensial dan evaluasi desain basis data, diagram LRS Log_Book_Rapat telah disempurnakan pada 4 aspek utama:

| No | Komponen Relasi | Kondisi Awal (Keliru) | Koreksi Relasional LRS (Benar) | Landasan Kaidah Basis Data Relasional |
|:---|:----------------|:---------------------|:-------------------------------|:--------------------------------------|
| **1** | **`tindak_lanjut` &rarr; `peserta_rapat`** | Terdapat garis relasi 1 ke N dari `tindak_lanjut` ke `peserta_rapat`. | **Garis diputus.** Relasi `peserta_rapat` ditarik dari **`rapat` (1 : N)** melalui `id_rapat` dan dari **`pengguna` (1 : N)** melalui `id_pengguna`. | Di tabel `peserta_rapat` tidak terdapat FK `id_tindak_lanjut`. Peserta rapat adalah aparatur yang diundang menghadiri rapat, bukan subordinat dari butir arahan tindak lanjut. |
| **2** | **`rapat` &rarr; `notifikasi`** | Terdapat garis relasi 1 ke N dari `rapat` ke `notifikasi`. | **Garis diputus.** Relasi `notifikasi` hanya berasal dari **`pengguna` (1 : N)** melalui `id_pengguna`. | Di tabel fisik `notifikasi` tidak terdapat FK `id_rapat` (hanya ada `id_pengguna`). Tautan rapat disimpan sebagai URL dinamis (`tautan`), sehingga secara struktural notifikasi adalah entitas inbox milik pengguna. |
| **3** | **`tim_biro` &mdash; `pengguna`** | Tertulis kardinalitas terbalik: `tim_biro` (N) ke `pengguna` (1). | **Kardinalitas dibenahi:** **`tim_biro` bertindak sebagai 1** dan **`pengguna` bertindak sebagai N**. | Foreign Key `id_tim` berada di dalam tabel `pengguna`. Sesuai aturan LRS, 1 tim kerja menaungi banyak anggota pengguna (1 : N). |
| **4** | **Integritas Seluruh Foreign Key (FK)** | Banyak FK di dalam tabel belum ditarik garis relasinya (misal `id_biro` di `pengguna`, `id_tim`/`id_pengguna` di `rapat`). | **Seluruh FK wajib memiliki garis relasi.** Redundansi FK transitif pada tabel anak dibersihkan agar LRS murni 3NF, dan setiap FK yang tersisa dihubungkan secara tegas dari tabel induknya. | Dalam aturan LRS, setiap atribut FK yang tertulis pada skema relasi wajib dapat ditelusuri (*traceable*) ke tabel asalnya tanpa ada FK yatim (*orphan FK*). |

> [!TIP]
> **Standar Notasi Kardinalitas Akademik:**
> Seluruh label kardinalitas pada diagram telah diselaraskan dengan pedoman penulisan ilmiah UBSI, yaitu menggunakan label **`1`** dan **`N`** (serta **`1 : 1`** untuk relasi satu-ke-satu), meniadakan simbol teknis seperti `0..1` atau `*`.

---


## 2. Kaidah Pemetaan ERD Menjadi LRS (Mapping Rules)

Transformasi dari Entity Relationship Diagram (ERD) konseptual menuju Logical Record Structure (LRS) logis dilakukan melalui 4 aturan baku pemodelan basis data relasional:

### 1) Aturan Relasi Satu-ke-Satu (1 : 1)
Ketika dua entitas berelasi 1:1, Primary Key entitas induk ditempatkan ke entitas anak sebagai **Foreign Key sekaligus Unique Key (`UK`)** guna menjamin kardinalitas tepat satu rekod:
1. **`biro` (1) &mdash; (1) `penomoran_rapat_biro`**
   - Satu biro memiliki tepat satu nomor urut register surat rapat dinas.
   - Kolom `id_biro` dari tabel `biro` masuk ke `penomoran_rapat_biro` dengan batasan `[FK, UK]`.
2. **`rapat` (1) &mdash; (1) `notulen_rapat`**
   - Satu pelaksanaan rapat menghasilkan tepat satu naskah risalah/notula resmi.
   - Kolom `id_rapat` dari tabel `rapat` masuk ke `notulen_rapat` dengan batasan `[FK, UK]`.

### 2) Aturan Relasi Satu-ke-Banyak (1 : N)
Primary Key pada entitas berderajat **1 (Parent / Induk)** ditempatkan sebagai Foreign Key pada entitas berderajat **N (Child / Anak)**:
1. `biro(id_biro)` &rarr; disematkan ke `tim_biro(id_biro)` *(1 biro menaungi banyak tim kerja)*
2. `biro(id_biro)` &rarr; disematkan ke `pengguna(id_biro)` *(1 biro memiliki banyak aparatur)*
3. `biro(id_biro)` &rarr; disematkan ke `rapat(id_biro)` *(1 biro pemrakarsa banyak agenda rapat)*
4. `biro(id_biro)` &rarr; disematkan ke `tindak_lanjut(id_biro)` *(1 biro dibebankan arahan tindak lanjut)*
5. `tim_biro(id_tim)` &rarr; disematkan ke `pengguna(id_tim)` *(1 tim kerja beranggotakan banyak staf)*
6. `tim_biro(id_tim)` &rarr; disematkan ke `rapat(id_tim)` *(1 tim kerja menyelenggarakan banyak rapat)*
7. `tim_biro(id_tim)` &rarr; disematkan ke `tindak_lanjut(id_tim)` *(1 tim kerja dibebankan arahan)*
8. `pengguna(id_pengguna)` &rarr; disematkan ke `rapat(id_pengguna)` *(sebagai Pimpinan Rapat / PIC)*
9. `pengguna(id_pengguna)` &rarr; disematkan ke `rapat(id_notulis)` *(sebagai Notulis Rapat)*
10. `pengguna(id_pengguna)` &rarr; disematkan ke `peserta_rapat(id_pengguna)` *(daftar kehadiran peserta)*
11. `pengguna(id_pengguna)` &rarr; disematkan ke `tindak_lanjut(id_pengguna)` *(PIC eksekutor pekerjaan)*
12. `pengguna(id_pengguna)` &rarr; disematkan ke `riwayat_tindak_lanjut(id_pengguna)` *(pencatat log progres)*
13. `pengguna(id_pengguna)` &rarr; disematkan ke `komentar_notulen(id_pengguna)` *(penulis review)*
14. `pengguna(id_pengguna)` &rarr; disematkan ke `riwayat_notulen(id_pengguna)` *(penyunting naskah)*
15. `pengguna(id_pengguna)` &rarr; disematkan ke `notifikasi(id_pengguna)` *(penerima notifikasi)*
16. `rapat(id_rapat)` &rarr; disematkan ke `peserta_rapat(id_rapat)` *(undangan/daftar hadir)*
17. `rapat(id_rapat)` &rarr; disematkan ke `lampiran_rapat(id_rapat)` *(berkas pendukung rapat)*
18. `rapat(id_rapat)` &rarr; disematkan ke `tindak_lanjut(id_rapat)` *(butir arahan hasil rapat)*
19. `rapat(id_rapat)` &rarr; disematkan ke `komentar_notulen(id_rapat)` *(diskusi review)*
20. `rapat(id_rapat)` &rarr; disematkan ke `riwayat_notulen(id_rapat)` *(audit trail revisi)*
21. `tindak_lanjut(id_tindak_lanjut)` &rarr; disematkan ke `riwayat_tindak_lanjut(id_tindak_lanjut)` *(log progres pekerjaan)*

### 3) Aturan Relasi Banyak-ke-Banyak (M : N)
Pada perancangan konseptual ERD, satu agenda rapat dinas dapat melibatkan banyak biro, dan satu biro dapat terlibat dalam banyak agenda rapat dinas (*Rapat Gabungan Lintas Biro*).
- Pada LRS, relasi M:N direalisasikan melalui tabel perantara (*associative / junction table*) bernama **`rapat_biro`**.
- Tabel `rapat_biro` memegang **Composite Primary Key** yang terdiri atas gabungan `(id_rapat, id_biro)`, di mana keduanya masing-masing merupakan Foreign Key yang mengacu ke tabel `rapat` dan `biro`.

### 4) Aturan Relasi Rekursif / Unary (0..1 : N)
1. **Rapat Lanjutan (`rapat` &mdash; `rapat`)**:
   - Rapat koordinasi berkala dapat merujuk pada rapat edisi sebelumnya.
   - Kolom `id_rapat_sebelumnya` disematkan di dalam tabel `rapat` itu sendiri sebagai Foreign Key bertipe nullable (*self-referencing*).
2. **Komentar Bertingkat (`komentar_notulen` &mdash; `komentar_notulen`)**:
   - Kolom `id_induk` merujuk ke `id_komentar` dari tabel yang sama untuk mendukung balasan utas komentar (*nested replies / thread*).

---

## 3. Struktur Rekod LRS Lengkap 14 Entitas Basis Data

Berikut adalah representasi rekod logis dari 14 tabel basis data yang terbagi rapi dalam **5 Klaster Modul**:

```text
================================================================================
KLASTER 1: ORGANISASI & PENGGUNA (3 TABEL)
================================================================================

1. biro
   ├── *id_biro : VARCHAR(50) <PK>
   ├── kode_biro : VARCHAR(20) <UK>
   ├── nama_biro : VARCHAR(255)
   ├── nama_singkat : VARCHAR(100)
   ├── deskripsi : TEXT
   ├── status_aktif : BOOLEAN
   ├── dibuat_pada : TIMESTAMP
   └── diperbarui_pada : TIMESTAMP

2. tim_biro
   ├── *id_tim : VARCHAR(50) <PK>
   ├── **id_biro : VARCHAR(50) <FK> ───────── (Relasi 1:N dari biro)
   ├── kode_tim : VARCHAR(20)
   ├── nama_tim : VARCHAR(150)
   ├── deskripsi_tim : TEXT
   ├── status_aktif : BOOLEAN
   ├── dibuat_pada : TIMESTAMP
   └── diperbarui_pada : TIMESTAMP

3. pengguna
   ├── *id_pengguna : VARCHAR(50) <PK>
   ├── **id_biro : VARCHAR(50) <FK> ───────── (Relasi 1:N dari biro)
   ├── **id_tim : VARCHAR(50) <FK, Null> ─── (Relasi 1:N dari tim_biro)
   ├── nama_lengkap : VARCHAR(255)
   ├── email : VARCHAR(255) <UK>
   ├── kata_sandi : VARCHAR(255)
   ├── peran : ENUM('SUPER_ADMIN', 'ADMIN', 'STAFF')
   ├── status_aktif : BOOLEAN
   ├── dibuat_pada : TIMESTAMP
   └── diperbarui_pada : TIMESTAMP

================================================================================
KLASTER 2: PELAKSANAAN RAPAT DINAS (5 TABEL)
================================================================================

4. penomoran_rapat_biro
   ├── *id_penomoran : VARCHAR(50) <PK>
   ├── **id_biro : VARCHAR(50) <FK, UK> ──── (Relasi 1:1 dari biro)
   ├── nomor_terakhir : INTEGER
   ├── dibuat_pada : TIMESTAMP
   └── diperbarui_pada : TIMESTAMP

5. rapat
   ├── *id_rapat : VARCHAR(50) <PK>
   ├── nomor_rapat : VARCHAR(50) <UK>
   ├── judul_rapat : VARCHAR(255)
   ├── **id_biro : VARCHAR(50) <FK> ──────── (Relasi 1:N dari biro)
   ├── **id_tim : VARCHAR(50) <FK, Null> ─── (Relasi 1:N dari tim_biro)
   ├── **id_pengguna : VARCHAR(50) <FK> ──── (Relasi 1:N dari pengguna - Pimpinan/PIC)
   ├── **id_notulis : VARCHAR(50) <FK, Null> (Relasi 1:N dari pengguna - Notulis)
   ├── **id_rapat_sebelumnya : VARCHAR(50) <FK, Null> (Relasi 0..1:N Unary dari rapat)
   ├── tanggal_rapat : TIMESTAMP
   ├── waktu_mulai : VARCHAR(10)
   ├── waktu_selesai : VARCHAR(10)
   ├── lokasi_rapat : VARCHAR(255)
   ├── status_rapat : ENUM('DRAFT', 'REVIEW', 'APPROVED', 'FINAL')
   ├── jenis_rapat : VARCHAR(100)
   ├── pic_rapat : VARCHAR(255)
   ├── status_progres : VARCHAR(50)
   ├── kategori_naskah : VARCHAR(100)
   ├── sub_kategori_naskah : VARCHAR(100)
   ├── asal_naskah_masuk : VARCHAR(255)
   ├── alasan_penundaan : TEXT
   ├── dokumen_undangan_url : VARCHAR(500)
   ├── materi_dokumen_url : VARCHAR(500)
   ├── dibuat_pada : TIMESTAMP
   └── diperbarui_pada : TIMESTAMP

6. rapat_biro (Junction Table M:N)
   ├── *id_rapat : VARCHAR(50) <PK, FK> ──── (Relasi 1:N dari rapat)
   └── *id_biro : VARCHAR(50) <PK, FK> ───── (Relasi 1:N dari biro)

7. peserta_rapat
   ├── *id_peserta : VARCHAR(50) <PK>
   ├── **id_rapat : VARCHAR(50) <FK> ─────── (Relasi 1:N dari rapat)
   ├── **id_pengguna : VARCHAR(50) <FK> ──── (Relasi 1:N dari pengguna)
   ├── status_kehadiran : ENUM('INVITED', 'PRESENT', 'ABSENT', 'EXCUSED')
   └── dibuat_pada : TIMESTAMP
   └── [Constraint: UNIQUE(id_rapat, id_pengguna)]

8. lampiran_rapat
   ├── *id_lampiran : VARCHAR(50) <PK>
   ├── **id_rapat : VARCHAR(50) <FK> ─────── (Relasi 1:N dari rapat)
   ├── nama_berkas : VARCHAR(255)
   ├── url_berkas : VARCHAR(500)
   ├── ukuran_berkas : INTEGER
   ├── tipe_berkas : VARCHAR(100)
   ├── nama_pengunggah : VARCHAR(255)
   ├── kategori : VARCHAR(50)
   └── dibuat_pada : TIMESTAMP

================================================================================
KLASTER 3: NOTULENSI & RISALAH RAPAT (3 TABEL)
================================================================================

9. notulen_rapat
   ├── *id_notulen : VARCHAR(50) <PK>
   ├── **id_rapat : VARCHAR(50) <FK, UK> ─── (Relasi 1:1 dari rapat)
   ├── agenda_pembahasan : TEXT
   ├── hasil_pembahasan : TEXT
   ├── poin_keputusan : TEXT
   ├── kesimpulan : TEXT
   ├── dibuat_pada : TIMESTAMP
   └── diperbarui_pada : TIMESTAMP

10. komentar_notulen
    ├── *id_komentar : VARCHAR(50) <PK>
    ├── **id_rapat : VARCHAR(50) <FK> ────── (Relasi 1:N dari rapat)
    ├── **id_pengguna : VARCHAR(50) <FK> ─── (Relasi 1:N dari pengguna)
    ├── **id_induk : VARCHAR(50) <FK, Null>  (Relasi 0..1:N Unary dari komentar_notulen)
    ├── isi_komentar : TEXT
    ├── seksi : VARCHAR(50)
    ├── sudah_diselesaikan : BOOLEAN
    ├── diselesaikan_oleh : VARCHAR(255)
    ├── diselesaikan_pada : TIMESTAMP
    ├── dibuat_pada : TIMESTAMP
    └── diperbarui_pada : TIMESTAMP

11. riwayat_notulen
    ├── *id_riwayat : VARCHAR(50) <PK>
    ├── **id_rapat : VARCHAR(50) <FK> ────── (Relasi 1:N dari rapat)
    ├── **id_pengguna : VARCHAR(50) <FK> ─── (Relasi 1:N dari pengguna)
    ├── tipe_perubahan : VARCHAR(100)
    ├── nama_kolom : VARCHAR(100)
    ├── nilai_lama : JSONB
    ├── nilai_baru : JSONB
    ├── ringkasan_perubahan : TEXT
    └── dibuat_pada : TIMESTAMP

================================================================================
KLASTER 4: TINDAK LANJUT / ACTION ITEMS (2 TABEL)
================================================================================

12. tindak_lanjut
    ├── *id_tindak_lanjut : VARCHAR(50) <PK>
    ├── **id_rapat : VARCHAR(50) <FK> ────── (Relasi 1:N dari rapat)
    ├── **id_biro : VARCHAR(50) <FK> ─────── (Relasi 1:N dari biro)
    ├── **id_tim : VARCHAR(50) <FK, Null> ── (Relasi 1:N dari tim_biro)
    ├── **id_pengguna : VARCHAR(50) <FK> ─── (Relasi 1:N dari pengguna - PIC)
    ├── judul_tindakan : VARCHAR(255)
    ├── deskripsi_tindakan : TEXT
    ├── tenggat_waktu : TIMESTAMP
    ├── status_tindak_lanjut : ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')    ├── diselesaikan_pada : TIMESTAMP
    ├── dibuat_pada : TIMESTAMP
    └── diperbarui_pada : TIMESTAMP

13. riwayat_tindak_lanjut
    ├── *id_riwayat : VARCHAR(50) <PK>
    ├── **id_tindak_lanjut : VARCHAR(50) <FK> (Relasi 1:N dari tindak_lanjut)
    ├── **id_pengguna : VARCHAR(50) <FK> ─── (Relasi 1:N dari pengguna)
    ├── status_sebelumnya : ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')
    ├── status_terbaru : ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')
    ├── catatan_progres : TEXT    └── dibuat_pada : TIMESTAMP

================================================================================
KLASTER 5: KOMUNIKASI SISTEM (1 TABEL)
================================================================================

14. notifikasi
    ├── *id_notifikasi : VARCHAR(50) <PK>
    ├── **id_pengguna : VARCHAR(50) <FK> ─── (Relasi 1:N dari pengguna)
    ├── judul : VARCHAR(255)
    ├── pesan : TEXT
    ├── tipe : VARCHAR(50)
    ├── tautan : VARCHAR(500)
    ├── sudah_dibaca : BOOLEAN
    └── dibuat_pada : TIMESTAMP
```

---

## 4. Matriks Integritas Referensial Kunci Tamu (Foreign Key Map)

Tabel berikut menunjukkan pemetaan hubungan kunci tamu secara menyeluruh yang siap disajikan dalam tabel skripsi:

| No | Tabel Asal (Child) | Kolom Kunci Tamu (FK) | Tabel Rujukan (Parent) | Kolom Rujukan (PK) | Aturan Hapus (On Delete) | Kardinalitas |
|:---|:-------------------|:----------------------|:-----------------------|:-------------------|:-------------------------|:-------------|
| 1  | `tim_biro` | `id_biro` | `biro` | `id_biro` | CASCADE | 1 : N |
| 2  | `pengguna` | `id_biro` | `biro` | `id_biro` | RESTRICT | 1 : N |
| 3  | `pengguna` | `id_tim` | `tim_biro` | `id_tim` | SET NULL | 1 : N (Opsional) |
| 4  | `penomoran_rapat_biro` | `id_biro` | `biro` | `id_biro` | CASCADE | 1 : 1 (Unique) |
| 5  | `rapat` | `id_biro` | `biro` | `id_biro` | RESTRICT | 1 : N |
| 6  | `rapat` | `id_tim` | `tim_biro` | `id_tim` | SET NULL | 1 : N (Opsional) |
| 7  | `rapat` | `id_pengguna` | `pengguna` | `id_pengguna` | SET NULL | 1 : N (Pimpinan) |
| 8  | `rapat` | `id_notulis` | `pengguna` | `id_pengguna` | SET NULL | 1 : N (Notulis) |
| 9  | `rapat` | `id_rapat_sebelumnya` | `rapat` | `id_rapat` | SET NULL | 0..1 : N (Unary) |
| 10 | `rapat_biro` | `id_rapat` | `rapat` | `id_rapat` | CASCADE | M : N (Junction) |
| 11 | `rapat_biro` | `id_biro` | `biro` | `id_biro` | RESTRICT | M : N (Junction) |
| 12 | `peserta_rapat` | `id_rapat` | `rapat` | `id_rapat` | CASCADE | 1 : N |
| 13 | `peserta_rapat` | `id_pengguna` | `pengguna` | `id_pengguna` | CASCADE | 1 : N |
| 14 | `lampiran_rapat` | `id_rapat` | `rapat` | `id_rapat` | CASCADE | 1 : N |
| 15 | `notulen_rapat` | `id_rapat` | `rapat` | `id_rapat` | CASCADE | 1 : 1 (Unique) |
| 16 | `komentar_notulen` | `id_rapat` | `rapat` | `id_rapat` | CASCADE | 1 : N |
| 17 | `komentar_notulen` | `id_pengguna` | `pengguna` | `id_pengguna` | SET NULL | 1 : N |
| 18 | `komentar_notulen` | `id_induk` | `komentar_notulen` | `id_komentar` | CASCADE | 0..1 : N (Unary) |
| 19 | `riwayat_notulen` | `id_rapat` | `rapat` | `id_rapat` | CASCADE | 1 : N |
| 20 | `riwayat_notulen` | `id_pengguna` | `pengguna` | `id_pengguna` | SET NULL | 1 : N |
| 21 | `tindak_lanjut` | `id_rapat` | `rapat` | `id_rapat` | CASCADE | 1 : N |
| 22 | `tindak_lanjut` | `id_biro` | `biro` | `id_biro` | RESTRICT | 1 : N |
| 23 | `tindak_lanjut` | `id_tim` | `tim_biro` | `id_tim` | SET NULL | 1 : N (Opsional) |
| 24 | `tindak_lanjut` | `id_pengguna` | `pengguna` | `id_pengguna` | SET NULL | 1 : N (PIC) |
| 25 | `riwayat_tindak_lanjut`| `id_tindak_lanjut`| `tindak_lanjut` | `id_tindak_lanjut`| CASCADE | 1 : N |
| 26 | `riwayat_tindak_lanjut`| `id_pengguna` | `pengguna` | `id_pengguna` | SET NULL | 1 : N |
| 27 | `notifikasi` | `id_pengguna` | `pengguna` | `id_pengguna` | CASCADE | 1 : N |

---

## 5. Teks Deskripsi (Caption) Laporan Skripsi / Tugas Akhir

> **Gambar 3.x: Logical Record Structure (LRS) Log_Book_Rapat KEK RI**
> 
> *Gambar di atas menampilkan Logical Record Structure (LRS) hasil transformasi terstruktur dari Entity Relationship Diagram (ERD) basis data Log_Book_Rapat KEK RI yang telah mencapai bentuk normal ketiga (3NF). Seluruh 14 tabel diorganisasikan ke dalam 5 klaster fungsional (Organisasi, Pelaksanaan Rapat, Notulensi, Tindak Lanjut, dan Komunikasi Sistem). Hubungan Many-to-Many antara tabel rapat dan biro ditransformasikan menjadi entitas perantara bernama rapat_biro dengan Composite Primary Key (id_rapat, id_biro). Relasi One-to-Many diimplementasikan dengan menempatkan Primary Key dari entitas induk sebagai Foreign Key pada entitas anak. Sementara relasi One-to-One pada notulen_rapat dan penomoran_rapat_biro dikunci menggunakan Unique Constraint pada atribut Foreign Key guna menjamin konsistensi kardinalitas tepat satu.*
