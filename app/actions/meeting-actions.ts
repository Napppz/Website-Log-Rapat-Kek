'use server';

import { prisma } from '@/lib/prisma';
import { getNextMeetingNumber } from '@/lib/sequence';
import { getMeetingByIdFromDb } from '@/lib/db-service';
import { MeetingStatus, AttendanceStatus, UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requirePermission, requireAuth, getCurrentUser } from '@/lib/auth/authorization';
import { extractPlainText } from '@/lib/pdf/pdf-utils';
import { getNextMeetingId, getNextUserId, getNextParticipantId } from '@/lib/id-generator';

export interface CreateMeetingInput {
  title: string;
  biroCode: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  involvedBiroCodes?: string[];
  attendees?: string;
  participantUserIds?: string[];
  previousMeetingId?: string | null;
  chairpersonId?: string | null;
  meetingNumber?: string | null;
  primaryTeamId?: string | null;
}

function safeRevalidate(paths: string[]) {
  try {
    for (const p of paths) {
      revalidatePath(p);
      revalidatePath(p, 'page');
    }
    revalidatePath('/', 'layout');
  } catch {
    // Suppress Next.js static store missing errors when run in scripts
  }
}

/**
 * Server Action: Get active users for participant selection
 */
export async function getActiveUsersAction() {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        biro: {
          select: {
            id: true,
            code: true,
            name: true,
            shortName: true,
          },
        },
      },
      orderBy: [{ biro: { code: 'asc' } }, { name: 'asc' }],
    });
    return { success: true, data: users };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal memuat pengguna' };
  }
}

/**
 * Server action to create a new meeting in Neon PostgreSQL
 * with concurrency-safe, transactionally incremented meeting numbers,
 * and automatic participant association.
 */
