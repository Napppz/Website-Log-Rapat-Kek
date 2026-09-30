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

