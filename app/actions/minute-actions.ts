'use server';

import { prisma } from '@/lib/prisma';
import { meetingMinutesSchema, MeetingMinutesInput } from '@/lib/validations/minutes';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/authorization';

/**
 * Server Action: Get MeetingMinutes by meetingId
 */
export async function getMeetingMinutesAction(meetingId: string) {
  try {
    if (!meetingId) {
      return { success: false, error: 'ID Rapat tidak valid' };
    }

    const minutes = await prisma.meetingMinutes.findUnique({
      where: { meetingId },
    });

    return { success: true, data: minutes };
  } catch (error: any) {
    console.error('Error fetching meeting minutes:', error);
    return { success: false, error: 'Gagal memuat notulen rapat.' };
  }
}

/**
 * Server Action: Create or Update (Upsert) MeetingMinutes
 * Guarantees zero duplicate MeetingMinutes for the same meetingId.
 */
export async function upsertMeetingMinutesAction(input: MeetingMinutesInput) {
  try {
    // Authorization Check: Must have 'create:minutes' permission (SUPER_ADMIN, ADMIN, NOTULIS)
    await requirePermission('create:minutes');

    // 1. Zod Validation
    const parsed = meetingMinutesSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: `Validasi gagal: ${errorMsg}` };
    }

    const { meetingId, agenda, discussion, decisions, conclusion } = parsed.data;

    // 2. Validate that the meeting actually exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { primaryBiro: true },
    });

    if (!meeting) {
      return { success: false, error: 'Rapat tidak ditemukan.' };
    }

    // 3. Atomically upsert minutes
    const minutes = await prisma.meetingMinutes.upsert({
      where: { meetingId },
      create: {
        meetingId,
        agenda: agenda ?? undefined,
        discussion: discussion ?? undefined,
        decisions: decisions ?? undefined,
        conclusion: conclusion ?? undefined,
      },
      update: {
        agenda: agenda ?? undefined,
        discussion: discussion ?? undefined,
        decisions: decisions ?? undefined,
        conclusion: conclusion ?? undefined,
      },
    });

    // 4. Revalidate routes
    try {
      revalidatePath('/');
      revalidatePath('/semua-rapat');
      revalidatePath(`/semua-rapat/${meetingId}`);
      if (meeting.primaryBiro?.code) {
        revalidatePath(`/biro/${meeting.primaryBiro.code.toLowerCase()}`);
      }
    } catch {
      // Safe fallback when executed outside Next.js request context
    }

    return { success: true, data: minutes };
  } catch (error: any) {
    console.error('Error saving meeting minutes:', error);
    return { success: false, error: 'Notulen gagal disimpan. Silakan coba lagi.' };
  }
}
