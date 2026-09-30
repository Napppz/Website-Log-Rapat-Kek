# DOKUMENTASI RESMI STRUKTUR TABEL BASIS DATA (NEON DB), UML CLASS DIAGRAM, & ERD
## Sistem Informasi Manajemen Rapat & Tindak Lanjut (SIM-RAPAT KEK RI)
**Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus Republik Indonesia**

Dokumen ini memuat standarisasi penamaan tabel dan kolom fisik di **Neon PostgreSQL**, Kamus Data (*Data Dictionary*), UML Class Diagram, dan Entity Relationship Diagram (ERD) dalam **100% Bahasa Indonesia** dengan standarisasi nama Foreign Key yang **selaras sempurna dengan nama tabel induknya**, memudahkan penjelasan relasi **1 to Many (1 : N)** di hadapan Dosen Pembimbing dan Dosen Penguji.

---

## 1. Standarisasi Relasi 1 to Many (1 : N) & Kamus Data Neon DB

Dalam prinsip pemodelan basis data relasional akademik, ketika Entitas Induk (*Parent*) berelasi **1 to Many** dengan Entitas Anak (*Child*), Primary Key dari tabel Induk disematkan ke dalam tabel Anak sebagai Foreign Key dengan **nama yang konsisten**:

| No | Nama Tabel di Neon DB | Primary Key (PK) | Foreign Key (FK) Masuk (Relasi 1 : N) | Nama Tabel Induk Asal | Penjelasan Relasi 1 : N |
|:---|:----------------------|:-----------------|:--------------------------------------|:----------------------|:------------------------|
| 1  | **`biro`** | **`id_biro`** | - | - | Entitas Master Unit Kerja (1 Biro menaungi banyak pengguna & banyak rapat). |
| 2  | **`pengguna`** | **`id_pengguna`** | **`id_biro`** [FK] | `biro` | **`1 : N`** &mdash; 1 `biro` memiliki banyak `pengguna`. |
| 3  | **`rapat`** | **`id_rapat`** | • **`id_biro`** [FK]<br>• **`id_pengguna`** [FK]<br>• **`id_notulis`** [FK]<br>• **`id_rapat_sebelumnya`** [FK] | • `biro`<br>• `pengguna`<br>• `pengguna`<br>• `rapat` | • **`1 : N`** &mdash; 1 `biro` menyelenggarakan banyak `rapat`.<br>• **`1 : N`** &mdash; 1 `pengguna` memimpin banyak `rapat`.<br>• **`1 : N`** &mdash; 1 `pengguna` mencatat banyak `rapat`.<br>• **`0..1 : N`** &mdash; 1 `rapat` terdahulu dapat memiliki rapat lanjutan. |
| 4  | **`tindak_lanjut`** | **`id_tindak_lanjut`** | • **`id_rapat`** [FK]<br>• **`id_biro`** [FK]<br>• **`id_pengguna`** [FK] | • `rapat`<br>• `biro`<br>• `pengguna` | • **`1 : N`** &mdash; 1 `rapat` menghasilkan banyak butir `tindak_lanjut`.<br>• **`1 : N`** &mdash; 1 `biro` dibebankan banyak `tindak_lanjut`.<br>• **`1 : N`** &mdash; 1 `pengguna` (PIC) ditugaskan banyak `tindak_lanjut`. |
| 5  | **`peserta_rapat`** | **`id_peserta`** | • **`id_rapat`** [FK]<br>• **`id_pengguna`** [FK] | • `rapat`<br>• `pengguna` | • **`1 : N`** &mdash; 1 `rapat` memiliki banyak `peserta_rapat`.<br>• **`1 : N`** &mdash; 1 `pengguna` memiliki banyak riwayat kehadiran. |
| 6  | **`notulen_rapat`** | **`id_notulen`** | **`id_rapat`** [FK, UK] | `rapat` | **`1 : 1`** &mdash; 1 `rapat` menghasilkan tepat 1 naskah `notulen_rapat` resmi. |
| 7  | **`penomoran_rapat_biro`** | **`id_penomoran`** | **`id_biro`** [FK, UK] | `biro` | **`1 : 1`** &mdash; 1 `biro` memiliki tepat 1 generator nomor surat urut otomatis. |
| 8  | **`rapat_biro`** | **`(id_rapat, id_biro)`** | • **`id_rapat`** [FK]<br>• **`id_biro`** [FK] | • `rapat`<br>• `biro` | **`M : N`** *(Junction)* &mdash; Rapat gabungan yang melibatkan banyak biro sekaligus. |

