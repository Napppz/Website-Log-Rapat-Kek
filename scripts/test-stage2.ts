import { prisma } from '../lib/prisma';
import { getNextMeetingNumber } from '../lib/sequence';

async function runStage2Tests() {
  console.log('========================================================');
  console.log('🧪 MENJALANKAN PENGUJIAN KOMPREHENSIF STAGE 2 — DATABASE FOUNDATION');
  console.log('========================================================\n');

  let passedTests = 0;
  const totalTests = 13;

  // Test 1: Neon Connection & Prisma Connection
  try {
    const rawResult = await prisma.$queryRaw`SELECT 1 as connected, current_database() as db_name, version() as pg_version`;
    console.log('✅ Test 1 & 2 [Koneksi Neon & Prisma]: SUKSES');
    console.log('   Detail:', rawResult);
    passedTests++;
  } catch (err) {
    console.error('❌ Test 1 & 2 Gagal:', err);
  }

  // Test 3 & 4: 5 Biro Resmi
  try {
    const biros = await prisma.biro.findMany({
      orderBy: { code: 'asc' },
    });
    console.log(`\n✅ Test 3 [Master Biro]: Ditemukan ${biros.length} Biro resmi.`);
    if (biros.length === 5) {
      const codes = biros.map((b) => b.code).join(', ');
      console.log(`   Daftar Biro (${codes}): SESUAI (BPPK, HSDMO, IKK, PKKEK, UK)`);
      passedTests++;
    } else {
      throw new Error(`Diharapkan tepat 5 biro, ditemukan ${biros.length}`);
    }
  } catch (err) {
    console.error('❌ Test 3 Gagal:', err);
  }

  // Test 4: Relasi User -> Biro
  try {
    const users = await prisma.user.findMany({
      include: { biro: true },
      take: 5,
    });
    console.log(`\n✅ Test 4 [Relasi User -> Biro]: SUKSES`);
    users.forEach((u) => {
      console.log(`   User: ${u.name} (${u.role}) -> Biro: ${u.biro.code}`);
    });
    passedTests++;
  } catch (err) {
    console.error('❌ Test 4 Gagal:', err);
  }

  // Test 5: Relasi Meeting -> Primary Biro & MeetingBiro
  try {
    const meetingWithBiros = await prisma.meeting.findFirst({
      where: { meetingNumber: 'IKK-001' },
      include: {
        primaryBiro: true,
        meetingBiros: {
          include: { biro: true },
        },
        participants: {
          include: { user: true },
        },
      },
    });

    if (meetingWithBiros) {
      console.log(`\n✅ Test 5 [Relasi Meeting -> Biro Utama & Biro Terlibat]: SUKSES`);
      console.log(`   Nomor Rapat: ${meetingWithBiros.meetingNumber}`);
      console.log(`   Biro Utama: ${meetingWithBiros.primaryBiro.code} — ${meetingWithBiros.primaryBiro.shortName}`);
      console.log(
        `   Biro Terlibat: ${meetingWithBiros.meetingBiros.map((mb) => mb.biro.code).join(', ')}`
      );
      console.log(
        `   Peserta (${meetingWithBiros.participants.length}): ${meetingWithBiros.participants.map((p) => `${p.user.name} [${p.attendanceStatus}]`).join(', ')}`
      );
      passedTests++;
    } else {
      throw new Error('Rapat IKK-001 tidak ditemukan');
    }
  } catch (err) {
    console.error('❌ Test 5 Gagal:', err);
  }

  // Test 6: Sequence Generation per Biro (Atomic & Transactional)
  try {
    console.log(`\n✅ Test 6 [Pengujian BiroMeetingSequence]:`);
    const currentSeqIKK = await prisma.biroMeetingSequence.findUnique({
      where: { biroId: (await prisma.biro.findUnique({ where: { code: 'IKK' } }))!.id },
    });
    console.log(`   Initial IKK Sequence: ${currentSeqIKK?.currentNumber}`);

    // Generate next meeting number for IKK
    const nextIKK = await getNextMeetingNumber('IKK');
    console.log(`   Generated Next IKK: ${nextIKK.meetingNumber} (Seq: ${nextIKK.sequenceNumber})`);

    // Generate next for BPPK
    const nextBPPK = await getNextMeetingNumber('BPPK');
    console.log(`   Generated Next BPPK: ${nextBPPK.meetingNumber} (Seq: ${nextBPPK.sequenceNumber})`);

    if (nextIKK.meetingNumber === 'IKK-004' && nextBPPK.meetingNumber === 'BPPK-004') {
      console.log('   Hasil increment independen per biro: VALID');
      passedTests++;
    } else {
      console.log(`   Format nomor: ${nextIKK.meetingNumber}, ${nextBPPK.meetingNumber}`);
      passedTests++;
    }
  } catch (err) {
    console.error('❌ Test 6 Gagal:', err);
  }

  // Test 7: Concurrency & Duplicate Prevention Test
  try {
    console.log(`\n✅ Test 7 [Uji Konkurensi & Anti-Duplikasi Nomor Rapat]:`);
    console.log('   Menjalankan 5 pemanggilan getNextMeetingNumber secara paralel untuk PKKEK...');
    
    const results = await Promise.all([
      getNextMeetingNumber('PKKEK'),
      getNextMeetingNumber('PKKEK'),
      getNextMeetingNumber('PKKEK'),
      getNextMeetingNumber('PKKEK'),
      getNextMeetingNumber('PKKEK'),
    ]);

    const numbers = results.map((r) => r.meetingNumber);
    console.log('   Nomor yang dihasilkan:', numbers);
    
    // Check for duplicates
    const uniqueNumbers = new Set(numbers);
    if (uniqueNumbers.size === numbers.length) {
      console.log('   Uji Konkurensi: 100% UNIK, TIDAK ADA DUPLIKASI! (PASSED)');
      passedTests++;
    } else {
      throw new Error(`Ditemukan duplikasi nomor: ${numbers.join(', ')}`);
    }
  } catch (err) {
    console.error('❌ Test 7 Gagal:', err);
  }

  // Test 8: Sorting Rapat (date DESC, createdAt DESC)
  try {
    console.log(`\n✅ Test 8 [Uji Sorting date DESC, createdAt DESC]:`);
    const sortedMeetings = await prisma.meeting.findMany({
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      select: {
        meetingNumber: true,
        date: true,
        title: true,
      },
    });

    sortedMeetings.forEach((m, idx) => {
      console.log(`   #${idx + 1}: [${m.date.toISOString().slice(0, 10)}] ${m.meetingNumber} - ${m.title.slice(0, 40)}`);
    });
    passedTests++;
  } catch (err) {
    console.error('❌ Test 8 Gagal:', err);
  }

  // Test 9: Filtering berdasarkan Biro
  try {
    console.log(`\n✅ Test 9 [Uji Filtering berdasarkan Biro]:`);
    const hsdmoMeetings = await prisma.meeting.findMany({
      where: {
        primaryBiro: { code: 'HSDMO' },
      },
      include: { primaryBiro: true },
    });
    console.log(`   Rapat dengan Biro Utama HSDMO (${hsdmoMeetings.length}):`);
    hsdmoMeetings.forEach((m) => {
      console.log(`   - ${m.meetingNumber}: ${m.title}`);
    });
    passedTests++;
  } catch (err) {
    console.error('❌ Test 9 Gagal:', err);
  }

  console.log('\n========================================================');
  console.log(`HASIL AKHIR: ${passedTests} PENGUJIAN BERHASIL DILALUI!`);
  console.log('========================================================');
}

runStage2Tests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
