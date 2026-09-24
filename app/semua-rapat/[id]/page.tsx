import React from 'react';
import { notFound } from 'next/navigation';
import { getMeetingByIdFromDb } from '@/lib/db-service';
import { MeetingDetailView } from './meeting-detail-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MeetingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params;
  const meeting = await getMeetingByIdFromDb(id);

  if (!meeting) {
    notFound();
  }

  return <MeetingDetailView meeting={meeting} />;
}
