'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorization';

export async function getMinutesHistoryAction(meetingId: string) {
  try {
    const history = await prisma.minutesHistory.findMany({
      where: { meetingId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, history };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memuat riwayat perubahan.' };
  }
}

export async function recordMinutesHistoryAction(
  meetingId: string,
  changeType: string,
  fieldName?: string,
  oldValue?: any,
  newValue?: any,
  summary?: string
) {
  try {
    const user = await requireAuth();
    const entry = await prisma.minutesHistory.create({
      data: {
        meetingId,
        userId: user.id,
        changeType,
        fieldName: fieldName || null,
        oldValue: oldValue !== undefined ? oldValue : undefined,
        newValue: newValue !== undefined ? newValue : undefined,
        summary: summary || null,
      },
    });
    return { success: true, entry };
  } catch (err: any) {
    console.error('[recordMinutesHistoryAction]', err);
    return { success: false, error: err?.message || 'Gagal merekam riwayat.' };
  }
}
