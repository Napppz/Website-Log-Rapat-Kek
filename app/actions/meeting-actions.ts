'use server';

import { prisma } from '@/lib/prisma';
import { getNextMeetingNumber } from '@/lib/sequence';
import { MeetingStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export interface CreateMeetingInput {
  title: string;
  biroCode: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  involvedBiroCodes?: string[];
}

/**
 * Server action to create a new meeting in Neon PostgreSQL
 * with concurrency-safe, transactionally incremented meeting numbers.
 */
export async function createMeetingAction(input: CreateMeetingInput) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate sequence atomically
      const seq = await getNextMeetingNumber(input.biroCode, tx);

      // 2. Find primary biro
      const primaryBiro = await tx.biro.findUnique({
        where: { code: input.biroCode.toUpperCase() },
      });

      if (!primaryBiro) {
        throw new Error(`Biro ${input.biroCode} tidak ditemukan.`);
      }

      // 3. Create meeting record
      const meeting = await tx.meeting.create({
        data: {
          meetingNumber: seq.meetingNumber,
          title: input.title,
          primaryBiroId: primaryBiro.id,
          date: new Date(input.date),
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location,
          status: MeetingStatus.DRAFT,
        },
      });

      // 4. Attach involved bureaus (MeetingBiro)
      if (input.involvedBiroCodes && input.involvedBiroCodes.length > 0) {
        for (const invCode of input.involvedBiroCodes) {
          const invBiro = await tx.biro.findUnique({
            where: { code: invCode.toUpperCase() },
          });
          if (invBiro && invBiro.id !== primaryBiro.id) {
            await tx.meetingBiro.create({
              data: {
                meetingId: meeting.id,
                biroId: invBiro.id,
              },
            });
          }
        }
      }

      return {
        meetingNumber: seq.meetingNumber,
        id: meeting.id,
        title: meeting.title,
      };
    });

    revalidatePath('/');
    revalidatePath('/semua-rapat');
    revalidatePath(`/biro/${input.biroCode.toLowerCase()}`);

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return { success: false, error: error?.message || 'Gagal membuat rapat' };
  }
}
