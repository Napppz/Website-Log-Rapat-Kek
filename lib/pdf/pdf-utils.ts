import { parseRichText } from './tiptap-parser';

export interface MeetingPdfData {
  id: string;
  meetingNumber: string;
  title: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
  primaryBiro: {
    code: string;
    name: string;
    shortName: string;
  };
  chairperson?: {
    name: string;
    biro?: {
      code: string;
      shortName: string;
    } | null;
  } | null;
  secretary?: {
    name: string;
    biro?: {
      code: string;
      shortName: string;
    } | null;
  } | null;
  meetingBiros?: Array<{
    biro: {
      code: string;
      name: string;
      shortName: string;
    };
  }>;
  participants?: Array<{
    id: string;
    attendanceStatus: string;
    user: {
      name: string;
      email?: string | null;
      biro?: {
        code: string;
        shortName: string;
      } | null;
    };
  }>;
  minutes?: {
    agenda?: any;
    discussion?: any;
    decisions?: any;
    conclusion?: any;
  } | null;
  actionItems?: Array<{
    id: string;
    title: string;
    description?: string | null;
    dueDate: Date | string;
    status: string;
    priority: string;
    completedAt?: Date | string | null;
    picBiro?: {
      code: string;
      shortName: string;
    } | null;
    picUser?: {
      name: string;
    } | null;
  }>;
}

export const DEFAULT_DISCUSSION_FALLBACK = '-';

export const DEFAULT_CONCLUSION_FALLBACK = '-';

export const DEFAULT_ACTION_ITEM_FALLBACK = '-';

/**
 * Format tanggal Indonesia dengan koma (Contoh: "Jumat, 5 September 2026")
 */
export function formatIndonesianDate(d: Date | string | undefined | null): string {
  if (!d) return '-';
  try {
    const obj = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(obj.getTime())) return String(d);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    const dayName = days[obj.getDay()];
    const dateNum = obj.getDate();
    const monthName = months[obj.getMonth()];
    const year = obj.getFullYear();
    return `${dayName}, ${dateNum} ${monthName} ${year}`;
  } catch {
    return String(d);
  }
}

/**
 * Format rentang waktu rapat (Contoh: "08.00 WIB - selesai" atau "13.00 – 15.00 WIB")
 */
export function normalizeTime(start?: string | null, end?: string | null): string {
  const s = (start || '').replace(/WIB/gi, '').replace(':', '.').trim();
  const e = (end || '').replace(/WIB/gi, '').replace(':', '.').trim();
  if (!s && !e) return '-';
  if (s && (!e || e.toLowerCase() === 'selesai' || e === '-')) return `${s} WIB - selesai`;
  if (s && !e) return `${s} WIB`;
  return `${s} – ${e} WIB`;
}

/**
 * Ekstraksi teks polos dari Rich Text blok Tiptap
 */
export function extractPlainText(input: any): string {
  if (!input) return '';
  const blocks = parseRichText(input);
  return blocks
    .map((b) => b.segments.map((s) => s.text).join(''))
    .filter(Boolean)
    .join('\n');
}

/**
 * Resolusi nama ketua/pimpinan, pencatat, jabatan notulis secara konsisten
 */
export function resolveMeetingSignerInfo(meeting?: any, minutes?: any) {
  const customChairpersonName =
    (minutes?.conclusion as any)?.chairpersonName ||
    (minutes?.decisions as any)?.chairpersonName ||
    (minutes?.discussion as any)?.chairpersonName ||
    (minutes?.agenda as any)?.chairpersonName ||
    meeting?.chairperson?.name ||
    '';

  const chairpersonName =
    customChairpersonName.trim() ||
    meeting?.chairperson?.name ||
    '-';

  const customSignerName =
    (minutes?.conclusion as any)?.signerName ||
    (minutes?.decisions as any)?.signerName ||
    (minutes?.discussion as any)?.signerName ||
    (minutes?.agenda as any)?.signerName ||
    meeting?.secretary?.name ||
    '';

  const customSignerRole =
    (minutes?.conclusion as any)?.signerRole ||
    (minutes?.decisions as any)?.signerRole ||
    (minutes?.discussion as any)?.signerRole ||
    (minutes?.agenda as any)?.signerRole ||
    '';

  const finalSignerName =
    customSignerName.trim() ||
    meeting?.secretary?.name ||
    '-';

  const finalSignerRole =
    customSignerRole.trim() ||
    'Notulis';

  const roleClean = finalSignerRole.replace(/[\r\n]+/g, ' ').replace(/,\s*$/, '').trim();
  const secretaryMetaText = finalSignerName === '-' ? '-' : `${roleClean}, ${finalSignerName}`;

  const signatureImage: string | null =
    (minutes?.conclusion as any)?.signatureImage ||
    (minutes?.decisions as any)?.signatureImage ||
    (minutes?.discussion as any)?.signatureImage ||
    (minutes?.agenda as any)?.signatureImage ||
    null;

  return {
    chairpersonName,
    finalSignerName,
    finalSignerRole,
    roleClean,
    secretaryMetaText,
    signatureImage,
  };
}

