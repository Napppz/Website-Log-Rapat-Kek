'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, AuthUser } from '@/lib/auth/authorization';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

function safeRevalidate(paths: string[]) {
  try {
    for (const p of paths) {
      revalidatePath(p);
    }
  } catch {}
}

const createTeamSchema = z.object({
  code: z
    .string()
    .min(2, 'Kode tim minimal 2 karakter')
    .max(10, 'Kode tim maksimal 10 karakter')
    .regex(/^[A-Za-z0-9_-]+$/, 'Kode tim hanya boleh huruf, angka, tanda strip atau garis bawah'),
  name: z.string().min(3, 'Nama tim minimal 3 karakter').max(100, 'Nama tim maksimal 100 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  biroId: z.string().optional(),
});

const updateTeamSchema = z.object({
  id: z.string().min(1, 'ID tim wajib diisi'),
  code: z
    .string()
    .min(2, 'Kode tim minimal 2 karakter')
    .max(10, 'Kode tim maksimal 10 karakter')
    .regex(/^[A-Za-z0-9_-]+$/, 'Kode tim hanya boleh huruf, angka, tanda strip atau garis bawah')
    .optional(),
  name: z.string().min(3, 'Nama tim minimal 3 karakter').max(100, 'Nama tim maksimal 100 karakter').optional(),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
});

/**
 * Get all teams with counts of active members and logged meetings
 */
export async function getTeamsAction(includeInactive = true) {
  try {
    await requireAuth();

    const teams = await prisma.biroTeam.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        biro: { select: { id: true, code: true, shortName: true, name: true } },
        _count: {
          select: {
            users: true,
            userTeams: true,
            primaryMeetings: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
    });

    return {
      success: true,
      data: teams.map((t) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        description: t.description,
        isActive: t.isActive,
        biroId: t.biroId,
        biroCode: t.biro?.code,
        biroName: t.biro?.shortName || t.biro?.name,
        memberCount: Math.max(t._count.users, t._count.userTeams),
        meetingCount: t._count.primaryMeetings,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    };
  } catch (err: any) {
    console.error('Error in getTeamsAction:', err);
    return { success: false, error: err?.message || 'Gagal memuat daftar tim kerja' };
  }
}

/**
 * Super Admin adds a new team
 */
export async function createTeamAction(input: z.infer<typeof createTeamSchema>) {
  try {
    const currentUser = await requireRole(['SUPER_ADMIN']);

    const parsed = createTeamSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data tidak valid' };
    }

    const normalizedCode = parsed.data.code.trim().toUpperCase();
    const normalizedName = parsed.data.name.trim();

    // Check duplicate team code
    const existing = await prisma.biroTeam.findFirst({
      where: { code: normalizedCode },
    });
    if (existing) {
      return { success: false, error: `Kode tim "${normalizedCode}" sudah digunakan oleh tim "${existing.name}".` };
    }

    // Default to Biro 3 (BIRO-IKK)
    let biroId = parsed.data.biroId;
    if (!biroId) {
      const defaultBiro = await prisma.biro.findFirst({
        where: { OR: [{ code: 'IKK' }, { id: 'BIRO-IKK' }] },
      });
      biroId = defaultBiro ? defaultBiro.id : currentUser.biroId;
    }

    const newTeam = await prisma.biroTeam.create({
      data: {
        code: normalizedCode,
        name: normalizedName.startsWith('Tim ') ? normalizedName : `Tim ${normalizedName}`,
        description: parsed.data.description?.trim() || null,
        biroId,
        isActive: true,
      },
    });

    safeRevalidate(['/pengguna', '/catat-kegiatan', '/arsip-kegiatan', '/pengaturan']);

    return {
      success: true,
      data: newTeam,
      message: `Tim baru "${newTeam.name}" (${newTeam.code}) berhasil ditambahkan!`,
    };
  } catch (err: any) {
    console.error('Error in createTeamAction:', err);
    return { success: false, error: err?.message || 'Gagal menambahkan tim baru' };
  }
}

/**
 * Super Admin updates an existing team
 */
export async function updateTeamAction(input: z.infer<typeof updateTeamSchema>) {
  try {
    await requireRole(['SUPER_ADMIN']);

    const parsed = updateTeamSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data tidak valid' };
    }

    const { id, code, name, description } = parsed.data;

    const existing = await prisma.biroTeam.findUnique({
      where: { id },
    });
    if (!existing) {
      return { success: false, error: 'Tim kerja tidak ditemukan.' };
    }

    const updateData: any = {};
    if (code) {
      const normalizedCode = code.trim().toUpperCase();
      if (normalizedCode !== existing.code) {
        const dup = await prisma.biroTeam.findFirst({
          where: { code: normalizedCode, id: { not: id } },
        });
        if (dup) {
          return { success: false, error: `Kode tim "${normalizedCode}" sudah dipakai tim lain.` };
        }
        updateData.code = normalizedCode;
      }
    }

    if (name) {
      const normName = name.trim();
      updateData.name = normName.startsWith('Tim ') ? normName : `Tim ${normName}`;
    }

    if (description !== undefined) {
      updateData.description = description.trim() || null;
    }

    const updated = await prisma.biroTeam.update({
      where: { id },
      data: updateData,
    });

    safeRevalidate(['/pengguna', '/catat-kegiatan', '/arsip-kegiatan', '/pengaturan']);

    return {
      success: true,
      data: updated,
      message: `Data tim "${updated.name}" berhasil diperbarui.`,
    };
  } catch (err: any) {
    console.error('Error in updateTeamAction:', err);
    return { success: false, error: err?.message || 'Gagal memperbarui tim' };
  }
}

