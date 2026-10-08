'use server';

import { prisma } from '@/lib/prisma';
import {
  actionItemSchema,
  updateActionItemSchema,
  updateActionItemStatusSchema,
  addActionItemLogSchema,
  computeActionItemStatus,
  ActionItemInput,
  UpdateActionItemInput,
  UpdateActionItemStatusInput,
  AddActionItemLogInput,
} from '@/lib/validations/action-item';
import { revalidatePath } from 'next/cache';
import { requirePermission, getCurrentUser } from '@/lib/auth/authorization';
import {
  getNextActionItemId,
  getNextActionItemLogId,
  getNextNotificationId,
} from '@/lib/id-generator';

/**
 * Helper to safely revalidate paths without crashing in standalone tests
 */
function safeRevalidate(paths: string[]) {
  try {
    for (const path of paths) {
      revalidatePath(path);
    }
  } catch {
    // Suppress Next.js static store missing errors when run in scripts
  }
}

/**
 * Server Action: Get all action items for a specific meeting, or all action items if meetingId is omitted.
 */
export async function getActionItemsAction(meetingId?: string) {
  try {
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch {}

    const isPrivileged =
      currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

    const where: any = meetingId ? { meetingId } : {};

    // Bureau Scoping: Non-admin users are strictly restricted to action items of their own bureau
    if (!isPrivileged && currentUser?.biroId) {
      where.picBiroId = currentUser.biroId;
    }

    const items = await prisma.actionItem.findMany({
      where,
      include: {
        picBiro: {
          select: {
            id: true,
            code: true,
            name: true,
            shortName: true,
          },
        },
        picTeam: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
          },
        },
        picUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        meeting: {
          select: {
            id: true,
            meetingNumber: true,
            title: true,
            date: true,
          },
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            progress: true,
            notes: true,
            createdAt: true,
            user: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: { logs: true },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    const enriched = items.map(computeActionItemStatus);
    return { success: true, data: enriched };
  } catch (error: any) {
    console.error('Error fetching action items:', error);
    return { success: false, error: 'Gagal memuat daftar tindak lanjut.' };
  }
}

/**
 * Server Action: Mengambil opsi biro resmi KEK dan pengguna aktif untuk formulir tindak lanjut
 */
export async function getActionItemFormOptionsAction() {
  try {
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch {}

    const isPrivileged =
      currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

    const biroWhere: any = { isActive: true };
    const teamWhere: any = { isActive: true };
    const userWhere: any = { isActive: true };

    if (!isPrivileged && currentUser?.biroCode) {
      biroWhere.code = currentUser.biroCode.toUpperCase();
      teamWhere.biro = { code: currentUser.biroCode.toUpperCase() };
      userWhere.biro = { code: currentUser.biroCode.toUpperCase() };
    }

    const [biros, users, teams, meetings] = await Promise.all([
      prisma.biro.findMany({
        where: biroWhere,
        select: {
          id: true,
          code: true,
          name: true,
          shortName: true,
        },
        orderBy: { code: 'asc' },
      }),
      prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          name: true,
          email: true,
          biroId: true,
          teamId: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.biroTeam.findMany({
        where: teamWhere,
        select: {
          id: true,
          biroId: true,
          code: true,
          name: true,
          description: true,
        },
        orderBy: { code: 'asc' },
      }),
      prisma.meeting.findMany({
        select: {
          id: true,
          meetingNumber: true,
          title: true,
          date: true,
          primaryTeamId: true,
          primaryBiro: {
            select: { code: true, name: true },
          },
          primaryTeam: {
            select: { id: true, code: true, name: true },
          },
        },
        orderBy: { date: 'desc' },
        take: 100,
      }),
    ]);

    return {
      success: true,
      biros,
      users,
      teams,
      meetings,
    };
  } catch (error: any) {
    console.error('Error fetching action item form options:', error);
    return {
      success: false,
      biros: [],
      users: [],
      teams: [],
      meetings: [],
      error: 'Gagal memuat daftar biro & pengguna.',
    };
  }
}

/**
 * Server Action: Create an Action Item
 */
export async function createActionItemAction(input: ActionItemInput) {
  try {
    // 1. Zod Validation
    const parsed = actionItemSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: `Validasi gagal: ${errorMsg}` };
    }

    const {
      meetingId,
      title,
      description,
      picBiroId,
      picTeamId,
      picUserId,
      dueDate,
      priority,
      status,
    } = parsed.data;

    // 2. Ensure meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { primaryBiro: true, primaryTeam: true },
    });
    if (!meeting) {
      return { success: false, error: 'Rapat tidak ditemukan.' };
    }

    // 3. Resolve Team & Biro (Team-First Architecture)
    let effectiveBiroId = picBiroId ? picBiroId.trim() : '';
    let effectiveTeamId = picTeamId ? picTeamId.trim() : null;

    if (effectiveTeamId) {
      const team = await prisma.biroTeam.findUnique({
        where: { id: effectiveTeamId },
        select: { id: true, biroId: true, code: true, name: true },
      });
      if (team?.biroId) {
        effectiveBiroId = team.biroId;
      }
    }

    if (!effectiveBiroId) {
      const ikkBiro = await prisma.biro.findFirst({
        where: { code: 'IKK' },
        select: { id: true },
      });
      effectiveBiroId = ikkBiro?.id || 'BIRO-IKK';
    }

    // Ensure Biro exists
    const biro = await prisma.biro.findUnique({
      where: { id: effectiveBiroId },
    });
    if (!biro) {
      return { success: false, error: 'Biro/Unit kerja penanggung jawab tidak ditemukan.' };
    }

    // Authorization Check: Must have 'create:action_item' permission (SUPER_ADMIN, ADMIN, STAFF)
    const currentUser = await requirePermission('create:action_item');
    const isPrivileged =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

    // Bureau Scoping: Non-admin users can only create action items assigned to their own bureau
    if (!isPrivileged && currentUser.biroId && effectiveBiroId !== currentUser.biroId) {
      return {
        success: false,
        error: 'Anda hanya dapat menugaskan tindak lanjut ke biro/tim Anda sendiri.',
      };
    }

    // 4. Validate picUser if provided
    let validPicUserId: string | null = null;
    if (picUserId && picUserId.trim() !== '') {
      const user = await prisma.user.findUnique({
        where: { id: picUserId },
      });
      if (!user) {
        return { success: false, error: 'PIC Pengguna tidak ditemukan.' };
      }
      validPicUserId = user.id;
    }

    // 5. Calculate completedAt
    const isCompleted = status === 'COMPLETED';
    const completedAt = isCompleted ? new Date() : null;

    // 6. Create Action Item with clean sequential ID
    const nextActionId = await getNextActionItemId();
    const actionItem = await prisma.actionItem.create({
      data: {
        id: nextActionId,
        meetingId,
        title,
        description: description || null,
        picBiroId: effectiveBiroId,
        picTeamId: effectiveTeamId,
        picUserId: validPicUserId,
        dueDate,
        priority,
        status,
        completedAt,
      },
      include: {
        picBiro: true,
        picTeam: true,
        picUser: true,
        meeting: true,
      },
    });

    // 7. Revalidate relevant routes
    safeRevalidate([
      '/',
      '/semua-rapat',
      '/tindak-lanjut',
      `/semua-rapat/${meetingId}`,
      biro.code ? `/biro/${biro.code.toLowerCase()}` : '',
      meeting.primaryBiro?.code
        ? `/biro/${meeting.primaryBiro.code.toLowerCase()}`
        : '',
    ].filter(Boolean));

    return {
      success: true,
      data: computeActionItemStatus(actionItem),
    };
  } catch (error: any) {
    console.error('Error creating action item:', error);
    return {
      success: false,
      error: 'Gagal membuat tindak lanjut. Silakan coba lagi.',
    };
  }
}

