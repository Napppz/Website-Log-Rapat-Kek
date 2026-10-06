'use server';

import { prisma } from '@/lib/prisma';
import { extractTextFromBuffer } from '@/lib/document-parser';
import {
  extractMeetingDocumentSmart,
  ExtractedMeetingData,
  ExtractedActionItem,
} from '@/lib/meeting-extractor';
import { requirePermission } from '@/lib/auth/authorization';
import { getNextMeetingNumber } from '@/lib/sequence';
import { MeetingStatus, ActionItemPriority, ActionItemStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import {
  getNextMeetingId,
  getNextParticipantId,
  getNextMinutesId,
  getNextActionItemId,
} from '@/lib/id-generator';

export interface ParseDocumentResponse {
  success: boolean;
  error?: string;
  data?: ExtractedMeetingData & {
    matchedUserIds: string[];
    availableBiroCodes: string[];
  };
}

/**
 * Server Action: Parse an uploaded meeting document (.pdf, .docx, .txt)
 * and return structured meeting details and minutes.
 */
export async function parseMeetingDocumentAction(
  formData: FormData
): Promise<ParseDocumentResponse> {
  try {
    await requirePermission('create:meeting');

    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'Tidak ada berkas yang dipilih.' };
    }

    // Maximum file size: 15MB
    if (file.size > 15 * 1024 * 1024) {
      return { success: false, error: 'Ukuran berkas melebihi batas maksimum 15MB.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from buffer
    const rawText = await extractTextFromBuffer(buffer, file.name, file.type);
    if (!rawText || rawText.trim().length < 20) {
      return {
        success: false,
        error:
          'Berkas kosong atau teks tidak terbaca. Pastikan berkas dokumen PDF/Word/Teks Anda memuat tulisan yang jelas.',
      };
    }

    // Extract structured data using hybrid NLP & AI
    const extracted = await extractMeetingDocumentSmart(rawText);

    // Match attendees with active users in database
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, biro: { select: { code: true } } },
    });

    const matchedUserIds: string[] = [];
    const attendeesLower = (extracted.attendees + ' ' + (extracted.chairpersonName || '')).toLowerCase();

    for (const u of activeUsers) {
      const uNameLower = u.name.toLowerCase();
      // Check if user's name or primary words appear in attendees text
      if (attendeesLower.includes(uNameLower)) {
        matchedUserIds.push(u.id);
      }
    }

    // Get list of all available biro codes
    const biros = await prisma.biro.findMany({
      where: { isActive: true },
      select: { code: true },
    });
    const availableBiroCodes = biros.map((b) => b.code);

    return {
      success: true,
      data: {
        ...extracted,
        matchedUserIds,
        availableBiroCodes,
      },
    };
  } catch (error: any) {
    console.error('Error parsing meeting document:', error);
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan sistem saat mengekstrak dokumen rapat.',
    };
  }
}

export interface DirectSaveUploadedMeetingInput {
  extracted: ExtractedMeetingData;
  participantUserIds?: string[];
  chairpersonId?: string | null;
  customMeetingNumber?: string | null;
}

/**
 * Server Action: One-Click Direct Save
 * Automatically creates the Meeting, MeetingMinutes, and ActionItems in Neon DB!
 */
