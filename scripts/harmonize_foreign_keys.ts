import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Menyelaraskan Nama Kunci Tamu (Foreign Key) dengan Nama Tabel Asalnya ===\n');

  // 1. Ambil kolom yang ada saat ini
  const rawCols: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public';
  `);

  const colsByTable: Record<string, string[]> = {};
  for (const r of rawCols) {
    if (!colsByTable[r.table_name]) colsByTable[r.table_name] = [];
    colsByTable[r.table_name].push(r.column_name);
  }

  // Renames to execute
  // Table 'rapat':
  //   id_biro_penyelenggara -> id_biro
  //   id_pimpinan_sidang -> id_pengguna
  //   id_notulis_sidang -> id_notulis
  if (colsByTable['rapat']?.includes('id_biro_penyelenggara')) {
    console.log('Renaming rapat.id_biro_penyelenggara -> id_biro...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "rapat" RENAME COLUMN "id_biro_penyelenggara" TO "id_biro";`);
    console.log('✓ Berhasil.');
  }

  if (colsByTable['rapat']?.includes('id_pimpinan_sidang')) {
    console.log('Renaming rapat.id_pimpinan_sidang -> id_pengguna...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "rapat" RENAME COLUMN "id_pimpinan_sidang" TO "id_pengguna";`);
    console.log('✓ Berhasil.');
  }

  if (colsByTable['rapat']?.includes('id_notulis_sidang')) {
    console.log('Renaming rapat.id_notulis_sidang -> id_notulis...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "rapat" RENAME COLUMN "id_notulis_sidang" TO "id_notulis";`);
    console.log('✓ Berhasil.');
  }

  // Table 'tindak_lanjut':
  //   id_biro_pic -> id_biro
  //   id_pengguna_pic -> id_pengguna
  if (colsByTable['tindak_lanjut']?.includes('id_biro_pic')) {
    console.log('Renaming tindak_lanjut.id_biro_pic -> id_biro...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "tindak_lanjut" RENAME COLUMN "id_biro_pic" TO "id_biro";`);
    console.log('✓ Berhasil.');
  }

  if (colsByTable['tindak_lanjut']?.includes('id_pengguna_pic')) {
    console.log('Renaming tindak_lanjut.id_pengguna_pic -> id_pengguna...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "tindak_lanjut" RENAME COLUMN "id_pengguna_pic" TO "id_pengguna";`);
    console.log('✓ Berhasil.');
  }

  console.log('\n=== Verifikasi Kolom Baru ===');
  const checkRapat: any[] = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'rapat' ORDER BY ordinal_position;
  `);
  console.log('Kolom tabel rapat:', checkRapat.map(c => c.column_name).join(', '));

  const checkAction: any[] = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'tindak_lanjut' ORDER BY ordinal_position;
  `);
  console.log('Kolom tabel tindak_lanjut:', checkAction.map(c => c.column_name).join(', '));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