/**
 * Server Action: Update an Action Item
 */
export async function updateActionItemAction(input: UpdateActionItemInput) {
  try {
    // 1. Zod Validation
    const parsed = updateActionItemSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: `Validasi gagal: ${errorMsg}` };
    }

    const {
      id,
      meetingId,
      title,
      description,
      picBiroId,
      picTeamId,
      picUserId,
      dueDate,
      priority,
      status,
    } = parsed.data;

    // 2. Ensure ActionItem exists
    const existing = await prisma.actionItem.findUnique({
      where: { id },
    });
    if (!existing) {
      return { success: false, error: 'Tindak lanjut tidak ditemukan.' };
    }

    // Authorization Check: Must have 'edit:action_item' permission
    // For STAFF, ownership check is applied: user can only edit if assigned to them
    const currentUser = await requirePermission('edit:action_item', {
      actionItemPicUserId: existing.picUserId,
    });
    const isPrivileged =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

    // Resolve Team & Biro (Team-First Architecture)
    let effectiveTeamId = picTeamId !== undefined ? (picTeamId ? picTeamId.trim() : null) : existing.picTeamId;
    let effectiveBiroId = picBiroId ? picBiroId.trim() : existing.picBiroId;

    if (effectiveTeamId) {
      const team = await prisma.biroTeam.findUnique({
        where: { id: effectiveTeamId },
        select: { id: true, biroId: true },
      });
      if (team?.biroId) {
        effectiveBiroId = team.biroId;
      }
    }

    if (!effectiveBiroId) {
      const ikkBiro = await prisma.biro.findFirst({
        where: { code: 'IKK' },
        select: { id: true },
      });
      effectiveBiroId = ikkBiro?.id || 'BIRO-IKK';
    }

    // Bureau Scoping: Non-admin users cannot edit action items of another bureau, nor reassign outside their bureau
    if (!isPrivileged && currentUser.biroId) {
      if (existing.picBiroId !== currentUser.biroId || effectiveBiroId !== currentUser.biroId) {
        return {
          success: false,
          error: 'Anda hanya dapat mengelola tindak lanjut untuk biro/tim Anda sendiri.',
        };
      }
    }

    // 3. Ensure Meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { primaryBiro: true, primaryTeam: true },
    });
    if (!meeting) {
      return { success: false, error: 'Rapat tidak ditemukan.' };
    }

    // 4. Ensure Biro exists
    const biro = await prisma.biro.findUnique({
      where: { id: effectiveBiroId },
    });
    if (!biro) {
      return { success: false, error: 'Biro/Unit kerja penanggung jawab tidak ditemukan.' };
    }

    // 5. Validate picUser if provided
    let validPicUserId: string | null = null;
    if (picUserId && picUserId.trim() !== '') {
      const user = await prisma.user.findUnique({
        where: { id: picUserId },
      });
      if (!user) {
        return { success: false, error: 'PIC Pengguna tidak ditemukan.' };
      }
      validPicUserId = user.id;
    }

    // 6. Handle completedAt logic
    let completedAt: Date | null = existing.completedAt;
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      completedAt = new Date();
    } else if (status !== 'COMPLETED' && existing.status === 'COMPLETED') {
      completedAt = null;
    }

    // 7. Update Action Item
    const updated = await prisma.actionItem.update({
      where: { id },
      data: {
        meetingId,
        title,
        description: description || null,
        picBiroId: effectiveBiroId,
        picTeamId: effectiveTeamId,
        picUserId: validPicUserId,
        dueDate,
        priority,
        status,
        completedAt,
      },
      include: {
        picBiro: true,
        picTeam: true,
        picUser: true,
        meeting: true,
      },
    });

    // 8. Revalidate
    safeRevalidate([
      '/',
      '/semua-rapat',
      '/tindak-lanjut',
      `/semua-rapat/${meetingId}`,
      biro.code ? `/biro/${biro.code.toLowerCase()}` : '',
      meeting.primaryBiro?.code
        ? `/biro/${meeting.primaryBiro.code.toLowerCase()}`
        : '',
    ].filter(Boolean));

    return {
      success: true,
      data: computeActionItemStatus(updated),
    };
  } catch (error: any) {
    console.error('Error updating action item:', error);
    return {
      success: false,
      error: 'Gagal memperbarui tindak lanjut. Silakan coba lagi.',
    };
  }
}

