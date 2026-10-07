import { prisma } from '../lib/prisma';

async function main() {
  console.log('--- Menambahkan Kolom Baru pada Tabel "rapat" sesuai Masukan Mentor ---');

  const statements = [
    `ALTER TABLE "rapat" ADD COLUMN IF NOT EXISTS "jenis_rapat" VARCHAR(100);`,
    `ALTER TABLE "rapat" ADD COLUMN IF NOT EXISTS "pic_rapat" VARCHAR(255);`,
    `ALTER TABLE "rapat" ADD COLUMN IF NOT EXISTS "status_progres" VARCHAR(50) DEFAULT 'Start';`,
    `ALTER TABLE "rapat" ADD COLUMN IF NOT EXISTS "kategori_dokumen_url" TEXT;`,
    `ALTER TABLE "rapat" ADD COLUMN IF NOT EXISTS "kategori_dokumen_nama" VARCHAR(255);`,
    `ALTER TABLE "rapat" ADD COLUMN IF NOT EXISTS "kategori_dokumen_ukuran" INT;`,
    `ALTER TABLE "rapat" ADD COLUMN IF NOT EXISTS "materi_dokumen_url" TEXT;`,
    `ALTER TABLE "rapat" ADD COLUMN IF NOT EXISTS "materi_dokumen_nama" VARCHAR(255);`,
    `ALTER TABLE "rapat" ADD COLUMN IF NOT EXISTS "materi_dokumen_ukuran" INT;`,
  ];

  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }

  console.log('Kolom tabel rapat berhasil diperbarui!');

  // Seed default teams for BPPK, PKKEK, HSDMO, UK if not present
  console.log('--- Memeriksa Tim Biro untuk Penomoran Per Tim ---');
  const allBiros = await prisma.biro.findMany({ include: { teams: true } });
  
  const standardTeams: Record<string, Array<{ code: string; name: string }>> = {
    BPPK: [
      { code: 'REN', name: 'Perencanaan' },
      { code: 'PROG', name: 'Program & Anggaran' },
      { code: 'EVAL', name: 'Evaluasi & Pelaporan' },
    ],
    PKKEK: [
      { code: 'BANG', name: 'Pengembangan Kawasan' },
      { code: 'DAL', name: 'Pengendalian Kawasan' },
      { code: 'FAS', name: 'Fasilitas & Kemudahan' },
    ],
    HSDMO: [
      { code: 'HUK', name: 'Hukum & Regulasi' },
      { code: 'SDM', name: 'Sumber Daya Manusia' },
      { code: 'ORG', name: 'Organisasi & Tata Laksana' },
    ],
    UK: [
      { code: 'KEU', name: 'Keuangan & Akuntansi' },
      { code: 'TU', name: 'Tata Usaha & Persuratan' },
      { code: 'LOG', name: 'Logistik & Perlengkapan' },
    ],
  };

  for (const biro of allBiros) {
    const defaultList = standardTeams[biro.code];
    if (defaultList && biro.teams.length === 0) {
      console.log(`Menyemai tim standar untuk ${biro.code}...`);
      for (const t of defaultList) {
        await prisma.biroTeam.create({
          data: {
            biroId: biro.id,
            code: t.code,
            name: t.name,
            description: `Tim ${t.name} ${biro.name}`,
            isActive: true,
          },
        });
      }
    }
  }

  console.log('Selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
