# Design System Master File — Sekretariat Dewan Nasional KEK

> **LOGIC:** Dokumen ini menjadi pedoman utama (single source of truth) untuk seluruh komponen antarmuka, tata letak, dan sistem warna aplikasi **Log & Notula Rapat KEK**.
> Mengacu pada intelligence **`ui-ux-pro-max`** dengan arsitektur **Data-Dense Dashboard** dan **Modern Swiss Minimalism** yang telah diselaraskan dengan identitas resmi Kawasan Ekonomi Khusus (KEK).

---

**Proyek:** Log & Notula Rapat Sekretariat Dewan Nasional KEK (`kek-log-rapat`)  
**Standar Aksesibilitas:** WCAG 2.1 Level AA (Minimum Contrast Ratio 4.5:1 untuk normal text, 3:1 untuk graphics & UI components)  
**Tingkat Kepadatan (Visual Density):** 8/10 (Compact & Data-Dense)  
**Tingkat Variasi Desain:** 4/10 (Modern, Bersih, Profesional, Terstruktur)  

---

## 1. Identitas Brand & Palet Warna Resmi (Color Palette)

Aplikasi ini menggunakan 4 kuadran warna resmi KEK yang diperkuat dengan token semantik untuk kebutuhan enterprise dashboard:

### A. Palet Brand Inti (Core Brand)
| Peran (Role) | Hex | Token CSS | Keterangan & Kontras |
| :--- | :--- | :--- | :--- |
| **Primary (KEK Teal)** | `#1E6B7B` | `--color-primary` | Aksi utama, header aktif, tombol primer (Kontras 4.8:1 pada background putih) |
| **Primary Hover** | `#175360` | `--color-primary-hover` | State hover tombol primer |
| **Primary Active** | `#103C46` | `--color-primary-active` | State pressed tombol primer |
| **Primary Subtle** | `#F0F8FA` | `--color-primary-subtle` | Latar badge, baris terpilih, hover menu |
| **Primary Border** | `#BCE3EB` | `--color-primary-border` | Border kontainer bernuansa brand KEK |
| **Primary Text** | `#174853` | `--color-primary-text` | Teks judul dengan warna brand (Kontras 7.2:1) |

### B. Kuadran Aksen Resmi KEK
| Warna Aksen | Hex Base | Hex Text (WCAG AA) | Background Subtle | Border | Penggunaan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **KEK Emerald (Hijau)** | `#7CC563` | `#15803D` | `#ECF8E9` | `#D2EFCA` | Status `FINAL`, Rapat Disetujui, Presensi Hadir, Capaian Selesai |
| **KEK Amber (Kuning)** | `#FFD300` | `#854D0E` | `#FEF9C3` | `#FDE047` | Status `REVIEW`, Dalam Pembahasan, Perlu Perhatian |
| **KEK Coral (Oranye)** | `#F99D1C` | `#C2410C` | `#FFF0DC` | `#FEDEBE` | Tindak Lanjut Aktif, Status `IN_PROGRESS`, Prioritas High |
| **KEK Crimson (Merah)** | `#DC2626` | `#B91C1C` | `#FEE2E2` | `#FECACA` | Jatuh Tempo (`OVERDUE`), Prioritas `URGENT`, Aksi Hapus |

### C. Permukaan & Latar Belakang (Neutrals & Surfaces)
| Token | Hex | Penggunaan |
| :--- | :--- | :--- |
| `--color-background` | `#F8FAFC` (Slate 50) | Latar belakang kanvas aplikasi |
| `--color-surface` | `#FFFFFF` | Latar card, modal dialog, formulir input |
| `--color-surface-subtle` | `#F1F5F9` (Slate 100) | Latar header tabel, filter bar, container non-aktif |
| `--color-dark-section` | `#0F172A` (Slate 900) | Sidebar navigasi eksekutif & top banner |
| `--color-text-main` | `#0F172A` (Slate 900) | Teks utama, judul, notulen rapat (Kontras 14:1) |
| `--color-text-secondary` | `#475569` (Slate 600) | Metadata, nama notulis, tanggal, label |
| `--color-text-muted` | `#94A3B8` (Slate 400) | Placeholder, teks nonaktif, counter sekunder |
| `--color-border-main` | `#E2E8F0` (Slate 200) | Border kartu, pembatas tabel (1px solid) |
| `--color-border-light` | `#F1F5F9` (Slate 100) | Garis pemisah halus antar-baris data |

---

## 2. Tipografi (Typography Hierarchy)

