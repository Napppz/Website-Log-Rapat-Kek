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
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'PIMPINAN';

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
      redirect('/arsip-kegiatan?denied=true');
    }
  }

  // Team Access Control: Pengguna tim lain hanya dapat melihat (read-only)
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const userAssignedList = currentUser?.assignedTeams || [];
  const userTeamCodes = Array.from(
    new Set([
      ...(currentUser?.teamCode ? [currentUser.teamCode.toUpperCase()] : []),
      ...userAssignedList.map((t: any) => (t.code || '').toUpperCase()),
    ])
  ).filter(Boolean);
  const userTeamIds = Array.from(
    new Set([
      ...(currentUser?.teamId ? [currentUser.teamId] : []),
      ...userAssignedList.map((t: any) => t.id || ''),
    ])
  ).filter(Boolean);

  const isUserTeam =
    isSuperAdmin ||
    (userTeamCodes.length > 0 &&
      (userTeamCodes.includes((meeting.primaryTeam?.code || '').toUpperCase()) ||
        userTeamCodes.some((tc) => meeting.meetingNumber?.toUpperCase().startsWith(`${tc}-`)))) ||
    (userTeamIds.length > 0 && userTeamIds.includes(meeting.primaryTeamId || ''));

  const isReadOnly = !isUserTeam;

  return (
    <MeetingDetailView
      meeting={meeting}
      availableBiros={biros}
      availableUsers={users}
      initialTab={resolvedSearchParams.tab}
      isReadOnly={Boolean(isReadOnly)}
    />
  );
}
