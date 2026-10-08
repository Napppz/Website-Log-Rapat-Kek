export type BiroCode = 'BPPK' | 'PKKEK' | 'IKK' | 'HSDMO' | 'UK' | 'PPK' | 'REN' | 'DAL' | 'INV' | 'HUK' | 'BUK' | 'OPS' | 'ADM' | 'IT' | 'LEG';

export interface BiroTeam {
  id: string;
  biroId: string;
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface Biro {
  id?: string;
  code: BiroCode;
  name: string;
  shortName: string;
  description: string;
  teams?: BiroTeam[];
}

export type MeetingStatus = 'APPROVED' | 'FINAL' | 'REVIEW' | 'DRAFT';
export type MeetingProgressStatus =
  | 'Belum Dimulai'
  | 'Dalam Proses'
  | 'Selesai'
  | 'Start'
  | 'On Progres'
  | 'Finish';

export type ActionItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type ActionItemPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ActionItem {
  id: string;
  meetingId: string;
  title: string;
  description?: string | null;
  picBiroId: string;
  picTeamId?: string | null;
  picUserId?: string | null;
  dueDate: Date | string;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  completedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  picBiro?: {
    id: string;
    code: string;
    name: string;
    shortName: string;
  };
  picTeam?: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
  } | null;
  picUser?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  meeting?: {
    id: string;
    meetingNumber: string;
    title: string;
    date?: Date | string;
  };
  computedStatus?: ActionItemStatus;
  isOverdue?: boolean;
  latestProgress?: number;
  latestLogNote?: string | null;
  latestLogCreatedAt?: Date | string | null;
  latestLogUser?: string | null;
  logsCount?: number;
}

export interface ActionItemProgressData {
  total: number;
  completed: number;
  inProgress: number;
  pending?: number;
  overdue?: number;
  summaryText: string;
  isCompletePercentage?: boolean;
}

export type MeetingDocumentCategory =
  | 'UNDANGAN_INTERNAL'
  | 'NASKAH_MASUK'
  | 'DISPOSISI_SEKJEN'
  | 'DISPOSISI_BIRO'
  | 'SURAT_DITUNDA'
  | 'TUNDA_RAPAT';

export type MeetingDocumentSubCategory =
  | 'DISPOSISI_SEKJEN'
  | 'DISPOSISI_BIRO'
  | 'SURAT_EKSTERNAL';

export interface MeetingCategoryOption {
  key: MeetingDocumentCategory;
  label: string;
  badgeLabel: string;
  badgeClass: string;
  badgeIcon: string;
  description: string;
}

export const MEETING_CATEGORY_OPTIONS: MeetingCategoryOption[] = [
  {
    key: 'UNDANGAN_INTERNAL',
    label: 'Undangan Internal',
    badgeLabel: 'Undangan Internal',
    badgeClass: 'bg-[#E8F5F7] text-[#215865] border-[#BCE3EB]',
    badgeIcon: '🏢',
    description: 'Rapat koordinasi antar unit kerja internal Sekretariat Dewan Nasional KEK.',
  },
  {
    key: 'NASKAH_MASUK',
    label: 'Daftar Naskah Masuk',
    badgeLabel: 'Daftar Naskah Masuk',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeIcon: '📥',
    description: 'Rapat koordinasi berdasarkan agenda daftar naskah dinas atau surat masuk via SRIKANDI.',
  },
  {
    key: 'DISPOSISI_SEKJEN',
    label: 'Disposisi Sekjen',
    badgeLabel: 'Disposisi Sekjen',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    badgeIcon: '🏛️',
    description: 'Tindak lanjut arahan atau disposisi resmi dari Sekretaris Jenderal Dewan Nasional KEK.',
  },
  {
    key: 'DISPOSISI_BIRO',
    label: 'Disposisi Biro',
    badgeLabel: 'Disposisi Biro',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeIcon: '📑',
    description: 'Tindak lanjut arahan atau disposisi internal dari Kepala Biro / Pimpinan Unit Kerja.',
  },
  {
    key: 'SURAT_DITUNDA',
    label: 'Tunda Rapat',
    badgeLabel: 'Tunda Rapat',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeIcon: '⏳',
    description: 'Agenda rapat mengalami penundaan jadwal atau penjadwalan ulang.',
  },
];

