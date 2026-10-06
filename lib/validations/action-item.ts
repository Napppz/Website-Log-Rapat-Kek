import { z } from 'zod';

export const actionItemStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'OVERDUE',
]);

export const actionItemPriorityEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
]);

export const actionItemSchema = z.object({
  meetingId: z.string().min(1, 'Rapat wajib dipilih'),
  title: z
    .string()
    .trim()
    .min(1, 'Judul tindak lanjut tidak boleh kosong')
    .max(255, 'Judul tindak lanjut maksimal 255 karakter'),
  description: z.string().trim().optional().nullable(),
  picBiroId: z.string().min(1, 'Biro penanggung jawab wajib dipilih'),
  picTeamId: z.string().trim().optional().nullable(),
  picUserId: z.string().trim().optional().nullable(),
  dueDate: z.coerce.date({
    message: 'Deadline/tenggat waktu harus berupa tanggal yang valid',
  }),
  priority: actionItemPriorityEnum.default('MEDIUM'),
  status: actionItemStatusEnum.default('PENDING'),
});

export const updateActionItemSchema = actionItemSchema.extend({
  id: z.string().min(1, 'ID tindak lanjut wajib disertakan'),
});

export const updateActionItemStatusSchema = z.object({
  id: z.string().min(1, 'ID tindak lanjut wajib disertakan'),
  status: actionItemStatusEnum,
});

export type ActionItemInput = z.infer<typeof actionItemSchema>;
export type UpdateActionItemInput = z.infer<typeof updateActionItemSchema>;
export type UpdateActionItemStatusInput = z.infer<typeof updateActionItemStatusSchema>;

/**
 * Computes display status based on dueDate and current time.
 * If status is not COMPLETED and dueDate < now, the effective status is OVERDUE.
 */
export function computeActionItemStatus<
  T extends { status: string; dueDate: Date | string; logs?: any[]; _count?: any }
>(item: T): T & {
  computedStatus: string;
  isOverdue: boolean;
  latestProgress: number;
  latestLogNote?: string | null;
  latestLogCreatedAt?: Date | string | null;
  latestLogUser?: string | null;
  logsCount: number;
} {
  const isOverdue =
    item.status !== 'COMPLETED' && new Date(item.dueDate).getTime() < Date.now();
  const computedStatus = isOverdue ? 'OVERDUE' : item.status;
  const latestLog = Array.isArray(item.logs) && item.logs.length > 0 ? item.logs[0] : null;
  const latestProgress =
    latestLog?.progress !== undefined && latestLog?.progress !== null
      ? Number(latestLog.progress)
      : item.status === 'COMPLETED'
      ? 100
      : item.status === 'IN_PROGRESS'
      ? 50
      : 0;

  return {
    ...item,
    computedStatus,
    isOverdue,
    latestProgress,
    latestLogNote: latestLog?.notes ?? null,
    latestLogCreatedAt: latestLog?.createdAt ?? null,
    latestLogUser: latestLog?.user?.name ?? null,
    logsCount: item._count?.logs ?? (Array.isArray(item.logs) ? item.logs.length : 0),
  };
}

export const addActionItemLogSchema = z.object({
  actionItemId: z.string().min(1, 'ID tindak lanjut wajib disertakan'),
  notes: z.string().trim().min(1, 'Catatan progres tidak boleh kosong'),
  progress: z.number().int().min(0).max(100).optional().default(0),
  newStatus: actionItemStatusEnum.optional(),
});

export type AddActionItemLogInput = z.infer<typeof addActionItemLogSchema>;

