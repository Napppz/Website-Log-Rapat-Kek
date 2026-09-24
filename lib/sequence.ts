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
  biroCode: string,
  externalTx?: Prisma.TransactionClient
): Promise<NextMeetingNumberResult> {
  const execute = async (tx: Prisma.TransactionClient) => {
    // 1. Get the Biro to resolve its ID and uppercase code
    const biro = await tx.biro.findUnique({
      where: { code: biroCode.toUpperCase() },
    });

    if (!biro) {
      throw new Error(`Biro resmi dengan kode "${biroCode}" tidak ditemukan.`);
    }

    // 2. Find max existing meeting number for this biro in the Meeting table
    const existingMeetings = await tx.meeting.findMany({
      where: {
        OR: [
          { primaryBiroId: biro.id },
          { meetingNumber: { startsWith: `${biro.code}-` } },
        ],
      },
      select: { meetingNumber: true },
    });

    let maxExistingNum = 0;
    for (const m of existingMeetings) {
      const match = m.meetingNumber.match(new RegExp(`^${biro.code}-(\\d+)$`, 'i'));
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxExistingNum) {
          maxExistingNum = num;
        }
      }
    }

    // 3. Atomically increment sequence or initialize if first meeting
    let sequence = await tx.biroMeetingSequence.upsert({
      where: { biroId: biro.id },
      create: {
        biroId: biro.id,
        currentNumber: maxExistingNum + 1,
      },
      update: {
        currentNumber: {
          increment: 1,
        },
      },
    });

    // If the sequence was behind maxExistingNum, bump it past maxExistingNum
    if (sequence.currentNumber <= maxExistingNum) {
      sequence = await tx.biroMeetingSequence.update({
        where: { biroId: biro.id },
        data: { currentNumber: maxExistingNum + 1 },
      });
    }

    // Safety loop to ensure uniqueness even if there were gaps or existing records
    while (
      await tx.meeting.findUnique({
        where: { meetingNumber: `${biro.code}-${String(sequence.currentNumber).padStart(3, '0')}` },
      })
    ) {
      sequence = await tx.biroMeetingSequence.update({
        where: { biroId: biro.id },
        data: { currentNumber: { increment: 1 } },
      });
    }

    const paddedNumber = String(sequence.currentNumber).padStart(3, '0');
    const meetingNumber = `${biro.code}-${paddedNumber}`;

    return {
      meetingNumber,
      sequenceNumber: sequence.currentNumber,
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
