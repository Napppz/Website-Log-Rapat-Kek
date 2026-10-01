import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getBiroDetail, getMeetingsFromDb } from '@/lib/db-service';
import { getCurrentUser } from '@/lib/auth/authorization';
import { BiroDashboardClient } from '@/components/biro/biro-dashboard-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BiroPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ denied?: string }>;
}

export default async function BiroDetailPage({ params, searchParams }: BiroPageProps) {
  const { code } = await params;
  const { denied } = await searchParams;

  const currentUser = await getCurrentUser();

  // Access Control:
  // If user is NOT Super Admin or Admin, they can ONLY access their own Biro!
  if (
    currentUser &&
    currentUser.role !== 'SUPER_ADMIN' &&
    currentUser.role !== 'ADMIN' &&
    currentUser.biroCode &&
    currentUser.biroCode.toLowerCase() !== code.toLowerCase()
  ) {
    // Automatically redirect back to their own bureau dashboard with denied notice
    redirect(`/biro/${currentUser.biroCode.toLowerCase()}?denied=true`);
  }

  const biro = await getBiroDetail(code);

  if (!biro) {
    notFound();
  }

  const meetings = await getMeetingsFromDb({ biroCode: biro.code });
  const isPrivileged =
    currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  return (
    <BiroDashboardClient
      biro={biro as any}
      initialMeetings={meetings}
      actionItems={(biro as any).actionItems || []}
      isPrivileged={isPrivileged}
      deniedNotice={denied === 'true'}
    />
  );
}
