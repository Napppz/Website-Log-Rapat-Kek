import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== MEMULAI DIAGNOSIS MENYELURUH NEON DB ===\n');

  const tests: { name: string; fn: () => Promise<any> }[] = [
    {
      name: '1. Query Biro dengan seluruh relasi',
      fn: () => prisma.biro.findMany({
        include: {
          users: true,
          primaryMeetings: true,
          meetingBiros: true,
          sequence: true,
          actionItems: true,
        },
        take: 3,
      }),
    },
    {
      name: '2. Query Pengguna (User) dengan seluruh relasi',
      fn: () => prisma.user.findMany({
        include: {
          biro: true,
          chairedMeetings: true,
          secretaryMeetings: true,
          meetingParticipants: true,
          actionItems: true,
          accounts: true,
          sessions: true,
        },
        take: 3,
      }),
    },
    {
      name: '3. Query Rapat (Meeting) dengan seluruh relasi',
      fn: () => prisma.meeting.findMany({
        include: {
          primaryBiro: true,
          chairperson: true,
          secretary: true,
          previousMeeting: true,
          followUpMeetings: true,
          meetingBiros: true,
          participants: true,
          minutes: true,
          actionItems: true,
        },
        take: 3,
      }),
    },
    {
      name: '4. Query Notulen Rapat (MeetingMinutes) dengan relasi',
      fn: () => prisma.meetingMinutes.findMany({
        include: { meeting: true },
        take: 3,
      }),
    },
    {
      name: '5. Query Peserta Rapat (MeetingParticipant) dengan relasi',
      fn: () => prisma.meetingParticipant.findMany({
        include: { meeting: true, user: true },
        take: 3,
      }),
    },
    {
      name: '6. Query Tindak Lanjut (ActionItem) dengan relasi',
      fn: () => prisma.actionItem.findMany({
        include: { meeting: true, picBiro: true, picUser: true },
        take: 3,
      }),
    },
    {
      name: '7. Query Rapat Biro (MeetingBiro) dengan relasi',
      fn: () => prisma.meetingBiro.findMany({
        include: { meeting: true, biro: true },
        take: 3,
      }),
    },
    {
      name: '8. Query Penomoran Rapat Biro (BiroMeetingSequence) dengan relasi',
      fn: () => prisma.biroMeetingSequence.findMany({
        include: { biro: true },
        take: 3,
      }),
    },
    {
      name: '9. Query Akun (Account)',
      fn: () => prisma.account.findMany({ take: 3 }),
    },
    {
      name: '10. Query Sesi (Session)',
      fn: () => prisma.session.findMany({ take: 3 }),
    },
    {
      name: '11. Query Token Verifikasi (VerificationToken)',
      fn: () => prisma.verificationToken.findMany({ take: 3 }),
    },
  ];

  let errorsFound = 0;
  for (const test of tests) {
    try {
      const res = await test.fn();
      console.log(`✓ ${test.name}: SUKSES (ditemukan ${res.length} data)`);
    } catch (err: any) {
      errorsFound++;
      console.error(`✗ GAGAL pada ${test.name}:`);
      console.error(err.message || err);
      console.error('--------------------------------------------');
    }
  }

  // Cek Foreign Keys di PostgreSQL
  console.log('\n--- Mengecek Foreign Key Constraints di PostgreSQL ---');
  try {
    const fks: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'
      ORDER BY tc.table_name, kcu.column_name;
    `);
    for (const fk of fks) {
      console.log(`  ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    }
  } catch (err: any) {
    console.error('Error saat cek FK:', err.message);
  }

  console.log(`\n=== DIAGNOSIS SELESAI: ${errorsFound} ERROR DITEMUKAN ===`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