/**
 * Super Admin toggles team status (Active / Inactive)
 */
export async function toggleTeamStatusAction(teamId: string, isActive: boolean) {
  try {
    await requireRole(['SUPER_ADMIN']);

    const existing = await prisma.biroTeam.findUnique({
      where: { id: teamId },
    });
    if (!existing) {
      return { success: false, error: 'Tim kerja tidak ditemukan.' };
    }

    const updated = await prisma.biroTeam.update({
      where: { id: teamId },
      data: { isActive },
    });

    safeRevalidate(['/pengguna', '/catat-kegiatan', '/arsip-kegiatan', '/pengaturan']);

    return {
      success: true,
      data: updated,
      message: isActive
        ? `Tim "${updated.name}" berhasil diaktifkan kembali.`
        : `Tim "${updated.name}" dinonaktifkan. Tim tidak akan muncul untuk pencatatan baru.`,
    };
  } catch (err: any) {
    console.error('Error in toggleTeamStatusAction:', err);
    return { success: false, error: err?.message || 'Gagal mengubah status tim' };
  }
}

/**
 * Super Admin or Admin deletes a team permanently
 */
export async function deleteTeamAction(teamId: string) {
  try {
    await requireRole(['SUPER_ADMIN', 'ADMIN']);

    if (!teamId) {
      return { success: false, error: 'ID tim wajib disertakan.' };
    }

    const existing = await prisma.biroTeam.findUnique({
      where: { id: teamId },
      include: {
        _count: {
          select: {
            primaryMeetings: true,
            actionItems: true,
            userTeams: true,
            users: true,
          },
        },
      },
    });

    if (!existing) {
      return { success: false, error: 'Tim kerja tidak ditemukan.' };
    }

    // Safely unbind relationships before deletion to prevent orphan/broken data
    await prisma.$transaction(async (tx) => {
      // 1. Unlink meetings referencing this team
      await tx.meeting.updateMany({
        where: { primaryTeamId: teamId },
        data: { primaryTeamId: null },
      });

      // 2. Unlink action items assigned to this team
      await tx.actionItem.updateMany({
        where: { picTeamId: teamId },
        data: { picTeamId: null },
      });

      // 3. Unlink users whose primary team is this team
      await tx.user.updateMany({
        where: { teamId: teamId },
        data: { teamId: null },
      });

      // 4. Remove all user-team memberships for this team
      await tx.userTeam.deleteMany({
        where: { teamId },
      });

      // 5. Delete the team itself
      await tx.biroTeam.delete({
        where: { id: teamId },
      });
    });

    safeRevalidate(['/pengguna', '/catat-kegiatan', '/arsip-kegiatan', '/pengaturan', '/']);

    return {
      success: true,
      message: `Tim kerja "${existing.name}" (${existing.code}) berhasil dihapus secara permanen.`,
    };
  } catch (err: any) {
    console.error('Error in deleteTeamAction:', err);
    return { success: false, error: err?.message || 'Gagal menghapus tim kerja' };
  }
}

