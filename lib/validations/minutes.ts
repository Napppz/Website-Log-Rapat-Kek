import { z } from 'zod';

export const meetingMinutesSchema = z.object({
  meetingId: z.string().min(1, 'ID Rapat wajib disertakan'),
  agenda: z.any().optional().nullable(),
  discussion: z.any().optional().nullable(),
  decisions: z.any().optional().nullable(),
  conclusion: z.any().optional().nullable(),
});

export type MeetingMinutesInput = z.infer<typeof meetingMinutesSchema>;