---

## 2. UML Class Diagram (Mermaid Syntax - Bahasa Indonesia)

```mermaid
classDiagram
    direction TB

    class PeranPengguna {
        <<enumeration>>
        SUPER_ADMIN
        ADMIN
        NOTULIS
        STAFF
        VIEWER
    }

    class StatusRapat {
        <<enumeration>>
        DRAFT
        REVIEW
        APPROVED
        FINAL
    }

    class StatusKehadiran {
        <<enumeration>>
        INVITED
        PRESENT
        ABSENT
        EXCUSED
    }

    class StatusTindakLanjut {
        <<enumeration>>
        PENDING
        IN_PROGRESS
        COMPLETED
        OVERDUE
    }

    class PrioritasTindakLanjut {
        <<enumeration>>
        LOW
        MEDIUM
        HIGH
        URGENT
    }

    class Biro {
        +String id_biro PK
        +String kode_biro UK
        +String nama_biro
        +String nama_singkat
        +String deskripsi
        +Boolean status_aktif
        +DateTime dibuat_pada
        +DateTime diperbarui_pada
        +hitungBebanKerja()
        +getDaftarPegawai()
    }

    class Pengguna {
        +String id_pengguna PK
        +String id_biro FK
        +String nama_lengkap
        +String email UK
        +String kata_sandi
        +PeranPengguna peran
        +Boolean status_aktif
        +DateTime dibuat_pada
        +DateTime diperbarui_pada
        +autentikasi()
        +ubahProfil()
    }

    class Rapat {
        +String id_rapat PK
        +String nomor_rapat UK
        +String judul_rapat
        +String id_biro FK
        +String id_pengguna FK
        +String id_notulis FK
        +String id_rapat_sebelumnya FK
        +DateTime tanggal_rapat
        +String waktu_mulai
        +String waktu_selesai
        +String lokasi_rapat
        +StatusRapat status_rapat
        +DateTime dibuat_pada
        +DateTime diperbarui_pada
        +buatRapat()
        +perbaruiStatus()
        +eksporPdf()
    }

    class NotulenRapat {
        +String id_notulen PK
        +String id_rapat FK
        +Json agenda_pembahasan
        +Json hasil_pembahasan
        +Json poin_keputusan
        +Json kesimpulan
        +DateTime dibuat_pada
        +DateTime diperbarui_pada
        +simpanNotulen()
        +buatDokumenPdf()
    }

    class PesertaRapat {
        +String id_peserta PK
        +String id_rapat FK
        +String id_pengguna FK
        +StatusKehadiran status_kehadiran
        +DateTime dibuat_pada
        +catatKehadiran()
    }

    class RapatBiro {
        +String id_rapat PK_FK
        +String id_biro PK_FK
    }

    class TindakLanjut {
        +String id_tindak_lanjut PK
        +String id_rapat FK
        +String id_biro FK
        +String id_pengguna FK
        +String judul_tindakan
        +String deskripsi_tindakan
        +DateTime tenggat_waktu
        +StatusTindakLanjut status_tindak_lanjut
        +PrioritasTindakLanjut skala_prioritas
        +DateTime diselesaikan_pada
        +DateTime dibuat_pada
        +DateTime diperbarui_pada
        +perbaruiStatus()
        +tandaiSelesai()
    }

    class PenomoranRapatBiro {
        +String id_penomoran PK
        +String id_biro FK
        +Int nomor_terakhir
        +DateTime dibuat_pada
        +DateTime diperbarui_pada
        +ambilNomorBerikutnya()
    }

    %% Hubungan 1 to Many yang Konsisten
    Biro "1" --> "0..*" Pengguna : id_biro (1:N)
    Biro "1" --> "0..*" Rapat : id_biro (1:N)
    Biro "1" --> "1" PenomoranRapatBiro : id_biro (1:1)
    Pengguna "1" --> "0..*" Rapat : id_pengguna (1:N)
    Rapat "1" --> "0..1" Rapat : id_rapat_sebelumnya (0..1:N)
    Rapat "1" *-- "0..1" NotulenRapat : id_rapat (1:1)
    Rapat "1" *-- "0..*" TindakLanjut : id_rapat (1:N)
    Biro "1" --> "0..*" TindakLanjut : id_biro (1:N)
    Pengguna "0..1" --> "0..*" TindakLanjut : id_pengguna (1:N)
    Rapat "1" *-- "0..*" PesertaRapat : id_rapat (1:N)
    Pengguna "1" -- "0..*" PesertaRapat : id_pengguna (1:N)
    Rapat "1" -- "0..*" RapatBiro : id_rapat (M:N)
    Biro "1" -- "0..*" RapatBiro : id_biro (M:N)
```

