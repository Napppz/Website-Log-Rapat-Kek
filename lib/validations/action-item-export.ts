import { z } from 'zod';

/**
 * Zod schema for validating query parameters of GET /api/action-items/export
 * All parameters are optional — omit means "no filter" (fetch all).
 */
export const actionItemExportQuerySchema = z.object({
  /** Filter by Biro code (one of the 5 official KEK Biros). 'ALL' or omit = no filter. */
  biro: z
    .enum(['ALL', 'BPPK', 'PKKEK', 'IKK', 'HSDMO', 'UK'])
    .optional()
    .default('ALL'),

  /** Filter by computed status. 'ALL' or omit = no filter. */
  status: z
    .enum(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'])
    .optional()
    .default('ALL'),

  /** Filter by priority. 'ALL' or omit = no filter. */
  priority: z
    .enum(['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .optional()
    .default('ALL'),

  /**
   * Filter by dueDate >= startDate (ISO 8601 date string, e.g. "2026-09-01").
   * Validates as a coerced Date, accepts "2026-09-01" form.
   */
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate harus berformat YYYY-MM-DD')
    .optional(),

  /**
   * Filter by dueDate <= endDate (ISO 8601 date string, e.g. "2026-09-30").
   */
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate harus berformat YYYY-MM-DD')
    .optional(),

  /**
   * Free-text search against title, description, meetingNumber, picUser.name, picBiro.code.
   * Stripped of leading/trailing whitespace; empty string treated as no search.
   */
  search: z.string().trim().max(200, 'Search query terlalu panjang').optional().default(''),
});

export type ActionItemExportQuery = z.infer<typeof actionItemExportQuerySchema>;
