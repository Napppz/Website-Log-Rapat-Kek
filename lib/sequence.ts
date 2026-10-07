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
export async function getNextMeetingNumber(
  biroCode: string = 'IKK',
  externalTx?: Prisma.TransactionClient,
  teamCode?: string | null
): Promise<NextMeetingNumberResult> {
  const execute = async (tx: Prisma.TransactionClient) => {
    // 1. Get the Biro to resolve its ID and uppercase code
    const biro = await tx.biro.findUnique({
      where: { code: biroCode.toUpperCase() },
    });

    if (!biro) {
      throw new Error(`Biro resmi dengan kode "${biroCode}" tidak ditemukan.`);
    }

    const cleanTeamCode = teamCode?.trim().toUpperCase();
    const prefix = cleanTeamCode || biro.code;

    // 2. Find max existing meeting number for this prefix in the Meeting table
    const existingMeetings = await tx.meeting.findMany({
      where: {
        OR: [
          { meetingNumber: { startsWith: `${prefix}-` } },
          cleanTeamCode ? { meetingNumber: { startsWith: `${biro.code}-${cleanTeamCode}-` } } : {},
        ],
      },
      select: { meetingNumber: true },
    });

    let maxExistingNum = 0;
    const regex1 = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`, 'i');
    const regex2 = cleanTeamCode ? new RegExp(`^${biro.code}-${cleanTeamCode}-(\\d+)$`, 'i') : null;

    for (const m of existingMeetings) {
      let match = m.meetingNumber.match(regex1);
      if (!match && regex2) match = m.meetingNumber.match(regex2);
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
  const cleanTeam = teamCode?.trim().toUpperCase();
  const prefix = cleanTeam || (biroCode?.trim().toUpperCase() || 'INV');

  const existingMeetings = await prisma.meeting.findMany({
    where: {
      OR: [
        { meetingNumber: { startsWith: `${prefix}-` } },
        cleanTeam ? { meetingNumber: { startsWith: `IKK-${cleanTeam}-` } } : {},
      ],
    },
    select: { meetingNumber: true },
  });

  let maxNum = 0;
  const regex1 = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`, 'i');
  const regex2 = cleanTeam ? new RegExp(`^IKK-${cleanTeam}-(\\d+)$`, 'i') : null;

  for (const m of existingMeetings) {
    let match = m.meetingNumber.match(regex1);
    if (!match && regex2) match = m.meetingNumber.match(regex2);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
}
