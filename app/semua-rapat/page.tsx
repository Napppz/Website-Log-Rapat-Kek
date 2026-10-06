import { getMeetingsFromDb, getOfficialBiros } from '@/lib/db-service';
import { getCurrentUser } from '@/lib/auth/authorization';
import { SemuaRapatClient } from './semua-rapat-client';
import { Suspense } from 'react';
import { BIRO_LIST } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SemuaRapatPage() {
  const currentUser = await getCurrentUser();
  const isPrivileged =
    currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  // Strict Bureau Scoping: Non-admin users only see meetings for their own bureau
  const userBiroCode = !isPrivileged && currentUser?.biroCode ? currentUser.biroCode : undefined;

  const [meetings, dbBiros] = await Promise.all([
    getMeetingsFromDb(userBiroCode ? { biroCode: userBiroCode } : undefined),
    getOfficialBiros(),
  ]);

  const availableBiros = dbBiros && dbBiros.length > 0 ? dbBiros : BIRO_LIST;

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat data rapat dari Neon DB...</div>}>
      <SemuaRapatClient
        initialMeetings={meetings}
        availableBiros={availableBiros}
        lockedBiroCode={userBiroCode}
        currentUserBiroName={currentUser?.biroName}
        currentUserRole={currentUser?.role}
      />
    </Suspense>
  );
}
