import { Biro, Meeting, DashboardMetric, MonthlyActivity, FollowUpStatusMetric, BureauWorkload } from './types';

// 5 Biro Utama Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus
// Sesuai penetapan kode resmi Stage 2:
// 1. BPPK  — Biro Perencanaan dan Pembentukan Kawasan Ekonomi Khusus
// 2. PKKEK — Biro Pengendalian Kawasan Ekonomi Khusus
// 3. IKK   — Biro Investasi, Kerja Sama, dan Komunikasi
// 4. HSDMO — Biro Hukum, Sumber Daya Manusia, dan Organisasi
// 5. UK    — Biro Umum dan Keuangan
export const BIRO_LIST: Biro[] = [
  {
    code: 'BPPK',
    name: 'Biro Perencanaan dan Pembentukan Kawasan Ekonomi Khusus',
    shortName: 'Biro Perencanaan & Pembentukan',
    description: 'Perencanaan tata ruang, studi kelayakan penetapan kawasan, evaluasi usulan pembentukan, dan pengawasan pembangunan KEK.',
  },
  {
    code: 'PKKEK',
    name: 'Biro Pengendalian Kawasan Ekonomi Khusus',
    shortName: 'Biro Pengendalian',
    description: 'Pemantauan berkala operasional, kesiapan infrastruktur logistik, pemenuhan standar tata kelola, dan pengendalian kawasan.',
  },
  {
    code: 'IKK',
    name: 'Biro Investasi, Kerja Sama, dan Komunikasi',
    shortName: 'Biro Investasi, Kerja Sama & Komunikasi',
    description: 'Akselerasi realisasi investasi strategis, fasilitasi kemitraan lintas kementerian/swasta, dan publikasi komunikasi publik.',
  },
  {
    code: 'HSDMO',
    name: 'Biro Hukum, Sumber Daya Manusia, dan Organisasi',
    shortName: 'Biro Hukum, SDM & Organisasi',
    description: 'Harmonisasi regulasi dan perundang-undangan fasilitas kepabeanan/pajak, advokasi hukum, penataan organisasi, dan SDM.',
  },
  {
    code: 'UK',
    name: 'Biro Umum dan Keuangan',
    shortName: 'Biro Umum & Keuangan',
    description: 'Tata kelola administrasi persuratan, perbendaharaan APBN, pengadaan barang/jasa, dukungan persidangan, dan rumah tangga.',
  },
];

export const MOCK_METRICS: DashboardMetric[] = [
  {
    id: 'total-rapat',
    label: 'Total Rapat (YTD)',
    value: 148,
    unit: 'Rapat',
    changeValue: '+12%',
    changeLabel: 'vs bulan lalu',
    variant: 'default',
    iconName: 'event_note',
  },
  {
    id: 'rapat-bulan-ini',
    label: 'Rapat Bulan Ini',
    value: 28,
    unit: 'Agenda',
    badgeText: '6 Prioritas',
    badgeSubtext: 'Strategis Nasional',
    variant: 'default',
    iconName: 'calendar_month',
  },
  {
    id: 'tindak-lanjut-aktif',
    label: 'Tindak Lanjut Aktif',
    value: 42,
    unit: 'Tugas',
    badgeText: 'Sedang Berjalan',
    badgeSubtext: '(On-Track)',
    variant: 'default',
    iconName: 'pending_actions',
  },
  {
    id: 'perlu-atensi',
    label: 'Perlu Atensi Khusus',
    value: 7,
    unit: 'Terlambat',
    badgeText: 'Butuh Eskalasi',
    badgeSubtext: 'Dewan KEK',
    variant: 'danger',
    iconName: 'warning',
  },
  {
    id: 'tindak-lanjut-selesai',
    label: 'Tindak Lanjut Selesai',
    value: 93,
    unit: 'Resolusi',
    badgeText: '93%',
    badgeSubtext: 'Tingkat Kepatuhan',
    variant: 'success',
    iconName: 'task_alt',
  },
];

export const MOCK_MONTHLY_ACTIVITY: MonthlyActivity[] = [
  { month: 'Jan', count: 12 },
  { month: 'Feb', count: 14 },
  { month: 'Mar', count: 15 },
  { month: 'Apr', count: 17 },
  { month: 'Mei', count: 22 },
  { month: 'Jun', count: 19 },
  { month: 'Jul', count: 21 },
  { month: 'Agu', count: 20 },
  { month: 'Sep', count: 28, isPeak: true },
];

