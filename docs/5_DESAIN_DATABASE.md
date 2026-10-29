# SPESIFIKASI TABEL BASIS DATA (SUB-BAB 3.2.4.c)
## Aplikasi Log Book Kegiatan pada Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus
**Program Studi Informatika — Fakultas Teknik & Informatika Universitas Bina Sarana Informatika (UBSI) 2026**

Dokumen ini memuat perancangan resmi **Spesifikasi Basis Data (Data Dictionary)** dan **Desain Database Fisik (Physical Relational Data Model)** sesuai dengan **Buku Pedoman Praktik Kerja Lapangan (PKL) UBSI Tahun 2026 (Outline 3 - Perancangan dan Pembuatan Program)**.

> [!NOTE]
> **Penempatan pada Laporan PKL:**  
> Spesifikasi basis data ini ditempatkan pada **BAB III PEMBAHASAN &rarr; 3.2. Pembuatan Program &rarr; 3.2.4. Database\* &rarr; c. Spesifikasi Tabel Basis Data**.

---

## 1. Audit Data Aktual Basis Data Neon PostgreSQL

Sesuai arahan perancangan dan audit basis data aktual pada platform cloud **Neon Serverless PostgreSQL (PostgreSQL 16/18)**, spesifikasi basis data ini **hanya mencakup entitas tabel yang aktif dan memiliki data operasional riil**. Seluruh tabel kosong (0 record) yang tidak digunakan dalam alur transaksi sistem **dieliminasi dan tidak dimasukkan ke dalam dokumentasi laporan**:

| No | Nama Tabel Fisik | Status Record Data | Keputusan Dokumentasi | Fungsi Operasional Sistem |
|:--:|:---|:---:|:---:|:---|
| 1 | **`biro`** | **5 baris** | **Dimasukkan (Aktif)** | Master data unit kerja Eselon II di lingkungan Setjen DN KEK. |
| 2 | **`tim_biro`** | **5 baris** | **Dimasukkan (Aktif)** | Kelompok kerja / tim teknis operasional di bawah biro. |
| 3 | **`pengguna`** | **23 baris** | **Dimasukkan (Aktif)** | Data akun aparatur, hak akses, dan autentikasi multi-role. |
| 4 | **`kegiatan`** | **23 baris** | **Dimasukkan (Aktif)** | Transaksi sentral jadwal agenda kegiatan, registrasi, dan catatan hasil. |
| 5 | **`peserta_kegiatan`** | **38 baris** | **Dimasukkan (Aktif)** | Daftar pihak dan aparatur terkait penugasan kegiatan resmi. |
| 6 | **`lampiran_kegiatan`** | **9 baris** | **Dimasukkan (Aktif)** | Berkas digital naskah pendukung (undangan, nota konsumsi, paparan materi, rilis). |
| 7 | **`tindak_lanjut`** | **36 baris** | **Dimasukkan (Aktif)** | Butir komitmen arahan penugasan (*action items*), PIC, dan tenggat waktu. |
| 8 | **`riwayat_tindak_lanjut`** | **34 baris** | **Dimasukkan (Aktif)** | Rekam jejak audit pembaruan status progres tindak lanjut oleh PIC. |
| 9 | **`notifikasi`** | **35 baris** | **Dimasukkan (Aktif)** | Notifikasi lonceng sistem terkait agenda kegiatan dan batas waktu tugas. |
| 10 | `notulen_kegiatan` | **0 baris** | *Dieliminasi (Kosong)* | Catatan ringkasan hasil kegiatan disimpan langsung pada tabel `kegiatan`. |
| 11 | `komentar_notulen` | **0 baris** | *Dieliminasi (Kosong)* | Tidak ada record data operasional aktif di database. |
| 12 | `riwayat_notulen` | **0 baris** | *Dieliminasi (Kosong)* | Tidak ada record data operasional aktif di database. |
| 13 | `penomoran_kegiatan_biro` | **0 baris** | *Dieliminasi (Kosong)* | Penomoran urut agenda di-generate secara algoritmik di kode program. |
| 14 | `kegiatan_biro` | **0 baris** | *Dieliminasi (Kosong)* | Relasi biro pemrakarsa dicatat langsung via foreign key `id_biro`. |

---

## 2. Struktur Relasi Relasional Antar-Tabel (Physical Data Model)

