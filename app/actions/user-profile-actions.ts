'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/authorization';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Nama lengkap minimal 2 karakter').max(150),
  email: z.string().trim().email('Format email dinas tidak valid'),
  biroId: z.string().min(1, 'Penugasan biro wajib dipilih'),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function getCurrentUserProfileAction() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser?.id) {
      return { success: false, error: 'Sesi pengguna tidak ditemukan.' };
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        biroId: true,
        isActive: true,
        createdAt: true,
        biro: {
          select: {
            id: true,
            code: true,
            shortName: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: 'Data pengguna tidak ditemukan dalam database.' };
    }

    return { success: true, data: user };
  } catch (error: any) {
    console.error('Error fetching current user profile:', error);
    return { success: false, error: 'Gagal mengambil data profil pengguna.' };
  }
}

export async function updateCurrentUserProfileAction(input: UpdateProfileInput) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser?.id) {
      return { success: false, error: 'Anda harus masuk ke sistem terlebih dahulu.' };
    }

    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: errorMsg };
    }

    const { name, email, biroId, currentPassword, newPassword, confirmPassword } = parsed.data;

    // Check existing user in DB
    const existingUser = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (!existingUser) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    // Check email uniqueness if email changed
    const normalizedEmail = email.toLowerCase();
    if (normalizedEmail !== existingUser.email.toLowerCase()) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (emailConflict && emailConflict.id !== authUser.id) {
        return { success: false, error: 'Alamat email dinas tersebut sudah digunakan oleh akun lain.' };
      }
    }

    // Verify Biro exists
    const biro = await prisma.biro.findUnique({
      where: { id: biroId },
    });
    if (!biro) {
      return { success: false, error: 'Biro penugasan tidak valid.' };
    }

    // Handle password change if requested
    let updatedPasswordHash: string | undefined = undefined;
    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword) {
        return { success: false, error: 'Masukkan kata sandi saat ini untuk memverifikasi perubahan password.' };
      }

      if (newPassword.length < 6) {
        return { success: false, error: 'Kata sandi baru minimal 6 karakter.' };
      }

      if (newPassword !== confirmPassword) {
        return { success: false, error: 'Konfirmasi kata sandi baru tidak sesuai.' };
      }

      // Check current password
      if (existingUser.password) {
        const isMatch = await bcrypt.compare(currentPassword, existingUser.password);
        if (!isMatch) {
          return { success: false, error: 'Kata sandi saat ini yang Anda masukkan salah.' };
        }
      }

      updatedPasswordHash = await bcrypt.hash(newPassword, 10);
    }

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        name,
        email: normalizedEmail,
        biroId,
        ...(updatedPasswordHash ? { password: updatedPasswordHash } : {}),
      },
      include: {
        biro: true,
      },
    });

    try {
      revalidatePath('/pengaturan');
      revalidatePath('/pengguna');
      revalidatePath('/');
    } catch {
      // Ignore static cache error during tests
    }

    return {
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        biroId: updatedUser.biroId,
        biro: {
          code: updatedUser.biro.code,
          shortName: updatedUser.biro.shortName,
          name: updatedUser.biro.name,
        },
      },
    };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan server saat memperbarui profil pengguna.',
    };
  }
}
