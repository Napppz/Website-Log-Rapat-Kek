# DOKUMEN PERANCANGAN TAHAP 1: ENTITY RELATIONSHIP DIAGRAM (ERD) - NOTASI CHEN
## Sistem Informasi Manajemen Rapat & Tindak Lanjut (SIM-RAPAT KEK RI)
**Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus Republik Indonesia**

Dokumen ini memuat spesifikasi lengkap **Entity Relationship Diagram (ERD)** dengan **Standar Notasi Chen Klasik** (Entitas Persegi Panjang, Relasi Belah Ketupat/Diamond, Atribut Elips dengan Primary Key Bergaris Bawah), siap dibuka di **Draw.io (diagrams.net)**, serta sesuai kaidah buku teks akademik untuk laporan skripsi/tugas akhir.

---

## 1. File Draw.io Siap Pakai

File diagram Draw.io resmi telah disediakan di repository:
* **Lokasi File Lokal:** [`docs/ERD_SIM_RAPAT.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/ERD_SIM_RAPAT.drawio)
* **Tautan Unduh Web:** [http://localhost:3000/ERD_SIM_RAPAT.drawio](http://localhost:3000/ERD_SIM_RAPAT.drawio)
* **Pratinjau Visual Notasi Chen:** [http://localhost:3000/erd-chen-preview.html](http://localhost:3000/erd-chen-preview.html)
* **Viewer Interaktif Web:** [http://localhost:3000/uml-viewer.html](http://localhost:3000/uml-viewer.html)

### Kaidah Visual Notasi Chen:
1. **Persegi Panjang (Rectangle):** Merepresentasikan Entitas (`biro`, `pengguna`, `rapat`, `notulen_rapat`, `tindak_lanjut`, `penomoran_rapat_biro`).
2. **Belah Ketupat (Rhombus/Diamond):** Merepresentasikan Relasi antar-entitas (`memiliki`, `mengatur`, `menyelenggarakan`, `melibatkan`, `memimpin & notulis`, `menghadiri`, `menghasilkan`, `menetapkan`, `pic_biro`, `pic_user`).
3. **Elips (Ellipse):** Merepresentasikan Atribut data.
4. **Teks Bergaris Bawah (Underline):** Menandakan **Primary Key (PK)** entitas (misal: `<u>biro_id</u>`, `<u>user_id</u>`, `<u>meeting_id</u>`).
5. **Derajat Kardinalitas (1 / N / M):** Dituliskan pada garis penghubung antara entitas dan belah ketupat relasi.

---

## 2. Kamus Entitas & Atribut ERD (Tabel Basis Data Resmi di Neon DB: `snake_case`)

Terdapat **8 tabel utama** dalam basis data PostgreSQL (Neon DB) yang memodelkan seluruh proses bisnis tata kelola rapat dan tindak lanjut:

### A. Tabel `biro` (Master 5 Biro KEK)
Entitas master unit kerja di lingkungan Sekretariat Jenderal Dewan Nasional KEK.
* **`biro_id` (PK, String)** : Format bersih `BIRO-BPPK`, `BIRO-PKKEK`, `BIRO-IKK`, `BIRO-HSDMO`, `BIRO-UK`.
* **`code` (UK, String)** : Kode singkatan biro (`BPPK`, `PKKEK`, `IKK`, `HSDMO`, `UK`).
* **`name` (String)** : Nama resmi biro.
* **`shortName` (String)** : Nama pendek untuk label kartu antarmuka.
* **`description` (Text)** : Uraian tupoksi biro.
* **`isActive` (Boolean)** : Status aktif biro (`true`/`false`).
* **`createdAt` (DateTime)** : Waktu pembuatan data.
* **`updatedAt` (DateTime)** : Waktu pembaharuan data.

### B. Tabel `pengguna` (Pengguna, Pegawai, & Pimpinan)
Entitas pengguna sistem, pimpinan rapat, notulis, dan PIC tindak lanjut.
* **`user_id` (PK, String)** : Format bersih `USR-001`, `USR-002`, ..., `USR-029`.
* **`biro_id` (FK, String)** : Mengacu ke `biro(biro_id)` tempat pegawai bertugas.
* **`name` (String)** : Nama lengkap beserta gelar.
* **`email` (UK, String)** : Email dinas untuk autentikasi login.
* **`password` (String)** : Password terenkripsi (Argon2 / Bcrypt).
* **`role` (Enum)** : Hak akses (`SUPER_ADMIN`, `ADMIN`, `NOTULIS`, `STAFF`, `VIEWER`).
* **`isActive` (Boolean)** : Status keaktifan akun.
* **`createdAt` / `updatedAt` (DateTime)** : Audit trail waktu.

### C. Tabel `rapat` (Agenda Rapat Dinas KEK)
Entitas inti penyelenggaraan sidang dan rapat koordinasi dinas.
* **`meeting_id` (PK, String)** : Format bersih `MTG-001`, `MTG-002`, ..., `MTG-018`.
* **`meeting_number` (UK, String)** : Nomor resmi registrasi undangan (contoh: `IKK-015`, `BPPK-001`).
* **`primary_biro_id` (FK, String)** : Mengacu ke `biro(biro_id)` sebagai biro pemrakarsa/tuan rumah.
* **`chairperson_id` (FK, String, Nullable)** : Mengacu ke `pengguna(user_id)` yang memimpin sidang.
* **`secretary_id` (FK, String, Nullable)** : Mengacu ke `pengguna(user_id)` yang mencatat notula.
* **`previous_meeting_id` (FK, String, Nullable)** : Self-referencing ke `rapat(meeting_id)` jika rapat ini merupakan tindak lanjut langsung dari rapat sebelumnya.
* **`title` (String)** : Judul agenda rapat.
* **`date` (Date)** : Tanggal pelaksanaan rapat.
* **`startTime` / `endTime` (String)** : Rentang jam (WIB).
* **`location` (String)** : Ruang sidang fisik atau tautan telekonferensi.
* **`status` (Enum)** : Siklus hidup rapat (`DRAFT`, `REVIEW`, `APPROVED`, `FINAL`).
* **`createdAt` / `updatedAt` (DateTime)** : Audit trail waktu.

### D. Tabel `notulen_rapat` (Dokumen Notula Resmi)
Naskah risalah resmi hasil persidangan.
* **`minutes_id` (PK, String)** : Format bersih `NOT-001`, `NOT-002`, ..., `NOT-007`.
* **`meeting_id` (FK, String, Unique)** : Relasi unik 1-ke-1 ke `rapat(meeting_id)`.
* **`agenda` (JSON)** : Butir-butir agenda sidang yang dibahas.
* **`discussion` (JSON)** : Rangkuman pokok substansi dan dinamika pembahasan.
* **`decisions` (JSON)** : Keputusan dan kesepakatan final sidang.
* **`conclusion` (JSON)** : Informasi penandatangan, pimpinan, dan legalitas notula.
* **`createdAt` / `updatedAt` (DateTime)** : Waktu registrasi dan revisi notula.

### E. Tabel `tindak_lanjut` (Butir Tindak Lanjut / Resolusi)
Penugasan arahan strategis tindak lanjut hasil rapat kepada biro dan pegawai.
* **`action_item_id` (PK, String)** : Format bersih `ACT-001`, `ACT-002`, ..., `ACT-010`.
* **`meeting_id` (FK, String)** : Mengacu ke `rapat(meeting_id)` sumber resolusi.
* **`pic_biro_id` (FK, String)** : Mengacu ke `biro(biro_id)` penanggung jawab teknis.
* **`pic_user_id` (FK, String, Nullable)** : Mengacu ke `pengguna(user_id)` sebagai person in charge spesifik.
* **`title` (String)** : Ringkasan tindakan yang harus diselesaikan.
* **`description` (Text, Nullable)** : Penjelasan detail arahan pimpinan.
* **`dueDate` (DateTime)** : Batas akhir (*deadline*) pemenuhan tindak lanjut.
* **`status` (Enum)** : Status progres (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`).
* **`priority` (Enum)** : Tingkat urgensi (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
* **`completedAt` (DateTime, Nullable)** : Waktu penyelesaian tugas.

### F. Tabel `peserta_rapat` (Absensi Kehadiran)
Daftar kehadiran peserta undangan rapat.
* **`participant_id` (PK, String)** : Format bersih `PRT-001`, ..., `PRT-057`.
* **`meeting_id` (FK, String)** : Mengacu ke `rapat(meeting_id)`.
* **`user_id` (FK, String)** : Mengacu ke `pengguna(user_id)`.
* **`attendanceStatus` (Enum)** : Status kehadiran (`INVITED`, `PRESENT`, `ABSENT`, `EXCUSED`).
* **`createdAt` (DateTime)** : Waktu pencatatan absensi.

### G. Tabel `rapat_biro` (Tabel Junction Biro Terlibat)
Tabel relasi *Many-to-Many* (M:N) untuk rapat lintas biro.
* **`meeting_id` (Composite PK, FK, String)** : Mengacu ke `rapat(meeting_id)`.
* **`biro_id` (Composite PK, FK, String)** : Mengacu ke `biro(biro_id)`.

### H. Tabel `penomoran_rapat_biro` (Generator Nomor Surat)
Pencatat nomor counter otomatis per biro (contoh: `IKK-015`).
* **`sequence_id` (PK, String)** : Format bersih `SEQ-001`, ..., `SEQ-005`.
* **`biro_id` (FK, String, Unique)** : Mengacu ke `biro(biro_id)` (1:1).
* **`currentNumber` (Integer)** : Angka urut terakhir yang telah diterbitkan.

---

## 3. Matriks Relasi & Kardinalitas (Crow's Foot Notation)

| No | Entitas Asal | Relasi Bisnis | Entitas Tujuan | Kardinalitas | Atribut Kunci Penghubung |
|:---|:---|:---|:---|:---:|:---|
| 1 | **`biro`** | Mempekerjakan staf & pejabat | **`pengguna`** | `1 : N` | `biro.biro_id` &rarr; `pengguna.biro_id` |
| 2 | **`biro`** | Menyelenggarakan rapat utama | **`rapat`** | `1 : N` | `biro.biro_id` &rarr; `rapat.primary_biro_id` |
| 3 | **`biro`** | Memiliki penomoran surat otomatis | **`penomoran_rapat_biro`** | `1 : 1` | `biro.biro_id` &rarr; `penomoran_rapat_biro.biro_id` |
| 4 | **`biro`** | Bertanggung jawab atas tindak lanjut | **`tindak_lanjut`** | `1 : N` | `biro.biro_id` &rarr; `tindak_lanjut.pic_biro_id` |
| 5 | **`biro`** | Terlibat dalam rapat gabungan | **`rapat_biro`** | `1 : N` | `biro.biro_id` &rarr; `rapat_biro.biro_id` |
| 6 | **`pengguna`** | Memimpin jalannya persidangan | **`rapat`** | `1 : N` | `pengguna.user_id` &rarr; `rapat.chairperson_id` |
| 7 | **`pengguna`** | Menjadi notulis resmi sidang | **`rapat`** | `1 : N` | `pengguna.user_id` &rarr; `rapat.secretary_id` |
| 8 | **`pengguna`** | Menghadiri persidangan | **`peserta_rapat`** | `1 : N` | `pengguna.user_id` &rarr; `peserta_rapat.user_id` |
| 9 | **`pengguna`** | Ditugaskan sebagai PIC personal | **`tindak_lanjut`** | `1 : N` | `pengguna.user_id` &rarr; `tindak_lanjut.pic_user_id` |
| 10 | **`rapat`** | Menghasilkan naskah risalah resmi | **`notulen_rapat`** | `1 : 1` | `rapat.meeting_id` &rarr; `notulen_rapat.meeting_id` |
| 11 | **`rapat`** | Memiliki daftar absensi kehadiran | **`peserta_rapat`** | `1 : N` | `rapat.meeting_id` &rarr; `peserta_rapat.meeting_id` |
| 12 | **`rapat`** | Melibatkan biro mitra | **`rapat_biro`** | `1 : N` | `rapat.meeting_id` &rarr; `rapat_biro.meeting_id` |
| 13 | **`rapat`** | Menetapkan butir tindak lanjut | **`tindak_lanjut`** | `1 : N` | `rapat.meeting_id` &rarr; `tindak_lanjut.meeting_id` |
| 14 | **`rapat`** | Merujuk agenda rapat sebelumnya | **`rapat`** | `0..1 : N` | `rapat.meeting_id` &rarr; `rapat.previous_meeting_id` |

---

## 4. Diagram Visual (Mermaid ERD)

```mermaid
erDiagram
    biro ||--o{ pengguna : "1:N mempekerjakan"
    biro ||--o{ rapat : "1:N menyelenggarakan"
    biro ||--|| penomoran_rapat_biro : "1:1 penomoran surat"
    biro ||--o{ tindak_lanjut : "1:N penanggung jawab"
    biro ||--o{ rapat_biro : "1:N biro terlibat"

    pengguna ||--o{ peserta_rapat : "1:N absensi kehadiran"
    pengguna ||--o{ tindak_lanjut : "0..1:N PIC personal"
    pengguna ||--o{ rapat : "1:N pimpinan / notulis"

    rapat ||--|| notulen_rapat : "1:1 naskah notula"
    rapat ||--o{ tindak_lanjut : "1:N resolusi sidang"
    rapat ||--o{ peserta_rapat : "1:N daftar peserta"
    rapat ||--o{ rapat_biro : "1:N junction biro"
    rapat ||--o| rapat : "0..1 rujukan sebelumnya"

    biro {
        string biro_id PK "BIRO-IKK, BIRO-BPPK"
        string code UK "BPPK, PKKEK, IKK, HSDMO, UK"
        string name "Nama Lengkap Biro"
        string shortName "Nama Singkat Biro"
        string description "Deskripsi Tupoksi"
        boolean isActive "Status Aktif"
    }

    pengguna {
        string user_id PK "USR-001, USR-002"
        string biro_id FK "Relasi ke biro"
        string name "Nama Pengguna"
        string email UK "Email Login"
        string role "SUPER_ADMIN, ADMIN, NOTULIS, STAFF"
        boolean isActive "Status Akun Aktif"
    }

    rapat {
        string meeting_id PK "MTG-001, MTG-002"
        string meeting_number UK "IKK-015, BPPK-001"
        string primary_biro_id FK "Biro Pemrakarsa"
        string chairperson_id FK "Pimpinan Sidang"
        string secretary_id FK "Notulis Sidang"
        string previous_meeting_id FK "Rujukan Rapat Sebelumnya"
        string title "Judul Rapat"
        date date "Tanggal Pelaksanaan"
        string status "DRAFT, REVIEW, APPROVED, FINAL"
    }

    notulen_rapat {
        string minutes_id PK "NOT-001, NOT-002"
        string meeting_id FK "1:1 Unique ke rapat"
        json agenda "Agenda Pembahasan"
        json discussion "Substansi Pembahasan"
        json decisions "Keputusan / Hasil Sidang"
        json conclusion "Pengesahan & Legalitas"
    }

    tindak_lanjut {
        string action_item_id PK "ACT-001, ACT-002"
        string meeting_id FK "Relasi ke rapat"
        string pic_biro_id FK "Biro Penanggung Jawab"
        string pic_user_id FK "Pegawai PIC Spesifik"
        string title "Ringkasan Tindak Lanjut"
        datetime dueDate "Tenggat Waktu Selesai"
        string status "PENDING, IN_PROGRESS, COMPLETED"
        string priority "LOW, MEDIUM, HIGH, URGENT"
    }

    peserta_rapat {
        string participant_id PK "PRT-001, PRT-002"
        string meeting_id FK "Relasi ke rapat"
        string user_id FK "Relasi ke pengguna"
        string attendanceStatus "INVITED, PRESENT, ABSENT"
    }

    rapat_biro {
        string meeting_id PK_FK "Relasi ke rapat"
        string biro_id PK_FK "Relasi ke biro"
    }

    penomoran_rapat_biro {
        string sequence_id PK "SEQ-001, SEQ-002"
        string biro_id FK "1:1 Unique ke biro"
        int currentNumber "Nomor Urut Terakhir"
    }
```
