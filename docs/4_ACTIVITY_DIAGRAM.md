# DOKUMEN PERANCANGAN TAHAP 4: UML ACTIVITY DIAGRAM (ALUR AKTIVITAS)
## Sistem Informasi Log & Notula Rapat (SIM-RAPAT KEK RI)
**Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus Republik Indonesia**

Dokumen ini memuat perancangan resmi **UML Activity Diagram (Diagram Aktivitas)** dengan pemisahan jalur tanggung jawab (*Swimlanes: Aktor, Sistem, & Basis Data*), memodelkan 5 proses bisnis inti yang beroperasi pada Website Log & Notula Rapat KEK. File diagram telah disusun dalam format **Multi-Page Draw.io (`.drawio`)**, siap dibuka dan diedit di **Draw.io (diagrams.net)**.

---

## 1. File Draw.io Siap Pakai

File diagram Draw.io resmi berformat *multi-page* telah disediakan di repository:
* **Lokasi File Lokal:** [`docs/ACTIVITY_DIAGRAM_SIM_RAPAT.drawio`](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/ACTIVITY_DIAGRAM_SIM_RAPAT.drawio)
* **Tautan Unduh Web:** [http://localhost:3000/ACTIVITY_DIAGRAM_SIM_RAPAT.drawio](http://localhost:3000/ACTIVITY_DIAGRAM_SIM_RAPAT.drawio)

> [!TIP]
> **Format Multi-Page Draw.io:**
> Saat dibuka di Draw.io, file ini otomatis menampilkan **5 lembar diagram (tab) terpisah** di bagian bawah kanvas:
> 1. `AD-01: Penjadwalan Rapat Baru`
> 2. `AD-02: Notula & Tindak Lanjut`
> 3. `AD-03: Monitoring & Filter Periode`
> 4. `AD-04: Progres Tindak Lanjut (PIC)`
> 5. `AD-05: Autentikasi & Login`

---

## 2. Ringkasan 5 Diagram Aktivitas Inti

| Kode Diagram | Nama Alur Aktivitas | Aktor Utama | Tujuan Proses Bisnis |
|:---|:---|:---|:---|
| **AD-01** | **Penjadwalan Rapat Dinas Baru** | Admin Biro / Tim Kerja | Menjadwalkan rapat dinas baru dengan penomoran urut otomatis dari tabel `penomoran_rapat_biro`, klasifikasi naskah masuk, dan penugasan peserta. |
| **AD-02** | **Penyusunan Notula & Tindak Lanjut** | Notulis / Admin Biro | Mencatat jalannya rapat dinas, poin bahasan, arahan pimpinan, serta merumuskan butir-butir *Action Items* langsung ke basis data. |
| **AD-03** | **Monitoring Kinerja Tim & Filter Periode** | Super Admin / Pimpinan | Memantau KPI penyelesaian tugas 3 Tim Kerja KEK (INV, KS, KOM), memfilter periode waktu (*Hari Ini, Minggu Ini, Bulan Ini*), dan investigasi detail rapat. |
| **AD-04** | **Pembaruan Status Tindak Lanjut (PIC)** | Pegawai / PIC Penugasan | Memperbarui siklus hidup pekerjaan tindak lanjut (*Belum Dimulai &rarr; Dalam Proses &rarr; Selesai*) beserta pencatatan audit log riwayat progres. |
| **AD-05** | **Autentikasi Pengguna & Validasi Sesi** | Seluruh Pengguna (Staff/Admin/Super) | Memverifikasi kredensial email dinas & kata sandi terenkripsi, membentuk sesi login aman, dan mengarahkan ke dashboard sesuai hak akses. |

---

## 3. Rincian & Visualisasi Mermaid Tiap Alur Aktivitas

---

### AD-01: Penjadwalan Rapat Dinas Baru
Memodelkan proses ketika Admin Biro/Tim menjadwalkan rapat dinas baru hingga tersimpan di basis data Neon DB.

```mermaid
flowchart TD
    %% Swimlane Definitions
    subgraph ADMIN["👤 Admin Biro / Tim Kerja"]
        A_Start((●)) --> A1["Memilih menu 'Buat Rapat'<br>& Tim Kerja Pemrakarsa"]
        A1 --> A2["Mengisi formulir rapat:<br>Judul, Tanggal, Waktu, Lokasi, & Kategori"]
        A2 --> A3["Menentukan Pimpinan, Notulis,<br>& Peserta / Biro Terkait"]
        A3 --> A4["Unggah berkas lampiran (Opsional)"]
        A4 --> A5["Klik tombol 'Jadwalkan Rapat'"]
        A_Notify["Menerima konfirmasi sukses<br>& melihat detail rapat"] --> A_End(((◉)))
    end

    subgraph SYSTEM["💻 Sistem SIM-RAPAT (Next.js)"]
        S1["Tampilkan form buat rapat<br>& request nomor terakhir"]
        S2["Generate preview nomor registrasi<br>(contoh: INV-015)"]
        S_Validate{"Data Lengkap<br>& Valid?"}
        S_Err["Tampilkan peringatan input form"]
        S_Save["Siapkan payload mutasi simpan"]
        S_Redirect["Tampilkan notifikasi sukses<br>& redirect ke /semua-rapat/[id]"]
    end

    subgraph DATABASE["🗄️ Basis Data (Neon PostgreSQL)"]
        DB_Seq["Kueri nomor urut terakhir<br>dari penomoran_rapat_biro"]
        DB_Commit["Transaksi Prisma:<br>• Insert tabel rapat<br>• Insert peserta_rapat<br>• Update penomoran_rapat_biro"]
    end

    %% Flow Connections
    A1 --> S1
    S1 --> DB_Seq
    DB_Seq --> S2
    S2 --> A2
    A5 --> S_Validate
    S_Validate -- Tidak Valid --> S_Err
    S_Err -. Perbaiki Isian .-> A2
    S_Validate -- Valid --> S_Save
    S_Save --> DB_Commit
    DB_Commit --> S_Redirect
    S_Redirect --> A_Notify
```

---

### AD-02: Penyusunan Notula & Butir Tindak Lanjut
Memodelkan alur pencatatan jalannya rapat dinas, poin keputusan, dan perumusan butir *Action Items*.

```mermaid
flowchart TD
    subgraph NOTULIS["👤 Notulis / Admin Biro"]
        N_Start((●)) --> N1["Buka detail rapat & pilih tab 'Notula'"]
        N1 --> N2["Input poin pembahasan, arahan pimpinan,<br>keputusan, & kesimpulan"]
        N2 --> N3["Tambah butir tindak lanjut:<br>Judul, Tim PIC, Pegawai PIC, & Due Date"]
        N3 --> N4["Klik tombol 'Simpan Notula & Tindak Lanjut'"]
        N_Review["Melihat notula & matriks tindak lanjut terkini"]
        N_Print["Cetak / Export dokumen Notula atau Nota Dinas"] --> N_End(((◉)))
    end

    subgraph SYSTEM["💻 Sistem SIM-RAPAT"]
        S_Editor["Tampilkan editor risalah & form action items"]
        S_Val{"Validasi Data<br>Notula Berhasil?"}
        S_Warn["Tampilkan pesan validasi input"]
        S_Process["Kirim mutasi simpan ke Server Action"]
        S_Success["Kalkulasi ulang status progres rapat<br>& kirim respons sukses"]
    end

    subgraph DATABASE["🗄️ Basis Data (Neon DB)"]
        DB_Read["Kueri draft notula terdahulu"]
        DB_Write["Eksekusi Penyimpanan:<br>• Upsert tabel notulen_rapat<br>• Insert batch tabel tindak_lanjut<br>• Update status_rapat"]
    end

    N1 --> S_Editor
    S_Editor --> DB_Read
    DB_Read --> N2
    N4 --> S_Val
    S_Val -- Gagal --> S_Warn
    S_Warn -. Perbaiki Data .-> N2
    S_Val -- Sukses --> S_Process
    S_Process --> DB_Write
    DB_Write --> S_Success
    S_Success --> N_Review
    N_Review --> N_Print
```

---

### AD-03: Pemantauan Kinerja Tim Kerja & Filter Periode Tanggal
Memodelkan alur pemantauan beban kerja 3 Tim Kerja KEK pada modal monitoring eksekutif berserta filter waktu reaktif.

```mermaid
flowchart TD
    subgraph SUPER["👤 Super Admin / Pimpinan"]
        SA_Start((●)) --> SA1["Buka Dashboard & tinjau kartu 3 Tim Kerja KEK"]
        SA1 --> SA2["Klik kartu tim (contoh: Tim Investasi)"]
        SA2 --> SA3["Pilih filter tanggal:<br>Hari Ini / Minggu Ini / Bulan Ini / Semua"]
        SA3 --> SA_Inspect["Tinjau KPI bar & daftar pekerjaan terfilter"]
        SA_Check{"Ingin Periksa<br>Detail Rapat?"}
        SA_ClickMeeting["Klik badge 'Rapat [Nomor]' atau 'Detail Rapat'"]
        SA_Close["Tutup modal monitoring"] --> SA_End(((◉)))
    end

    subgraph SYSTEM["💻 Sistem SIM-RAPAT (Monitoring Engine)"]
        SM1["Render dashboard & metrik ringkasan"]
        SM2["Buka modal monitoring detail tim kerja"]
        SM3["Hitung batas kalender (Senin-Minggu, 1-Akhir Bulan)"]
        SM4["Saring action items (dueDate) & rapat (meetingDate)"]
        SM5["Rekalkulasi metrik KPI reaktif:<br>Jumlah Rapat, Total, Selesai, Proses, Belum Mulai"]
        SM6["Perbarui tampilan tab & badge indikator"]
        SM7["Tutup modal otomatis & navigasi ke /semua-rapat/[id]"]
    end

    SA1 --> SM1
    SA2 --> SM2
    SM2 --> SM3
    SA3 --> SM4
    SM4 --> SM5
    SM5 --> SM6
    SM6 --> SA_Inspect
    SA_Inspect --> SA_Check
    SA_Check -- Ya --> SA_ClickMeeting
    SA_ClickMeeting --> SM7
    SM7 --> SA_End
    SA_Check -- Tidak --> SA_Close
```

---

### AD-04: Pembaruan Status Tindak Lanjut oleh PIC
Memodelkan bagaimana staf atau penanggung jawab memperbarui perkembangan butir pekerjaan.

```mermaid
flowchart TD
    subgraph PIC["👤 Pegawai / PIC Tindak Lanjut"]
        P_Start((●)) --> P1["Buka matriks tindak lanjut atau detail rapat"]
        P1 --> P2["Pilih butir pekerjaan yang ditugaskan"]
        P2 --> P3["Ubah status: Belum Dimulai / Dalam Proses / Selesai"]
        P3 --> P4["Klik tombol 'Simpan Progres'"]
        P5["Melihat badge status terbarui:<br>Finish / Dalam Proses / Belum Mulai"] --> P_End(((◉)))
    end

    subgraph SYSTEM["💻 Sistem SIM-RAPAT"]
        SP1["Validasi otorisasi PIC atau Admin"]
        SP2["Tampilkan dialog pilihan status & catatan"]
        SP3["Siapkan payload pembaruan status & tanggal selesai"]
        SP4["Rekalkulasi persentase penyelesaian tim<br>& kirim respons sukses"]
    end

    subgraph DATABASE["🗄️ Basis Data (Neon DB)"]
        DB_Update["Update tabel tindak_lanjut:<br>status_tindak_lanjut & diselesaikan_pada"]
        DB_Log["Insert catatan ke riwayat audit log"]
    end

    P1 --> SP1
    P2 --> SP2
    SP2 --> P3
    P4 --> SP3
    SP3 --> DB_Update
    DB_Update --> DB_Log
    DB_Log --> SP4
    SP4 --> P5
```

---

### AD-05: Autentikasi Pengguna & Validasi Sesi
Memodelkan alur masuk (*login*) pengguna ke dalam sistem informasi.

```mermaid
flowchart TD
    subgraph USER["👤 Pengguna (Pegawai / Admin)"]
        U_Start((●)) --> U1["Akses halaman login SIM-RAPAT"]
        U1 --> U2["Masukkan email dinas & kata sandi"]
        U2 --> U3["Klik tombol 'Masuk'"]
        U_Success["Masuk ke Dashboard sesuai hak akses<br>(Super Admin / Admin / Staff)"] --> U_End(((◉)))
    end

    subgraph SYSTEM["💻 Sistem SIM-RAPAT (Auth Service)"]
        SU1["Tampilkan form login"]
        SU2["Validasi format input & kirim kueri pencarian"]
        SU_UserFound{"Pengguna Ditemukan<br>& Status Aktif?"}
        SU_VerifyHash["Verifikasi hash sandi (Argon2 / Bcrypt)"]
        SU_PassMatch{"Kata Sandi<br>Cocok?"}
        SU_Err["Tampilkan notifikasi kesalahan login"]
        SU_CreateSession["Bentuk token sesi terenkripsi<br>& redirect ke /dashboard"]
    end

    subgraph DATABASE["🗄️ Basis Data (Neon DB)"]
        DB_Find["SELECT * FROM pengguna<br>WHERE email = ? AND status_aktif = true"]
    end

    U1 --> SU1
    SU1 --> U2
    U3 --> SU2
    SU2 --> DB_Find
    DB_Find --> SU_UserFound
    SU_UserFound -- Tidak --> SU_Err
    SU_Err -. Masukkan Ulang .-> U2
    SU_UserFound -- Ya --> SU_VerifyHash
    SU_VerifyHash --> SU_PassMatch
    SU_PassMatch -- Tidak Cocok --> SU_Err
    SU_PassMatch -- Cocok --> SU_CreateSession
    SU_CreateSession --> U_Success
```

---

## 4. Standar Notasi UML Activity Diagram yang Diterapkan

1. **Initial Node (`●`):** Lingkaran hitam pekat menandai titik awal dimulainya alur aktivitas.
2. **Action State (Persegi Panjang Tumpul):** Merepresentasikan langkah pekerjaan atau operasi yang dilakukan oleh sistem atau aktor.
3. **Decision Node (`◇`):** Belah ketupat percabangan logika dengan kondisi pengaman (*guard conditions*) tertulis pada setiap cabang keluaran (misal: `[Valid]` vs `[Tidak Valid]`).
4. **Swimlanes (Jalur Partisi Kolom):** Memisahkan tanggung jawab kerja secara eksplisit antara:
   - **Aktor Pengguna** (Staf / Admin / Pimpinan)
   - **Sistem Perangkat Lunak** (Aplikasi Antarmuka & Logika Server Next.js)
   - **Basis Data** (Neon PostgreSQL / Prisma ORM)
5. **Activity Final Node (`◉`):** Lingkaran ganda (*bullseye*) menandai akhir dari suatu alur aktivitas.

---

*Dokumen ini merupakan bagian dari rangkaian dokumentasi resmi rekayasa perangkat lunak SIM-RAPAT KEK RI ([Tahap 1: ERD](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/1_ERD_DIAGRAM.md) &bull; [Tahap 2: LRS](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/2_LRS_DIAGRAM.md) &bull; [Tahap 3: Use Case](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/3_USE_CASE_DIAGRAM.md) &bull; [Tahap 4: Activity Diagram](file:///c:/Users/nappz/Documents/Project%20Website/Projek%20Log%20Rapat/docs/4_ACTIVITY_DIAGRAM.md)).*
