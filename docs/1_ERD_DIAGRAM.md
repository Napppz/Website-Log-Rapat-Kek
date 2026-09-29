# DOKUMEN PERANCANGAN TAHAP 1: ENTITY RELATIONSHIP DIAGRAM (ERD)
## Sistem Informasi Manajemen Rapat & Tindak Lanjut (SIM-RAPAT KEK RI)
**Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus Republik Indonesia**

Dokumen ini memuat spesifikasi lengkap **Entity Relationship Diagram (ERD)** yang dirancang khusus untuk kompatibilitas penuh dengan **Draw.io (diagrams.net)**, PlantUML, dan Mermaid, lengkap dengan kamus data dan kardinalitas relasi.

---

## 1. File Draw.io Siap Pakai

File diagram Draw.io resmi telah disediakan di repository:
* **Lokasi File Lokal:** [`docs/ERD_SIM_RAPAT.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/ERD_SIM_RAPAT.drawio)
* **Tautan Unduh Web:** [http://localhost:3000/ERD_SIM_RAPAT.drawio](http://localhost:3000/ERD_SIM_RAPAT.drawio)
* **Viewer Interaktif Web:** [http://localhost:3000/uml-viewer.html](http://localhost:3000/uml-viewer.html)

### Cara Membuka di Draw.io (diagrams.net):
1. Buka browser dan kunjungi **[app.diagrams.net](https://app.diagrams.net)** (atau buka aplikasi desktop Draw.io).
2. Pilih menu **File** &rarr; **Open From** &rarr; **Device...** (atau seret (*drag & drop*) file `ERD_SIM_RAPAT.drawio` langsung ke kanvas).
3. Diagram akan terbuka dengan tata letak rapi, warna resmi SIM-RAPAT KEK (`#215865`), tabel entitas ber-header, serta konektor Crow's Foot.

---

## 2. Kamus Entitas & Atribut ERD

Terdapat **8 entitas utama** yang memodelkan seluruh proses bisnis tata kelola rapat dan tindak lanjut:

### A. Tabel `BIRO` (Master 5 Biro KEK)
Entitas master unit kerja di lingkungan Sekretariat Jenderal Dewan Nasional KEK.
* **`biro_id` (PK, String)** : Format bersih `BIRO-BPPK`, `BIRO-PKKEK`, `BIRO-IKK`, `BIRO-HSDMO`, `BIRO-UK`.
* **`code` (UK, String)** : Kode singkatan biro (`BPPK`, `PKKEK`, `IKK`, `HSDMO`, `UK`).
* **`name` (String)** : Nama resmi biro.
* **`shortName` (String)** : Nama pendek untuk label kartu antarmuka.
* **`description` (Text)** : Uraian tupoksi biro.
* **`isActive` (Boolean)** : Status aktif biro (`true`/`false`).
* **`createdAt` (DateTime)** : Waktu pembuatan data.
* **`updatedAt` (DateTime)** : Waktu pembaharuan data.

### B. Tabel `USER` (Pengguna & Pegawai)
Entitas pengguna sistem, pimpinan rapat, notulis, dan PIC tindak lanjut.
* **`user_id` (PK, String)** : Format bersih `USR-001`, `USR-002`, ..., `USR-029`.
* **`biro_id` (FK, String)** : Mengacu ke `BIRO(biro_id)` tempat pegawai bertugas.
* **`name` (String)** : Nama lengkap beserta gelar.
* **`email` (UK, String)** : Email dinas untuk autentikasi login.
* **`password` (String)** : Password terenkripsi (Argon2 / Bcrypt).
* **`role` (Enum)** : Hak akses (`SUPER_ADMIN`, `ADMIN`, `NOTULIS`, `STAFF`, `VIEWER`).
* **`isActive` (Boolean)** : Status keaktifan akun.
* **`createdAt` / `updatedAt` (DateTime)** : Audit trail waktu.

### C. Tabel `MEETING` (Agenda Rapat Dinas KEK)
Entitas inti penyelenggaraan sidang dan rapat koordinasi dinas.
* **`meeting_id` (PK, String)** : Format bersih `MTG-001`, `MTG-002`, ..., `MTG-018`.
* **`meeting_number` (UK, String)** : Nomor resmi registrasi undangan (contoh: `IKK-015`, `BPPK-001`).
* **`primary_biro_id` (FK, String)** : Mengacu ke `BIRO(biro_id)` sebagai biro pemrakarsa/tuan rumah.
* **`chairperson_id` (FK, String, Nullable)** : Mengacu ke `USER(user_id)` yang memimpin sidang.
* **`secretary_id` (FK, String, Nullable)** : Mengacu ke `USER(user_id)` yang mencatat notula.
* **`previous_meeting_id` (FK, String, Nullable)** : Self-referencing ke `MEETING(meeting_id)` jika rapat ini merupakan tindak lanjut langsung dari rapat sebelumnya.
* **`title` (String)** : Judul agenda rapat.
* **`date` (Date)** : Tanggal pelaksanaan rapat.
* **`startTime` / `endTime` (String)** : Rentang jam (WIB).
* **`location` (String)** : Ruang sidang fisik atau tautan telekonferensi.
* **`status` (Enum)** : Siklus hidup rapat (`DRAFT`, `REVIEW`, `APPROVED`, `FINAL`).
* **`createdAt` / `updatedAt` (DateTime)** : Audit trail waktu.

### D. Tabel `MEETING_MINUTES` (Dokumen Notula Resmi)
Naskah risalah resmi hasil persidangan.
* **`minutes_id` (PK, String)** : Format bersih `NOT-001`, `NOT-002`, ..., `NOT-007`.
* **`meeting_id` (FK, String, Unique)** : Relasi unik 1-ke-1 ke `MEETING(meeting_id)`.
* **`agenda` (JSON)** : Butir-butir agenda sidang yang dibahas.
* **`discussion` (JSON)** : Rangkuman pokok substansi dan dinamika pembahasan.
* **`decisions` (JSON)** : Keputusan dan kesepakatan final sidang.
* **`conclusion` (JSON)** : Informasi penandatangan, pimpinan, dan legalitas notula.
* **`createdAt` / `updatedAt` (DateTime)** : Waktu registrasi dan revisi notula.

### E. Tabel `ACTION_ITEM` (Butir Tindak Lanjut / Resolusi)
Penugasan arahan strategis tindak lanjut hasil rapat kepada biro dan pegawai.
* **`action_item_id` (PK, String)** : Format bersih `ACT-001`, `ACT-002`, ..., `ACT-010`.
* **`meeting_id` (FK, String)** : Mengacu ke `MEETING(meeting_id)` sumber resolusi.
* **`pic_biro_id` (FK, String)** : Mengacu ke `BIRO(biro_id)` penanggung jawab teknis.
* **`pic_user_id` (FK, String, Nullable)** : Mengacu ke `USER(user_id)` sebagai person in charge spesifik.
* **`title` (String)** : Ringkasan tindakan yang harus diselesaikan.
* **`description` (Text, Nullable)** : Penjelasan detail arahan pimpinan.
* **`dueDate` (DateTime)** : Batas akhir (*deadline*) pemenuhan tindak lanjut.
* **`status` (Enum)** : Status progres (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`).
* **`priority` (Enum)** : Tingkat urgensi (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
* **`completedAt` (DateTime, Nullable)** : Waktu penyelesaian tugas.

### F. Tabel `MEETING_PARTICIPANT` (Absensi Kehadiran)
Daftar kehadiran peserta undangan rapat.
* **`participant_id` (PK, String)** : Format bersih `PRT-001`, ..., `PRT-057`.
* **`meeting_id` (FK, String)** : Mengacu ke `MEETING(meeting_id)`.
* **`user_id` (FK, String)** : Mengacu ke `USER(user_id)`.
* **`attendanceStatus` (Enum)** : Status kehadiran (`INVITED`, `PRESENT`, `ABSENT`, `EXCUSED`).
* **`createdAt` (DateTime)** : Waktu pencatatan absensi.

### G. Tabel `MEETING_BIRO` (Tabel Junction Biro Terlibat)
Tabel relasi *Many-to-Many* (M:N) untuk rapat lintas biro.
* **`meeting_id` (Composite PK, FK, String)** : Mengacu ke `MEETING(meeting_id)`.
* **`biro_id` (Composite PK, FK, String)** : Mengacu ke `BIRO(biro_id)`.

### H. Tabel `BIRO_MEETING_SEQUENCE` (Generator Nomor Surat)
Pencatat nomor counter otomatis per biro (contoh: `IKK-015`).
* **`sequence_id` (PK, String)** : Format bersih `SEQ-001`, ..., `SEQ-005`.
* **`biro_id` (FK, String, Unique)** : Mengacu ke `BIRO(biro_id)` (1:1).
* **`currentNumber` (Integer)** : Angka urut terakhir yang telah diterbitkan.

---

## 3. Matriks Relasi & Kardinalitas (Crow's Foot Notation)

| No | Entitas Asal | Relasi Bisnis | Entitas Tujuan | Kardinalitas | Atribut Kunci Penghubung |
|:---|:---|:---|:---|:---:|:---|
| 1 | **BIRO** | Mempekerjakan staf & pejabat | **USER** | `1 : N` | `BIRO.biro_id` &rarr; `USER.biro_id` |
| 2 | **BIRO** | Menyelenggarakan rapat utama | **MEETING** | `1 : N` | `BIRO.biro_id` &rarr; `MEETING.primary_biro_id` |
| 3 | **BIRO** | Memiliki penomoran surat otomatis | **BIRO_MEETING_SEQUENCE** | `1 : 1` | `BIRO.biro_id` &rarr; `BIRO_MEETING_SEQUENCE.biro_id` |
| 4 | **BIRO** | Bertanggung jawab atas tindak lanjut | **ACTION_ITEM** | `1 : N` | `BIRO.biro_id` &rarr; `ACTION_ITEM.pic_biro_id` |
| 5 | **BIRO** | Terlibat dalam rapat gabungan | **MEETING_BIRO** | `1 : N` | `BIRO.biro_id` &rarr; `MEETING_BIRO.biro_id` |
| 6 | **USER** | Memimpin jalannya persidangan | **MEETING** | `1 : N` | `USER.user_id` &rarr; `MEETING.chairperson_id` |
| 7 | **USER** | Mencatat jalannya persidangan (Notulis) | **MEETING** | `1 : N` | `USER.user_id` &rarr; `MEETING.secretary_id` |
| 8 | **USER** | Menghadiri persidangan (Absensi) | **MEETING_PARTICIPANT** | `1 : N` | `USER.user_id` &rarr; `MEETING_PARTICIPANT.user_id` |
| 9 | **USER** | Ditunjuk sebagai PIC individu tindak lanjut | **ACTION_ITEM** | `1 : N` | `USER.user_id` &rarr; `ACTION_ITEM.pic_user_id` |
| 10 | **MEETING** | Memiliki 1 dokumen risalah resmi | **MEETING_MINUTES** | `1 : 1` | `MEETING.meeting_id` &rarr; `MEETING_MINUTES.meeting_id` |
| 11 | **MEETING** | Menghasilkan butir-butir tindak lanjut | **ACTION_ITEM** | `1 : N` | `MEETING.meeting_id` &rarr; `ACTION_ITEM.meeting_id` |
| 12 | **MEETING** | Memiliki daftar absensi kehadiran | **MEETING_PARTICIPANT** | `1 : N` | `MEETING.meeting_id` &rarr; `MEETING_PARTICIPANT.meeting_id` |
| 13 | **MEETING** | Melibatkan banyak biro (Junction) | **MEETING_BIRO** | `1 : N` | `MEETING.meeting_id` &rarr; `MEETING_BIRO.meeting_id` |
| 14 | **MEETING** | Merujuk rapat sebelumnya (Follow-up) | **MEETING** | `0..1 : N` | `MEETING.meeting_id` &rarr; `MEETING.previous_meeting_id` |

---

## 4. Diagram Visual (Mermaid ERD)

```mermaid
erDiagram
    BIRO ||--o{ USER : "1:N mempekerjakan"
    BIRO ||--o{ MEETING : "1:N menyelenggarakan"
    BIRO ||--|| BIRO_MEETING_SEQUENCE : "1:1 penomoran surat"
    BIRO ||--o{ ACTION_ITEM : "1:N penanggung jawab"
    BIRO ||--o{ MEETING_BIRO : "1:N biro terlibat"

    USER ||--o{ MEETING_PARTICIPANT : "1:N absensi kehadiran"
    USER ||--o{ ACTION_ITEM : "0..1:N PIC personal"
    USER ||--o{ MEETING : "1:N pimpinan / notulis"

    MEETING ||--|| MEETING_MINUTES : "1:1 naskah notula"
    MEETING ||--o{ ACTION_ITEM : "1:N resolusi sidang"
    MEETING ||--o{ MEETING_PARTICIPANT : "1:N daftar peserta"
    MEETING ||--o{ MEETING_BIRO : "1:N junction biro"
    MEETING ||--o| MEETING : "0..1 rujukan sebelumnya"

    BIRO {
        string biro_id PK "BIRO-IKK, BIRO-BPPK"
        string code UK "BPPK, PKKEK, IKK, HSDMO, UK"
        string name "Nama Lengkap Biro"
        string shortName "Nama Singkat Biro"
        string description "Deskripsi Tupoksi"
        boolean isActive "Status Aktif"
    }

    USER {
        string user_id PK "USR-001, USR-002"
        string biro_id FK "Relasi ke BIRO"
        string name "Nama Pengguna"
        string email UK "Email Login"
        string role "SUPER_ADMIN, ADMIN, NOTULIS, STAFF"
        boolean isActive "Status Akun Aktif"
    }

    MEETING {
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

    MEETING_MINUTES {
        string minutes_id PK "NOT-001, NOT-002"
        string meeting_id FK "1:1 Unique ke MEETING"
        json agenda "Agenda Pembahasan"
        json discussion "Substansi Pembahasan"
        json decisions "Keputusan / Hasil Sidang"
        json conclusion "Pengesahan & Legalitas"
    }

    ACTION_ITEM {
        string action_item_id PK "ACT-001, ACT-002"
        string meeting_id FK "Relasi ke MEETING"
        string pic_biro_id FK "Biro Penanggung Jawab"
        string pic_user_id FK "Pegawai PIC Spesifik"
        string title "Ringkasan Tindak Lanjut"
        datetime dueDate "Tenggat Waktu Selesai"
        string status "PENDING, IN_PROGRESS, COMPLETED"
        string priority "LOW, MEDIUM, HIGH, URGENT"
    }

    MEETING_PARTICIPANT {
        string participant_id PK "PRT-001, PRT-002"
        string meeting_id FK "Relasi ke MEETING"
        string user_id FK "Relasi ke USER"
        string attendanceStatus "INVITED, PRESENT, ABSENT"
    }

    MEETING_BIRO {
        string meeting_id PK_FK "Relasi ke MEETING"
        string biro_id PK_FK "Relasi ke BIRO"
    }

    BIRO_MEETING_SEQUENCE {
        string sequence_id PK "SEQ-001, SEQ-002"
        string biro_id FK "1:1 Unique ke BIRO"
        int currentNumber "Nomor Urut Terakhir"
    }
```