```
                  +-------------------+            +-------------------+
                  |       biro        | 1         N|     tim_biro      |
                  +-------------------+───────────>+-------------------+
                  | id_biro        PK |            | id_tim         PK |
                  | kode_biro    text |            | id_biro        FK |
                  | nama_biro    text |            | kode_tim     text |
                  | nama_singkat text |            | nama_tim     text |
                  | status_aktif bool |            | status_aktif bool |
                  +-------------------+            +-------------------+
                     │ 1                                     │ 1
                     │                                       │
                     ▼ N                                     ▼ N
+--------------------+--------------+   +--------------------+--------------+   +--------------------+--------------+
|              kegiatan             |   |            tindak_lanjut          |   |              pengguna              |
+-----------------------------------+   +-----------------------------------+   +-----------------------------------+
| id_kegiatan                    PK | 1 | id_tindak_lanjut               PK |   | id_pengguna                    PK |
| nomor_kegiatan               text |──>| id_kegiatan                    FK |   | nama_lengkap                 text |
| judul_kegiatan               text | N | id_biro                        FK |   | email                        text |
| id_biro                        FK |   | id_tim                         FK |   | peran                    UserRole |
| id_tim                         FK |   | id_pengguna                    FK |   | id_biro                        FK |
| id_pengguna                    FK |   | judul_tindakan               text |   | id_tim                         FK |
| tanggal_kegiatan        timestamp |   | status_tindak_lanjut ActionItem.. |   | status_aktif                 bool |
| waktu_mulai                  text |   | tenggat_waktu           timestamp |   | id_tim                         FK |
| waktu_selesai                text |   | diselesaikan_pada       timestamp |   | status_aktif                 bool |
| lokasi_kegiatan              text |   | dibuat_pada             timestamp |   +-----------------------------------+
| status_kegiatan     MeetingStatus |   +-----------------------------------+      │ 1           │ 1           │ 1
| pic_kegiatan                 text |   +-----------------------------------+      │             │             ▼ N
| status_progres               text |              │ 1                             │             │  +-------------------+
| catatan_hasil                text |              │                               │             │  |    notifikasi     |
+-----------------------------------+              ▼ N                             │             │  +-------------------+
   │ 1              │ 1                 +-----------------------------------+      │             │  | id_notifikasi  PK |
   │                │                   |       riwayat_tindak_lanjut       |      │             │  | id_pengguna    FK |
   │                │                   +-----------------------------------+      │             │  | judul        text |
   │                │                   | id_riwayat                     PK |      │             │  | pesan        text |
   │                │                   | id_tindak_lanjut               FK |      │             │  | tipe         text |
   │                │                   | id_pengguna                    FK |<─────┘             │  | tautan       text |
   │                │                   | status_sebelumnya  ActionItem..   |                    │  | sudah_dibaca bool |
   │                │                   | status_terbaru     ActionItem..   |                    │  | dibuat_pada  time |
   │                │                   | catatan_progres              text |                    │  +-------------------+
   │                │                   | dibuat_pada             timestamp |                    │
   │                │                   +-----------------------------------+                    │
   │                ▼ N                                                                          │
   │    +-----------------------------------+   +-----------------------------------+            │
   │    |         peserta_kegiatan          |   |         lampiran_kegiatan         |            │
   │    +-----------------------------------+   +-----------------------------------+            │
   │    | id_peserta                     PK |   | id_lampiran                    PK |            │
   └───>| id_kegiatan                    FK |   | id_kegiatan                    FK |<───────────┘
        | id_pengguna                    FK |<──┼───────────────────────────────────┤
        | status_kehadiran AttendanceStatus |   | nama_berkas                  text |
        | dibuat_pada             timestamp |   | url_berkas                   text |
        +-----------------------------------+   | ukuran_berkas                int4 |
                                                | tipe_berkas                  text |
                                                | kategori                     text |
                                                | dibuat_pada             timestamp |
                                                +-----------------------------------+
```

---

## 3. Spesifikasi Basis Data (Data Dictionary)

Spesifikasi basis data (*data dictionary*) menjelaskan rincian teknis dari setiap tabel yang digunakan dalam sistem **Aplikasi Log Book Kegiatan pada Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus**:

