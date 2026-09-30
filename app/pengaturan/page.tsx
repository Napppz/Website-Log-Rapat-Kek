import React from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/authorization';
import { PengaturanClient } from './pengaturan-client';

export const metadata: Metadata = {
  title: 'Pengaturan Akun & Sistem — Sekretariat Dewan Nasional KEK',
  description:
    'Pengaturan profil dinas, preferensi notifikasi, dan unit kerja biro Dewan Nasional Kawasan Ekonomi Khusus.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PengaturanPage() {
  const authUser = await getCurrentUser();

  // Fetch real user from DB if logged in, or fetch default admin
  let user = null;
  if (authUser?.id) {
    user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        biroId: true,
        biro: {
          select: {
            id: true,
            code: true,
            shortName: true,
            name: true,
          },
        },
      },
    });
  }

  // Fallback to first superadmin or admin if no active session in standalone view
  if (!user) {
    user = await prisma.user.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        biroId: true,
        biro: {
          select: {
            id: true,
            code: true,
            shortName: true,
            name: true,
          },
        },
      },
    });
  }

  // Fetch all active biros
  const biros = await prisma.biro.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      shortName: true,
      name: true,
    },
    orderBy: { code: 'asc' },
  });

  return <PengaturanClient initialUser={user} availableBiros={biros} />;
}
