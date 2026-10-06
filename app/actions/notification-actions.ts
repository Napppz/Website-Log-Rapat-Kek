'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/authorization';
import { revalidatePath } from 'next/cache';
import { getNextNotificationId } from '@/lib/id-generator';

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
            const nextNotifId = await getNextNotificationId();
            await prisma.notification.create({
              data: {
                id: nextNotifId,
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
            const nextNotifId = await getNextNotificationId();
            await prisma.notification.create({
              data: {
                id: nextNotifId,
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

    // 3. Clean up any obsolete global broadcast meeting notifications so uninvited users never see them
    try {
      await prisma.notification.deleteMany({
        where: {
          userId: null,
          OR: [
            { type: 'meeting' },
            { title: { startsWith: 'Agenda Rapat Baru Terjadwal:' } },
          ],
        },
      });
    } catch {}

    // 4. Ensure invited participants of recent meetings have received their personal notification
    try {
      const recentMeetings = await prisma.meeting.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          participants: {
            select: { userId: true },
          },
        },
      });

      for (const m of recentMeetings) {
        const link = `/semua-rapat/${m.id}`;
        for (const p of m.participants) {
          if (!p.userId) continue;
          const existing = await prisma.notification.findFirst({
            where: {
              userId: p.userId,
              link,
            },
          });

          if (!existing) {
            const nextNotifId = await getNextNotificationId();
            await prisma.notification.create({
              data: {
                id: nextNotifId,
                userId: p.userId,
                title: `Undangan Rapat: [${m.meetingNumber}] ${m.title}`,
                message: `Anda diundang untuk menghadiri rapat "${m.title}" (${m.startTime} - ${m.endTime} WIB) di ${m.location}.`,
                type: 'meeting',
                link,
                isRead: false,
                createdAt: m.createdAt,
              },
            });
          }
        }
      }
    } catch (e) {
      console.warn('[syncSystemAlertsSilently] Participant sync error:', e);
    }
  } catch (globalErr) {
    console.warn('[syncSystemAlertsSilently] Background sync skipped:', globalErr);
  }
}

/**
 * Fetch notifications from database with automatic resilient background sync.
 * Meeting invitations are strictly scoped to only the invited user.
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
      // Unauthenticated or session expired
    }

    // 3. Query user & system-wide notifications
    // Only fetch personal notifications (userId == currentUser.id)
    // or system-wide alerts that are NOT meeting invitations
    const notifications = await prisma.notification.findMany({
      where: currentUser?.id
        ? {
            OR: [
              { userId: currentUser.id },
              {
                userId: null,
                type: { notIn: ['meeting', 'meeting_invite'] },
                title: { not: { startsWith: 'Agenda Rapat Baru Terjadwal:' } },
              },
            ],
          }
        : {
            userId: null,
            type: { notIn: ['meeting', 'meeting_invite'] },
            title: { not: { startsWith: 'Agenda Rapat Baru Terjadwal:' } },
          },
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
              OR: [
                { userId: currentUser.id },
                {
                  userId: null,
                  type: { notIn: ['meeting', 'meeting_invite'] },
                  title: { not: { startsWith: 'Agenda Rapat Baru Terjadwal:' } },
                },
              ],
            }
          : { userId: null }),
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
              OR: [
                { userId: currentUser.id },
                {
                  userId: null,
                  type: { notIn: ['meeting', 'meeting_invite'] },
                  title: { not: { startsWith: 'Agenda Rapat Baru Terjadwal:' } },
                },
              ],
            }
          : { userId: null }),
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

/**
 * Fast helper to query total unread notification count
 */
export async function getUnreadNotificationCountAction() {
  try {
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch {}

    const count = await prisma.notification.count({
      where: {
        isRead: false,
        ...(currentUser?.id
          ? {
              OR: [
                { userId: currentUser.id },
                {
                  userId: null,
                  type: { notIn: ['meeting', 'meeting_invite'] },
                  title: { not: { startsWith: 'Agenda Rapat Baru Terjadwal:' } },
                },
              ],
            }
          : {
              userId: null,
              type: { notIn: ['meeting', 'meeting_invite'] },
              title: { not: { startsWith: 'Agenda Rapat Baru Terjadwal:' } },
            }),
      },
    });

    return { success: true, count };
  } catch (error: any) {
    console.error('Error counting unread notifications:', error);
    return { success: false, count: 0 };
  }
}


