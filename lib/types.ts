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