/**
 * Server Action: Quick Update Status of an Action Item
 */
export async function updateActionItemStatusAction(input: UpdateActionItemStatusInput) {
  try {
    const parsed = updateActionItemStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: 'Data status tidak valid.' };
    }

    const { id, status } = parsed.data;

    const existing = await prisma.actionItem.findUnique({
      where: { id },
      include: {
        meeting: { include: { primaryBiro: true } },
        picBiro: true,
      },
    });

    if (!existing) {
      return { success: false, error: 'Tindak lanjut tidak ditemukan.' };
    }

    // Authorization Check: Must have 'edit:action_item' permission
    const currentUser = await requirePermission('edit:action_item', {
      actionItemPicUserId: existing.picUserId,
    });
    const isPrivileged =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

    // Bureau Scoping: Non-admin users can only update status of their own bureau's action items
    if (!isPrivileged && currentUser.biroId && existing.picBiroId !== currentUser.biroId) {
      return {
        success: false,
        error: 'Anda hanya dapat memperbarui status tindak lanjut milik biro Anda sendiri.',
      };
    }

    let completedAt: Date | null = existing.completedAt;
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      completedAt = new Date();
    } else if (status !== 'COMPLETED' && existing.status === 'COMPLETED') {
      completedAt = null;
    }

    const updated = await prisma.actionItem.update({
      where: { id },
      data: {
        status,
        completedAt,
      },
      include: {
        picBiro: true,
        picUser: true,
        meeting: true,
      },
    });

    safeRevalidate([
      '/',
      '/semua-rapat',
      '/tindak-lanjut',
      `/semua-rapat/${existing.meetingId}`,
      existing.picBiro?.code ? `/biro/${existing.picBiro.code.toLowerCase()}` : '',
    ].filter(Boolean));

    return {
      success: true,
      data: computeActionItemStatus(updated),
    };
  } catch (error: any) {
    console.error('Error updating action item status:', error);
    return {
      success: false,
      error: 'Gagal mengubah status tindak lanjut.',
    };
  }
}