/**
 * Resolusi data naskah dinas Nota Dinas sesuai format resmi Dewan Nasional KEK RI
 */
export function resolveNotaDinasData(meeting?: any, minutes?: any) {
  const notaObj =
    minutes?.conclusion?.notaDinas ||
    minutes?.decisions?.notaDinas ||
    minutes?.notaDinas ||
    {};

  const customDocNumber =
    notaObj.documentNumber !== undefined
      ? notaObj.documentNumber
      : (minutes?.conclusion as any)?.documentNumber !== undefined
      ? (minutes?.conclusion as any)?.documentNumber
      : (minutes?.decisions as any)?.documentNumber;

  let documentNumber = '${nomor_naskah}';
  if (customDocNumber !== undefined && customDocNumber !== null) {
    const trimmed = String(customDocNumber).trim();
    documentNumber = trimmed !== '' ? trimmed : '${nomor_naskah}';
  } else if (meeting?.meetingNumber) {
    documentNumber = meeting.meetingNumber;
  }

  const defaultBiro = meeting?.primaryBiro?.name
    ? meeting.primaryBiro.name.toUpperCase()
    : 'BIRO INVESTASI, KERJA SAMA, DAN KOMUNIKASI';
  const biroName = (notaObj.biroName || defaultBiro).trim();

  const recipient = (
    notaObj.recipient ||
    `Plt. Kepala ${meeting?.primaryBiro?.name || 'Biro Investasi, Kerja Sama, dan Komunikasi'}`
  ).trim();

  const defaultSender =
    meeting?.chairperson?.name
      ? `Ketua Sidang (${meeting.chairperson.name})`
      : 'Kepala Bagian Program dan Tata Kelola';
  const sender = (notaObj.sender || defaultSender).trim();

  const subject = (
    notaObj.subject ||
    (meeting?.title ? `Laporan Kegiatan ${meeting.title}` : 'Laporan Kegiatan Rapat')
  ).trim();

  const rawDate = meeting?.date ? new Date(meeting.date) : null;
  let defaultDateText = '';
  if (rawDate && !isNaN(rawDate.getTime())) {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    defaultDateText = `${rawDate.getDate()} ${months[rawDate.getMonth()]} ${rawDate.getFullYear()}`;
  } else {
    defaultDateText = '27 Agustus 2026';
  }
  const dateText = (notaObj.dateText || defaultDateText).trim();

  const attachments = (notaObj.attachments || '1 (satu) berkas').trim();

  const defaultIntro = `Menindaklanjuti pelaksanaan rapat ${meeting?.title || ''} yang diselenggarakan pada ${formatIndonesianDate(meeting?.date)}${meeting?.location ? ` bertempat di ${meeting.location}` : ''}, bersama ini kami sampaikan laporan pokok-pokok pembahasan sebagai berikut:`;
  const introText = (notaObj.introText || defaultIntro).trim();

  const signerRole = (notaObj.signerRole || sender || 'Kepala Bagian Program dan Tata Kelola').trim();

  const defaultSignerName =
    meeting?.chairperson?.name ||
    meeting?.secretary?.name ||
    '-';
  const signerName = (notaObj.signerName || defaultSignerName).trim();

  const signatureImage =
    notaObj.signatureImage ||
    (minutes?.conclusion as any)?.signatureImage ||
    (minutes?.decisions as any)?.signatureImage ||
    null;

  return {
    recipient,
    sender,
    subject,
    dateText,
    attachments,
    introText,
    biroName,
    signerRole,
    signerName,
    signatureImage,
    documentNumber,
  };
}