---

## 3. Entity Relationship Diagram (ERD - Physical Model di Neon DB)

```mermaid
erDiagram
    biro ||--o{ pengguna : "1:N mempekerjakan (id_biro)"
    biro ||--o{ rapat : "1:N menyelenggarakan (id_biro)"
    biro ||--|| penomoran_rapat_biro : "1:1 generator nomor (id_biro)"
    biro ||--o{ tindak_lanjut : "1:N penugasan biro (id_biro)"
    biro ||--o{ rapat_biro : "1:N keterlibatan biro (id_biro)"

    pengguna ||--o{ peserta_rapat : "1:N kehadiran (id_pengguna)"
    pengguna ||--o{ tindak_lanjut : "0..1:N penugasan pegawai (id_pengguna)"
    pengguna ||--o{ rapat : "1:N memimpin sidang (id_pengguna)"

    rapat ||--|| notulen_rapat : "1:1 naskah notula (id_rapat)"
    rapat ||--o{ tindak_lanjut : "1:N resolusi sidang (id_rapat)"
    rapat ||--o{ peserta_rapat : "1:N daftar peserta (id_rapat)"
    rapat ||--o{ rapat_biro : "1:N junction biro (id_rapat)"
    rapat ||--o| rapat : "0..1 rujukan sebelumnya (id_rapat_sebelumnya)"

    biro {
        string id_biro PK "Kode Unik Biro (BIRO-IKK)"
        string kode_biro UK "Kode Singkat (BPPK, IKK, dll)"
        string nama_biro "Nama Resmi Biro"
        string nama_singkat "Nama Singkat Biro"
        string deskripsi "Tupoksi Biro"
        boolean status_aktif "Status Aktif"
        datetime dibuat_pada "Waktu Registrasi"
        datetime diperbarui_pada "Waktu Pembaruan"
    }

    pengguna {
        string id_pengguna PK "Format Bersih (USR-001)"
        string id_biro FK "Relasi 1:N dari biro (id_biro)"
        string nama_lengkap "Nama Lengkap & Gelar"
        string email UK "Email Login Dinas"
        string kata_sandi "Hash Password Terenkripsi"
        string peran "Hak Akses (PeranPengguna)"
        boolean status_aktif "Status Akun Aktif"
        datetime dibuat_pada "Waktu Registrasi"
        datetime diperbarui_pada "Waktu Pembaruan"
    }

    rapat {
        string id_rapat PK "Format Bersih (MTG-001)"
        string nomor_rapat UK "Nomor Registrasi Surat (IKK-015)"
        string id_biro FK "Relasi 1:N dari biro (id_biro)"
        string id_pengguna FK "Relasi 1:N dari pengguna - Pimpinan (id_pengguna)"
        string id_notulis FK "Relasi 1:N dari pengguna - Notulis (id_notulis)"
        string id_rapat_sebelumnya FK "Relasi 0..1:N dari rapat (id_rapat)"
        string judul_rapat "Judul Agenda Rapat"
        datetime tanggal_rapat "Tanggal Rapat"
        string waktu_mulai "Waktu Mulai (HH:mm)"
        string waktu_selesai "Waktu Selesai (HH:mm)"
        string lokasi_rapat "Lokasi / Tautan Zoom"
        string status_rapat "Status Rapat (DRAFT/REVIEW/APPROVED/FINAL)"
        datetime dibuat_pada "Waktu Registrasi"
        datetime diperbarui_pada "Waktu Pembaruan"
    }

    notulen_rapat {
        string id_notulen PK "Format Bersih (NOT-001)"
        string id_rapat FK "Relasi 1:1 dari rapat (id_rapat)"
        json agenda_pembahasan "Daftar Butir Agenda"
        json hasil_pembahasan "Pembahasan & Dinamika Sidang"
        json poin_keputusan "Keputusan & Kesepakatan"
        json kesimpulan "Pengesahan & Pihak Penandatangan"
        datetime dibuat_pada "Waktu Registrasi"
        datetime diperbarui_pada "Waktu Pembaruan"
    }

    tindak_lanjut {
        string id_tindak_lanjut PK "Format Bersih (ACT-001)"
        string id_rapat FK "Relasi 1:N dari rapat (id_rapat)"
        string id_biro FK "Relasi 1:N dari biro (id_biro)"
        string id_pengguna FK "Relasi 1:N dari pengguna (id_pengguna)"
        string judul_tindakan "Judul Butir Arahan"
        string deskripsi_tindakan "Uraian Tindak Lanjut"
        datetime tenggat_waktu "Batas Waktu Penyelesaian"
        string status_tindak_lanjut "Status (PENDING/IN_PROGRESS/COMPLETED/OVERDUE)"
        string skala_prioritas "Prioritas (LOW/MEDIUM/HIGH/URGENT)"
        datetime diselesaikan_pada "Waktu Tugas Diselesaikan"
        datetime dibuat_pada "Waktu Registrasi"
        datetime diperbarui_pada "Waktu Pembaruan"
    }

    peserta_rapat {
        string id_peserta PK "Format Bersih (PRT-001)"
        string id_rapat FK "Relasi 1:N dari rapat (id_rapat)"
        string id_pengguna FK "Relasi 1:N dari pengguna (id_pengguna)"
        string status_kehadiran "Status Kehadiran"
        datetime dibuat_pada "Waktu Pencatatan"
    }

    rapat_biro {
        string id_rapat PK_FK "Relasi ke rapat (id_rapat)"
        string id_biro PK_FK "Relasi ke biro (id_biro)"
    }

    penomoran_rapat_biro {
        string id_penomoran PK "Format Bersih (SEQ-001)"
        string id_biro FK "Relasi 1:1 dari biro (id_biro)"
        int nomor_terakhir "Nomor Urut Terakhir yang Terbit"
        datetime dibuat_pada "Waktu Registrasi"
        datetime diperbarui_pada "Waktu Pembaruan"
    }
```

