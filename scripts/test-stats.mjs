import { getDashboardStats } from '../lib/db-service.ts';

async function main() {
  const stats = await getDashboardStats();
  console.log('--- DASHBOARD STATS RESULT ---');
  console.log('Total Meetings:', stats?.totalMeetings);
  console.log('Teams count:', stats?.teamWorkload?.length);
  for (const t of stats?.teamWorkload || []) {
    console.log(`\nTeam [${t.code}] ${t.fullName}:`);
    console.log(`  - Jumlah Rapat: ${t.meetingCount}`);
    console.log(`  - Total Pekerjaan: ${t.totalJobs}`);
    console.log(`  - Selesai: ${t.completedJobs}`);
    console.log(`  - Berjalan: ${t.inProgressJobs}`);
    console.log(`  - Dalam Proses: ${t.pendingJobs}`);
    console.log(`  - Tingkat Penyelesaian: ${t.completionRate}%`);
    console.log(`  - Jumlah Staf: ${t.memberCount}`);
    console.log(`  - Staf Anggota: ${t.members.map(m => m.name).join(', ')}`);
  }
}

main().catch(console.error).finally(() => process.exit(0));