### Tabel III.1. Spesifikasi Tabel Pengguna (`pengguna`)
| No | Nama Field | Tipe Data | Keterangan |
|:--:|:---|:---|:---|
| 1 | `id_pengguna` | `text` (UUID) | **Primary Key** (Kode pengenal unik akun aparatur) |
| 2 | `nama_lengkap` | `text` | Nama lengkap aparatur pegawai |
| 3 | `email` | `text` | Alamat email resmi (Unique) |
| 4 | `kata_sandi` | `text` | Kata sandi akun terenkripsi (Hash) |
| 5 | `peran` | `UserRole` (Enum) | Hak akses peran: `SUPER_ADMIN`, `ADMIN`, `PIMPINAN`, `STAFF` |
| 6 | `id_biro` | `text` (UUID) | **Foreign Key** (Relasi ke `biro.id_biro`) |
| 7 | `id_tim` | `text` (UUID) | **Foreign Key** (Relasi ke `tim_biro.id_tim`, opsional) |
| 8 | `status_aktif` | `bool` | Status keaktifan akun pengguna (Default: `true`) |
| 9 | `dibuat_pada` | `timestamp` | Waktu akun pertama kali didaftarkan |
| 10 | `diperbarui_pada` | `timestamp` | Waktu terakhir pembaruan data profil akun |
| 11 | `nama_pengguna` | `text` | Username unik untuk keperluan autentikasi login |

### Tabel III.2. Spesifikasi Tabel Biro (`biro`)
| No | Nama Field | Tipe Data | Keterangan |
|:--:|:---|:---|:---|
| 1 | `id_biro` | `text` (UUID) | **Primary Key** (Kode pengenal unik unit kerja Biro) |
| 2 | `kode_biro` | `text` | Kode unik biro kerja (misal: `BIRO-1`, `BIRO-2`) (Unique) |
| 3 | `nama_biro` | `text` | Nama lengkap unit kerja biro pemrakarsa |
| 4 | `nama_singkat` | `text` | Nomenklatur singkatan biro kerja |
| 5 | `deskripsi` | `text` | Uraian tugas dan fungsi pokok biro |
| 6 | `status_aktif` | `bool` | Status aktif operasional biro (Default: `true`) |
| 7 | `dibuat_pada` | `timestamp` | Waktu data biro dibuat |
| 8 | `diperbarui_pada` | `timestamp` | Waktu terakhir pembaruan data biro |

### Tabel III.3. Spesifikasi Tabel Tim Kerja Biro (`tim_biro`)
| No | Nama Field | Tipe Data | Keterangan |
|:--:|:---|:---|:---|
| 1 | `id_tim` | `text` (UUID) | **Primary Key** (Kode pengenal unik kelompok kerja tim) |
| 2 | `id_biro` | `text` (UUID) | **Foreign Key** (Relasi ke `biro.id_biro` - Biro Induk) |
| 3 | `kode_tim` | `text` | Kode unik tim kerja |
| 4 | `nama_tim` | `text` | Nama kelompok kerja teknis di bawah biro |
| 5 | `deskripsi_tim` | `text` | Uraian bidang penugasan kerja tim |
| 6 | `status_aktif` | `bool` | Status keaktifan kelompok kerja (Default: `true`) |
| 7 | `dibuat_pada` | `timestamp` | Waktu tim kerja dibentuk |
| 8 | `diperbarui_pada` | `timestamp` | Waktu pembaruan data tim kerja |

