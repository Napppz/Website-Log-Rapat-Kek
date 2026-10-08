import { MeetingStatus } from './types';

export interface MeetingStatusDetail {
  key: MeetingStatus;
  step: number;
  label: string;          // e.g. "Draf", "Review", "Disetujui", "Final"
  sublabel: string;       // e.g. "Penyusunan", "Penelaahan", "Validasi Pimpinan", "Disahkan & Terbit"
  fullTitle: string;      // e.g. "Tahap 1: Draf (Penyusunan)"
  badgeLabel: string;     // e.g. "Draf", "Review", "Disetujui", "Final"
  variant: 'draft' | 'review' | 'approved' | 'final';
  tagline: string;        // Penjelasan singkat 1 baris
  description: string;    // Penjelasan detail
  colorClass: {
    bg: string;
    border: string;
    text: string;
    dot: string;
    activeStep: string;
    badgeStyle: string;
  };
  whenToUse: string;      // Kapan status ini digunakan
  nextStepNote: string;   // Tindakan selanjutnya
}

export const MEETING_STATUS_DETAILS: Record<MeetingStatus, MeetingStatusDetail> = {
  DRAFT: {
    key: 'DRAFT',
    step: 1,
    label: 'Draf',
    sublabel: 'Penyusunan',
    fullTitle: 'Tahap 1: Draf (Penyusunan)',
    badgeLabel: 'Draf',
    variant: 'draft',
    tagline: 'Notula sedang disusun awal oleh notulis',
    description: 'Naskah risalah awal masih dalam proses penulisan dan perumusan oleh notulis rapat. Belum diedarkan ke biro lain.',
    colorClass: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
      dot: 'bg-slate-400',
      activeStep: 'bg-slate-700 text-white',
      badgeStyle: 'bg-slate-100 border-slate-200 text-slate-700',
    },
    whenToUse: 'Digunakan saat rapat baru dijadwalkan atau risalah notula baru saja mulai ditulis.',
    nextStepNote: 'Kirim ke tahap "Review" jika draf awal sudah selesai disusun dan siap ditelaah bersama tim.',
  },
  REVIEW: {
    key: 'REVIEW',
    step: 2,
    label: 'Review',
    sublabel: 'Penelaahan',
    fullTitle: 'Tahap 2: Review (Penelaahan)',
    badgeLabel: 'Review',
    variant: 'review',
    tagline: 'Pemeriksaan & masukan substansi oleh biro/tim perumus',
    description: 'Draf risalah diedarkan kepada tim perumus, peserta rapat, atau staf biro terkait untuk diperiksa keakuratan substansi dan diselaraskan.',
    colorClass: {
      bg: 'bg-[#FFF8CC]',
      border: 'border-[#FFEE99]',
      text: 'text-[#854D0E]',
      dot: 'bg-[#CA8A04]',
      activeStep: 'bg-[#CA8A04] text-white',
      badgeStyle: 'bg-[#FEF9C3] border-[#FDE047] text-[#854D0E]',
    },
    whenToUse: 'Digunakan saat draf notula sedang diedarkan untuk pemeriksaan, koreksi, dan sinkronisasi data.',
    nextStepNote: 'Ajukan ke Pimpinan Sidang untuk "Disetujui" setelah perbaikan dan koreksi substansi disepakati.',
  },
  APPROVED: {
    key: 'APPROVED',
    step: 3,
    label: 'Disetujui',
    sublabel: 'Validasi Pimpinan',
    fullTitle: 'Tahap 3: Disetujui (Validasi Pimpinan)',
    badgeLabel: 'Disetujui',
    variant: 'approved',
    tagline: 'Materi risalah telah disetujui pimpinan sidang',
    description: 'Substansi risalah rapat dan butir kesepakatan telah diperiksa dan divalidasi oleh Pimpinan Sidang / Sekretaris KEK, menunggu pengesahan dan penerbitan formal.',
    colorClass: {
      bg: 'bg-[#E0F2FE]',
      border: 'border-[#BAE6FD]',
      text: 'text-[#0369A1]',
      dot: 'bg-[#0284C7]',
      activeStep: 'bg-[#0284C7] text-white',
      badgeStyle: 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0369A1]',
    },
    whenToUse: 'Digunakan saat substansi sudah disetujui Pimpinan Sidang, tetapi dokumen final belum ditandatangani/diterbitkan resmi.',
    nextStepNote: 'Ubah ke "Final" setelah naskah risalah resmi ditandatangani dan siap didistribusikan.',
  },
  FINAL: {
    key: 'FINAL',
    step: 4,
    label: 'Final',
    sublabel: 'Disahkan & Terbit',
    fullTitle: 'Tahap 4: Final (Disahkan & Terbit)',
    badgeLabel: 'Final (Sah)',
    variant: 'final',
    tagline: 'Risalah resmi berkekuatan tetap & mengikat',
    description: 'Naskah risalah resmi telah disahkan, berkekuatan hukum tetap, siap didistribusikan kepada kementerian/lembaga, dan seluruh butir tindak lanjutnya wajib dieksekusi.',
    colorClass: {
      bg: 'bg-[#DCFCE7]',
      border: 'border-[#86EFAC]',
      text: 'text-[#15803D]',
      dot: 'bg-[#16A34A]',
      activeStep: 'bg-[#16A34A] text-white',
      badgeStyle: 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]',
    },
    whenToUse: 'Digunakan saat risalah sudah selesai 100%, disahkan secara resmi, dan menjadi arsip negara berkekuatan tetap.',
    nextStepNote: 'Pantau pelaksanaan butir kesepakatan sidang di menu Matriks Tindak Lanjut.',
  },
};