export async function directSaveUploadedMeetingAction(
  input: DirectSaveUploadedMeetingInput
) {
  try {
    const currentUser = await requirePermission('create:meeting');
    await requirePermission('create:minutes');
    const isPrivileged =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

    const { extracted, participantUserIds = [], chairpersonId, customMeetingNumber } = input;

    if (!isPrivileged && currentUser.biroCode && extracted.biroCode.toUpperCase() !== currentUser.biroCode.toUpperCase()) {
      return {
        success: false,
        error: `Anda hanya dapat membuat rapat untuk biro Anda sendiri (${currentUser.biroCode}).`,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Resolve Biro
      let primaryBiro = await tx.biro.findUnique({
        where: { code: extracted.biroCode.toUpperCase() },
      });

      if (!primaryBiro) {
        primaryBiro = await tx.biro.findFirst({
          where: { isActive: true },
        });
      }

      if (!primaryBiro) {
        throw new Error('Biro penyelenggara tidak ditemukan di sistem.');
      }

      // 2. Generate Meeting Number
      let finalMeetingNumber = customMeetingNumber?.trim() || extracted.meetingNumber?.trim();
      if (finalMeetingNumber) {
        const existing = await tx.meeting.findUnique({
          where: { meetingNumber: finalMeetingNumber },
        });
        if (existing) {
          // If already taken, generate sequential one
          const seq = await getNextMeetingNumber(primaryBiro.code, tx);
          finalMeetingNumber = seq.meetingNumber;
        }
      } else {
        const seq = await getNextMeetingNumber(primaryBiro.code, tx);
        finalMeetingNumber = seq.meetingNumber;
      }

      // 3. Create Meeting with clean sequential ID
      const nextMeetingId = await getNextMeetingId(tx);
      const meeting = await tx.meeting.create({
        data: {
          id: nextMeetingId,
          meetingNumber: finalMeetingNumber,
          title: extracted.title,
          primaryBiroId: primaryBiro.id,
          date: new Date(extracted.date),
          startTime: extracted.startTime,
          endTime: extracted.endTime,
          location: extracted.location,
          status: MeetingStatus.DRAFT,
          chairpersonId: chairpersonId || null,
        },
      });

      // 4. Create Meeting Participants
      if (participantUserIds && participantUserIds.length > 0) {
        for (const uid of participantUserIds) {
          try {
            const nextPartId = await getNextParticipantId(tx);
            await tx.meetingParticipant.create({
              data: {
                id: nextPartId,
                meetingId: meeting.id,
                userId: uid,
              },
            });
          } catch {
            // Ignore duplicates
          }
        }
      }

      // 5. Create Meeting Minutes (Notula)
      const minutesPayload = {
        meetingId: meeting.id,
        agenda: extracted.agendaJson as any,
        discussion: extracted.discussionJson as any,
        decisions: {
          ...(extracted.decisionsJson as any),
          signerName: extracted.secretaryName || 'Sri Aurelia Rosyana Hari Habyby',
          signerRole: 'Pranata Hubungan Masyarakat Terampil',
          chairpersonName:
            extracted.chairpersonName ||
            'Wakil Ketua II, Tim Pelaksana Dewan Nasional KEK',
          documentNumber: meeting.meetingNumber,
          invitationNumber: extracted.meetingNumber || '-',
        },
        conclusion: {
          ...(extracted.conclusionJson as any),
          signerName: extracted.secretaryName || 'Sri Aurelia Rosyana Hari Habyby',
          signerRole: 'Pranata Hubungan Masyarakat Terampil',
          chairpersonName:
            extracted.chairpersonName ||
            'Wakil Ketua II, Tim Pelaksana Dewan Nasional KEK',
          documentNumber: meeting.meetingNumber,
          invitationNumber: extracted.meetingNumber || '-',
        },
      };

      const nextMinutesId = await getNextMinutesId(tx);
      await tx.meetingMinutes.create({
        data: {
          id: nextMinutesId,
          ...minutesPayload,
        },
      });

      // 6. Create Action Items
      if (extracted.actionItems && extracted.actionItems.length > 0) {
        const allBiros = await tx.biro.findMany();
        const biroMap = new Map(allBiros.map((b) => [b.code.toUpperCase(), b.id]));

        for (const item of extracted.actionItems) {
          const targetBiroId =
            biroMap.get(item.picBiroCode.toUpperCase()) || primaryBiro.id;

          let prio: ActionItemPriority = ActionItemPriority.MEDIUM;
          if (item.priority === 'URGENT') prio = ActionItemPriority.URGENT;
          else if (item.priority === 'HIGH') prio = ActionItemPriority.HIGH;
          else if (item.priority === 'LOW') prio = ActionItemPriority.LOW;

          const nextActionId = await getNextActionItemId(tx);
          await tx.actionItem.create({
            data: {
              id: nextActionId,
              meetingId: meeting.id,
              title: item.title,
              description: item.description || null,
              picBiroId: targetBiroId,
              dueDate: new Date(item.dueDate),
              status: ActionItemStatus.PENDING,
              priority: prio,
            },
          });
        }
      }

      return meeting;
    });

    try {
      revalidatePath('/');
      revalidatePath('/semua-rapat');
      revalidatePath(`/semua-rapat/${result.id}`);
      revalidatePath('/tindak-lanjut');
    } catch {}

    return {
      success: true,
      data: {
        id: result.id,
        meetingNumber: result.meetingNumber,
        title: result.title,
      },
    };
  } catch (error: any) {
    console.error('Error creating meeting from uploaded document:', error);
    return {
      success: false,
      error: error?.message || 'Gagal menyimpan rapat dari berkas yang diunggah.',
    };
  }
}

