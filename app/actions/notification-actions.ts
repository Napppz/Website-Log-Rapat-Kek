'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/authorization';
import { revalidatePath } from 'next/cache';

/**
 * Sync and fetch real notifications from the database
 */
export async function getNotificationsAction() {
  try {
    const currentUser = await getCurrentUser();
    const now = new Date();

    // 1. Check Overdue Action Items and generate notifications if not already present
    const overdueItems = await prisma.actionItem.findMany({
      where: {
        status: { not: 'COMPLETED' },
        dueDate: { lt: now },
      },
      include: {
        picBiro: true,
      },
      take: 10,
    });

    for (const item of overdueItems) {
      const link = `/tindak-lanjut?search=${encodeURIComponent(item.title)}`;
      const existing = await prisma.notification.findFirst({
        where: { link, type: 'danger' },
      });

      if (!existing) {
        const biroCode = item.picBiro?.code || 'Biro';
        await prisma.notification.create({
          data: {
            title: `Peringatan: Tindak Lanjut ${biroCode} Terlambat`,
            message: `Komitmen "${item.title}" telah melewati tenggat waktu. Diperlukan percepatan atau eskalasi ke Dewan KEK.`,
            type: 'danger',
            link,
            isRead: false,
          },
        }).catch(() => {});
      }
    }

    // 2. Check Action Items due in next 3 days
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const upcomingItems = await prisma.actionItem.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { gte: now, lte: threeDaysFromNow },
      },
      include: {
        picBiro: true,
      },
      take: 5,
    });

    for (const item of upcomingItems) {
      const link = `/tindak-lanjut?search=${encodeURIComponent(item.title)}`;
      const existing = await prisma.notification.findFirst({
        where: { link, type: 'warning' },
      });

      if (!existing) {
        const biroCode = item.picBiro?.code || 'Biro';
        await prisma.notification.create({
          data: {
            title: `Tindak Lanjut Mendekati Batas Waktu (${biroCode})`,
            message: `Komitmen "${item.title}" akan jatuh tempo dalam kurang dari 3 hari.`,
            type: 'warning',
            link,
            isRead: false,
          },
        }).catch(() => {});
      }
    }

    // 3. Fetch latest meetings to ensure recent meetings are notified
    const recentMeetings = await prisma.meeting.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        meetingNumber: true,
        title: true,
        createdAt: true,
        status: true,
      },
    });

    for (const m of recentMeetings) {
      const link = `/semua-rapat/${m.id}`;
      const existing = await prisma.notification.findFirst({
        where: { link },
      });

      if (!existing) {
        const isApproved = m.status === 'APPROVED' || m.status === 'FINAL';
        await prisma.notification.create({
          data: {
            title: isApproved
              ? `Risalah Rapat ${m.meetingNumber} Telah Disahkan`
              : `Agenda Rapat Baru Terjadwal: ${m.meetingNumber}`,
            message: `Dokumen log rapat "${m.title}" telah tersedia dalam sistem dewan.`,
            type: isApproved ? 'success' : 'info',
            link,
            isRead: false,
            createdAt: m.createdAt,
          },
        }).catch(() => {});
      }
    }

    // 4. Query all notifications
    const notifications = await prisma.notification.findMany({
      where: currentUser?.id
        ? {
            OR: [{ userId: currentUser.id }, { userId: null }],
          }
        : {},
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    };
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return {
      success: false,
      error: 'Gagal memuat daftar notifikasi sistem.',
    };
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsReadAction(id: string) {
  try {
    if (!id) return { success: false, error: 'ID tidak valid' };

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    try {
      revalidatePath('/notifikasi');
    } catch {}

    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Gagal memperbarui status notifikasi.' };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsReadAction() {
  try {
    const currentUser = await getCurrentUser();

    await prisma.notification.updateMany({
      where: {
        isRead: false,
        ...(currentUser?.id
          ? {
              OR: [{ userId: currentUser.id }, { userId: null }],
            }
          : {}),
      },
      data: { isRead: true },
    });

    try {
      revalidatePath('/notifikasi');
    } catch {}

    return { success: true };
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: 'Gagal menandai semua dibaca.' };
  }
}
