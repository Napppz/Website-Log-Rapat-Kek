import { z } from 'zod';

export const meetingMinutesSchema = z.object({
  meetingId: z.string().min(1, 'ID Rapat wajib disertakan'),
  agenda: z.any().optional().nullable(),
  discussion: z.any().optional().nullable(),
  decisions: z.any().optional().nullable(),
  conclusion: z.any().optional().nullable(),
  docType: z.enum(['NOTULA', 'NOTA_DINAS']).optional(),
  notaDinas: z.any().optional(),
  isAutosave: z.boolean().optional(),
});

export type MeetingMinutesInput = z.infer<typeof meetingMinutesSchema>;
