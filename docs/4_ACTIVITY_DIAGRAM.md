# PERANCANGAN UML ACTIVITY DIAGRAM (SUB-BAB 3.2.2.b)
## Aplikasi Log Book Kegiatan pada Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus
**Program Studi Informatika — Fakultas Teknik & Informatika Universitas Bina Sarana Informatika (UBSI) 2026**

Dokumen ini memuat perancangan resmi **UML Activity Diagram (Diagram Alur Aktivitas Bisnis)** dengan format baku laporan akademik (*Swimlane Layout*), memodelkan 3 proses bisnis utama pada Aplikasi Log Book Kegiatan KEK. Seluruh alur dirancang selaras 100% dengan **UML Use Case Diagram** dan aturan operasional instansi:

> [!IMPORTANT]
> **Prinsip Keselarasan Sistem (Tidak Melenceng dari Use Case):**
> 1. **Tanpa Modul Presensi/Absensi Kehadiran:** Seluruh peserta kegiatan dikelola sebagai *Daftar Pihak Terkait / Undangan Kegiatan Resmi* untuk keperluan keperluan log book kegiatan (tanpa tiket QR, izin/hadir, maupun hitung kuorum).
> 2. **Status Konsisten 3 Tahapan Resmi:** Status kegiatan dan butir tindak lanjut strictly hanya 3 tahapan: `Belum Dimulai`, `Dalam Proses`, dan `Selesai`.
> 3. **Sinkronisasi Peran Aktor:** Selaras dengan 3 aktor pada Use Case Diagram: *Staf Pelaksana (PIC)*, *Admin Biro / Tim*, dan *Super Admin (Pimpinan Setjen)*.

---

## 1. Pemetaan Use Case ke Activity Diagram

| No | Activity Diagram | Use Case Terkait | Aktor Terlibat | Fokus Proses Bisnis |
|:---|:---|:---|:---|:---|
| 1 | **Alur Pencatatan & Penjadwalan Kegiatan Baru** | UC-06, UC-07, UC-02 | Admin Biro/Tim & Sistem | Penginputan kategori naskah kegiatan, waktu, ruang/lokasi, penunjukan PIC, penerbitan nomor registrasi otomatis, status awal `Belum Dimulai`, sinkronisasi kalender kegiatan. |
| 2 | **Alur Pencatatan Dokumen & Catatan Hasil Kegiatan** | UC-08, UC-09, UC-04 | Admin Biro/Tim, Staf PIC, & Sistem | Unggah berkas dokumen acuan kegiatan (surat undangan, nota konsumsi kegiatan, bahan tayang materi, tautan rilis), input ringkasan catatan hasil kegiatan, validasi berkas, dan penyimpanan repositori permanen. |
| 3 | **Alur Monitoring & Pembaruan Status Kegiatan serta Tindak Lanjut** | UC-05, UC-10, UC-11 | Admin Biro/Tim, Staf PIC, Sistem, & Super Admin (Pimpinan) | Perumusan butir tindak lanjut (*action items*), penugasan PIC & deadline, pembaruan status 3 tahapan (`Belum Dimulai` &rarr; `Dalam Proses` &rarr; `Selesai`), agregasi 4 kartu KPI, dan monitoring eksekutif pimpinan. |

---

## 2. Activity Diagram 1: Alur Pencatatan dan Penjadwalan Kegiatan Baru

Memodelkan alur kerja petugas administrasi mencatat agenda kegiatan baru berdasarkan disposisi atau surat naskah masuk hingga terdaftar di kalender kegiatan terpadu.

