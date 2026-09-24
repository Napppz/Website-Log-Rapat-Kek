import { z } from 'zod';

export const reportPeriodEnum = z.enum(['WEEK', 'MONTH', 'QUARTER', 'CUSTOM']);
export type ReportPeriod = z.infer<typeof reportPeriodEnum>;

export const reportBiroEnum = z.enum([
  'ALL',
  'BPPK',
  'PKKEK',
  'IKK',
  'HSDMO',
  'UK',
]);
export type ReportBiro = z.infer<typeof reportBiroEnum>;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(val: string): boolean {
  if (!DATE_REGEX.test(val)) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
}

export const reportQuerySchema = z
  .object({
    period: reportPeriodEnum.default('MONTH'),
    biro: reportBiroEnum.default('ALL'),
    startDate: z.string().trim().optional(),
    endDate: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.period === 'CUSTOM') {
      if (!data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startDate'],
          message: 'Tanggal mulai wajib diisi untuk periode kustom',
        });
      } else if (!isValidIsoDate(data.startDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startDate'],
          message: 'Format tanggal mulai tidak valid (gunakan YYYY-MM-DD)',
        });
      }

      if (!data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'Tanggal akhir wajib diisi untuk periode kustom',
        });
      } else if (!isValidIsoDate(data.endDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'Format tanggal akhir tidak valid (gunakan YYYY-MM-DD)',
        });
      }

      if (
        data.startDate &&
        data.endDate &&
        isValidIsoDate(data.startDate) &&
        isValidIsoDate(data.endDate)
      ) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);

        if (start > end) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['startDate'],
            message: 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir',
          });
        }

        const diffMs = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 366) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endDate'],
            message: 'Rentang periode kustom maksimal adalah 366 hari',
          });
        }
      }
    } else {
      // If dates provided for presets, optionally validate if present
      if (data.startDate && !isValidIsoDate(data.startDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startDate'],
          message: 'Format tanggal mulai tidak valid (gunakan YYYY-MM-DD)',
        });
      }
      if (data.endDate && !isValidIsoDate(data.endDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'Format tanggal akhir tidak valid (gunakan YYYY-MM-DD)',
        });
      }
    }
  });

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;

export const OFFICIAL_REPORT_BIROS = [
  {
    code: 'BPPK',
    name: 'Biro Perencanaan dan Pembentukan Kawasan Ekonomi Khusus',
    shortName: 'Biro Perencanaan & Pembentukan',
  },
  {
    code: 'PKKEK',
    name: 'Biro Pengendalian Kawasan Ekonomi Khusus',
    shortName: 'Biro Pengendalian',
  },
  {
    code: 'IKK',
    name: 'Biro Investasi, Kerja Sama, dan Komunikasi',
    shortName: 'Biro Investasi & Komunikasi',
  },
  {
    code: 'HSDMO',
    name: 'Biro Hukum, Sumber Daya Manusia, dan Organisasi',
    shortName: 'Biro Hukum & SDM',
  },
  {
    code: 'UK',
    name: 'Biro Umum dan Keuangan',
    shortName: 'Biro Umum & Keuangan',
  },
] as const;

export type OfficialBiroCode = (typeof OFFICIAL_REPORT_BIROS)[number]['code'];