export async function createMeetingAction(input: CreateMeetingInput) {
  try {
    // Authorization Check: Must have 'create:meeting' permission (SUPER_ADMIN, ADMIN, NOTULIS)
    const currentUser = await requirePermission('create:meeting');
    const isPrivileged =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

    // Bureau Scoping: Non-admin users can only create meetings for their own bureau
    if (!isPrivileged && currentUser.biroCode && input.biroCode.toUpperCase() !== currentUser.biroCode.toUpperCase()) {
      return {
        success: false,
        error: `Anda hanya dapat menjadwalkan rapat untuk biro Anda sendiri (${currentUser.biroCode}).`,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate sequence atomically or use custom meetingNumber if provided (and not '-' or empty)
      let finalMeetingNumber = input.meetingNumber?.trim();
      if (finalMeetingNumber && finalMeetingNumber !== '-' && finalMeetingNumber !== '—') {
        const existing = await tx.meeting.findUnique({
          where: { meetingNumber: finalMeetingNumber },
        });
        if (existing) {
          throw new Error(
            `Nomor surat / undangan "${finalMeetingNumber}" sudah digunakan oleh rapat lain. Silakan gunakan nomor lain atau kosongkan untuk penomoran otomatis.`
          );
        }
      } else {
        const seq = await getNextMeetingNumber(input.biroCode, tx);
        finalMeetingNumber = seq.meetingNumber;
      }

      // 2. Find primary biro
      const primaryBiro = await tx.biro.findUnique({
        where: { code: input.biroCode.toUpperCase() },
      });

      if (!primaryBiro) {
        throw new Error(`Biro ${input.biroCode} tidak ditemukan.`);
      }

      // 3. Create meeting record with clean sequential ID
      const nextMeetingId = await getNextMeetingId(tx);
      const meeting = await tx.meeting.create({
        data: {
          id: nextMeetingId,
          meetingNumber: finalMeetingNumber,
          title: input.title,
          primaryBiroId: primaryBiro.id,
          primaryTeamId: input.primaryTeamId || null,
          date: new Date(input.date),
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location,
          status: MeetingStatus.DRAFT,
          previousMeetingId: input.previousMeetingId || null,
          chairpersonId: input.chairpersonId || null,
        },
      });

      // 4. Attach involved bureaus (MeetingBiro)
      if (input.involvedBiroCodes && input.involvedBiroCodes.length > 0) {
        for (const invCode of input.involvedBiroCodes) {
          const invBiro = await tx.biro.findUnique({
            where: { code: invCode.toUpperCase() },
          });
          if (invBiro && invBiro.id !== primaryBiro.id) {
            await tx.meetingBiro.create({
              data: {
                meetingId: meeting.id,
                biroId: invBiro.id,
              },
            });
          }
        }
      }

      // 5. Attach participants (MeetingParticipant)
      const targetUserIds = new Set<string>();

      // 5a. Direct user IDs from multi-selector
      if (input.participantUserIds && input.participantUserIds.length > 0) {
        for (const uid of input.participantUserIds) {
          if (uid) targetUserIds.add(uid);
        }
      }

      // 5b. Attendee names / emails / comma-separated string
      if (input.attendees && input.attendees.trim().length > 0) {
        const rawNames = input.attendees
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        if (rawNames.length > 0) {
          const allUsers = await tx.user.findMany({
            where: { isActive: true },
            select: { id: true, name: true, email: true },
          });

          for (const name of rawNames) {
            const lowerName = name.toLowerCase();
            const matchedUser = allUsers.find(
              (u) =>
                u.name.toLowerCase() === lowerName ||
                u.email.toLowerCase() === lowerName ||
                u.name.toLowerCase().includes(lowerName) ||
                lowerName.includes(u.name.toLowerCase())
            );

            if (matchedUser) {
              targetUserIds.add(matchedUser.id);
            } else {
              const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '.')
                .replace(/\.+/g, '.')
                .slice(0, 25);
              const uniqueEmail = `${slug || 'peserta'}.${Date.now().toString(36)}.${Math.random().toString(36).substring(2, 6)}@peserta.kek.go.id`;

              const nextGuestId = await getNextUserId(tx);
              const guest = await tx.user.create({
                data: {
                  id: nextGuestId,
                  name: name,
                  email: uniqueEmail,
                  role: 'VIEWER',
                  biroId: primaryBiro.id,
                  isActive: true,
                },
              });
              targetUserIds.add(guest.id);
            }
          }
        }
      }

      // 5c. Fallback: If still no participants specified, attach active users from primary biro
      if (targetUserIds.size === 0) {
        const defaultBiroUsers = await tx.user.findMany({
          where: { biroId: primaryBiro.id, isActive: true },
          take: 2,
          select: { id: true },
        });
        for (const u of defaultBiroUsers) {
          targetUserIds.add(u.id);
        }
      }

      // Create MeetingParticipant records with clean sequential IDs
      for (const uid of targetUserIds) {
        const nextPartId = await getNextParticipantId(tx);
        await tx.meetingParticipant.create({
          data: {
            id: nextPartId,
            meetingId: meeting.id,
            userId: uid,
            attendanceStatus: 'INVITED',
          },
        });
      }

      return {
        meetingNumber: finalMeetingNumber,
        id: meeting.id,
        title: meeting.title,
        participantCount: targetUserIds.size,
      };
    });

    safeRevalidate([
      '/',
      '/semua-rapat',
      `/biro/${input.biroCode.toLowerCase()}`,
    ]);

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return { success: false, error: error?.message || 'Gagal membuat rapat' };
  }
}

/**
 * Server action to update meeting status (DRAFT, REVIEW, APPROVED, FINAL)
 */