/**
 * Server Action: Delete an Action Item
 */
export async function deleteActionItemAction(id: string) {
  try {
    // Authorization Check: Must have 'delete:action_item' permission (SUPER_ADMIN, ADMIN)
    const currentUser = await requirePermission('delete:action_item');
    const isPrivileged =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

    if (!id) {
      return { success: false, error: 'ID tindak lanjut tidak valid.' };
    }

    const existing = await prisma.actionItem.findUnique({
      where: { id },
      include: {
        meeting: { include: { primaryBiro: true } },
        picBiro: true,
      },
    });

    if (!existing) {
      return { success: false, error: 'Tindak lanjut tidak ditemukan.' };
    }

    // Bureau Scoping: Non-admin users can only delete action items belonging to their own bureau
    if (!isPrivileged && currentUser.biroId && existing.picBiroId !== currentUser.biroId) {
      return {
        success: false,
        error: 'Anda hanya dapat menghapus tindak lanjut milik biro Anda sendiri.',
      };
    }

    await prisma.actionItem.delete({
      where: { id },
    });

    safeRevalidate([
      '/',
      '/semua-rapat',
      '/tindak-lanjut',
      `/semua-rapat/${existing.meetingId}`,
      existing.picBiro?.code ? `/biro/${existing.picBiro.code.toLowerCase()}` : '',
    ].filter(Boolean));

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting action item:', error);
    return {
      success: false,
      error: 'Gagal menghapus tindak lanjut. Silakan coba lagi.',
    };
  }
}

/**
 * Server Action: Get all audit logs / progress notes for a specific action item
 */
