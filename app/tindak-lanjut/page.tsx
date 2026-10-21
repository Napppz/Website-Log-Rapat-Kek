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
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'PIMPINAN';

  // Bureau Scoping: Non-admin users only see action items for their own bureau
  const userBiroCode = !isPrivileged && currentUser?.biroCode ? currentUser.biroCode : undefined;

  // Tim asal pengguna (tetap dicatat untuk preferensi awal tanpa mengunci hak lihat tim lain)
  const userTeamCode = currentUser?.teamCode ? currentUser.teamCode : undefined;
  const userTeamName = currentUser?.teamName ? currentUser.teamName : undefined;
  const userTeamId = currentUser?.teamId ? currentUser.teamId : undefined;

  const [items, meetings, biros, users, teams] = await withDbRetry(async () =>
    Promise.all([
      // Ambil seluruh tindak lanjut (pekerjaan) dalam biro agar semua tim kerja bisa saling melihat
      getActionItemsFromDb({
        biroCode: userBiroCode,
      }),
      prisma.meeting.findMany({
        where: userBiroCode
          ? {
              OR: [
                { primaryBiro: { code: userBiroCode } },
                { meetingBiros: { some: { biro: { code: userBiroCode } } } },
              ],
            }
          : undefined,
        select: {
          id: true,
          meetingNumber: true,
          title: true,
          date: true,
          chairpersonId: true,
          picName: true,
          primaryTeamId: true,
          primaryBiro: {
            select: { code: true, name: true },
          },
          primaryTeam: {
            select: { id: true, code: true, name: true },
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
        select: { id: true, name: true, email: true, biroId: true, teamId: true },
        orderBy: { name: 'asc' },
      }),
      prisma.biroTeam.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true, biroId: true },
        orderBy: { code: 'asc' },
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
        availableTeams={teams}
        lockedBiroCode={userBiroCode}
        lockedTeamCode={undefined}
        lockedTeamName={userTeamName}
        currentUserRole={currentUser?.role}
        currentUserBiroName={currentUser?.biroName}
        currentUserTeamId={userTeamId}
      />
    </Suspense>
  );
}

