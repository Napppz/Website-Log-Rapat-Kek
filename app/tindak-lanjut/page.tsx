import React, { Suspense } from 'react';
import { getActionItemsFromDb } from '@/lib/db-service';
import { prisma } from '@/lib/prisma';
import { ActionItemMatrixView } from '@/components/action-items/action-item-matrix-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TindakLanjutPage() {
  const [items, meetings, biros, users] = await Promise.all([
    getActionItemsFromDb(),
    prisma.meeting.findMany({
      select: { id: true, meetingNumber: true, title: true },
      orderBy: { meetingNumber: 'asc' },
    }),
    prisma.biro.findMany({
      where: { isActive: true },
      select: { id: true, code: true, shortName: true, name: true },
      orderBy: { code: 'asc' },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, biroId: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat matriks tindak lanjut...</div>}>
      <ActionItemMatrixView
        initialItems={items}
        availableMeetings={meetings}
        availableBiros={biros}
        availableUsers={users}
      />
    </Suspense>
  );
}
