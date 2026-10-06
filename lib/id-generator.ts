import { prisma } from './prisma';

/**
 * Utility to generate human-readable, sequential IDs for database entities.
 * Ensures all IDs in Neon PostgreSQL follow institutional standards:
 * - Rapat: MTG-001, MTG-002, ...
 * - Tindak Lanjut: ACT-001, ACT-002, ...
 * - Notulen: NOT-001, NOT-002, ...
 * - Peserta: PRT-001, PRT-002, ...
 * - Pengguna / Guest: USR-001, USR-002, ...
 * - Tim Biro: TIM-001, TIM-002, ...
 * - Notifikasi: NTF-001, NTF-002, ...
 * - Riwayat Tindak Lanjut: LOG-001, LOG-002, ...
 * - Riwayat Notulen: HST-001, HST-002, ...
 * - Komentar Notulen: CMT-001, CMT-002, ...
 */

type DbClient = typeof prisma | any;

async function getNextFormattedId(
  client: DbClient,
  tableName: string,
  idColumn: string,
  prefix: string,
  padLength = 3
): Promise<string> {
  const db = client || prisma;
  const rawRows: any[] = await db.$queryRawUnsafe(
    `SELECT "${idColumn}" AS id FROM "${tableName}" WHERE "${idColumn}" LIKE '${prefix}%';`
  );

  let maxNum = 0;
  for (const row of rawRows) {
    if (typeof row.id === 'string' && row.id.startsWith(prefix)) {
      const numPart = parseInt(row.id.substring(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(padLength, '0')}`;
}

export async function getNextMeetingId(tx?: any): Promise<string> {
  return getNextFormattedId(tx, 'rapat', 'id_rapat', 'MTG-');
}

export async function getNextActionItemId(tx?: any): Promise<string> {
  return getNextFormattedId(tx, 'tindak_lanjut', 'id_tindak_lanjut', 'ACT-');
}

export async function getNextMinutesId(tx?: any): Promise<string> {
  return getNextFormattedId(tx, 'notulen_rapat', 'id_notulen', 'NOT-');
}

export async function getNextParticipantId(tx?: any): Promise<string> {
  return getNextFormattedId(tx, 'peserta_rapat', 'id_peserta', 'PRT-');
}

export async function getNextUserId(tx?: any): Promise<string> {
  return getNextFormattedId(tx, 'pengguna', 'id_pengguna', 'USR-');
}

export async function getNextTeamId(tx?: any): Promise<string> {
  return getNextFormattedId(tx, 'tim_biro', 'id_tim', 'TIM-');
}

export async function getNextNotificationId(tx?: any): Promise<string> {
  return getNextFormattedId(tx, 'notifikasi', 'id_notifikasi', 'NTF-');
}

export async function getNextActionItemLogId(tx?: any): Promise<string> {
  return getNextFormattedId(tx, 'riwayat_tindak_lanjut', 'id_riwayat', 'LOG-');
}

export async function getNextMinutesHistoryId(tx?: any): Promise<string> {
  return getNextFormattedId(tx, 'riwayat_notulen', 'id_riwayat', 'HST-');
}

export async function getNextCommentId(tx?: any): Promise<string> {
  return getNextFormattedId(tx, 'komentar_notulen', 'id_komentar', 'CMT-');
}
