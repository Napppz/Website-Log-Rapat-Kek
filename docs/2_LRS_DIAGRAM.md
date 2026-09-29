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
* **Kasus 1: `BIRO` &mdash; `BIRO_MEETING_SEQUENCE`**
  * Primary Key dari entitas induk (`biro_id` dari `BIRO`) disematkan sebagai Foreign Key sekaligus Unique Key (`biro_id`) pada tabel `BIRO_MEETING_SEQUENCE`.
* **Kasus 2: `MEETING` &mdash; `MEETING_MINUTES`**
  * Satu rapat hanya menghasilkan tepat satu notula resmi. Primary Key `meeting_id` dari `MEETING` disematkan sebagai Foreign Key unik pada tabel `MEETING_MINUTES`.

### B. Aturan Relasi Satu-ke-Banyak (1 : N)
Primary Key pada entitas berderajat **1 (Parent)** ditempatkan sebagai Foreign Key pada entitas berderajat **N (Child)**:
* `BIRO(biro_id)` &rarr; disematkan ke `USER(biro_id)`
* `BIRO(biro_id)` &rarr; disematkan ke `MEETING(primary_biro_id)`
* `BIRO(biro_id)` &rarr; disematkan ke `ACTION_ITEM(pic_biro_id)`
* `USER(user_id)` &rarr; disematkan ke `MEETING(chairperson_id)` dan `MEETING(secretary_id)`
* `USER(user_id)` &rarr; disematkan ke `MEETING_PARTICIPANT(user_id)`
* `USER(user_id)` &rarr; disematkan ke `ACTION_ITEM(pic_user_id)`
* `MEETING(meeting_id)` &rarr; disematkan ke `ACTION_ITEM(meeting_id)`
* `MEETING(meeting_id)` &rarr; disematkan ke `MEETING_PARTICIPANT(meeting_id)`

### C. Aturan Relasi Banyak-ke-Banyak (M : N)
* **Kasus: `MEETING` &mdash; `BIRO` (Rapat Gabungan Lintas Biro)**
  * Pada ERD, satu rapat dapat melibatkan banyak biro, dan satu biro dapat terlibat dalam banyak rapat.
  * Pada LRS, relasi M:N wajib dipecah menjadi tabel perantara (*junction table*) bernama **`MEETING_BIRO`**.
  * Tabel `MEETING_BIRO` memiliki **Composite Primary Key** yang terdiri dari gabungan `meeting_id` dan `biro_id`.

### D. Aturan Relasi Rekursif / Unary (0..1 : N)
* **Kasus: `MEETING` &mdash; `MEETING` (Rapat Rujukan / Tindak Lanjut)**
  * Rapat koordinasi lanjutan merujuk pada rapat terdahulu. Menghasilkan Foreign Key `previous_meeting_id` di dalam tabel `MEETING` itu sendiri (*self-referencing*).

---

## 3. Struktur Rekod LRS (Logical Record Structure)

Berikut adalah representasi 8 rekod logis basis data SIM-RAPAT KEK RI:

```text
1. biro
   ├── *biro_id : VARCHAR(50) <PK>
   ├── code : VARCHAR(20) <UK>
   ├── name : VARCHAR(255)
   ├── shortName : VARCHAR(100)
   ├── description : TEXT
   ├── isActive : BOOLEAN
   ├── createdAt : TIMESTAMP
   └── updatedAt : TIMESTAMP

2. biro_meeting_sequence
   ├── *sequence_id : VARCHAR(50) <PK>
   ├── **biro_id : VARCHAR(50) <FK, UK> ─── (Relasi 1:1 dari biro)
   ├── currentNumber : INTEGER
   ├── createdAt : TIMESTAMP
   └── updatedAt : TIMESTAMP

3. user
   ├── *user_id : VARCHAR(50) <PK>
   ├── **biro_id : VARCHAR(50) <FK> ───────── (Relasi 1:N dari biro)
   ├── email : VARCHAR(150) <UK>
   ├── name : VARCHAR(150)
   ├── password : VARCHAR(255)
   ├── role : ENUM('SUPER_ADMIN', 'ADMIN', 'NOTULIS', 'STAFF', 'VIEWER')
   ├── isActive : BOOLEAN
   ├── createdAt : TIMESTAMP
   └── updatedAt : TIMESTAMP

4. meeting
   ├── *meeting_id : VARCHAR(50) <PK>
   ├── meeting_number : VARCHAR(50) <UK>
   ├── **primary_biro_id : VARCHAR(50) <FK> ── (Relasi 1:N dari biro)
   ├── **chairperson_id : VARCHAR(50) <FK> ─── (Relasi 1:N dari user)
   ├── **secretary_id : VARCHAR(50) <FK> ───── (Relasi 1:N dari user)
   ├── **previous_meeting_id : VARCHAR(50) <FK> (Relasi 1:N Rekursif dari meeting)
   ├── title : VARCHAR(255)
   ├── date : DATE
   ├── startTime : VARCHAR(10)
   ├── endTime : VARCHAR(10)
   ├── location : VARCHAR(255)
   ├── status : ENUM('DRAFT', 'REVIEW', 'APPROVED', 'FINAL')
   ├── createdAt : TIMESTAMP
   └── updatedAt : TIMESTAMP

5. meeting_biro (Junction Table)
   ├── *meeting_id : VARCHAR(50) <PK, FK> ──── (Relasi 1:N dari meeting)
   └── *biro_id : VARCHAR(50) <PK, FK> ─────── (Relasi 1:N dari biro)

6. meeting_participant
   ├── *participant_id : VARCHAR(50) <PK>
   ├── **meeting_id : VARCHAR(50) <FK> ─────── (Relasi 1:N dari meeting)
   ├── **user_id : VARCHAR(50) <FK> ────────── (Relasi 1:N dari user)
   ├── attendanceStatus : ENUM('INVITED', 'PRESENT', 'ABSENT', 'EXCUSED')
   └── createdAt : TIMESTAMP

7. meeting_minutes
   ├── *minutes_id : VARCHAR(50) <PK>
   ├── **meeting_id : VARCHAR(50) <FK, UK> ─── (Relasi 1:1 dari meeting)
   ├── agenda : JSON
   ├── discussion : JSON
   ├── decisions : JSON
   ├── conclusion : JSON
   ├── createdAt : TIMESTAMP
   └── updatedAt : TIMESTAMP

8. action_item
   ├── *action_item_id : VARCHAR(50) <PK>
   ├── **meeting_id : VARCHAR(50) <FK> ─────── (Relasi 1:N dari meeting)
   ├── **pic_biro_id : VARCHAR(50) <FK> ────── (Relasi 1:N dari biro)
   ├── **pic_user_id : VARCHAR(50) <FK> ────── (Relasi 1:N dari user, Opsional)
   ├── title : VARCHAR(255)
   ├── description : TEXT
   ├── dueDate : TIMESTAMP
   ├── status : ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')
   ├── priority : ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT')
   ├── completedAt : TIMESTAMP
   ├── createdAt : TIMESTAMP
   └── updatedAt : TIMESTAMP
```

---

## 4. Teks Deskripsi (Caption) Siap Salin untuk Dokumen Laporan

> **Gambar 3.x: Logical Record Structure (LRS) SIM-RAPAT KEK RI**
> 
> *Gambar di atas menampilkan Logical Record Structure (LRS) hasil transformasi dari Entity Relationship Diagram (ERD). Pada tahap pemodelan logis ini, kardinalitas Many-to-Many antara tabel MEETING dan BIRO telah direalisasikan menjadi tabel perantara bernama MEETING_BIRO dengan Primary Key komposit (meeting_id, biro_id). Seluruh relasi 1:N telah dipetakan dengan menempatkan Primary Key entitas induk ke dalam entitas turunan sebagai Foreign Key (ditandai dengan prefix **FK). Sedangkan relasi 1:1 pada MEETING_MINUTES dan BIRO_MEETING_SEQUENCE menerapkan batasan Unique Constraint pada kunci tamunya untuk menjamin integritas referensial satu-ke-satu secara konsisten.*