export async function getActionItemLogsAction(actionItemId: string) {
  try {
    if (!actionItemId) {
      return { success: false, error: 'ID tindak lanjut tidak valid.' };
    }

    const logs = await prisma.actionItemLog.findMany({
      where: { actionItemId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            biro: {
              select: {
                id: true,
                code: true,
                shortName: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: logs,
    };
  } catch (error: any) {
    console.error('Error getting action item logs:', error);
    return {
      success: false,
      error: 'Gagal memuat riwayat progres tindak lanjut.',
    };
  }
}

/**
 * Server Action: Add a new progress note & audit log to an Action Item
 */
export async function addActionItemLogAction(input: AddActionItemLogInput) {
  try {
    const parsed = addActionItemLogSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: `Validasi gagal: ${errorMsg}` };
    }

    const { actionItemId, notes, progress, newStatus } = parsed.data;

    const existing = await prisma.actionItem.findUnique({
      where: { id: actionItemId },
      include: {
        picBiro: true,
        meeting: {
          include: {
            primaryBiro: true,
          },
        },
      },
    });

    if (!existing) {
      return { success: false, error: 'Tindak lanjut tidak ditemukan.' };
    }

    // Authorization check
    const currentUser = await requirePermission('edit:action_item', {
      actionItemPicUserId: existing.picUserId,
    });
    const isPrivileged =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

    if (!isPrivileged && currentUser.biroId && existing.picBiroId !== currentUser.biroId) {
      return {
        success: false,
        error: 'Anda hanya dapat menambahkan catatan progres pada tindak lanjut biro Anda sendiri.',
      };
    }

    // Determine target status
    const targetStatus = newStatus || existing.status;
    let completedAt: Date | null = existing.completedAt;
    if (targetStatus === 'COMPLETED' && existing.status !== 'COMPLETED') {
      completedAt = new Date();
    } else if (targetStatus !== 'COMPLETED' && existing.status === 'COMPLETED') {
      completedAt = null;
    }

    // Update the action item
    const updatedItem = await prisma.actionItem.update({
      where: { id: actionItemId },
      data: {
        status: targetStatus,
        completedAt,
      },
      include: {
        picBiro: true,
        picUser: true,
        meeting: true,
      },
    });

    // Create the audit log record with clean sequential ID
    const nextLogId = await getNextActionItemLogId();
    const log = await prisma.actionItemLog.create({
      data: {
        id: nextLogId,
        actionItemId,
        userId: currentUser?.id || null,
        previousStatus: existing.status,
        newStatus: targetStatus,
        notes,
        progress: progress ?? (targetStatus === 'COMPLETED' ? 100 : 0),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            biro: {
              select: {
                id: true,
                code: true,
                shortName: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Optionally create a system notification for the organization
    try {
      const nextNotifId = await getNextNotificationId();
      await prisma.notification.create({
        data: {
          id: nextNotifId,
          title: `Pembaruan Tindak Lanjut: ${existing.title.slice(0, 40)}`,
          message: `${currentUser?.name || 'Staf'} mencatat progres (${progress ?? 0}%): "${notes.slice(0, 80)}"`,
          type: targetStatus === 'COMPLETED' ? 'success' : 'info',
          link: `/tindak-lanjut?search=${encodeURIComponent(existing.title)}`,
        },
      });
    } catch (notifErr) {
      console.warn('Failed to insert notification:', notifErr);
    }

    safeRevalidate([
      '/',
      '/semua-rapat',
      '/tindak-lanjut',
      `/semua-rapat/${existing.meetingId}`,
      existing.picBiro?.code ? `/biro/${existing.picBiro.code.toLowerCase()}` : '',
      existing.meeting?.primaryBiro?.code
        ? `/biro/${existing.meeting.primaryBiro.code.toLowerCase()}`
        : '',
    ].filter(Boolean));

    return {
      success: true,
      data: {
        log,
        updatedItem: computeActionItemStatus({
          ...updatedItem,
          logs: [log],
        }),
      },
    };
  } catch (error: any) {
    console.error('Error adding action item log:', error);
    return {
      success: false,
      error: 'Gagal menambahkan catatan progres tindak lanjut.',
    };
  }
}

