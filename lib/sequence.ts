import { Prisma, PrismaClient } from '@prisma/client';
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
 * Never uses COUNT(meeting) + 1.
 * Uses atomic upsert / increment on BiroMeetingSequence to guarantee concurrency safety and zero duplicate numbers.
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

    // 2. Safely increment sequence or initialize if first meeting
    const sequence = await tx.biroMeetingSequence.upsert({
      where: { biroId: biro.id },
      create: {
        biroId: biro.id,
        currentNumber: 1,
      },
      update: {
        currentNumber: {
          increment: 1,
        },
      },
    });

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
