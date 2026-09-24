import React from 'react';
import { notFound } from 'next/navigation';
import { getMeetingByIdFromDb } from '@/lib/db-service';
import { prisma } from '@/lib/prisma';
import { MeetingDetailView } from './meeting-detail-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MeetingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params;
  const [meeting, biros, users] = await Promise.all([
    getMeetingByIdFromDb(id),
    prisma.biro.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, shortName: true },
      orderBy: { code: 'asc' },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, biroId: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!meeting) {
    notFound();
  }

  return (
    <MeetingDetailView
      meeting={meeting}
      availableBiros={biros}
      availableUsers={users}
    />
  );
}