/**
 * Super Admin or Admin assigns staff to multiple teams
 */
export async function assignUserTeamsAction(input: { userId: string; teamIds: string[]; primaryTeamId?: string }) {
  try {
    await requireRole(['SUPER_ADMIN', 'ADMIN']);

    const { userId, teamIds, primaryTeamId: customPrimary } = input;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    const primaryTeamId = (customPrimary && teamIds.includes(customPrimary))
      ? customPrimary
      : (teamIds.length > 0 ? teamIds[0] : null);

    await prisma.$transaction(async (tx) => {
      // 1. Update primary teamId on user
      await tx.user.update({
        where: { id: userId },
        data: { teamId: primaryTeamId },
      });

      // 2. Clear existing userTeam memberships
      await tx.userTeam.deleteMany({
        where: { userId },
      });

      // 3. Re-insert memberships
      if (teamIds.length > 0) {
        await tx.userTeam.createMany({
          data: teamIds.map((tid) => ({
            userId,
            teamId: tid,
            role: 'ANGGOTA',
          })),
          skipDuplicates: true,
        });
      }
    });

    safeRevalidate(['/pengguna', '/catat-kegiatan', '/arsip-kegiatan']);

    return {
      success: true,
      message: `Penugasan ${teamIds.length} tim kerja untuk "${user.name}" berhasil disimpan.`,
    };
  } catch (err: any) {
    console.error('Error in assignUserTeamsAction:', err);
    return { success: false, error: err?.message || 'Gagal menyimpan penugasan tim' };
  }
}

/**
 * Check if the current user (especially ADMIN) is authorized to manage members of the target team
 */
function canAdminManageTeam(currentUser: AuthUser, _targetTeamId: string): boolean {
  return currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
}

/**
 * Super Admin or Admin fetches available Biro staff who are not yet members of the specified team
 */