export async function updateMeetingStatusAction(meetingId: string, status: MeetingStatus) {
  try {
    // Authorization Check: SUPER_ADMIN, ADMIN, and STAFF can update status
    const currentUser = await requireAuth();
    const allowedRoles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'STAFF'];
    if (!allowedRoles.includes(currentUser.role)) {
      return {
        success: false,
        error: 'Forbidden: Peran pengguna Anda tidak memiliki izin untuk mengubah status rapat.',
      };
    }
    const isPrivileged =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

    const existing = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { primaryBiro: true },
    });
    if (!existing) {
      return { success: false, error: 'Rapat tidak ditemukan.' };
    }

    if (!isPrivileged) {
      const isSameBiro =
        (currentUser.biroId && existing.primaryBiroId === currentUser.biroId) ||
        (currentUser.biroCode && existing.primaryBiro.code.toUpperCase() === currentUser.biroCode.toUpperCase());

      if (!isSameBiro) {
        return {
          success: false,
          error: 'Anda hanya dapat memperbarui status rapat biro Anda sendiri.',
        };
      }
    }

    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: { status },
      include: { primaryBiro: true },
    });

    safeRevalidate([
      '/',
      '/semua-rapat',
      `/semua-rapat/${meetingId}`,
      `/rapat/${meetingId}`,
      `/biro/${updated.primaryBiro.code.toLowerCase()}`,
    ]);

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error updating meeting status:', error);
    return { success: false, error: error?.message || 'Gagal memperbarui status rapat' };
  }
}

/**
 * Server action to update meeting number / invitation letter number
 */
export async function updateMeetingNumberAction(meetingId: string, newMeetingNumber: string) {
  try {
    // Authorization Check: Must have 'edit:meeting' permission (SUPER_ADMIN, ADMIN, NOTULIS)
    const currentUser = await requirePermission('edit:meeting');
    const isPrivileged =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { primaryBiro: true },
    });
    if (!existingMeeting) {
      return { success: false, error: 'Rapat tidak ditemukan.' };
    }

    if (!isPrivileged && currentUser.biroCode && existingMeeting.primaryBiro.code.toUpperCase() !== currentUser.biroCode.toUpperCase()) {
      return {
        success: false,
        error: 'Anda hanya dapat memperbarui nomor rapat biro Anda sendiri.',
      };
    }

    const trimmed = newMeetingNumber.trim();
    if (!trimmed) {
      return { success: false, error: 'Nomor surat / undangan tidak boleh kosong.' };
    }

    // Check if newMeetingNumber is already used by another meeting
    const existing = await prisma.meeting.findFirst({
      where: {
        meetingNumber: trimmed,
        id: { not: meetingId },
      },
    });

    if (existing) {
      return {
        success: false,
        error: `Nomor surat/undangan "${trimmed}" sudah digunakan oleh rapat lain.`,
      };
    }

    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: { meetingNumber: trimmed },
      include: { primaryBiro: true },
    });

    safeRevalidate([
      '/',
      '/semua-rapat',
      `/semua-rapat/${meetingId}`,
      `/rapat/${meetingId}`,
      `/biro/${updated.primaryBiro.code.toLowerCase()}`,
    ]);

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Failed to update meeting number:', error);
    return { success: false, error: error?.message || 'Gagal mengubah nomor surat/undangan' };
  }
}

/**
 * Server action to update a participant's attendance status (INVITED, PRESENT, ABSENT, EXCUSED)
 */
export async function updateParticipantAttendanceAction(
  participantId: string,
  attendanceStatus: AttendanceStatus
) {
  try {
    // Authorization Check: Must have 'manage:participants' permission (SUPER_ADMIN, ADMIN, NOTULIS)
    await requirePermission('manage:participants');

    const updated = await prisma.meetingParticipant.update({
      where: { id: participantId },
      data: { attendanceStatus },
      include: {
        meeting: true,
        user: { include: { biro: true } },
      },
    });

    safeRevalidate([
      `/semua-rapat/${updated.meetingId}`,
      `/rapat/${updated.meetingId}`,
      '/semua-rapat',
      '/',
    ]);

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error updating participant attendance:', error);
    return { success: false, error: error?.message || 'Gagal memperbarui status kehadiran' };
  }
}

export interface AddParticipantInput {
  userId?: string;
  customName?: string;
  customEmail?: string;
  biroId?: string;
  attendanceStatus?: AttendanceStatus;
}

/**
 * Server action to add a new participant to an existing meeting
 * Supports both registered users and unregistered officials/guests
 */
