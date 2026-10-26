# PERANCANGAN UML ACTIVITY DIAGRAM (SUB-BAB 3.2.2.b)
## Sistem Informasi Log & Notula Rapat (Log_Book_Rapat KEK RI)
**Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus Republik Indonesia**

Dokumen ini memuat perancangan resmi **UML Activity Diagram (Diagram Alur Aktivitas Bisnis)** dengan format baku laporan Skripsi / Tugas Akhir (*Swimlane Table Layout: Aktor 1 | System | Aktor 2*), memodelkan 3 proses bisnis utama pada Sistem Informasi Log_Book_Rapat KEK RI sesuai dengan format acuan laporan akademik.

> [!NOTE]
> **Penempatan pada Laporan PKL (Pedoman PKL UBSI Tahun 2026 Halaman 30 – 31 No. 3):**  
> Diagram ini ditempatkan pada **BAB III PEMBAHASAN &rarr; 3.2. Pembuatan Program &rarr; 3.2.2. Design Program &rarr; b. Activity Diagram**.

---

## 1. File Diagram & Tautan Preview

* **File Asli Draw.io (Multi-Tab):** [`docs/ACTIVITY_DIAGRAM_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/ACTIVITY_DIAGRAM_Log_Book_Rapat.drawio)
* **Tautan Download Langsung:** [http://localhost:3000/ACTIVITY_DIAGRAM_Log_Book_Rapat.drawio](http://localhost:3000/ACTIVITY_DIAGRAM_Log_Book_Rapat.drawio)
* **Tautan Pratinjau Interaktif di Browser:** [http://localhost:3000/activity-diagram-preview.html](http://localhost:3000/activity-diagram-preview.html)

> [!TIP]
> **Struktur Multi-Tab Draw.io (`.drawio`):**
> Saat file dibuka di aplikasi **Draw.io (diagrams.net)**, terdapat 3 lembar tab terpisah:
> 1. `1) Penjadwalan Rapat` (Swimlane: Admin Biro/Tim | System | Pimpinan & Peserta Rapat)
> 2. `2) Notulensi & Risalah` (Swimlane: Notulis Rapat | System | Pimpinan Sidang)
> 3. `3) Tindak Lanjut & PIC` (Swimlane: Staf Pelaksana PIC | System | Pimpinan / Admin Biro)

---

## 2. Standar Notasi & Palet Warna Visual (UML 2.5 Standard)

Sesuai dengan standar baku **OMG UML 2.5 Activity Diagram**, perancangan ini menerapkan notasi dan palet warna semantik:

| Bentuk Notasi | Gaya / Palet Warna | Makna / Fungsi dalam Alur |
|:---|:---|:---|
| **Initial Node (`●`)** | Lingkaran solid hijau `#10B981` (28px) | Titik awal dimulainya alur aktivitas proses bisnis. |
| **User Action State** | Kotak rounded hijau lembut `#ECFDF5`, border `#059669` | Tindakan aktif yang dieksekusi oleh pengguna/aktor (*Admin, Notulis, PIC, Pimpinan*). |
| **System Action State** | Kotak rounded biru lembut `#EFF6FF`, border `#2563EB` | Pemrosesan data otomatis oleh sistem (*validasi, simpan database, auto-generate, broadcast*). |
| **Decision Node (`◇`)** | Belah ketupat kuning `#FFFBEB`, border `#D97706` | Titik evaluasi kondisi percabangan (*verifikasi kelengkapan, persetujuan, tenggat*). |
| **Guard Condition `[...]`** | Label putih berkontur `#CBD5E1`, font tebal | Syarat kondisi transisi yang harus dipenuhi (*[Data Lengkap]*, *[Berhalangan]*, *[Disetujui]*). |
| **Fork / Join Bar** | Balok persegi panjang hitam `#1E293B` | Sinkronisasi alur paralel (misal: notifikasi admin sekaligus broadcast ke peserta). |
| **Activity Final Node (`◉`)** | Lingkaran ganda (*bullseye*) merah `#DC2626` (30px) | Titik akhir pemberhentian seluruh alur aktivitas. |

