import React from 'react';
import { Metadata } from 'next';
import { getNotificationsAction } from '@/app/actions/notification-actions';
import { NotifikasiClient } from './notifikasi-client';

export const metadata: Metadata = {
  title: 'Notifikasi Sistem & Peringatan — Sekretariat Dewan Nasional KEK',
  description:
    'Pusat pemberitahuan resmi mengenai jadwal rapat, risalah, dan eskalasi tindak lanjut Dewan Nasional KEK.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotifikasiPage() {
  const res = await getNotificationsAction();
  const notifications = res.success && res.data ? res.data.notifications : [];
  const unreadCount = res.success && res.data ? res.data.unreadCount : 0;

  return (
    <NotifikasiClient
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    />
  );
}
