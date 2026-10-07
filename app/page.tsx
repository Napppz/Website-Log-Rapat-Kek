import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/authorization';
import { getMeetingsFromDb, getDashboardStats } from '@/lib/db-service';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  // If user is a staff belonging to another specific biro, redirect to that biro
  if (
    currentUser &&
    currentUser.role !== 'SUPER_ADMIN' &&
    currentUser.role !== 'ADMIN' &&
    currentUser.biroCode &&
    !['ikk', 'biro-ikk'].includes(currentUser.biroCode.toLowerCase())
  ) {
    redirect(`/biro/${currentUser.biroCode.toLowerCase()}`);
  }

  const [meetings, stats] = await Promise.all([
    getMeetingsFromDb(),
    getDashboardStats(),
  ]);

  return (
    <DashboardClient
      initialMeetings={meetings}
      metrics={stats?.metrics}
      workload={stats?.bureauWorkload}
      followUpMetrics={stats?.followUpMetrics}
      monthlyActivity={stats?.monthlyActivity}
      totalResolutions={stats?.actionItemStats?.total}
      teamWorkload={stats?.teamWorkload}
    />
  );
}

