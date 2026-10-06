'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/authorization';
import { getNextCommentId, getNextNotificationId } from '@/lib/id-generator';

function safeRevalidate(meetingId: string) {
  try {
    revalidatePath(`/semua-rapat/${meetingId}`);
    revalidatePath('/semua-rapat');
  } catch {}
}

export async function addCommentAction(
  meetingId: string,
  content: string,
  section?: string,
  parentId?: string
) {
  try {
    const user = await requireAuth();
    if (!content?.trim()) {
      return { success: false, error: 'Isi komentar tidak boleh kosong.' };
    }
    const nextCommentId = await getNextCommentId();
    const comment = await prisma.minutesComment.create({
      data: {
        id: nextCommentId,
        meetingId,
        userId: user.id,
        content: content.trim(),
        section: section || null,
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        replies: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    // Safely create in-app notification for meeting participants
    try {
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        select: { meetingNumber: true, title: true, secretaryId: true, chairpersonId: true },
      });
      if (meeting) {
        const preview = content.trim().length > 60 ? `${content.trim().slice(0, 60)}...` : content.trim();
        const targetUserId =
          meeting.secretaryId && meeting.secretaryId !== user.id
            ? meeting.secretaryId
            : meeting.chairpersonId && meeting.chairpersonId !== user.id
            ? meeting.chairpersonId
            : null;

        const nextNotifId = await getNextNotificationId();
        await prisma.notification.create({
          data: {
            id: nextNotifId,
            title: `Komentar Baru: ${meeting.meetingNumber}`,
            message: `${user.name || 'Pengguna'} memberikan catatan: "${preview}"`,
            type: 'info',
            link: `/semua-rapat/${meetingId}?tab=komentar`,
            isRead: false,
            userId: targetUserId,
          },
        });
      }
    } catch (notifErr) {
      console.warn('[addCommentAction] notification creation skipped:', notifErr);
    }

    safeRevalidate(meetingId);
    return { success: true, comment };
  } catch (err: any) {
    console.error('[addCommentAction]', err);
    return { success: false, error: err?.message || 'Gagal menambahkan komentar.' };
  }
}

export async function toggleResolveCommentAction(commentId: string, meetingId: string) {
  try {
    const user = await requireAuth();
    const existing = await prisma.minutesComment.findUnique({ where: { id: commentId } });
    if (!existing) return { success: false, error: 'Komentar tidak ditemukan.' };
    const updated = await prisma.minutesComment.update({
      where: { id: commentId },
      data: {
        isResolved: !existing.isResolved,
        resolvedBy: !existing.isResolved ? user.id : null,
        resolvedAt: !existing.isResolved ? new Date() : null,
      },
    });
    safeRevalidate(meetingId);
    return { success: true, comment: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mengubah status komentar.' };
  }
}

export async function deleteCommentAction(commentId: string, meetingId: string) {
  try {
    const user = await requireAuth();
    const existing = await prisma.minutesComment.findUnique({ where: { id: commentId } });
    if (!existing) return { success: false, error: 'Komentar tidak ditemukan.' };
    const isOwner = existing.userId === user.id;
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menghapus komentar ini.' };
    }
    await prisma.minutesComment.delete({ where: { id: commentId } });
    safeRevalidate(meetingId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menghapus komentar.' };
  }
}

export async function getCommentsAction(meetingId: string) {
  try {
    const comments = await prisma.minutesComment.findMany({
      where: { meetingId, parentId: null },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        replies: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, comments };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memuat komentar.' };
  }
}
