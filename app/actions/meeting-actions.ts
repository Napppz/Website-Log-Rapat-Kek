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

/**
 * Server action to update meeting status (DRAFT, REVIEW, APPROVED, FINAL)
 */
export async function updateMeetingStatusAction(meetingId: string, status: MeetingStatus) {
  try {
    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: { status },
      include: { primaryBiro: true },
    });

    revalidatePath('/');
    revalidatePath('/semua-rapat');
    if (updated.primaryBiro?.code) {
      revalidatePath(`/biro/${updated.primaryBiro.code.toLowerCase()}`);
    }

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error updating meeting status:', error);
    return { success: false, error: error?.message || 'Gagal memperbarui status rapat' };
  }
}

/**
 * Server action to delete meeting from Neon database
 */
export async function deleteMeetingAction(meetingId: string) {
  try {
    const deleted = await prisma.meeting.delete({
      where: { id: meetingId },
      include: { primaryBiro: true },
    });

    revalidatePath('/');
    revalidatePath('/semua-rapat');
    if (deleted.primaryBiro?.code) {
      revalidatePath(`/biro/${deleted.primaryBiro.code.toLowerCase()}`);
    }

    return { success: true, data: deleted };
  } catch (error: any) {
    console.error('Error deleting meeting:', error);
    return { success: false, error: error?.message || 'Gagal menghapus rapat' };
  }
}