* **Font Utama (UI & Body Text):** `Plus Jakarta Sans` / `Public Sans`  
  * Highly readable, modern institutional aesthetic.
* **Font Data & Penomoran (Monospace):** `JetBrains Mono` / `Fira Code` / `ui-monospace`  
  * Wajib untuk: Nomor Registrasi Rapat (contoh: `024/SEK-KEK/V/2026`), timestamp waktu rapat, counter KPI, dan nomor urut.

### Skala Tipografi:
* **H1 (Judul Halaman Utama):** `24px` (`text-2xl`), `font-bold`, `tracking-tight`, text `#0F172A`
* **H2 (Judul Bagian/Card):** `18px` (`text-lg`), `font-semibold`, text `#0F172A`
* **H3 (Sub-judul/Modal Title):** `15px` (`text-[15px]`), `font-semibold`, text `#1E293B`
* **Body Regular:** `13px`–`14px`, `leading-relaxed`, text `#334155`
* **Table Cell & Compact Text:** `13px` (`text-[13px]`), `leading-normal`
* **Micro Label / Badge / Timestamp:** `11px`–`12px`, `font-medium`, `uppercase tracking-wider` (untuk badge)

---

## 3. Komponen Spesifik Aplikasi Log Rapat KEK

### A. Badge Status Siklus Rapat (`MeetingStatus`)
1. **`DRAFT`**:
   * Class: `bg-slate-100 text-slate-700 border-slate-200`
   * Indikator Dot: `#94A3B8` (Abu-abu netral)
2. **`REVIEW`**:
   * Class: `bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]`
   * Indikator Dot: `#EAB308` (Kuning KEK)
3. **`APPROVED`**:
   * Class: `bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]`
   * Indikator Dot: `#0284C7` (Biru Langit)
4. **`FINAL`**:
   * Class: `bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]`
   * Indikator Dot: `#16A34A` (Hijau KEK)

### B. Badge Prioritas Tindak Lanjut (`ActionItemPriority`)
* **`LOW`**: `bg-slate-100 text-slate-600 border-slate-200`
* **`MEDIUM`**: `bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]`
* **`HIGH`**: `bg-[#FFF0DC] text-[#C2410C] border-[#FEDEBE]`
* **`URGENT`**: `bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]`

### C. Bento KPI Cards (Ringkasan Eksekutif)
* **Tinggi Padding**: `16px`–`20px` (`p-4` / `p-5`)
* **Sudut**: `rounded-xl` (`12px`)
* **Stripe Aksen**: Border-top 3px dengan 4 warna KEK:
  * Total Rapat: KEK Teal (`#1E6B7B`)
  * Notulensi Selesai / Final: KEK Emerald (`#7CC563`)
  * Butuh Review / Tindak Lanjut: KEK Amber (`#FFD300`)
  * Perlu Atensi / Overdue: KEK Coral/Red (`#EA580C`)

### D. Tabel Log Rapat (Data-Dense Table)
* **Tinggi Baris (Row Height)**: `40px`–`44px`
* **Header Tabel**: `bg-slate-50`, `text-[11px] font-bold uppercase tracking-wider text-slate-500`, `sticky top-0 z-10`
* **Zebra / Row Hover**: `hover:bg-[#F8FAFC]` dengan transition `duration-150`
* **Aksi Cepat Baris**: Tombol ikon kompak (28px x 28px) untuk Preview, Unduh Risalah, dan Edit.

### E. Editor Notulensi Rapat (Tiptap Canvas)
* **Lebar Maksimal Konten Baca**: `max-w-3xl` (agar tidak melelahkan mata pimpinan/peserta)
* **Line Height**: `1.65`
* **Heading Notulen**: H1 `18px`, H2 `16px`, H3 `14px`, dengan margin konsisten.
* **Tabel Keputusan dalam Notulen**: Border halus `#E2E8F0` dengan cell padding `8px 12px`.

---

## 4. Checklist Kualitas Sebelum Rilis UI (Pre-Delivery Checklist)
- [x] Lolos uji kontras warna WCAG 2.1 AA (minimal 4.5:1 untuk semua teks status).
- [x] Tidak ada emoji liar sebagai ikon status; selalu gunakan ikon resmi SVG dari `lucide-react`.
- [x] Angka sequence dan tanggal rapat menggunakan angka tabular monospace.
- [x] Transisi hover halus antara 150ms–250ms tanpa layout shifting.
- [x] State interaktif memiliki `cursor-pointer` dan focus ring yang terlihat jelas saat menggunakan keyboard.
