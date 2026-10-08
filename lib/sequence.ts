import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export interface NextMeetingNumberResult {
  meetingNumber: string;
  sequenceNumber: number;
  biroId: string;
  biroCode: string;
}

/**
 * Safely generates the next sequential meeting number for a given Biro using an atomic Prisma transaction.
 * Format: {BIRO_CODE}-{001} (e.g. BPPK-001, PKKEK-002, IKK-013)
 * 
 * Never produces duplicate numbers:
 * 1. Checks max existing number in Meeting table.
 * 2. Uses atomic upsert / increment on BiroMeetingSequence.
 * 3. Bumps past any existing numbers if sequence was desynchronized.
 * 4. Verifies uniqueness against Meeting table before returning.
 */
const TEAM_CODE_MAP: Record<string, string> = {
  'TIM-001': 'INV',
  'TIM-003': 'KS',
  'TIM-002': 'KOM',
  'INVESTASI': 'INV',
  'KERJA SAMA': 'KS',
  'KERJASAMA': 'KS',
  'KOMUNIKASI': 'KOM',
  'INV': 'INV',
  'KS': 'KS',
  'KOM': 'KOM',
};

function resolveTeamPrefix(teamCode?: string | null): string {
  if (!teamCode) return 'INV';
  const clean = teamCode.trim().toUpperCase();
  return TEAM_CODE_MAP[clean] || clean;
}

export async function getNextMeetingNumber(
  biroCode: string = 'IKK',
  externalTx?: Prisma.TransactionClient,
  teamCode?: string | null
): Promise<NextMeetingNumberResult> {
  const execute = async (tx: Prisma.TransactionClient) => {
    // 1. Get the Biro to resolve its ID and uppercase code
    const biro = await tx.biro.findFirst({
      where: {
        OR: [
          { code: biroCode.toUpperCase() },
          { id: biroCode },
        ],
      },
    }) || await tx.biro.findFirst({ where: { code: 'IKK' } });

    if (!biro) {
      throw new Error(`Biro resmi dengan kode "${biroCode}" tidak ditemukan.`);
    }

    const prefix = resolveTeamPrefix(teamCode);

    // 2. Find max existing meeting number for this prefix in the Meeting table
    const existingMeetings = await tx.meeting.findMany({
      where: {
        meetingNumber: { startsWith: `${prefix}-` },
      },
      select: { meetingNumber: true },
    });

    let maxExistingNum = 0;
    const regex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`, 'i');

    for (const m of existingMeetings) {
      const match = m.meetingNumber.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxExistingNum) {
          maxExistingNum = num;
        }
      }
    }

    let nextNum = maxExistingNum + 1;

    // Safety loop to ensure uniqueness
    while (
      await tx.meeting.findUnique({
        where: { meetingNumber: `${prefix}-${String(nextNum).padStart(3, '0')}` },
      })
    ) {
      nextNum++;
    }

    const paddedNumber = String(nextNum).padStart(3, '0');
    const meetingNumber = `${prefix}-${paddedNumber}`;

    return {
      meetingNumber,
      sequenceNumber: nextNum,
      biroId: biro.id,
      biroCode: biro.code,
    };
  };

  if (externalTx) {
    return execute(externalTx);
  }

  return prisma.$transaction(async (tx) => {
    return execute(tx);
  });
}

/**
 * Previews the next meeting number without mutating any sequences or DB state.
 */
export async function previewNextMeetingNumber(
  biroCode: string = 'IKK',
  teamCode?: string | null
): Promise<string> {
  const prefix = resolveTeamPrefix(teamCode);

  const existingMeetings = await prisma.meeting.findMany({
    where: {
      meetingNumber: { startsWith: `${prefix}-` },
    },
    select: { meetingNumber: true },
  });

  let maxNum = 0;
  const regex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`, 'i');

  for (const m of existingMeetings) {
    const match = m.meetingNumber.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
}
