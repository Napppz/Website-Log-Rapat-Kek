'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/authorization';
import { revalidatePath } from 'next/cache';

/**
 * Background helper to safely sync automated system notifications.
 * Isolated in try/catch so any failure never aborts user notification retrieval.
 */
async function syncSystemAlertsSilently() {
  try {
    const now = new Date();

    // 1. Overdue Action Items (due date passed and not completed)
    try {
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
        try {
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
            });
          }
        } catch {
          // Ignore individual record sync errors
        }
      }
    } catch (e) {
      console.warn('[syncSystemAlertsSilently] Overdue sync error:', e);
    }

    // 2. Action Items approaching due date (within 3 days)
    try {
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
        try {
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
            });
          }
        } catch {
          // Ignore individual record sync errors
        }
      }
    } catch (e) {
      console.warn('[syncSystemAlertsSilently] Upcoming sync error:', e);
    }

    // 3. Latest recent meetings
    try {
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
        try {
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
            });
          }
        } catch {
          // Ignore individual record sync errors
        }
      }
    } catch (e) {
      console.warn('[syncSystemAlertsSilently] Recent meetings sync error:', e);
    }
  } catch (globalErr) {
    console.warn('[syncSystemAlertsSilently] Background sync skipped:', globalErr);
  }
}

/**
 * Fetch notifications from database with automatic resilient background sync
 */
export async function getNotificationsAction() {
  try {
    // 1. Run safe background sync (will not crash if DB busy/failing)
    await syncSystemAlertsSilently();

    // 2. Identify current user if authenticated
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch {
      // Unauthenticated or session expired, continue with global notifications
    }

    // 3. Query user & system-wide notifications
    const notifications = await prisma.notification.findMany({
      where: currentUser?.id
        ? {
            OR: [{ userId: currentUser.id }, { userId: null }],
          }
        : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
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
      error: error?.message || 'Gagal memuat daftar notifikasi sistem.',
    };
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsReadAction(id: string) {
  try {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'ID notifikasi tidak valid.' };
    }

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
    return {
      success: false,
      error: error?.message || 'Gagal memperbarui status notifikasi.',
    };
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsReadAction() {
  try {
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch {}

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
    return {
      success: false,
      error: error?.message || 'Gagal menandai semua notifikasi sebagai dibaca.',
    };
  }
}

/**
 * Delete a single notification
 */
export async function deleteNotificationAction(id: string) {
  try {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'ID notifikasi tidak valid.' };
    }

    await prisma.notification.delete({
      where: { id },
    });

    try {
      revalidatePath('/notifikasi');
    } catch {}

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return {
      success: false,
      error: error?.message || 'Gagal menghapus notifikasi.',
    };
  }
}

/**
 * Clear all read notifications
 */
export async function clearAllReadNotificationsAction() {
  try {
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch {}

    await prisma.notification.deleteMany({
      where: {
        isRead: true,
        ...(currentUser?.id
          ? {
              OR: [{ userId: currentUser.id }, { userId: null }],
            }
          : {}),
      },
    });

    try {
      revalidatePath('/notifikasi');
    } catch {}

    return { success: true };
  } catch (error: any) {
    console.error('Error clearing read notifications:', error);
    return {
      success: false,
      error: error?.message || 'Gagal membersihkan notifikasi yang sudah dibaca.',
    };
  }
}

