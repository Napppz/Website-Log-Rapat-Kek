import { getMeetingsFromDb } from '@/lib/db-service';
import { getCurrentUser } from '@/lib/auth/authorization';
import { SemuaRapatClient } from './semua-rapat-client';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SemuaRapatPage() {
  const currentUser = await getCurrentUser();
  const isPrivileged =
    currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  // Strict Bureau Scoping: Non-admin users only see meetings for their own bureau
  const userBiroCode = !isPrivileged && currentUser?.biroCode ? currentUser.biroCode : undefined;

  const meetings = await getMeetingsFromDb(userBiroCode ? { biroCode: userBiroCode } : undefined);

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat data rapat dari Neon DB...</div>}>
      <SemuaRapatClient
        initialMeetings={meetings}
        lockedBiroCode={userBiroCode}
        currentUserBiroName={currentUser?.biroName}
        currentUserRole={currentUser?.role}
      />
    </Suspense>
  );
}
