import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/authorization';
import { UserManagementView } from '@/components/users/user-management-view';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PenggunaPage() {
  const currentUser = await getCurrentUser();

  // Strict SUPER_ADMIN check (Section 29)
  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-slate-900">
              Akses Dibatasi
            </h2>
            <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
              Anda tidak memiliki akses ke halaman Manajemen Pengguna ini. Halaman ini hanya dapat diakses oleh peran <strong>Super Administrator</strong>.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[13px] shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch users & biros for SUPER_ADMIN
  const [users, biros] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        biroId: true,
        isActive: true,
        createdAt: true,
        biro: {
          select: {
            id: true,
            code: true,
            name: true,
            shortName: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { role: 'asc' }, { name: 'asc' }],
    }),
    prisma.biro.findMany({
      where: { isActive: true },
      select: { id: true, code: true, shortName: true, name: true },
      orderBy: { code: 'asc' },
    }),
  ]);

  return (
    <UserManagementView
      initialUsers={users}
      availableBiros={biros}
      currentUserId={currentUser.id}
    />
  );
}
