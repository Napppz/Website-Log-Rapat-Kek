'use server';

import { prisma } from '@/lib/prisma';
import { meetingMinutesSchema, MeetingMinutesInput } from '@/lib/validations/minutes';
import { revalidatePath } from 'next/cache';
import { requirePermission, requireAuth } from '@/lib/auth/authorization';

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

    const { meetingId, agenda, discussion, decisions, conclusion, docType, notaDinas } = parsed.data;

    // 2. Validate that the meeting actually exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { primaryBiro: true },
    });

    if (!meeting) {
      return { success: false, error: 'Rapat tidak ditemukan.' };
    }

    // Merge docType and notaDinas into conclusion JSON payload if provided
    let finalConclusion = conclusion;
    if (docType || notaDinas) {
      const baseObj = typeof finalConclusion === 'object' && finalConclusion !== null ? finalConclusion : {};
      finalConclusion = {
        ...baseObj,
        ...(docType ? { docType } : {}),
        ...(notaDinas ? { notaDinas } : {}),
      };
    }

    // 3. Check if minutes already exist (to determine CREATED vs UPDATED)
    const existing = await prisma.meetingMinutes.findUnique({ where: { meetingId } });
    const isNew = !existing;

    // 4. Atomically upsert minutes
    const minutes = await prisma.meetingMinutes.upsert({
      where: { meetingId },
      create: {
        meetingId,
        agenda: agenda ?? undefined,
        discussion: discussion ?? undefined,
        decisions: decisions ?? undefined,
        conclusion: finalConclusion ?? undefined,
      },
      update: {
        agenda: agenda ?? undefined,
        discussion: discussion ?? undefined,
        decisions: decisions ?? undefined,
        conclusion: finalConclusion ?? undefined,
      },
    });

    // 5. Record audit trail history & create notification
    let currentUser: any = null;
    try {
      currentUser = await requireAuth();
    } catch {
      // Safe fallback if called in automated contexts
    }

    if (currentUser) {
      const isNotaDinas = docType === 'NOTA_DINAS';
      const docLabel = isNotaDinas ? 'Nota Dinas' : 'Notulen Rapat';

      // 5a. Audit trail
      try {
        await prisma.minutesHistory.create({
          data: {
            meetingId,
            userId: currentUser.id,
            changeType: isNew ? 'CREATED' : 'UPDATED',
            fieldName: null,
            oldValue: isNew
              ? undefined
              : {
                  agenda: existing?.agenda ?? undefined,
                  discussion: existing?.discussion ?? undefined,
                  decisions: decisions ?? undefined,
                },
            newValue: {
              agenda: agenda ?? undefined,
              discussion: discussion ?? undefined,
              decisions: decisions ?? undefined,
            },
            summary: isNew
              ? `${docLabel} dibuat pertama kali oleh ${currentUser.name}`
              : `${docLabel} diperbarui oleh ${currentUser.name}`,
          },
        });
      } catch (histErr) {
        console.warn('[upsertMeetingMinutesAction] history recording skipped:', histErr);
      }

      // 5b. In-App Notification for Dewan / Team members
      try {
        const actionText = isNew ? 'Dibuat' : 'Diperbarui';
        const notifTitle = `${docLabel} ${actionText}: ${meeting.meetingNumber}`;
        const notifMessage = `${currentUser.name || 'Pengguna'} telah ${isNew ? 'membuat' : 'memperbarui'} ${docLabel.toLowerCase()} untuk "${meeting.title}".`;

        await prisma.notification.create({
          data: {
            title: notifTitle,
            message: notifMessage,
            type: 'info',
            link: `/semua-rapat/${meetingId}`,
            isRead: false,
            userId: null, // Broadcast to Dewan KEK team
          },
        });
      } catch (notifErr) {
        console.warn('[upsertMeetingMinutesAction] notification creation skipped:', notifErr);
      }
    }

    // 6. Revalidate routes
    try {
      revalidatePath('/');
      revalidatePath('/notifikasi');
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
