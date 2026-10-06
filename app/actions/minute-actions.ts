'use server';

import { prisma } from '@/lib/prisma';
import { meetingMinutesSchema, MeetingMinutesInput } from '@/lib/validations/minutes';
import { revalidatePath } from 'next/cache';
import { requirePermission, requireAuth } from '@/lib/auth/authorization';
import {
  getNextMinutesId,
  getNextMinutesHistoryId,
  getNextNotificationId,
} from '@/lib/id-generator';

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
    const currentUser = await requirePermission('create:minutes');
    const isPrivileged =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

    // 1. Zod Validation
    const parsed = meetingMinutesSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: `Validasi gagal: ${errorMsg}` };
    }

    const { meetingId, agenda, discussion, decisions, conclusion, docType, notaDinas, isAutosave } = parsed.data;

    // 2. Validate that the meeting actually exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { primaryBiro: true },
    });

    if (!meeting) {
      return { success: false, error: 'Rapat tidak ditemukan.' };
    }

    // Bureau Scoping: Non-admin users cannot manage minutes for meetings of other bureaus
    if (!isPrivileged && currentUser.biroCode && meeting.primaryBiro.code.toUpperCase() !== currentUser.biroCode.toUpperCase()) {
      return {
        success: false,
        error: 'Anda hanya dapat mengelola notula/nota dinas untuk rapat biro Anda sendiri.',
      };
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

    // 4. Atomically upsert minutes with clean sequential ID
    const nextMinId = await getNextMinutesId();
    const minutes = await prisma.meetingMinutes.upsert({
      where: { meetingId },
      create: {
        id: nextMinId,
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

    // 5. Record audit trail history & create notification (only on meaningful manual saves or non-autosave)
    if (currentUser && !isAutosave) {
      const isNotaDinas = docType === 'NOTA_DINAS';
      const docLabel = isNotaDinas ? 'Nota Dinas' : 'Notulen Rapat';

      // 5a. Audit trail: Find the previous confirmed revision baseline
      try {
        let baseOldValue: any = null;
        if (!isNew) {
          const lastHistory = await prisma.minutesHistory.findFirst({
            where: { meetingId, changeType: { in: ['CREATED', 'UPDATED'] } },
            orderBy: { createdAt: 'desc' },
          });
          baseOldValue = lastHistory?.newValue || {
            docType: (existing?.conclusion as any)?.docType || (isNotaDinas ? 'NOTA_DINAS' : 'NOTULA'),
            agenda: existing?.agenda ?? undefined,
            discussion: existing?.discussion ?? undefined,
            decisions: existing?.decisions ?? undefined,
            conclusion: existing?.conclusion ?? undefined,
          };
        }

        const changedParts: string[] = [];
        if (!isNew && baseOldValue) {
          if (isNotaDinas) {
            const oldNd = baseOldValue.notaDinas || (baseOldValue.conclusion as any)?.notaDinas || {};
            const newNd = notaDinas || {};
            if (oldNd.subject !== newNd.subject) changedParts.push('Perihal');
            if (oldNd.documentNumber !== newNd.documentNumber) changedParts.push('Nomor Naskah');
            if (oldNd.recipient !== newNd.recipient) changedParts.push('Penerima/Yth');
            if (oldNd.sender !== newNd.sender) changedParts.push('Pengirim');
            if (oldNd.attachments !== newNd.attachments) changedParts.push('Lampiran');
            if (oldNd.dateText !== newNd.dateText) changedParts.push('Tanggal Naskah');
            if (JSON.stringify(baseOldValue.discussion) !== JSON.stringify(discussion)) {
              changedParts.push('Substansi Inti Pembahasan');
            }
            if (JSON.stringify(baseOldValue.conclusion) !== JSON.stringify(finalConclusion)) {
              changedParts.push('Kesimpulan Rapat');
            }
            if (JSON.stringify(baseOldValue.decisions) !== JSON.stringify(decisions)) {
              changedParts.push('Arahan & Tindak Lanjut');
            }
          } else {
            if (JSON.stringify(baseOldValue.agenda) !== JSON.stringify(agenda)) {
              changedParts.push('Agenda Sidang');
            }
            if (JSON.stringify(baseOldValue.discussion) !== JSON.stringify(discussion)) {
              changedParts.push('Substansi Inti Pembahasan');
            }
            if (JSON.stringify(baseOldValue.conclusion) !== JSON.stringify(finalConclusion)) {
              changedParts.push('Kesimpulan Rapat');
            }
            if (JSON.stringify(baseOldValue.decisions) !== JSON.stringify(decisions)) {
              changedParts.push('Kesepakatan & Tindak Lanjut');
            }
          }
        }

        // Only create history entry if it's new or has actual changes
        if (isNew || changedParts.length > 0) {
          let changeSummary = `${docLabel} ${isNew ? 'dibuat pertama kali' : 'diperbarui'} oleh ${currentUser.name}`;
          if (changedParts.length > 0) {
            changeSummary += ` (Perubahan: ${changedParts.join(', ')})`;
          }

          const nextHistId = await getNextMinutesHistoryId();
          await prisma.minutesHistory.create({
            data: {
              id: nextHistId,
              meetingId,
              userId: currentUser.id,
              changeType: isNew ? 'CREATED' : 'UPDATED',
              fieldName: isNotaDinas ? 'NOTA_DINAS' : 'NOTULA',
              oldValue: isNew
                ? undefined
                : {
                    docType: baseOldValue.docType || (isNotaDinas ? 'NOTA_DINAS' : 'NOTULA'),
                    agenda: baseOldValue.agenda ?? undefined,
                    discussion: baseOldValue.discussion ?? undefined,
                    decisions: baseOldValue.decisions ?? undefined,
                    conclusion: baseOldValue.conclusion ?? undefined,
                    notaDinas: baseOldValue.notaDinas ?? undefined,
                  },
              newValue: {
                docType: docType || (isNotaDinas ? 'NOTA_DINAS' : 'NOTULA'),
                agenda: agenda ?? undefined,
                discussion: discussion ?? undefined,
                decisions: decisions ?? undefined,
                conclusion: finalConclusion ?? undefined,
                notaDinas: notaDinas ?? undefined,
              },
              summary: changeSummary,
            },
          });

          // 5b. In-App Notification for Dewan / Team members (only on confirmed revisions)
          try {
            const actionText = isNew ? 'Dibuat' : 'Diperbarui';
            const notifTitle = `${docLabel} ${actionText}: ${meeting.meetingNumber}`;
            const notifMessage = `${currentUser.name || 'Pengguna'} telah ${isNew ? 'membuat' : 'memperbarui'} ${docLabel.toLowerCase()} untuk "${meeting.title}".`;

            const nextNotifId = await getNextNotificationId();
            await prisma.notification.create({
              data: {
                id: nextNotifId,
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
      } catch (histErr) {
        console.warn('[upsertMeetingMinutesAction] history recording skipped:', histErr);
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