export const MEETING_STATUS_ORDER: MeetingStatus[] = ['DRAFT', 'REVIEW', 'APPROVED', 'FINAL'];

export function getMeetingStatusDetail(status: MeetingStatus): MeetingStatusDetail {
  return MEETING_STATUS_DETAILS[status] || MEETING_STATUS_DETAILS.DRAFT;
}

export type MeetingProgressStatus =
  | 'Belum Dimulai'
  | 'Dalam Proses'
  | 'Selesai'
  | 'Start'
  | 'On Progres'
  | 'Finish';

export interface ProgressStatusDetail {
  key: MeetingProgressStatus;
  label: string;
  step: number;
  subtitle: string;
  badgeLabel: string;
  tagline: string;
  description: string;
  colorClass: {
    bg: string;
    border: string;
    text: string;
    dot: string;
    badgeStyle: string;
  };
}

const DETAIL_BELUM_DIMULAI: ProgressStatusDetail = {
  key: 'Belum Dimulai',
  label: 'Belum Dimulai',
  step: 1,
  subtitle: 'Persiapan / Terjadwal',
  badgeLabel: 'Belum Dimulai',
  tagline: 'Rapat baru diagendakan & persiapan risalah',
  description: 'Rapat telah dijadwalkan dan dokumen/agenda sedang dalam persiapan awal.',
  colorClass: {
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    text: 'text-sky-800',
    dot: 'bg-sky-500',
    badgeStyle: 'bg-sky-50 border-sky-300 text-sky-800 ring-1 ring-sky-400/20',
  },
};

const DETAIL_DALAM_PROSES: ProgressStatusDetail = {
  key: 'Dalam Proses',
  label: 'Dalam Proses',
  step: 2,
  subtitle: 'Sedang Berlangsung / Telaah',
  badgeLabel: 'Dalam Proses',
  tagline: 'Rapat berlangsung & notula dalam telaah',
  description: 'Rapat sedang dilaksanakan atau draf notula sedang ditelaah & dibahas lintas tim.',
  colorClass: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    badgeStyle: 'bg-amber-50 border-amber-300 text-amber-800 ring-1 ring-amber-400/20',
  },
};

const DETAIL_SELESAI: ProgressStatusDetail = {
  key: 'Selesai',
  label: 'Selesai',
  step: 3,
  subtitle: 'Selesai & Disahkan',
  badgeLabel: 'Selesai',
  tagline: 'Rapat selesai & risalah resmi sah',
  description: 'Rapat telah selesai dilaksanakan, risalah disahkan pimpinan resmi dan mengikat.',
  colorClass: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    badgeStyle: 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-400/20',
  },
};

export const PROGRESS_STATUS_DETAILS: Record<MeetingProgressStatus, ProgressStatusDetail> = {
  'Belum Dimulai': DETAIL_BELUM_DIMULAI,
  'Dalam Proses': DETAIL_DALAM_PROSES,
  'Selesai': DETAIL_SELESAI,
  Start: { ...DETAIL_BELUM_DIMULAI, key: 'Start' },
  'On Progres': { ...DETAIL_DALAM_PROSES, key: 'On Progres' },
  Finish: { ...DETAIL_SELESAI, key: 'Finish' },
};

export const PROGRESS_STATUS_ORDER: MeetingProgressStatus[] = ['Belum Dimulai', 'Dalam Proses', 'Selesai'];

export function normalizeProgressStatus(raw?: string | null): MeetingProgressStatus {
  if (!raw) return 'Belum Dimulai';
  const clean = raw.trim().toLowerCase();
  if (clean === 'finish' || clean === 'selesai' || clean === 'final' || clean === 'approved') {
    return 'Selesai';
  }
  if (
    clean === 'dalam proses' ||
    clean === 'on progres' ||
    clean === 'on progress' ||
    clean === 'review' ||
    clean === 'berjalan' ||
    clean === 'sedang berlangsung' ||
    clean === 'sedang berjalan'
  ) {
    return 'Dalam Proses';
  }
  if (clean === 'start' || clean === 'draft' || clean === 'belum dimulai' || clean === 'belum mulai') {
    return 'Belum Dimulai';
  }
  return 'Belum Dimulai';
}

export function mapStatusToProgress(status?: MeetingStatus | string | null): MeetingProgressStatus {
  if (!status) return 'Belum Dimulai';
  const upper = status.toUpperCase();
  if (upper === 'FINAL' || upper === 'APPROVED') return 'Selesai';
  if (upper === 'REVIEW') return 'Dalam Proses';
  if (upper === 'DRAFT') return 'Belum Dimulai';
  return normalizeProgressStatus(status);
}

export function mapProgressToStatus(prog: MeetingProgressStatus | string): MeetingStatus {
  const norm = normalizeProgressStatus(prog);
  if (norm === 'Selesai' || norm === 'Finish') return 'FINAL';
  if (norm === 'Dalam Proses' || norm === 'On Progres') return 'REVIEW';
  return 'DRAFT';
}

export function getProgressStatusDetail(prog?: string | null): ProgressStatusDetail {
  const key = normalizeProgressStatus(prog);
  return PROGRESS_STATUS_DETAILS[key] || DETAIL_BELUM_DIMULAI;
}
