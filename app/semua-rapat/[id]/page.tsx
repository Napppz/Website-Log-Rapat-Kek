import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMeetingByIdFromDb, withDbRetry } from '@/lib/db-service';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/authorization';
import { MeetingDetailView } from './meeting-detail-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MeetingDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}

export default async function MeetingDetailPage({ params, searchParams }: MeetingDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentUser = await getCurrentUser();
  const isPrivileged =
    currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const [meeting, biros, users] = await withDbRetry(async () =>
    Promise.all([
      getMeetingByIdFromDb(id),
      prisma.biro.findMany({
        where: !isPrivileged && currentUser?.biroCode
          ? { code: currentUser.biroCode.toUpperCase(), isActive: true }
          : { isActive: true },
        select: { id: true, code: true, name: true, shortName: true },
        orderBy: { code: 'asc' },
      }),
      prisma.user.findMany({
        where: !isPrivileged && currentUser?.biroCode
          ? { biro: { code: currentUser.biroCode.toUpperCase() } }
          : undefined,
        select: {
          id: true,
          name: true,
          email: true,
          biroId: true,
          teamId: true,
          biro: { select: { id: true, code: true, name: true, shortName: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ])
  );

  if (!meeting) {
    notFound();
  }

  // Access Control: Non-admin accounts can only view meetings where their bureau is primary or involved
  if (!isPrivileged && currentUser?.biroCode) {
    const userCode = currentUser.biroCode.toUpperCase();
    const isPrimary = meeting.primaryBiro?.code?.toUpperCase() === userCode;
    const isInvolved = meeting.meetingBiros?.some(
      (mb: any) => mb.biro?.code?.toUpperCase() === userCode
    );

    if (!isPrimary && !isInvolved) {
      redirect('/semua-rapat?denied=true');
    }
  }

  return (
    <MeetingDetailView
      meeting={meeting}
      availableBiros={biros}
      availableUsers={users}
      initialTab={resolvedSearchParams.tab}
    />
  );
}