---

## 3. Rincian Pemodelan Activity Diagram (Sub-Bab 3.2.2.b)

Sesuai dengan **Pedoman PKL UBSI Tahun 2026 Halaman 30 – 31 No. 3 (BAB III PEMBAHASAN &rarr; 3.2. Pembuatan Program &rarr; 3.2.2. Design Program &rarr; b. Activity Diagram)**, berikut adalah rincian 3 alur proses bisnis utama (*Activity Diagram*) pada Log_Book_Rapat KEK RI:

---

### a. Alur Penjadwalan Rapat Dinas

Alur ini memodelkan proses dari inisiasi pembuatan agenda rapat dinas oleh Admin Biro/Tim, pembuatan nomor registrasi rapat otomatis oleh sistem, penyebaran undangan notifikasi kepada pimpinan & peserta, konfirmasi kehadiran, hingga penutupan status pelaksanaan rapat.

```
+----------------------------------------------------------------------------------------------------+
|                                    Alur Penjadwalan Rapat Dinas                                    |
+------------------------------------+--------------------------+------------------------------------+
|    Admin Biro / Tim Pemrakarsa     |     Sistem Log_Book_Rapat     |      Pimpinan & Peserta Rapat      |
+------------------------------------+--------------------------+------------------------------------+
|  (Initial Node ●)                  |                          |                                    |
|         │                          |                          |                                    |
|  [Pilih Buat Rapat & Tim Kerja] ───┼─> [Form & Auto No INV]   |                                    |
|                                    │           │              |                                    |
|  [Isi Formulir Lengkap] <──────────┼───────────┘              |                                    |
|         │                          |                          |                                    |
|  [Klik "Jadwalkan Rapat"] ─────────┼─> <Data Lengkap?>        |                                    |
|         ▲                          |      │           │       |                                    |
|         │                          | [Data Kurang] [Lengkap]  |                                    |
|         │                          |      │           │       |                                    |
|         └──────────────────────────┼─ [Notif Validasi]│       |                                    |
|                                    |                  ▼       |                                    |
|                                    | [Status: SCHEDULED]      |                                    |
|                                    |         │                |                                    |
|                                    |  (=== FORK BAR ===)      |                                    |
|                                    |    │           │         |                                    |
|  [Menerima QR Tiket Presensi] <────┼────┘           └─────────┼─> [Menerima Undangan Rapat]        |
|                                    |                          |          │                         |
|                                    |                          |  <Konfirmasi Kehadiran?>           |
|                                    |                          |    │              │                |
|                                    |                          | [Berhalangan]  [Siap Hadir]        |
|                                    |                          |    │              │                |
|                                    |                          | [Input Izin]   [Input Hadir]       |
|                                    |                          |    │              │                |
|                                    | [Rekap Presensi & Kuorum]<────┴──────────────┘                |
|                                    |         │                |                                    |
|                                    |         └────────────────┼─> [Rapat Dinas Berlangsung]        |
|                                    |                          |          │                         |
|                                    |                          |  <Sidang Selesai Lengkap?>         |
|                                    |                          |    │              │                |
|                                    |                          | [Lanjutan]     [Selesai]           |
|                                    |                          |    │              │                |
|  [Jadwal Ulang (Reschedule)] <─────┼──────────────────────────┼────┘              │                |
|                                    | [Status: COMPLETED] <────┼───────────────────┘                |
|                                    |         │                |                                    |
|  [Notifikasi Selesai & Siap Notula]<─────────┘                |                                    |
|         │                          |                          |                                    |
|   (Final Node ◉)                   |                          |                                    |
+------------------------------------+--------------------------+------------------------------------+
```

---

### b. Alur Notulensi & Risalah Rapat

