import React from 'react';
import { Metadata } from 'next';
import { getNotificationsAction } from '@/app/actions/notification-actions';
import { NotifikasiClient } from './notifikasi-client';

export const metadata: Metadata = {
  title: 'Notifikasi Sistem & Peringatan — Sekretariat Dewan Nasional KEK',
  description:
    'Pusat pemberitahuan resmi mengenai jadwal kegiatan, catatan kegiatan, dan eskalasi tindak lanjut Dewan Nasional KEK.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotifikasiPage() {
  const res = await getNotificationsAction();
  const notifications = res.success && res.data ? res.data.notifications : [];
  const unreadCount = res.success && res.data ? res.data.unreadCount : 0;
  const currentTeam = res.success && res.data ? res.data.currentTeam : null;
  const availableTeams = res.success && res.data ? res.data.availableTeams : [];
  const isSuperAdmin = res.success && res.data ? res.data.isSuperAdmin : false;
  const initialError = !res.success ? (res.error || 'Gagal memuat daftar notifikasi sistem.') : null;

  return (
    <NotifikasiClient
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
      initialCurrentTeam={currentTeam}
      availableTeams={availableTeams}
      isSuperAdmin={isSuperAdmin}
      initialError={initialError}
    />
  );
}
