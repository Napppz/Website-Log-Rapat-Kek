import { getMeetingsFromDb, getOfficialBiros, getTeamsWithMembers } from '@/lib/db-service';
import { getCurrentUser } from '@/lib/auth/authorization';
import { SemuaRapatClient as ArsipKegiatanClient } from './arsip-kegiatan-client';
import { Suspense } from 'react';
import { BIRO_LIST } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ArsipKegiatanPage(props: {
  searchParams?: Promise<{ tim?: string; biro?: string; [key: string]: string | undefined }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const currentUser = await getCurrentUser();
  const isPrivileged =
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'PIMPINAN';

  // Strict Bureau Scoping: Non-admin users only see meetings for their own bureau
  const userBiroCode = !isPrivileged && currentUser?.biroCode ? currentUser.biroCode : undefined;

  // Multi-Team Scoping: Gather all assigned teams for the user
  const isStaff = currentUser?.role === 'STAFF';
  const userAssignedTeams = currentUser?.assignedTeams || [];
  const userAssignedCodes = Array.from(
    new Set([
      ...userAssignedTeams.map((t) => t.code.toUpperCase()),
      ...(currentUser?.teamCode ? [currentUser.teamCode.toUpperCase()] : []),
    ])
  ).filter(Boolean);

  const rawRequestedTim = (searchParams.tim || searchParams.biro || '').toUpperCase().trim();
  const requestedTim =
    rawRequestedTim && rawRequestedTim !== 'ALL' && rawRequestedTim !== 'IKK' && rawRequestedTim !== 'BIRO-IKK'
      ? rawRequestedTim
      : undefined;

  let queryTeamCode: string | undefined = undefined;
  let queryTeamCodes: string[] | undefined = undefined;
  let lockedTeamCode: string | undefined = undefined;
  let lockedTeamName: string | undefined = undefined;

  if (requestedTim) {
    queryTeamCode = requestedTim;
  }

  const [meetings, dbBiros, dbTeamsWithMembers] = await Promise.all([
    getMeetingsFromDb({
      biroCode: userBiroCode,
    }),
    getOfficialBiros(),
    getTeamsWithMembers(userBiroCode || 'IKK'),
  ]);

  const availableBiros = dbBiros && dbBiros.length > 0 ? dbBiros : BIRO_LIST;

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat data kegiatan...</div>}>
      <ArsipKegiatanClient
        initialMeetings={meetings}
        availableBiros={availableBiros}
        availableTeams={dbTeamsWithMembers}
        lockedBiroCode={userBiroCode}
        currentUserBiroName={currentUser?.biroName}
        currentUserRole={currentUser?.role}
        allowedTeamCodes={userAssignedCodes.length > 0 ? userAssignedCodes : undefined}
        lockedTeamCode={lockedTeamCode}
        lockedTeamName={lockedTeamName}
        currentUserId={currentUser?.id}
        currentUserEmail={currentUser?.email ?? undefined}
      />
    </Suspense>
  );
}