Alur ini memodelkan proses notulis mencatat dinamika rapat dinas, penyimpanan draft risalah, pengajuan telaah pimpinan sidang, keputusan revisi vs persetujuan pengesahan (*approval*), pembuatan dokumen PDF resmi ber-QR Code, hingga perumusan butir tindak lanjut (*action items*).

```
+----------------------------------------------------------------------------------------------------+
|                          Alur Penyusunan & Pengesahan Risalah Notulensi                            |
+------------------------------------+--------------------------+------------------------------------+
|            Notulis Rapat           |     Sistem Log_Book_Rapat     |        Pimpinan Sidang / Biro      |
+------------------------------------+--------------------------+------------------------------------+
|  (Initial Node ●)                  |                          |                                    |
|         │                          |                          |                                    |
|  [Catat Dinamika & Poin Pokok] ────┼─> [Auto-Save & Versi Log]|                                    |
|                                    │           │              |                                    |
|  [Ajukan Telaah ke Pimpinan] <─────┼───────────┘              |                                    |
|         │                          |                          |                                    |
|         └──────────────────────────┼─> [Status: REVIEW] ──────┼─> [Buka Draf & Telaah Substansi]   |
|                                    |                          |          │                         |
|                                    |                          |  <Substansi Disetujui?>            |
|                                    |                          |    │              │                |
|                                    |                          | [Perlu Revisi] [Disetujui]         |
|                                    |                          |    │              │                |
|  [Perbaiki Naskah Risalah] <───────┼─ [Status: REVISION] <────┼─ [Beri Catatan]   │                |
|         │ (Loop back)              |                          |                   ▼                |
|                                    |                          | [Sahkan Risalah (PIN/TTD Digital)] |
|                                    |                          |          │                         |
|                                    | [Generate PDF Ber-QR] <──┼──────────┘                         |
|                                    | [Status: APPROVED]       |                                    |
|                                    |         │                |                                    |
|                                    | [Broadcast Terbit Risalah]                                    |
|                                    |         │                |                                    |
|                                    |         └────────────────┼─> <Ada Tindak Lanjut ke Tim?>      |
|                                    |                          |    │              │                |
|                                    |                          | [Tindak Lanjut] [Arsip Saja]       |
|                                    |                          |    │              │                |
|                                    |                          | [Tentukan PIC] [Arsip Repositori]  |
|                                    |                          |    │              │                |
|                                    | [Kunci & Simpan Permanen]<────┴──────────────┘                |
|                                    |         │                |                                    |
|  [Unduh PDF Risalah Resmi Ber-QR] <┼─────────┘                |                                    |
|         │                          |                          |                                    |
|   (Final Node ◉)                   |                          |                                    |
+------------------------------------+--------------------------+------------------------------------+
```

---

### c. Alur Tindak Lanjut & Monitoring PIC (Sesuai Arahan Mentor Lapangan)

Alur ini memodelkan proses bisnis pengelolaan tindak lanjut secara komprehensif sesuai arahan mentor lapangan (Diaji Junianto):
1. **Hulu Disposisi:** Kepala Biro memberikan disposisi dinas dan Koordinator Tim menerima disposisi melalui **Aplikasi SRIKANDI** (Sistem Informasi Kearsipan Dinamis Terintegrasi nasional).
2. **Pencatatan & Penunjukan PIC:** Koordinator Tim mencatat pekerjaan kegiatan ke dalam Sistem (*Simpan data* pada tabel `kegiatan` & `tindak_lanjut`) dan menunjuk staf PIC pelaksana.
3. **Eksekusi & Histori Audit:** Staf PIC menerima tugas (*Menerima Task*), melaksanakan pekerjaan, memperbarui progres bertahap (*Update Progress* &rarr; *Simpan history* pada tabel `riwayat_tindak_lanjut`), dan menginput bukti/laporan hasil (*Input hasil* &rarr; *Simpan history*).
4. **Hilir Pengawasan:** Sistem mengagregasi seluruh riwayat status ke dalam **Dashboard Eksekutif**, sehingga Kepala Biro dapat langsung memantau capaian tugas (*Melihat report pekerjaan*).

