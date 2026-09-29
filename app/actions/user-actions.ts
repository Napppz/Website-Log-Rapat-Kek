'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { requireRole, getCurrentUser } from '@/lib/auth/authorization';
import {
  createUserSchema,
  updateUserSchema,
  CreateUserInput,
  UpdateUserInput,
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
 * Server Action: Get all users with Biro information (SUPER_ADMIN only)
 */
export async function getUsersAction() {
  try {
    await requireRole('SUPER_ADMIN');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        biroId: true,
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
 * Server Action: Create User with hashed password (SUPER_ADMIN only)
 */
export async function createUserAction(input: CreateUserInput) {
  try {
    await requireRole('SUPER_ADMIN');

    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: `Validasi gagal: ${errorMsg}` };
    }

    const { name, email, password, role, biroId, isActive } = parsed.data;

    // Check unique email
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return { success: false, error: 'Email tersebut sudah terdaftar di sistem.' };
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

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        biroId,
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        biroId: true,
        isActive: true,
        createdAt: true,
        biro: true,
      },
    });

    safeRevalidate(['/pengguna']);

    return { success: true, data: newUser };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { success: false, error: error?.message || 'Gagal membuat pengguna baru.' };
  }
}

/**
 * Server Action: Update User (SUPER_ADMIN only)
 */
export async function updateUserAction(input: UpdateUserInput) {
  try {
    await requireRole('SUPER_ADMIN');

    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: `Validasi gagal: ${errorMsg}` };
    }

    const { id, name, email, password, role, biroId, isActive } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { id },
    });
    if (!existing) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
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

    // Ensure biro exists
    const biro = await prisma.biro.findUnique({
      where: { id: biroId },
    });
    if (!biro) {
      return { success: false, error: 'Biro penempatan tidak ditemukan.' };
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role,
      biroId,
      isActive,
    };

    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        biroId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        biro: true,
      },
    });

    safeRevalidate(['/pengguna']);

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { success: false, error: error?.message || 'Gagal memperbarui pengguna.' };
  }
}

/**
 * Server Action: Toggle user active status (SUPER_ADMIN only)
 */
export async function toggleUserStatusAction(userId: string) {
  try {
    const currentUser = await requireRole('SUPER_ADMIN');

    if (currentUser.id === userId) {
      return { success: false, error: 'Anda tidak dapat menonaktifkan akun Anda sendiri.' };
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existing) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
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
 * Server Action: Delete User (SUPER_ADMIN only)
 */
export async function deleteUserAction(userId: string) {
  try {
    const currentUser = await requireRole('SUPER_ADMIN');

    if (!userId) {
      return { success: false, error: 'ID pengguna tidak valid.' };
    }

    if (currentUser.id === userId) {
      return { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.' };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
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

      // 5. Remove auth sessions and accounts
      await tx.session.deleteMany({
        where: { userId },
      });
      await tx.account.deleteMany({
        where: { userId },
      });

      // 6. Delete user
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