export async function getBiroStaffForTeamAction(teamId: string) {
  try {
    const currentUser = await requireRole(['SUPER_ADMIN', 'ADMIN']);

    const team = await prisma.biroTeam.findUnique({
      where: { id: teamId },
      include: {
        users: { select: { id: true } },
        userTeams: { select: { userId: true } },
      },
    });

    if (!team) {
      return { success: false, error: 'Tim kerja tidak ditemukan.' };
    }

    if (currentUser.role === 'ADMIN' && !canAdminManageTeam(currentUser, teamId)) {
      return {
        success: false,
        error: 'Anda hanya memiliki izin mengelola anggota pada tim kerja Anda sendiri.',
      };
    }

    const currentMemberIds = new Set<string>();
    for (const u of team.users) currentMemberIds.add(u.id);
    for (const ut of team.userTeams) currentMemberIds.add(ut.userId);

    const biroUsers = await prisma.user.findMany({
      where: {
        biroId: team.biroId,
        role: { not: 'SUPER_ADMIN' },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        teamId: true,
        team: { select: { id: true, code: true, name: true } },
        userTeams: {
          select: {
            team: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    });

    const availableStaff = biroUsers
      .filter((u) => !currentMemberIds.has(u.id))
      .map((u) => {
        const teamSet = new Map<string, string>();
        if (u.team) teamSet.set(u.team.id, u.team.name);
        for (const ut of u.userTeams) {
          if (ut.team) teamSet.set(ut.team.id, ut.team.name);
        }

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          username: u.username,
          role: u.role,
          isActive: u.isActive,
          currentTeams: Array.from(teamSet.values()),
        };
      });

    return {
      success: true,
      data: availableStaff,
      teamName: team.name,
      teamCode: team.code,
    };
  } catch (err: any) {
    console.error('Error in getBiroStaffForTeamAction:', err);
    return { success: false, error: err?.message || 'Gagal memuat daftar staf biro.' };
  }
}

/**
 * Super Admin or Admin adds staff from Biro to a team (multi-team assignment)
 */
export async function addMembersToTeamAction(teamId: string, userIds: string[]) {
  try {
    const currentUser = await requireRole(['SUPER_ADMIN', 'ADMIN']);

    if (!teamId || !Array.isArray(userIds) || userIds.length === 0) {
      return { success: false, error: 'Silakan pilih minimal 1 anggota staf untuk ditambahkan.' };
    }

    const team = await prisma.biroTeam.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return { success: false, error: 'Tim kerja tidak ditemukan.' };
    }

    if (currentUser.role === 'ADMIN' && !canAdminManageTeam(currentUser, teamId)) {
      return {
        success: false,
        error: 'Anda hanya memiliki izin menambah anggota pada tim kerja Anda sendiri.',
      };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create UserTeam pivot records (multi-team assignment)
      await tx.userTeam.createMany({
        data: userIds.map((userId) => ({
          userId,
          teamId,
          role: 'ANGGOTA',
        })),
        skipDuplicates: true,
      });

      // 2. If any user has teamId == null, set this team as primary
      await tx.user.updateMany({
        where: {
          id: { in: userIds },
          teamId: null,
        },
        data: {
          teamId,
        },
      });
    });

    const addedUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    safeRevalidate(['/pengguna', '/catat-kegiatan', '/arsip-kegiatan', '/']);

    return {
      success: true,
      data: addedUsers.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        teamRole: 'ANGGOTA',
        isActive: u.isActive,
      })),
      message: `Berhasil menambahkan ${userIds.length} anggota baru ke ${team.name}!`,
    };
  } catch (err: any) {
    console.error('Error in addMembersToTeamAction:', err);
    return { success: false, error: err?.message || 'Gagal menambahkan anggota ke tim.' };
  }
}

/**
 * Super Admin or Admin removes an anggota from a team
 * (removes membership from team, without deleting user account from the system)
 */
export async function removeMemberFromTeamAction(teamId: string, userId: string) {
  try {
    const currentUser = await requireRole(['SUPER_ADMIN', 'ADMIN']);

    if (!teamId || !userId) {
      return { success: false, error: 'Parameter tidak valid.' };
    }

    const team = await prisma.biroTeam.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return { success: false, error: 'Tim kerja tidak ditemukan.' };
    }

    if (currentUser.role === 'ADMIN' && !canAdminManageTeam(currentUser, teamId)) {
      return {
        success: false,
        error: 'Anda hanya memiliki izin mengelola anggota pada tim kerja Anda sendiri.',
      };
    }

    // Safety: prevent admin from kicking themselves out
    if (currentUser.id === userId && currentUser.role === 'ADMIN') {
      return {
        success: false,
        error: 'Anda tidak dapat mengeluarkan diri Anda sendiri dari tim kerja Anda.',
      };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, teamId: true },
    });

    if (!targetUser) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Remove from userTeam pivot
      await tx.userTeam.deleteMany({
        where: { userId, teamId },
      });

      // 2. If user's primary team was this team, reassign to another team or null
      if (targetUser.teamId === teamId) {
        const remaining = await tx.userTeam.findFirst({
          where: { userId, teamId: { not: teamId } },
          select: { teamId: true },
        });

        await tx.user.update({
          where: { id: userId },
          data: { teamId: remaining ? remaining.teamId : null },
        });
      }
    });

    safeRevalidate(['/pengguna', '/catat-kegiatan', '/arsip-kegiatan', '/']);

    return {
      success: true,
      message: `"${targetUser.name}" berhasil dikeluarkan dari ${team.name}.`,
    };
  } catch (err: any) {
    console.error('Error in removeMemberFromTeamAction:', err);
    return { success: false, error: err?.message || 'Gagal mengeluarkan anggota dari tim.' };
  }
}

