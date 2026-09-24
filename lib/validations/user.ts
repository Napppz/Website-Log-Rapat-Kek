import { z } from 'zod';

export const userRoleEnum = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'NOTULIS',
  'STAFF',
  'VIEWER',
]);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Nama lengkap wajib diisi'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: userRoleEnum.default('STAFF'),
  biroId: z.string().min(1, 'Biro penempatan wajib dipilih'),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  id: z.string().min(1, 'ID pengguna wajib disertakan'),
  name: z.string().trim().min(1, 'Nama lengkap wajib diisi'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  role: userRoleEnum,
  biroId: z.string().min(1, 'Biro penempatan wajib dipilih'),
  isActive: z.boolean().default(true),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
