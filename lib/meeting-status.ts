import { MeetingStatus } from './types';

export interface MeetingStatusDetail {
  key: MeetingStatus;
  step: number;
  label: string;          // e.g. "Draf", "Reviu", "Disetujui", "Final"
  sublabel: string;       // e.g. "Penyusunan", "Penelaahan", "Validasi Pimpinan", "Disahkan & Terbit"
  fullTitle: string;      // e.g. "Tahap 1: Draf (Penyusunan)"
  badgeLabel: string;     // e.g. "Draf", "Reviu", "Disetujui", "Final"
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
    nextStepNote: 'Kirim ke tahap "Reviu" jika draf awal sudah selesai disusun dan siap ditelaah bersama tim.',
  },
  REVIEW: {
    key: 'REVIEW',
    step: 2,
    label: 'Reviu',
    sublabel: 'Penelaahan',
    fullTitle: 'Tahap 2: Reviu (Penelaahan)',
    badgeLabel: 'Reviu',
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