export const MOCK_FOLLOW_UP_STATUS: FollowUpStatusMetric[] = [
  {
    label: 'Selesai',
    percentage: 45,
    count: 64,
    color: '#D97706', // Amber-600
    dasharray: '107.4 238.7',
    dashoffset: '0',
  },
  {
    label: 'Sedang Berjalan',
    percentage: 35,
    count: 50,
    color: '#F59E0B', // Amber-500
    dasharray: '83.5 238.7',
    dashoffset: '-107.4',
  },
  {
    label: 'Belum Dimulai',
    percentage: 15,
    count: 21,
    color: '#FDE68A', // Amber-200
    borderColor: '#FCD34D',
    dasharray: '35.8 238.7',
    dashoffset: '-190.9',
  },
  {
    label: 'Terlambat',
    percentage: 5,
    count: 7,
    color: '#DC2626', // Red-600
    dasharray: '12 238.7',
    dashoffset: '-226.7',
  },
];

export const MOCK_BUREAU_WORKLOAD: BureauWorkload[] = [
  {
    code: 'IKK',
    name: 'IKK — Biro Investasi, Kerja Sama & Komunikasi',
    count: 48,
    percentage: 100,
    barColor: 'bg-amber-600',
  },
  {
    code: 'PKKEK',
    name: 'PKKEK — Biro Pengendalian',
    count: 38,
    percentage: 79,
    barColor: 'bg-amber-500',
  },
  {
    code: 'UK',
    name: 'UK — Biro Umum & Keuangan',
    count: 24,
    percentage: 50,
    barColor: 'bg-amber-400',
  },
  {
    code: 'BPPK',
    name: 'BPPK — Biro Perencanaan & Pembentukan',
    count: 19,
    percentage: 40,
    barColor: 'bg-amber-300',
  },
  {
    code: 'HSDMO',
    name: 'HSDMO — Biro Hukum, SDM & Organisasi',
    count: 19,
    percentage: 40,
    barColor: 'bg-amber-300',
  },
];

