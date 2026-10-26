'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { requireRole, getCurrentUser } from '@/lib/auth/authorization';
import { getNextUserId } from '@/lib/id-generator';
import {
  createUserSchema,
  updateUserSchema,
  CreateUserInput,
  UpdateUserInput,
  formatUserFullName,
} from '@/lib/validations/user';

function safeRevalidate(paths: string[]) {
  try {
    for (const p of paths) {
      revalidatePath(p);
    }
  } catch {
    // Ignore outside Next.js request context
  }
}

/**
 * Server Action: Get all users with Biro information (SUPER_ADMIN or ADMIN)
 * ADMIN is strictly scoped to users in their own team/biro, excluding SUPER_ADMIN.
 */
export async function getUsersAction() {
  try {
    const currentUser = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const isGlobalAdmin = currentUser.role === 'SUPER_ADMIN';

    const whereCondition: any = {};
    if (!isGlobalAdmin) {
      whereCondition.biroId = currentUser.biroId;
      if (currentUser.teamId) {
        whereCondition.teamId = currentUser.teamId;
      }
      whereCondition.role = { not: 'SUPER_ADMIN' };
    }

    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        biroId: true,
        teamId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        biro: {
          select: {
            id: true,
            code: true,
            name: true,
            shortName: true,
          },
        },
        team: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        userTeams: {
          select: {
            team: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { role: 'asc' }, { name: 'asc' }],
    });

    return { success: true, data: users };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { success: false, error: error?.message || 'Gagal memuat data pengguna.' };
  }
}

/**
 * Server Action: Create User with hashed password (SUPER_ADMIN or ADMIN)
 * ADMIN can only create users in their own team/biro with role STAFF or ADMIN.
 */