### Tabel III.4. Spesifikasi Tabel Kegiatan (`kegiatan`)
| No | Nama Field | Tipe Data | Keterangan |
|:--:|:---|:---|:---|
| 1 | `id_kegiatan` | `text` (UUID) | **Primary Key** (Kode pengenal unik transaksi agenda kegiatan) |
| 2 | `nomor_kegiatan` | `text` | Nomor registrasi agenda kegiatan (Unique) |
| 3 | `judul_kegiatan` | `text` | Pokok judul pembahasan agenda kegiatan |
| 4 | `id_biro` | `text` (UUID) | **Foreign Key** (Relasi ke `biro.id_biro` - Biro Pemrakarsa) |
| 5 | `id_tim` | `text` (UUID) | **Foreign Key** (Relasi ke `tim_biro.id_tim`, opsional) |
| 6 | `tanggal_kegiatan` | `timestamp` | Tanggal pelaksanaan agenda kegiatan |
| 7 | `waktu_mulai` | `text` | Waktu mulai pelaksanaan kegiatan (Format HH:mm) |
| 8 | `waktu_selesai` | `text` | Waktu penutupan pelaksanaan kegiatan (Format HH:mm) |
| 9 | `lokasi_kegiatan` | `text` | Lokasi pelaksanaan kegiatan (luring atau tautan daring) |
| 10 | `id_pengguna` | `text` (UUID) | **Foreign Key** (Relasi ke `pengguna.id_pengguna` - Pimpinan Kegiatan) |
| 11 | `id_kegiatan_sebelumnya` | `text` (UUID) | **Foreign Key** (Relasi rekursif ke `kegiatan.id_kegiatan`, opsional) |
| 12 | `status_kegiatan` | `MeetingStatus` | Status tahapan: `DRAFT`, `REVIEW`, `APPROVED`, `FINAL` |
| 13 | `kategori_naskah` | `text` | Kategori naskah acuan kegiatan (Undangan, Disposisi, Nota Masuk) |
| 14 | `pic_kegiatan` | `text` | Nama pejabat/staf penanggung jawab teknis kegiatan |
| 15 | `status_progres` | `text` | Tahapan progres: Belum Dimulai, Dalam Proses, Selesai |
| 16 | `catatan_hasil` | `text` | Ringkasan pokok catatan dan kesimpulan pelaksanaan kegiatan |
| 17 | `rencana_aksi` | `text` | Rencana tindak lanjut pelaksanaan arahan kegiatan |
| 18 | `nomor_nd_konsum` | `text` | Nomor nota pengajuan konsumsi kegiatan |
| 19 | `tautan_rilis` | `text` | Tautan publikasi media/berita terkait kegiatan |
| 20 | `dibuat_pada` | `timestamp` | Waktu data agenda kegiatan didaftarkan ke sistem |
| 21 | `diperbarui_pada` | `timestamp` | Waktu terakhir pembaruan data kegiatan |

### Tabel III.5. Spesifikasi Tabel Peserta Kegiatan (`peserta_kegiatan`)
| No | Nama Field | Tipe Data | Keterangan |
|:--:|:---|:---|:---|
| 1 | `id_peserta` | `text` (UUID) | **Primary Key** (Kode unik data pihak terkait kegiatan) |
| 2 | `id_kegiatan` | `text` (UUID) | **Foreign Key** (Relasi ke `kegiatan.id_kegiatan`) |
| 3 | `id_pengguna` | `text` (UUID) | **Foreign Key** (Relasi ke `pengguna.id_pengguna` - Aparatur Terkait) |
| 4 | `status_kehadiran` | `AttendanceStatus` | Status peran aparatur/undangan terkait kegiatan |
| 5 | `dibuat_pada` | `timestamp` | Waktu data pihak terkait ditambahkan ke agenda |

### Tabel III.6. Spesifikasi Tabel Riwayat Tindak Lanjut (`riwayat_tindak_lanjut`)
| No | Nama Field | Tipe Data | Keterangan |
|:--:|:---|:---|:---|
| 1 | `id_riwayat` | `text` (UUID) | **Primary Key** (Kode pengenal unik riwayat progres) |
| 2 | `id_tindak_lanjut` | `text` (UUID) | **Foreign Key** (Relasi ke `tindak_lanjut.id_tindak_lanjut`) |
| 3 | `id_pengguna` | `text` (UUID) | **Foreign Key** (Relasi ke `pengguna.id_pengguna` - Aparatur PIC) |
| 4 | `status_sebelumnya` | `ActionItemStatus` | Status tahapan penugasan sebelum diperbarui |
| 5 | `status_terbaru` | `ActionItemStatus` | Status tahapan terkini: Belum Dimulai, Dalam Proses, Selesai |
| 6 | `catatan_progres` | `text` | Uraian catatan capaian realisasi progres tindak lanjut |
| 7 | `dibuat_pada` | `timestamp` | Waktu pencatatan log riwayat progres tugas |

