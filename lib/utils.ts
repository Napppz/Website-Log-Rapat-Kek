import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MONTH_NAMES_INDONESIA = [
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

export const MONTH_SHORT_INDONESIA = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * Parses any month query parameter (e.g. 'Sep', 'September', '9', '2026-09', '09')
 * into a 0-indexed month number (0 for Jan, 8 for Sep, etc.).
 */
export function parseMonthFilterIndex(monthFilter?: string | null): number | null {
  if (!monthFilter) return null;
  const cleaned = monthFilter.trim().toLowerCase();

  // If number like '1' to '12'
  const num = parseInt(cleaned, 10);
  if (!isNaN(num) && num >= 1 && num <= 12 && !cleaned.includes('-')) {
    return num - 1;
  }

  // If formatted like '2026-09' or '2026-9'
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    const mPart = parseInt(parts[1] || parts[0], 10);
    if (!isNaN(mPart) && mPart >= 1 && mPart <= 12) {
      return mPart - 1;
    }
  }

  // Check short Indonesian names ('jan', 'feb', ..., 'agu', 'sep', 'okt')
  const shortIdx = MONTH_SHORT_INDONESIA.map((s) => s.toLowerCase()).indexOf(cleaned);
  if (shortIdx !== -1) return shortIdx;

  // Check full Indonesian names
  const fullIdx = MONTH_NAMES_INDONESIA.map((s) => s.toLowerCase()).findIndex(
    (name) => name.startsWith(cleaned) || cleaned.startsWith(name)
  );
  if (fullIdx !== -1) return fullIdx;

  // Check English short names (e.g. 'aug', 'oct', 'dec')
  const enShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const enIdx = enShort.indexOf(cleaned);
  if (enIdx !== -1) return enIdx;

  return null;
}

export function getMonthDisplayName(monthIdx: number, year: number = 2026): string {
  if (monthIdx < 0 || monthIdx > 11) return `Bulan ${monthIdx + 1} ${year}`;
  return `${MONTH_NAMES_INDONESIA[monthIdx]} ${year}`;
}

export const DAY_NAMES_INDONESIA = [
  'Minggu', // 0
  'Senin',  // 1
  'Selasa', // 2
  'Rabu',   // 3
  'Kamis',  // 4
  'Jumat',  // 5
  'Sabtu',  // 6
];

export const DAY_OPTIONS = [
  { value: '1', label: 'Senin', index: 1 },
  { value: '2', label: 'Selasa', index: 2 },
  { value: '3', label: 'Rabu', index: 3 },
  { value: '4', label: 'Kamis', index: 4 },
  { value: '5', label: 'Jumat', index: 5 },
  { value: '6', label: 'Sabtu', index: 6 },
  { value: '0', label: 'Minggu', index: 0 },
];

export interface ParsedMeetingDate {
  year: number;
  month: number; // 0-11
  day: number; // 1-31
  dayOfWeek: number; // 0-6
  isoDate: string; // YYYY-MM-DD
  dayName: string; // 'Senin', 'Selasa', etc.
}

/**
 * Parses any meeting date string into structured components:
 * Supports ISO ("2026-10-06"), Indonesian strings ("24 Sep 2026", "24 September 2026"),
 * and fallback Date parsings.
 */
export function parseMeetingDate(dateStr?: string | null): ParsedMeetingDate | null {
  if (!dateStr) return null;
  const raw = dateStr.trim();
  if (!raw) return null;

  // 1. Try ISO YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay();
    const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      year,
      month,
      day,
      dayOfWeek,
      isoDate,
      dayName: DAY_NAMES_INDONESIA[dayOfWeek] || '',
    };
  }

  // 2. Try Indonesian / English formatted strings: "24 Sep 2026", "6 Oktober 2026"
  const textMatch = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthStr = textMatch[2].toLowerCase();
    const year = parseInt(textMatch[3], 10);

    const monthIdx = parseMonthFilterIndex(monthStr) ?? 0;
    const d = new Date(year, monthIdx, day);
    const dayOfWeek = d.getDay();
    const isoDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      year,
      month: monthIdx,
      day,
      dayOfWeek,
      isoDate,
      dayName: DAY_NAMES_INDONESIA[dayOfWeek] || '',
    };
  }

  // 3. Fallback standard Date parse
  const fallback = new Date(raw);
  if (!isNaN(fallback.getTime())) {
    const year = fallback.getFullYear();
    const month = fallback.getMonth();
    const day = fallback.getDate();
    const dayOfWeek = fallback.getDay();
    const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      year,
      month,
      day,
      dayOfWeek,
      isoDate,
      dayName: DAY_NAMES_INDONESIA[dayOfWeek] || '',
    };
  }

  return null;
}

/**
 * Parses day query parameter ("senin", "1", "selasa", "2", "minggu", "0")
 * into a 0-6 index (0 = Minggu, 1 = Senin, ...).
 */
export function parseDayFilterIndex(dayFilter?: string | null): number | null {
  if (!dayFilter) return null;
  const cleaned = dayFilter.trim().toLowerCase();

  const num = parseInt(cleaned, 10);
  if (!isNaN(num) && num >= 0 && num <= 6) {
    return num;
  }

  const idx = DAY_NAMES_INDONESIA.map((d) => d.toLowerCase()).indexOf(cleaned);
  if (idx !== -1) return idx;

  // English aliases
  const enDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const enIdx = enDays.indexOf(cleaned);
  if (enIdx !== -1) return enIdx;

  return null;
}

