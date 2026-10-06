import React, { Suspense } from 'react';
import { getActionItemsFromDb, withDbRetry } from '@/lib/db-service';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ActionItemMatrixView } from '@/components/action-items/action-item-matrix-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TindakLanjutPage() {
  const currentUser = await getCurrentUser();
  const isPrivileged =
    currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  // Strict Bureau Scoping: Non-admin users only see and manage action items for their own bureau
  const userBiroCode = !isPrivileged && currentUser?.biroCode ? currentUser.biroCode : undefined;

  const [items, meetings, biros, users] = await withDbRetry(async () =>
    Promise.all([
      getActionItemsFromDb(userBiroCode ? { biroCode: userBiroCode } : undefined),
      prisma.meeting.findMany({
        select: {
          id: true,
          meetingNumber: true,
          title: true,
          date: true,
          primaryBiro: {
            select: { code: true, name: true },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.biro.findMany({
        where: userBiroCode ? { code: userBiroCode, isActive: true } : { isActive: true },
        select: { id: true, code: true, shortName: true, name: true },
        orderBy: { code: 'asc' },
      }),
      prisma.user.findMany({
        where: userBiroCode ? { biro: { code: userBiroCode } } : undefined,
        select: { id: true, name: true, email: true, biroId: true },
        orderBy: { name: 'asc' },
      }),
    ])
  );

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat matriks tindak lanjut...</div>}>
      <ActionItemMatrixView
        initialItems={items}
        availableMeetings={meetings}
        availableBiros={biros}
        availableUsers={users}
        lockedBiroCode={userBiroCode}
        currentUserRole={currentUser?.role}
        currentUserBiroName={currentUser?.biroName}
      />
    </Suspense>
  );
}