### A. Visualisasi Mermaid Activity Diagram 1
```mermaid
flowchart TD
    StartNode([● Mulai]) --> Step1[Admin Biro/Tim Membuka Menu 'Catat Kegiatan Baru']
    Step1 --> Step2[Sistem Menampilkan Formulir Penjadwalan Kegiatan]
    Step2 --> Step3[Admin Memilih Klasifikasi Kategori Naskah Kegiatan<br/><i>Naskah Masuk / Disposisi Sekjen / Disposisi Karo / Internal / Laporan Rutin</i>]
    Step3 --> Step4[Admin Mengisi Rincian: Judul Agenda, Waktu Pelaksanaan, Ruang/Tautan, & Staf PIC]
    Step4 --> Step5[Admin Menambahkan Daftar Pihak Terkait / Undangan Kegiatan Resmi]
    Step5 --> Step6[Admin Menekan Tombol 'Simpan Jadwal Kegiatan']
    Step6 --> Dec1{Validasi Kolom Wajib<br/>Terisi Lengkap?}

    Dec1 -- Tidak Lengkap --> Err1[Sistem Menandai Field Kosong Berwarna Merah<br/>dan Menampilkan Notifikasi 'Field ini wajib diisi']
    Err1 --> Step4

    Dec1 -- Lengkap --> Sys1[Sistem Menerbitkan Nomor Registrasi Unik Otomatis<br/><i>Contoh: REG-2026-X-001</i>]
    Sys1 --> Sys2[Sistem Menyimpan Data ke Basis Data PostgreSQL<br/>dengan Status Awal: <b>'Belum Dimulai'</b>]
    Sys2 --> Sys3[Sistem Menyinkronkan Agenda ke Kalender Kegiatan Terpadu]
    Sys3 --> End1[Sistem Mengarahkan ke Halaman Detail Agenda Kegiatan]
    End1 --> FinalNode([◉ Selesai])
```

---

## 3. Activity Diagram 2: Alur Pencatatan Dokumen & Catatan Hasil Kegiatan

Memodelkan proses pencatatan naskah dokumen digital pendukung kegiatan dan pendokumentasian catatan ringkas hasil pembahasan kegiatan secara terstruktur.

### A. Visualisasi Mermaid Activity Diagram 2 (Swimlane 3 Kolom)
```mermaid
flowchart TD
    subgraph LANE1["Admin Biro / Staf PIC"]
        StartNode2([● Mulai])
        StepB1["Membuka Rincian Kegiatan &<br/>Memilih Tab 'Dokumen & Catatan Hasil'"]
        StepB2["Unggah Berkas Kegiatan (Undangan, Nota<br/>Konsumsi, Materi Paparan, Tautan Berita)<br/>& Input Ringkasan Hasil Kegiatan"]
        StepB3["Menekan Tombol<br/>'Simpan Dokumen & Catatan Hasil'"]
    end

    subgraph LANE2["Aplikasi Log Book Kegiatan KEK (Sistem)"]
        DecB1{"Validasi Format &<br/>Ukuran Berkas<br/>(&lt; 10MB)?"}
        ErrB["Tampilkan Pesan Validasi Error:<br/>Format Tidak Sesuai / Ukuran &gt; 10MB"]
        SysB1["Unggah Berkas ke Cloud Storage &<br/>Simpan Metadata serta Catatan Hasil ke DB"]
        SysB2["Tautkan Dokumen ke ID Registrasi Kegiatan<br/>& Rekam Stempel Waktu (Timestamp)"]
        SysB3["Aktifkan Pratinjau Berkas & Sediakan<br/>Unduh Dokumen Log Book (PDF Resmi KEK)"]
        SysFinal["Dokumen Log Book Resmi Kegiatan<br/>Tersimpan Permanen & Lengkap"]
        FinalNode2([◉ Selesai])
    end

    subgraph LANE3["Super Admin / Pimpinan"]
        PimRev["Pimpinan Meninjau Kelengkapan<br/>Dokumen Log Book & Catatan Hasil"]
        DecB2{"Terdapat Butir<br/>Tindak Lanjut<br/>(Action Items)?"}
        ActTL["Lanjutkan ke Alur c:<br/>Matriks Tindak Lanjut & Penugasan PIC"]
    end

    %% Alur Antar-Node
    StartNode2 --> StepB1
    StepB1 --> StepB2
    StepB2 --> StepB3
    StepB3 --> DecB1

    DecB1 -- "[Tidak Valid]" --> ErrB
    ErrB --> StepB2

    DecB1 -- "[Format & Ukuran Valid]" --> SysB1
    SysB1 --> SysB2
    SysB2 --> SysB3
    SysB3 --> PimRev

    PimRev --> DecB2
    DecB2 -- "[Ada Tindak Lanjut]" --> ActTL
    DecB2 -- "[Tidak Ada Tindak Lanjut]" --> SysFinal

    SysFinal --> FinalNode2
    ActTL --> FinalNode2
```

