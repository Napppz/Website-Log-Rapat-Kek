# DOKUMEN PERANCANGAN TAHAP 2: LOGICAL RECORD STRUCTURE (LRS)
## Sistem Informasi Manajemen Rapat & Tindak Lanjut (SIM-RAPAT KEK RI)
**Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus Republik Indonesia**

Dokumen ini memuat spesifikasi lengkap **Logical Record Structure (LRS)** yang ditransformasikan secara sistematis dari Entity Relationship Diagram (ERD), siap dibuka di **Draw.io (diagrams.net)**, dan dirancang khusus untuk memenuhi standar penulisan laporan teknis, skripsi, maupun tugas akhir.

---

## 1. File Draw.io Siap Pakai

File diagram LRS resmi telah disediakan di repository:
* **Lokasi File Lokal:** [`docs/LRS_SIM_RAPAT.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LRS_SIM_RAPAT.drawio)
* **Tautan Unduh Web:** [http://localhost:3000/LRS_SIM_RAPAT.drawio](http://localhost:3000/LRS_SIM_RAPAT.drawio)
* **Viewer Interaktif Web:** [http://localhost:3000/uml-viewer.html](http://localhost:3000/uml-viewer.html)

### Cara Membuka di Draw.io (diagrams.net):
1. Buka browser dan kunjungi **[app.diagrams.net](https://app.diagrams.net)** (atau aplikasi desktop Draw.io).
2. Pilih menu **File** &rarr; **Open From** &rarr; **Device...**
3. Pilih file [`docs/LRS_SIM_RAPAT.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/LRS_SIM_RAPAT.drawio).
4. Diagram akan terbuka dengan notasi LRS resmi standar akademik (sesuai kaidah buku teks basis data / format Scribd):
   - **Kartu Tabel:** Header kotak abu-abu berbingkai hitam dengan nama tabel tebal di tengah; body kotak putih berbingkai hitam berisi daftar atribut.
   - **Kunci Identitas:** Primary Key berpenanda `[PK]` dan Foreign Key berpenanda `[FK]` (atau `[PK, FK]` untuk tabel perantara).
   - **Alur Relasi:** Garis relasi orthogonal hitam tegak lurus dengan derajat kardinalitas `1` pada sisi induk dan `M` (atau `1`) pada sisi kunci tamu, dilengkapi tanda panah (`→`) yang mengarah tepat ke tabel pemegang Foreign Key.
   - **Zero Collision:** Seluruh konektor tertata rapi pada koridor antar-kartu tanpa menabrak atau memotong kotak tabel manapun.


---

## 2. Kaidah Transformasi ERD Menjadi LRS

LRS dibentuk melalui aturan pemetaan baku (*mapping rules*) basis data relasional:

### A. Aturan Relasi Satu-ke-Satu (1 : 1)
* **Kasus 1: `biro` &mdash; `penomoran_rapat_biro`**
  * Primary Key dari entitas induk (`biro_id` dari `biro`) disematkan sebagai Foreign Key sekaligus Unique Key (`biro_id`) pada tabel `penomoran_rapat_biro`.
* **Kasus 2: `rapat` &mdash; `notulen_rapat`**
  * Satu rapat hanya menghasilkan tepat satu notula resmi. Primary Key `meeting_id` dari `rapat` disematkan sebagai Foreign Key unik pada tabel `notulen_rapat`.

### B. Aturan Relasi Satu-ke-Banyak (1 : N)
Primary Key pada entitas berderajat **1 (Parent)** ditempatkan sebagai Foreign Key pada entitas berderajat **N (Child)**:
* `biro(biro_id)` &rarr; disematkan ke `pengguna(biro_id)`
* `biro(biro_id)` &rarr; disematkan ke `rapat(primary_biro_id)`
* `biro(biro_id)` &rarr; disematkan ke `tindak_lanjut(pic_biro_id)`
* `pengguna(user_id)` &rarr; disematkan ke `rapat(chairperson_id)` dan `rapat(secretary_id)`
* `pengguna(user_id)` &rarr; disematkan ke `peserta_rapat(user_id)`
* `pengguna(user_id)` &rarr; disematkan ke `tindak_lanjut(pic_user_id)`
* `rapat(meeting_id)` &rarr; disematkan ke `tindak_lanjut(meeting_id)`
* `rapat(meeting_id)` &rarr; disematkan ke `peserta_rapat(meeting_id)`

### C. Aturan Relasi Banyak-ke-Banyak (M : N)
* **Kasus: `rapat` &mdash; `biro` (Rapat Gabungan Lintas Biro)**
  * Pada ERD, satu rapat dapat melibatkan banyak biro, dan satu biro dapat terlibat dalam banyak rapat.
  * Pada LRS, relasi M:N wajib dipecah menjadi tabel perantara (*junction table*) bernama **`rapat_biro`**.
  * Tabel `rapat_biro` memiliki **Composite Primary Key** yang terdiri dari gabungan `meeting_id` dan `biro_id`.

### D. Aturan Relasi Rekursif / Unary (0..1 : N)
* **Kasus: `rapat` &mdash; `rapat` (Rapat Rujukan / Tindak Lanjut)**
  * Rapat koordinasi lanjutan merujuk pada rapat terdahulu. Menghasilkan Foreign Key `previous_meeting_id` di dalam tabel `rapat` itu sendiri (*self-referencing*).

---

## 3. Struktur Rekod LRS (Logical Record Structure)

Berikut adalah representasi 8 rekod logis basis data SIM-RAPAT KEK RI:

```text
1. biro
   ├── *id_biro : VARCHAR(50) <PK>
   ├── kode_biro : VARCHAR(20) <UK>
   ├── nama_biro : VARCHAR(255)
   ├── nama_singkat : VARCHAR(100)
   ├── deskripsi : TEXT
   ├── status_aktif : BOOLEAN
   ├── dibuat_pada : TIMESTAMP
   └── diperbarui_pada : TIMESTAMP

2. penomoran_rapat_biro
   ├── *id_penomoran : VARCHAR(50) <PK>
   ├── **id_biro : VARCHAR(50) <FK, UK> ─── (Relasi 1:1 dari biro)
   ├── nomor_terakhir : INTEGER
   ├── dibuat_pada : TIMESTAMP
   └── diperbarui_pada : TIMESTAMP

3. pengguna
   ├── *id_pengguna : VARCHAR(50) <PK>
   ├── **id_biro : VARCHAR(50) <FK> ───────── (Relasi 1:N dari biro)
   ├── email : VARCHAR(150) <UK>
   ├── nama_lengkap : VARCHAR(150)
   ├── kata_sandi : VARCHAR(255)
   ├── peran : ENUM('SUPER_ADMIN', 'ADMIN', 'NOTULIS', 'STAFF', 'VIEWER')
   ├── status_aktif : BOOLEAN
   ├── dibuat_pada : TIMESTAMP
   └── diperbarui_pada : TIMESTAMP

4. rapat
   ├── *id_rapat : VARCHAR(50) <PK>
   ├── nomor_rapat : VARCHAR(50) <UK>
   ├── **id_biro : VARCHAR(50) <FK> ──────── (Relasi 1:N dari biro)
   ├── **id_pengguna : VARCHAR(50) <FK> ──── (Relasi 1:N dari pengguna - Pimpinan)
   ├── **id_notulis : VARCHAR(50) <FK> ───── (Relasi 1:N dari pengguna - Notulis)
   ├── **id_rapat_sebelumnya : VARCHAR(50) <FK> (Relasi 0..1:N Rekursif dari rapat)
   ├── judul_rapat : VARCHAR(255)
   ├── tanggal_rapat : DATE
   ├── waktu_mulai : VARCHAR(10)
   ├── waktu_selesai : VARCHAR(10)
   ├── lokasi_rapat : VARCHAR(255)
   ├── status_rapat : ENUM('DRAFT', 'REVIEW', 'APPROVED', 'FINAL')
   ├── dibuat_pada : TIMESTAMP
   └── diperbarui_pada : TIMESTAMP

5. rapat_biro (Junction Table)
   ├── *id_rapat : VARCHAR(50) <PK, FK> ──── (Relasi 1:N dari rapat)
   └── *id_biro : VARCHAR(50) <PK, FK> ───── (Relasi 1:N dari biro)

6. peserta_rapat
   ├── *id_peserta : VARCHAR(50) <PK>
   ├── **id_rapat : VARCHAR(50) <FK> ─────── (Relasi 1:N dari rapat)
   ├── **id_pengguna : VARCHAR(50) <FK> ──── (Relasi 1:N dari pengguna)
   ├── status_kehadiran : ENUM('INVITED', 'PRESENT', 'ABSENT', 'EXCUSED')
   └── dibuat_pada : TIMESTAMP

7. notulen_rapat
   ├── *id_notulen : VARCHAR(50) <PK>
   ├── **id_rapat : VARCHAR(50) <FK, UK> ─── (Relasi 1:1 dari rapat)
   ├── agenda_pembahasan : JSON
   ├── hasil_pembahasan : JSON
   ├── poin_keputusan : JSON
   ├── kesimpulan : JSON
   ├── dibuat_pada : TIMESTAMP
   └── diperbarui_pada : TIMESTAMP

8. tindak_lanjut
   ├── *id_tindak_lanjut : VARCHAR(50) <PK>
   ├── **id_rapat : VARCHAR(50) <FK> ─────── (Relasi 1:N dari rapat)
   ├── **id_biro : VARCHAR(50) <FK> ──────── (Relasi 1:N dari biro)
   ├── **id_pengguna : VARCHAR(50) <FK> ──── (Relasi 1:N dari pengguna, Opsional)
   ├── judul_tindakan : VARCHAR(255)
   ├── deskripsi_tindakan : TEXT
   ├── tenggat_waktu : TIMESTAMP
   ├── status_tindak_lanjut : ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')
   ├── skala_prioritas : ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT')
   ├── diselesaikan_pada : TIMESTAMP
   ├── dibuat_pada : TIMESTAMP
   └── diperbarui_pada : TIMESTAMP
```

---

## 4. Teks Deskripsi (Caption) Siap Salin untuk Dokumen Laporan

> **Gambar 3.x: Logical Record Structure (LRS) SIM-RAPAT KEK RI**
> 
> *Gambar di atas menampilkan Logical Record Structure (LRS) hasil transformasi dari Entity Relationship Diagram (ERD). Pada tahap pemodelan logis ini, kardinalitas Many-to-Many antara tabel rapat dan biro telah direalisasikan menjadi tabel perantara bernama rapat_biro dengan Primary Key komposit (meeting_id, biro_id). Seluruh relasi 1:N telah dipetakan dengan menempatkan Primary Key entitas induk ke dalam entitas turunan sebagai Foreign Key (ditandai dengan prefix **FK). Sedangkan relasi 1:1 pada notulen_rapat dan penomoran_rapat_biro menerapkan batasan Unique Constraint pada kunci tamunya untuk menjamin integritas referensial satu-ke-satu secara konsisten.*