export interface Meeting {
  id: string;
  code: string;
  title: string;
  date: string;
  time: string;
  location: string;
  biroCode: BiroCode;
  biroName: string;
  primaryTeamId?: string | null;
  primaryTeamCode?: string | null;
  primaryTeamName?: string | null;
  status: MeetingStatus;
  isNew?: boolean;
  involvedBiros?: string;
  actionItems: ActionItemProgressData;
  previousMeetingId?: string | null;
  seriesCount?: number;
  sessionNumber?: number;
  attendees?: string[];
  agendaSummary?: string;
  invitationDocUrl?: string | null;
  invitationDocName?: string | null;
  invitationDocSize?: number | null;
  documentCategory?: MeetingDocumentCategory | string | null;
  documentSubCategory?: MeetingDocumentSubCategory | string | null;
  sourceOrigin?: string | null;
  postponeReason?: string | null;
  meetingKind?: string | null;
  picName?: string | null;
  progressStatus?: string | null;
  categoryDocUrl?: string | null;
  categoryDocName?: string | null;
  categoryDocSize?: number | null;
  materialDocUrl?: string | null;
  materialDocName?: string | null;
  materialDocSize?: number | null;
}

export function getMeetingCategoryInfo(
  category?: string | null,
  subCategory?: string | null
): {
  key: string;
  label: string;
  subLabel?: string | null;
  badgeLabel: string;
  badgeClass: string;
  badgeIcon: string;
  description: string;
} {
  const cat = (category || 'UNDANGAN_INTERNAL').toUpperCase();
  const sub = subCategory ? subCategory.toUpperCase() : null;

  if (cat === 'SURAT_DITUNDA' || cat === 'TUNDA_RAPAT') {
    return {
      key: 'SURAT_DITUNDA',
      label: 'Tunda Rapat',
      subLabel: 'Rapat Ditunda',
      badgeLabel: 'Tunda Rapat',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      badgeIcon: '⏳',
      description: 'Agenda rapat mengalami penundaan jadwal atau penjadwalan ulang.',
    };
  }

  if (cat === 'DISPOSISI_SEKJEN' || (cat === 'NASKAH_MASUK' && sub === 'DISPOSISI_SEKJEN')) {
    return {
      key: 'DISPOSISI_SEKJEN',
      label: 'Disposisi Sekjen',
      subLabel: 'Disposisi Sekjen (SRIKANDI)',
      badgeLabel: 'Disposisi Sekjen',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      badgeIcon: '🏛️',
      description: 'Tindak lanjut arahan atau disposisi resmi dari Sekretaris Jenderal Dewan Nasional KEK.',
    };
  }

  if (cat === 'DISPOSISI_BIRO' || (cat === 'NASKAH_MASUK' && sub === 'DISPOSISI_BIRO')) {
    return {
      key: 'DISPOSISI_BIRO',
      label: 'Disposisi Biro',
      subLabel: 'Disposisi Internal Biro',
      badgeLabel: 'Disposisi Biro',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      badgeIcon: '📑',
      description: 'Tindak lanjut arahan atau disposisi internal dari Kepala Biro / Pimpinan Unit Kerja.',
    };
  }

  if (cat === 'NASKAH_MASUK' || cat === 'DAFTAR_NASKAH_MASUK') {
    return {
      key: 'NASKAH_MASUK',
      label: 'Daftar Naskah Masuk',
      subLabel: sub === 'SURAT_EKSTERNAL' ? 'Surat Masuk Eksternal' : null,
      badgeLabel: 'Daftar Naskah Masuk',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeIcon: '📥',
      description: 'Rapat koordinasi berdasarkan agenda daftar naskah dinas atau surat masuk via SRIKANDI.',
    };
  }

  return {
    key: 'UNDANGAN_INTERNAL',
    label: 'Undangan Internal',
    subLabel: null,
    badgeLabel: 'Undangan Internal',
    badgeClass: 'bg-[#E8F5F7] text-[#215865] border-[#BCE3EB]',
    badgeIcon: '🏢',
    description: 'Rapat koordinasi antar unit kerja internal Sekretariat Dewan Nasional KEK.',
  };
}

export interface AgendaSessionItem {
  id: string;
  code: string;
  title: string;
  sessionNumber: number;
  sessionLabel: string;
  isCurrent: boolean;
  isFirst: boolean;
  isLatest: boolean;
  date: string;
  rawDate: string;
  time: string;
  location: string;
  status: MeetingStatus;
  biroCode: BiroCode;
  biroName: string;
  primaryTeamName?: string | null;
  chairpersonName?: string | null;
  secretaryName?: string | null;
  previousMeetingId?: string | null;
  actionItems: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
    summaryText: string;
  };
  minutesSummary?: string | null;
  conclusionSnippet?: string | null;
  hasMinutes: boolean;
}

