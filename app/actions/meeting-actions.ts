'use server';

import { prisma } from '@/lib/prisma';
import { getNextMeetingNumber } from '@/lib/sequence';
import { MeetingStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/authorization';

export interface CreateMeetingInput {
  title: string;
  biroCode: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  involvedBiroCodes?: string[];
}

function safeRevalidate(paths: string[]) {
  try {
    for (const p of paths) {
      revalidatePath(p);
    }
  } catch {
    // Suppress Next.js static store missing errors when run in scripts
  }
}

/**
 * Server action to create a new meeting in Neon PostgreSQL
 * with concurrency-safe, transactionally incremented meeting numbers.
 */
export async function createMeetingAction(input: CreateMeetingInput) {
  try {
    // Authorization Check: Must have 'create:meeting' permission (SUPER_ADMIN, ADMIN, NOTULIS)
    await requirePermission('create:meeting');

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

    safeRevalidate([
      '/',
      '/semua-rapat',
      `/biro/${input.biroCode.toLowerCase()}`,
    ]);

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
    // Authorization Check: Must have 'edit:meeting' permission (SUPER_ADMIN, ADMIN)
    await requirePermission('edit:meeting');

    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: { status },
      include: { primaryBiro: true },
    });

    safeRevalidate([
      '/',
      '/semua-rapat',
      updated.primaryBiro?.code ? `/biro/${updated.primaryBiro.code.toLowerCase()}` : '',
    ].filter(Boolean));

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
    // Authorization Check: Must have 'delete:meeting' permission (SUPER_ADMIN, ADMIN)
    await requirePermission('delete:meeting');

    const deleted = await prisma.meeting.delete({
      where: { id: meetingId },
      include: { primaryBiro: true },
    });

    safeRevalidate([
      '/',
      '/semua-rapat',
      deleted.primaryBiro?.code ? `/biro/${deleted.primaryBiro.code.toLowerCase()}` : '',
    ].filter(Boolean));

    return { success: true, data: deleted };
  } catch (error: any) {
    console.error('Error deleting meeting:', error);
    return { success: false, error: error?.message || 'Gagal menghapus rapat' };
  }
}