export async function addParticipantToMeetingAction(
  meetingId: string,
  userIdOrInput: string | AddParticipantInput,
  attendanceStatus: AttendanceStatus = 'INVITED'
) {
  try {
    await requirePermission('manage:participants');

    let targetUserId: string;
    let finalStatus: AttendanceStatus = attendanceStatus;

    if (typeof userIdOrInput === 'string') {
      targetUserId = userIdOrInput;
    } else {
      finalStatus = userIdOrInput.attendanceStatus || attendanceStatus;

      if (userIdOrInput.userId) {
        targetUserId = userIdOrInput.userId;
      } else if (userIdOrInput.customName && userIdOrInput.customName.trim()) {
        const trimmedName = userIdOrInput.customName.trim();

        // Find meeting to resolve default biro
        const meeting = await prisma.meeting.findUnique({
          where: { id: meetingId },
          select: { primaryBiroId: true },
        });

        if (!meeting) {
          throw new Error('Rapat tidak ditemukan');
        }

        // Check if user already exists by name or email
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { name: { equals: trimmedName, mode: 'insensitive' as const } },
              ...(userIdOrInput.customEmail
                ? [{ email: { equals: userIdOrInput.customEmail.trim(), mode: 'insensitive' as const } }]
                : []),
            ],
          },
        });

        if (existingUser) {
          targetUserId = existingUser.id;
        } else {
          const slug = trimmedName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '.')
            .replace(/\.+/g, '.')
            .slice(0, 25);
          const uniqueEmail =
            userIdOrInput.customEmail?.trim() ||
            `${slug || 'peserta'}.${Date.now().toString(36)}.${Math.random().toString(36).substring(2, 6)}@peserta.kek.go.id`;

          const nextGuestUserId = await getNextUserId();
          const guestUser = await prisma.user.create({
            data: {
              id: nextGuestUserId,
              name: trimmedName,
              email: uniqueEmail,
              role: 'VIEWER',
              biroId: userIdOrInput.biroId || meeting.primaryBiroId,
              isActive: true,
            },
          });
          targetUserId = guestUser.id;
        }
      } else {
        throw new Error('Nama peserta atau ID pengguna harus diisi');
      }
    }

    const nextPartUpsertId = await getNextParticipantId();
    const participant = await prisma.meetingParticipant.upsert({
      where: {
        meetingId_userId: {
          meetingId,
          userId: targetUserId,
        },
      },
      create: {
        id: nextPartUpsertId,
        meetingId,
        userId: targetUserId,
        attendanceStatus: finalStatus,
      },
      update: {
        attendanceStatus: finalStatus,
      },
      include: {
        user: { include: { biro: true } },
      },
    });

    safeRevalidate([
      `/semua-rapat/${meetingId}`,
      `/rapat/${meetingId}`,
      '/semua-rapat',
      '/',
    ]);

    return { success: true, data: participant };
  } catch (error: any) {
    console.error('Error adding participant to meeting:', error);
    return { success: false, error: error?.message || 'Gagal menambahkan peserta' };
  }
}

/**
 * Server action to remove a participant from a meeting
 */
export async function removeParticipantFromMeetingAction(participantId: string) {
  try {
    await requirePermission('manage:participants');

    const deleted = await prisma.meetingParticipant.delete({
      where: { id: participantId },
    });

    safeRevalidate([
      `/semua-rapat/${deleted.meetingId}`,
      `/rapat/${deleted.meetingId}`,
      '/semua-rapat',
      '/',
    ]);

    return { success: true };
  } catch (error: any) {
    console.error('Error removing participant from meeting:', error);
    return { success: false, error: error?.message || 'Gagal menghapus peserta' };
  }
}

/**
 * Server action to delete meeting (Cascades to minutes, action items, participants)
 */
