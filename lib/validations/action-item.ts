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
  T extends { status: string; dueDate: Date | string }
>(item: T): T & { computedStatus: string; isOverdue: boolean } {
  const isOverdue =
    item.status !== 'COMPLETED' && new Date(item.dueDate).getTime() < Date.now();
  const computedStatus = isOverdue ? 'OVERDUE' : item.status;
  return {
    ...item,
    computedStatus,
    isOverdue,
  };
}