### Tabel III.7. Spesifikasi Tabel Tindak Lanjut Arahan (`tindak_lanjut`)
| No | Nama Field | Tipe Data | Keterangan |
|:--:|:---|:---|:---|
| 1 | `id_tindak_lanjut` | `text` (UUID) | **Primary Key** (Kode unik butir komitmen tindak lanjut) |
| 2 | `id_kegiatan` | `text` (UUID) | **Foreign Key** (Relasi ke `kegiatan.id_kegiatan`) |
| 3 | `judul_tindakan` | `text` | Judul arahan / butir tugas tindak lanjut kegiatan |
| 4 | `deskripsi_tindakan` | `text` | Uraian teknis rincian instruksi pelaksanaan penugasan |
| 5 | `id_biro` | `text` (UUID) | **Foreign Key** (Relasi ke `biro.id_biro` - Biro Penanggung Jawab) |
| 6 | `id_tim` | `text` (UUID) | **Foreign Key** (Relasi ke `tim_biro.id_tim`, opsional) |
| 7 | `id_pengguna` | `text` (UUID) | **Foreign Key** (Relasi ke `pengguna.id_pengguna` - Staf Aparatur PIC) |
| 8 | `tenggat_waktu` | `timestamp` | Batas akhir waktu penyelesaian tugas (*due date*) |
| 9 | `status_tindak_lanjut` | `ActionItemStatus` | Status tahapan: `PENDING`, `IN_PROGRESS`, `COMPLETED` |
| 10 | `diselesaikan_pada` | `timestamp` | Waktu resmi penuntasan butir tugas (opsional) |
| 11 | `dibuat_pada` | `timestamp` | Waktu butir instruksi diterbitkan |
| 12 | `diperbarui_pada` | `timestamp` | Waktu pembaruan status tindak lanjut |

### Tabel III.8. Spesifikasi Tabel Berkas Lampiran Kegiatan (`lampiran_kegiatan`)
| No | Nama Field | Tipe Data | Keterangan |
|:--:|:---|:---|:---|
| 1 | `id_lampiran` | `text` (UUID) | **Primary Key** (Kode unik berkas lampiran dokumen kegiatan) |
| 2 | `id_kegiatan` | `text` (UUID) | **Foreign Key** (Relasi ke `kegiatan.id_kegiatan`) |
| 3 | `nama_berkas` | `text` | Nama berkas dokumen kegiatan (misal: `Undangan_KEK.pdf`) |
| 4 | `url_berkas` | `text` | Tautan lokasi penyimpanan berkas digital (*storage URL*) |
| 5 | `ukuran_berkas` | `int4` | Ukuran kapasitas berkas dokumen dalam satuan bytes |
| 6 | `tipe_berkas` | `text` | Ekstensi format berkas naskah digital (PDF, DOCX, XLSX) |
| 7 | `nama_pengunggah` | `text` | Identitas staf aparatur yang mengunggah dokumen |
| 8 | `kategori` | `text` | Klasifikasi dokumen (UNDANGAN / MATERI / NOTA_KONSUMSI / RILIS) |
| 9 | `dibuat_pada` | `timestamp` | Waktu berkas diunggah ke sistem repositori |

### Tabel III.9. Spesifikasi Tabel Notifikasi Sistem (`notifikasi`)
| No | Nama Field | Tipe Data | Keterangan |
|:--:|:---|:---|:---|
| 1 | `id_notifikasi` | `text` (UUID) | **Primary Key** (Kode pengenal unik notifikasi pesan) |
| 2 | `id_pengguna` | `text` (UUID) | **Foreign Key** (Relasi ke `pengguna.id_pengguna` - Penerima Notifikasi) |
| 3 | `judul` | `text` | Judul pemberitahuan informasi sistem |
| 4 | `pesan` | `text` | Uraian teks detail notifikasi jadwal / penugasan |
| 5 | `tipe` | `text` | Tipe kategori pesan notifikasi (`info`, `warning`, `success`) |
| 6 | `tautan` | `text` | Tautan navigasi cepat menuju detail kegiatan / tindak lanjut |
| 7 | `sudah_dibaca` | `bool` | Indikator status apakah pesan telah dibaca (Default: `false`) |
| 8 | `dibuat_pada` | `timestamp` | Waktu notifikasi diterbitkan oleh sistem |
| 9 | `id_tim` | `text` (UUID) | **Foreign Key** (Relasi ke `tim_biro.id_tim`, opsional) |

---

*Dokumen ini disinkronkan secara langsung dengan basis data aktif Neon Serverless PostgreSQL dan naskah Laporan PKL UBSI 2026.*