export async function deleteMeetingAction(meetingId: string) {
  try {
    // Authorization Check: Must have 'delete:meeting' permission (SUPER_ADMIN, ADMIN)
    const currentUser = await requirePermission('delete:meeting');
    const isPrivileged =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { primaryBiro: true },
    });

    if (!meeting) {
      throw new Error('Rapat tidak ditemukan.');
    }

    if (!isPrivileged && currentUser.biroCode && meeting.primaryBiro.code.toUpperCase() !== currentUser.biroCode.toUpperCase()) {
      return {
        success: false,
        error: 'Anda hanya dapat menghapus rapat milik biro Anda sendiri.',
      };
    }

    // 1. Explicitly delete child relations for maximum reliability across database drivers
    await prisma.actionItem.deleteMany({ where: { meetingId } });
    await prisma.meetingMinutes.deleteMany({ where: { meetingId } });
    await prisma.meetingParticipant.deleteMany({ where: { meetingId } });
    await prisma.meetingBiro.deleteMany({ where: { meetingId } });

    // 2. Delete the meeting record
    await prisma.meeting.delete({
      where: { id: meetingId },
    });

    safeRevalidate([
      '/',
      '/semua-rapat',
      '/kalender',
      '/dokumen',
      '/tindak-lanjut',
      '/laporan',
      `/biro/${meeting.primaryBiro.code.toLowerCase()}`,
    ]);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting meeting:', error);
    return { success: false, error: error?.message || 'Gagal menghapus rapat' };
  }
}

/**
 * Server action to delete ALL meetings (SUPER_ADMIN or ADMIN only)
 * Completely clears all meetings, minutes, action items, attendee records, and resets biro sequence counters.
 */
export async function deleteAllMeetingsAction() {
  try {
    const currentUser = await requirePermission('delete:meeting');
    if (currentUser.role !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: 'Hanya Super Admin yang berwenang untuk menghapus seluruh data rapat.',
      };
    }

    const totalCount = await prisma.meeting.count();

    // 1. Explicitly delete child relations for maximum reliability across database drivers
    await prisma.actionItem.deleteMany({});
    await prisma.meetingMinutes.deleteMany({});
    await prisma.meetingParticipant.deleteMany({});
    await prisma.meetingBiro.deleteMany({});

    // 2. Delete all meetings
    await prisma.meeting.deleteMany({});

    // 3. Reset sequence counters for all biros back to 0
    await prisma.biroMeetingSequence.updateMany({
      data: { currentNumber: 0 },
    });

    safeRevalidate([
      '/',
      '/semua-rapat',
      '/tindak-lanjut',
      '/kalender',
      '/dokumen',
      '/laporan',
      '/biro/bppk',
      '/biro/pkkek',
      '/biro/ikk',
      '/biro/hsdmo',
      '/biro/uk',
    ]);

    return { success: true, count: totalCount };
  } catch (error: any) {
    console.error('Error deleting all meetings:', error);
    return { success: false, error: error?.message || 'Gagal menghapus seluruh data rapat' };
  }
}

/**
 * Server action to link or unlink a previous meeting (Rapat Rujukan / Lanjutan)
 */
export async function linkPreviousMeetingAction(
  meetingId: string,
  previousMeetingId: string | null
) {
  try {
    await requirePermission('edit:meeting');
    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: { previousMeetingId },
      include: {
        previousMeeting: {
          include: {
            primaryBiro: true,
            chairperson: true,
            secretary: true,
            minutes: true,
            actionItems: {
              include: { picBiro: true, picUser: true },
              orderBy: [{ dueDate: 'asc' }],
            },
          },
        },
      },
    });

    safeRevalidate([
      `/semua-rapat/${meetingId}`,
      '/semua-rapat',
      '/',
    ]);

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error linking previous meeting:', error);
    return { success: false, error: error?.message || 'Gagal menautkan rapat sebelumnya' };
  }
}

/**
 * Server action to get meeting list options for linking a previous meeting
 */
