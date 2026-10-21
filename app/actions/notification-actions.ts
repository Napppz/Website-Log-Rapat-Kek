'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/authorization';
import { revalidatePath } from 'next/cache';
import { getNextNotificationId } from '@/lib/id-generator';

export interface NotificationItem {
  id: string;
  userId?: string | null;
  teamId?: string | null;
  teamCode?: string | null;
  teamName?: string | null;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

export interface TeamInfo {
  id: string;
  code: string;
  name: string;
}

/**
 * Universal helper to create a system notification accurately scoped per team.
 */
export async function createNotificationRecord(
  data: {
    id?: string;
    userId?: string | null;
    teamId?: string | null;
    title: string;
    message: string;
    type?: string;
    link?: string | null;
    isRead?: boolean;
    createdAt?: Date;
  },
  tx?: any
) {
  const db = tx || prisma;
  const notifId = data.id || (await getNextNotificationId(tx));
  let effectiveTeamId = data.teamId || null;

  // Auto-resolve teamId if not explicitly provided
  if (!effectiveTeamId) {
    if (data.link?.includes('/semua-rapat/')) {
      const match = data.link.match(/\/semua-rapat\/([^?#/]+)/);
      if (match && match[1]) {
        try {
          const m = await db.meeting.findUnique({
            where: { id: match[1] },
            select: { primaryTeamId: true },
          });
          if (m?.primaryTeamId) effectiveTeamId = m.primaryTeamId;
        } catch {}
      }
    }

    if (!effectiveTeamId && data.userId) {
      try {
        const u = await db.user.findUnique({
          where: { id: data.userId },
          select: { teamId: true },
        });
        if (u?.teamId) effectiveTeamId = u.teamId;
      } catch {}
    }
  }

  // Execute insert using SQL to guarantee id_tim column is populated cleanly
  await db.$executeRawUnsafe(
    `INSERT INTO notifikasi (id_notifikasi, id_pengguna, id_tim, judul, pesan, tipe, tautan, sudah_dibaca, dibuat_pada)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()))`,
    notifId,
    data.userId || null,
    effectiveTeamId,
    data.title,
    data.message,
    data.type || 'info',
    data.link || null,
    data.isRead || false,
    data.createdAt || null
  );

  return notifId;
}

/**
 * Background helper to safely sync automated system notifications scoped per team.
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
          picTeam: true,
          meeting: {
            select: { primaryTeamId: true },
          },
        },
        take: 10,
      });

      for (const item of overdueItems) {
        try {
          const link = `/tindak-lanjut?search=${encodeURIComponent(item.title)}`;
          const existing: any[] = await prisma.$queryRawUnsafe(
            `SELECT id_notifikasi FROM notifikasi WHERE tautan = $1 AND tipe = 'danger' LIMIT 1`,
            link
          );

          if (!existing || existing.length === 0) {
            const biroCode = item.picBiro?.code || 'Biro';
            const teamId = item.picTeamId || item.meeting?.primaryTeamId || null;
            await createNotificationRecord({
              title: `Peringatan: Tindak Lanjut ${biroCode} Terlambat`,
              message: `Komitmen "${item.title}" telah melewati tenggat waktu. Diperlukan percepatan atau eskalasi ke Dewan KEK.`,
              type: 'danger',
              link,
              userId: item.picUserId || null,
              teamId,
              isRead: false,
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
          picTeam: true,
          meeting: {
            select: { primaryTeamId: true },
          },
        },
        take: 5,
      });

      for (const item of upcomingItems) {
        try {
          const link = `/tindak-lanjut?search=${encodeURIComponent(item.title)}`;
          const existing: any[] = await prisma.$queryRawUnsafe(
            `SELECT id_notifikasi FROM notifikasi WHERE tautan = $1 AND tipe = 'warning' LIMIT 1`,
            link
          );

          if (!existing || existing.length === 0) {
            const biroCode = item.picBiro?.code || 'Biro';
            const teamId = item.picTeamId || item.meeting?.primaryTeamId || null;
            await createNotificationRecord({
              title: `Tindak Lanjut Mendekati Batas Waktu (${biroCode})`,
              message: `Komitmen "${item.title}" akan jatuh tempo dalam kurang dari 3 hari.`,
              type: 'warning',
              link,
              userId: item.picUserId || null,
              teamId,
              isRead: false,
            });
          }
        } catch {
          // Ignore individual record sync errors
        }
      }
    } catch (e) {
      console.warn('[syncSystemAlertsSilently] Upcoming sync error:', e);
    }

    // 3. Clean up obsolete global broadcast meeting notifications without team assignment
    try {
      await prisma.$executeRawUnsafe(`
        DELETE FROM notifikasi
        WHERE id_tim IS NULL AND id_pengguna IS NULL
          AND (tipe = 'meeting' OR judul LIKE 'Agenda Rapat Baru Terjadwal:%')
      `);
    } catch {}

    // 4. Ensure invited participants of recent meetings have received their team-scoped notification
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
          const existing: any[] = await prisma.$queryRawUnsafe(
            `SELECT id_notifikasi FROM notifikasi WHERE id_pengguna = $1 AND tautan = $2 LIMIT 1`,
            p.userId,
            link
          );

          if (!existing || existing.length === 0) {
            await createNotificationRecord({
              userId: p.userId,
              teamId: m.primaryTeamId,
              title: `Undangan Rapat: [${m.meetingNumber}] ${m.title}`,
              message: `Anda diundang untuk menghadiri rapat "${m.title}" (${m.startTime} - ${m.endTime} WIB) di ${m.location}.`,
              type: 'meeting',
              link,
              isRead: false,
              createdAt: m.createdAt,
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
 * Fetch notifications scoped STRICTLY per team.
 * - Regular staff / pimpinan: only see notifications corresponding to their own team(s).
 * - Super Admin / Admin: can view all or switch/filter by specific team.
 */
export async function getNotificationsAction(filterTeamId?: string) {
  try {
    await syncSystemAlertsSilently();

    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch {
      // Unauthenticated
    }

    if (!currentUser?.id) {
      return {
        success: true,
        data: {
          notifications: [],
          unreadCount: 0,
          currentTeam: null,
          availableTeams: [],
          isSuperAdmin: false,
        },
      };
    }

    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
    const isAdmin = currentUser.role === 'ADMIN';

    // Retrieve active teams for team selector
    const allTeams: TeamInfo[] = await prisma.$queryRawUnsafe(`
      SELECT id_tim AS "id", kode_tim AS "code", nama_tim AS "name"
      FROM tim_biro
      WHERE status_aktif = true
      ORDER BY kode_tim ASC
    `);

    // Collect all assigned team IDs for current user
    const userTeamIds: string[] = [];
    if (currentUser.teamId) userTeamIds.push(currentUser.teamId);
    if (currentUser.assignedTeams && Array.isArray(currentUser.assignedTeams)) {
      for (const t of currentUser.assignedTeams) {
        if (t.id && !userTeamIds.includes(t.id)) {
          userTeamIds.push(t.id);
        }
      }
    }

    let notifications: NotificationItem[] = [];
    const effectiveFilterTeamId = filterTeamId && filterTeamId !== 'ALL' ? filterTeamId : null;

    if (isSuperAdmin || isAdmin) {
      if (effectiveFilterTeamId) {
        // Super Admin filtered by specific team
        notifications = await prisma.$queryRawUnsafe(`
          SELECT 
            n.id_notifikasi AS "id",
            n.id_pengguna AS "userId",
            n.id_tim AS "teamId",
            n.judul AS "title",
            n.pesan AS "message",
            n.tipe AS "type",
            n.tautan AS "link",
            n.sudah_dibaca AS "isRead",
            n.dibuat_pada AS "createdAt",
            t.kode_tim AS "teamCode",
            t.nama_tim AS "teamName"
          FROM notifikasi n
          LEFT JOIN tim_biro t ON n.id_tim = t.id_tim
          WHERE n.id_tim = $1
          ORDER BY n.dibuat_pada DESC
          LIMIT 60
        `, effectiveFilterTeamId);
      } else {
        // Super Admin viewing all notifications
        notifications = await prisma.$queryRawUnsafe(`
          SELECT 
            n.id_notifikasi AS "id",
            n.id_pengguna AS "userId",
            n.id_tim AS "teamId",
            n.judul AS "title",
            n.pesan AS "message",
            n.tipe AS "type",
            n.tautan AS "link",
            n.sudah_dibaca AS "isRead",
            n.dibuat_pada AS "createdAt",
            t.kode_tim AS "teamCode",
            t.nama_tim AS "teamName"
          FROM notifikasi n
          LEFT JOIN tim_biro t ON n.id_tim = t.id_tim
          ORDER BY n.dibuat_pada DESC
          LIMIT 60
        `);
      }
    } else {
      // Regular staff / pimpinan: Strictly scoped to their own team(s)
      if (userTeamIds.length > 0) {
        notifications = await prisma.$queryRawUnsafe(`
          SELECT 
            n.id_notifikasi AS "id",
            n.id_pengguna AS "userId",
            n.id_tim AS "teamId",
            n.judul AS "title",
            n.pesan AS "message",
            n.tipe AS "type",
            n.tautan AS "link",
            n.sudah_dibaca AS "isRead",
            n.dibuat_pada AS "createdAt",
            t.kode_tim AS "teamCode",
            t.nama_tim AS "teamName"
          FROM notifikasi n
          LEFT JOIN tim_biro t ON n.id_tim = t.id_tim
          WHERE n.id_tim = ANY($1::text[])
             OR (n.id_pengguna = $2 AND n.id_tim IS NULL)
          ORDER BY n.dibuat_pada DESC
          LIMIT 60
        `, userTeamIds, currentUser.id);
      } else {
        // Fallback for staff without team assignment
        notifications = await prisma.$queryRawUnsafe(`
          SELECT 
            n.id_notifikasi AS "id",
            n.id_pengguna AS "userId",
            n.id_tim AS "teamId",
            n.judul AS "title",
            n.pesan AS "message",
            n.tipe AS "type",
            n.tautan AS "link",
            n.sudah_dibaca AS "isRead",
            n.dibuat_pada AS "createdAt",
            t.kode_tim AS "teamCode",
            t.nama_tim AS "teamName"
          FROM notifikasi n
          LEFT JOIN tim_biro t ON n.id_tim = t.id_tim
          WHERE n.id_pengguna = $1
          ORDER BY n.dibuat_pada DESC
          LIMIT 60
        `, currentUser.id);
      }
    }

    const currentTeam =
      allTeams.find((t) => t.id === currentUser?.teamId) ||
      (currentUser?.teamName
        ? { id: currentUser.teamId || '', code: currentUser.teamCode || '', name: currentUser.teamName }
        : null);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      success: true,
      data: {
        notifications,
        unreadCount,
        currentTeam,
        availableTeams: allTeams,
        isSuperAdmin: isSuperAdmin || isAdmin,
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

    await prisma.$executeRawUnsafe(
      `UPDATE notifikasi SET sudah_dibaca = true WHERE id_notifikasi = $1`,
      id
    );

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
 * Mark all notifications as read for current user / team scope
 */
export async function markAllNotificationsAsReadAction(filterTeamId?: string) {
  try {
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch {}

    if (!currentUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
    const isAdmin = currentUser.role === 'ADMIN';

    const userTeamIds: string[] = [];
    if (currentUser.teamId) userTeamIds.push(currentUser.teamId);
    if (currentUser.assignedTeams && Array.isArray(currentUser.assignedTeams)) {
      for (const t of currentUser.assignedTeams) {
        if (t.id && !userTeamIds.includes(t.id)) {
          userTeamIds.push(t.id);
        }
      }
    }

    const effectiveFilterTeamId = filterTeamId && filterTeamId !== 'ALL' ? filterTeamId : null;

    if (isSuperAdmin || isAdmin) {
      if (effectiveFilterTeamId) {
        await prisma.$executeRawUnsafe(
          `UPDATE notifikasi SET sudah_dibaca = true WHERE sudah_dibaca = false AND id_tim = $1`,
          effectiveFilterTeamId
        );
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE notifikasi SET sudah_dibaca = true WHERE sudah_dibaca = false`
        );
      }
    } else {
      if (userTeamIds.length > 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE notifikasi SET sudah_dibaca = true
           WHERE sudah_dibaca = false
             AND (id_tim = ANY($1::text[]) OR (id_pengguna = $2 AND id_tim IS NULL))`,
          userTeamIds,
          currentUser.id
        );
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE notifikasi SET sudah_dibaca = true
           WHERE sudah_dibaca = false AND id_pengguna = $1`,
          currentUser.id
        );
      }
    }

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

    await prisma.$executeRawUnsafe(
      `DELETE FROM notifikasi WHERE id_notifikasi = $1`,
      id
    );

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
 * Clear all read notifications within current user / team scope
 */
export async function clearAllReadNotificationsAction(filterTeamId?: string) {
  try {
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch {}

    if (!currentUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
    const isAdmin = currentUser.role === 'ADMIN';

    const userTeamIds: string[] = [];
    if (currentUser.teamId) userTeamIds.push(currentUser.teamId);
    if (currentUser.assignedTeams && Array.isArray(currentUser.assignedTeams)) {
      for (const t of currentUser.assignedTeams) {
        if (t.id && !userTeamIds.includes(t.id)) {
          userTeamIds.push(t.id);
        }
      }
    }

    const effectiveFilterTeamId = filterTeamId && filterTeamId !== 'ALL' ? filterTeamId : null;

    if (isSuperAdmin || isAdmin) {
      if (effectiveFilterTeamId) {
        await prisma.$executeRawUnsafe(
          `DELETE FROM notifikasi WHERE sudah_dibaca = true AND id_tim = $1`,
          effectiveFilterTeamId
        );
      } else {
        await prisma.$executeRawUnsafe(
          `DELETE FROM notifikasi WHERE sudah_dibaca = true`
        );
      }
    } else {
      if (userTeamIds.length > 0) {
        await prisma.$executeRawUnsafe(
          `DELETE FROM notifikasi
           WHERE sudah_dibaca = true
             AND (id_tim = ANY($1::text[]) OR (id_pengguna = $2 AND id_tim IS NULL))`,
          userTeamIds,
          currentUser.id
        );
      } else {
        await prisma.$executeRawUnsafe(
          `DELETE FROM notifikasi WHERE sudah_dibaca = true AND id_pengguna = $1`,
          currentUser.id
        );
      }
    }

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
 * Fast helper to query total unread notification count scoped per team
 */
export async function getUnreadNotificationCountAction(filterTeamId?: string) {
  try {
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch {}

    if (!currentUser?.id) {
      return { success: true, count: 0 };
    }

    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
    const isAdmin = currentUser.role === 'ADMIN';

    const userTeamIds: string[] = [];
    if (currentUser.teamId) userTeamIds.push(currentUser.teamId);
    if (currentUser.assignedTeams && Array.isArray(currentUser.assignedTeams)) {
      for (const t of currentUser.assignedTeams) {
        if (t.id && !userTeamIds.includes(t.id)) {
          userTeamIds.push(t.id);
        }
      }
    }

    let result: any[] = [];
    const effectiveFilterTeamId = filterTeamId && filterTeamId !== 'ALL' ? filterTeamId : null;

    if (isSuperAdmin || isAdmin) {
      if (effectiveFilterTeamId) {
        result = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int AS count
           FROM notifikasi
           WHERE sudah_dibaca = false AND id_tim = $1`,
          effectiveFilterTeamId
        );
      } else {
        result = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int AS count
           FROM notifikasi
           WHERE sudah_dibaca = false`
        );
      }
    } else {
      if (userTeamIds.length > 0) {
        result = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int AS count
           FROM notifikasi
           WHERE sudah_dibaca = false
             AND (id_tim = ANY($1::text[]) OR (id_pengguna = $2 AND id_tim IS NULL))`,
          userTeamIds,
          currentUser.id
        );
      } else {
        result = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int AS count
           FROM notifikasi
           WHERE sudah_dibaca = false AND id_pengguna = $1`,
          currentUser.id
        );
      }
    }

    const count = Number(result[0]?.count || 0);
    return { success: true, count };
  } catch (error: any) {
    console.error('Error counting unread notifications:', error);
    return { success: false, count: 0 };
  }
}
