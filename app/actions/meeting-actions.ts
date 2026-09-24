'use server';

import { prisma } from '@/lib/prisma';
import { getNextMeetingNumber } from '@/lib/sequence';
import { MeetingStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requirePermission, requireAuth } from '@/lib/auth/authorization';

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
}

function safeRevalidate(paths: string[]) {
  try {
    for (const p of paths) {
      revalidatePath(p);
    }
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
    await requirePermission('create:meeting');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate sequence atomically
      const seq = await getNextMeetingNumber(input.biroCode, tx);

      // 2. Find primary biro
      const primaryBiro = await tx.biro.findUnique({
        where: { code: input.biroCode.toUpperCase() },
      });

      if (!primaryBiro) {
        throw new Error(`Biro ${input.biroCode} tidak ditemukan.`);
      }

      // 3. Create meeting record
      const meeting = await tx.meeting.create({
        data: {
          meetingNumber: seq.meetingNumber,
          title: input.title,
          primaryBiroId: primaryBiro.id,
          date: new Date(input.date),
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location,
          status: MeetingStatus.DRAFT,
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
            const lower = name.toLowerCase();
            const matched = allUsers.find(
              (u) =>
                u.name.toLowerCase() === lower ||
                u.email.toLowerCase() === lower ||
                u.name.toLowerCase().includes(lower) ||
                lower.includes(u.name.toLowerCase())
            );

            if (matched) {
              targetUserIds.add(matched.id);
            } else {
              // Create guest participant user record so they exist in User table
              const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '.')
                .replace(/\.+/g, '.')
                .slice(0, 25);
              const uniqueEmail = `${slug || 'peserta'}.${Date.now().toString(36)}.${Math.random().toString(36).substring(2, 6)}@peserta.kek.go.id`;

              const guest = await tx.user.create({
                data: {
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

      // Create MeetingParticipant records
      for (const uid of targetUserIds) {
        await tx.meetingParticipant.create({
          data: {
            meetingId: meeting.id,
            userId: uid,
            attendanceStatus: 'INVITED',
          },
        });
      }

      return {
        meetingNumber: seq.meetingNumber,
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
    // Authorization Check: Must have 'edit:meeting' permission (SUPER_ADMIN, ADMIN)
    await requirePermission('edit:meeting');

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
 * Server action to delete meeting (Cascades to minutes, action items, participants)
 */
export async function deleteMeetingAction(meetingId: string) {
  try {
    // Authorization Check: Must have 'delete:meeting' permission (SUPER_ADMIN, ADMIN)
    await requirePermission('delete:meeting');

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { primaryBiro: true },
    });

    if (!meeting) {
      throw new Error('Rapat tidak ditemukan.');
    }

    await prisma.meeting.delete({
      where: { id: meetingId },
    });

    safeRevalidate([
      '/',
      '/semua-rapat',
      `/biro/${meeting.primaryBiro.code.toLowerCase()}`,
    ]);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting meeting:', error);
    return { success: false, error: error?.message || 'Gagal menghapus rapat' };
  }
}