export async function getMeetingOptionsAction(excludeMeetingId?: string) {
  try {
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch { }

    const isPrivileged =
      currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

    const where: any = excludeMeetingId ? { id: { not: excludeMeetingId } } : {};

    if (!isPrivileged && currentUser?.biroCode) {
      where.OR = [
        { primaryBiro: { code: currentUser.biroCode.toUpperCase() } },
        { meetingBiros: { some: { biro: { code: currentUser.biroCode.toUpperCase() } } } },
      ];
    }

    const meetings = await prisma.meeting.findMany({
      where,
      select: {
        id: true,
        meetingNumber: true,
        title: true,
        date: true,
        status: true,
        primaryBiro: { select: { code: true, shortName: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
    return { success: true, data: meetings };
  } catch (error: any) {
    return { success: false, data: [] };
  }
}

/**
 * Server action to get full meeting details for preview and official documents
 */
export async function getMeetingDetailAction(meetingId: string) {
  try {
    if (!meetingId) {
      return { success: false, error: 'ID Rapat tidak valid' };
    }
    const meeting = await getMeetingByIdFromDb(meetingId);
    if (!meeting) {
      return { success: false, error: 'Rapat tidak ditemukan' };
    }

    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch { }

    const isPrivileged =
      currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

    if (!isPrivileged && currentUser?.biroCode) {
      const userCode = currentUser.biroCode.toUpperCase();
      const isPrimary = meeting.primaryBiro?.code?.toUpperCase() === userCode;
      const isInvolved = meeting.meetingBiros?.some(
        (mb: any) => mb.biro?.code?.toUpperCase() === userCode
      );

      if (!isPrimary && !isInvolved) {
        return {
          success: false,
          error: 'Anda tidak memiliki hak akses untuk melihat rapat dari biro lain.',
        };
      }
    }

    return { success: true, data: meeting };
  } catch (error: any) {
    console.error('Error fetching meeting detail:', error);
    return { success: false, error: error?.message || 'Gagal memuat data rapat' };
  }
}

/**
 * Server action to get active teams under a biro
 */
export async function getBiroTeamsAction(biroCode: string) {
  try {
    const teams = await prisma.biroTeam.findMany({
      where: {
        biro: { code: biroCode.toUpperCase() },
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        biroId: true,
      },
      orderBy: { code: 'asc' },
    });
    return { success: true, data: teams };
  } catch (error: any) {
    console.error(`Error fetching teams for biro ${biroCode}:`, error);
    return { success: false, data: [] };
  }
}

/**
 * Normalizes agenda title for smart grouping:
 * - strips session suffixes like " - Sesi 1", " (Rapat ke-2)", " Rapat Ke 2", "(Lanjutan)", etc.
 * - removes extra punctuation and lowercase
 */
function normalizeAgendaTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\s*[\(\[\-–—]\s*(sesi|rapat|pertemuan|lanjutan|part|bagian)\s*\w*[\)\]]?/gi, '')
    .replace(/\s*-\s*lanjutan\b/gi, '')
    .replace(/\s*rapat\s*ke\s*\d+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Server action to get the full series of related meetings for an agenda.
 * Groups meetings by:
 * 1. Direct follow-up links (previousMeetingId hierarchy chain)
 * 2. Identical or normalized agenda title match
 * Returns all sessions chronologically labeled (Rapat Ke-1, Rapat Ke-2, dst.)
 */
export async function getAgendaSeriesAction(meetingId: string) {
  try {
    if (!meetingId) {
      return { success: false, error: 'ID Rapat tidak valid' };
    }

    // 1. Fetch current target meeting
    const target = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        primaryBiro: true,
        primaryTeam: true,
      },
    });

    if (!target) {
      return { success: false, error: 'Rapat tidak ditemukan' };
    }

    // 2. Fetch all meetings for linkage and title analysis
    const allMeetings = await prisma.meeting.findMany({
      include: {
        primaryBiro: true,
        primaryTeam: true,
        chairperson: true,
        secretary: true,
        minutes: true,
        actionItems: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }, { createdAt: 'asc' }],
    });

    const targetNormalized = normalizeAgendaTitle(target.title);

    // 3. Build undirected graph for previousMeetingId hierarchy
    const adj = new Map<string, Set<string>>();
    for (const m of allMeetings) {
      if (!adj.has(m.id)) adj.set(m.id, new Set());
      if (m.previousMeetingId) {
        if (!adj.has(m.previousMeetingId)) adj.set(m.previousMeetingId, new Set());
        adj.get(m.id)!.add(m.previousMeetingId);
        adj.get(m.previousMeetingId)!.add(m.id);
      }
    }

    // BFS to find all meetings connected in the link graph
    const seriesMeetingIds = new Set<string>();
    const queue = [target.id];
    seriesMeetingIds.add(target.id);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const neighbors = adj.get(curr) || new Set();
      for (const n of neighbors) {
        if (!seriesMeetingIds.has(n)) {
          seriesMeetingIds.add(n);
          queue.push(n);
        }
      }
    }

    // 4. Also find meetings that match identical/normalized agenda title
    for (const m of allMeetings) {
      const mNorm = normalizeAgendaTitle(m.title);
      const isTitleMatch =
        m.title.toLowerCase().trim() === target.title.toLowerCase().trim() ||
        (targetNormalized.length >= 6 &&
          mNorm.length >= 6 &&
          (mNorm === targetNormalized ||
            mNorm.includes(targetNormalized) ||
            targetNormalized.includes(mNorm)));

      if (isTitleMatch) {
        seriesMeetingIds.add(m.id);
        const subQueue = [m.id];
        while (subQueue.length > 0) {
          const c = subQueue.shift()!;
          const neighbors = adj.get(c) || new Set();
          for (const n of neighbors) {
            if (!seriesMeetingIds.has(n)) {
              seriesMeetingIds.add(n);
              subQueue.push(n);
            }
          }
        }
      }
    }

    // 5. Filter and sort matched meetings chronologically
    const seriesMeetings = allMeetings
      .filter((m) => seriesMeetingIds.has(m.id))
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    // 6. Map to rich AgendaSessionItem
    const totalSessions = seriesMeetings.length;
    const sessions = seriesMeetings.map((m, idx) => {
      const totalItems = m.actionItems.length;
      const completed = m.actionItems.filter((a) => a.status === 'COMPLETED').length;
      const inProgress = m.actionItems.filter((a) => a.status === 'IN_PROGRESS').length;
      const pending = m.actionItems.filter((a) => a.status === 'PENDING').length;
      const overdue = m.actionItems.filter(
        (a) => a.status !== 'COMPLETED' && a.dueDate && new Date(a.dueDate).getTime() < Date.now()
      ).length;

      let minutesSummary: string | null = null;
      let conclusionSnippet: string | null = null;
      if (m.minutes) {
        try {
          const rawAgenda = extractPlainText(m.minutes.agenda);
          const rawConclusion = extractPlainText(m.minutes.conclusion);
          conclusionSnippet = rawConclusion ? rawConclusion.replace(/\s+/g, ' ').trim().slice(0, 160) : null;
          minutesSummary = rawAgenda ? rawAgenda.replace(/\s+/g, ' ').trim().slice(0, 160) : null;
        } catch {
          // ignore parsing error
        }
      }

      return {
        id: m.id,
        code: m.meetingNumber,
        title: m.title,
        sessionNumber: idx + 1,
        sessionLabel: `Rapat Ke-${idx + 1}`,
        isCurrent: m.id === meetingId,
        isFirst: idx === 0,
        isLatest: idx === totalSessions - 1,
        date: m.date.toISOString().slice(0, 10),
        rawDate: m.date.toISOString(),
        time: `${m.startTime} - ${m.endTime} WIB`,
        location: m.location,
        status: m.status as any,
        biroCode: m.primaryBiro.code as any,
        biroName: m.primaryBiro.shortName,
        primaryTeamName: m.primaryTeam?.name || null,
        chairpersonName: m.chairperson?.name || null,
        secretaryName: m.secretary?.name || null,
        previousMeetingId: m.previousMeetingId,
        actionItems: {
          total: totalItems,
          completed,
          inProgress,
          pending,
          overdue,
          summaryText:
            totalItems > 0
              ? `${completed}/${totalItems} Tindak Lanjut Selesai`
              : 'Belum ada tindak lanjut',
        },
        minutesSummary,
        conclusionSnippet,
        hasMinutes: !!m.minutes,
      };
    });

    return {
      success: true,
      data: {
        agendaTitle: target.title,
        totalSessions,
        currentMeetingId: meetingId,
        primaryBiroCode: target.primaryBiro.code as any,
        primaryBiroName: target.primaryBiro.shortName,
        sessions,
      },
    };
  } catch (error: any) {
    console.error('Error fetching agenda series:', error);
    return { success: false, error: error?.message || 'Gagal memuat rangkaian rapat' };
  }
}



