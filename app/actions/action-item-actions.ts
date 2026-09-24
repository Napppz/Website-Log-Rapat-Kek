'use server';

import { prisma } from '@/lib/prisma';
import {
  actionItemSchema,
  updateActionItemSchema,
  updateActionItemStatusSchema,
  computeActionItemStatus,
  ActionItemInput,
  UpdateActionItemInput,
  UpdateActionItemStatusInput,
} from '@/lib/validations/action-item';
import { revalidatePath } from 'next/cache';

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
    const where = meetingId ? { meetingId } : {};

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
      picUserId,
      dueDate,
      priority,
      status,
    } = parsed.data;

    // 2. Ensure meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { primaryBiro: true },
    });
    if (!meeting) {
      return { success: false, error: 'Rapat tidak ditemukan.' };
    }

    // 3. Ensure Biro exists
    const biro = await prisma.biro.findUnique({
      where: { id: picBiroId },
    });
    if (!biro) {
      return { success: false, error: 'Biro penanggung jawab tidak ditemukan.' };
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

    // 6. Create Action Item
    const actionItem = await prisma.actionItem.create({
      data: {
        meetingId,
        title,
        description: description || null,
        picBiroId,
        picUserId: validPicUserId,
        dueDate,
        priority,
        status,
        completedAt,
      },
      include: {
        picBiro: true,
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

    // 3. Ensure Meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { primaryBiro: true },
    });
    if (!meeting) {
      return { success: false, error: 'Rapat tidak ditemukan.' };
    }

    // 4. Ensure Biro exists
    const biro = await prisma.biro.findUnique({
      where: { id: picBiroId },
    });
    if (!biro) {
      return { success: false, error: 'Biro penanggung jawab tidak ditemukan.' };
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
        picBiroId,
        picUserId: validPicUserId,
        dueDate,
        priority,
        status,
        completedAt,
      },
      include: {
        picBiro: true,
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