// Rapat terbaru ditampilkan paling atas:
// 1. IKK-001 (24 Sep 2026) — Biro Investasi, Kerja Sama, dan Komunikasi
// 2. IKK-002 (22 Sep 2026) — Biro Investasi, Kerja Sama, dan Komunikasi
// 3. PKKEK-001 (20 Sep 2026) — Biro Pengendalian Kawasan Ekonomi Khusus
// 4. UK-001 (19 Sep 2026) — Biro Umum dan Keuangan
// 5. HSDMO-001 (18 Sep 2026) — Biro Hukum, Sumber Daya Manusia, dan Organisasi
// 6. BPPK-001 (15 Sep 2026) — Biro Perencanaan dan Pembentukan KEK
export const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'm-ikk-001',
    code: 'IKK-001',
    title: 'Rapat Koordinasi Investasi Kawasan Industri KEK Sei Mangkei & Kendal',
    date: '24 Sep 2026',
    time: '09:00 - 12:30 WIB',
    location: 'Ruang Rapat Utama Gedung Posko KEK & Hybrid Zoom',
    biroCode: 'IKK',
    biroName: 'Biro Investasi, Kerja Sama & Komunikasi (IKK)',
    status: 'APPROVED',
    isNew: true,
    actionItems: {
      total: 6,
      completed: 2,
      inProgress: 4,
      summaryText: '4 Sedang Berjalan',
    },
    attendees: [
      'Dr. Hendra Suprayitno, M.Si (Ketua Rapat)',
      'Perwakilan Badan Pengelola KEK Sei Mangkei',
      'Tim Konsorsium Kawasan Industri Kendal',
      'Kementerian Koordinator Bidang Perekonomian'
    ],
    agendaSummary: 'Penyelarasan fasilitas insentif perpajakan untuk anchor tenant industri semikonduktor dan oleokimia, serta percepatan kesiapan suplai gas industri.',
  },
  {
    id: 'm-ikk-002',
    code: 'IKK-002',
    title: 'Evaluasi Perkembangan Investor Fasilitas Pengolahan Bahan Baku KEK Galang Batang',
    date: '22 Sep 2026',
    time: '14:00 - 16:30 WIB',
    location: 'Kementerian Perindustrian & Delegasi Bintan',
    biroCode: 'IKK',
    biroName: 'Biro Investasi, Kerja Sama & Komunikasi (IKK)',
    status: 'FINAL',
    actionItems: {
      total: 4,
      completed: 4,
      inProgress: 0,
      isCompletePercentage: true,
      summaryText: 'Semua Selesai Dikerjakan',
    },
    attendees: [
      'Biro Investasi, Kerja Sama, dan Komunikasi',
      'Direktorat Perwilayahan Industri Kemenperin',
      'PT Bintan Alumina Indonesia (BAI)',
      'Dinas ESDM Kepulauan Riau'
    ],
    agendaSummary: 'Monitoring realisasi pembangunan smelter alumina fasa 3 dan penyelesaian izin pemanfaatan ruang perairan laut.',
  },
  {
    id: 'm-pkkek-001',
    code: 'PKKEK-001',
    title: 'Evaluasi Pengendalian & Operasional Infrastruktur Pelabuhan KEK Bitung',
    date: '20 Sep 2026',
    time: '10:00 - 13:00 WIB',
    location: 'Ruang Rapat Command Center KEK Bitung',
    biroCode: 'PKKEK',
    biroName: 'Biro Pengendalian KEK (PKKEK)',
    status: 'FINAL',
    actionItems: {
      total: 8,
      completed: 6,
      inProgress: 0,
      overdue: 2,
      summaryText: '6 Selesai, 2 Butuh Eskalasi',
    },
    attendees: [
      'Biro Pengendalian KEK',
      'Pelindo Regional 4',
      'Kantor Syahbandar dan Otoritas Pelabuhan (KSOP) Bitung',
      'Bappeda Provinsi Sulawesi Utara'
    ],
    agendaSummary: 'Optimalisasi throughput terminal peti kemas hub internasional dan penanganan kendala akses jalan arteri bypass Bitung.',
  },
  {
    id: 'm-uk-001',
    code: 'UK-001',
    title: 'Sinkronisasi Tata Kelola Anggaran & Keuangan Sekretariat Jenderal Dewan KEK',
    date: '19 Sep 2026',
    time: '09:00 - 11:30 WIB',
    location: 'Ruang Rapat Komisi Bintan Lantai 3, Gedung Ali Wardhana',
    biroCode: 'UK',
    biroName: 'Biro Umum & Keuangan (UK)',
    status: 'APPROVED',
    actionItems: {
      total: 5,
      completed: 3,
      inProgress: 2,
      summaryText: '3 Selesai, 2 Sedang Berjalan',
    },
    attendees: [
      'Biro Umum dan Keuangan',
      'Bagian Keuangan & BMN',
      'Inspektorat Jenderal Kemenko Perekonomian'
    ],
    agendaSummary: 'Evaluasi penyerapan anggaran Q3 dan penyusunan pagu indikatif program prioritas dewan KEK TA 2027.',
  },
  {
    id: 'm-hsdmo-001',
    code: 'HSDMO-001',
    title: 'Harmonisasi Regulasi Kemudahan Fasilitas Perpajakan, Kepabeanan & Organisasi KEK',
    date: '18 Sep 2026',
    time: '13:30 - 15:45 WIB',
    location: 'Kemenkeu DJP / DJBC & Biro Hukum KEK',
    biroCode: 'HSDMO',
    biroName: 'Biro Hukum, SDM & Organisasi (HSDMO)',
    status: 'REVIEW',
    actionItems: {
      total: 3,
      completed: 1,
      inProgress: 2,
      summaryText: 'Draft Harmonisasi PP',
    },
    attendees: [
      'Biro Hukum, Sumber Daya Manusia, dan Organisasi',
      'Direktorat Peraturan Perpajakan I DJP',
      'Direktorat Fasilitas Kepabeanan DJBC',
      'Biro Hukum Kemenko Perekonomian'
    ],
    agendaSummary: 'Penyelarasan ketentuan tax holiday industri hilirisasi dan integrasi portal kepabeanan Kawasan Ekonomi Khusus.',
  },
  {
    id: 'm-bppk-001',
    code: 'BPPK-001',
    title: 'Perencanaan Usulan Pembentukan KEK Baru & Integrasi Sistem Digital 4.0',
    date: '15 Sep 2026',
    time: '09:30 - 11:30 WIB',
    location: 'Lab Inovasi Digital & Tim Teknis Perencanaan KEK',
    biroCode: 'BPPK',
    biroName: 'Biro Perencanaan & Pembentukan KEK (BPPK)',
    status: 'DRAFT',
    actionItems: {
      total: 2,
      completed: 0,
      inProgress: 2,
      summaryText: 'Menunggu Verifikasi Biro',
    },
    attendees: [
      'Biro Perencanaan dan Pembentukan KEK',
      'Tim Pengusul Kawasan Industri Baru',
      'Tim Arsitektur Solusi Pusdatin'
    ],
    agendaSummary: 'Kajian studi kelayakan pembentukan kawasan ekonomi baru dan integrasi modul pengawasan Single Submission System.',
  },
];
