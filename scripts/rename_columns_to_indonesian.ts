import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definisi mapping kolom per tabel: { table_name: { old_column_name: new_column_name } }
const columnRenameMap: Record<string, Record<string, string>> = {
  biro: {
    biro_id: 'id_biro',
    code: 'kode_biro',
    name: 'nama_biro',
    shortName: 'nama_singkat',
    description: 'deskripsi',
    isActive: 'status_aktif',
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada',
  },
  pengguna: {
    user_id: 'id_pengguna',
    name: 'nama_lengkap',
    // email tetap email
    password: 'kata_sandi',
    role: 'peran',
    biro_id: 'id_biro',
    isActive: 'status_aktif',
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada',
  },
  rapat: {
    meeting_id: 'id_rapat',
    meeting_number: 'nomor_rapat',
    title: 'judul_rapat',
    primary_biro_id: 'id_biro_penyelenggara',
    date: 'tanggal_rapat',
    startTime: 'waktu_mulai',
    endTime: 'waktu_selesai',
    location: 'lokasi_rapat',
    chairperson_id: 'id_pimpinan_sidang',
    secretary_id: 'id_notulis_sidang',
    previous_meeting_id: 'id_rapat_sebelumnya',
    status: 'status_rapat',
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada',
  },
  notulen_rapat: {
    minutes_id: 'id_notulen',
    meeting_id: 'id_rapat',
    agenda: 'agenda_pembahasan',
    discussion: 'hasil_pembahasan',
    decisions: 'poin_keputusan',
    conclusion: 'kesimpulan',
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada',
  },
  peserta_rapat: {
    participant_id: 'id_peserta',
    meeting_id: 'id_rapat',
    user_id: 'id_pengguna',
    attendanceStatus: 'status_kehadiran',
    createdAt: 'dibuat_pada',
  },
  tindak_lanjut: {
    action_item_id: 'id_tindak_lanjut',
    meeting_id: 'id_rapat',
    title: 'judul_tindakan',
    description: 'deskripsi_tindakan',
    pic_biro_id: 'id_biro_pic',
    pic_user_id: 'id_pengguna_pic',
    dueDate: 'tenggat_waktu',
    status: 'status_tindak_lanjut',
    priority: 'skala_prioritas',
    completedAt: 'diselesaikan_pada',
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada',
  },
  penomoran_rapat_biro: {
    sequence_id: 'id_penomoran',
    biro_id: 'id_biro',
    currentNumber: 'nomor_terakhir',
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada',
  },
  rapat_biro: {
    meeting_id: 'id_rapat',
    biro_id: 'id_biro',
  },
  akun: {
    account_id: 'id_akun',
    user_id: 'id_pengguna',
    type: 'tipe',
    provider: 'penyedia',
    providerAccountId: 'id_akun_penyedia',
    refresh_token: 'token_penyegar',
    access_token: 'token_akses',
    expires_at: 'kedaluwarsa_pada',
    token_type: 'tipe_token',
    scope: 'cakupan',
    id_token: 'token_identitas',
    session_state: 'status_sesi',
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada',
  },
  sesi: {
    session_id: 'id_sesi',
    sessionToken: 'token_sesi',
    user_id: 'id_pengguna',
    expires: 'waktu_kedaluwarsa',
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada',
  },
  token_verifikasi: {
    identifier: 'identifikasi',
    expires: 'waktu_kedaluwarsa',
  },
};

async function main() {
  console.log('=== Memulai Migrasi Seluruh Kolom di Neon DB ke Bahasa Indonesia ===\n');

  // Ambil struktur kolom saat ini
  const rawCols: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public';
  `);

  const existingColsByTable: Record<string, string[]> = {};
  for (const row of rawCols) {
    if (!existingColsByTable[row.table_name]) {
      existingColsByTable[row.table_name] = [];
    }
    existingColsByTable[row.table_name].push(row.column_name);
  }

  for (const [tableName, colMap] of Object.entries(columnRenameMap)) {
    const currentCols = existingColsByTable[tableName];
    if (!currentCols) {
      console.log(`⚠ Tabel "${tableName}" tidak ditemukan, dilewati.`);
      continue;
    }

    console.log(`\n--- Memproses tabel: "${tableName}" ---`);
    for (const [oldCol, newCol] of Object.entries(colMap)) {
      if (currentCols.includes(oldCol)) {
        console.log(`  Mengubah kolom: "${tableName}"."${oldCol}" -> "${newCol}"...`);
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "${tableName}" RENAME COLUMN "${oldCol}" TO "${newCol}";`
        );
        console.log(`  ✓ Berhasil: "${oldCol}" -> "${newCol}"`);
      } else if (currentCols.includes(newCol)) {
        console.log(`  ℹ Kolom "${newCol}" sudah menggunakan Bahasa Indonesia.`);
      } else {
        console.log(`  - Kolom "${oldCol}" tidak ditemukan pada "${tableName}".`);
      }
    }
  }

  console.log('\n=== Seluruh Kolom Berhasil Dimigrasi ke Bahasa Indonesia! ===');
}

main()
  .catch((e) => {
    console.error('Terjadi kesalahan:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
