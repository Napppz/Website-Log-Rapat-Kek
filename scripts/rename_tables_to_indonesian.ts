import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Memulai Proses Migrasi Nama Tabel ke Bahasa Indonesia di Neon DB ===\n');

  // 1. Ambil daftar tabel yang ada saat ini di schema public
  const currentTables: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  `);
  const existingTableNames = currentTables.map(t => t.table_name);
  console.log('Tabel yang saat ini ada di Neon:', existingTableNames.join(', '));

  // Mapping nama tabel lama (Inggris) ke nama tabel baru (Indonesia)
  const renameMap: Record<string, string> = {
    'user': 'pengguna',
    'meeting': 'rapat',
    'meeting_minutes': 'notulen_rapat',
    'meeting_participant': 'peserta_rapat',
    'action_item': 'tindak_lanjut',
    'meeting_biro': 'rapat_biro',
    'biro_meeting_sequence': 'penomoran_rapat_biro',
    'account': 'akun',
    'session': 'sesi',
    'verification_token': 'token_verifikasi',
  };

  for (const [oldName, newName] of Object.entries(renameMap)) {
    if (existingTableNames.includes(oldName)) {
      console.log(`Mengubah nama tabel: "${oldName}" -> "${newName}"...`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "${oldName}" RENAME TO "${newName}";`);
      console.log(`✓ Berhasil mengubah "${oldName}" menjadi "${newName}".`);
    } else if (existingTableNames.includes(newName)) {
      console.log(`ℹ Tabel "${newName}" sudah ada (sudah berbahasa Indonesia).`);
    } else {
      console.log(`⚠ Tabel "${oldName}" tidak ditemukan, dilewati.`);
    }
  }

  // 2. Verifikasi tabel setelah di-rename
  const updatedTables: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  console.log('\n=== Daftar Tabel Resmi di Neon DB Sekarang ===');
  for (const t of updatedTables) {
    console.log(`- ${t.table_name}`);
  }
}

main()
  .catch((e) => {
    console.error('Terjadi kesalahan saat migrasi:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
