import { prisma } from '../lib/prisma';

async function main() {
  console.log('=== MEMULAI PENATAAN ID DATABASE NEON MENJADI BERURUTAN (SEQUENTIAL) ===\n');

  // ==========================================
  // 1. TIM BIRO (tim_biro)
  // ==========================================
  console.log('--- 1. Menata Tabel "tim_biro" ---');
  const teams: any[] = await prisma.$queryRawUnsafe(`
    SELECT id_tim, kode_tim, nama_tim FROM "tim_biro" ORDER BY kode_tim ASC;
  `);
  console.log(`Ditemukan ${teams.length} tim biro.`);

  // Temp rename
  for (let i = 0; i < teams.length; i++) {
    const tempId = `TEMP_TIM_${i}_${Date.now()}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "tim_biro" SET id_tim = $1 WHERE id_tim = $2;`,
      tempId,
      teams[i].id_tim
    );
    teams[i].tempId = tempId;
  }

  // Final sequential rename
  for (let i = 0; i < teams.length; i++) {
    const finalId = `TIM-${String(i + 1).padStart(3, '0')}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "tim_biro" SET id_tim = $1 WHERE id_tim = $2;`,
      finalId,
      teams[i].tempId
    );
    console.log(`  [TIM] ${teams[i].kode_tim} (${teams[i].nama_tim}) -> ${finalId}`);
  }

  // ==========================================
  // 2. PENGGUNA / USER (pengguna)
  // ==========================================
  console.log('\n--- 2. Menata Tabel "pengguna" ---');
  const users: any[] = await prisma.$queryRawUnsafe(`
    SELECT id_pengguna, email, nama_lengkap, dibuat_pada FROM "pengguna" ORDER BY dibuat_pada ASC;
  `);
  console.log(`Ditemukan ${users.length} pengguna.`);

  // Temp rename
  for (let i = 0; i < users.length; i++) {
    const tempId = `TEMP_USR_${i}_${Date.now()}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "pengguna" SET id_pengguna = $1 WHERE id_pengguna = $2;`,
      tempId,
      users[i].id_pengguna
    );
    users[i].tempId = tempId;
  }

  // Final sequential rename
  for (let i = 0; i < users.length; i++) {
    const finalId = `USR-${String(i + 1).padStart(3, '0')}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "pengguna" SET id_pengguna = $1 WHERE id_pengguna = $2;`,
      finalId,
      users[i].tempId
    );
    console.log(`  [USER] ${finalId} | ${users[i].email} (${users[i].nama_lengkap})`);
  }

  // ==========================================
  // 3. RAPAT / MEETING (rapat)
  // ==========================================
  console.log('\n--- 3. Menata Tabel "rapat" ---');
  const meetings: any[] = await prisma.$queryRawUnsafe(`
    SELECT id_rapat, nomor_rapat, judul_rapat, dibuat_pada FROM "rapat" ORDER BY dibuat_pada ASC;
  `);
  console.log(`Ditemukan ${meetings.length} rapat.`);

  // Temp rename
  for (let i = 0; i < meetings.length; i++) {
    const tempId = `TEMP_MTG_${i}_${Date.now()}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "rapat" SET id_rapat = $1 WHERE id_rapat = $2;`,
      tempId,
      meetings[i].id_rapat
    );
    meetings[i].tempId = tempId;
  }

  // Final sequential rename
  for (let i = 0; i < meetings.length; i++) {
    const finalId = `MTG-${String(i + 1).padStart(3, '0')}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "rapat" SET id_rapat = $1 WHERE id_rapat = $2;`,
      finalId,
      meetings[i].tempId
    );
    console.log(`  [MEETING] ${finalId} | No: ${meetings[i].nomor_rapat} | ${meetings[i].judul_rapat.slice(0, 40)}`);
  }

  // ==========================================
  // 4. NOTULEN RAPAT (notulen_rapat)
  // ==========================================
  console.log('\n--- 4. Menata Tabel "notulen_rapat" ---');
  const minutes: any[] = await prisma.$queryRawUnsafe(`
    SELECT id_notulen, id_rapat, dibuat_pada FROM "notulen_rapat" ORDER BY dibuat_pada ASC;
  `);
  console.log(`Ditemukan ${minutes.length} notulen rapat.`);

  // Temp rename
  for (let i = 0; i < minutes.length; i++) {
    const tempId = `TEMP_NOT_${i}_${Date.now()}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "notulen_rapat" SET id_notulen = $1 WHERE id_notulen = $2;`,
      tempId,
      minutes[i].id_notulen
    );
    minutes[i].tempId = tempId;
  }

  // Final sequential rename
  for (let i = 0; i < minutes.length; i++) {
    const finalId = `NOT-${String(i + 1).padStart(3, '0')}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "notulen_rapat" SET id_notulen = $1 WHERE id_notulen = $2;`,
      finalId,
      minutes[i].tempId
    );
    console.log(`  [MINUTES] ${finalId} (Rapat: ${minutes[i].id_rapat})`);
  }

  // ==========================================
  // 5. TINDAK LANJUT / ACTION ITEMS (tindak_lanjut)
  // ==========================================
  console.log('\n--- 5. Menata Tabel "tindak_lanjut" ---');
  const actionItems: any[] = await prisma.$queryRawUnsafe(`
    SELECT id_tindak_lanjut, id_rapat, judul_tindakan, dibuat_pada FROM "tindak_lanjut" ORDER BY dibuat_pada ASC;
  `);
  console.log(`Ditemukan ${actionItems.length} tindak lanjut.`);

  // Temp rename
  for (let i = 0; i < actionItems.length; i++) {
    const tempId = `TEMP_ACT_${i}_${Date.now()}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "tindak_lanjut" SET id_tindak_lanjut = $1 WHERE id_tindak_lanjut = $2;`,
      tempId,
      actionItems[i].id_tindak_lanjut
    );
    actionItems[i].tempId = tempId;
  }

  // Final sequential rename
  for (let i = 0; i < actionItems.length; i++) {
    const finalId = `ACT-${String(i + 1).padStart(3, '0')}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "tindak_lanjut" SET id_tindak_lanjut = $1 WHERE id_tindak_lanjut = $2;`,
      finalId,
      actionItems[i].tempId
    );
    console.log(`  [ACTION] ${finalId} | Rapat: ${actionItems[i].id_rapat} | ${actionItems[i].judul_tindakan.slice(0, 35)}`);
  }

  // ==========================================
  // 6. PESERTA RAPAT (peserta_rapat)
  // ==========================================
  console.log('\n--- 6. Menata Tabel "peserta_rapat" ---');
  const participants: any[] = await prisma.$queryRawUnsafe(`
    SELECT id_peserta, id_rapat, id_pengguna, dibuat_pada FROM "peserta_rapat" ORDER BY dibuat_pada ASC;
  `);
  console.log(`Ditemukan ${participants.length} peserta rapat.`);

  // Temp rename
  for (let i = 0; i < participants.length; i++) {
    const tempId = `TEMP_PRT_${i}_${Date.now()}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "peserta_rapat" SET id_peserta = $1 WHERE id_peserta = $2;`,
      tempId,
      participants[i].id_peserta
    );
    participants[i].tempId = tempId;
  }

  // Final sequential rename
  for (let i = 0; i < participants.length; i++) {
    const finalId = `PRT-${String(i + 1).padStart(3, '0')}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "peserta_rapat" SET id_peserta = $1 WHERE id_peserta = $2;`,
      finalId,
      participants[i].tempId
    );
  }
  console.log(`  ✓ Berhasil menata ${participants.length} peserta menjadi PRT-001 s/d PRT-${String(participants.length).padStart(3, '0')}`);

  // ==========================================
  // 7. NOTIFIKASI (notifikasi)
  // ==========================================
  console.log('\n--- 7. Menata Tabel "notifikasi" ---');
  const notifications: any[] = await prisma.$queryRawUnsafe(`
    SELECT id_notifikasi, judul, dibuat_pada FROM "notifikasi" ORDER BY dibuat_pada ASC;
  `);
  console.log(`Ditemukan ${notifications.length} notifikasi.`);

  // Temp rename
  for (let i = 0; i < notifications.length; i++) {
    const tempId = `TEMP_NTF_${i}_${Date.now()}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "notifikasi" SET id_notifikasi = $1 WHERE id_notifikasi = $2;`,
      tempId,
      notifications[i].id_notifikasi
    );
    notifications[i].tempId = tempId;
  }

  // Final sequential rename
  for (let i = 0; i < notifications.length; i++) {
    const finalId = `NTF-${String(i + 1).padStart(3, '0')}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "notifikasi" SET id_notifikasi = $1 WHERE id_notifikasi = $2;`,
      finalId,
      notifications[i].tempId
    );
  }
  console.log(`  ✓ Berhasil menata ${notifications.length} notifikasi menjadi NTF-001 s/d NTF-${String(notifications.length).padStart(3, '0')}`);

  // ==========================================
  // 8. RIWAYAT TINDAK LANJUT (riwayat_tindak_lanjut)
  // ==========================================
  console.log('\n--- 8. Menata Tabel "riwayat_tindak_lanjut" ---');
  const actionLogs: any[] = await prisma.$queryRawUnsafe(`
    SELECT id_riwayat, dibuat_pada FROM "riwayat_tindak_lanjut" ORDER BY dibuat_pada ASC;
  `);
  console.log(`Ditemukan ${actionLogs.length} riwayat tindak lanjut.`);

  for (let i = 0; i < actionLogs.length; i++) {
    const tempId = `TEMP_LOG_${i}_${Date.now()}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "riwayat_tindak_lanjut" SET id_riwayat = $1 WHERE id_riwayat = $2;`,
      tempId,
      actionLogs[i].id_riwayat
    );
    actionLogs[i].tempId = tempId;
  }

  for (let i = 0; i < actionLogs.length; i++) {
    const finalId = `LOG-${String(i + 1).padStart(3, '0')}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "riwayat_tindak_lanjut" SET id_riwayat = $1 WHERE id_riwayat = $2;`,
      finalId,
      actionLogs[i].tempId
    );
    console.log(`  [LOG] ${finalId}`);
  }

  // ==========================================
  // 9. RIWAYAT NOTULEN (riwayat_notulen)
  // ==========================================
  console.log('\n--- 9. Menata Tabel "riwayat_notulen" ---');
  const minutesHistory: any[] = await prisma.$queryRawUnsafe(`
    SELECT id_riwayat, dibuat_pada FROM "riwayat_notulen" ORDER BY dibuat_pada ASC;
  `);
  console.log(`Ditemukan ${minutesHistory.length} riwayat notulen.`);

  for (let i = 0; i < minutesHistory.length; i++) {
    const tempId = `TEMP_HST_${i}_${Date.now()}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "riwayat_notulen" SET id_riwayat = $1 WHERE id_riwayat = $2;`,
      tempId,
      minutesHistory[i].id_riwayat
    );
    minutesHistory[i].tempId = tempId;
  }

  for (let i = 0; i < minutesHistory.length; i++) {
    const finalId = `HST-${String(i + 1).padStart(3, '0')}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "riwayat_notulen" SET id_riwayat = $1 WHERE id_riwayat = $2;`,
      finalId,
      minutesHistory[i].tempId
    );
    console.log(`  [HISTORY] ${finalId}`);
  }

  console.log('\n=== PENATAAN SELURUH TABEL NEON DB SELESAI DENGAN SEMPURNA! ===');
}

main()
  .catch((e) => {
    console.error('Terjadi kesalahan saat migrasi ID:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