```
+--------------------------------------------------------------------------------------------------------------------------------------------------------+
|                                  Alur Monitoring & Pembaruan Tindak Lanjut / Action Items (Sesuai Arahan Mentor)                                       |
+------------------------------+------------------------------+------------------------------+-----------------------------------------------------------+
|         Kepala Biro          |       Koordinator Tim        |     PIC (Staf Pelaksana)     |                   Sistem Pencatatan Kegiatan              |
+------------------------------+------------------------------+------------------------------+-----------------------------------------------------------+
|      (Initial Node ●)        |                              |                              |                                                           |
|             │                |                              |                              |                                                           |
|  .--------------------------------------------------------. |                              |                                                           |
|  |                 [ Aplikasi SRIKANDI ]                  | |                              |                                                           |
|  | [Memberikan disposisi] ───┼─> [Menerima disposisi]      | |                              |                                                           |
|  '---------------------------┼──────────────│─────────────' |                              |                                                           |
|                              |              ▼               |                              |                                                           |
|                              |     [Mencatat Pekerjaan] ────┼──────────────────────────────┼─> [«datastore» Simpan data] (Tabel: kegiatan & tindak_lanjut)|
|                              |              │               |                              |                                                           |
|                              |     [Menentukan PIC] ────────┼─> [Menerima Task]            |                                                           |
|                              |                              |          │                   |                                                           |
|                              |                              |   [Melaksanakan Tugas]       |                                                           |
|                              |                              |          │                   |                                                           |
|                              |                              |   [Update Progress] ─────────┼─> [«datastore» Simpan history] (Tabel: riwayat audit log) |
|                              |                              |          │                   |                                                           |
|                              |                              |   [Input Hasil / Eviden] ────┼─> [«datastore» Simpan history] (Status Selesai 100%)       |
|                              |                              |                              |                 │ (data flow)                             |
|                              |                              |                              |                 ▼                                         |
|                              |                              |                              |         [Dashboard Eksekutif]                             |
|                              |                              |                              |                 │                                         |
|  [Melihat report pekerjaan]<─┼──────────────────────────────┼──────────────────────────────┼─────────────────┘                                         |
|             │                |                              |                              |                                                           |
|       (Final Node ◉)         |                              |                              |                                                           |
+------------------------------+------------------------------+------------------------------+-----------------------------------------------------------+
```

---

## 4. Cara Menggunakan File di Draw.io

1. Buka browser dan kunjungi [https://app.diagrams.net](https://app.diagrams.net).
2. Pilih menu **Open Existing Diagram**.
3. Pilih berkas [`docs/ACTIVITY_DIAGRAM_Log_Book_Rapat.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/ACTIVITY_DIAGRAM_Log_Book_Rapat.drawio) yang ada di direktori proyek ini.
4. Di bagian bawah jendela Draw.io, Anda dapat memilih antara tab **1) Penjadwalan Rapat**, **2) Notulensi & Risalah**, atau **3) Tindak Lanjut & PIC**.
5. Untuk menyalin ke laporan Microsoft Word / LaTeX, gunakan menu **File &rarr; Export as &rarr; PNG / SVG / PDF** dengan resolusi 300 DPI untuk kualitas cetak dokumen tugas akhir yang tajam.

---

*Dokumen ini merupakan bagian dari rangkaian dokumentasi resmi rekayasa perangkat lunak Log_Book_Rapat KEK RI ([Tahap 1: ERD](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/1_ERD_DIAGRAM.md) &bull; [Tahap 2: LRS](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/2_LRS_DIAGRAM.md) &bull; [Tahap 3: Use Case](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/3_USE_CASE_DIAGRAM.md) &bull; [Tahap 4: Activity Diagram](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/4_ACTIVITY_DIAGRAM.md)).*