export interface AgendaSeriesResult {
  agendaTitle: string;
  totalSessions: number;
  currentMeetingId: string;
  primaryBiroCode: BiroCode;
  primaryBiroName: string;
  sessions: AgendaSessionItem[];
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: string | number;
  unit: string;
  changeValue?: string;
  changeLabel?: string;
  badgeText?: string;
  badgeSubtext?: string;
  variant: 'default' | 'danger' | 'success';
  iconName: 'event_note' | 'calendar_month' | 'pending_actions' | 'warning' | 'task_alt';
}

export interface MonthlyActivity {
  month: string;
  count: number;
  isPeak?: boolean;
  highlightColor?: string;
}

export interface FollowUpStatusMetric {
  label: string;
  percentage: number;
  count: number;
  color: string;
  borderColor?: string;
  dasharray: string;
  dashoffset: string;
}

export interface BureauWorkload {
  code: BiroCode;
  name: string;
  count: number;
  percentage: number;
  barColor: string;
}

export type MeetingDocumentType = 'NOTULA' | 'NOTA_DINAS';

export interface NotaDinasData {
  recipient?: string;      // Yth. (e.g. Plt. Kepala Biro Investasi, Kerja Sama, dan Komunikasi)
  sender?: string;         // Dari (e.g. Kepala Bagian Program dan Tata Kelola)
  subject?: string;        // Hal (e.g. Laporan Kegiatan Forum Analisis...)
  dateText?: string;       // Tanggal (e.g. 27 Agustus 2026)
  attachments?: string;    // Lampiran (e.g. 1 (satu) berkas / -)
  introText?: string;      // Kalimat Pengantar / Pembuka
  biroName?: string;       // Nama Biro pada Kop Surat
  signerRole?: string;     // Jabatan Penandatangan
  signerName?: string;     // Nama Lengkap Penandatangan
  signatureImage?: string | null;
  documentNumber?: string; // NOMOR: ND-...
}

export interface TeamWorkloadMetric {
  id: string;
  code: string; // 'INV' | 'KS' | 'KOM'
  name: string; // 'Investasi' | 'Kerja Sama' | 'Komunikasi'
  fullName: string; // 'Tim Investasi'
  description?: string | null;
  meetingCount: number;
  meetingPercentage: number;
  // Status Tiap Pekerjaan
  totalJobs: number;
  completedJobs: number;
  inProgressJobs: number;
  pendingJobs: number;
  overdueJobs: number;
  completionRate: number;
  // Detail anggota
  memberCount: number;
  members?: Array<{ id: string; name: string; email: string; role: string }>;
  // Detail pekerjaan
  actionItems?: Array<{
    id: string;
    title: string;
    status: string;
    dueDate?: string | null;
    priority?: string | null;
    picName?: string | null;
    progress?: number;
    meetingNumber?: string | null;
    meetingTitle?: string | null;
  }>;
  // Detail rapat
  meetings?: Array<{
    id: string;
    meetingNumber: string;
    title: string;
    date: string;
    status: MeetingStatus;
    progressStatus?: string | null;
  }>;
}

export const IKK_TEAMS = [
  {
    id: 'TIM-001',
    code: 'INV',
    name: 'Investasi',
    fullName: 'Tim Investasi',
    description: 'Fasilitasi, promosi, dan akselerasi realisasi investasi strategis Kawasan Ekonomi Khusus.',
    iconName: 'Briefcase',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    colorHex: '#31889C',
  },
  {
    id: 'TIM-003',
    code: 'KS',
    name: 'Kerja Sama',
    fullName: 'Tim Kerja Sama',
    description: 'Penguatan kemitraan strategis, koordinasi lintas kementerian/lembaga, dan kerja sama badan usaha.',
    iconName: 'Network',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    colorHex: '#2E7D32',
  },
  {
    id: 'TIM-002',
    code: 'KOM',
    name: 'Komunikasi',
    fullName: 'Tim Komunikasi',
    description: 'Publikasi komunikasi publik, hubungan media, dokumentasi, dan diseminasi kebijakan Dewan Nasional KEK.',
    iconName: 'Radio',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    colorHex: '#D97706',
  },
] as const;