/**
 * Server Action: Attach extracted minutes and action items to a specific meeting
 */
export async function saveMinutesAndActionsToMeetingAction(
  meetingId: string,
  extracted: ExtractedMeetingData
) {
  try {
    const currentUser = await requirePermission('create:minutes');
    const isPrivileged =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { primaryBiro: true },
    });

    if (!meeting) {
      return { success: false, error: 'Rapat tidak ditemukan.' };
    }

    if (!isPrivileged && currentUser.biroCode && meeting.primaryBiro.code.toUpperCase() !== currentUser.biroCode.toUpperCase()) {
      return {
        success: false,
        error: 'Anda hanya dapat mengaitkan notula/tindak lanjut untuk rapat biro Anda sendiri.',
      };
    }

    // 1. Upsert Meeting Minutes
    const minutesPayload = {
      agenda: extracted.agendaJson as any,
      discussion: extracted.discussionJson as any,
      decisions: {
        ...(extracted.decisionsJson as any),
        signerName: extracted.secretaryName || 'Sri Aurelia Rosyana Hari Habyby',
        signerRole: 'Pranata Hubungan Masyarakat Terampil',
        chairpersonName:
          extracted.chairpersonName ||
          'Wakil Ketua II, Tim Pelaksana Dewan Nasional KEK',
        documentNumber: meeting.meetingNumber,
        invitationNumber: extracted.meetingNumber || '-',
      },
      conclusion: {
        ...(extracted.conclusionJson as any),
        signerName: extracted.secretaryName || 'Sri Aurelia Rosyana Hari Habyby',
        signerRole: 'Pranata Hubungan Masyarakat Terampil',
        chairpersonName:
          extracted.chairpersonName ||
          'Wakil Ketua II, Tim Pelaksana Dewan Nasional KEK',
        documentNumber: meeting.meetingNumber,
        invitationNumber: extracted.meetingNumber || '-',
      },
    };

    const nextUpsertMinId = await getNextMinutesId();
    await prisma.meetingMinutes.upsert({
      where: { meetingId },
      create: {
        id: nextUpsertMinId,
        meetingId,
        ...minutesPayload,
      },
      update: {
        ...minutesPayload,
      },
    });

    // 2. Create Action Items if any
    if (extracted.actionItems && extracted.actionItems.length > 0) {
      const allBiros = await prisma.biro.findMany();
      const biroMap = new Map(allBiros.map((b) => [b.code.toUpperCase(), b.id]));

      for (const item of extracted.actionItems) {
        const targetBiroId =
          biroMap.get(item.picBiroCode.toUpperCase()) || meeting.primaryBiroId;

        let prio: ActionItemPriority = ActionItemPriority.MEDIUM;
        if (item.priority === 'URGENT') prio = ActionItemPriority.URGENT;
        else if (item.priority === 'HIGH') prio = ActionItemPriority.HIGH;
        else if (item.priority === 'LOW') prio = ActionItemPriority.LOW;

        const nextActId = await getNextActionItemId();
        await prisma.actionItem.create({
          data: {
            id: nextActId,
            meetingId: meeting.id,
            title: item.title,
            description: item.description || null,
            picBiroId: targetBiroId,
            dueDate: new Date(item.dueDate),
            status: ActionItemStatus.PENDING,
            priority: prio,
          },
        });
      }
    }

    try {
      revalidatePath('/');
      revalidatePath('/semua-rapat');
      revalidatePath(`/semua-rapat/${meetingId}`);
      revalidatePath('/tindak-lanjut');
    } catch {}

    return { success: true };
  } catch (error: any) {
    console.error('Error attaching minutes to meeting:', error);
    return {
      success: false,
      error: error?.message || 'Gagal menyimpan naskah notula ke rapat.',
    };
  }
}