---

## 4. Panduan Menjelaskan Relasi 1 to Many kepada Dosen

Ketika Dosen menguji: *"Coba jelaskan bagaimana aturan penamaan Foreign Key dan relasi 1 to Many pada perancangan basis data Anda?"*, Anda dapat menjawab dengan percaya diri:

> *"Bapak/Ibu Dosen, seluruh relasi **1 to Many (1 : N)** pada sistem kami mengikuti kaidah baku basis data relasional, di mana **Primary Key entitas Induk disematkan secara identik ke entitas Anak sebagai Foreign Key**, sehingga langsung sesuai dengan nama tabel asalnya:*
> 
> 1. ***Relasi `biro` ke `rapat` (1 : N)***:
>    *Tabel induk **`biro`** memiliki Primary Key **`id_biro`**. Masuk ke tabel anak **`rapat`** sebagai Foreign Key bernama **`id_biro`**. Satu biro dapat menyelenggarakan banyak rapat.*
> 2. ***Relasi `pengguna` ke `rapat` (1 : N)***:
>    *Tabel induk **`pengguna`** memiliki Primary Key **`id_pengguna`**. Masuk ke tabel **`rapat`** sebagai Foreign Key bernama **`id_pengguna`** (sebagai pimpinan sidang). Satu pengguna dapat memimpin banyak agenda rapat.*
> 3. ***Relasi `rapat` ke `tindak_lanjut` (1 : N)***:
>    *Tabel induk **`rapat`** memiliki Primary Key **`id_rapat`**. Masuk ke tabel anak **`tindak_lanjut`** sebagai Foreign Key bernama **`id_rapat`**. Satu rapat menghasilkan banyak butir tindak lanjut.*
> 4. ***Relasi `biro` & `pengguna` ke `tindak_lanjut` (1 : N)***:
>    *Tabel **`tindak_lanjut`** memegang Foreign Key **`id_biro`** dan **`id_pengguna`** yang merujuk langsung ke tabel asal penanggung jawabnya. Satu biro maupun satu pegawai dapat menerima banyak penugasan tindak lanjut.*
> 5. ***Relasi `rapat` & `pengguna` ke `peserta_rapat` (1 : N)***:
>    *Tabel **`peserta_rapat`** memegang Foreign Key **`id_rapat`** dan **`id_pengguna`**.*
> 
> *Dengan standarisasi ini, tidak ada lagi ambiguitas penamaan, dan pembacaan alur data dari tabel induk ke tabel turunan menjadi sangat jelas dan logis."*