---

## 4. Activity Diagram 3: Alur Monitoring & Pembaruan Status Kegiatan serta Tindak Lanjut

Memodelkan interaksi terpadu antara 4 swimlane (Admin Biro, Staf PIC, Sistem, dan Pimpinan/Super Admin) dalam mengelola siklus butir tindak lanjut (*action items*) menggunakan strictly 3 tahapan status.

### A. Visualisasi Mermaid Activity Diagram 3 (4 Swimlane)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Biro / Tim
    actor PIC as Staf Pelaksana (PIC)
    participant Sys as Sistem Aplikasi KEK
    actor Leader as Super Admin (Pimpinan)

    Note over Admin,Sys: Tahap 1: Perumusan Butir Tindak Lanjut
    Admin->>Sys: Akses Modul Matriks Tindak Lanjut Kegiatan
    Admin->>Sys: Input Butir Tugas, Tim Penanggung Jawab, Staf PIC, & Tenggat Waktu (Deadline)
    Sys->>Sys: Simpan Butir Tindak Lanjut dengan Status Awal: "Belum Dimulai"
    Sys->>Sys: Agregasi Otomatis pada 4 Kartu KPI (Total, Belum Dimulai, Dalam Proses, Selesai)

    Note over PIC,Sys: Tahap 2: Eksekusi & Pembaruan Progres (3 Tahapan)
    PIC->>Sys: Login & Buka Dashboard Tugas / Rincian Kegiatan
    PIC->>Sys: Klik Quick Status Popover: Ubah Status "Belum Dimulai" -> "Dalam Proses"
    Sys->>Sys: Rekam Riwayat Progres ke Basis Data & Update Lencana Badge Status
    PIC->>Sys: Selesaikan Tugas & Unggah Bukti Eviden Hasil Pelaksanaan
    PIC->>Sys: Ubah Status Progres menjadi "Selesai"
    Sys->>Sys: Validasi Capaian & Rekam Waktu Penyelesaian Tugas
    Sys->>Sys: Update Agregasi Kartu KPI (Counter "Selesai" Bertambah)

    Note over Leader,Sys: Tahap 3: Pengawasan & Monitoring Eksekutif Lintas Tim
    Leader->>Sys: Akses Dashboard Monitoring Eksekutif Lintas 3 Tim Kerja
    Sys-->>Leader: Sajikan Grafik Komparasi & Rekapitulasi Capaian Tugas Tiap Tim Kerja
    Leader->>Sys: Ekspor Laporan Rekapitulasi Matriks Tindak Lanjut (PDF Resmi / Excel)
    Sys-->>Leader: Unduh Dokumen Rekapitulasi Ber-Kop Surat Resmi Setjen DN KEK
```

---

## 5. Ringkasan Kepatuhan Pedoman PKL UBSI 2026

1. **Notasi Baku UML 2.5:** Menggunakan *Initial Node* (lingkaran solid), *Action State* (persegi panjang bersudut tumpul), *Decision Node* (belah ketupat dengan *Guard Condition*), dan *Final Node* (lingkaran ganda).
2. **Kejelasan Swimlane:** Membagi tanggung jawab tugas secara transparan antara aktor manusia dan proses komputasi sistem.
3. **Integritas Konseptual:** Alur aktivitas ini merupakan realisasi langsung dari Use Case Diagram Sub-Bab 3.2.2.a dan tidak ada satu pun alur yang menyimpang dari batasan sistem yang telah ditetapkan.
