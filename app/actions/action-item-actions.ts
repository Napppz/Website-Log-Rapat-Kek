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
import { createNotificationRecord } from '@/app/actions/notification-actions';

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
      currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'PIMPINAN';

    const where: any = meetingId ? { meetingId } : {};

    // Bureau Scoping: Non-admin users are strictly restricted to action items of their own bureau
    if (!isPrivileged && currentUser?.biroId) {
      where.picBiroId = currentUser.biroId;
    }

    // Team Scoping: Staff users are strictly restricted to action items of their own work team
    if (currentUser?.role === 'STAFF' && (currentUser.teamId || currentUser.teamCode)) {
      const teamOrs: any[] = [];
      if (currentUser.teamId) {
        teamOrs.push({ picTeamId: currentUser.teamId });
      }
      if (currentUser.teamCode) {
        teamOrs.push({ picTeam: { code: currentUser.teamCode.toUpperCase() } });
      }
      if (currentUser.id) {
        teamOrs.push({ picUserId: currentUser.id });
      }
      where.OR = teamOrs;
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

    const isStaff = currentUser?.role === 'STAFF';
    let meetingWhere: any = undefined;

    if (isStaff && (currentUser?.teamCode || currentUser?.teamId)) {
      const tCode = currentUser.teamCode?.toUpperCase();
      const tId = currentUser.teamId;
      meetingWhere = {
        OR: [
          ...(tCode
            ? [
                { primaryTeam: { code: tCode } },
                { meetingNumber: { startsWith: `${tCode}-` } },
              ]
            : []),
          ...(tId ? [{ primaryTeamId: tId }] : []),
        ],
      };
    } else if (!isPrivileged && currentUser?.biroCode) {
      meetingWhere = {
        OR: [
          { primaryBiro: { code: currentUser.biroCode.toUpperCase() } },
          { meetingNumber: { startsWith: `${currentUser.biroCode.toUpperCase()}-` } },
        ],
      };
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
          team: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          userTeams: {
            select: {
              role: true,
              team: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
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
        where: meetingWhere,
        select: {
          id: true,
          meetingNumber: true,
          title: true,
          date: true,
          primaryTeamId: true,
          chairpersonId: true,
          picName: true,
          primaryBiro: {
            select: { code: true, name: true },
          },
          primaryTeam: {
            select: { id: true, code: true, name: true },
          },
        },
        orderBy: [{ date: 'desc' }, { meetingNumber: 'desc' }],
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

    let resolvedTeam: { id: string; biroId: string; code: string; name: string } | null = null;
    if (effectiveTeamId) {
      resolvedTeam = await prisma.biroTeam.findFirst({
        where: {
          OR: [
            { id: effectiveTeamId },
            { code: effectiveTeamId.toUpperCase() },
            ...(effectiveTeamId === 'TIM-001' ? [{ code: 'INV' }] : []),
            ...(effectiveTeamId === 'TIM-002' ? [{ code: 'KOM' }] : []),
            ...(effectiveTeamId === 'TIM-003' ? [{ code: 'KS' }] : []),
            ...(effectiveTeamId === 'TIM-004' ? [{ code: 'SI' }] : []),
            ...(effectiveTeamId === 'TIM-005' ? [{ code: 'POKJA' }] : []),
          ],
        },
        select: { id: true, biroId: true, code: true, name: true },
      });
      if (resolvedTeam) {
        effectiveTeamId = resolvedTeam.id;
        effectiveBiroId = resolvedTeam.biroId;
      }
    }

    // Resolve Biro by id or code
    let biro = null;
    if (effectiveBiroId) {
      biro = await prisma.biro.findFirst({
        where: {
          OR: [
            { id: effectiveBiroId },
            { code: effectiveBiroId.toUpperCase() },
            { code: effectiveBiroId.toUpperCase().replace('BIRO-', '') },
          ],
        },
      });
    }

    if (!biro) {
      if (meeting.primaryBiroId) {
        biro = await prisma.biro.findUnique({ where: { id: meeting.primaryBiroId } });
      }
      if (!biro) {
        biro = await prisma.biro.findFirst({ where: { code: 'IKK' } });
      }
    }

    if (!biro) {
      return { success: false, error: 'Biro/Unit kerja penanggung jawab tidak ditemukan.' };
    }
    effectiveBiroId = biro.id;

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

    // Team Scoping: Staff users can only assign action items to their own work team
    if (currentUser.role === 'STAFF' && currentUser.teamId && effectiveTeamId) {
      const allowedTeamIds = [
        currentUser.teamId,
        ...(currentUser.assignedTeams || []).map((t) => t.id),
      ].filter(Boolean);
      const allowedTeamCodes = [
        ...(currentUser.teamCode ? [currentUser.teamCode.toUpperCase()] : []),
        ...(currentUser.assignedTeams || []).map((t) => (t.code || '').toUpperCase()),
      ].filter(Boolean);

      const isAllowedTeam =
        allowedTeamIds.includes(effectiveTeamId) ||
        (resolvedTeam && allowedTeamCodes.includes(resolvedTeam.code.toUpperCase()));

      if (!isAllowedTeam) {
        return {
          success: false,
          error: 'Anda hanya dapat menugaskan tindak lanjut ke tim kerja Anda sendiri.',
        };
      }
    }

    // Meeting Scoping: Staff users can only create action items on meetings belonging to their own work team, or general bureau meetings
    if (currentUser.role === 'STAFF') {
      const userTeamCodes = [
        ...(currentUser.teamCode ? [currentUser.teamCode.toUpperCase()] : []),
        ...(currentUser.assignedTeams || []).map((t) => (t.code || '').toUpperCase()),
      ].filter(Boolean);
      const userTeamIds = [
        ...(currentUser.teamId ? [currentUser.teamId] : []),
        ...(currentUser.assignedTeams || []).map((t) => t.id),
      ].filter(Boolean);

      const meetingTeamCode = meeting.primaryTeam?.code?.toUpperCase();
      const meetingTeamId = meeting.primaryTeamId;
      const meetingNumber = meeting.meetingNumber?.toUpperCase() || '';

      const isMatch =
        !meetingTeamId ||
        meetingNumber.startsWith('POKJA-') ||
        meetingNumber.startsWith('PLENO-') ||
        (meetingTeamId && userTeamIds.includes(meetingTeamId)) ||
        (meetingTeamCode && userTeamCodes.includes(meetingTeamCode)) ||
        userTeamCodes.some((tc) => meetingNumber.startsWith(`${tc}-`));

      if (!isMatch) {
        return {
          success: false,
          error: 'Anda hanya dapat menambahkan tindak lanjut pada rapat tim kerja peran Anda sendiri.',
        };
      }
    }

    // 4. Validate picUser if provided
    let validPicUserId: string | null = null;
    if (picUserId && picUserId.trim() !== '') {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: picUserId },
            { email: picUserId },
            { name: picUserId },
          ],
        },
      });
      if (user) {
        validPicUserId = user.id;
      }
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

    // 6b. Dispatch personal notification to assigned PIC user
    if (validPicUserId) {
      try {
        await createNotificationRecord({
          userId: validPicUserId,
          teamId: effectiveTeamId || meeting.primaryTeamId || null,
          title: `Penugasan Tindak Lanjut: ${title}`,
          message: `Anda ditugaskan sebagai PIC tindak lanjut "${title}" pada kegiatan "${meeting.title}".`,
          type: 'tindak_lanjut',
          link: `/semua-rapat/${meetingId}`,
          isRead: false,
        });
      } catch (notifErr) {
        console.warn('Could not create notification for action item PIC:', notifErr);
      }
    }

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

    let resolvedTeam: { id: string; biroId: string; code: string; name: string } | null = null;
    if (effectiveTeamId) {
      resolvedTeam = await prisma.biroTeam.findFirst({
        where: {
          OR: [
            { id: effectiveTeamId },
            { code: effectiveTeamId.toUpperCase() },
            ...(effectiveTeamId === 'TIM-001' ? [{ code: 'INV' }] : []),
            ...(effectiveTeamId === 'TIM-002' ? [{ code: 'KOM' }] : []),
            ...(effectiveTeamId === 'TIM-003' ? [{ code: 'KS' }] : []),
            ...(effectiveTeamId === 'TIM-004' ? [{ code: 'SI' }] : []),
            ...(effectiveTeamId === 'TIM-005' ? [{ code: 'POKJA' }] : []),
          ],
        },
        select: { id: true, biroId: true, code: true, name: true },
      });
      if (resolvedTeam) {
        effectiveTeamId = resolvedTeam.id;
        effectiveBiroId = resolvedTeam.biroId;
      }
    }

    // Resolve Biro by id or code
    let biro = null;
    if (effectiveBiroId) {
      biro = await prisma.biro.findFirst({
        where: {
          OR: [
            { id: effectiveBiroId },
            { code: effectiveBiroId.toUpperCase() },
            { code: effectiveBiroId.toUpperCase().replace('BIRO-', '') },
          ],
        },
      });
    }

    if (!biro) {
      if (existing.picBiroId) {
        biro = await prisma.biro.findUnique({ where: { id: existing.picBiroId } });
      }
      if (!biro) {
        biro = await prisma.biro.findFirst({ where: { code: 'IKK' } });
      }
    }

    if (!biro) {
      return { success: false, error: 'Biro/Unit kerja penanggung jawab tidak ditemukan.' };
    }
    effectiveBiroId = biro.id;

    // Bureau Scoping: Non-admin users cannot edit action items of another bureau, nor reassign outside their bureau
    if (!isPrivileged && currentUser.biroId) {
      if (existing.picBiroId !== currentUser.biroId || effectiveBiroId !== currentUser.biroId) {
        return {
          success: false,
          error: 'Anda hanya dapat mengelola tindak lanjut untuk biro/tim Anda sendiri.',
        };
      }
    }

    // Team Scoping: Staff users cannot reassign or manage action items of another team
    if (currentUser.role === 'STAFF' && currentUser.teamId) {
      const allowedTeamIds = [
        currentUser.teamId,
        ...(currentUser.assignedTeams || []).map((t) => t.id),
      ].filter(Boolean);
      const allowedTeamCodes = [
        ...(currentUser.teamCode ? [currentUser.teamCode.toUpperCase()] : []),
        ...(currentUser.assignedTeams || []).map((t) => (t.code || '').toUpperCase()),
      ].filter(Boolean);

      const isAllowedTeam =
        !effectiveTeamId ||
        allowedTeamIds.includes(effectiveTeamId) ||
        (resolvedTeam && allowedTeamCodes.includes(resolvedTeam.code.toUpperCase()));

      if (!isAllowedTeam) {
        return {
          success: false,
          error: 'Anda hanya dapat menugaskan tindak lanjut ke tim kerja Anda sendiri.',
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

    // 4. Validate picUser if provided
    let validPicUserId: string | null = null;
    if (picUserId && picUserId.trim() !== '') {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: picUserId },
            { email: picUserId },
            { name: picUserId },
          ],
        },
      });
      if (user) {
        validPicUserId = user.id;
      }
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

    // 7b. Dispatch personal notification if PIC has been assigned or changed
    if (validPicUserId && validPicUserId !== existing.picUserId) {
      try {
        await createNotificationRecord({
          userId: validPicUserId,
          teamId: effectiveTeamId || meeting.primaryTeamId || null,
          title: `Penugasan Tindak Lanjut: ${title}`,
          message: `Anda ditugaskan sebagai PIC baru untuk tindak lanjut "${title}" pada kegiatan "${meeting.title}".`,
          type: 'tindak_lanjut',
          link: `/semua-rapat/${meetingId}`,
          isRead: false,
        });
      } catch (notifErr) {
        console.warn('Could not create notification for action item reassignment:', notifErr);
      }
    }

    // 8. Auto-complete meeting if action item is marked COMPLETED
    if (status === 'COMPLETED' && meetingId) {
      await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          progressStatus: 'Selesai',
          status: 'FINAL',
        },
      }).catch((err) => console.error('Error auto-completing meeting on action item update:', err));
    }

    // 9. Revalidate
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

    if (status === 'COMPLETED' && existing.meetingId) {
      await prisma.meeting.update({
        where: { id: existing.meetingId },
        data: {
          progressStatus: 'Selesai',
          status: 'FINAL',
        },
      }).catch((err) => console.error('Error auto-completing meeting on action item status update:', err));
    }

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

    // Authorization Check: Must have 'delete:action_item' permission
    // For STAFF, ownership check is applied: user can only delete if assigned to them
    const currentUser = await requirePermission('delete:action_item', {
      actionItemPicUserId: existing.picUserId,
    });
    const isPrivileged =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

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

    // Merge new evidence links/docs into ActionItem.description without overwriting initial reference documents
    let updatedDescription = existing.description || '';

    // 1. Preserve initial reference document
    const refDocMatch = updatedDescription.match(/📎 (?:Dokumen Acuan|Dokumen Terkait):\s*\[([^\]]+)\]\(([^)]+)\)/);
    // 2. Preserve initial drive reference
    const refDriveMatch = updatedDescription.match(/📎 (?:Drive Acuan|Google Drive Acuan):\s*(\S+)/);

    // 3. Extract supervisor instructions (excluding attachments and previous evidence)
    let supervisorInstructions = updatedDescription
      .replace(/📎 (?:Dokumen Acuan|Dokumen Terkait):\s*\[([^\]]+)\]\(([^)]+)\)/g, '')
      .replace(/📎 (?:Drive Acuan|Google Drive Acuan):\s*\S+/g, '')
      .replace(/📎 Bukti Pelaksanaan:\s*\[([^\]]+)\]\(([^)]+)\)/g, '')
      .replace(/📎 (?:Drive Bukti|Tautan Google Drive):\s*\S+/g, '')
      .replace(/📝 (?:Catatan Capaian|Catatan Progres):\s*[^\n]+/g, '')
      .trim();

    // 4. Extract new PIC evidence from incoming notes
    const newDocMatch = notes.match(/📎 (?:Bukti Pelaksanaan|Dokumen Terkait):\s*\[([^\]]+)\]\(([^)]+)\)/);
    const prevDocMatch = updatedDescription.match(/📎 Bukti Pelaksanaan:\s*\[([^\]]+)\]\(([^)]+)\)/);
    const activeDocMatch = newDocMatch || prevDocMatch;

    const newDriveMatch = notes.match(/📎 (?:Drive Bukti|Tautan Google Drive):\s*(\S+)/);
    const prevDriveMatch = updatedDescription.match(/📎 (?:Drive Bukti|Tautan Google Drive):\s*(\S+)/);
    const activeDriveMatch = newDriveMatch || prevDriveMatch;

    // 5. Extract clean text notes from PIC
    let cleanPicNotes = notes
      .replace(/📎 (?:Bukti Pelaksanaan|Dokumen Terkait):\s*\[([^\]]+)\]\(([^)]+)\)/g, '')
      .replace(/📎 (?:Drive Bukti|Tautan Google Drive):\s*\S+/g, '')
      .trim();

    // 6. Build clean combined description:
    const descParts: string[] = [];
    if (supervisorInstructions) {
      descParts.push(supervisorInstructions);
    }
    if (refDocMatch) {
      descParts.push(`📎 Dokumen Acuan: [${refDocMatch[1]}](${refDocMatch[2]})`);
    }
    if (refDriveMatch) {
      descParts.push(`📎 Drive Acuan: ${refDriveMatch[1]}`);
    }
    if (activeDocMatch) {
      descParts.push(`📎 Bukti Pelaksanaan: [${activeDocMatch[1]}](${activeDocMatch[2]})`);
    }
    if (activeDriveMatch && (!refDriveMatch || activeDriveMatch[1] !== refDriveMatch[1])) {
      descParts.push(`📎 Drive Bukti: ${activeDriveMatch[1]}`);
    }
    if (cleanPicNotes && cleanPicNotes !== supervisorInstructions) {
      descParts.push(`📝 Catatan Capaian: ${cleanPicNotes}`);
    }

    updatedDescription = descParts.join('\n\n');

    // Update the action item
    const updatedItem = await prisma.actionItem.update({
      where: { id: actionItemId },
      data: {
        status: targetStatus,
        completedAt,
        ...(updatedDescription !== existing.description ? { description: updatedDescription } : {}),
      },
      include: {
        picBiro: true,
        picUser: true,
        meeting: true,
      },
    });

    if (targetStatus === 'COMPLETED' && existing.meetingId) {
      await prisma.meeting.update({
        where: { id: existing.meetingId },
        data: {
          progressStatus: 'Selesai',
          status: 'FINAL',
        },
      }).catch((err) => console.error('Error auto-completing meeting on action item log:', err));
    }

    // Resolve valid user ID for ActionItemLog to prevent foreign key violation
    let validLogUserId: string | null = null;
    if (currentUser?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { id: true },
      });
      if (dbUser) {
        validLogUserId = dbUser.id;
      } else if (currentUser.email) {
        const dbUserByEmail = await prisma.user.findUnique({
          where: { email: currentUser.email.toLowerCase().trim() },
          select: { id: true },
        });
        if (dbUserByEmail) {
          validLogUserId = dbUserByEmail.id;
        }
      }
    }

    // Create the audit log record with clean sequential ID
    const nextLogId = await getNextActionItemLogId();
    const log = await prisma.actionItemLog.create({
      data: {
        id: nextLogId,
        actionItemId,
        userId: validLogUserId,
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

    // Optionally create a system notification scoped to the action item's team
    try {
      const effectiveTeamId = existing.picTeamId || existing.meeting?.primaryTeamId || null;
      await createNotificationRecord({
        title: `Pembaruan Tindak Lanjut: ${existing.title.slice(0, 40)}`,
        message: `${currentUser?.name || 'Staf'} mencatat progres (${progress ?? 0}%): "${notes.slice(0, 80)}"`,
        type: targetStatus === 'COMPLETED' ? 'success' : 'info',
        link: `/semua-rapat/${existing.meetingId}`,
        teamId: effectiveTeamId,
        isRead: false,
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