export async function createUserAction(input: CreateUserInput) {
  try {
    const currentUser = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const isGlobalAdmin = currentUser.role === 'SUPER_ADMIN';

    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: `Validasi gagal: ${errorMsg}` };
    }

    let { name, username, email, password, role, teamId, isActive } = parsed.data;

    // Format name with role suffix automatically (e.g. "Kevin (Staff)")
    name = formatUserFullName(name, role);

    // RBAC & Team Scoping restrictions for ADMIN
    if (!isGlobalAdmin) {
      if (role === 'SUPER_ADMIN' || role === 'PIMPINAN') {
        return {
          success: false,
          error: 'Administrator Tim hanya memiliki izin menambahkan anggota berposisi Staf atau Administrator.',
        };
      }
      // Force assignment to admin's team
      if (currentUser.teamId) {
        teamId = currentUser.teamId;
      }
    }

    // Check unique email
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return { success: false, error: 'Email tersebut sudah terdaftar di sistem.' };
    }

    // Resolve username
    let finalUsername = username ? username.trim().toLowerCase() : email.split('@')[0].trim().toLowerCase();
    const existingUsername = await prisma.user.findUnique({
      where: { username: finalUsername },
    });
    if (existingUsername) {
      if (username) {
        return { success: false, error: 'Username tersebut sudah terdaftar di sistem. Silakan pilih username lain.' };
      }
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: `${finalUsername}${counter}` } })) {
        counter++;
      }
      finalUsername = `${finalUsername}${counter}`;
    }

    // Resolve biroId: if ADMIN, force to currentUser.biroId
    let biroId = isGlobalAdmin ? (parsed.data.biroId || 'BIRO-IKK') : currentUser.biroId;
    if (isGlobalAdmin && teamId) {
      const team = await prisma.biroTeam.findUnique({ where: { id: teamId } });
      if (team) {
        biroId = team.biroId;
      }
    }

    // Check biro exists
    const biro = await prisma.biro.findUnique({
      where: { id: biroId },
    });
    if (!biro) {
      return { success: false, error: 'Biro penempatan tidak ditemukan.' };
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const effectiveTeamIds = parsed.data.teamIds || (teamId ? [teamId] : []);
    const primaryTeamId = (teamId && effectiveTeamIds.includes(teamId))
      ? teamId
      : (effectiveTeamIds.length > 0 ? effectiveTeamIds[0] : (teamId || null));

    const nextUserId = await getNextUserId();
    const newUser = await prisma.user.create({
      data: {
        id: nextUserId,
        name,
        username: finalUsername,
        email,
        password: hashedPassword,
        role,
        biroId,
        teamId: primaryTeamId,
        isActive,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        biroId: true,
        teamId: true,
        isActive: true,
        createdAt: true,
        biro: true,
        team: true,
      },
    });

    // Populate UserTeam relations if teamIds provided
    if (effectiveTeamIds.length > 0) {
      await prisma.userTeam.createMany({
        data: effectiveTeamIds.map((tid) => ({
          userId: nextUserId,
          teamId: tid,
          role: 'ANGGOTA',
        })),
        skipDuplicates: true,
      });
    }

    const createdUserWithTeams = await prisma.user.findUnique({
      where: { id: nextUserId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        biroId: true,
        teamId: true,
        isActive: true,
        createdAt: true,
        biro: true,
        team: true,
        userTeams: {
          select: {
            team: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    safeRevalidate(['/pengguna']);

    return { success: true, data: createdUserWithTeams || newUser };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { success: false, error: error?.message || 'Gagal membuat pengguna baru.' };
  }
}

/**
 * Server Action: Update User (SUPER_ADMIN or ADMIN)
 * ADMIN can only update members in their team/biro and cannot touch SUPER_ADMIN.
 */
export async function updateUserAction(input: UpdateUserInput) {
  try {
    const currentUser = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const isGlobalAdmin = currentUser.role === 'SUPER_ADMIN';

    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: `Validasi gagal: ${errorMsg}` };
    }

    let { id, name, username, email, password, role, teamId, isActive } = parsed.data;

    // Format name with role suffix automatically (e.g. "Kevin (Staff)")
    name = formatUserFullName(name, role);

    const existing = await prisma.user.findUnique({
      where: { id },
    });
    if (!existing) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    // RBAC & Team Scoping restrictions for ADMIN
    if (!isGlobalAdmin) {
      if (existing.role === 'SUPER_ADMIN') {
        return { success: false, error: 'Anda tidak memiliki hak akses untuk mengubah akun Super Administrator.' };
      }
      if (role === 'SUPER_ADMIN' || role === 'PIMPINAN') {
        return {
          success: false,
          error: 'Administrator Tim tidak diizinkan menaikkan peran ke Super Administrator atau Pimpinan.',
        };
      }
      if (existing.biroId !== currentUser.biroId) {
        return { success: false, error: 'Anda tidak memiliki izin mengubah data pengguna dari biro lain.' };
      }
      if (currentUser.teamId && existing.teamId !== currentUser.teamId) {
        return { success: false, error: 'Anda tidak memiliki izin mengubah data anggota di luar tim kerja Anda.' };
      }
      if (currentUser.teamId) {
        teamId = currentUser.teamId;
      }
    }

    // Check email uniqueness if email changed
    if (email !== existing.email) {
      const duplicate = await prisma.user.findUnique({
        where: { email },
      });
      if (duplicate) {
        return { success: false, error: 'Email tersebut sudah digunakan oleh pengguna lain.' };
      }
    }

    // Check username uniqueness if username provided
    if (username !== undefined) {
      const normalizedUsername = username ? username.trim().toLowerCase() : null;
      if (normalizedUsername && normalizedUsername !== existing.username?.toLowerCase()) {
        const duplicateUsername = await prisma.user.findUnique({
          where: { username: normalizedUsername },
        });
        if (duplicateUsername && duplicateUsername.id !== id) {
          return { success: false, error: 'Username tersebut sudah digunakan oleh pengguna lain.' };
        }
      }
    }

    let biroId = isGlobalAdmin
      ? (parsed.data.biroId || existing.biroId || 'BIRO-IKK')
      : currentUser.biroId;

    if (isGlobalAdmin && teamId && teamId !== existing.teamId) {
      const team = await prisma.biroTeam.findUnique({ where: { id: teamId }, select: { biroId: true } });
      if (team) {
        biroId = team.biroId;
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role,
      biroId,
      teamId: teamId !== undefined ? teamId : existing.teamId,
      isActive,
    };

    if (username !== undefined) {
      updateData.username = username ? username.trim().toLowerCase() : null;
    }

    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const selectUserWithTeams = {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      biroId: true,
      teamId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      biro: true,
      team: true,
      userTeams: {
        select: {
          team: {
            select: {
              id: true,
              code: true,
              name: true,
              isActive: true,
            },
          },
        },
      },
    };

    let updated: any;

    if (parsed.data.teamIds !== undefined) {
      const effectiveTeamIds = parsed.data.teamIds;
      updateData.teamId = (teamId && effectiveTeamIds.includes(teamId))
        ? teamId
        : (effectiveTeamIds.length > 0 ? effectiveTeamIds[0] : null);

      const ops: any[] = [
        prisma.userTeam.deleteMany({
          where: { userId: id },
        }),
      ];

      if (effectiveTeamIds.length > 0) {
        ops.push(
          prisma.userTeam.createMany({
            data: effectiveTeamIds.map((tid) => ({
              userId: id,
              teamId: tid,
              role: 'ANGGOTA',
            })),
            skipDuplicates: true,
          })
        );
      }

      ops.push(
        prisma.user.update({
          where: { id },
          data: updateData,
          select: selectUserWithTeams,
        })
      );

      const results = await prisma.$transaction(ops);
      updated = results[results.length - 1];
    } else {
      updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: selectUserWithTeams,
      });
    }

    safeRevalidate(['/pengguna']);

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { success: false, error: error?.message || 'Gagal memperbarui pengguna.' };
  }
}

/**
 * Server Action: Toggle user active status (SUPER_ADMIN or ADMIN)
 */
export async function toggleUserStatusAction(userId: string) {
  try {
    const currentUser = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const isGlobalAdmin = currentUser.role === 'SUPER_ADMIN';

    if (currentUser.id === userId) {
      return { success: false, error: 'Anda tidak dapat menonaktifkan akun Anda sendiri.' };
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existing) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    // Security check for ADMIN
    if (!isGlobalAdmin) {
      if (existing.role === 'SUPER_ADMIN') {
        return { success: false, error: 'Anda tidak memiliki hak akses mengubah status akun Super Administrator.' };
      }
      if (existing.biroId !== currentUser.biroId) {
        return { success: false, error: 'Anda tidak memiliki izin mengubah status pengguna dari biro lain.' };
      }
      if (currentUser.teamId && existing.teamId !== currentUser.teamId) {
        return { success: false, error: 'Anda tidak memiliki izin mengubah status anggota tim lain.' };
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: !existing.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    safeRevalidate(['/pengguna']);

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return { success: false, error: error?.message || 'Gagal mengubah status pengguna.' };
  }
}

/**
 * Server Action: Delete User (SUPER_ADMIN or ADMIN)
 */
export async function deleteUserAction(userId: string) {
  try {
    const currentUser = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const isGlobalAdmin = currentUser.role === 'SUPER_ADMIN';

    if (!userId) {
      return { success: false, error: 'ID pengguna tidak valid.' };
    }

    if (currentUser.id === userId) {
      return { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.' };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, biroId: true, teamId: true },
    });

    if (!targetUser) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    // Security check for ADMIN
    if (!isGlobalAdmin) {
      if (targetUser.role === 'SUPER_ADMIN') {
        return { success: false, error: 'Anda tidak memiliki izin menghapus akun Super Administrator.' };
      }
      if (targetUser.biroId !== currentUser.biroId) {
        return { success: false, error: 'Anda tidak memiliki izin menghapus pengguna dari biro lain.' };
      }
      if (currentUser.teamId && targetUser.teamId !== currentUser.teamId) {
        return { success: false, error: 'Anda tidak memiliki izin menghapus anggota tim lain.' };
      }
    }

    // Safely dissociate references in an atomic transaction before deletion
    await prisma.$transaction(async (tx) => {
      // 1. Unlink chairperson in meetings
      await tx.meeting.updateMany({
        where: { chairpersonId: userId },
        data: { chairpersonId: null },
      });

      // 2. Unlink secretary in meetings
      await tx.meeting.updateMany({
        where: { secretaryId: userId },
        data: { secretaryId: null },
      });

      // 3. Unlink action item PIC
      await tx.actionItem.updateMany({
        where: { picUserId: userId },
        data: { picUserId: null },
      });

      // 4. Remove meeting participation records
      await tx.meetingParticipant.deleteMany({
        where: { userId },
      });

      // 5. Delete user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    safeRevalidate(['/pengguna', '/rapat', '/tindak-lanjut', '/laporan']);

    return {
      success: true,
      message: `Pengguna "${targetUser.name}" berhasil dihapus secara permanen.`,
    };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, error: error?.message || 'Gagal menghapus pengguna.' };
  }
}

